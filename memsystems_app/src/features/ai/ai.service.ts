import { convertToModelMessages, streamText } from "ai";
import { BadRequestError } from "@/lib/errors";
import { connectionService } from "./connection.service";
import type { Provider } from "./provider";
import { createOpenaiProvider } from "./providers/openai";
// import { opencodeProvider } from "./providers/opencode";
import { userSettingsService } from "./user-settings.service";

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

export async function getProviderForModel(
  modelId: string,
  userId?: string,
): Promise<Provider> {
  if (modelId.startsWith("openai/")) {
    if (!userId) {
      throw new BadRequestError("User context required for OpenAI provider.");
    }
    const apiKey = await userSettingsService.getUserOpenaiApiKey(userId);
    if (!apiKey) {
      throw new BadRequestError(
        "OpenAI API key not configured. Please add your key in the Connection settings.",
      );
    }
    return createOpenaiProvider(apiKey);
  }
  throw new BadRequestError(
    `Model ${modelId} is not supported. Only OpenAI provider is enabled.`,
  );
}

export class AiService {
  listModels(_userId?: string) {
    // const opencodeModels = opencodeProvider.listModels();
    const openaiModels = createOpenaiProvider("").listModels();
    return openaiModels;
  }

  async generateStream(
    modelId: string,
    messages: ConvertInput,
    userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestError("User context required to generate stream.");
    }
    await connectionService.requireConnected(userId, modelId);
    const provider = await getProviderForModel(modelId, userId);
    const model = provider.createModel(modelId);
    const coreMessages = await convertToModelMessages(messages);
    return streamText({ model, messages: coreMessages });
  }
}
