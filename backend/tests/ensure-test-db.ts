import dotenv from "dotenv";
import { ensureTestDatabase } from "./db";

dotenv.config({ path: ".env.test" });

async function main() {
  console.log("Setting up test database...");
  await ensureTestDatabase();
  console.log("Test database ready.");
}

main().catch((err) => {
  console.error("Failed to setup test database:", err);
  process.exit(1);
});
