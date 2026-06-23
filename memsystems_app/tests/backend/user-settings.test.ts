import { beforeEach, describe, expect, it } from "vitest";
import { userSettingsService } from "@/features/ai/user-settings.service";
import { resetDatabase } from "../db";
import { seedUser } from "../fixtures";

describe("userSettingsService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns null when no settings exist for a user", async () => {
    const user = await seedUser();
    const key = await userSettingsService.getUserOpenaiApiKey(user.id);
    expect(key).toBeNull();
  });

  it("saves and decrypts the OpenAI API Key successfully", async () => {
    const user = await seedUser();
    const testKey = "sk-proj-test-key-12345";

    await userSettingsService.saveUserOpenaiApiKey(user.id, testKey);

    const retrievedKey = await userSettingsService.getUserOpenaiApiKey(user.id);
    expect(retrievedKey).toBe(testKey);
  });

  it("overwrites the OpenAI API Key on conflict (upsert)", async () => {
    const user = await seedUser();
    const testKey1 = "sk-first-key";
    const testKey2 = "sk-second-key";

    await userSettingsService.saveUserOpenaiApiKey(user.id, testKey1);
    await userSettingsService.saveUserOpenaiApiKey(user.id, testKey2);

    const retrievedKey = await userSettingsService.getUserOpenaiApiKey(user.id);
    expect(retrievedKey).toBe(testKey2);
  });

  it("saves null and clears the key successfully", async () => {
    const user = await seedUser();

    await userSettingsService.saveUserOpenaiApiKey(user.id, "sk-temporary");
    await userSettingsService.saveUserOpenaiApiKey(user.id, null);

    const retrievedKey = await userSettingsService.getUserOpenaiApiKey(user.id);
    expect(retrievedKey).toBeNull();
  });
});
