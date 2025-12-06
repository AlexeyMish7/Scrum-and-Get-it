/**
 * SUPABASE LOG TYPES
 *
 * Type definitions for the developer-facing Supabase query log panel.
 * Captures database operations for debugging and performance analysis.
 */

export interface SupabaseLogEntry {
  /** Unique identifier for React tracking */
  id: string;
  /** Timestamp (ms since epoch) when the query started */
  timestamp: number;
  /** Duration in milliseconds for the query to complete */
  durationMs: number;
  /** Database operation type */
  operation:
    | "SELECT"
    | "INSERT"
    | "UPDATE"
    | "DELETE"
    | "RPC"
    | "AUTH"
    | "REALTIME";
  /** Table or function name being accessed */
  table: string;
  /** Number of rows affected/returned */
  rowCount?: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Query parameters or filters applied */
  queryParams?: string;
  /** Error message if operation failed */
  error?: string;
  /** PostgreSQL error code if available */
  errorCode?: string;
}
