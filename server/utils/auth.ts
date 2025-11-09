/**
 * Authentication utilities for validating JWT tokens from Supabase Auth.
 *
 * WHAT: Server-side JWT verification to replace X-User-Id header trust.
 * WHY: The X-User-Id approach allows any client to impersonate any user.
 * INPUT: Authorization header with Bearer token from Supabase session.
 * OUTPUT: Verified user ID or throws authentication error.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for auth verification"
  );
}

// Create a Supabase client with service role for JWT verification
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Extract and verify JWT token from Authorization header.
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer eyJ...")
 * @returns Promise<string> - The verified user ID
 * @throws Error if token is missing, invalid, or expired
 */
export async function verifyAuthToken(
  authHeader: string | undefined
): Promise<string> {
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header must start with 'Bearer '");
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token) {
    throw new Error("Empty token in Authorization header");
  }

  try {
    // Verify the JWT token using Supabase Auth
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }

    if (!user?.id) {
      throw new Error("Token verification returned no user");
    }

    return user.id;
  } catch (err: any) {
    // Re-throw with a consistent error format
    throw new Error(
      `JWT verification failed: ${err.message || "Unknown error"}`
    );
  }
}

/**
 * Fallback auth extraction for development/testing.
 *
 * If ALLOW_DEV_AUTH=true in environment, falls back to X-User-Id header.
 * This should NEVER be enabled in production.
 *
 * @param authHeader - Authorization header
 * @param userIdHeader - X-User-Id header (dev fallback)
 * @returns Promise<string> - The user ID
 */
export async function extractUserId(
  authHeader: string | undefined,
  userIdHeader: string | undefined
): Promise<string> {
  // Check if dev auth fallback is enabled
  const allowDevAuth =
    (process.env.ALLOW_DEV_AUTH || "false").toLowerCase() === "true";

  if (authHeader) {
    // Always try JWT verification first if header is present
    return await verifyAuthToken(authHeader);
  }

  if (allowDevAuth && userIdHeader) {
    // Dev fallback: trust X-User-Id header if explicitly enabled
    console.warn("⚠️  Using X-User-Id fallback auth (dev only)");
    return userIdHeader;
  }

  throw new Error(
    "Authentication required: provide Authorization header with valid JWT token"
  );
}
