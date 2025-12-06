/**
 * DASHBOARD DATA HOOK (React Query Version)
 *
 * Purpose:
 * - Centralized data fetching for the Profile Dashboard
 * - Uses React Query for caching, deduplication, and background refetching
 * - Provides loading, error, and data states
 * - Cache invalidation handled by ProfileQueryProvider
 *
 * This hook wraps useDashboardQueries to maintain the same API
 * as the original useDashboardData hook for backward compatibility.
 *
 * Benefits over the old version:
 * - Automatic caching (5 min stale time, 30 min cache time)
 * - Request deduplication (same query won't fire twice)
 * - Background refetching on window focus
 * - Optimistic updates possible
 * - Cache persisted to IndexedDB (optional)
 */
import { useDashboardQueries } from "../cache";

// Re-export types for convenience
export type {
  ProfileHeader,
  CareerEvent,
  SkillChartData,
  ActivityItem,
} from "../cache";

export interface DashboardCounts {
  employmentCount: number;
  skillsCount: number;
  educationCount: number;
  projectsCount: number;
}

/**
 * Custom hook that fetches and manages all dashboard data.
 * Now powered by React Query with automatic caching.
 *
 * The cache is automatically invalidated when:
 * - Window events fire: skills:changed, employment:changed, etc.
 * - Supabase realtime events (if configured)
 *
 * @returns Dashboard data, loading state, error state, and refresh function
 */
export function useDashboardData() {
  // Use the React Query based implementation
  const queryResult = useDashboardQueries();

  // Return with the same shape as the original hook
  return queryResult;
}

export default useDashboardData;
