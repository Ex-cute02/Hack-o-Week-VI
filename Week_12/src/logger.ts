type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  trace_id?: string;
  [key: string]: unknown;
}

class Logger {
  private write(
    level: LogLevel,
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    const line = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write("error", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === "debug") {
      this.write("debug", message, meta);
    }
  }
}

export const logger = new Logger();
