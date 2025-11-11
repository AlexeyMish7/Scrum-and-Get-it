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
 * (userId parameter kept for API compatibility but not used in JWT auth)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // First try to get the current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      throw new Error("Authentication session expired. Please log in again.");
    }

    if (session?.access_token) {
      // Primary auth method: JWT token
      return {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      };
    } else {
      // No session - require user to log in
      throw new Error("No authentication session found. Please log in again.");
    }
  } catch (err) {
    // Don't silently fall back - authentication is required
    console.error("⚠️ Authentication error:", err);
    throw err instanceof Error ? err : new Error("Authentication failed");
  }
}

async function postJson<T>(
  path: string,
  body: unknown,
  _userId: string // Kept for API compatibility, auth via JWT
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  try {
    const headers = await getAuthHeaders();

    console.log(`🚀 POST ${url}`, {
      body,
      headers: { ...headers, Authorization: "***" },
    });

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    let data: unknown = null;
    try {
      data = await resp.json();
      console.log(`✅ Response ${resp.status}:`, data);
    } catch {
      // ignore json parse error; will throw below if not ok
      console.warn(`⚠️ Failed to parse JSON response`);
    }

    if (!resp.ok) {
      const anyData = data as Record<string, unknown> | null;
      let message =
        (anyData?.message as string) ||
        (anyData?.error as string) ||
        `Request failed (${resp.status})`;

      // Handle authentication errors specifically
      if (resp.status === 401 || resp.status === 403) {
        message = "Authentication failed. Please log in again.";
      }

      const error = new Error(message) as Error & {
        status?: number;
        payload?: unknown;
      };
      error.status = resp.status;
      error.payload = data;
      throw error;
    }
    return data as T;
  } catch (err) {
    // Re-throw authentication errors with clear message
    if (err instanceof Error && err.message.includes("Authentication")) {
      throw err;
    }
    throw err;
  }
}

async function getJson<T>(
  path: string,
  _userId: string // Kept for API compatibility, auth via JWT
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  try {
    const headers = await getAuthHeaders();

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
      let message =
        (anyData?.message as string) ||
        (anyData?.error as string) ||
        `Request failed (${resp.status})`;

      // Handle authentication errors specifically
      if (resp.status === 401 || resp.status === 403) {
        message = "Authentication failed. Please log in again.";
      }

      const error = new Error(message) as Error & {
        status?: number;
        payload?: unknown;
      };
      error.status = resp.status;
      error.payload = data;
      throw error;
    }
    return data as T;
  } catch (err) {
    // Re-throw authentication errors with clear message
    if (err instanceof Error && err.message.includes("Authentication")) {
      throw err;
    }
    throw err;
  }
}

export const aiClient = { postJson, getJson };

export default aiClient;
