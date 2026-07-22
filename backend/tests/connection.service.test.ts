import { describe, expect, it } from "vitest";
import { createDatabaseConnection } from "../src/database/connection";
import { ConnectionService } from "../src/modules/ai/connection.service";
import { UserSettingsService } from "../src/modules/ai/user-settings.service";
import { seedUser } from "./fixtures";

describe("ConnectionService & UserSettingsService Tests", () => {
  const { db } = createDatabaseConnection(process.env.DATABASE_URL);
  const userSettingsService = new UserSettingsService(db as any);
  const connectionService = new ConnectionService(userSettingsService);

  it("should snapshot false when no key is configured", async () => {
    const user = await seedUser();
    const snapshot = await connectionService.snapshot(user.id);

    expect(snapshot.ok).toBe(false);
    expect(snapshot.openai.hasKey).toBe(false);
    expect(snapshot.openai.detail).toBe("OpenAI API Key is not configured.");
  });

  it("should save API key, snapshot with hasKey, and delete API key safely", async () => {
    const user = await seedUser();

    // Save key
    await userSettingsService.setUserOpenaiApiKey(user.id, "sk-test-key-12345");
    connectionService.invalidateUserOpenaiCache(user.id);

    const snapshotWithKey = await connectionService.snapshot(user.id);
    expect(snapshotWithKey.openai.hasKey).toBe(true);

    // Delete key via null
    await userSettingsService.setUserOpenaiApiKey(user.id, null);
    connectionService.invalidateUserOpenaiCache(user.id);

    const snapshotAfterDelete = await connectionService.snapshot(user.id);
    expect(snapshotAfterDelete.openai.hasKey).toBe(false);
  });
});
