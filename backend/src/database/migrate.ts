import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

config();
config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Cannot run migrations.');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  await migrate(db, { migrationsFolder: 'drizzle' });
  await pool.end();
  console.log('Database migrations applied.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
