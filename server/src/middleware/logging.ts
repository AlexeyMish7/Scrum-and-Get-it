/**
 * Request Logging Middleware
 *
 * Provides request/response logging with timing and structured metadata.
 * Wraps the existing logger utility with middleware-style helpers.
 *
 * Flow:
 * - Creates request logger instance
 * - Tracks request start time
 * - Provides helper to log completion with duration
 *
 * Usage:
 *   const { logger, logComplete } = createRequestContext(req);
 *   logger.requestStart(method, path);
 *   // ... handle request ...
 *   logComplete(method, path, statusCode);
 */

import type { IncomingMessage } from "node:http";
import { createRequestLogger } from "../../utils/logger.js";

export interface RequestContext {
  /** Request logger instance with requestId */
  logger: ReturnType<typeof createRequestLogger>;
  /** Request ID for tracing */
  reqId: string;
  /** Request start timestamp (ms) */
  startTime: number;
  /** Helper to log request completion with duration */
  logComplete: (
    method: string | undefined,
    path: string,
    status: number
  ) => void;
}

/**
 * Create request logging context
 *
 * Returns logger instance and helper to log completion.
 *
 * Usage:
 *   const { logger, logComplete } = createRequestContext(req);
 *   logger.requestStart(method, path);
 *   // ... process request ...
 *   logComplete(method, path, 200);
 */
export function createRequestContext(req: IncomingMessage): RequestContext {
  const logger = createRequestLogger(req);
  const startTime = Date.now();
  const reqId = logger.getContext().requestId || "unknown";

  return {
    logger,
    reqId,
    startTime,
    logComplete: (method: string | undefined, path: string, status: number) => {
      const duration = Date.now() - startTime;
      logger.requestEnd(method || "UNKNOWN", path, status, duration);
    },
  };
}

/**
 * Measure request duration from a start timestamp
 *
 * Usage:
 *   const startTime = Date.now();
 *   // ... process request ...
 *   const duration = getDuration(startTime);
 */
export function getDuration(startTime: number): number {
  return Date.now() - startTime;
}
