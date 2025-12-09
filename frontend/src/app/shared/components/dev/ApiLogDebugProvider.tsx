/**
 * API LOG DEBUG PROVIDER
 *
 * Development-only provider that displays API and Supabase calls in a floating panel.
 * Uses the fetch interceptor from fetchInterceptor.ts to capture all HTTP requests.
 *
 * Controlled by:
 * - import.meta.env.DEV (Vite's dev mode)
 * - VITE_DEV_MODE env variable (explicit control)
 *
 * Set VITE_DEV_MODE=false to hide dev tools even in dev mode.
 */
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { ApiLogEntry, SupabaseLogEntry } from "@shared/types";
import { DevLogPanel } from "./DevLogPanel";
import { setFetchLogCallback, type FetchLogEntry } from "@/fetchInterceptor";
import { parseSupabaseRequest } from "./supabaseLogger";

const MAX_LOG_ENTRIES = 80;

// Check if dev tools should be shown
// Must be in Vite dev mode AND have VITE_DEV_MODE=true (or not set)
const isDevToolsEnabled = () => {
  const viteDevMode = import.meta.env.DEV;
  const explicitDevMode = import.meta.env.VITE_DEV_MODE;

  // If VITE_DEV_MODE is explicitly set to "false", hide dev tools
  if (explicitDevMode === "false") return false;

  // Otherwise, show if in Vite dev mode
  return viteDevMode;
};

export function ApiLogDebugProvider({ children }: { children: ReactNode }) {
  const shouldInstrument = isDevToolsEnabled();
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [supabaseLogs, setSupabaseLogs] = useState<SupabaseLogEntry[]>([]);

  // Connect to the fetch interceptor
  useEffect(() => {
    if (!shouldInstrument) return;

    // Handle incoming fetch logs
    const handleFetchLog = (entry: FetchLogEntry) => {
      if (entry.isSupabase) {
        // Parse Supabase request and create SupabaseLogEntry
        const parsed = parseSupabaseRequest(
          entry.url,
          entry.method,
          entry.requestBody
        );

        if (parsed) {
          // Try to get row count from response
          let rowCount: number | undefined;
          if (entry.responseBody) {
            try {
              const data = JSON.parse(entry.responseBody);
              if (Array.isArray(data)) {
                rowCount = data.length;
              } else if (data && typeof data === "object") {
                rowCount = 1;
              }
            } catch {
              // Ignore parse errors
            }
          }

          // Extract error from response if failed
          let errorMsg: string | undefined;
          let errorCode: string | undefined;
          if (!entry.success && entry.responseBody) {
            try {
              const data = JSON.parse(entry.responseBody);
              errorMsg = data.message || data.error || data.msg;
              errorCode = data.code;
            } catch {
              errorMsg = entry.error || `HTTP ${entry.status}`;
            }
          }

          const supabaseEntry: SupabaseLogEntry = {
            id: entry.id,
            timestamp: entry.timestamp,
            durationMs: entry.durationMs,
            operation: parsed.operation,
            table: parsed.table,
            rowCount,
            success: entry.success,
            queryParams: parsed.queryParams,
            error: errorMsg || entry.error,
            errorCode,
          };

          setSupabaseLogs((prev) => {
            const next = [supabaseEntry, ...prev];
            return next.slice(0, MAX_LOG_ENTRIES);
          });
        }
      } else {
        // Regular API call
        const apiEntry: ApiLogEntry = {
          id: entry.id,
          timestamp: entry.timestamp,
          durationMs: entry.durationMs,
          method: entry.method,
          url: entry.url,
          status: entry.status,
          success: entry.success,
          requestBody: entry.requestBody,
          responseBody: entry.responseBody,
          error: entry.error,
        };

        setApiLogs((prev) => {
          const next = [apiEntry, ...prev];
          return next.slice(0, MAX_LOG_ENTRIES);
        });
      }
    };

    setFetchLogCallback(handleFetchLog);

    return () => {
      setFetchLogCallback(null);
    };
  }, [shouldInstrument]);

  if (!shouldInstrument) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <DevLogPanel
        apiLogs={apiLogs}
        supabaseLogs={supabaseLogs}
        onClearApi={() => setApiLogs([])}
        onClearSupabase={() => setSupabaseLogs([])}
      />
    </>
  );
}
