import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/database/auth-schema.ts", "./src/database/schema.ts"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
