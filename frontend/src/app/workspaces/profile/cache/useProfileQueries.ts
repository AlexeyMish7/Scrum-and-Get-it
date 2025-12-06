/**
 * PROFILE QUERIES (React Query Hooks)
 *
 * Unified data fetching for the profile workspace.
 * Uses a single query per data type that both dashboard and detail pages share.
 *
 * Key Design:
 * - ONE query per data type (not separate count vs list queries)
 * - Dashboard derives counts from full data
 * - Detail pages use full data directly
 * - All consumers share the same cache entry
 *
 * Data Flow:
 *   Service call → React Query cache → Multiple consumers
 *   └── Dashboard gets counts via useDashboardQueries
 *   └── List pages get full data via useEmploymentList, etc.
 */
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "./queryKeys";
import { CACHE_STALE_TIME, CACHE_GC_TIME } from "./cacheConfig";
import { useAuth } from "@shared/context/AuthContext";

// Services for data fetching - using named exports
import { listSkills } from "@profile/services/skills";
import { listEducation } from "@profile/services/education";
import employmentService from "@profile/services/employment";
import projectsService from "@profile/services/projects";
import certificationsService from "@profile/services/certifications";
import profileService, { getProfile } from "@profile/services/profileService";

// Types for each profile section
import type { EmploymentRow } from "@profile/types/employment";
import type { EducationEntry } from "@profile/types/education";
import type { SkillItem } from "@profile/types/skill";
import type { Project } from "@profile/types/project";
import type { Certification } from "@profile/types/certification";
import type { ProfileData } from "@profile/types/profile";

// Type for the profile header display
export interface ProfileHeader {
  firstName: string;
  lastName: string;
  name: string; // Computed full name for display
  email: string;
}

// Type for career timeline events (transformed from employment)
export interface CareerEvent {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

// Type for skills chart visualization
export interface SkillChartData {
  name: string;
  value: number;
}

// ============================================================================
// FETCHER FUNCTIONS
// Each fetcher returns the full data list for a profile section
// ============================================================================

/**
 * Fetches user profile header (name, email)
 */
async function fetchProfileHeader(
  userId: string
): Promise<ProfileHeader | null> {
  const result = await getProfile(userId);
  if (!result?.data) return null;

  const profile = result.data;
  const firstName =
    ((profile as Record<string, unknown>)["first_name"] as string) ?? "";
  const lastName =
    ((profile as Record<string, unknown>)["last_name"] as string) ?? "";

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || "Your Name",
    email: ((profile as Record<string, unknown>)["email"] as string) ?? "",
  };
}

/**
 * Fetches full profile data for the ProfileDetails page
 * Returns ProfileData shape used by the form
 */
async function fetchFullProfile(userId: string): Promise<ProfileData | null> {
  const result = await getProfile(userId);
  if (!result?.data) return null;

  // Use the existing mapper to convert DB row to ProfileData
  return profileService.mapRowToProfile(result.data as Record<string, unknown>);
}

/**
 * Fetches all employment records for a user
 */
async function fetchEmploymentList(userId: string): Promise<EmploymentRow[]> {
  const result = await employmentService.listEmployment(userId);
  if (!result?.data) return [];
  return Array.isArray(result.data)
    ? (result.data as EmploymentRow[])
    : [result.data as EmploymentRow];
}

/**
 * Fetches all education records for a user
 */
async function fetchEducationList(userId: string): Promise<EducationEntry[]> {
  const result = await listEducation(userId);
  return result.data ?? [];
}

/**
 * Fetches all skills for a user
 */
async function fetchSkillsList(userId: string): Promise<SkillItem[]> {
  const result = await listSkills(userId);
  return result.data ?? [];
}

/**
 * Fetches all projects for a user
 * Note: Returns raw ProjectRow[], component does any needed mapping
 */
async function fetchProjectsList(userId: string): Promise<Project[]> {
  const result = await projectsService.listProjects(userId);
  if (!result?.data) return [];
  // Map raw rows to UI-friendly Project type
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  return rows.map((row) => projectsService.mapRowToProject(row));
}

/**
 * Fetches all certifications for a user
 */
async function fetchCertificationsList(
  userId: string
): Promise<Certification[]> {
  const result = await certificationsService.listCertifications(userId);
  if (!result?.data) return [];
  // Map raw rows to UI-friendly Certification type
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  return rows.map((row) => certificationsService.mapRowToCertification(row));
}

// ============================================================================
// INDIVIDUAL DATA HOOKS (Full data for detail pages)
// ============================================================================

/**
 * Hook for profile header data
 */
export function useProfileHeader() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.header(userId),
    queryFn: () => fetchProfileHeader(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

/**
 * Hook for full profile data (all fields)
 * Used by ProfileDetails page for editing
 */
export function useFullProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.fullProfile(userId),
    queryFn: () => fetchFullProfile(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

/**
 * Hook for full employment list
 * Used by both dashboard (for count/events) and EmploymentHistoryList page
 */
export function useEmployment() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.employment(userId),
    queryFn: () => fetchEmploymentList(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// Alias for backward compatibility with list pages
export const useEmploymentList = useEmployment;

/**
 * Hook for full education list
 */
export function useEducation() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.education(userId),
    queryFn: () => fetchEducationList(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// Alias for backward compatibility with list pages
export const useEducationList = useEducation;

/**
 * Hook for full skills list
 */
export function useSkills() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.skills(userId),
    queryFn: () => fetchSkillsList(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// Alias for backward compatibility with list pages
export const useSkillsList = useSkills;

/**
 * Hook for full projects list
 */
export function useProjects() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.projects(userId),
    queryFn: () => fetchProjectsList(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// Alias for backward compatibility with list pages
export const useProjectsList = useProjects;

/**
 * Hook for full certifications list
 */
export function useCertifications() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: profileKeys.certifications(userId),
    queryFn: () => fetchCertificationsList(userId),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}

// Alias for backward compatibility with list pages
export const useCertificationsList = useCertifications;

// ============================================================================
// DASHBOARD AGGREGATE HOOK
// Fetches all data in parallel and derives counts
// ============================================================================

// Type for recent activity items (derived from cached data)
export interface RecentActivityItem {
  id: string;
  date: string;
  description: string;
}

interface DashboardData {
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

/**
 * Transforms employment records into career timeline events
 * Maps from EmploymentRow database fields to CareerEvent UI fields
 */
function transformToCareerEvents(employment: EmploymentRow[]): CareerEvent[] {
  return employment.map((job) => ({
    id: job.id,
    company: job.company_name,
    title: job.job_title,
    startDate: job.start_date,
    endDate: job.end_date ?? null,
    isCurrent: job.current_position,
  }));
}

/**
 * Transforms skills into chart-friendly format
 * Groups by proficiency level for pie/bar charts
 */
function transformToSkillChartData(skills: SkillItem[]): SkillChartData[] {
  // Group skills by proficiency level and count
  const proficiencyGroups: Record<string, number> = {};

  skills.forEach((skill) => {
    // Convert level to string (it could be string or number)
    const level =
      typeof skill.level === "string"
        ? skill.level
        : skill.level === 1
        ? "Beginner"
        : skill.level === 2
        ? "Intermediate"
        : skill.level === 3
        ? "Advanced"
        : skill.level === 4
        ? "Expert"
        : "Unspecified";

    proficiencyGroups[level] = (proficiencyGroups[level] ?? 0) + 1;
  });

  // Convert to array format for charts
  return Object.entries(proficiencyGroups).map(([name, value]) => ({
    name,
    value,
  }));
}

/**
 * Builds recent activity list from all profile data
 * Sorts by created_at date and returns the most recent items
 */
function buildRecentActivity(
  employment: EmploymentRow[],
  skills: SkillItem[],
  education: EducationEntry[],
  projects: Project[]
): RecentActivityItem[] {
  const activities: RecentActivityItem[] = [];

  // Add employment entries
  employment.forEach((job) => {
    if (job.created_at) {
      activities.push({
        id: `employment-${job.id}`,
        date: job.created_at,
        description: `Added ${job.job_title} at ${job.company_name}`,
      });
    }
  });

  // Add skills (use id as fallback if no created_at in the type)
  skills.forEach((skill) => {
    // SkillItem comes from DbSkillRow which has created_at
    const rawSkill = skill as unknown as { created_at?: string; id?: string };
    if (rawSkill.created_at) {
      activities.push({
        id: `skill-${skill.id ?? rawSkill.id}`,
        date: rawSkill.created_at,
        description: `Added skill: ${skill.name}`,
      });
    }
  });

  // Add education entries
  education.forEach((edu) => {
    // EducationEntry may have created_at from the raw row
    const rawEdu = edu as unknown as { created_at?: string };
    if (rawEdu.created_at) {
      activities.push({
        id: `education-${edu.id}`,
        date: rawEdu.created_at,
        description: `Added ${edu.degree} from ${edu.institution}`,
      });
    }
  });

  // Add project entries
  projects.forEach((project) => {
    // Project may have created_at from the raw row
    const rawProject = project as unknown as { created_at?: string };
    if (rawProject.created_at) {
      activities.push({
        id: `project-${project.id}`,
        date: rawProject.created_at,
        description: `Added project: ${project.name}`,
      });
    }
  });

  // Sort by date descending (most recent first) and take top 10
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

/**
 * Dashboard aggregate hook - fetches all profile data in parallel
 * Uses the same cache entries as individual hooks
 */
export function useDashboardQueries(): DashboardData {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  // Fetch all data in parallel using the same query keys
  const results = useQueries({
    queries: [
      {
        queryKey: profileKeys.header(userId),
        queryFn: () => fetchProfileHeader(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
      {
        queryKey: profileKeys.employment(userId),
        queryFn: () => fetchEmploymentList(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
      {
        queryKey: profileKeys.skills(userId),
        queryFn: () => fetchSkillsList(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
      {
        queryKey: profileKeys.education(userId),
        queryFn: () => fetchEducationList(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
      {
        queryKey: profileKeys.projects(userId),
        queryFn: () => fetchProjectsList(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
      {
        queryKey: profileKeys.certifications(userId),
        queryFn: () => fetchCertificationsList(userId),
        enabled: !!userId,
        staleTime: CACHE_STALE_TIME,
        gcTime: CACHE_GC_TIME,
      },
    ],
  });

  // Destructure results
  const [
    headerQuery,
    employmentQuery,
    skillsQuery,
    educationQuery,
    projectsQuery,
    certificationsQuery,
  ] = results;

  // Aggregate loading and error states
  const loading = results.some((q) => q.isLoading);
  const hasError = results.some((q) => q.isError);

  // Extract and transform data
  const header = (headerQuery.data as ProfileHeader | null) ?? null;
  const employment = (employmentQuery.data as EmploymentRow[]) ?? [];
  const skills = (skillsQuery.data as SkillItem[]) ?? [];
  const education = (educationQuery.data as EducationEntry[]) ?? [];
  const projects = (projectsQuery.data as Project[]) ?? [];
  const certifications = (certificationsQuery.data as Certification[]) ?? [];

  // Refresh function invalidates all profile queries
  const refresh = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
    }
  };

  return {
    header,
    counts: {
      employmentCount: employment.length,
      skillsCount: skills.length,
      educationCount: education.length,
      projectsCount: projects.length,
      certificationsCount: certifications.length,
    },
    skills: transformToSkillChartData(skills),
    careerEvents: transformToCareerEvents(employment),
    recentActivity: buildRecentActivity(
      employment,
      skills,
      education,
      projects
    ),
    loading,
    hasError,
    refresh,
  };
}
