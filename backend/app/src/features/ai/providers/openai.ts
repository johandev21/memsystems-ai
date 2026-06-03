import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { BadRequestError } from "../../../errors";
import { getModelInProvider } from "../provider-catalog";
import type { ProviderModel } from "../provider-catalog";

export function createModel(
	modelId: string,
	apiKey?: string,
): LanguageModel {
	const resolved = getModelInProvider("openai", modelId);
	if (!resolved) {
		throw new BadRequestError(`Unknown OpenAI model: ${modelId}`);
	}
	const provider = createOpenAI({
		apiKey: apiKey ?? process.env.PROVIDER_OPENAI_API_KEY,
	});
	return provider(modelId);
}

export function listModels(): ProviderModel[] {
	return [
		{ id: "gpt-4o-mini", displayName: "GPT-4o Mini" },
		{ id: "gpt-4o", displayName: "GPT-4o" },
		{ id: "o4-mini", displayName: "O4 Mini" },
		{ id: "gpt-4.1-mini", displayName: "GPT-4.1 Mini" },
		{ id: "gpt-4.1-nano", displayName: "GPT-4.1 Nano" },
	];
}
