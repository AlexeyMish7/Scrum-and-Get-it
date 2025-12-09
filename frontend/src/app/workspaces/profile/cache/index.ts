/**
 * Profile Cache Module
 *
 * Exports caching utilities for the profile workspace.
 * This module provides:
 * - ProfileQueryProvider: Wraps profile routes with QueryClient
 * - useDashboardQueries: Fetches all profile data for dashboard
 * - List hooks: useEducationList, useEmploymentList, etc. (full data for pages)
 * - Query keys: For cache invalidation
 *
 * === UNIFIED CACHE (NEW) ===
 * - useUnifiedProfile: Single cache entry for ALL user profile data
 * - useProfileData, useSkillsData, etc.: Selector hooks that read from unified cache
 * - useDashboardData: Dashboard-ready data from unified cache
 * - useProfileCacheUtils: Manual cache control utilities
 *
 * Benefits of unified cache:
 * - One fetch, one cache entry
 * - Simpler invalidation
 * - Reduced network requests
 */

export { ProfileQueryProvider, default } from "./ProfileQueryProvider";
export { profileKeys } from "./queryKeys";
export type { ProfileQueryKey } from "./queryKeys";
export {
  // Full profile data (for ProfileDetails page)
  useFullProfile,
  // Dashboard hook (fetches all sections in parallel)
  useDashboardQueries,
  // List hooks (full data for page components)
  useEducationList,
  useEmploymentList,
  useSkillsList,
  useProjectsList,
  useCertificationsList,
} from "./useProfileQueries";
export type {
  ProfileHeader,
  CareerEvent,
  SkillChartData,
  RecentActivityItem,
} from "./useProfileQueries";
export { useRealtimeSync, useProfileCacheUtils } from "./useRealtimeSync";

// ============================================================================
// UNIFIED CACHE EXPORTS (NEW - Single cache entry for all profile data)
// ============================================================================
export {
  // Unified cache keys
  unifiedProfileKeys,
  // Main unified hook - fetches everything once
  useUnifiedProfile,
  // Selector hooks - use unified cache, extract specific data
  useProfileData,
  useSkillsData,
  useEmploymentData,
  useEducationData,
  useProjectsData,
  useCertificationsData,
  // Dashboard hook from unified cache
  useDashboardData as useUnifiedDashboardData,
  // Cache utilities
  useProfileCacheUtils as useUnifiedCacheUtils,
} from "./useUnifiedProfileCache";
export type {
  UnifiedProfileData,
  DashboardData,
} from "./useUnifiedProfileCache";
