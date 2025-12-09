/**
 * DASHBOARD DATA HOOK (Unified Cache Version)
 *
 * Purpose:
 * - Centralized data fetching for the Profile Dashboard
 * - Uses React Query with a SINGLE unified cache entry
 * - Provides loading, error, and data states
 * - Simpler cache invalidation (just one key to invalidate)
 *
 * This hook now uses the unified profile cache which:
 * - Fetches ALL profile data in one go
 * - Stores it in a single cache entry
 * - Uses `select` to extract specific data for consumers
 *
 * Benefits:
 * - Single network request for all data
 * - One cache entry = simpler invalidation
 * - Automatic cache sharing between dashboard and detail pages
 * - Better performance (fewer queries to track)
 */
import { useDashboardData as useUnifiedDashboardData } from "../cache/useUnifiedProfileCache";

// Re-export types for convenience
export type {
  ProfileHeader,
  CareerEvent,
  SkillChartData,
  RecentActivityItem,
} from "../cache/useUnifiedProfileCache";

export interface DashboardCounts {
  employmentCount: number;
  skillsCount: number;
  educationCount: number;
  projectsCount: number;
}

/**
 * Custom hook that fetches and manages all dashboard data.
 * Now powered by the unified profile cache for better performance.
 *
 * All profile data is stored in ONE cache entry under:
 * ["profile", userId, "unified"]
 *
 * @returns Dashboard data, loading state, error state, and refresh function
 */
export function useDashboardData() {
  // Use the unified cache implementation (single fetch, single cache entry)
  return useUnifiedDashboardData();
}

export default useDashboardData;
