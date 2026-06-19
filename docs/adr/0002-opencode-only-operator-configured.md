# ADR-0002: OpenCode-only, operator-configured AI; defer per-user BYOK

## Status
Accepted

## Context
The Study Assistant originally supported four direct cloud providers (OpenAI, Anthropic, Google, DeepSeek) with a per-user BYOK model plus a platform-supplied env-var fallback. We are refactoring onto OpenCode via the `ai-sdk-provider-opencode-sdk` community provider (the local CLI bridge); the operator holds an **OpenCode Go** subscription (Chinese models: GLM, DeepSeek, MiMo, MiniMax, Kimi, Qwen). The local bridge has no per-user API-key path — credentials live in the OpenCode CLI config and a single local server (`127.0.0.1:4096`) is shared. This work is off the main branch, as an experiment.

## Decision
For this pass, support **OpenCode only** (OpenCode Go tier), configured by the operator. Remove the four `@ai-sdk/*` cloud packages, their provider modules, the provider catalog, the `provider` pgEnum, the `provider_keys` table, the env-var fallback, and the per-user credential routes/UI. AI features are gated on a server-side OpenCode reachability check, with a global "AI unavailable" state for users and an operator-facing connection-status screen. Direct cloud providers, per-user Provider Keys, the credential config screen, and onboarding are deferred to a later pass; a clean pluggable provider abstraction is kept so they can be re-added without re-architecting.

## Consequences
- The app is effectively single-tenant for AI: one OpenCode config on the host serves all users.
- No per-user credentials to manage, encrypt, or validate this pass — `ENCRYPTION_KEY` and the provider-key infrastructure are removed.
- Structured generation must use OpenCode's native `json_schema` with a prompt-based JSON + Zod fallback, because some backends return non-strict JSON.
- `temperature` / `maxOutputTokens` are not supported by the provider and will be omitted.
- Requires the OpenCode CLI installed on the server and a managed local-server lifecycle (singleton provider instance, `dispose()` on shutdown).
- Re-enabling cloud providers + BYOK later requires a new Drizzle migration (re-adding the `provider` enum + `provider_keys` table) and the deferred config/onboarding UI.

## Alternatives considered
- **Keep per-user BYOK + cloud providers, add OpenCode Go as a cloud gateway**: rejected because the user's OpenCode access is the local CLI bridge (no per-user key), and the user chose to go all-in on OpenCode for this experimental pass.
- **Keep BYOK scaffolding dormant** (preserve `provider_keys` table/enum/routes): rejected to maximize refactor cleanliness off main; the table/enum will be re-added by migration when needed.
- **Additive only** (leave old providers + env fallback in place): rejected because it preserves the security bad practices — the env-var fallback grants AI access without per-user credentials, and `/api/ai/chat` accepts an `apiKey` from the client request body.
