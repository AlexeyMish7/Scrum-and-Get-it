/**
 * SCHEDULED REPORTS SERVICE (UC-111)
 *
 * Manages scheduled progress reports and digest notifications.
 * Users can configure weekly/monthly reports sent to their accountability partners.
 *
 * Features:
 * - Configure report frequency
 * - Generate progress report content
 * - Track report history
 */

import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchAccountabilityPartnershipsWithProfiles,
  fetchCoreJobs,
} from "@shared/cache/coreFetchers";
import type { Result } from "@shared/services/types";

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

type DbPartnershipRow = {
  user_id: string;
  partner_id: string;
  team_id: string;
  status: string;
};

type DbJobRow = { id: number; job_status: string; created_at: string };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Report frequency options
 */
export type ReportFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "none";

/**
 * Report configuration
 */
export interface ReportConfig {
  userId: string;
  teamId: string;
  frequency: ReportFrequency;
  dayOfWeek?: number; // 0-6 for weekly reports
  dayOfMonth?: number; // 1-31 for monthly reports
  includeApplications: boolean;
  includeInterviews: boolean;
  includeGoals: boolean;
  includeStreak: boolean;
  recipients: string[]; // Partner IDs to send to
  isEnabled: boolean;
  lastSentAt?: string;
  nextScheduledAt?: string;
}

/**
 * Generated progress report
 */
export interface ProgressReport {
  id: string;
  userId: string;
  teamId: string;
  reportType: "weekly" | "monthly" | "custom";
  periodStart: string;
  periodEnd: string;

  // Summary metrics
  summary: {
    applicationsSubmitted: number;
    applicationsChange: number; // vs previous period
    interviewsScheduled: number;
    interviewsChange: number;
    offersReceived: number;
    goalsCompleted: number;
    currentStreak: number;
    activePartnersCount: number;
  };

  // Highlights
  highlights: string[];

  // Goals progress
  goalsProgress: {
    goalId: string;
    goalTitle: string;
    progressPercent: number;
    isCompleted: boolean;
  }[];

  // Status breakdown
  statusBreakdown: Record<string, number>;

  generatedAt: string;
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Get the storage key for report settings
 */
function getStorageKey(userId: string, teamId: string): string {
  return `report_settings_${userId}_${teamId}`;
}

/**
 * Load report settings from local storage
 */
function loadReportSettings(
  userId: string,
  teamId: string
): Partial<ReportConfig> {
  try {
    const stored = localStorage.getItem(getStorageKey(userId, teamId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

/**
 * Save report settings to local storage
 */
function saveReportSettings(
  userId: string,
  teamId: string,
  config: Partial<ReportConfig>
): void {
  try {
    localStorage.setItem(getStorageKey(userId, teamId), JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// REPORT CONFIGURATION
// ============================================================================

/**
 * Get or create report configuration for a user
 * Uses local storage since the database doesn't have a report_settings column
 */
export async function getReportConfig(
  userId: string,
  teamId: string
): Promise<Result<ReportConfig>> {
  // Load from local storage
  const reportSettings = loadReportSettings(userId, teamId);

  // Load partnerships from cache so report config doesn't trigger extra reads.
  let partnerIds: string[] = [];
  try {
    const qc = getAppQueryClient();
    const partnerships = await qc.ensureQueryData({
      queryKey: coreKeys.accountabilityPartnerships(userId, teamId),
      queryFn: () =>
        fetchAccountabilityPartnershipsWithProfiles<DbPartnershipRow>(
          userId,
          teamId
        ),
      staleTime: 60 * 60 * 1000,
    });
    partnerIds = (Array.isArray(partnerships) ? partnerships : [])
      .filter(
        (p) =>
          p.user_id === userId && p.team_id === teamId && p.status === "active"
      )
      .map((p) => p.partner_id)
      .filter(Boolean);
  } catch {
    partnerIds = [];
  }

  const config: ReportConfig = {
    userId,
    teamId,
    frequency: (reportSettings.frequency as ReportFrequency) || "weekly",
    dayOfWeek: (reportSettings.dayOfWeek as number) || 1, // Monday
    dayOfMonth: (reportSettings.dayOfMonth as number) || 1,
    includeApplications: reportSettings.includeApplications !== false,
    includeInterviews: reportSettings.includeInterviews !== false,
    includeGoals: reportSettings.includeGoals !== false,
    includeStreak: reportSettings.includeStreak !== false,
    recipients: (reportSettings.recipients as string[]) || partnerIds,
    isEnabled: reportSettings.isEnabled !== false,
    lastSentAt: reportSettings.lastSentAt as string | undefined,
    nextScheduledAt: calculateNextScheduledDate(
      (reportSettings.frequency as ReportFrequency) || "weekly",
      (reportSettings.dayOfWeek as number) || 1
    ),
  };

  return {
    data: config,
    error: null,
    status: 200,
  };
}

/**
 * Update report configuration
 * Saves to local storage
 */
export async function updateReportConfig(
  userId: string,
  teamId: string,
  config: Partial<ReportConfig>
): Promise<Result<ReportConfig>> {
  // Load existing settings
  const existing = loadReportSettings(userId, teamId);

  // Merge new config
  const newSettings = {
    ...existing,
    frequency: config.frequency ?? existing.frequency,
    dayOfWeek: config.dayOfWeek ?? existing.dayOfWeek,
    dayOfMonth: config.dayOfMonth ?? existing.dayOfMonth,
    includeApplications:
      config.includeApplications ?? existing.includeApplications,
    includeInterviews: config.includeInterviews ?? existing.includeInterviews,
    includeGoals: config.includeGoals ?? existing.includeGoals,
    includeStreak: config.includeStreak ?? existing.includeStreak,
    recipients: config.recipients ?? existing.recipients,
    isEnabled: config.isEnabled ?? existing.isEnabled,
  };

  // Save to local storage
  saveReportSettings(userId, teamId, newSettings);

  return getReportConfig(userId, teamId);
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate a progress report for a specific period
 */
export async function generateProgressReport(
  userId: string,
  teamId: string,
  reportType: "weekly" | "monthly" | "custom" = "weekly",
  customPeriodDays?: number
): Promise<Result<ProgressReport>> {
  const now = new Date();
  let periodStart: Date;
  const periodEnd: Date = now;

  // Calculate period based on report type
  switch (reportType) {
    case "weekly":
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "custom":
      periodStart = new Date(
        now.getTime() - (customPeriodDays || 7) * 24 * 60 * 60 * 1000
      );
      break;
  }

  // Calculate previous period for comparison
  const periodLength = periodEnd.getTime() - periodStart.getTime();
  const prevPeriodStart = new Date(periodStart.getTime() - periodLength);
  const prevPeriodEnd = periodStart;

  // Use cached core jobs list and filter client-side.
  let allJobs: DbJobRow[] = [];
  try {
    const qc = getAppQueryClient();
    const jobs = await qc.ensureQueryData({
      queryKey: coreKeys.jobs(userId),
      queryFn: () => fetchCoreJobs<DbJobRow>(userId),
      staleTime: 60 * 60 * 1000,
    });
    allJobs = Array.isArray(jobs) ? jobs : [];
  } catch (e: unknown) {
    return {
      data: null,
      error: {
        message: toErrorMessage(e) || "Failed to load jobs",
        status: null,
      },
      status: null,
    };
  }

  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const prevStartMs = prevPeriodStart.getTime();
  const prevEndMs = prevPeriodEnd.getTime();

  const currentJobs = allJobs.filter((j) => {
    const t = new Date(j.created_at).getTime();
    return t >= startMs && t < endMs;
  });
  const prevJobs = allJobs.filter((j) => {
    const t = new Date(j.created_at).getTime();
    return t >= prevStartMs && t < prevEndMs;
  });

  // Get partnerships
  let partnerships: DbPartnershipRow[] = [];
  try {
    const qc = getAppQueryClient();
    const all = await qc.ensureQueryData({
      queryKey: coreKeys.accountabilityPartnerships(userId, teamId),
      queryFn: () =>
        fetchAccountabilityPartnershipsWithProfiles<DbPartnershipRow>(
          userId,
          teamId
        ),
      staleTime: 60 * 60 * 1000,
    });
    partnerships = (Array.isArray(all) ? all : []).filter(
      (p) => p.user_id === userId && p.status === "active"
    );
  } catch {
    partnerships = [];
  }

  // Calculate metrics
  const currentApplications = currentJobs?.length || 0;
  const prevApplications = prevJobs?.length || 0;
  const applicationsChange = currentApplications - prevApplications;

  const currentInterviews =
    currentJobs?.filter((j) =>
      ["Phone Screen", "Interview", "Offer", "Accepted"].includes(j.job_status)
    ).length || 0;
  const prevInterviews =
    prevJobs?.filter((j) =>
      ["Phone Screen", "Interview", "Offer", "Accepted"].includes(j.job_status)
    ).length || 0;
  const interviewsChange = currentInterviews - prevInterviews;

  const offers =
    currentJobs?.filter((j) => ["Offer", "Accepted"].includes(j.job_status))
      .length || 0;

  // Calculate status breakdown
  const statusBreakdown: Record<string, number> = {};
  (currentJobs || []).forEach((job) => {
    statusBreakdown[job.job_status] =
      (statusBreakdown[job.job_status] || 0) + 1;
  });

  // Calculate streak
  let currentStreak = 0;
  if (allJobs && allJobs.length > 0) {
    const activityDates = new Set(
      allJobs.map((j) => new Date(j.created_at).toDateString())
    );
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (activityDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  // Generate highlights
  const highlights: string[] = [];
  if (currentApplications > 0) {
    highlights.push(
      `Submitted ${currentApplications} application${
        currentApplications > 1 ? "s" : ""
      }`
    );
  }
  if (applicationsChange > 0) {
    highlights.push(
      `${applicationsChange} more applications than last ${
        reportType === "weekly" ? "week" : "month"
      }`
    );
  }
  if (currentInterviews > 0) {
    highlights.push(
      `${currentInterviews} interview${
        currentInterviews > 1 ? "s" : ""
      } in progress`
    );
  }
  if (offers > 0) {
    highlights.push(`🎉 Received ${offers} offer${offers > 1 ? "s" : ""}!`);
  }
  if (currentStreak >= 3) {
    highlights.push(`🔥 ${currentStreak}-day activity streak!`);
  }

  const report: ProgressReport = {
    id: crypto.randomUUID(),
    userId,
    teamId,
    reportType,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    summary: {
      applicationsSubmitted: currentApplications,
      applicationsChange,
      interviewsScheduled: currentInterviews,
      interviewsChange,
      offersReceived: offers,
      goalsCompleted: 0, // Would need goals table
      currentStreak,
      activePartnersCount: partnerships?.length || 0,
    },
    highlights,
    goalsProgress: [], // Would need goals implementation
    statusBreakdown,
    generatedAt: new Date().toISOString(),
  };

  return {
    data: report,
    error: null,
    status: 200,
  };
}

/**
 * Get report history for a user
 */
export async function getReportHistory(
  userId: string,
  teamId: string,
  limit: number = 10
): Promise<Result<ProgressReport[]>> {
  // For now, generate recent reports on demand
  // Future: Store reports in database for history
  const reports: ProgressReport[] = [];

  // Generate last few weekly reports
  for (let i = 0; i < Math.min(limit, 4); i++) {
    const endDate = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await generateProgressReport(userId, teamId, "weekly");
    if (result.data) {
      result.data.periodStart = startDate.toISOString();
      result.data.periodEnd = endDate.toISOString();
      reports.push(result.data);
    }
  }

  return {
    data: reports,
    error: null,
    status: 200,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate next scheduled report date
 */
function calculateNextScheduledDate(
  frequency: ReportFrequency,
  dayOfWeek: number = 1
): string {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      break;
    case "weekly": {
      const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      next.setHours(9, 0, 0, 0);
      break;
    }
    case "biweekly": {
      const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntil + 7);
      next.setHours(9, 0, 0, 0);
      break;
    }
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
    default:
      return "";
  }

  return next.toISOString();
}
