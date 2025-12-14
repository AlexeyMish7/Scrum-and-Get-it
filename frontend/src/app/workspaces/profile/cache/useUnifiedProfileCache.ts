/**
 * UNIFIED PROFILE CACHE
 *
 * Single cache entry that holds ALL user profile data.
 * Individual hooks use `select` to extract just what they need.
 *
 * Benefits:
 * - One fetch, one cache entry
 * - Automatic cache sharing between dashboard and detail pages
 * - Simpler invalidation (just invalidate one key)
 * - Reduced network requests
 *
 * Data Flow:
 *   useUnifiedProfile() fetches everything once
 *   └── useProfileData() selects profile info
 *   └── useSkillsData() selects skills array
 *   └── useEmploymentData() selects employment array
 *   └── etc.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import { CACHE_STALE_TIME, CACHE_GC_TIME } from "./cacheConfig";
import { profileKeys } from "./queryKeys";

// Services for data fetching
import { listSkills } from "@profile/services/skills";
import { listEducation } from "@profile/services/education";
import employmentService from "@profile/services/employment";
import projectsService from "@profile/services/projects";
import certificationsService from "@profile/services/certifications";
import profileService, { getProfile } from "@profile/services/profileService";

// Types
import type { EmploymentRow } from "@profile/types/employment";
import type { EducationEntry } from "@profile/types/education";
import type { SkillItem } from "@profile/types/skill";
import type { Project } from "@profile/types/project";
import type { Certification } from "@profile/types/certification";
import type { ProfileData } from "@profile/types/profile";

// ============================================================================
// UNIFIED DATA TYPES
// ============================================================================

/**
 * Complete user profile data - everything in one object
 */
export interface UnifiedProfileData {
  // Profile info
  profile: ProfileData | null;

  // Lists
  skills: SkillItem[];
  employment: EmploymentRow[];
  education: EducationEntry[];
  projects: Project[];
  certifications: Certification[];

  // Metadata
  fetchedAt: number;
}

/**
 * Profile header for display
 */
export interface ProfileHeader {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatarPath?: string | null;
}

/**
 * Career timeline event
 */
export interface CareerEvent {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

/**
 * Skills chart data point
 */
export interface SkillChartData {
  name: string;
  value: number;
}

/**
 * Recent activity item
 */
export interface RecentActivityItem {
  id: string;
  type: "employment" | "skill" | "education" | "project" | "certification";
  title: string;
  subtitle: string;
  date: string;
}

/**
 * Dashboard-ready data with computed values
 */
export interface DashboardData {
  header: ProfileHeader | null;
  counts: {
    employmentCount: number;
    skillsCount: number;
    educationCount: number;
    projectsCount: number;
    certificationsCount: number;
  };
  skills: SkillChartData[];
  careerEvents: CareerEvent[];
  recentActivity: RecentActivityItem[];
  loading: boolean;
  hasError: boolean;
  refresh: () => void;
}

// ============================================================================
// UNIFIED QUERY KEY
// ============================================================================

export const unifiedProfileKeys = {
  all: ["profile"] as const,
  user: (userId: string) =>
    [...unifiedProfileKeys.all, userId, "unified"] as const,
};

// ============================================================================
// UNIFIED FETCHER
// ============================================================================

/**
 * Fetches ALL profile data in parallel and returns unified object
 */
async function fetchUnifiedProfile(
  userId: string
): Promise<UnifiedProfileData> {
  // Fetch all data in parallel
  const [
    profileResult,
    skillsResult,
    employmentResult,
    educationResult,
    projectsResult,
    certificationsResult,
  ] = await Promise.all([
    getProfile(userId),
    listSkills(userId),
    employmentService.listEmployment(userId),
    listEducation(userId),
    projectsService.listProjects(userId),
    certificationsService.listCertifications(userId),
  ]);

  // Map profile
  const profile = profileResult?.data
    ? profileService.mapRowToProfile(
        profileResult.data as Record<string, unknown>
      )
    : null;

  // Map employment - cast to the proper type since service returns unknown[]
  const employmentRaw = employmentResult?.data;
  const employment: EmploymentRow[] = Array.isArray(employmentRaw)
    ? (employmentRaw as EmploymentRow[])
    : employmentRaw
    ? [employmentRaw as EmploymentRow]
    : [];

  // Map skills
  const skills: SkillItem[] = skillsResult?.data ?? [];

  // Map education
  const education: EducationEntry[] = educationResult?.data ?? [];

  // Map projects
  const projectsRaw = projectsResult?.data;
  const projectRows = Array.isArray(projectsRaw)
    ? projectsRaw
    : projectsRaw
    ? [projectsRaw]
    : [];
  const projects: Project[] = projectRows.map((row) =>
    projectsService.mapRowToProject(row)
  );

  // Map certifications
  const certificationsRaw = certificationsResult?.data;
  const certRows = Array.isArray(certificationsRaw)
    ? certificationsRaw
    : certificationsRaw
    ? [certificationsRaw]
    : [];
  const certifications: Certification[] = certRows.map((row) =>
    certificationsService.mapRowToCertification(row)
  );

  return {
    profile,
    skills,
    employment,
    education,
    projects,
    certifications,
    fetchedAt: Date.now(),
  };
}

// ============================================================================
// MAIN UNIFIED HOOK
// ============================================================================

/**
 * Hook that fetches and caches ALL profile data
 * This is the single source of truth for all profile data
 */
export function useUnifiedProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// ============================================================================
// SELECTOR HOOKS (use the unified cache, select specific data)
// ============================================================================

/**
 * Hook for full profile data (for ProfileDetails page)
 */
export function useProfileData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.profile,
  });
}

/**
 * Hook for skills list
 */
export function useSkillsData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.skills,
  });
}

/**
 * Hook for employment list
 */
export function useEmploymentData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.employment,
  });
}

/**
 * Hook for education list
 */
export function useEducationData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.education,
  });
}

/**
 * Hook for projects list
 */
export function useProjectsData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.projects,
  });
}

/**
 * Hook for certifications list
 */
export function useCertificationsData() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: unifiedProfileKeys.user(userId),
    queryFn: () => fetchUnifiedProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    select: (data) => data.certifications,
  });
}

// ============================================================================
// DASHBOARD HOOK (uses unified cache, transforms for dashboard display)
// ============================================================================

/**
 * Transform skills to chart data format
 */
function transformToSkillChartData(skills: SkillItem[]): SkillChartData[] {
  // Group by category and count
  const categoryMap = new Map<string, number>();
  skills.forEach((skill) => {
    const category = skill.category || "Other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categories for chart
}

/**
 * Transform employment to career timeline events
 */
function transformToCareerEvents(employment: EmploymentRow[]): CareerEvent[] {
  return employment
    .map((emp) => ({
      id: emp.id,
      company: emp.company_name,
      title: emp.job_title,
      startDate: emp.start_date,
      endDate: emp.end_date ?? null, // Coerce undefined to null
      isCurrent: !emp.end_date,
    }))
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
}

/**
 * Build recent activity from all data sources
 */
function buildRecentActivity(
  employment: EmploymentRow[],
  skills: SkillItem[],
  education: EducationEntry[],
  projects: Project[]
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  // Add employment
  employment.slice(0, 3).forEach((emp) => {
    items.push({
      id: `emp-${emp.id}`,
      type: "employment",
      title: emp.job_title,
      subtitle: emp.company_name,
      date: emp.start_date,
    });
  });

  // Add skills (most recent by assuming they were added recently)
  skills.slice(0, 3).forEach((skill) => {
    items.push({
      id: `skill-${skill.id}`,
      type: "skill",
      title: skill.name,
      subtitle: skill.category || "Skill",
      date: new Date().toISOString().split("T")[0], // Skills don't have dates
    });
  });

  // Add education
  education.slice(0, 2).forEach((edu) => {
    items.push({
      id: `edu-${edu.id}`,
      type: "education",
      title: edu.degree,
      subtitle: edu.institution,
      date: edu.startDate,
    });
  });

  // Add projects
  projects.slice(0, 2).forEach((proj) => {
    items.push({
      id: `proj-${proj.id}`,
      type: "project",
      title: proj.projectName,
      subtitle: proj.role || "Project",
      date: proj.startDate || new Date().toISOString().split("T")[0],
    });
  });

  // Sort by date and return top 10
  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

/**
 * Dashboard hook - uses unified cache, transforms data for dashboard display
 */
export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useUnifiedProfile();

  // Extract header from profile - parse fullName into firstName/lastName
  let header: ProfileHeader | null = null;
  if (data?.profile) {
    const fullName = data.profile.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    header = {
      firstName,
      lastName,
      name: fullName || "Your Name",
      email: data.profile.email || "",
      // Avatar is handled separately by AvatarContext, not stored in ProfileData
      avatarPath: null,
    };
  }

  // Refresh function - invalidates the single unified cache
  const refresh = () => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: unifiedProfileKeys.user(userId),
      });
    }
  };

  return {
    header,
    counts: {
      employmentCount: data?.employment.length ?? 0,
      skillsCount: data?.skills.length ?? 0,
      educationCount: data?.education.length ?? 0,
      projectsCount: data?.projects.length ?? 0,
      certificationsCount: data?.certifications.length ?? 0,
    },
    skills: data ? transformToSkillChartData(data.skills) : [],
    careerEvents: data ? transformToCareerEvents(data.employment) : [],
    recentActivity: data
      ? buildRecentActivity(
          data.employment,
          data.skills,
          data.education,
          data.projects
        )
      : [],
    loading: isLoading,
    hasError: isError,
    refresh,
  };
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Hook to get cache utilities for manual updates
 */
export function useProfileCacheUtils() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  return {
    /**
     * Invalidate the entire profile cache
     */
    invalidateAll: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: unifiedProfileKeys.user(userId),
        });

        // Some profile pages still use the legacy, section-scoped queries.
        // Invalidate those too so all profile screens stay consistent.
        queryClient.invalidateQueries({
          queryKey: profileKeys.user(userId),
        });
      }
    },

    /**
     * Get the current cached data without triggering a fetch
     */
    getCachedData: (): UnifiedProfileData | undefined => {
      if (!userId) return undefined;
      return queryClient.getQueryData(unifiedProfileKeys.user(userId));
    },

    /**
     * Optimistically update part of the cache
     */
    updateCache: (
      updater: (
        old: UnifiedProfileData | undefined
      ) => UnifiedProfileData | undefined
    ) => {
      if (userId) {
        queryClient.setQueryData(unifiedProfileKeys.user(userId), updater);
      }
    },
  };
}
