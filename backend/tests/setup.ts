import { beforeAll, beforeEach } from 'vitest';
import { ensureTestDatabase, resetDatabase } from './db';

if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = 'ERROR';

beforeAll(async () => {
  await ensureTestDatabase();
}, 30_000);

beforeEach(async () => {
  await resetDatabase();
});
