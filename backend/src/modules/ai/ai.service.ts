import { Injectable } from '@nestjs/common';
import { convertToModelMessages, streamText } from 'ai';
import { BadRequestError } from '../../common/errors/domain-error';
import { ConnectionService } from './connection.service';
import { createOpenaiProvider, Provider } from './openai.provider';
import { UserSettingsService } from './user-settings.service';

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

@Injectable()
export class AiService {
  constructor(
    private readonly userSettingsService: UserSettingsService,
    private readonly connectionService: ConnectionService,
  ) {}

  async getProviderForModel(
    modelId: string,
    userId?: string,
  ): Promise<Provider> {
    if (modelId.startsWith('openai/')) {
      if (!userId) {
        throw new BadRequestError('User context required for OpenAI provider.');
      }
      const apiKey = await this.userSettingsService.getUserOpenaiApiKey(userId);
      if (!apiKey) {
        throw new BadRequestError(
          'OpenAI API key not configured. Please add your key in the Connection settings.',
        );
      }
      return createOpenaiProvider(apiKey);
    }
    throw new BadRequestError(
      `Model ${modelId} is not supported. Only OpenAI provider is enabled.`,
    );
  }

  listModels(_userId?: string) {
    return createOpenaiProvider('').listModels();
  }

  async generateStream(
    modelId: string,
    messages: ConvertInput,
    userId?: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestError('User context required to generate stream.');
    }
    await this.connectionService.requireConnected(userId, modelId);
    const provider = await this.getProviderForModel(modelId, userId);
    const model = provider.createModel(modelId);
    const coreMessages = await convertToModelMessages(messages);
    return streamText({ model, messages: coreMessages });
  }
}
