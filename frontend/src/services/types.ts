/**
 * Shared service types for the frontend CRUD helpers.
 * Keep these small and serializable so UI code can easily consume results.
 */
export type CrudError = {
  // Always-present human-readable message
  message: string;

  // Optional short error code (from Supabase/Postgres/Auth)
  // Example: "23505" for unique constraint violation
  code?: string;

  // Optional HTTP-like status code, e.g. 400, 401, 500
  // Sometimes missing, so can be number | null
  status?: number | null;
};

// Generic result wrapper for all CRUD helpers
export type Result<T> = {
  // The returned data (type T) — null if there was an error or no result
  data: T | null;

  // Standardized error object — null if the operation succeeded
  error: CrudError | null;

  // Optional HTTP-like status code (e.g., 200, 400, 500)
  // Supabase doesn’t always provide this, so it’s nullable and optional
  status?: number | null;
};

// Defines how results should be ordered (sorted)
export type OrderOption = {
  column: string; // Column name to sort by
  ascending?: boolean; // Optional: true = ascending (default), false = descending
};

// Supported filter operators for querying Supabase tables
export type FilterOptions = {
  // Equal to: e.g. { eq: { user_id: '123', is_active: true } }
  eq?: Record<string, string | number | boolean | null>;

  // Not equal to
  neq?: Record<string, string | number | boolean | null>;

  // Case-sensitive pattern matching (SQL LIKE)
  // Example: { like: { name: 'Alex%' } }
  like?: Record<string, string>;

  // Case-insensitive pattern matching (SQL ILIKE)
  // Example: { ilike: { email: '%@gmail.com' } }
  ilike?: Record<string, string>;

  // “IN” operator (value must be in array)
  // Example: { in: { role: ['admin', 'user'] } }
  in?: Record<string, Array<string | number>>;
};

// Extended options type for listing/fetching rows
// Combines all FilterOptions (eq, neq, like, etc.) with
// ordering, pagination, and single-row control.
export type ListOptions = FilterOptions & {
  order?: OrderOption; // Sort results by a column (ascending/descending)
  limit?: number; // Limit how many rows are returned (Supabase .limit())
  offset?: number; // Skip a number of rows before starting (Supabase .range())
  single?: boolean; // If true, return only one row using maybeSingle()
};
