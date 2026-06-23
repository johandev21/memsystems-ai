import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { LanguageModel } from "ai";
import { generateText } from "ai";
import {
  createOpencode,
  isAuthenticationError,
  isTimeoutError,
  type OpencodePermissionRuleset,
  type OpencodeSettings,
} from "ai-sdk-provider-opencode-sdk";
import type { HealthCheckResult, Provider, ProviderModel } from "../provider";

const HEALTH_CHECK_MODEL = "opencode/big-pickle";

/**
 * Sandbox directory exposed to the LLM.
 *
 * The OpenCode CLI is spawned as a child process and runs in
 * `process.cwd()` by default — which is `memsystems_app/`, giving the
 * LLM read access to the app's own source tree and `.env.local`. To
 * prevent the LLM from learning about or quoting the app's repo, we
 * pin every model instance to this empty directory and run the
 * read-only `plan` agent with an explicit deny list for write/exec
 * tools. The directory is created on first load; we never write
 * anything into it, so the LLM sees an empty filesystem.
 */
const LLM_SANDBOX_DIR = path.join(tmpdir(), "memsystems-llm-cwd");

const READ_ONLY_PERMISSIONS: OpencodePermissionRuleset = [
  { permission: "bash", pattern: "*", action: "deny" },
  { permission: "edit", pattern: "*", action: "deny" },
  { permission: "write", pattern: "*", action: "deny" },
  { permission: "websearch", pattern: "*", action: "deny" },
  { permission: "task", pattern: "*", action: "deny" },
  { permission: "external_directory", pattern: "*", action: "deny" },
];

const BASE_MODEL_SETTINGS: OpencodeSettings = {
  agent: "plan",
  directory: LLM_SANDBOX_DIR,
  permission: READ_ONLY_PERMISSIONS,
};

let instance: ReturnType<typeof createOpencode> | null = null;
let sandboxReady: Promise<void> | null = null;

function ensureSandbox(): Promise<void> {
  if (!sandboxReady) {
    sandboxReady = mkdir(LLM_SANDBOX_DIR, { recursive: true }).then(() => {});
  }
  return sandboxReady;
}

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
      { id: "opencode/big-pickle", displayName: "Big Pickle" },
      {
        id: "opencode/deepseek-v4-flash-free",
        displayName: "DeepSeek V4 Flash Free",
      },
      { id: "opencode/mimo-v2.5-free", displayName: "MiMo V2.5 Free" },
      {
        id: "opencode/nemotron-3-ultra-free",
        displayName: "Nemotron 3 Ultra Free",
      },
      {
        id: "opencode/north-mini-code-free",
        displayName: "North Mini Code Free",
      },
      // { id: "opencode-go/deepseek-v4-flash", displayName: "DeepSeek V4 Flash" },
      // { id: "opencode-go/deepseek-v4-pro", displayName: "DeepSeek V4 Pro" },
      // { id: "opencode-go/glm-5.1", displayName: "GLM 5.1" },
      // { id: "opencode-go/glm-5.2", displayName: "GLM 5.2" },
      // { id: "opencode-go/kimi-k2.6", displayName: "Kimi K2.6" },
      // { id: "opencode-go/kimi-k2.7-code", displayName: "Kimi K2.7 Code" },
      // { id: "opencode-go/mimo-v2.5", displayName: "MiMo V2.5" },
      // { id: "opencode-go/mimo-v2.5-pro", displayName: "MiMo V2.5 Pro" },
      // { id: "opencode-go/minimax-m2.7", displayName: "MiniMax M2.7" },
      // { id: "opencode-go/minimax-m3", displayName: "MiniMax M3" },
      // { id: "opencode-go/qwen3.6-plus", displayName: "Qwen 3.6 Plus" },
      // { id: "opencode-go/qwen3.7-max", displayName: "Qwen 3.7 Max" },
      // { id: "opencode-go/qwen3.7-plus", displayName: "Qwen 3.7 Plus" },
      {
        id: "github-copilot/claude-haiku-4.5",
        displayName: "Claude Haiku 4.5",
      },
      { id: "github-copilot/gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
      {
        id: "github-copilot/gemini-3-flash-preview",
        displayName: "Gemini 3 Flash Preview",
      },
      {
        id: "github-copilot/gemini-3.1-pro-preview",
        displayName: "Gemini 3.1 Pro Preview",
      },
      { id: "github-copilot/gpt-5-mini", displayName: "GPT 5 Mini" },
      { id: "github-copilot/gpt-5.4-mini", displayName: "GPT 5.4 Mini" },
      {
        id: "github-copilot/mai-code-1-flash-picker",
        displayName: "MAI Code 1 Flash Picker",
      },
    ];
  },

  createModel(modelId: string): LanguageModel {
    return getInstance()(modelId, BASE_MODEL_SETTINGS);
  },

  async health(): Promise<HealthCheckResult> {
    try {
      await ensureSandbox();
      const model = getInstance()(HEALTH_CHECK_MODEL, BASE_MODEL_SETTINGS);

      // Use a race to avoid hanging the entire app if the provider/server is stuck
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Health check timeout")), 10000),
      );

      await Promise.race([
        generateText({
          model,
          prompt: "1",
        }),
        timeoutPromise,
      ]);

      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Health check timeout") {
        return {
          ok: false,
          detail: "OpenCode health check timed out after 10s",
        };
      }
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
