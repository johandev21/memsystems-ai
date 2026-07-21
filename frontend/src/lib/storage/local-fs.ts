import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const DEFAULT_ROOT = resolve(process.cwd(), "dev-storage");
const rawTokenSecret = process.env.DEV_STORAGE_TOKEN_SECRET;
if (!rawTokenSecret) {
  throw new Error("DEV_STORAGE_TOKEN_SECRET environment variable is required");
}
const TOKEN_SECRET: string = rawTokenSecret;
const DEFAULT_EXPIRES_SECONDS = 300;

let cachedRoot: string | null = null;

function getRoot(): string {
  if (cachedRoot) return cachedRoot;
  const configured = process.env.DEV_STORAGE_DIR || DEFAULT_ROOT;
  cachedRoot = resolve(configured);
  return cachedRoot;
}

function safeJoin(key: string): string {
  const root = getRoot();
  const resolved = resolve(root, key);
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Path traversal blocked for key: ${key}`);
  }
  return resolved;
}

export async function localPut(
  key: string,
  body: Uint8Array | Buffer,
  _contentType: string,
): Promise<void> {
  const path = safeJoin(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

export async function localGetBuffer(key: string): Promise<Buffer> {
  const path = safeJoin(key);
  return readFile(path);
}

export async function localDelete(key: string): Promise<void> {
  const path = safeJoin(key);
  await rm(path, { force: true });
}

export async function localPresign(
  key: string,
  expiresInSeconds = DEFAULT_EXPIRES_SECONDS,
  downloadFilename?: string,
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${key}:${expires}`;
  const signature = createHmac("sha256", TOKEN_SECRET)
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
  const base = process.env.DEV_STORAGE_PUBLIC_URL ?? "http://localhost:3000";
  return `${base}/dev-storage/${encodeURIComponent(key)}?${params.toString()}`;
}

export interface LocalFileMeta {
  exists: boolean;
  contentType?: string;
}

function localStat(_key: string): LocalFileMeta {
  return { exists: true };
}

function localPublicBaseUrl(): string {
  return process.env.DEV_STORAGE_PUBLIC_URL ?? "http://localhost:3000";
}

export function verifyLocalToken(
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
  const expected = createHmac("sha256", TOKEN_SECRET)
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

export function contentTypeForKey(key: string): string {
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

export function isLocalStorageEnabled(): boolean {
  return !process.env.S3_ENDPOINT;
}

function sha256Hex(buffer: Uint8Array | Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
