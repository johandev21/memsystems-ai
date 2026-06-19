import {
  createOpencode,
  opencode as createOpencodeModel,
  isAuthenticationError,
  isTimeoutError,
} from "ai-sdk-provider-opencode-sdk";
import type { LanguageModel } from "ai";
import { generateText } from "ai";
import type { HealthCheckResult, Provider, ProviderModel } from "../provider";

const HEALTH_CHECK_MODEL = "opencode-go/glm-5.2";

let instance: ReturnType<typeof createOpencode> | null = null;

function getInstance() {
  if (!instance) {
    instance = createOpencode({
      autoStartServer: true,
      serverTimeout: 10000,
    });
    process.once("SIGINT", () => instance?.dispose?.());
    process.once("SIGTERM", () => instance?.dispose?.());
  }
  return instance;
}

export const opencodeProvider: Provider = {
  id: "opencode",
  name: "OpenCode",

  listModels(): ProviderModel[] {
    return [
      { id: "opencode-go/glm-5.2", displayName: "GLM 5.2" },
      { id: "opencode-go/deepseek-v4-flash", displayName: "DeepSeek V4 Flash" },
      { id: "opencode-go/deepseek-v4-pro", displayName: "DeepSeek V4 Pro" },
      { id: "opencode-go/kimi-k2.6", displayName: "Kimi K2.6" },
      { id: "opencode-go/kimi-k2.7-code", displayName: "Kimi K2.7 Code" },
      { id: "opencode-go/mimo-v2.5", displayName: "MiMo V2.5" },
      { id: "opencode-go/mimo-v2.5-pro", displayName: "MiMo V2.5 Pro" },
      { id: "opencode-go/minimax-m2.7", displayName: "MiniMax M2.7" },
      { id: "opencode-go/minimax-m3", displayName: "MiniMax M3" },
      { id: "opencode-go/qwen3.7-max", displayName: "Qwen 3.7 Max" },
    ];
  },

  createModel(modelId: string): LanguageModel {
    return getInstance()(modelId);
  },

  async health(): Promise<HealthCheckResult> {
    try {
      const model = getInstance()(HEALTH_CHECK_MODEL);
      await generateText({
        model,
        prompt: "1",
        maxOutputTokens: 1,
      });
      return { ok: true };
    } catch (e: unknown) {
      if (isAuthenticationError(e)) {
        return {
          ok: false,
          detail:
            "OpenCode authentication failed — check your subscription credentials in the OpenCode CLI config",
        };
      }
      if (isTimeoutError(e)) {
        return {
          ok: false,
          detail:
            "OpenCode server unreachable — ensure OpenCode CLI is installed and running",
        };
      }
      const message = e instanceof Error ? e.message : "Unknown OpenCode error";
      return { ok: false, detail: message };
    }
  },
};
