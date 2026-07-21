import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { userSettings } from '../../database/schema';
import { DRIZZLE } from '../database/database.module';

@Injectable()
export class UserSettingsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
  ) {}

  async getUserOpenaiApiKey(userId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ openaiApiKey: userSettings.openaiApiKey })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return (
      row?.openaiApiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.PROVIDER_OPENAI_API_KEY ||
      null
    );
  }

  async setUserOpenaiApiKey(userId: string, apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();

    await this.db
      .insert(userSettings)
      .values({
        userId,
        openaiApiKey: trimmed || null,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          openaiApiKey: trimmed || null,
          updatedAt: new Date(),
        },
      });
  }

  async removeUserOpenaiApiKey(userId: string): Promise<void> {
    await this.db.delete(userSettings).where(eq(userSettings.userId, userId));
  }
}
