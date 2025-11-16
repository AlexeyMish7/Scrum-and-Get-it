/**
 * USE CACHE HOOK
 * React hook for cached data fetching with automatic loading states.
 *
 * PURPOSE:
 * - Simplify data fetching with built-in caching
 * - Provide loading/error states automatically
 * - Support manual cache invalidation and refetch
 *
 * PATTERNS:
 * - Checks cache first (instant return if hit)
 * - Falls back to fetcher function on cache miss
 * - Stores result in cache with TTL
 * - Returns loading/error/data states
 *
 * USAGE:
 * ```tsx
 * const { data, loading, error, refetch } = useCache(
 *   "jobs-user-123",
 *   () => jobsService.listJobs(userId),
 *   { ttl: 5 * 60 * 1000 } // 5 minutes
 * );
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorDisplay error={error} />;
 * return <JobsList jobs={data} />;
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { dataCache } from "@shared/services/cache";

interface UseCacheOptions {
  ttl?: number; // Time-to-live in milliseconds (default: 5 minutes)
  enabled?: boolean; // Whether to auto-fetch on mount (default: true)
}

interface UseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * USE CACHE: Hook for cached data fetching.
 *
 * Inputs:
 * - key: Cache key (string)
 * - fetcher: Async function that returns data
 * - options?: { ttl?, enabled? }
 *
 * Outputs:
 * - { data, loading, error, refetch, invalidate }
 *
 * Behavior:
 * - Checks cache on mount (instant return if hit)
 * - Calls fetcher on cache miss
 * - Stores result in cache with TTL
 * - Provides loading/error states
 * - refetch(): Force re-fetch and update cache
 * - invalidate(): Clear cache entry without re-fetching
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;

  const [data, setData] = useState<T | null>(() => {
    // Check cache on mount for instant data
    return dataCache.get<T>(key);
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // Only loading if no cached data
    return data === null && enabled;
  });
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      dataCache.set(key, result, ttl);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const invalidate = useCallback(() => {
    dataCache.invalidate(key);
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    // Check cache first
    const cached = dataCache.get<T>(key);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Cache miss: fetch data
    fetchData();
  }, [key, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
}

/**
 * USE CACHED VALUE: Simpler hook for read-only cached values.
 *
 * Inputs:
 * - key: Cache key
 *
 * Outputs:
 * - T | null: Cached value or null
 *
 * Use case: Quick cache reads without fetching
 */
export function useCachedValue<T>(key: string): T | null {
  const [value, setValue] = useState<T | null>(() => dataCache.get<T>(key));

  useEffect(() => {
    setValue(dataCache.get<T>(key));
  }, [key]);

  return value;
}

export default useCache;
