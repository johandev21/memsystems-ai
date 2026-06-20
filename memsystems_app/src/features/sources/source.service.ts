import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebooks, sources } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  deleteObject,
  presignDownload,
  putObject,
} from "@/lib/storage/s3-client";
import { extractText, isSupportedFile } from "./source-extraction.service";
import { scrapeUrl } from "./web-scraper.service";

export type SourceKind = "text" | "url" | "file";

export interface CreateTextSourceInput {
  title: string;
  rawText: string;
}

export interface CreateUrlSourceInput {
  url: string;
  title?: string;
}

export interface CreateFileSourceInput {
  file: File;
  title?: string;
}

export interface DownloadInfo {
  url: string;
  expiresIn: number;
}

const MAX_RAW_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export class SourceService {
  async list(userId: string, notebookId: string) {
    await this.assertNotebookOwner(userId, notebookId);
    return db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        kind: sources.kind,
        title: sources.title,
        url: sources.url,
        contentType: sources.contentType,
        fileSize: sources.fileSize,
        createdAt: sources.createdAt,
      })
      .from(sources)
      .where(eq(sources.notebookId, notebookId))
      .orderBy(desc(sources.createdAt));
  }

  async get(userId: string, id: string) {
    const source = await this.fetchOwned(userId, id);
    return source;
  }

  async createText(
    userId: string,
    notebookId: string,
    input: CreateTextSourceInput,
  ) {
    await this.assertNotebookOwner(userId, notebookId);
    const title = input.title.trim();
    const rawText = input.rawText;
    if (rawText.length === 0) {
      throw new NotFoundError("rawText (must be non-empty)");
    }
    if (Buffer.byteLength(rawText, "utf8") > MAX_RAW_TEXT_BYTES) {
      throw new BadRequestError(
        `rawText exceeds maximum size of ${MAX_RAW_TEXT_BYTES} bytes`,
      );
    }
    const [row] = await db
      .insert(sources)
      .values({
        notebookId,
        kind: "text",
        title: title.slice(0, 500),
        rawText,
      })
      .returning();
    return row;
  }

  async createUrl(
    userId: string,
    notebookId: string,
    input: CreateUrlSourceInput,
  ) {
    await this.assertNotebookOwner(userId, notebookId);
    const scraped = await scrapeUrl(input.url);
    const title = (input.title?.trim() || scraped.title).slice(0, 500);
    const [row] = await db
      .insert(sources)
      .values({
        notebookId,
        kind: "url",
        title,
        rawText: scraped.text,
        url: input.url,
      })
      .returning();
    return row;
  }

  async createFile(
    userId: string,
    notebookId: string,
    input: CreateFileSourceInput,
  ) {
    await this.assertNotebookOwner(userId, notebookId);
    const { file } = input;
    if (file.size === 0) {
      throw new BadRequestError("Uploaded file is empty");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestError(
        `File exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
      );
    }
    if (!isSupportedFile(file.type, file.name)) {
      throw new BadRequestError(
        `Unsupported file type: ${file.type || "unknown"} (${file.name})`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    const s3Key = buildS3Key(notebookId, sha256, file.name);

    await putObject({
      key: s3Key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    let extracted: { text: string };
    try {
      extracted = await extractText(buffer, file.type, file.name);
    } catch (err) {
      await deleteObject(s3Key).catch(() => {});
      throw err;
    }

    const title = (input.title?.trim() || file.name).slice(0, 500);

    const [row] = await db
      .insert(sources)
      .values({
        notebookId,
        kind: "file",
        title,
        rawText: extracted.text,
        s3Key,
        contentType: file.type || null,
        fileSize: file.size,
        sha256,
      })
      .returning();
    return row;
  }

  async delete(userId: string, id: string) {
    const source = await this.fetchOwned(userId, id);
    if (source.kind === "file" && source.s3Key) {
      await deleteObject(source.s3Key).catch(() => {});
    }
    const [deleted] = await db
      .delete(sources)
      .where(eq(sources.id, id))
      .returning();
    return deleted;
  }

  async getDownload(
    userId: string,
    id: string,
    expiresInSeconds = 300,
  ): Promise<DownloadInfo> {
    const source = await this.fetchOwned(userId, id);
    if (source.kind !== "file" || !source.s3Key) {
      throw new BadRequestError("Source has no downloadable file");
    }
    const url = await presignDownload(
      source.s3Key,
      expiresInSeconds,
      source.title,
    );
    return { url, expiresIn: expiresInSeconds };
  }

  private async assertNotebookOwner(userId: string, notebookId: string) {
    const [notebook] = await db
      .select({ id: notebooks.id, userId: notebooks.userId })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));
    if (!notebook) {
      throw new NotFoundError("Notebook");
    }
    if (notebook.userId !== userId) {
      throw new ForbiddenError("Notebook does not belong to user");
    }
  }

  private async fetchOwned(userId: string, id: string) {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    if (!source) {
      throw new NotFoundError("Source");
    }
    await this.assertNotebookOwner(userId, source.notebookId);
    return source;
  }
}

function buildS3Key(
  _notebookId: string,
  sha256: string,
  originalName: string,
): string {
  const ext = pickExtension(originalName);
  return `sources/${sha256}${ext}`;
}

function pickExtension(originalName: string): string {
  const idx = originalName.lastIndexOf(".");
  if (idx === -1 || idx === originalName.length - 1) return "";
  return originalName.slice(idx).toLowerCase();
}
