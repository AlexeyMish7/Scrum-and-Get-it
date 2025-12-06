/**
 * FETCH INTERCEPTOR (Module-Level)
 *
 * This file MUST be imported before any other modules that use fetch.
 * It installs a global fetch interceptor to log all HTTP requests.
 *
 * Import this at the very top of main.tsx to ensure it runs first.
 */

const MAX_PAYLOAD_LENGTH = 1200;

export type FetchLogEntry = {
  id: string;
  timestamp: number;
  durationMs: number;
  method: string;
  url: string;
  status?: number;
  success: boolean;
  requestBody?: string;
  responseBody?: string;
  error?: string;
  isSupabase: boolean;
};

type FetchLogCallback = (entry: FetchLogEntry) => void;

let logCallback: FetchLogCallback | null = null;

/**
 * Set the callback function that receives all fetch logs
 */
export function setFetchLogCallback(callback: FetchLogCallback | null) {
  logCallback = callback;
}

// Install immediately
if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Extract URL and method
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;

    const method =
      init?.method?.toUpperCase() ??
      (typeof input === "string" || input instanceof URL
        ? "GET"
        : input.method?.toUpperCase() ?? "GET");

    const isSupabase = url.includes("supabase.co");
    const isHealthCheck = url.includes("/api/health");

    const start = Date.now();
    const perfStart = performance.now();

    // Serialize request body (truncate if too long)
    let requestBody: string | undefined;
    if (init?.body) {
      try {
        if (typeof init.body === "string") {
          requestBody =
            init.body.length <= MAX_PAYLOAD_LENGTH
              ? init.body
              : init.body.slice(0, MAX_PAYLOAD_LENGTH) + "...";
        } else {
          requestBody = "[Body]";
        }
      } catch {
        requestBody = "[Error reading body]";
      }
    }

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.max(0, performance.now() - perfStart);

      // Clone response to read body without consuming it
      let responseBody: string | undefined;
      try {
        const text = await response.clone().text();
        responseBody =
          text.length <= MAX_PAYLOAD_LENGTH
            ? text
            : text.slice(0, MAX_PAYLOAD_LENGTH) + "...";
      } catch {
        // Ignore errors reading response
      }

      // Log if callback is set and not a health check
      if (logCallback && !(isHealthCheck && response.ok)) {
        logCallback({
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
          timestamp: start,
          durationMs,
          method,
          url,
          status: response.status,
          success: response.ok,
          requestBody,
          responseBody,
          isSupabase,
        });
      }

      return response;
    } catch (error) {
      const durationMs = Math.max(0, performance.now() - perfStart);

      // Log errors
      if (logCallback) {
        logCallback({
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
          timestamp: start,
          durationMs,
          method,
          url,
          success: false,
          requestBody,
          error: error instanceof Error ? error.message : String(error),
          isSupabase,
        });
      }

      throw error;
    }
  };
}
