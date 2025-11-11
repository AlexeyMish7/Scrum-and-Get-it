/**
 * Authentication Middleware
 *
 * Handles user authentication via Authorization header or X-User-Id header (dev mode).
 * Wraps the extractUserId utility from utils/auth.ts.
 *
 * Flow:
 * - Check Authorization header for JWT token
 * - Fallback to X-User-Id header in dev mode (if ALLOW_DEV_AUTH=true)
 * - Throw ApiError(401) if authentication fails
 *
 * Usage:
 *   const userId = await requireAuth(req);
 *   // userId is guaranteed to be a valid string here
 */

import type { IncomingMessage } from "node:http";
import { extractUserId } from "../../utils/auth.js";
import { ApiError } from "../../utils/errors.js";

/**
 * Require authentication and return userId
 *
 * Throws ApiError(401) if authentication fails.
 *
 * Inputs:
 * - req.headers.authorization: JWT Bearer token
 * - req.headers['x-user-id']: Dev-mode user ID (requires ALLOW_DEV_AUTH=true)
 *
 * Outputs:
 * - userId: Authenticated user ID string
 *
 * Errors:
 * - ApiError(401, message, "auth_failed") if no valid auth found
 *
 * Usage:
 *   try {
 *     const userId = await requireAuth(req);
 *     // ... proceed with authenticated request ...
 *   } catch (err) {
 *     // err is ApiError with status 401
 *   }
 */
export async function requireAuth(req: IncomingMessage): Promise<string> {
  try {
    const userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
    return userId;
  } catch (err: any) {
    throw new ApiError(
      401,
      err.message || "Authentication failed",
      "auth_failed"
    );
  }
}

/**
 * Try to extract userId without throwing
 *
 * Returns userId or null if authentication fails.
 * Useful for optional authentication scenarios.
 *
 * Usage:
 *   const userId = await tryAuth(req);
 *   if (userId) {
 *     // ... authenticated flow ...
 *   } else {
 *     // ... anonymous flow ...
 *   }
 */
export async function tryAuth(req: IncomingMessage): Promise<string | null> {
  try {
    return await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch {
    return null;
  }
}
