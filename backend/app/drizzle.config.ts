import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./auth-schema.ts", "./src/database/schema.ts"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
