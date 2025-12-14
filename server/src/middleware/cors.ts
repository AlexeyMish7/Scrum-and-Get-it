/**
 * CORS Middleware
 *
 * Handles Cross-Origin Resource Sharing (CORS) for API endpoints.
 * Supports preflight OPTIONS requests and sets appropriate headers on responses.
 *
 * Flow:
 * - OPTIONS requests → return 204 with CORS headers
 * - Other requests → headers added via getCorsHeaders() helper
 *
 * Configuration:
 * - CORS_ORIGIN env var (defaults to "*" for development)
 * - Allowed headers: Content-Type, Authorization, X-User-Id
 * - Allowed methods: GET, POST, OPTIONS
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * CORS configuration options
 */
export interface CorsOptions {
  /** Allowed origin (default: process.env.CORS_ORIGIN || "*") */
  origin?: string;
  /** Allowed headers (default: Content-Type, Authorization, X-User-Id) */
  allowedHeaders?: string;
  /** Allowed methods (default: GET,POST,OPTIONS) */
  allowedMethods?: string;
  /** Max age for preflight cache in seconds (default: 86400 = 24h) */
  maxAge?: string;
}

const DEFAULT_OPTIONS: Required<CorsOptions> = {
  origin: process.env.CORS_ORIGIN || "*",
  allowedHeaders: "Content-Type, Authorization, X-User-Id",
  // Frontend uses PATCH/DELETE for some resources; include them to avoid preflight failures.
  allowedMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  maxAge: "86400",
};

/**
 * Get CORS headers object for inclusion in response
 *
 * Usage:
 *   res.writeHead(200, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
 */
export function getCorsHeaders(options?: CorsOptions): Record<string, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return {
    "Access-Control-Allow-Origin": opts.origin,
    "Access-Control-Allow-Headers": opts.allowedHeaders,
    "Access-Control-Allow-Methods": opts.allowedMethods,
  };
}

/**
 * Handle CORS preflight OPTIONS request
 *
 * Returns true if the request was handled (OPTIONS), false otherwise.
 * When true, response has been sent and caller should return immediately.
 *
 * Usage:
 *   if (handleCorsPreFlight(req, res)) return;
 */
export function handleCorsPreflight(
  req: IncomingMessage,
  res: ServerResponse,
  options?: CorsOptions
): boolean {
  if (req.method !== "OPTIONS") {
    return false;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  res.writeHead(204, {
    "Access-Control-Allow-Origin": opts.origin,
    "Access-Control-Allow-Headers": opts.allowedHeaders,
    "Access-Control-Allow-Methods": opts.allowedMethods,
    "Access-Control-Max-Age": opts.maxAge,
  });
  res.end();
  return true;
}
