import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/database/schema.ts', './src/database/auth-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
