type LogLevel = "info" | "warn" | "error" | "debug";

interface LogMeta {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: LogMeta) {
    const timestamp = new Date().toISOString();
    const metaString = meta && Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  info(message: string, meta?: LogMeta) {
    console.log(this.formatMessage("info", message, meta));
  }

  warn(message: string, meta?: LogMeta) {
    console.warn(this.formatMessage("warn", message, meta));
  }

  error(message: string, error?: Error | unknown, meta?: LogMeta) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
    console.error(this.formatMessage("error", message, errorDetails));
  }

  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
