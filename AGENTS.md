# memsystems - Global Agent Instructions

This monorepo contains two applications. This file serves as the global router and baseline configuration for agents working in this repository.

## 1. Directory Structure & Routing

Before working on any specific part of the stack, you **must** read the `AGENTS.md` file in the respective directory. They contain strict, domain-specific rules.

- **Frontend (`frontend/`)**: TanStack Start application. See `frontend/AGENTS.md` for UI rules, commands, and routing structures.
- **Backend (`backend/app/`)**: Elysia + Bun application. See `backend/AGENTS.md` for API rules, Drizzle ORM standards, and the Controller-Service architecture.

## 2. Global Standards

- **Package Manager (Bun)**: We exclusively use **Bun**. Never use `npm`, `yarn`, or `pnpm`. Always run `bun install` and `bun run <script>`.
- **Clean Code Philosophy**: 
  - Organize code logically by **feature domain** rather than purely by technical type. 
  - Keep files small, highly cohesive, and loosely coupled.
  - Prioritize readability and maintainability.
  - Adhere strictly to the specific folder structures and architectural patterns mandated in the child `AGENTS.md` files.

## 3. General Notes
- Prefer reading actual executable source code over README text, as the repository may still contain boilerplate template README content.