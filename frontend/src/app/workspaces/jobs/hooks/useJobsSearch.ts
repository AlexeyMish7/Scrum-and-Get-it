/**
 * JOBS SEARCH HOOK
 * Manages debounced search with client-side caching.
 *
 * PURPOSE:
 * - Debounce search input (300ms delay)
 * - Cache search results (5-minute TTL)
 * - Invalidate cache on mutations
 * - Reduce unnecessary API calls
 *
 * USAGE:
 * ```tsx
 * const { results, loading, search, clearCache } = useJobsSearch(user.id);
 * search("software engineer");
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { jobsService } from "@jobs/services";
import type { JobRow } from "@shared/types/database";
import type { JobFilters } from "@jobs/types";

interface CacheEntry {
  data: JobRow[];
  timestamp: number;
}

interface UseJobsSearchResult {
  results: JobRow[];
  loading: boolean;
  error: string | null;
  search: (query: string, filters?: JobFilters) => void;
  clearCache: () => void;
  debouncedQuery: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY_MS = 300; // 300ms

/**
 * JOBS SEARCH HOOK
 *
 * Inputs:
 * - userId: User UUID (required for RLS scoping)
 * - initialFilters?: Default filters to apply
 *
 * Outputs:
 * - results: Array of matching jobs
 * - loading: Boolean indicating active search
 * - error: Error message if search failed
 * - search: Function to trigger search with query and filters
 * - clearCache: Function to invalidate cached results
 * - debouncedQuery: Current debounced query string
 *
 * Features:
 * - 300ms debounce on search input
 * - 5-minute TTL cache per query+filters combo
 * - Automatic cache invalidation on TTL expiry
 * - Cache key based on query + filters hash
 */
export function useJobsSearch(
  userId: string | undefined,
  initialFilters?: JobFilters
): UseJobsSearchResult {
  const [results, setResults] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters | undefined>(
    initialFilters
  );

  // In-memory cache: Map<cacheKey, CacheEntry>
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * GENERATE CACHE KEY: Hash query + filters for unique cache entry
   */
  const getCacheKey = useCallback((q: string, f?: JobFilters): string => {
    const filterStr = f ? JSON.stringify(f) : "";
    return `${q}::${filterStr}`;
  }, []);

  /**
   * CHECK CACHE: Return cached data if valid (within TTL)
   */
  const checkCache = useCallback((cacheKey: string): JobRow[] | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL_MS) {
      // Cache expired, remove entry
      cacheRef.current.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, []);

  /**
   * SET CACHE: Store search results with current timestamp
   */
  const setCache = useCallback((cacheKey: string, data: JobRow[]) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * CLEAR CACHE: Invalidate all cached results
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * EXECUTE SEARCH: Fetch jobs with query and filters (cache-aware)
   */
  const executeSearch = useCallback(
    async (searchQuery: string, searchFilters?: JobFilters) => {
      if (!userId) return;

      const cacheKey = getCacheKey(searchQuery, searchFilters);

      // Check cache first
      const cached = checkCache(cacheKey);
      if (cached) {
        setResults(cached);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await jobsService.listJobs(userId, {
          ...searchFilters,
          search: searchQuery || undefined,
        });

        if (result.error) {
          setError(result.error.message ?? "Search failed");
          return;
        }

        const data = Array.isArray(result.data) ? result.data : [];
        setResults(data);

        // Cache results
        setCache(cacheKey, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [userId, getCacheKey, checkCache, setCache]
  );

  /**
   * SEARCH: Debounced search trigger
   *
   * Inputs:
   * - query: Search query string
   * - filters?: Optional filters to apply
   *
   * Side effects:
   * - Clears existing debounce timer
   * - Sets new timer for 300ms
   * - Updates query and filters state
   */
  const search = useCallback(
    (searchQuery: string, searchFilters?: JobFilters) => {
      setFilters(searchFilters);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, DEBOUNCE_DELAY_MS);
    },
    []
  );

  /**
   * EXECUTE ON DEBOUNCED QUERY CHANGE
   */
  useEffect(() => {
    if (userId && debouncedQuery !== undefined) {
      executeSearch(debouncedQuery, filters);
    }
  }, [userId, debouncedQuery, filters, executeSearch]);

  /**
   * CLEANUP: Clear debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearCache,
    debouncedQuery,
  };
}
