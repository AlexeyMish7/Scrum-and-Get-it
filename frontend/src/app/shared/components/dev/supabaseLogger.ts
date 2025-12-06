/**
 * SUPABASE QUERY LOGGER
 *
 * Intercepts Supabase client operations to log database queries for debugging.
 * Uses a simpler approach by parsing Supabase REST API calls from fetch requests.
 *
 * Usage:
 * - Automatically integrated via DevLogProvider
 * - Captures SELECT, INSERT, UPDATE, DELETE, RPC operations
 * - Shows table name, duration, row count, and errors
 */
import type { SupabaseLogEntry } from "@shared/types";

type LogCallback = (entry: SupabaseLogEntry) => void;

let logCallback: LogCallback | null = null;

/**
 * Generate unique ID for log entries
 */
function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

/**
 * Set the callback for logging Supabase operations
 */
export function setSupabaseLogCallback(callback: LogCallback | null) {
  logCallback = callback;
}

/**
 * Check if a URL is a Supabase REST API call
 * Matches any *.supabase.co domain with /rest/ or /auth/ paths
 */
export function isSupabaseUrl(url: string): boolean {
  // Match any supabase.co subdomain with REST or auth endpoints
  return (
    (url.includes("supabase.co") &&
      (url.includes("/rest/v1") ||
        url.includes("/auth/v1") ||
        url.includes("/auth/"))) ||
    // Also catch realtime connections
    url.includes("supabase.co/realtime")
  );
}

/**
 * Parse Supabase URL to extract table and operation info
 */
export function parseSupabaseRequest(
  url: string,
  method: string,
  requestBody?: string
): {
  table: string;
  operation: SupabaseLogEntry["operation"];
  queryParams?: string;
} | null {
  try {
    const parsed = new URL(url);

    // Handle auth endpoints
    if (parsed.pathname.includes("/auth/")) {
      return {
        table: "auth",
        operation: "AUTH",
        queryParams: parsed.pathname.split("/auth/")[1],
      };
    }

    // Handle REST endpoints
    if (parsed.pathname.includes("/rest/v1/")) {
      const pathParts = parsed.pathname.split("/rest/v1/")[1];
      if (!pathParts) return null;

      // Handle RPC calls
      if (pathParts.startsWith("rpc/")) {
        const fnName = pathParts.replace("rpc/", "").split("?")[0];
        return {
          table: fnName,
          operation: "RPC",
          queryParams: requestBody ? truncate(requestBody, 100) : undefined,
        };
      }

      // Regular table operations
      const table = pathParts.split("?")[0];
      let operation: SupabaseLogEntry["operation"];

      switch (method.toUpperCase()) {
        case "GET":
          operation = "SELECT";
          break;
        case "POST":
          operation = "INSERT";
          break;
        case "PATCH":
          operation = "UPDATE";
          break;
        case "DELETE":
          operation = "DELETE";
          break;
        default:
          operation = "SELECT";
      }

      // Extract query params for debugging
      const select = parsed.searchParams.get("select");
      const filters: string[] = [];

      parsed.searchParams.forEach((value, key) => {
        if (key !== "select" && key !== "apikey") {
          filters.push(`${key}=${truncate(value, 30)}`);
        }
      });

      let queryParams = "";
      if (select) queryParams += `select: ${truncate(select, 50)}`;
      if (filters.length) {
        if (queryParams) queryParams += " | ";
        queryParams += filters.join(", ");
      }

      return { table, operation, queryParams: queryParams || undefined };
    }

    // Handle realtime endpoints
    if (parsed.pathname.includes("/realtime/")) {
      return {
        table: "realtime",
        operation: "REALTIME",
        queryParams: undefined,
      };
    }

    // Fallback for other Supabase URLs - try to extract useful info
    if (url.includes("supabase.co")) {
      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || "unknown";
      return {
        table: lastSegment,
        operation: method.toUpperCase() === "GET" ? "SELECT" : "RPC",
        queryParams: undefined,
      };
    }

    return null;
  } catch (e) {
    console.warn("[DevPanel] Error parsing Supabase URL:", url, e);
    return null;
  }
}

/**
 * Log a Supabase operation from fetch interception
 */
export function logSupabaseFromFetch(
  url: string,
  method: string,
  startTime: number,
  response: { ok: boolean; status: number },
  requestBody?: string,
  responseBody?: string
) {
  if (!logCallback) {
    console.warn("[DevPanel] Supabase log callback not set");
    return;
  }

  const parsed = parseSupabaseRequest(url, method, requestBody);
  if (!parsed) {
    console.warn("[DevPanel] Could not parse Supabase URL:", url);
    return;
  }

  // Try to get row count from response
  let rowCount: number | undefined;
  if (responseBody) {
    try {
      const data = JSON.parse(responseBody);
      if (Array.isArray(data)) {
        rowCount = data.length;
      } else if (data && typeof data === "object") {
        rowCount = 1;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Try to extract error
  let error: string | undefined;
  let errorCode: string | undefined;
  if (!response.ok && responseBody) {
    try {
      const data = JSON.parse(responseBody);
      error = data.message || data.error || data.msg;
      errorCode = data.code;
    } catch {
      error = `HTTP ${response.status}`;
    }
  }

  const durationMs = performance.now() - startTime;

  logCallback({
    id: generateId(),
    timestamp: Date.now(),
    durationMs,
    operation: parsed.operation,
    table: parsed.table,
    rowCount,
    success: response.ok,
    queryParams: parsed.queryParams,
    error,
    errorCode,
  });
}

/**
 * Truncate string for display
 */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

/**
 * Legacy function - kept for API compatibility but no longer needed
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function interceptSupabaseClient(_supabase: unknown): void {
  // No longer needed - we intercept via fetch instead
}

/**
 * Cleanup (for testing)
 */
export function cleanupSupabaseInterceptor() {
  logCallback = null;
}
