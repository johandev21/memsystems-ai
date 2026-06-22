import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach } from "vitest";
import { ensureTestDatabase, resetDatabase } from "./db";

// Quiet the service logger during tests (it writes JSON lines to stdout).
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = "ERROR";

beforeAll(async () => {
  await ensureTestDatabase();
}, 30_000);

beforeEach(async () => {
  await resetDatabase();
});
