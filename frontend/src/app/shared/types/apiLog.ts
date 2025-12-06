/**
 * API LOG TYPES
 *
 * Shared type definitions for the developer-facing API log panel.
 * Each entry captures enough metadata to understand the request/response flow.
 */
export interface ApiLogEntry {
  /** Unique identifier so React can track rows */
  id: string;
  /** Timestamp (ms since epoch) when the request started */
  timestamp: number;
  /** Duration in milliseconds between request start and finish */
  durationMs: number;
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Fully qualified request URL */
  url: string;
  /** HTTP status code (if available) */
  status?: number;
  /** Indicates whether the request succeeded */
  success: boolean;
  /** Serialized body that was sent */
  requestBody?: string;
  /** Serialized response payload */
  responseBody?: string;
  /** Error message when request failed before getting a response */
  error?: string;
}
