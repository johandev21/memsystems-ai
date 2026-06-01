import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export interface ModelOption {
  id: string;
  displayName: string;
}

const MODELS: ModelOption[] = [
  { id: "gpt-4.1-nano", displayName: "GPT-4.1 Nano" },
  { id: "gpt-realtime-mini", displayName: "GPT Realtime Mini" },
  { id: "gpt-5.4-mini", displayName: "GPT-5.4 Mini" },
  { id: "o4-mini", displayName: "O4 Mini" },
  { id: "gpt-4.1-mini", displayName: "GPT-4.1 Mini" },
];

const SYSTEM_PROMPT =
  "You are a helpful study assistant. Help users understand topics, generate study materials, explain concepts, and plan their learning. Be concise, clear, and encouraging.";

const TEMPERATURE = 0.7;

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

export class AiService {
  getModels(): ModelOption[] {
    return [...MODELS];
  }

  async generateStream(modelId: string, messages: ConvertInput) {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const coreMessages = await convertToModelMessages(messages);

    return streamText({
      model: openai(modelId),
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      temperature: TEMPERATURE,
    });
  }
}
