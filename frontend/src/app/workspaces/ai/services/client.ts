/**
 * AI Service Client (frontend)
 * Small fetch wrapper for the backend AI orchestrator endpoints.
 *
 * Inputs:
 *  - path: string (endpoint path)
 *  - body: object (request payload)
 *  - userId: string (X-User-Id header, until real auth wiring)
 * Output:
 *  - JSON parsed response or throws with normalized error
 */

const BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8787";

async function postJson<T>(
  path: string,
  body: unknown,
  userId: string
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
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
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
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
