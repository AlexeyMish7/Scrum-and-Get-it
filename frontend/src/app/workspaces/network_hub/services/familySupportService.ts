/**
 * FAMILY SUPPORT SERVICE (UC-113)
 *
 * Handles all database operations for family and personal support integration.
 * Uses direct Supabase access with RLS enforcement.
 *
 * Features:
 * - Invite and manage family supporters with customized permissions
 * - Generate family-friendly progress summaries (no sensitive details)
 * - Create and share milestones/celebrations
 * - Track stress levels and well-being metrics
 * - Set and communicate support boundaries
 * - Access educational resources for supporters
 * - Send updates and communications to supporters
 */

import { supabase } from "@shared/services/supabaseClient";
import type { Result } from "@shared/services/types";
import type {
  FamilySupporterRow,
  FamilySupportSettingsRow,
  FamilyProgressSummaryRow,
  FamilyMilestoneRow,
  FamilyResourceRow,
  StressMetricsRow,
  SupportBoundaryRow,
  FamilyCommunicationRow,
  FamilySupporterWithProfile,
  FamilySupportDashboard,
  WellBeingAnalytics,
  InviteSupporterData,
  UpdateSupporterPermissionsData,
  UpdateFamilySupportSettingsData,
  CreateProgressSummaryData,
  CreateMilestoneData,
  StressCheckInData,
  CreateBoundaryData,
  SendCommunicationData,
  SupporterFilters,
  MilestoneFilters,
  StressMetricsFilters,
  ResourceFilters,
  MilestoneReaction,
} from "../types/familySupport.types";

// ============================================================================
// SUPPORTER MANAGEMENT
// ============================================================================

/**
 * Get all supporters for the current user
 * Includes both active and pending invitations
 */
export async function getSupporters(
  userId: string,
  filters?: SupporterFilters
): Promise<Result<FamilySupporterWithProfile[]>> {
  let query = supabase
    .from("family_supporters")
    .select(
      `
      *,
      supporterProfile:profiles!supporter_user_id(
        full_name, email, avatar_url
      )
    `
    )
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: data as FamilySupporterWithProfile[],
    error: null,
    status: 200,
  };
}

/**
 * Get active supporters only
 */
export async function getActiveSupporters(
  userId: string
): Promise<Result<FamilySupporterWithProfile[]>> {
  return getSupporters(userId, { status: "active" });
}

/**
 * Get pending invitations
 */
export async function getPendingInvitations(
  userId: string
): Promise<Result<FamilySupporterRow[]>> {
  const { data, error } = await supabase
    .from("family_supporters")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("invited_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilySupporterRow[], error: null, status: 200 };
}

/**
 * Invite a new family supporter
 * Generates an invitation token for email-based invitation
 */
export async function inviteSupporter(
  userId: string,
  data: InviteSupporterData
): Promise<Result<FamilySupporterRow>> {
  // Generate unique invitation token
  const token = crypto.randomUUID();

  // Check if supporter already exists
  const { data: existing } = await supabase
    .from("family_supporters")
    .select("id, status")
    .eq("user_id", userId)
    .eq("supporter_email", data.supporterEmail.toLowerCase())
    .single();

  if (existing) {
    if (existing.status === "active") {
      return {
        data: null,
        error: { message: "This person is already a supporter", status: 400 },
        status: 400,
      };
    }
    // Re-invite if previously removed or declined
    const { data: updated, error } = await supabase
      .from("family_supporters")
      .update({
        status: "pending",
        invitation_token: token,
        invitation_message: data.invitationMessage || null,
        invited_at: new Date().toISOString(),
        declined_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, status: null },
        status: null,
      };
    }

    return { data: updated as FamilySupporterRow, error: null, status: 200 };
  }

  // Create new supporter invitation
  const { data: supporter, error } = await supabase
    .from("family_supporters")
    .insert({
      user_id: userId,
      supporter_email: data.supporterEmail.toLowerCase(),
      supporter_name: data.supporterName,
      role: data.role,
      custom_role_name: data.customRoleName || null,
      invitation_token: token,
      invitation_message: data.invitationMessage || null,
      can_view_applications: data.permissions.canViewApplications ?? true,
      can_view_interviews: data.permissions.canViewInterviews ?? true,
      can_view_progress: data.permissions.canViewProgress ?? true,
      can_view_milestones: data.permissions.canViewMilestones ?? true,
      can_view_stress: data.permissions.canViewStress ?? false,
      can_send_encouragement: data.permissions.canSendEncouragement ?? true,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: supporter as FamilySupporterRow, error: null, status: 201 };
}

/**
 * Update supporter permissions
 */
export async function updateSupporterPermissions(
  userId: string,
  supporterId: string,
  data: UpdateSupporterPermissionsData
): Promise<Result<FamilySupporterRow>> {
  const updates: Record<string, unknown> = {};

  if (data.canViewApplications !== undefined)
    updates.can_view_applications = data.canViewApplications;
  if (data.canViewInterviews !== undefined)
    updates.can_view_interviews = data.canViewInterviews;
  if (data.canViewProgress !== undefined)
    updates.can_view_progress = data.canViewProgress;
  if (data.canViewMilestones !== undefined)
    updates.can_view_milestones = data.canViewMilestones;
  if (data.canViewStress !== undefined)
    updates.can_view_stress = data.canViewStress;
  if (data.canSendEncouragement !== undefined)
    updates.can_send_encouragement = data.canSendEncouragement;
  if (data.notifyOnMilestones !== undefined)
    updates.notify_on_milestones = data.notifyOnMilestones;
  if (data.notifyOnUpdates !== undefined)
    updates.notify_on_updates = data.notifyOnUpdates;
  if (data.notifyFrequency !== undefined)
    updates.notify_frequency = data.notifyFrequency;

  const { data: result, error } = await supabase
    .from("family_supporters")
    .update(updates)
    .eq("id", supporterId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as FamilySupporterRow, error: null, status: 200 };
}

/**
 * Remove a supporter
 */
export async function removeSupporter(
  userId: string,
  supporterId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("family_supporters")
    .update({ status: "removed" })
    .eq("id", supporterId)
    .eq("user_id", userId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Resend invitation to a pending supporter
 */
export async function resendInvitation(
  userId: string,
  supporterId: string
): Promise<Result<FamilySupporterRow>> {
  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from("family_supporters")
    .update({
      invitation_token: token,
      invited_at: new Date().toISOString(),
    })
    .eq("id", supporterId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilySupporterRow, error: null, status: 200 };
}

// ============================================================================
// FAMILY SUPPORT SETTINGS
// ============================================================================

/**
 * Get user's family support settings
 * Creates default settings if none exist
 */
export async function getFamilySupportSettings(
  userId: string
): Promise<Result<FamilySupportSettingsRow>> {
  const { data, error } = await supabase
    .from("family_support_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No settings found, create defaults
    return createDefaultSettings(userId);
  }

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilySupportSettingsRow, error: null, status: 200 };
}

/**
 * Create default family support settings
 */
async function createDefaultSettings(
  userId: string
): Promise<Result<FamilySupportSettingsRow>> {
  const { data, error } = await supabase
    .from("family_support_settings")
    .insert({
      user_id: userId,
      family_support_enabled: true,
      auto_share_milestones: false,
      default_view_applications: true,
      default_view_interviews: true,
      default_view_progress: true,
      default_view_milestones: true,
      default_view_stress: false,
      hide_salary_info: true,
      hide_rejection_details: true,
      hide_company_names: false,
      digest_frequency: "weekly",
      stress_tracking_enabled: true,
      stress_alert_threshold: "high",
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: data as FamilySupportSettingsRow,
    error: null,
    status: 201,
  };
}

/**
 * Update family support settings
 */
export async function updateFamilySupportSettings(
  userId: string,
  data: UpdateFamilySupportSettingsData
): Promise<Result<FamilySupportSettingsRow>> {
  // Ensure settings exist
  await getFamilySupportSettings(userId);

  const updates: Record<string, unknown> = {};

  if (data.familySupportEnabled !== undefined)
    updates.family_support_enabled = data.familySupportEnabled;
  if (data.autoShareMilestones !== undefined)
    updates.auto_share_milestones = data.autoShareMilestones;
  if (data.defaultViewApplications !== undefined)
    updates.default_view_applications = data.defaultViewApplications;
  if (data.defaultViewInterviews !== undefined)
    updates.default_view_interviews = data.defaultViewInterviews;
  if (data.defaultViewProgress !== undefined)
    updates.default_view_progress = data.defaultViewProgress;
  if (data.defaultViewMilestones !== undefined)
    updates.default_view_milestones = data.defaultViewMilestones;
  if (data.defaultViewStress !== undefined)
    updates.default_view_stress = data.defaultViewStress;
  if (data.hideSalaryInfo !== undefined)
    updates.hide_salary_info = data.hideSalaryInfo;
  if (data.hideRejectionDetails !== undefined)
    updates.hide_rejection_details = data.hideRejectionDetails;
  if (data.hideCompanyNames !== undefined)
    updates.hide_company_names = data.hideCompanyNames;
  if (data.digestFrequency !== undefined)
    updates.digest_frequency = data.digestFrequency;
  if (data.stressTrackingEnabled !== undefined)
    updates.stress_tracking_enabled = data.stressTrackingEnabled;
  if (data.stressAlertThreshold !== undefined)
    updates.stress_alert_threshold = data.stressAlertThreshold;

  const { data: result, error } = await supabase
    .from("family_support_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as FamilySupportSettingsRow, error: null, status: 200 };
}

// ============================================================================
// PROGRESS SUMMARIES
// ============================================================================

/**
 * Get progress summaries for the user
 */
export async function getProgressSummaries(
  userId: string,
  limit: number = 10
): Promise<Result<FamilyProgressSummaryRow[]>> {
  const { data, error } = await supabase
    .from("family_progress_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: data as FamilyProgressSummaryRow[],
    error: null,
    status: 200,
  };
}

/**
 * Get shared summaries (for supporters to view)
 */
export async function getSharedSummaries(
  userId: string,
  limit: number = 5
): Promise<Result<FamilyProgressSummaryRow[]>> {
  const { data, error } = await supabase
    .from("family_progress_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("is_shared", true)
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: data as FamilyProgressSummaryRow[],
    error: null,
    status: 200,
  };
}

/**
 * Create a progress summary
 */
export async function createProgressSummary(
  userId: string,
  data: CreateProgressSummaryData
): Promise<Result<FamilyProgressSummaryRow>> {
  const { data: result, error } = await supabase
    .from("family_progress_summaries")
    .insert({
      user_id: userId,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      period_type: data.periodType,
      title: data.title,
      summary_text: data.summaryText,
      highlights: data.highlights || [],
      upcoming_events: data.upcomingEvents || [],
      is_shared: data.isShared ?? false,
      shared_at: data.isShared ? new Date().toISOString() : null,
      shared_with_all: data.sharedWithAll ?? true,
      shared_with_supporters: data.sharedWithSupporters || [],
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: result as FamilyProgressSummaryRow,
    error: null,
    status: 201,
  };
}

/**
 * Share/unshare a progress summary
 */
export async function toggleSummarySharing(
  userId: string,
  summaryId: string,
  isShared: boolean,
  sharedWithAll: boolean = true,
  sharedWithSupporters: string[] = []
): Promise<Result<FamilyProgressSummaryRow>> {
  const { data, error } = await supabase
    .from("family_progress_summaries")
    .update({
      is_shared: isShared,
      shared_at: isShared ? new Date().toISOString() : null,
      shared_with_all: sharedWithAll,
      shared_with_supporters: sharedWithSupporters,
    })
    .eq("id", summaryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyProgressSummaryRow, error: null, status: 200 };
}

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * Get milestones for the user
 */
export async function getMilestones(
  userId: string,
  filters?: MilestoneFilters
): Promise<Result<FamilyMilestoneRow[]>> {
  let query = supabase
    .from("family_milestones")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });

  if (filters?.milestoneType) {
    query = query.eq("milestone_type", filters.milestoneType);
  }
  if (filters?.isShared !== undefined) {
    query = query.eq("is_shared", filters.isShared);
  }
  if (filters?.dateFrom) {
    query = query.gte("achieved_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("achieved_at", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyMilestoneRow[], error: null, status: 200 };
}

/**
 * Get shared milestones (for supporters)
 */
export async function getSharedMilestones(
  userId: string,
  limit: number = 10
): Promise<Result<FamilyMilestoneRow[]>> {
  const { data, error } = await supabase
    .from("family_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("is_shared", true)
    .order("achieved_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyMilestoneRow[], error: null, status: 200 };
}

/**
 * Create a milestone
 */
export async function createMilestone(
  userId: string,
  data: CreateMilestoneData
): Promise<Result<FamilyMilestoneRow>> {
  const { data: result, error } = await supabase
    .from("family_milestones")
    .insert({
      user_id: userId,
      milestone_type: data.milestoneType,
      title: data.title,
      description: data.description || null,
      milestone_value: data.milestoneValue || null,
      related_job_id: data.relatedJobId || null,
      celebration_message: data.celebrationMessage || null,
      celebration_emoji: data.celebrationEmoji || "🎉",
      is_shared: data.isShared ?? false,
      shared_at: data.isShared ? new Date().toISOString() : null,
      shared_with_all: data.sharedWithAll ?? true,
      shared_with_supporters: data.sharedWithSupporters || [],
      is_auto_generated: false,
      achieved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as FamilyMilestoneRow, error: null, status: 201 };
}

/**
 * Share/unshare a milestone
 */
export async function toggleMilestoneSharing(
  userId: string,
  milestoneId: string,
  isShared: boolean,
  sharedWithAll: boolean = true,
  sharedWithSupporters: string[] = []
): Promise<Result<FamilyMilestoneRow>> {
  const { data, error } = await supabase
    .from("family_milestones")
    .update({
      is_shared: isShared,
      shared_at: isShared ? new Date().toISOString() : null,
      shared_with_all: sharedWithAll,
      shared_with_supporters: sharedWithSupporters,
    })
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyMilestoneRow, error: null, status: 200 };
}

/**
 * Add a reaction to a milestone (by supporter)
 */
export async function addMilestoneReaction(
  milestoneId: string,
  supporterId: string,
  supporterName: string,
  emoji: string,
  message?: string
): Promise<Result<boolean>> {
  // Get current reactions
  const { data: milestone, error: fetchError } = await supabase
    .from("family_milestones")
    .select("reactions")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    return {
      data: null,
      error: { message: fetchError.message, status: null },
      status: null,
    };
  }

  const currentReactions = (milestone.reactions as MilestoneReaction[]) || [];

  // Add new reaction
  const newReaction: MilestoneReaction = {
    supporter_id: supporterId,
    supporter_name: supporterName,
    emoji,
    message: message || undefined,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("family_milestones")
    .update({
      reactions: [...currentReactions, newReaction],
    })
    .eq("id", milestoneId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// STRESS TRACKING
// ============================================================================

/**
 * Get stress metrics for the user
 */
export async function getStressMetrics(
  userId: string,
  filters?: StressMetricsFilters
): Promise<Result<StressMetricsRow[]>> {
  let query = supabase
    .from("stress_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("check_in_date", { ascending: false });

  if (filters?.dateFrom) {
    query = query.gte("check_in_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("check_in_date", filters.dateTo);
  }
  if (filters?.stressLevel) {
    query = query.eq("stress_level", filters.stressLevel);
  }
  if (filters?.mood) {
    query = query.eq("mood", filters.mood);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as StressMetricsRow[], error: null, status: 200 };
}

/**
 * Get today's stress check-in
 */
export async function getTodaysCheckIn(
  userId: string
): Promise<Result<StressMetricsRow | null>> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("stress_metrics")
    .select("*")
    .eq("user_id", userId)
    .eq("check_in_date", today)
    .single();

  if (error && error.code === "PGRST116") {
    // No check-in today
    return { data: null, error: null, status: 200 };
  }

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as StressMetricsRow, error: null, status: 200 };
}

/**
 * Create or update daily stress check-in
 */
export async function submitStressCheckIn(
  userId: string,
  data: StressCheckInData
): Promise<Result<StressMetricsRow>> {
  const today = new Date().toISOString().split("T")[0];

  // Check if check-in exists for today
  const { data: existing } = await supabase
    .from("stress_metrics")
    .select("id")
    .eq("user_id", userId)
    .eq("check_in_date", today)
    .single();

  const checkInData = {
    user_id: userId,
    check_in_date: today,
    check_in_time: new Date().toISOString(),
    stress_level: data.stressLevel,
    mood: data.mood,
    stress_score: data.stressScore,
    energy_level: data.energyLevel || null,
    motivation_level: data.motivationLevel || null,
    notes: data.notes || null,
    stress_factors: data.stressFactors || [],
    positive_factors: data.positiveFactors || [],
    self_care_activities: data.selfCareActivities || [],
    sleep_quality: data.sleepQuality || null,
    job_search_hours: data.jobSearchHours || null,
    applications_today: data.applicationsToday || 0,
  };

  if (existing) {
    // Update existing check-in
    const { data: result, error } = await supabase
      .from("stress_metrics")
      .update(checkInData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, status: null },
        status: null,
      };
    }

    return { data: result as StressMetricsRow, error: null, status: 200 };
  }

  // Create new check-in
  const { data: result, error } = await supabase
    .from("stress_metrics")
    .insert(checkInData)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as StressMetricsRow, error: null, status: 201 };
}

/**
 * Get well-being analytics
 */
export async function getWellBeingAnalytics(
  userId: string,
  days: number = 30
): Promise<Result<WellBeingAnalytics>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("stress_metrics")
    .select("*")
    .eq("user_id", userId)
    .gte("check_in_date", startDate.toISOString().split("T")[0])
    .order("check_in_date", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  const metrics = data as StressMetricsRow[];

  if (metrics.length === 0) {
    return {
      data: {
        averageStress: 0,
        averageMood: 0,
        stressTrend: "stable",
        moodTrend: "stable",
        topStressFactors: [],
        topPositiveFactors: [],
        selfCareFrequency: [],
        weeklyBreakdown: [],
      },
      error: null,
      status: 200,
    };
  }

  // Calculate averages
  const avgStress =
    metrics.reduce((sum, m) => sum + m.stress_score, 0) / metrics.length;

  // Map mood to numeric for averaging
  const moodMap = { great: 5, good: 4, okay: 3, struggling: 2, overwhelmed: 1 };
  const avgMoodScore =
    metrics.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) /
    metrics.length;

  // Calculate trends (compare first half to second half)
  const midpoint = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, midpoint);
  const secondHalf = metrics.slice(midpoint);

  const firstHalfAvgStress =
    firstHalf.reduce((sum, m) => sum + m.stress_score, 0) / firstHalf.length ||
    0;
  const secondHalfAvgStress =
    secondHalf.reduce((sum, m) => sum + m.stress_score, 0) /
      secondHalf.length || 0;

  let stressTrend: "improving" | "stable" | "worsening" = "stable";
  if (secondHalfAvgStress < firstHalfAvgStress - 0.5) stressTrend = "improving";
  else if (secondHalfAvgStress > firstHalfAvgStress + 0.5)
    stressTrend = "worsening";

  const firstHalfAvgMood =
    firstHalf.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) /
      firstHalf.length || 0;
  const secondHalfAvgMood =
    secondHalf.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) /
      secondHalf.length || 0;

  let moodTrend: "improving" | "stable" | "worsening" = "stable";
  if (secondHalfAvgMood > firstHalfAvgMood + 0.3) moodTrend = "improving";
  else if (secondHalfAvgMood < firstHalfAvgMood - 0.3) moodTrend = "worsening";

  // Count factors
  const stressFactorCounts: Record<string, number> = {};
  const positiveFactorCounts: Record<string, number> = {};
  const selfCareCounts: Record<string, number> = {};

  metrics.forEach((m) => {
    m.stress_factors.forEach((f) => {
      stressFactorCounts[f] = (stressFactorCounts[f] || 0) + 1;
    });
    m.positive_factors.forEach((f) => {
      positiveFactorCounts[f] = (positiveFactorCounts[f] || 0) + 1;
    });
    m.self_care_activities.forEach((a) => {
      selfCareCounts[a] = (selfCareCounts[a] || 0) + 1;
    });
  });

  const analytics: WellBeingAnalytics = {
    averageStress: Math.round(avgStress * 10) / 10,
    averageMood: Math.round(avgMoodScore * 10) / 10,
    stressTrend,
    moodTrend,
    topStressFactors: Object.entries(stressFactorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count })),
    topPositiveFactors: Object.entries(positiveFactorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count })),
    selfCareFrequency: Object.entries(selfCareCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count })),
    weeklyBreakdown: metrics.map((m) => ({
      date: m.check_in_date,
      stressScore: m.stress_score,
      mood: m.mood,
    })),
  };

  return { data: analytics, error: null, status: 200 };
}

// ============================================================================
// SUPPORT BOUNDARIES
// ============================================================================

/**
 * Get user's support boundaries
 */
export async function getBoundaries(
  userId: string
): Promise<Result<SupportBoundaryRow[]>> {
  const { data, error } = await supabase
    .from("support_boundaries")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as SupportBoundaryRow[], error: null, status: 200 };
}

/**
 * Get boundaries visible to supporters
 */
export async function getVisibleBoundaries(
  userId: string
): Promise<Result<SupportBoundaryRow[]>> {
  const { data, error } = await supabase
    .from("support_boundaries")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("show_to_supporters", true)
    .order("display_order", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as SupportBoundaryRow[], error: null, status: 200 };
}

/**
 * Create a support boundary
 */
export async function createBoundary(
  userId: string,
  data: CreateBoundaryData
): Promise<Result<SupportBoundaryRow>> {
  // Get next display order
  const { count } = await supabase
    .from("support_boundaries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: result, error } = await supabase
    .from("support_boundaries")
    .insert({
      user_id: userId,
      boundary_type: data.boundaryType,
      title: data.title,
      description: data.description,
      applies_to_all: data.appliesToAll ?? true,
      applies_to_supporters: data.appliesToSupporters || [],
      positive_alternatives: data.positiveAlternatives || [],
      show_to_supporters: data.showToSupporters ?? true,
      display_order: (count || 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as SupportBoundaryRow, error: null, status: 201 };
}

/**
 * Update a boundary
 */
export async function updateBoundary(
  userId: string,
  boundaryId: string,
  data: Partial<CreateBoundaryData>
): Promise<Result<SupportBoundaryRow>> {
  const updates: Record<string, unknown> = {};

  if (data.boundaryType !== undefined)
    updates.boundary_type = data.boundaryType;
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.appliesToAll !== undefined)
    updates.applies_to_all = data.appliesToAll;
  if (data.appliesToSupporters !== undefined)
    updates.applies_to_supporters = data.appliesToSupporters;
  if (data.positiveAlternatives !== undefined)
    updates.positive_alternatives = data.positiveAlternatives;
  if (data.showToSupporters !== undefined)
    updates.show_to_supporters = data.showToSupporters;

  const { data: result, error } = await supabase
    .from("support_boundaries")
    .update(updates)
    .eq("id", boundaryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as SupportBoundaryRow, error: null, status: 200 };
}

/**
 * Delete a boundary
 */
export async function deleteBoundary(
  userId: string,
  boundaryId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("support_boundaries")
    .update({ is_active: false })
    .eq("id", boundaryId)
    .eq("user_id", userId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// FAMILY RESOURCES
// ============================================================================

/**
 * Get educational resources for family members
 */
export async function getResources(
  filters?: ResourceFilters
): Promise<Result<FamilyResourceRow[]>> {
  let query = supabase
    .from("family_resources")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.contentType) {
    query = query.eq("content_type", filters.contentType);
  }
  if (filters?.isFeatured !== undefined) {
    query = query.eq("is_featured", filters.isFeatured);
  }
  if (filters?.targetAudience) {
    query = query.contains("target_audience", [filters.targetAudience]);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyResourceRow[], error: null, status: 200 };
}

/**
 * Get featured resources
 */
export async function getFeaturedResources(): Promise<
  Result<FamilyResourceRow[]>
> {
  return getResources({ isFeatured: true });
}

/**
 * Mark a resource as viewed
 */
export async function markResourceViewed(
  resourceId: string
): Promise<Result<boolean>> {
  const { error } = await supabase.rpc("increment_resource_view_count", {
    p_resource_id: resourceId,
  });

  // If RPC doesn't exist, just update directly
  if (error && error.code === "42883") {
    await supabase
      .from("family_resources")
      .update({ view_count: supabase.rpc("increment", { x: 1 }) })
      .eq("id", resourceId);
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Mark a resource as helpful
 */
export async function markResourceHelpful(
  resourceId: string
): Promise<Result<boolean>> {
  const { error } = await supabase.rpc("increment_resource_helpful_count", {
    p_resource_id: resourceId,
  });

  // If RPC doesn't exist, just update directly
  if (error && error.code === "42883") {
    await supabase
      .from("family_resources")
      .update({ helpful_count: supabase.rpc("increment", { x: 1 }) })
      .eq("id", resourceId);
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// FAMILY COMMUNICATIONS
// ============================================================================

/**
 * Get communications sent by the user
 */
export async function getCommunications(
  userId: string,
  limit: number = 20
): Promise<Result<FamilyCommunicationRow[]>> {
  const { data, error } = await supabase
    .from("family_communications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as FamilyCommunicationRow[], error: null, status: 200 };
}

/**
 * Create and send a communication
 */
export async function sendCommunication(
  userId: string,
  data: SendCommunicationData
): Promise<Result<FamilyCommunicationRow>> {
  const { data: result, error } = await supabase
    .from("family_communications")
    .insert({
      user_id: userId,
      communication_type: data.communicationType,
      subject: data.subject || null,
      message_body: data.messageBody,
      sent_to_all: data.sentToAll ?? true,
      recipient_ids: data.recipientIds || [],
      related_milestone_id: data.relatedMilestoneId || null,
      related_summary_id: data.relatedSummaryId || null,
      template_name: data.templateName || null,
      is_sent: true,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as FamilyCommunicationRow, error: null, status: 201 };
}

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Get family support dashboard data
 */
export async function getFamilySupportDashboard(
  userId: string
): Promise<Result<FamilySupportDashboard>> {
  // Fetch all dashboard data in parallel
  const [
    settingsResult,
    activeSupportersResult,
    pendingResult,
    milestonesResult,
    summaryResult,
    stressResult,
    boundariesResult,
  ] = await Promise.all([
    getFamilySupportSettings(userId),
    getActiveSupporters(userId),
    getPendingInvitations(userId),
    getMilestones(userId, { isShared: true }),
    getProgressSummaries(userId, 1),
    getTodaysCheckIn(userId),
    getBoundaries(userId),
  ]);

  const dashboard: FamilySupportDashboard = {
    settings: settingsResult.data,
    activeSupporters: activeSupportersResult.data || [],
    pendingInvitations: pendingResult.data || [],
    recentMilestones: (milestonesResult.data || []).slice(0, 5),
    latestSummary: summaryResult.data?.[0] || null,
    todaysStress: stressResult.data,
    activeBoundaries: boundariesResult.data || [],
    unreadEncouragements: 0, // Would need additional tracking
  };

  return { data: dashboard, error: null, status: 200 };
}
