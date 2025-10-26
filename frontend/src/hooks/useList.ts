import { useEffect, useState } from "react";
import type { MaybeError } from "../types";

/**
 * Simple hook to fetch a list of rows from a table using the generic CRUD helper.
 * Returns { data, loading, error, refresh } so components can render and refresh easily.
 */
export function useList<T>(
  fetcher: () => Promise<{ data: T[] | null; error: MaybeError }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<MaybeError>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetcher();
    setData(res.data ?? null);
    setError(res.error ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refresh: load };
}
