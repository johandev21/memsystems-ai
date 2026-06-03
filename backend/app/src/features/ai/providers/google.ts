import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getModelInProvider } from "../provider-catalog";
import type { ProviderModel } from "../provider-catalog";

export function createModel(
	modelId: string,
	apiKey?: string,
): LanguageModel {
	const resolved = getModelInProvider("google", modelId);
	if (!resolved) {
		throw new Error(`Unknown Google model: ${modelId}`);
	}
	const provider = createGoogleGenerativeAI({
		apiKey: apiKey ?? process.env.PROVIDER_GOOGLE_API_KEY,
	});
	return provider(modelId);
}

export function listModels(): ProviderModel[] {
	return [
		{ id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
		{ id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
		{ id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
	];
}
