import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as authSchema from "../../auth-schema";
import * as appSchema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", (client) => {
  client.query("SET timezone = 'UTC'");
});

export const db = drizzle(pool, { schema: { ...authSchema, ...appSchema } });
