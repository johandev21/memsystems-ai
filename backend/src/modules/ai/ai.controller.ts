import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiService } from './ai.service';
import { ConnectionService } from './connection.service';
import { UserSettingsService } from './user-settings.service';
import { PROVIDER_IDS } from './providers/model-catalog';

const updateSettingsSchema = z.object({
  provider: z.enum(PROVIDER_IDS).optional(),
  apiKey: z.string().nullable().optional(),
  // Accept the previous payload during the client rollout.
  openaiApiKey: z.string().nullable().optional(),
});

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly connectionService: ConnectionService,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  @Get('models')
  async listModels(@CurrentUser('id') userId: string) {
    const models = await this.aiService.listModels(userId);
    return { models };
  }

  @Get('connection')
  async getConnectionStatus(@CurrentUser('id') userId: string) {
    return this.connectionService.snapshot(userId);
  }

  @Post('connection')
  @Post('connection/settings')
  @UsePipes(new ZodValidationPipe(updateSettingsSchema))
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() body: z.infer<typeof updateSettingsSchema>,
  ) {
    const providerId =
      body.provider ?? (body.openaiApiKey !== undefined ? 'openai' : undefined);
    const apiKey = body.apiKey ?? body.openaiApiKey;
    if (
      providerId &&
      (body.apiKey !== undefined || body.openaiApiKey !== undefined)
    ) {
      if (apiKey == null || apiKey.trim() === '') {
        await this.userSettingsService.removeUserApiKey(userId, providerId);
      } else {
        await this.userSettingsService.setUserApiKey(
          userId,
          providerId,
          apiKey ?? null,
        );
      }
      this.connectionService.invalidateUserProviderCache(userId, providerId);
    }
    return this.connectionService.snapshot(userId);
  }

  @Delete('connection')
  @Delete('connection/settings')
  async deleteSettings(@CurrentUser('id') userId: string) {
    const provider = undefined;
    if (provider)
      await this.userSettingsService.removeUserApiKey(userId, provider);
    else await this.userSettingsService.removeUserOpenaiApiKey(userId);
    this.connectionService.invalidateUserProviderCache(userId, provider);
    return this.connectionService.snapshot(userId);
  }
}
