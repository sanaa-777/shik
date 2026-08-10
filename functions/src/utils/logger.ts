import * as functions from "firebase-functions";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  AUDIT = "AUDIT",
}

interface LogEntry {
  severity: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Structured logger for audit trail and debugging.
 * Outputs JSON-formatted log entries for Cloud Logging.
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(severity: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      ...meta,
    };

    const serialized = JSON.stringify(entry);

    switch (severity) {
      case LogLevel.DEBUG:
        functions.logger.debug(serialized);
        break;
      case LogLevel.INFO:
        functions.logger.info(serialized);
        break;
      case LogLevel.WARN:
        functions.logger.warn(serialized);
        break;
      case LogLevel.ERROR:
        functions.logger.error(serialized);
        break;
      case LogLevel.AUDIT:
        // Audit logs go to both logger and Firestore via caller
        functions.logger.info(serialized);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  /**
   * Audit-level log for compliance-sensitive operations.
   * Use for: transfers, role changes, reversals, balance modifications.
   */
  audit(
    action: string,
    actorId: string,
    details: Record<string, unknown>
  ): void {
    this.log(LogLevel.AUDIT, action, {
      auditAction: action,
      actorId,
      ...details,
    });
  }
}

/**
 * Create a logger instance for a given Cloud Function context.
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
