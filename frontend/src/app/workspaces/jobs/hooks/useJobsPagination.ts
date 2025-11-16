/**
 * JOBS PAGINATION HOOK
 * Manages infinite scroll pagination for job lists.
 *
 * PURPOSE:
 * - Load jobs in batches (default 50 per page)
 * - Track loading state and pagination metadata
 * - Support "load more" pattern for infinite scroll
 * - Integrate with jobsService for data fetching
 *
 * USAGE:
 * ```tsx
 * const { jobs, loading, hasMore, loadMore, refresh } = useJobsPagination(user.id, filters);
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { jobsService } from "@jobs/services";
import type { JobRow } from "@shared/types/database";
import type { JobFilters } from "@jobs/types";

interface UseJobsPaginationOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseJobsPaginationResult {
  jobs: JobRow[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * JOBS PAGINATION HOOK
 *
 * Inputs:
 * - userId: User UUID (required for RLS scoping)
 * - filters?: JobFilters object (search, stage, sorting, etc.)
 * - options?: Configuration (pageSize, autoLoad)
 *
 * Outputs:
 * - jobs: Accumulated array of loaded jobs
 * - loading: Boolean indicating active fetch
 * - error: Error message if fetch failed
 * - hasMore: Boolean indicating more pages available
 * - total: Total count of jobs matching filters
 * - loadMore: Function to load next page
 * - refresh: Function to reset and reload from beginning
 * - reset: Function to clear state without fetching
 *
 * Side effects:
 * - Fetches jobs on mount if autoLoad=true (default)
 * - Refetches when userId or filters change
 */
export function useJobsPagination(
  userId: string | undefined,
  filters?: JobFilters,
  options?: UseJobsPaginationOptions
): UseJobsPaginationResult {
  const pageSize = options?.pageSize ?? 50;
  const autoLoad = options?.autoLoad ?? true;

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * LOAD MORE: Fetch next page and append to jobs array
   */
  const loadMore = useCallback(async () => {
    if (!userId || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await jobsService.listJobsPaginated(userId, {
        ...filters,
        limit: pageSize,
        offset,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to load jobs");
        return;
      }

      const data = result.data;
      if (!data) {
        setError("No data returned");
        return;
      }

      // Append new jobs to existing list
      setJobs((prev) => [...prev, ...data.jobs]);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset((prev) => prev + data.jobs.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId, filters, offset, pageSize, loading, hasMore]);

  /**
   * REFRESH: Reset state and reload from beginning
   */
  const refresh = useCallback(async () => {
    if (!userId) return;

    setJobs([]);
    setOffset(0);
    setTotal(0);
    setHasMore(true);
    setError(null);
    setLoading(true);

    try {
      const result = await jobsService.listJobsPaginated(userId, {
        ...filters,
        limit: pageSize,
        offset: 0,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to load jobs");
        return;
      }

      const data = result.data;
      if (!data) {
        setError("No data returned");
        return;
      }

      setJobs(data.jobs);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(data.jobs.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId, filters, pageSize]);

  /**
   * RESET: Clear state without fetching
   */
  const reset = useCallback(() => {
    setJobs([]);
    setOffset(0);
    setTotal(0);
    setHasMore(true);
    setError(null);
  }, []);

  /**
   * AUTO-LOAD: Fetch first page on mount or when dependencies change
   */
  useEffect(() => {
    if (autoLoad && userId) {
      refresh();
    }
  }, [userId, autoLoad, refresh]);

  return {
    jobs,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    reset,
  };
}
