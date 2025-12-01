/**
 * Enhanced structured logger for comprehensive observability.
 *
 * FEATURES:
 * - Request correlation IDs for tracing requests across services
 * - User context tracking for debugging user-specific issues
 * - Performance metrics and timing
 * - Error context preservation with stack traces
 * - Log level filtering based on environment
 * - Structured fields for easy querying in log aggregation tools
 *
 * USAGE:
 * - Route handlers: Use createRequestLogger() for request-scoped logging
 * - Services: Use contextual methods with user/operation context
 * - Performance: Use timer utilities for measuring operations
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = {
  requestId?: string;
  userId?: string;
  operation?: string;
  userAgent?: string;
  ip?: string;
};

// Configuration from environment
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Get current ISO timestamp */
export function nowIso() {
  return new Date().toISOString();
}

/** Generate a short request correlation ID */
export function genRequestId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Check if log level should be output */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

/** Core logging function with structured output */
function writeLog(
  level: LogLevel,
  message: string,
  fields: Record<string, unknown> = {},
  context: LogContext = {}
) {
  if (!shouldLog(level)) return;

  const logEntry: Record<string, unknown> = {
    level,
    ts: nowIso(),
    msg: message,
    ...context,
    ...fields,
  };

  // Remove undefined values for cleaner logs
  Object.keys(logEntry).forEach((key) => {
    if (logEntry[key] === undefined) {
      delete logEntry[key];
    }
  });

  const output = JSON.stringify(logEntry);

  // Enable colors only in TTY and non-test environments
  const ENABLE_COLOR =
    process.env.NODE_ENV !== "test" &&
    typeof process !== "undefined" &&
    !!(process.stdout && (process.stdout as any).isTTY);
  // ANSI color codes for better visibility
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    gray: "\x1b[90m",
  };

  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(ENABLE_COLOR ? colors.red + output + colors.reset : output);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.log(ENABLE_COLOR ? colors.yellow + output + colors.reset : output);
  } else {
    // eslint-disable-next-line no-console
    console.log(output);
  }
}

/** Log debug information (development only) */
export function logDebug(
  message: string,
  fields: Record<string, unknown> = {},
  context: LogContext = {}
) {
  writeLog("debug", message, fields, context);
}

/** Log informational events */
export function logInfo(
  message: string,
  fields: Record<string, unknown> = {},
  context: LogContext = {}
) {
  writeLog("info", message, fields, context);
}

/** Log warning conditions */
export function logWarn(
  message: string,
  fields: Record<string, unknown> = {},
  context: LogContext = {}
) {
  writeLog("warn", message, fields, context);
}

/** Log error events with full context */
export function logError(
  message: string,
  error?: Error | unknown,
  fields: Record<string, unknown> = {},
  context: LogContext = {}
) {
  const errorFields = { ...fields };

  if (error instanceof Error) {
    errorFields.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    errorFields.error = error;
  }

  writeLog("error", message, errorFields, context);
}

/** Performance timer utility */
export class Timer {
  private startTime: number;
  private operation: string;
  private context: LogContext;

  constructor(operation: string, context: LogContext = {}) {
    this.startTime = Date.now();
    this.operation = operation;
    this.context = context;

    logDebug(`Started ${operation}`, {}, context);
  }

  /** Complete timer and log duration */
  end(fields: Record<string, unknown> = {}) {
    const duration = Date.now() - this.startTime;

    logInfo(
      `Completed ${this.operation}`,
      {
        duration_ms: duration,
        performance:
          duration > 5000 ? "slow" : duration > 1000 ? "normal" : "fast",
        ...fields,
      },
      this.context
    );

    return duration;
  }

  /** Mark a checkpoint without ending the timer */
  checkpoint(label: string, fields: Record<string, unknown> = {}) {
    const elapsed = Date.now() - this.startTime;

    logDebug(
      `${this.operation} checkpoint: ${label}`,
      {
        elapsed_ms: elapsed,
        ...fields,
      },
      this.context
    );
  }
}

/** Request-scoped logger with automatic context */
export class RequestLogger {
  private context: LogContext;

  constructor(requestId: string, initialContext: Partial<LogContext> = {}) {
    this.context = { requestId, ...initialContext };
  }

  /** Update context for this request */
  setContext(updates: Partial<LogContext>) {
    this.context = { ...this.context, ...updates };
  }

  /** Get current context */
  getContext(): LogContext {
    return { ...this.context };
  }

  debug(message: string, fields: Record<string, unknown> = {}) {
    logDebug(message, fields, this.context);
  }

  info(message: string, fields: Record<string, unknown> = {}) {
    logInfo(message, fields, this.context);
  }

  warn(message: string, fields: Record<string, unknown> = {}) {
    logWarn(message, fields, this.context);
  }

  error(
    message: string,
    error?: Error | unknown,
    fields: Record<string, unknown> = {}
  ) {
    logError(message, error, fields, this.context);
  }

  /** Create a timer scoped to this request */
  timer(operation: string) {
    return new Timer(operation, this.context);
  }

  /** Log API request start */
  requestStart(
    method: string,
    path: string,
    fields: Record<string, unknown> = {}
  ) {
    this.info(`${method} ${path} - START`, {
      http_method: method,
      http_path: path,
      ...fields,
    });
  }

  /** Log API request completion */
  requestEnd(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    fields: Record<string, unknown> = {}
  ) {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    const message = `${method} ${path} - ${statusCode}`;

    const logFields = {
      http_method: method,
      http_path: path,
      http_status: statusCode,
      duration_ms: duration,
      status_class:
        statusCode >= 500
          ? "server_error"
          : statusCode >= 400
          ? "client_error"
          : "success",
      ...fields,
    };

    if (level === "error") {
      this.error(message, undefined, logFields);
    } else if (level === "warn") {
      this.warn(message, logFields);
    } else {
      this.info(message, logFields);
    }
  }

  /** Log authentication event */
  authEvent(
    event: "login" | "logout" | "failed" | "token_refresh",
    fields: Record<string, unknown> = {}
  ) {
    this.info(`Auth: ${event}`, {
      auth_event: event,
      ...fields,
    });
  }

  /** Log database operation */
  dbOperation(
    operation: string,
    table: string,
    duration?: number,
    fields: Record<string, unknown> = {}
  ) {
    this.debug(`DB: ${operation} ${table}`, {
      db_operation: operation,
      db_table: table,
      duration_ms: duration,
      ...fields,
    });
  }

  /** Log AI/external service call */
  externalCall(
    service: string,
    operation: string,
    duration?: number,
    fields: Record<string, unknown> = {}
  ) {
    this.info(`External: ${service}.${operation}`, {
      external_service: service,
      external_operation: operation,
      duration_ms: duration,
      ...fields,
    });
  }
}

/** Create a request-scoped logger */
export function createRequestLogger(req?: any): RequestLogger {
  const requestId = genRequestId();
  const context: Partial<LogContext> = {};

  if (req) {
    context.userAgent = req.headers?.["user-agent"];
    context.ip =
      req.headers?.["x-forwarded-for"] || req.connection?.remoteAddress;

    // Extract user ID if available (assumes it's been set by auth middleware)
    if (req.userId) {
      context.userId = req.userId;
    }
  }

  return new RequestLogger(requestId, context);
}

/** Global timer for standalone operations */
export function startTimer(operation: string, context: LogContext = {}) {
  return new Timer(operation, context);
}

/** Log application startup/shutdown events */
export function logSystemEvent(
  event: "startup" | "shutdown" | "health_check",
  fields: Record<string, unknown> = {}
) {
  logInfo(`System: ${event}`, {
    system_event: event,
    ...fields,
  });
}

/** Log configuration validation */
export function logConfigEvent(
  event: "loaded" | "invalid" | "missing",
  config: string,
  fields: Record<string, unknown> = {}
) {
  const level = event === "invalid" || event === "missing" ? "warn" : "info";
  const message = `Config: ${config} ${event}`;

  if (level === "warn") {
    logWarn(message, { config_item: config, config_event: event, ...fields });
  } else {
    logInfo(message, { config_item: config, config_event: event, ...fields });
  }
}

// Legacy compatibility exports
export { logInfo as legacyLogInfo, logError as legacyLogError };
