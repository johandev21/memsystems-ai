import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

export const fullSchema = { ...authSchema, ...appSchema };

export function createDatabaseConnection(connectionString?: string) {
  const pool = new Pool({
    connectionString: connectionString || process.env.DATABASE_URL,
    onConnect: async (client) => {
      await client.query("SET timezone = 'UTC'");
    },
  });

  const db = drizzle(pool, { schema: fullSchema });
  return { db, pool };
}
