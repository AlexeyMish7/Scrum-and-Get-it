/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "./supabaseClient";
import type { Result, ListOptions, FilterOptions } from "./types";

// Helper to map Supabase/JS errors into our standard CrudError shape
function mapSupabaseError(err: unknown): Result<null>["error"] {
  if (!err) return null; // No error present → return null so callers can check `if (res.error)`
  const e = err as any; // Loosely cast to read common fields without TS noise

  // Always return a consistent, UI-friendly object
  return {
    message: e?.message ?? String(e), // Prefer the provided message; otherwise stringify the error
    code: e?.code ?? undefined, // Optional short code (e.g., Postgres or provider-specific)
    status: e?.status ?? null, // Optional HTTP-like status (may be missing)
  };
}

//Applies filters, ordering and pagination to a Supabase query builder.
function applyFilters(builder: any, opts?: ListOptions | FilterOptions) {
  if (!opts) return builder;

  // Apply equality filters (e.g. { eq: { user_id: "123", status: "active" } })
  if (opts && "eq" in opts && opts.eq) {
    const filters = opts.eq;

    // Loop through each key-value pair in the eq object
    for (const column in filters) {
      const value = filters[column];

      // Add a "WHERE column = value" filter to the Supabase query
      builder = builder.eq(column, value);
    }
  }

  // Apply "not equal" filters (e.g., { neq: { status: "inactive", archived: true } })
  if (opts && "neq" in opts && opts.neq) {
    const filters = opts.neq;

    // Loop through each column-value pair inside the neq object
    for (const column in filters) {
      const value = filters[column];

      // Add a "WHERE column != value" condition to the Supabase query
      builder = builder.neq(column, value);
    }
  }

  // Apply case-sensitive pattern matches (SQL LIKE)Example: { like: { name: "A%", title: "%Project%" } }
  if (opts && "like" in opts && opts.like) {
    const patterns = opts.like;

    // Loop through each pattern and add a LIKE filter
    for (const column in patterns) {
      const pattern = patterns[column];
      // Matches column values similar to pattern (case-sensitive)
      builder = builder.like(column, pattern);
    }
  }

  // Apply case-insensitive pattern matches (SQL ILIKE) Example: { ilike: { email: "%@gmail.com" } }
  if (opts && "ilike" in opts && opts.ilike) {
    const patterns = opts.ilike;

    // Loop through each pattern and add an ILIKE filter
    for (const column in patterns) {
      const pattern = patterns[column];
      // Matches column values similar to pattern (case-insensitive)
      builder = builder.ilike(column, pattern);
    }
  }

  // Apply "IN" filters (SQL IN clause) Example: { in: { status: ["active", "pending"], role: ["admin", "user"] } }
  if (opts && "in" in opts && opts.in) {
    const filters = opts.in;

    // Go through each column -> values list
    for (const column in filters) {
      const values = filters[column];

      // Add a "WHERE column IN (value1, value2, ...)" to the query
      builder = builder.in(column, values);
    }
  }

  // Apply ordering (sorting) to the query results
  if (opts && "order" in opts && opts.order) {
    const { column, ascending } = opts.order;

    if (column) {
      // Default to ascending unless explicitly false
      builder = builder.order(column, { ascending: ascending !== false });
    }
  }

  // Pagination: limit + offset (range) Example: { limit: 10, offset: 20 } → fetch rows 21–30
  const limit = (opts as any).limit;
  const offset = (opts as any).offset;

  // Limit total number of rows returned
  if (limit) builder = builder.limit(limit);

  // If offset is provided, skip that many rows before starting
  if (typeof offset === "number") {
    // Supabase .range(start, end) is inclusive, so subtract 1
    const end = offset + (limit ?? 100) - 1;

    // Fetch rows within this index range
    builder = builder.range(offset, end);
  }

  // Return the updated query builder
  return builder;
}

/**
 * listRows()
 * Fetches multiple rows from a Supabase table with optional filters,
 * sorting, and pagination applied through the `opts` parameter.
 *
 * Example:
 *   const users = await listRows<User>("profiles", "id, name", {
 *     eq: { active: true },
 *     order: { column: "created_at", ascending: false },
 *     limit: 10
 *   });
 */
export async function listRows<T = unknown>(
  table: string, // Name of the table to query
  select = "*", // Columns to fetch (default: all)
  opts?: ListOptions // Optional filters/sorting/pagination
): Promise<Result<T[]>> {
  try {
    // Start building the query
    let query: any = supabase.from(table).select(select);

    // Apply all filters (eq, neq, like, in, order, limit, offset)
    query = applyFilters(query, opts);

    // Execute the query
    const { data, error, status } = await query;

    // Return standardized Result<T> object
    return {
      data: (data as unknown as T[]) ?? null,
      error: mapSupabaseError(error),
      status: status ?? null,
    };
  } catch (e) {
    // Handle unexpected runtime errors (e.g., network issues)
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

/**
 * getRow()
 * Fetches a single row from a Supabase table.
 * If `single: true` is provided, expects exactly one match (but won't throw if none).
 * Otherwise, limits results to 1 and returns the first record if available.
 *
 * Example:
 *   const user = await getRow<User>("profiles", "*", { eq: { id: user.id }, single: true });
 */
export async function getRow<T = unknown>(
  table: string, // Table name (e.g., "profiles")
  select = "*", // Columns to fetch (default: all)
  opts?: ListOptions // Optional filters/settings
): Promise<Result<T | null>> {
  try {
    // Start building the query
    let query: any = supabase.from(table).select(select);

    // Apply filters, ordering, pagination if provided
    query = applyFilters(query, opts);

    // If 'single' is true, fetch one object safely
    if (opts && opts.single) {
      const { data, error, status } = await query.maybeSingle();
      return {
        data: (data as unknown as T) ?? null,
        error: mapSupabaseError(error),
        status: status ?? null,
      };
    }

    // Otherwise, just get the first matching row (limit 1)
    const { data, error, status } = await query.limit(1).maybeSingle();
    return {
      data: data ?? null,
      error: mapSupabaseError(error),
      status: status ?? null,
    };
  } catch (e) {
    // Handle unexpected runtime errors (e.g., network or syntax issues)
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

/**
 * insertRow()
 * Inserts a new record into a Supabase table and returns the inserted row.
 *
 * Example:
 *   const res = await insertRow("profiles", { name: "Alex", email: "alex@test.com" });
 */
export async function insertRow<T = unknown>(
  table: string, // Table name to insert into
  payload: unknown, // Object containing column-value pairs to insert
  returning = "*" // Columns to return after insertion (default: all)
): Promise<Result<T>> {
  try {
    // Run the insert query and select the returned rows
    const { data, error, status } = await supabase
      .from(table)
      .insert(payload)
      .select(returning);

    // Supabase returns an array, even for a single insert — grab the first element
    const first = Array.isArray(data) ? data[0] : data;

    // Return standardized result object
    return {
      data: (first as unknown as T) ?? null, // The inserted row or null
      error: mapSupabaseError(error), // Normalized error shape
      status: status ?? null, // HTTP-like status code
    };
  } catch (e) {
    // Catch unexpected runtime errors (network or client issues)
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

/**
 * upsertRow()
 * Inserts or updates a record in a Supabase table.
 * - If the record already exists (based on `onConflict` column), it updates it.
 * - Otherwise, it inserts a new one.
 *
 * Example:
 *   await upsertRow("profiles", { id: user.id, full_name: "Alex" }, "id");
 */
export async function upsertRow<T = unknown>(
  table: string, // Table name (e.g. "profiles")
  payload: unknown, // Data to insert or update
  onConflict?: string, // Column to check for conflicts (e.g. "id")
  returning = "*" // Columns to return (default: all)
): Promise<Result<T>> {
  try {
    // Build the upsert query; include onConflict if provided
    const query = onConflict
      ? supabase.from(table).upsert(payload, { onConflict })
      : supabase.from(table).upsert(payload);

    // Execute query and return selected columns
    const { data, error, status } = await query.select(returning);

    // Supabase returns an array even for a single row — get the first one
    const first = Array.isArray(data) ? data[0] : data;

    // Return standardized result
    return {
      data: (first as unknown as T) ?? null, // Inserted/updated row
      error: mapSupabaseError(error), // Normalized error
      status: status ?? null, // HTTP-like status code
    };
  } catch (e) {
    // Handle unexpected runtime errors
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

/**
 * updateRow()
 * Updates rows in a table using the provided filters and returns the first updated row.
 * NOTE: Always pass a filter (e.g., { eq: { id } }) to avoid updating all rows permitted by RLS.
 */
export async function updateRow<T = unknown>(
  table: string, // Table to update
  payload: unknown, // Columns to change, e.g., { full_name: "Alex" }
  filters?: FilterOptions, // Which rows to update, e.g., { eq: { id: user.id } }
  returning = "*" // Columns to return (default: all)
): Promise<Result<T>> {
  try {
    // Build the UPDATE ... RETURNING query
    let query: any = supabase.from(table).update(payload).select(returning);

    // Apply eq/neq/like/ilike/in filters (if provided)
    query = applyFilters(query, filters as any);

    // Execute the query
    const { data, error, status } = await query;

    // Supabase may return an array of updated rows; return the first for convenience
    const first = Array.isArray(data) ? data[0] : data;

    // Standardized result
    return {
      data: (first as unknown as T) ?? null,
      error: mapSupabaseError(error),
      status: status ?? null,
    };
  } catch (e) {
    // Normalize unexpected errors
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

/**
 * deleteRow()
 * Deletes one or more rows from a Supabase table using optional filters.
 *
 * Example:
 *   await deleteRow("profiles", { eq: { id: user.id } });
 *   // Deletes the profile where id matches the current user
 */
export async function deleteRow<T = null>(
  table: string, // Table name (e.g., "profiles")
  filters?: FilterOptions // Which rows to delete (e.g., { eq: { id: "123" } })
): Promise<Result<T>> {
  try {
    // Start a DELETE query
    let query: any = supabase.from(table).delete();

    // Apply filtering (eq, in, etc.) to target specific rows
    query = applyFilters(query, filters as any);

    // Execute the query
    const { data, error, status } = await query;

    // Return standardized result (deletions typically have no data)
    return {
      data: (data as unknown as T) ?? null,
      error: mapSupabaseError(error),
      status: status ?? null,
    };
  } catch (e) {
    // Handle unexpected runtime errors
    return { data: null, error: mapSupabaseError(e), status: null };
  }
}

export function withUser(userId?: string | null) {
  // Prevent accidental use without a valid userId
  if (!userId) throw new Error("withUser requires a non-empty userId");

  /**
   * ensureOpts()
   * Takes any filter/options object and injects eq.user_id = userId.
   * Keeps other filters like order, limit, and offset intact.
   */
  function ensureOpts(opts?: ListOptions | FilterOptions): ListOptions {
    const output: any = {};

    // Copy existing equality filters, if any
    if (opts && (opts as any).eq) output.eq = { ...(opts as any).eq };

    // Always include the current user's id as a filter
    output.eq = { ...(output.eq ?? {}), user_id: userId };

    // Preserve ordering and pagination options
    if (opts && (opts as any).order) output.order = (opts as any).order;
    if (opts && typeof (opts as any).limit === "number")
      output.limit = (opts as any).limit;
    if (opts && typeof (opts as any).offset === "number")
      output.offset = (opts as any).offset;

    // Preserve common additional filter types (in, neq, like, ilike) so
    // callers can pass complex filters while still scoping by user_id.
    if (opts && (opts as any).in) output.in = { ...(opts as any).in };
    if (opts && (opts as any).neq) output.neq = { ...(opts as any).neq };
    if (opts && (opts as any).like) output.like = { ...(opts as any).like };
    if (opts && (opts as any).ilike) output.ilike = { ...(opts as any).ilike };

    // Return the final options object with user_id injected
    return output as ListOptions;
  }

  // User-scoped wrappers: every call is automatically filtered/tagged with user_id
  function scopedListRows<T = unknown>(
    table: string,
    select = "*",
    opts?: ListOptions
  ) {
    // Read-for-user: inject eq.user_id = userId (plus keep order/limit/offset)
    return listRows<T>(table, select, ensureOpts(opts));
  }

  function scopedGetRow<T = unknown>(
    table: string,
    select = "*",
    opts?: ListOptions
  ) {
    // Read-one-for-user: also injects eq.user_id = userId
    return getRow<T>(table, select, ensureOpts(opts));
  }

  function scopedInsertRow<T = unknown>(
    table: string,
    payload: any,
    returning = "*"
  ) {
    // Create-for-user: force user_id to the current user (overrides any payload.user_id)
    const p = { ...(payload ?? {}), user_id: userId };
    return insertRow<T>(table, p, returning);
  }

  /**
   * scopedUpsertRow()
   * Insert or update a record for the current user.
   * Automatically adds user_id to the payload so ownership is correct.
   */
  function scopedUpsertRow<T = unknown>(
    table: string,
    payload: any,
    onConflict?: string,
    returning = "*"
  ) {
    // Merge user_id into the payload (overrides any spoofed value)
    const p = { ...(payload ?? {}), user_id: userId };
    return upsertRow<T>(table, p, onConflict, returning);
  }

  /**
   * scopedUpdateRow()
   * Update one or more rows for the current user only.
   * Injects eq.user_id = userId into filters to ensure user scoping.
   */
  function scopedUpdateRow<T = unknown>(
    table: string,
    payload: any,
    filters?: FilterOptions,
    returning = "*"
  ) {
    // Pass filters through ensureOpts to append user_id condition
    return updateRow<T>(table, payload, ensureOpts(filters), returning);
  }

  /**
   * scopedDeleteRow()
   * Delete one or more rows for the current user only.
   * Filters are automatically scoped to user_id = userId.
   */
  function scopedDeleteRow<T = null>(table: string, filters?: FilterOptions) {
    // Prevent accidental deletion of other users' data
    return deleteRow<T>(table, ensureOpts(filters));
  }

  // Return an object containing all user-scoped CRUD helpers
  // Each function automatically applies user_id = current user's ID
  return {
    listRows: scopedListRows, // List rows for this user only
    getRow: scopedGetRow, // Get a single row for this user
    insertRow: scopedInsertRow, // Insert new row with user_id added
    upsertRow: scopedUpsertRow, // Insert or update with user_id enforced
    updateRow: scopedUpdateRow, // Update rows belonging to this user
    deleteRow: scopedDeleteRow, // Delete rows belonging to this user
  };
}

// --- Convenience helpers that map to the UC-011 REST-like endpoints ---
// These make it easier for frontend code to interact with profiles
// using clear, REST-like function names (e.g., getUserProfile → GET /profile).

/**
 * getUserProfile()
 * Fetch the profile row for the specified user.
 *
 * Example:
 *   const res = await getUserProfile(session.user.id);
 *   console.log(res.data); // { id: 'abc123', full_name: 'Alex', ... }
 */
export async function getUserProfile(userId: string) {
  return getRow("profiles", "*", { eq: { id: userId }, single: true });
}

/**
 * updateUserProfile()
 * Update a user's profile with the given payload.
 *
 * Example:
 *   await updateUserProfile(session.user.id, { full_name: "Alex", bio: "Hi!" });
 */
export async function updateUserProfile(
  userId: string,
  payload: Record<string, unknown>
) {
  return updateRow("profiles", payload, { eq: { id: userId } });
}

export async function registerWithEmail(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: metadata ?? {} },
    } as any);
    return { data: data ?? null, error: mapSupabaseError(error) };
  } catch (e) {
    return { data: null, error: mapSupabaseError(e) };
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    } as any);
    return { data: null, error: mapSupabaseError(error) };
  } catch (e) {
    return { data: null, error: mapSupabaseError(e) };
  }
}

export async function logout() {
  try {
    await supabase.auth.signOut();
    return { data: null, error: null } as Result<null>;
  } catch (e) {
    return { data: null, error: mapSupabaseError(e) } as Result<null>;
  }
}

export default {
  listRows,
  getRow,
  insertRow,
  upsertRow,
  updateRow,
  deleteRow,
  withUser,
  // convenience
  getUserProfile,
  updateUserProfile,
  registerWithEmail,
  loginWithEmail,
  logout,
};
