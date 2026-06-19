# AI Provider Refactor Plan

> Output of a `/grill-with-docs` session. Decisions are recorded in `CONTEXT.md` (glossary) and `docs/adr/0002-opencode-only-operator-configured.md`. This pass is off-main/experimental.

## 1. Decisions (resolved)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Provider set | **OpenCode only** this pass (OpenCode Go tier). The 4 cloud providers (OpenAI, Anthropic, Google, DeepSeek) are removed; "the three providers" was a miscount of the 4 that existed. |
| 2 | Credential model | **Operator-configured**, not per-user. The OpenCode local CLI bridge has no per-user API key; credentials live in the OpenCode CLI config. Per-user BYOK is deferred. |
| 3 | "Valid connection" | Server-side **OpenCode reachability/health** check. Users see a global "AI unavailable" state when OpenCode isn't connected. (Test-on-save + per-user validation returns with BYOK later.) |
| 4 | OpenCode integration | `ai-sdk-provider-opencode-sdk` (v3.x, AI SDK v6) — the local CLI bridge. Model ids use `providerID/modelID`, e.g. `opencode-go/glm-5.2`. |
| 5 | Model catalog | **OpenCode Go only**, 10 curated ids (§5). No dynamic model discovery (the provider exposes no list-models API). Zen (pay-per-usage) is not enabled. |
| 6 | Teardown scope | **Full removal** of cloud-provider scaffolding + the `provider` pgEnum and `provider_keys` table (Drizzle migration). Clean pluggable provider abstraction kept. |
| 7 | Chat architecture | Wire the UI to the **grounded + persistent** route `/api/notebooks/[id]/chat`; delete the stateless `/api/ai/chat`. |
| 8 | UI/feedback | Operator-facing **connection-status screen** + global gate banner; per-user config/onboarding deferred. |

## 2. Bad practices found (per the ai-sdk skill)

> Skill rule: never trust memory for model IDs; never pass provider secrets from the client; `useChat` requires `toUIMessageStreamResponse()`; remove platform-supplied fallback when BYOK is the contract.

| # | Issue | Location | Skill / rule violated |
|---|-------|----------|-----------------------|
| B1 | **Outdated/hardcoded model IDs** | `src/features/ai/provider-catalog.ts:12-59`; `providers/{openai,anthropic,google,deepseek}.ts` `listModels()` | "Always fetch current model IDs — never use model IDs from memory." e.g. `claude-3-5-sonnet`, `gpt-4o`, `gpt-4.1-nano`, `gemini-2.0-flash`, `o4-mini`. |
| B2 | **Duplicated model catalog** | `provider-catalog.ts` AND each `providers/*.ts` `listModels()` | Single source of truth missing. |
| B3 | **Platform-supplied env-var fallback** | `src/features/ai/ai.service.ts:39-53` (`resolveApiKey` → `process.env.PROVIDER_*_API_KEY`) | Grants AI access with no per-user credential; contradicts the gating contract. |
| B4 | **Client-sent API key in request body** | `src/app/api/ai/chat/route.ts:8-13` (schema `apiKey: z.string().optional()`), `:21-26` (passed through); `ai.service.ts:63-91` (`generateStream({ apiKey })`) | Provider secrets must never travel client→server in the body; keys load server-side from the encrypted store. |
| B5 | **Wrong stream format for `useChat`** | `src/app/api/ai/chat/route.ts:27` returns `toTextStreamResponse()` while the client uses `useChat` | `common-errors.md`: use `toUIMessageStreamResponse()` with `useChat`. |
| B6 | **UI calls the wrong chat route** | `src/features/notebook/components/chat-panel.tsx:22` (`CHAT_API_URL = "/api/ai/chat"`) | The grounded+persistent route `/api/notebooks/[id]/chat` (→ `NotebookChatService.sendMessage` → `toUIMessageStreamResponse()`) exists but is unused. Violates `CONTEXT.md` "Notebook Chat" (grounded, persistent, cites sources). |
| B7 | **No body validation for messages** | `src/app/api/ai/chat/route.ts:11` (`messages: z.any()`) | Validate with Zod, not `z.any()`. |
| B8 | **Unauthenticated AI catalog routes** | `src/app/api/ai/models/route.ts`; `src/app/api/ai/providers/route.ts` (no `getSession`) | Inconsistent with other routes; gate behind auth + the connection check. |
| B9 | **`temperature` set but unsupported by OpenCode** | `ai.service.ts:13,89`; `notebook-chat.service.ts:101`; `generation.service.ts:104` | OpenCode ignores `temperature`/`maxOutputTokens` (provider defaults). Remove to avoid implying control we don't have. |
| B10 | **Provider-specific coupling in a generic hook** | `src/features/notebook/hooks/use-model-selection.ts:29` (`isOpenai = activeProvider?.id === "openai"`) | Dead coupling (`useModelSelection` is unused; only `useDefaultModelSelection` is imported). |
| B11 | **Wrong provider/model defaults for OpenCode-only** | `notebook-chat.service.ts:77` (`provider ?? "openai"`); `generation.service.ts:29-36` (`MODELS_BY_KIND = "gpt-4.1-mini"`); `chat-panel.tsx:23-24` (`DEFAULT_MODEL_ID`, `FALLBACK_PROVIDER_ID`) | Defaults reference removed providers/models. |
| B12 | **`generateObject` usage** — OK | `generation.service.ts:1,101` uses `Output.object({ schema })` | Correct per `common-errors.md`. But needs a JSON fallback for OpenCode (§7). |

## 3. Target architecture

```
src/features/ai/
  provider.ts            # interface: Provider { id, name, listModels(), createModel(id), health() }
  providers/
    opencode.ts          # sole provider: ai-sdk-provider-opencode-sdk, singleton, health check
  provider-catalog.ts    # single source of truth: OpenCode Go models (§5)
  ai.service.ts          # no env fallback, no per-user key; resolveModel(id); gate on opencode.health()
  connection.service.ts  # cached OpenCode reachability state + last error; consumed by routes + UI
```

- **`Provider` interface** (pluggable): `id`, `name`, `listModels(): ProviderModel[]`, `createModel(modelId): LanguageModel`, `health(): Promise<{ ok: boolean; detail?: string }>`. OpenCode is the only implementation now; cloud providers + BYOK implementations slot in later.
- **OpenCode singleton**: one `createOpencode()` instance per server process (`autoStartServer`, `dispose()` on `SIGINT`/`SIGTERM`); never instantiate per-request. Auth via `clientOptions` (operator-level) if needed.
- **`AiService`**: `resolveModel(modelId)` validates the id against the catalog and calls `opencode.createModel`. No `apiKey` parameter, no env fallback. `generateStream` / `createModel` throw a `ServiceUnavailableError` ("OpenCode not connected") when `connection.service` says unreachable.
- **Connection gate** (§6): server-side check before any AI action; client-side banner + disabled controls.

## 4. Step-by-step migration

### Phase A — Install + provider module
1. `pnpm add ai-sdk-provider-opencode-sdk` (only this package; do **not** install provider/client packages speculatively). Requires `opencode` CLI on the host.
2. Create `src/features/ai/providers/opencode.ts`:
   - `import { createOpencode } from "ai-sdk-provider-opencode-sdk"`.
   - Singleton instance (module-scoped); register `dispose()` on process signals.
   - `createModel(modelId)` → `opencode(modelId)` (model ids are full `opencode-go/...` strings).
   - `health()` → lightweight probe (e.g. a minimal `generateText` with a tiny prompt, or an OpenCode server ping); return `{ ok, detail }`.
3. Create `src/features/ai/provider.ts` (the `Provider` interface).

### Phase B — Catalog + service
4. Replace `provider-catalog.ts` with the OpenCode Go catalog (§5). Single source of truth — no per-provider `listModels()` duplicates.
5. Rewrite `ai.service.ts`: remove `PROVIDERS` map, `resolveApiKey`, env fallback, `apiKey` params; add `resolveModel(modelId)` and a connection gate call. Remove `temperature`.
6. Create `src/features/ai/connection.service.ts` (cached health, TTL ~15s, refreshable).

### Phase C — Remove old provider code + packages
7. Delete `src/features/ai/providers/{anthropic,openai,google,deepseek}.ts`.
8. `pnpm remove @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google @ai-sdk/deepseek`.
9. Delete `src/features/ai/provider-key.service.ts`, `src/lib/crypto.ts` (only consumer is the key service — confirmed), `src/app/api/provider-keys/route.ts`, `src/app/api/provider-keys/[id]/route.ts`.
10. Delete `src/app/api/ai/chat/route.ts` (stateless, B4/B5/B6), `src/app/api/ai/models/route.ts`, `src/app/api/ai/providers/route.ts`.

### Phase D — Database migration
11. Remove `providerEnum` and `providerKeys` from `src/database/schema.ts` (and the `table` export).
12. Generate + run a Drizzle migration that **drops** the `provider_keys` table and the `provider` enum. (Re-added by a future migration when BYOK returns.)

### Phase E — Chat fix (B5, B6, B7)
13. In `chat-panel.tsx`: point the transport at `/api/notebooks/${notebookId}/chat`; load history via `GET /api/notebooks/[id]/chat` (already exists) and seed `useChat({ messages })`.
14. `NotebookChatService.sendMessage`: change the default provider/model to an OpenCode Go model (§5); drop `temperature`; keep `toUIMessageStreamResponse()`.
15. Remove `src/lib/models.ts` `modelsQueryOptions`/`providersQueryOptions`; replace with a single OpenCode catalog query (TanStack Query) consumed by the model selector.

### Phase F — Generation fix (B9, B11, B12)
16. `GenerationService`: replace `MODELS_BY_KIND` (gpt-4.1-mini) with an OpenCode Go default per kind; drop `temperature`; keep `Output.object({ schema })`.
17. Wrap `Output.object` with the OpenCode reliability pattern: try native → retry small N → fallback to strict-JSON prompt + Zod `parse` (per the provider README's `generate-object`/`stream-object` examples). Preserve the existing `partialOutputStream` streaming where possible.
18. `notebook-chat.service.ts:77` and `generate` route: default `provider` is no longer a string id (OpenCode is implicit) — pass only `model`; update Zod schemas accordingly.

### Phase G — Connection gate + status UI
19. Create `GET /api/ai/connection` → `connection.service.snapshot()` (`{ ok, tier, models, lastError, checkedAt }`), auth-protected.
20. Gate `POST /api/notebooks/[id]/chat` and `POST /api/notebooks/[id]/generate` (and cancel) on `connection.service`: return 503 with a clear payload when unreachable.
21. Client: a `useConnectionStatus()` query (TanStack); a global banner ("AI unavailable — OpenCode not connected") shown when `!ok`; disable the composer + generation controls with feedback.
22. Add `src/app/settings/connection/page.tsx` (operator-facing): shows OpenCode server state, tier, available models, last error, and setup instructions (install OpenCode CLI, configure subscription credentials in OpenCode). Link from `AppHeader`.

### Phase H — Cleanup
23. Delete dead `useModelSelection` hook (`use-model-selection.ts`) and its `isOpenai` coupling (B10).
24. Re-export/inline the model catalog type so `composer`/`ModelSelector` no longer take a `providers` prop (single provider now).
25. `pnpm run typecheck && pnpm run lint` and iterate (check `common-errors.md` first on any AI SDK type error).

## 5. OpenCode Go model catalog (curated)

Prefix `opencode-go/` (confirmed by env model id `opencode-go/glm-5.2`). **IDs are verbatim from the operator; `displayName` is provisional.**

| id | displayName |
|----|-------------|
| `opencode-go/glm-5.2` | GLM 5.2 |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash |
| `opencode-go/deepseek-v4-pro` | DeepSeek V4 Pro |
| `opencode-go/kimi-k2.6` | Kimi K2.6 |
| `opencode-go/kimi-k2.7-code` | Kimi K2.7 Code |
| `opencode-go/mimo-v2.5` | MiMo V2.5 |
| `opencode-go/mimo-v2.5-pro` | MiMo V2.5 Pro |
| `opencode-go/minimax-m2.7` | MiniMax M2.7 |
| `opencode-go/minimax-m3` | MiniMax M3 |
| `opencode-go/qwen3.7-max` | Qwen 3.7 Max |

Default model for chat + generation: `opencode-go/glm-5.2` (highest general-purpose option).

## 6. Connection/health gate design

- **`connection.service`**: memoized `health()` with a short TTL; stores `{ ok, tier, models?, lastError?, checkedAt }`. On a failed AI call, catch `isAuthenticationError`/`isTimeoutError` (exported by the provider) → invalidate the cache and surface a clear "reconnect OpenCode" message.
- **Server enforcement**: every AI route calls `connection.service.requireConnected()` first → 503 `{ error: "OpenCode not connected", detail }` when unavailable. This is the source of truth (client gating is UX only).
- **Client**: `useConnectionStatus()` polls `/api/ai/connection`; a top-level `<ConnectionBanner/>` + disabled composer/generation controls. The status screen (`/settings/connection`) shows operator diagnostics.

## 7. Structured-output reliability (OpenCode)

OpenCode v2+ sends native `format: { type: "json_schema", schema }`, but some backends return non-strict JSON. For `GenerationService`:
1. `streamText({ model, output: Output.object({ schema }), ... })`.
2. If the final `result.output` fails Zod, retry up to N with a stricter "respond ONLY with JSON matching this schema" system prompt.
3. Final fallback: `JSON.parse(result.text)` + `schema.parse`; on failure, mark the generation request `failed` with a clear error.
Keep the existing `generationRequests` status flow (`streaming` → `completed`/`failed`).

## 8. Deferred to the BYOK pass (later)

- Re-add direct cloud providers (OpenAI, Anthropic, Google, DeepSeek) as `Provider` implementations.
- Re-add the `provider` pgEnum + `provider_keys` table (new Drizzle migration) and `src/lib/crypto.ts`.
- Per-user Provider Keys: encrypted store + **test-on-save** validation + `valid`/`invalid` status (per `CONTEXT.md`).
- Per-user **provider config screen** + **onboarding** for users with zero Provider Connections.
- Dynamic model discovery where providers offer `/models`.

## 9. Verification

- `pnpm run typecheck` and `pnpm run lint` (Biome) pass.
- OpenCode CLI installed on the dev host; `opencode` server reachable.
- With OpenCode connected: chat is grounded (cites sources) and persistent (reload restores history via `GET /api/notebooks/[id]/chat`); generation streams partials and persists a Study Material.
- With OpenCode unreachable: AI routes return 503; the global banner shows; composer/generation are disabled; `/settings/connection` shows the diagnostics.
- No references remain to `@ai-sdk/{anthropic,openai,google,deepseek}`, `providerKeys`, `providerEnum`, `PROVIDER_*_API_KEY`, or `/api/ai/chat`.
