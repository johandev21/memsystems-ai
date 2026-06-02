import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let originalDir: string | undefined;
let originalSecret: string | undefined;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "memsystems-localfs-"));
  originalDir = process.env.DEV_STORAGE_DIR;
  originalSecret = process.env.DEV_STORAGE_TOKEN_SECRET;
  process.env.DEV_STORAGE_DIR = tmpDir;
  process.env.DEV_STORAGE_TOKEN_SECRET = "test-secret-do-not-use";
});

afterAll(() => {
  if (originalDir === undefined) delete process.env.DEV_STORAGE_DIR;
  else process.env.DEV_STORAGE_DIR = originalDir;
  if (originalSecret === undefined) delete process.env.DEV_STORAGE_TOKEN_SECRET;
  else process.env.DEV_STORAGE_TOKEN_SECRET = originalSecret;
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("local-fs storage", () => {
  test("round-trips a file", async () => {
    const { localPut, localGetBuffer, localDelete } = await import(
      "../../src/storage/local-fs"
    );
    const key = "sources/notebook/abc/test.txt";
    const body = Buffer.from("hello local", "utf-8");
    await localPut(key, body, "text/plain");
    const got = await localGetBuffer(key);
    expect(got.toString("utf-8")).toBe("hello local");
    await localDelete(key);
    await expect(localGetBuffer(key)).rejects.toThrow();
  });

  test("presign returns a valid HMAC-signed URL", async () => {
    const { localPresign, verifyLocalToken } = await import(
      "../../src/storage/local-fs"
    );
    const url = await localPresign("sources/x/y.pdf", 60, "report.pdf");
    expect(url).toContain("/__dev-storage/");
    expect(url).toContain("filename=report.pdf");
    const u = new URL(url);
    const sig = u.searchParams.get("sig");
    const expires = u.searchParams.get("expires");
    const verified = verifyLocalToken("sources/x/y.pdf", expires, sig);
    expect(verified.ok).toBe(true);
  });

  test("verify rejects bad signature", async () => {
    const { verifyLocalToken } = await import("../../src/storage/local-fs");
    const result = verifyLocalToken("sources/x/y.pdf", String(Math.floor(Date.now() / 1000) + 60), "deadbeef");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("bad_sig");
  });

  test("verify rejects expired token", async () => {
    const { verifyLocalToken } = await import("../../src/storage/local-fs");
    const result = verifyLocalToken("sources/x/y.pdf", "1", "00".repeat(16));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
  });

  test("verify rejects missing token", async () => {
    const { verifyLocalToken } = await import("../../src/storage/local-fs");
    expect(verifyLocalToken("k", null, null).ok).toBe(false);
    expect(verifyLocalToken("k", "1000", null).ok).toBe(false);
  });

  test("contentTypeForKey returns sensible defaults", async () => {
    const { contentTypeForKey } = await import("../../src/storage/local-fs");
    expect(contentTypeForKey("a.pdf")).toBe("application/pdf");
    expect(contentTypeForKey("a.md")).toBe("text/markdown");
    expect(contentTypeForKey("a.txt")).toBe("text/plain");
    expect(contentTypeForKey("a.docx")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(contentTypeForKey("a.bin")).toBe("application/octet-stream");
  });

  test("isLocalStorageEnabled respects S3_ENDPOINT", async () => {
    const { isLocalStorageEnabled } = await import(
      "../../src/storage/local-fs"
    );
    const original = process.env.S3_ENDPOINT;
    delete process.env.S3_ENDPOINT;
    expect(isLocalStorageEnabled()).toBe(true);
    process.env.S3_ENDPOINT = "http://localhost:9000";
    expect(isLocalStorageEnabled()).toBe(false);
    if (original === undefined) delete process.env.S3_ENDPOINT;
    else process.env.S3_ENDPOINT = original;
  });
});
