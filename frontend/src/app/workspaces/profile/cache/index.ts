/**
 * Profile Cache Module
 *
 * Exports caching utilities for the profile workspace.
 * This module provides:
 * - ProfileQueryProvider: Wraps profile routes with QueryClient
 * - Query hooks: useProfileHeader, useSkills, useEmployment, etc.
 * - List hooks: useEducationList, useEmploymentList, etc. (full data)
 * - Query keys: For cache invalidation
 */

export { ProfileQueryProvider, default } from "./ProfileQueryProvider";
export { profileKeys } from "./queryKeys";
export type { ProfileQueryKey } from "./queryKeys";
export {
  // Count/summary hooks (for dashboard)
  useProfileHeader,
  useFullProfile,
  useEmployment,
  useSkills,
  useEducation,
  useProjects,
  useCertifications,
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
