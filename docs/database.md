# Database

**PostgreSQL** + **Drizzle ORM** (node-postgres `Pool`, timezone UTC).

## Schema
Two files at identical paths in both packages (shared schema):
- `src/database/schema.ts` — application tables
- `src/database/auth-schema.ts` — Better Auth tables (`user`, `session`, `account`, `verification`)

## Pushing schema changes
```bash
pnpm exec drizzle-kit push
```
Reads `.env.local` for the connection string.

## Connection
Backend creates a connection pool in `src/database/connection.ts` (via `createDatabaseConnection`). Re-exported as a NestJS module in `modules/database/`.

## Test database
Separate DB at `postgresql://postgres:superuser@localhost:5432/memsystems_test`. See [testing.md](testing.md).
