import path from "node:path";
import dotenv from "dotenv";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Load the test environment before any module that reads DATABASE_URL is imported.
dotenv.config({ path: ".env.test" });

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "threads",
    // Run backend test files sequentially — they share a single test Postgres
    // and parallel file execution can cause cross-test data interference via
    // the shared resetDatabase in tests/setup.ts.
    fileParallelism: false,
  },
});
