/**
 * HTTP UTILITIES
 *
 * WHAT: Shared helpers for HTTP request/response handling
 * WHY: Centralize common patterns used across all route handlers
 *
 * Functions:
 * - readJson: Parse JSON request body with proper error handling
 * - sendJson: Send JSON response with CORS headers and correct Content-Length
 *
 * Usage:
 * import { readJson, sendJson } from "../../utils/http.js";
 * const body = await readJson(req);
 * sendJson(res, 200, { data: "response" });
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { getCorsHeaders } from "../src/middleware/cors.js";

/**
 * Read and parse JSON body from HTTP request
 *
 * WHAT: Safely reads request body stream and parses JSON
 * WHY: Avoid code duplication across route handlers
 *
 * Inputs:
 * - req: IncomingMessage - HTTP request object
 *
 * Outputs:
 * - Promise<unknown> - Parsed JSON data (caller must validate/cast)
 * - Rejects with Error if JSON parsing fails
 *
 * Error modes:
 * - Malformed JSON → throws SyntaxError
 * - Request error → throws Error from stream
 * - Empty body → returns empty object {}
 *
 * Example:
 * try {
 *   const body = await readJson(req);
 *   const { jobId, options } = body as { jobId: number; options?: unknown };
 *   // ... use validated data
 * } catch (err) {
 *   throw new ApiError(400, "Invalid JSON body", "bad_json");
 * }
 */
export async function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      // Empty body → return empty object
      if (!data || data.trim().length === 0) {
        return resolve({});
      }

      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        // JSON parsing failed
        reject(err instanceof Error ? err : new Error("JSON parse error"));
      }
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Send JSON response with proper headers
 *
 * WHAT: Serialize data to JSON and send with correct Content-Type, Content-Length, CORS
 * WHY: Ensure consistent response format and header handling across all endpoints
 *
 * Inputs:
 * - res: ServerResponse - HTTP response object
 * - statusCode: number - HTTP status code (200, 201, 400, 500, etc.)
 * - payload: unknown - Data to serialize (must be JSON-serializable)
 *
 * Outputs:
 * - void (ends the response stream)
 *
 * Error modes:
 * - Non-serializable payload → throws TypeError from JSON.stringify
 *
 * Example:
 * sendJson(res, 200, { data: artifacts, count: 10 });
 * sendJson(res, 400, { error: "Missing required field" });
 * sendJson(res, 201, { id: "uuid", created_at: "2025-11-07T..." });
 */
export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  const bodyStr = JSON.stringify(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr).toString(),
    ...getCorsHeaders(),
  });

  res.end(bodyStr);
}
