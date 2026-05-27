# ADR-0001: DB-backed sessions over JWT

## Status
Accepted

## Context
Need to store user sessions after Google OAuth. Two options: stateless JWT or DB-backed sessions.

## Decision
Use Better Auth's default DB-backed sessions with Postgres.

## Consequences
- Sessions revocable instantly (logout, ban, compromise)
- No token rotation/refresh complexity
- Requires DB lookup per request (acceptable — Postgres already in stack)
- Cookie-based, same-origin — no cross-domain JWT headaches

## Alternatives considered
- **Stateless JWT**: No DB lookup, but requires refresh token rotation, can't revoke without blocklist (which needs DB anyway). Overkill for single-origin web app.
