export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

function resolveLevel(): LogLevel {
  if (typeof process === "undefined" || !process.env) return "DEBUG";
  const raw = process.env.LOG_LEVEL as LogLevel | undefined;
  if (raw && raw in LOG_LEVELS) return raw;
  return "DEBUG";
}

const currentLevel: LogLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

type Meta = Record<string, unknown>;

function serialize(meta: Meta | undefined): string {
  if (!meta) return "";
  try {
    return JSON.stringify(meta, (_k, v) => {
      if (v instanceof Error) {
        return { name: v.name, message: v.message, stack: v.stack };
      }
      return v;
    });
  } catch {
    return "[unserializable meta]";
  }
}

function emit(level: LogLevel, label: string, message: string, meta?: Meta) {
  if (!shouldLog(level)) return;
  const ts = new Date().toISOString();
  const tail = serialize(meta);
  const line = tail
    ? `[${ts}] [${level}] ${label} ${message} ${tail}`
    : `[${ts}] [${level}] ${label} ${message}`;

  switch (level) {
    case "ERROR":
      console.error(line);
      break;
    case "WARN":
      console.warn(line);
      break;
    case "INFO":
      console.info(line);
      break;
    default:
      console.debug(line);
  }
}

export class ClientLogger {
  constructor(private readonly label: string) {}

  child(bindings: Meta): ClientLogger {
    const suffix = serialize(bindings);
    const next = suffix ? `${this.label} ${suffix}` : this.label;
    return new ClientLogger(next);
  }

  debug(message: string, meta?: Meta): void {
    emit("DEBUG", this.label, message, meta);
  }

  info(message: string, meta?: Meta): void {
    emit("INFO", this.label, message, meta);
  }

  warn(message: string, meta?: Meta): void {
    emit("WARN", this.label, message, meta);
  }

  error(message: string, meta?: Meta): void {
    emit("ERROR", this.label, message, meta);
  }
}

export const clientLogger = new ClientLogger("[client]");
