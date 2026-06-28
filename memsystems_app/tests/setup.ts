import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach, vi } from "vitest";
import { ensureTestDatabase, resetDatabase } from "./db";

// Quiet the service logger during tests (it writes JSON lines to stdout).
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = "ERROR";

// Mock next-intl to return English translation messages
vi.mock("next-intl", () => {
  const enMessages = require("../messages/en.json");
  return {
    useLocale: () => "en",
    useTranslations: (namespace?: string) => {
      return (key: string, values?: Record<string, any>) => {
        const path = namespace ? `${namespace}.${key}` : key;
        const keys = path.split(".");
        let value = enMessages;
        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            value = undefined;
            break;
          }
        }
        if (typeof value !== "string") {
          return key;
        }
        if (values) {
          let result = value;
          for (const [k, v] of Object.entries(values)) {
            // Support simple replacements and a basic fallback for pluralization formats
            result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
          // Basic cleanup for plural formats if present
          if (result.includes(", plural,")) {
            result = result.replace(/\{[^{}]*, plural, [^{}]*\}/g, "");
          }
          return result;
        }
        return value;
      };
    },
  };
});

beforeAll(async () => {
  await ensureTestDatabase();
}, 30_000);

beforeEach(async () => {
  await resetDatabase();
});

