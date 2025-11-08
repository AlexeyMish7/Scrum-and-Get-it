/**
 * Simple structured logger (JSON lines) for server-side observability.
 * Consumed by: src/index.ts route handlers for success/failure events.
 * - Adds timestamps
 * - Supports requestId correlation
 */
export function nowIso() {
  return new Date().toISOString();
}

/** Log an informational event */
export function logInfo(message: string, fields: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({ level: "info", ts: nowIso(), msg: message, ...fields })
  );
}

/** Log an error event */
export function logError(
  message: string,
  fields: Record<string, unknown> = {}
) {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({ level: "error", ts: nowIso(), msg: message, ...fields })
  );
}

/** Generate a short request correlation id */
export function genRequestId() {
  return Math.random().toString(36).slice(2, 10);
}
