import { Inject, Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "../../database/auth-schema";
import * as appSchema from "../../database/schema";
import { sources } from "../../database/schema";
import { BadRequestError, NotFoundError } from "../../common/errors/domain-error";
import { IndexingService } from "../ai/indexing.service";
import { DRIZZLE } from "../database/database.module";
import { NotebooksService } from "../notebooks/notebooks.service";
import { StorageService } from "../storage/storage.service";
import { SourceExtractionService } from "./source-extraction.service";
import { WebScraperService } from "./web-scraper.service";

export type SourceKind = "text" | "url" | "file";

export interface CreateTextSourceInput {
  title: string;
  rawText: string;
}

export interface CreateUrlSourceInput {
  url: string;
  title?: string;
}

export interface DownloadInfo {
  url: string;
  expiresIn: number;
}

const MAX_RAW_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

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

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly notebooksService: NotebooksService,
    private readonly storageService: StorageService,
    private readonly indexingService: IndexingService,
    private readonly sourceExtractionService: SourceExtractionService,
    private readonly webScraperService: WebScraperService,
  ) {}

  async list(userId: string, notebookId: string) {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    return this.db
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
    return this.fetchOwned(userId, id);
  }

  async createText(
    userId: string,
    notebookId: string,
    input: CreateTextSourceInput,
  ) {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    const title = input.title.trim();
    const rawText = input.rawText;
    if (rawText.trim().length === 0) {
      throw new BadRequestError("rawText must be non-empty");
    }
    if (Buffer.byteLength(rawText, "utf8") > MAX_RAW_TEXT_BYTES) {
      throw new BadRequestError(
        `rawText exceeds maximum size of ${MAX_RAW_TEXT_BYTES} bytes`,
      );
    }
    const [row] = await this.db
      .insert(sources)
      .values({
        notebookId,
        kind: "text",
        title: title.slice(0, 500),
        rawText,
      })
      .returning();

    this.indexingService.indexSource(row.id, userId).catch((err) => {
      this.logger.error("Failed to index source after text creation", {
        sourceId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
    return row;
  }

  async createUrl(
    userId: string,
    notebookId: string,
    input: CreateUrlSourceInput,
  ) {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    const scraped = await this.webScraperService.scrapeUrl(input.url);
    const title = (input.title?.trim() || scraped.title).slice(0, 500);
    const [row] = await this.db
      .insert(sources)
      .values({
        notebookId,
        kind: "url",
        title,
        rawText: scraped.text,
        url: input.url,
      })
      .returning();

    this.indexingService.indexSource(row.id, userId).catch((err) => {
      this.logger.error("Failed to index source after URL creation", {
        sourceId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
    return row;
  }

  async createFile(
    userId: string,
    notebookId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    customTitle?: string,
  ) {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    if (fileBuffer.length === 0) {
      throw new BadRequestError("Uploaded file is empty");
    }
    if (fileBuffer.length > MAX_FILE_BYTES) {
      throw new BadRequestError(
        `File exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
      );
    }
    if (!this.sourceExtractionService.isSupportedFile(fileType, fileName)) {
      throw new BadRequestError(
        `Unsupported file type: ${fileType || "unknown"} (${fileName})`,
      );
    }

    const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
    const s3Key = buildS3Key(notebookId, sha256, fileName);

    await this.storageService.putObject({
      key: s3Key,
      body: fileBuffer,
      contentType: fileType || "application/octet-stream",
    });

    let extracted: { text: string };
    try {
      extracted = await this.sourceExtractionService.extractText(fileBuffer, fileType, fileName);
    } catch (err) {
      await this.storageService.deleteObject(s3Key).catch(() => {});
      throw err;
    }

    const title = (customTitle?.trim() || fileName).slice(0, 500);

    const [row] = await this.db
      .insert(sources)
      .values({
        notebookId,
        kind: "file",
        title,
        rawText: extracted.text,
        s3Key,
        contentType: fileType || null,
        fileSize: fileBuffer.length,
        sha256,
      })
      .returning();

    this.indexingService.indexSource(row.id, userId).catch((err) => {
      this.logger.error("Failed to index source after file creation", {
        sourceId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
    return row;
  }

  async delete(userId: string, id: string) {
    const source = await this.fetchOwned(userId, id);
    if (source.kind === "file" && source.s3Key) {
      await this.storageService.deleteObject(source.s3Key).catch(() => {});
    }
    await this.indexingService.deleteSourceChunks(id).catch(() => {});
    const [deleted] = await this.db
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
    const url = await this.storageService.presignDownload(
      source.s3Key,
      expiresInSeconds,
      source.title,
    );
    return { url, expiresIn: expiresInSeconds };
  }

  private async fetchOwned(userId: string, id: string) {
    const [source] = await this.db.select().from(sources).where(eq(sources.id, id));
    if (!source) {
      throw new NotFoundError("Source");
    }
    await this.notebooksService.assertNotebookOwner(userId, source.notebookId);
    return source;
  }
}
