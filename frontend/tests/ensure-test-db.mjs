import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test" });

const DEFAULT_DB = "postgres";

function maintenanceUrl(testUrl) {
  const u = new URL(testUrl);
  u.pathname = `/${DEFAULT_DB}`;
  return u.toString();
}

function testDbName(testUrl) {
  const name = new URL(testUrl).pathname.slice(1);
  if (!name) throw new Error("DATABASE_URL must include a database name");
  return name;
}

async function ensureTestDatabase(testUrl = process.env.DATABASE_URL) {
  if (!testUrl) throw new Error("DATABASE_URL is not set (check .env.test)");
  const name = testDbName(testUrl);
  const client = new pg.Client({ connectionString: maintenanceUrl(testUrl) });
  try {
    await client.connect();
    const { rows } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );
    if (rows.length === 0) {
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        throw new Error(`Unsafe test database name: ${name}`);
      }
      await client.query(`CREATE DATABASE "${name}"`);
      console.log(`[ensure-test-db] created database "${name}"`);
    } else {
      console.log(`[ensure-test-db] database "${name}" already exists`);
    }
  } finally {
    await client.end();
  }
  return name;
}

function pushSchema() {
  console.log("[ensure-test-db] running drizzle-kit push ...");
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "drizzle-kit", "push", "--force"],
    { stdio: "inherit", env: process.env, shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    throw new Error(`drizzle-kit push exited with status ${result.status}`);
  }
}

await ensureTestDatabase();
pushSchema();
console.log("[ensure-test-db] done");
