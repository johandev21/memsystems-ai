# Backend System Context and Agent Instructions

This document defines the architectural rules, coding standards, and available agent skills for the backend application (`backend/app/`, using Elysia + Bun).

## 1. Architecture: Feature-Based Controller-Service Pattern
We use a feature-based folder structure combined with a Controller-Service pattern to maintain a clean architecture.

- **Feature Grouping**: Code should be organized by feature inside `backend/app/src/features/<feature-name>/`.
- **Controllers (`<feature>.controller.ts`)**: 
  - Define Elysia routes (e.g., `new Elysia().get(...)`).
  - Handle **only** the HTTP layer: request validation, calling services, and returning standard HTTP responses.
  - **Do not** put business logic or database queries in controllers.
- **Services (`<feature>.service.ts`)**: 
  - Contain pure business logic and database calls.
  - Must be completely decoupled from Elysia's HTTP context, making them easily testable in isolation.

## 2. Database: Drizzle ORM
- **Documentation**: Always refer to the official docs for syntax and features: [https://orm.drizzle.team/docs/overview](https://orm.drizzle.team/docs/overview)
- **Clean Code Rules**: 
  - Keep database queries encapsulated within Service files (or dedicated Repositories) within the feature directory.
  - Database schema is defined in `backend/app/src/database/schema.ts` and `backend/app/auth-schema.ts`.
  - Use `drizzle-typebox` if you need to derive validation schemas directly from your Drizzle tables.

## 3. Validation: TypeBox Only
- **Mandatory Tool**: We use **TypeBox** (`@sinclair/typebox`), which is natively integrated into Elysia, for all schema validation (body, query, params, response).
- **Rule**: Do **NOT** use Zod. Any Zod references or imports are strictly forbidden on the backend to avoid bundle bloat and ensure seamless Elysia integration.

## 4. Authentication: Better Auth
- We use Better Auth for authentication. 
- Controllers and Services that interact with users must leverage the Better Auth instance.
- Reference the installed Better Auth skills (listed below) for best practices regarding organization, security, 2FA, and standard email/password flows.

## Agent skills

The following skills are installed in `backend/.agents/skills/`. Agents should refer to these when working on relevant tasks:

- **elysiajs**: Best practices and patterns for ElysiaJS routing, plugins, and lifecycle.
- **better-auth-best-practices**: Setup and usage guidelines for Better Auth.
- **better-auth-security-best-practices**: Security rules for Better Auth.
- **create-auth-skill**: Guidelines for creating Better Auth implementations.
- **email-and-password-best-practices**: Standard auth flows using Better Auth.
- **organization-best-practices**: Multi-tenant and org setups using Better Auth.
## 5. Backend Context Migrated from Root

- **Working Directory**: Use `backend/app/` as the working directory for API work.
- **Commands**: `bun install`, `bun run dev`.
- **Architecture**: `backend/app/src/index.ts` starts Elysia on port `4000`, mounts auth at `/auth`, and registers AI routes under `/ai`.
- **AI**: `backend/app/src/ai.ts` currently uses the OpenAI provider via the Vercel AI SDK.
- **Database**: `DATABASE_URL` is required for Drizzle/Postgres (`backend/app/src/database/connection.ts`, `backend/app/drizzle.config.ts`).
- **Testing**: `backend/app/package.json` has no working test script yet; do not assume backend tests exist.