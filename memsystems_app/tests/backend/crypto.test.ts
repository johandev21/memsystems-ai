import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";

describe("crypto utilities", () => {
  it("encrypts and decrypts text successfully", () => {
    const originalText = "my-super-secret-api-key-123456!";
    const encrypted = encrypt(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toContain(":"); // Format iv:encrypted:tag

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const text = "same-text";
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it("throws error for malformed ciphertexts", () => {
    expect(() => decrypt("malformed")).toThrow();
    expect(() => decrypt("a:b")).toThrow();
  });
});
