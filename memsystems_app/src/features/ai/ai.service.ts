import { convertToModelMessages, streamText } from "ai";
import { connectionService } from "./connection.service";
import { opencodeProvider } from "./providers/opencode";

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

export class AiService {
  listModels() {
    return opencodeProvider.listModels();
  }

  async generateStream(modelId: string, messages: ConvertInput) {
    await connectionService.requireConnected();
    const model = opencodeProvider.createModel(modelId);
    const coreMessages = await convertToModelMessages(messages);
    return streamText({ model, messages: coreMessages });
  }
}
