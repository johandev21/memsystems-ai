import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { userSettings } from "@/database/schema";
import { decrypt, encrypt } from "@/lib/crypto";

export const userSettingsService = {
  async getUserOpenaiApiKey(userId: string): Promise<string | null> {
    try {
      const [row] = await db
        .select({ openaiApiKey: userSettings.openaiApiKey })
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

      if (!row || !row.openaiApiKey) {
        return null;
      }

      return decrypt(row.openaiApiKey);
    } catch (error) {
      // If decryption fails (e.g. key changed), return null
      return null;
    }
  },

  async saveUserOpenaiApiKey(
    userId: string,
    apiKey: string | null,
  ): Promise<void> {
    const encryptedKey =
      apiKey && apiKey.trim() ? encrypt(apiKey.trim()) : null;

    // Use upsert pattern
    await db
      .insert(userSettings)
      .values({
        userId,
        openaiApiKey: encryptedKey,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          openaiApiKey: encryptedKey,
          updatedAt: new Date(),
        },
      });
  },
};
