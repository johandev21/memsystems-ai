import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";
import { getModelInProvider } from "../provider-catalog";
import type { ProviderModel } from "../provider-catalog";

export function createModel(
	modelId: string,
	apiKey?: string,
): LanguageModel {
	const resolved = getModelInProvider("deepseek", modelId);
	if (!resolved) {
		throw new Error(`Unknown DeepSeek model: ${modelId}`);
	}
	const provider = createDeepSeek({
		apiKey: apiKey ?? process.env.PROVIDER_DEEPSEEK_API_KEY,
	});
	return provider(modelId);
}

export function listModels(): ProviderModel[] {
	return [
		{ id: "deepseek-chat", displayName: "DeepSeek Chat" },
		{ id: "deepseek-reasoner", displayName: "DeepSeek Reasoner" },
	];
}
