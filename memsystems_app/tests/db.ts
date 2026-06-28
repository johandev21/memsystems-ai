import { sql } from "drizzle-orm";
import { Client } from "pg";

import { db } from "@/database/connection";

export { db };

// All tables across the auth + app schemas. Order is irrelevant with CASCADE.
const TABLES = [
  "note_tags",
  "tags",
  "cards",
  "notes",
  "note_types",
  "notebook_chat_messages",
  "generation_requests",
  "source_chunks",
  "study_materials",
  "study_material_folders",
  "sources",
  "notebooks",
  "user_settings",
  "verification",
  "account",
  "session",
  "user",
];

/** Wipe every table so each test starts from a clean database. */
export async function resetDatabase(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`));
}

/**
 * Create the test database if it doesn't exist.
 * Safe to call before every test run. Does NOT touch schema.
 * Reads DATABASE_URL from process.env (set via .env.test loaded by vitest.config.ts).
 */
export async function ensureTestDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — ensure .env.test exists and is loaded",
    );
  }
  const name = new URL(url).pathname.slice(1);
  if (!name) throw new Error(`Could not extract database name from ${url}`);
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe test database name: ${name}`);
  }

  const u = new URL(url);
  u.pathname = "/postgres";
  const client = new Client({ connectionString: u.toString() });
  try {
    await client.connect();
    const { rows } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }

  // Ensure pgvector extension is available (installed by postgres)
  const pgClient = new Client({ connectionString: url });
  try {
    await pgClient.connect();
    await pgClient.query("CREATE EXTENSION IF NOT EXISTS vector");
  } finally {
    await pgClient.end();
  }
}
