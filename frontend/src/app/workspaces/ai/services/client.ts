/**
 * AI Service Client (frontend)
 * Small fetch wrapper for the backend AI orchestrator endpoints.
 *
 * Inputs:
 *  - path: string (endpoint path)
 *  - body: object (request payload)
 *  - userId: string (for service identification; actual auth via JWT)
 * Output:
 *  - JSON parsed response or throws with normalized error
 */

import { supabase } from "@shared/services/supabaseClient";

const BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8787";

/**
 * Get Authorization header with current Supabase session token.
 * Falls back to X-User-Id for development when ALLOW_DEV_AUTH is enabled on server.
 */
async function getAuthHeaders(userId: string): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Primary auth method: JWT token
      return {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      };
    } else {
      // Fallback for development (requires ALLOW_DEV_AUTH=true on server)
      console.warn(
        "⚠️  No session token, falling back to X-User-Id (dev only)"
      );
      return {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      };
    }
  } catch (err) {
    console.warn("⚠️  Session error, falling back to X-User-Id:", err);
    return {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    };
  }
}

async function postJson<T>(
  path: string,
  body: unknown,
  userId: string
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = await getAuthHeaders(userId);

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });
  let data: unknown = null;
  try {
    data = await resp.json();
  } catch {
    // ignore json parse error; will throw below if not ok
  }
  if (!resp.ok) {
    const anyData = data as Record<string, unknown> | null;
    const message =
      (anyData?.message as string) ||
      (anyData?.error as string) ||
      `Request failed (${resp.status})`;
    const error = new Error(message) as Error & {
      status?: number;
      payload?: unknown;
    };
    error.status = resp.status;
    error.payload = data;
    throw error;
  }
  return data as T;
}

async function getJson<T>(path: string, userId: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = await getAuthHeaders(userId);

  const resp = await fetch(url, {
    method: "GET",
    headers,
  });
  let data: unknown = null;
  try {
    data = await resp.json();
  } catch {
    // ignore parse errors; will handle via resp.ok
  }
  if (!resp.ok) {
    const anyData = data as Record<string, unknown> | null;
    const message =
      (anyData?.message as string) ||
      (anyData?.error as string) ||
      `Request failed (${resp.status})`;
    const error = new Error(message) as Error & {
      status?: number;
      payload?: unknown;
    };
    error.status = resp.status;
    error.payload = data;
    throw error;
  }
  return data as T;
}

export const aiClient = { postJson, getJson };

export default aiClient;
