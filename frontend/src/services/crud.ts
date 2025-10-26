import { supabase } from "../supabaseClient";

/**
 * Generic CRUD helpers for Supabase. Each function returns an object
 * { data, error } mirroring the Supabase response shape but with simpler types.
 * Keep these small and composable so page components and services can reuse them.
 */

export async function listRows<T>(
  table: string,
  select = "*",
  opts?: {
    eq?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
  }
) {
  let q = supabase.from<T>(table).select(select);
  if (opts?.eq) {
    for (const [k, v] of Object.entries(opts.eq))
      q = q.eq(k, v as unknown as string);
  }
  if (opts?.order)
    q = q.order(opts.order.column, { ascending: !!opts.order.ascending });
  const { data, error } = await q;
  return { data: data ?? null, error: error ?? null };
}

export async function getById<T>(table: string, id: string, select = "*") {
  const { data, error } = await supabase
    .from<T>(table)
    .select(select)
    .eq("id", id)
    .single();
  return { data: data ?? null, error: error ?? null };
}

export async function insertRow<T>(table: string, row: Partial<T>) {
  const { data, error } = await supabase.from<T>(table).insert([row]);
  return { data: data ?? null, error: error ?? null };
}

export async function upsertRow<T>(
  table: string,
  row: Partial<T>,
  onConflict = "id"
) {
  const { data, error } = await supabase
    .from<T>(table)
    .upsert([row], { onConflict });
  return { data: data ?? null, error: error ?? null };
}

export async function updateById<T>(
  table: string,
  id: string,
  updates: Partial<T>
) {
  const { data, error } = await supabase
    .from<T>(table)
    .update(updates)
    .eq("id", id);
  return { data: data ?? null, error: error ?? null };
}

export async function deleteById(table: string, id: string) {
  const { data, error } = await supabase.from(table).delete().eq("id", id);
  return { data: data ?? null, error: error ?? null };
}
