/**
 * PROGRESS SHARING SERVICE (UC-111)
 *
 * Handles all database operations for progress sharing and accountability features.
 * Uses direct Supabase access with RLS enforcement.
 *
 * Features:
 * - Manage sharing privacy settings
 * - Track and celebrate milestones
 * - Generate progress reports
 * - Send encouragement messages
 * - Track accountability partner engagement
 */

import { supabase } from "@shared/services/supabaseClient";
import type { Result } from "@shared/services/types";
import type {
  ProgressShareRow,
  MilestoneRow,
  MilestoneWithUser,
  ProgressReportRow,
  EncouragementRow,
  EncouragementWithSender,
  AccountabilityMetricsRow,
  AccountabilityMetricsWithPartner,
  UpdateShareSettingsData,
  CreateMilestoneData,
  SendEncouragementData,
  ProgressSummary,
  AccountabilityDashboard,
  ShareSettings,
  ReportSettings,
  NotificationSettings,
} from "../types/progress.types";

// ============================================================================
// CONSTANTS
// ============================================================================

// Activity level thresholds for progress reports
const ACTIVITY_LEVEL_HIGH_THRESHOLD = 10;
const ACTIVITY_LEVEL_MEDIUM_THRESHOLD = 5;

// ============================================================================
// SHARE SETTINGS OPERATIONS
// ============================================================================

/**
 * Get user's progress sharing settings for a team
 */
export async function getShareSettings(
  userId: string,
  teamId: string
): Promise<Result<ProgressShareRow | null>> {
  const { data, error } = await supabase
    .from("progress_shares")
    .select("*")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ProgressShareRow | null, error: null, status: 200 };
}

/**
 * Create or update progress sharing settings
 */
export async function upsertShareSettings(
  userId: string,
  teamId: string,
  settings: UpdateShareSettingsData
): Promise<Result<ProgressShareRow>> {
  // Build update payload
  const payload: Record<string, unknown> = {
    user_id: userId,
    team_id: teamId,
  };

  if (settings.share_settings) {
    payload.share_settings = settings.share_settings;
  }
  if (settings.report_settings) {
    payload.report_settings = settings.report_settings;
  }
  if (settings.notification_settings) {
    payload.notification_settings = settings.notification_settings;
  }
  if (settings.is_active !== undefined) {
    payload.is_active = settings.is_active;
  }

  const { data, error } = await supabase
    .from("progress_shares")
    .upsert(payload, { onConflict: "user_id,team_id" })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ProgressShareRow, error: null, status: 200 };
}

/**
 * Get default share settings
 */
export function getDefaultShareSettings(): ShareSettings {
  return {
    share_job_stats: true,
    share_application_count: true,
    share_interview_count: true,
    share_offer_count: true,
    share_goals: true,
    share_milestones: true,
    share_activity_timeline: false,
    share_company_names: false,
    share_salary_info: false,
    share_documents: false,
  };
}

/**
 * Get default report settings
 */
export function getDefaultReportSettings(): ReportSettings {
  return {
    auto_generate_weekly: true,
    auto_generate_monthly: false,
    include_insights: true,
    include_recommendations: true,
  };
}

/**
 * Get default notification settings
 */
export function getDefaultNotificationSettings(): NotificationSettings {
  return {
    notify_on_milestone: true,
    notify_on_goal_complete: true,
    notify_mentor_on_inactivity: true,
    inactivity_threshold_days: 7,
  };
}

// ============================================================================
// MILESTONE OPERATIONS
// ============================================================================

/**
 * Get user's milestones
 */
export async function getUserMilestones(
  userId: string,
  teamId?: string,
  limit: number = 20
): Promise<Result<MilestoneRow[]>> {
  let query = supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as MilestoneRow[], error: null, status: 200 };
}

/**
 * Get team milestones (shared milestones from all team members)
 */
export async function getTeamMilestones(
  teamId: string,
  limit: number = 50
): Promise<Result<MilestoneWithUser[]>> {
  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      *,
      user:profiles!user_id(full_name, email)
    `
    )
    .eq("team_id", teamId)
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

  return { data: data as MilestoneWithUser[], error: null, status: 200 };
}

/**
 * Create a new milestone
 */
export async function createMilestone(
  userId: string,
  data: CreateMilestoneData
): Promise<Result<MilestoneRow>> {
  const { data: milestone, error } = await supabase
    .from("milestones")
    .insert({
      user_id: userId,
      team_id: data.team_id || null,
      milestone_type: data.milestone_type,
      title: data.title,
      description: data.description || null,
      metadata: data.metadata || {},
      is_shared: data.is_shared !== false,
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

  return { data: milestone as MilestoneRow, error: null, status: 201 };
}

/**
 * Celebrate a milestone (add user to celebrated_by array)
 */
export async function celebrateMilestone(
  userId: string,
  milestoneId: string
): Promise<Result<MilestoneRow>> {
  // First get current milestone
  const { data: current, error: fetchError } = await supabase
    .from("milestones")
    .select("celebrated_by")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    return {
      data: null,
      error: { message: fetchError.message, status: null },
      status: null,
    };
  }

  const celebratedBy = current?.celebrated_by || [];
  if (!celebratedBy.includes(userId)) {
    celebratedBy.push(userId);
  }

  const { data, error } = await supabase
    .from("milestones")
    .update({
      is_celebrated: true,
      celebrated_at: new Date().toISOString(),
      celebrated_by: celebratedBy,
    })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as MilestoneRow, error: null, status: 200 };
}

/**
 * Check for and create automatic milestones based on job stats
 */
export async function checkAndCreateMilestones(
  userId: string,
  teamId: string
): Promise<Result<MilestoneRow[]>> {
  // Get user's job stats
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, job_status")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (jobsError) {
    return {
      data: null,
      error: { message: jobsError.message, status: null },
      status: null,
    };
  }

  const totalApps = jobs?.length || 0;
  const interviews =
    jobs?.filter(
      (j) => j.job_status === "Interview" || j.job_status === "Phone Screen"
    ).length || 0;
  const offers =
    jobs?.filter(
      (j) => j.job_status === "Offer" || j.job_status === "Accepted"
    ).length || 0;

  // Get existing milestones for this user and team
  const { data: existingMilestones } = await supabase
    .from("milestones")
    .select("milestone_type")
    .eq("user_id", userId)
    .eq("team_id", teamId);

  const existingTypes = new Set(existingMilestones?.map((m) => m.milestone_type) || []);
  const newMilestones: MilestoneRow[] = [];

  // Check application milestones
  const appMilestones = [
    { count: 1, type: "first_application", title: "First Application!" },
    { count: 5, type: "applications_5", title: "5 Applications Sent!" },
    { count: 10, type: "applications_10", title: "10 Applications Sent!" },
    { count: 25, type: "applications_25", title: "25 Applications Sent!" },
    { count: 50, type: "applications_50", title: "50 Applications Sent!" },
    { count: 100, type: "applications_100", title: "100 Applications Sent!" },
  ];

  for (const milestone of appMilestones) {
    if (totalApps >= milestone.count && !existingTypes.has(milestone.type)) {
      const result = await createMilestone(userId, {
        milestone_type: milestone.type as CreateMilestoneData["milestone_type"],
        title: milestone.title,
        team_id: teamId,
        metadata: { count: totalApps },
      });
      if (result.data) {
        newMilestones.push(result.data);
      }
    }
  }

  // Check interview milestones
  if (interviews >= 1 && !existingTypes.has("first_interview")) {
    const result = await createMilestone(userId, {
      milestone_type: "first_interview",
      title: "First Interview Scheduled!",
      team_id: teamId,
      metadata: { count: interviews },
    });
    if (result.data) {
      newMilestones.push(result.data);
    }
  }

  // Check offer milestones
  if (offers >= 1 && !existingTypes.has("first_offer")) {
    const result = await createMilestone(userId, {
      milestone_type: "first_offer",
      title: "First Offer Received! 🎉",
      team_id: teamId,
      metadata: { count: offers },
    });
    if (result.data) {
      newMilestones.push(result.data);
    }
  }

  return { data: newMilestones, error: null, status: 200 };
}

// ============================================================================
// PROGRESS REPORT OPERATIONS
// ============================================================================

/**
 * Get user's progress reports
 */
export async function getUserReports(
  userId: string,
  teamId?: string,
  limit: number = 10
): Promise<Result<ProgressReportRow[]>> {
  let query = supabase
    .from("progress_reports")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ProgressReportRow[], error: null, status: 200 };
}

/**
 * Generate a progress report for a user
 */
export async function generateProgressReport(
  userId: string,
  teamId: string,
  reportType: "weekly" | "monthly" | "custom",
  periodStart: Date,
  periodEnd: Date
): Promise<Result<ProgressReportRow>> {
  // Get jobs data for the period
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_status, created_at, updated_at")
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  // Get milestones for the period
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, milestone_type, title, achieved_at")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .gte("achieved_at", periodStart.toISOString())
    .lte("achieved_at", periodEnd.toISOString());

  // Get goals for the period
  const { data: goals } = await supabase
    .from("mentee_goals")
    .select("id, title, target_value, current_value, status")
    .eq("candidate_id", userId)
    .eq("team_id", teamId);

  // Build report data
  const reportData = {
    summary: {
      total_applications: jobs?.length || 0,
      total_interviews:
        jobs?.filter(
          (j) => j.job_status === "Interview" || j.job_status === "Phone Screen"
        ).length || 0,
      total_offers:
        jobs?.filter(
          (j) => j.job_status === "Offer" || j.job_status === "Accepted"
        ).length || 0,
      activity_level:
        (jobs?.length || 0) > ACTIVITY_LEVEL_HIGH_THRESHOLD
          ? "high"
          : (jobs?.length || 0) > ACTIVITY_LEVEL_MEDIUM_THRESHOLD
          ? "medium"
          : (jobs?.length || 0) > 0
          ? "low"
          : "inactive",
    },
    job_stats: {
      by_status:
        jobs?.reduce((acc, j) => {
          acc[j.job_status] = (acc[j.job_status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
    },
    goal_progress:
      goals?.map((g) => ({
        goal_id: g.id,
        title: g.title,
        target: g.target_value || 0,
        current: g.current_value,
        status: g.status,
      })) || [],
    milestones_achieved:
      milestones?.map((m) => ({
        id: m.id,
        type: m.milestone_type,
        title: m.title,
        achieved_at: m.achieved_at,
      })) || [],
    activity_highlights: [],
    insights: generateInsights(jobs?.length || 0, milestones?.length || 0),
    recommendations: generateRecommendations(jobs?.length || 0),
  };

  // Create report
  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      user_id: userId,
      team_id: teamId,
      report_type: reportType,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      report_data: reportData,
      generated_by: "user",
      is_shared: true,
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

  return { data: data as ProgressReportRow, error: null, status: 201 };
}

/**
 * Generate insights based on activity
 */
function generateInsights(
  applicationCount: number,
  milestoneCount: number
): string[] {
  const insights: string[] = [];

  if (applicationCount > ACTIVITY_LEVEL_HIGH_THRESHOLD) {
    insights.push("Great job staying active with your applications this period!");
  } else if (applicationCount > ACTIVITY_LEVEL_MEDIUM_THRESHOLD) {
    insights.push("Steady progress on applications. Keep the momentum going!");
  } else if (applicationCount > 0) {
    insights.push(
      "Consider increasing your application volume for better results."
    );
  }

  if (milestoneCount > 0) {
    insights.push(
      `You achieved ${milestoneCount} milestone${
        milestoneCount > 1 ? "s" : ""
      } this period!`
    );
  }

  return insights;
}

/**
 * Generate recommendations based on activity
 */
function generateRecommendations(applicationCount: number): string[] {
  const recommendations: string[] = [];

  if (applicationCount < 5) {
    recommendations.push(
      "Try to apply to at least 5-10 positions per week for optimal results."
    );
  }

  recommendations.push(
    "Follow up on applications after 1-2 weeks if you haven't heard back."
  );
  recommendations.push(
    "Tailor your resume and cover letter for each application."
  );

  return recommendations;
}

// ============================================================================
// ENCOURAGEMENT OPERATIONS
// ============================================================================

/**
 * Get encouragements received by user
 */
export async function getReceivedEncouragements(
  userId: string,
  teamId?: string,
  limit: number = 20
): Promise<Result<EncouragementWithSender[]>> {
  let query = supabase
    .from("encouragements")
    .select(
      `
      *,
      sender:profiles!sender_id(full_name, email)
    `
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as EncouragementWithSender[], error: null, status: 200 };
}

/**
 * Get encouragements sent by user
 */
export async function getSentEncouragements(
  userId: string,
  teamId?: string,
  limit: number = 20
): Promise<Result<EncouragementRow[]>> {
  let query = supabase
    .from("encouragements")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as EncouragementRow[], error: null, status: 200 };
}

/**
 * Get unread encouragement count
 */
export async function getUnreadEncouragementCount(
  userId: string
): Promise<Result<number>> {
  const { count, error } = await supabase
    .from("encouragements")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: count || 0, error: null, status: 200 };
}

/**
 * Send an encouragement message
 */
export async function sendEncouragement(
  userId: string,
  data: SendEncouragementData
): Promise<Result<EncouragementRow>> {
  const { data: encouragement, error } = await supabase
    .from("encouragements")
    .insert({
      team_id: data.team_id,
      sender_id: userId,
      recipient_id: data.recipient_id,
      message_type: data.message_type,
      message_text: data.message_text,
      related_milestone_id: data.related_milestone_id || null,
      related_goal_id: data.related_goal_id || null,
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

  return { data: encouragement as EncouragementRow, error: null, status: 201 };
}

/**
 * Mark encouragement as read
 */
export async function markEncouragementRead(
  encouragementId: string
): Promise<Result<void>> {
  const { error } = await supabase
    .from("encouragements")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", encouragementId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: undefined, error: null, status: 200 };
}

/**
 * Mark all encouragements as read
 */
export async function markAllEncouragementRead(
  userId: string
): Promise<Result<void>> {
  const { error } = await supabase
    .from("encouragements")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: undefined, error: null, status: 200 };
}

// ============================================================================
// ACCOUNTABILITY METRICS OPERATIONS
// ============================================================================

/**
 * Get accountability metrics for a user
 */
export async function getAccountabilityMetrics(
  userId: string,
  teamId?: string
): Promise<Result<AccountabilityMetricsWithPartner[]>> {
  let query = supabase
    .from("accountability_metrics")
    .select(
      `
      *,
      partner:profiles!partner_id(full_name, email)
    `
    )
    .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (teamId) {
    query = query.eq("team_id", teamId);
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
    data: data as AccountabilityMetricsWithPartner[],
    error: null,
    status: 200,
  };
}

/**
 * Update or create accountability metrics
 */
export async function updateAccountabilityMetrics(
  userId: string,
  partnerId: string,
  teamId: string,
  updates: {
    engagement_stats?: Partial<AccountabilityMetricsRow["engagement_stats"]>;
    effectiveness_stats?: Partial<AccountabilityMetricsRow["effectiveness_stats"]>;
    last_interaction_at?: string;
  }
): Promise<Result<AccountabilityMetricsRow>> {
  // First try to get existing record
  const { data: existing } = await supabase
    .from("accountability_metrics")
    .select("*")
    .eq("user_id", userId)
    .eq("partner_id", partnerId)
    .eq("team_id", teamId)
    .single();

  const payload: Record<string, unknown> = {
    user_id: userId,
    partner_id: partnerId,
    team_id: teamId,
  };

  if (updates.engagement_stats && existing) {
    payload.engagement_stats = {
      ...(existing.engagement_stats as object),
      ...updates.engagement_stats,
    };
  } else if (updates.engagement_stats) {
    payload.engagement_stats = updates.engagement_stats;
  }

  if (updates.effectiveness_stats && existing) {
    payload.effectiveness_stats = {
      ...(existing.effectiveness_stats as object),
      ...updates.effectiveness_stats,
    };
  } else if (updates.effectiveness_stats) {
    payload.effectiveness_stats = updates.effectiveness_stats;
  }

  if (updates.last_interaction_at) {
    payload.last_interaction_at = updates.last_interaction_at;
  }

  const { data, error } = await supabase
    .from("accountability_metrics")
    .upsert(payload, { onConflict: "user_id,partner_id,team_id" })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as AccountabilityMetricsRow, error: null, status: 200 };
}

// ============================================================================
// DASHBOARD OPERATIONS
// ============================================================================

/**
 * Get progress summary for dashboard
 */
export async function getProgressSummary(
  userId: string,
  teamId: string
): Promise<Result<ProgressSummary>> {
  // Check if sharing is enabled
  const shareResult = await getShareSettings(userId, teamId);
  const shareSettings = shareResult.data;

  if (!shareSettings || !shareSettings.is_active) {
    return {
      data: {
        sharing_enabled: false,
        milestones_count: 0,
        recent_milestones: [],
      },
      error: null,
      status: 200,
    };
  }

  // Get job stats
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_status")
    .eq("user_id", userId)
    .eq("is_archived", false);

  // Get milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, milestone_type, title, achieved_at")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("is_shared", true)
    .order("achieved_at", { ascending: false })
    .limit(5);

  // Get goals
  const { data: goals } = await supabase
    .from("mentee_goals")
    .select("id, status")
    .eq("candidate_id", userId)
    .eq("team_id", teamId);

  const activeGoals = goals?.filter((g) => g.status === "active").length || 0;
  const completedGoals =
    goals?.filter((g) => g.status === "completed").length || 0;
  const totalGoals = goals?.length || 0;

  const summary: ProgressSummary = {
    sharing_enabled: true,
    milestones_count:
      (await supabase
        .from("milestones")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .eq("is_shared", true)
        .then((r) => r.count)) || 0,
    recent_milestones:
      milestones?.map((m) => ({
        id: m.id,
        type: m.milestone_type,
        title: m.title,
        achieved_at: m.achieved_at,
      })) || [],
  };

  // Add job stats if sharing is enabled
  if (shareSettings.share_settings.share_job_stats) {
    summary.job_stats = {
      total: jobs?.length || 0,
      applied:
        jobs?.filter(
          (j) => j.job_status === "Applied" || j.job_status === "Interested"
        ).length || 0,
      interviewing:
        jobs?.filter(
          (j) => j.job_status === "Interview" || j.job_status === "Phone Screen"
        ).length || 0,
      offers:
        jobs?.filter(
          (j) => j.job_status === "Offer" || j.job_status === "Accepted"
        ).length || 0,
    };
  }

  // Add goals summary if sharing is enabled
  if (shareSettings.share_settings.share_goals) {
    summary.goals_summary = {
      active: activeGoals,
      completed: completedGoals,
      completion_rate:
        totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    };
  }

  return { data: summary, error: null, status: 200 };
}

/**
 * Get accountability dashboard data
 */
export async function getAccountabilityDashboard(
  userId: string,
  teamId: string
): Promise<Result<AccountabilityDashboard>> {
  // Get accountability metrics
  const metricsResult = await getAccountabilityMetrics(userId, teamId);
  const partners = metricsResult.data || [];

  // Get recent encouragements
  const encouragementsResult = await getReceivedEncouragements(
    userId,
    teamId,
    10
  );
  const recentEncouragements = encouragementsResult.data || [];

  // Calculate totals
  let totalEngagements = 0;
  let totalEncouragementsSent = 0;
  let totalEncouragementsReceived = 0;
  let totalHealthScore = 0;
  let healthScoreCount = 0;

  partners.forEach((p) => {
    const isUser = p.user_id === userId;
    totalEngagements +=
      (p.engagement_stats.messages_sent || 0) +
      (p.engagement_stats.messages_received || 0);

    if (isUser) {
      totalEncouragementsSent += p.engagement_stats.encouragements_sent || 0;
      totalEncouragementsReceived +=
        p.engagement_stats.encouragements_received || 0;
    } else {
      totalEncouragementsSent +=
        p.engagement_stats.encouragements_received || 0;
      totalEncouragementsReceived +=
        p.engagement_stats.encouragements_sent || 0;
    }

    if (p.health_score !== null) {
      totalHealthScore += p.health_score;
      healthScoreCount++;
    }
  });

  return {
    data: {
      partners,
      total_engagements: totalEngagements,
      total_encouragements_sent: totalEncouragementsSent,
      total_encouragements_received: totalEncouragementsReceived,
      average_health_score:
        healthScoreCount > 0
          ? Math.round(totalHealthScore / healthScoreCount)
          : 0,
      recent_encouragements: recentEncouragements,
    },
    error: null,
    status: 200,
  };
}
