import { sql } from 'drizzle-orm';
import { Client } from 'pg';
import { createDatabaseConnection } from '../src/database/connection';

const { db } = createDatabaseConnection(process.env.DATABASE_URL);

export { db };

const TABLES = [
  'notebook_chat_messages',
  'generation_requests',
  'source_chunks',
  'source_index_jobs',
  'study_materials',
  'study_material_folders',
  'sources',
  'notebooks',
  'user_settings',
  'verification',
  'account',
  'session',
  'user',
];

export async function resetDatabase(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`));
}

export async function ensureTestDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set — ensure .env.test exists and is loaded',
    );
  }
  const name = new URL(url).pathname.slice(1);
  if (!name) throw new Error(`Could not extract database name from ${url}`);
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe test database name: ${name}`);
  }

  const u = new URL(url);
  u.pathname = '/postgres';
  const client = new Client({ connectionString: u.toString() });
  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }

  const pgClient = new Client({ connectionString: url });
  try {
    await pgClient.connect();
    await pgClient.query('CREATE EXTENSION IF NOT EXISTS vector');
  } finally {
    await pgClient.end();
  }
}
