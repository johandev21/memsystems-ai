import { correlationStorage } from "./correlation";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "DEBUG";

function isValidLogLevel(value: string): value is LogLevel {
  return value in LOG_LEVELS;
}

const resolvedLevel: LogLevel = isValidLogLevel(currentLevel)
  ? currentLevel
  : "DEBUG";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ErrorShape = {
  name: string;
  message: string;
  stack?: string;
  cause?: ErrorShape;
};

function toErrorShape(error: Error): ErrorShape {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause instanceof Error ? toErrorShape(error.cause) : undefined,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeMeta(
  meta: Record<string, unknown>,
): Record<string, JsonValue> {
  const sanitized: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value instanceof Error) {
      sanitized[key] = toErrorShape(value);
    } else if (isObject(value)) {
      sanitized[key] = sanitizeMeta(value);
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    } else {
      sanitized[key] = String(value);
    }
  }
  return sanitized;
}

export class Logger {
  constructor(private readonly bindings: Record<string, JsonValue> = {}) {}

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[resolvedLevel];
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write("DEBUG", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("INFO", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("WARN", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write("ERROR", message, meta);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new Logger({
      ...this.bindings,
      ...sanitizeMeta(bindings),
    });
  }

  private write(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) return;

    let correlationId: string | undefined;
    try {
      const store = correlationStorage.getStore();
      if (store?.correlationId) correlationId = store.correlationId;
    } catch {
      // AsyncLocalStorage unavailable in non-Node runtimes — fall through.
    }

    const entry: Record<string, JsonValue> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: "memsystems-api",
      ...(correlationId ? { correlationId } : {}),
      ...this.bindings,
    };

    if (meta) {
      const sanitized = sanitizeMeta(meta);
      for (const [key, value] of Object.entries(sanitized)) {
        entry[key] = value;
      }
    }

    const output = `${JSON.stringify(entry)}\n`;

    if (level === "ERROR") {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  }
}

export const logger = new Logger();
