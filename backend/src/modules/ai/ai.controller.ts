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

const updateSettingsSchema = z.object({
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
    const models = this.aiService.listModels(userId);
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
    if (body.openaiApiKey !== undefined) {
      if (body.openaiApiKey === null || body.openaiApiKey.trim() === '') {
        await this.userSettingsService.removeUserOpenaiApiKey(userId);
      } else {
        await this.userSettingsService.setUserOpenaiApiKey(
          userId,
          body.openaiApiKey,
        );
      }
      this.connectionService.invalidateUserOpenaiCache(userId);
    }
    return this.connectionService.snapshot(userId);
  }

  @Delete('connection')
  @Delete('connection/settings')
  async deleteSettings(@CurrentUser('id') userId: string) {
    await this.userSettingsService.removeUserOpenaiApiKey(userId);
    this.connectionService.invalidateUserOpenaiCache(userId);
    return this.connectionService.snapshot(userId);
  }
}
