import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

export interface UploadInput {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
}

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;
  private s3Bucket: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>("S3_ENDPOINT");
    if (endpoint) {
      this.s3Bucket = this.configService.get<string>("S3_BUCKET") || "";
      this.s3Client = new S3Client({
        endpoint,
        region: this.configService.get<string>("S3_REGION") || "us-east-1",
        credentials: {
          accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID") || "",
          secretAccessKey: this.configService.get<string>("S3_SECRET_ACCESS_KEY") || "",
        },
        forcePathStyle: this.configService.get<string>("S3_FORCE_PATH_STYLE") === "true",
      });
    }
  }

  public isLocalStorage(): boolean {
    return !this.s3Client;
  }

  private getLocalStorageRoot(): string {
    const configured = this.configService.get<string>("DEV_STORAGE_DIR") || resolve(process.cwd(), "dev-storage");
    return resolve(configured);
  }

  private safeJoin(key: string): string {
    const root = this.getLocalStorageRoot();
    const resolved = resolve(root, key);
    const rootWithSep = root.endsWith(sep) ? root : root + sep;
    if (resolved !== root && !resolved.startsWith(rootWithSep)) {
      throw new Error(`Path traversal blocked for key: ${key}`);
    }
    return resolved;
  }

  async putObject(input: UploadInput): Promise<void> {
    if (this.isLocalStorage()) {
      const path = this.safeJoin(input.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, input.body);
      return;
    }
    await this.s3Client!.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket!,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    if (this.isLocalStorage()) {
      const path = this.safeJoin(key);
      await rm(path, { force: true });
      return;
    }
    await this.s3Client!.send(new DeleteObjectCommand({ Bucket: this.s3Bucket!, Key: key }));
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    if (this.isLocalStorage()) {
      const path = this.safeJoin(key);
      return readFile(path);
    }
    const response = await this.s3Client!.send(
      new GetObjectCommand({ Bucket: this.s3Bucket!, Key: key }),
    );
    if (!response.Body) throw new Error(`S3 object not found: ${key}`);
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async presignDownload(
    key: string,
    expiresInSeconds = 300,
    downloadFilename?: string,
  ): Promise<string> {
    if (this.isLocalStorage()) {
      const secret = this.configService.get<string>("DEV_STORAGE_TOKEN_SECRET") || "dev_secret";
      const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const payload = `${key}:${expires}`;
      const signature = createHmac("sha256", secret)
        .update(payload)
        .digest("hex")
        .slice(0, 32);
      const params = new URLSearchParams({
        expires: String(expires),
        sig: signature,
      });
      if (downloadFilename) {
        params.set("filename", downloadFilename);
      }
      const base = this.configService.get<string>("DEV_STORAGE_PUBLIC_URL") || "http://localhost:4000";
      return `${base}/api/dev-storage/${encodeURIComponent(key)}?${params.toString()}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.s3Bucket!,
      Key: key,
      ...(downloadFilename
        ? {
            ResponseContentDisposition: `attachment; filename="${downloadFilename.replace(/"/g, "")}"`,
          }
        : {}),
    });
    return getSignedUrl(this.s3Client!, command, { expiresIn: expiresInSeconds });
  }

  verifyLocalToken(
    key: string,
    expiresStr: string | null,
    sig: string | null,
  ): { ok: boolean; reason?: "missing" | "expired" | "bad_sig" } {
    if (!expiresStr || !sig) return { ok: false, reason: "missing" };
    const expires = Number(expiresStr);
    if (!Number.isFinite(expires)) return { ok: false, reason: "missing" };
    if (Math.floor(Date.now() / 1000) > expires) {
      return { ok: false, reason: "expired" };
    }
    const secret = this.configService.get<string>("DEV_STORAGE_TOKEN_SECRET") || "dev_secret";
    const expected = createHmac("sha256", secret)
      .update(`${key}:${expires}`)
      .digest("hex")
      .slice(0, 32);
    if (sig.length !== expected.length) return { ok: false, reason: "bad_sig" };
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return { ok: false, reason: "bad_sig" };
    if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad_sig" };
    return { ok: true };
  }

  contentTypeForKey(key: string): string {
    const ext = key.toLowerCase().split(".").pop() ?? "";
    switch (ext) {
      case "pdf":
        return "application/pdf";
      case "md":
      case "markdown":
        return "text/markdown";
      case "txt":
        return "text/plain";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  }
}
