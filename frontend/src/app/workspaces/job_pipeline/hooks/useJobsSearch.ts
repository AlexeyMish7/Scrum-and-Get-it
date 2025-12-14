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
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";
import type { JobRow } from "@shared/types/database";
import type { JobFilters } from "@job_pipeline/types";

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

function applyJobFilters(
  rows: JobRow[],
  searchQuery: string,
  searchFilters?: JobFilters
): JobRow[] {
  let out = [...rows];

  const query = String(searchQuery || searchFilters?.search || "")
    .trim()
    .toLowerCase();
  if (query) {
    out = out.filter((job) => {
      const hay = (
        String(job.job_title ?? job["title"] ?? "") +
        " " +
        String(job.company_name ?? job["company"] ?? "") +
        " " +
        String(job.job_description ?? "")
      )
        .toLowerCase()
        .trim();
      return hay.includes(query);
    });
  }

  if (searchFilters?.stage && searchFilters.stage !== "All") {
    out = out.filter(
      (job) =>
        String(job.job_status ?? "") === String(searchFilters.stage ?? "")
    );
  }

  if (searchFilters?.industry) {
    const industry = String(searchFilters.industry).toLowerCase();
    out = out.filter((job) =>
      String(job.industry ?? "")
        .toLowerCase()
        .includes(industry)
    );
  }

  if (searchFilters?.jobType) {
    const jobType = String(searchFilters.jobType).toLowerCase();
    out = out.filter((job) =>
      String((job as any).job_type ?? (job as any).jobType ?? "")
        .toLowerCase()
        .includes(jobType)
    );
  }

  if (searchFilters?.minSalary != null) {
    out = out.filter((job) => {
      const val = Number(
        (job as any).start_salary_range ?? (job as any).startSalary ?? 0
      );
      return Number.isFinite(val) && val >= Number(searchFilters.minSalary);
    });
  }

  if (searchFilters?.maxSalary != null) {
    out = out.filter((job) => {
      const val = Number(
        (job as any).start_salary_range ?? (job as any).startSalary ?? 0
      );
      return Number.isFinite(val) && val <= Number(searchFilters.maxSalary);
    });
  }

  if (searchFilters?.deadlineAfter) {
    const after = new Date(searchFilters.deadlineAfter).getTime();
    out = out.filter((job) => {
      const d =
        (job as any).application_deadline ?? (job as any).applicationDeadline;
      if (!d) return false;
      return new Date(String(d)).getTime() >= after;
    });
  }

  if (searchFilters?.deadlineBefore) {
    const before = new Date(searchFilters.deadlineBefore).getTime();
    out = out.filter((job) => {
      const d =
        (job as any).application_deadline ?? (job as any).applicationDeadline;
      if (!d) return false;
      return new Date(String(d)).getTime() <= before;
    });
  }

  if (searchFilters?.createdAfter) {
    const after = new Date(searchFilters.createdAfter).getTime();
    out = out.filter((job) => {
      const d = (job as any).created_at ?? (job as any).createdAt;
      if (!d) return false;
      return new Date(String(d)).getTime() >= after;
    });
  }

  if (searchFilters?.createdBefore) {
    const before = new Date(searchFilters.createdBefore).getTime();
    out = out.filter((job) => {
      const d = (job as any).created_at ?? (job as any).createdAt;
      if (!d) return false;
      return new Date(String(d)).getTime() <= before;
    });
  }

  const sortBy = searchFilters?.sortBy;
  const sortOrder = searchFilters?.sortOrder ?? "desc";
  if (sortBy) {
    const dir = sortOrder === "asc" ? 1 : -1;
    out.sort((a, b) => {
      switch (sortBy) {
        case "application_deadline": {
          const da = a.application_deadline
            ? new Date(String(a.application_deadline)).getTime()
            : 0;
          const db = b.application_deadline
            ? new Date(String(b.application_deadline)).getTime()
            : 0;
          return (da - db) * dir;
        }
        case "company_name":
          return (
            String(a.company_name ?? "").localeCompare(
              String(b.company_name ?? "")
            ) * dir
          );
        case "job_title":
          return (
            String(a.job_title ?? "").localeCompare(String(b.job_title ?? "")) *
            dir
          );
        case "created_at":
        default: {
          const ta = a.created_at
            ? new Date(String(a.created_at)).getTime()
            : 0;
          const tb = b.created_at
            ? new Date(String(b.created_at)).getTime()
            : 0;
          return (ta - tb) * dir;
        }
      }
    });
  }

  const offset = searchFilters?.offset ?? 0;
  const limit = searchFilters?.limit;
  if (offset || limit != null) {
    out = out.slice(offset, limit != null ? offset + limit : undefined);
  }

  return out;
}

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
        const qc = getAppQueryClient();
        const cachedRows = await qc.ensureQueryData({
          queryKey: coreKeys.jobs(userId),
          queryFn: () => fetchCoreJobs<JobRow>(userId),
          staleTime: 60 * 60 * 1000,
        });

        const rows = Array.isArray(cachedRows) ? (cachedRows as JobRow[]) : [];
        const data = applyJobFilters(rows, searchQuery, searchFilters);
        setResults(data);
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
