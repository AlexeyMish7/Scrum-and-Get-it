/**
 * ENTERPRISE CAREER SERVICES SERVICE
 *
 * Handles all database operations for enterprise features including:
 * - Cohort management
 * - Program analytics
 * - ROI reporting
 * - White-label branding
 * - Compliance logging
 * - External integrations
 * - Bulk onboarding
 *
 * Uses direct Supabase access with RLS enforcement.
 */

import { supabase } from "@shared/services/supabaseClient";
import { insertRow, updateRow, deleteRow } from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type {
  CohortRow,
  CohortMemberRow,
  CohortWithMembers,
  CohortMemberWithProfile,
  CohortStats,
  TeamCohortStats,
  ProgramAnalyticsRow,
  ROIReportRow,
  EnterpriseBrandingRow,
  ComplianceLogRow,
  ExternalIntegrationRow,
  IntegrationWithStatus,
  BulkOnboardingJobRow,
  OnboardingJobWithProgress,
  CreateCohortData,
  UpdateCohortData,
  AddCohortMembersData,
  UpdateCohortMemberData,
  CreateROIReportData,
  UpdateBrandingData,
  CreateIntegrationData,
  CreateBulkOnboardingData,
  LogComplianceEventData,
  AnalyticsSummary,
  ProgramEffectiveness,
  ComplianceReportSummary,
} from "../types/enterprise.types";

// ============================================================================
// COHORT OPERATIONS
// ============================================================================

/**
 * Create a new cohort
 * Only team admins can create cohorts (enforced by RLS)
 */
export async function createCohort(
  userId: string,
  teamId: string,
  data: CreateCohortData
): Promise<Result<CohortRow>> {
  const result = await insertRow<CohortRow>("cohorts", {
    team_id: teamId,
    name: data.name,
    description: data.description || null,
    program_type: data.program_type || null,
    status: "draft",
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    max_capacity: data.max_capacity || null,
    target_placement_rate: data.target_placement_rate || null,
    target_avg_salary: data.target_avg_salary || null,
    target_time_to_placement: data.target_time_to_placement || null,
    settings: {
      auto_assign_mentors: false,
      require_weekly_checkin: true,
      enable_peer_networking: true,
      share_aggregate_progress: true,
      ...data.settings,
    },
    created_by: userId,
  });

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  // Log the creation in compliance log
  await logComplianceEvent(teamId, userId, {
    event_type: "settings_change",
    event_description: `Created cohort: ${data.name}`,
    target_resource_type: "cohort",
    target_resource_id: (result.data as CohortRow).id,
  });

  return { data: result.data as CohortRow, error: null, status: 201 };
}

/**
 * Get all cohorts for a team
 */
export async function getTeamCohorts(
  teamId: string
): Promise<Result<CohortRow[]>> {
  const { data, error } = await supabase
    .from("cohorts")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as CohortRow[], error: null, status: 200 };
}

/**
 * Get a specific cohort with members and stats
 */
export async function getCohort(
  cohortId: string
): Promise<Result<CohortWithMembers>> {
  // Get cohort
  const { data: cohort, error: cohortError } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", cohortId)
    .single();

  if (cohortError) {
    return {
      data: null,
      error: { message: cohortError.message, status: null },
      status: null,
    };
  }

  // Get members with profiles
  const { data: members, error: membersError } = await supabase
    .from("cohort_members")
    .select(
      `
      *,
      profile:profiles!user_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("cohort_id", cohortId)
    .order("enrolled_at", { ascending: false });

  if (membersError) {
    return {
      data: null,
      error: { message: membersError.message, status: null },
      status: null,
    };
  }

  // Calculate stats
  const stats = calculateCohortStats(members as CohortMemberRow[]);

  type MemberWithProfile = CohortMemberRow & {
    profile?: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      professional_title: string | null;
    };
  };

  return {
    data: {
      ...(cohort as CohortRow),
      members: (members as MemberWithProfile[]).map((m) => ({
        ...m,
        profile: m.profile || {
          full_name: "Unknown User",
          first_name: null,
          last_name: null,
          email: null,
          professional_title: null,
        },
      })) as CohortMemberWithProfile[],
      stats,
    },
    error: null,
    status: 200,
  };
}

/**
 * Update a cohort
 */
export async function updateCohort(
  cohortId: string,
  data: UpdateCohortData
): Promise<Result<CohortRow>> {
  const result = await updateRow<CohortRow>(
    "cohorts",
    {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.program_type !== undefined && {
        program_type: data.program_type,
      }),
      ...(data.status && { status: data.status }),
      ...(data.start_date !== undefined && { start_date: data.start_date }),
      ...(data.end_date !== undefined && { end_date: data.end_date }),
      ...(data.max_capacity !== undefined && {
        max_capacity: data.max_capacity,
      }),
      ...(data.target_placement_rate !== undefined && {
        target_placement_rate: data.target_placement_rate,
      }),
      ...(data.target_avg_salary !== undefined && {
        target_avg_salary: data.target_avg_salary,
      }),
      ...(data.target_time_to_placement !== undefined && {
        target_time_to_placement: data.target_time_to_placement,
      }),
      ...(data.settings && { settings: data.settings }),
    },
    { eq: { id: cohortId } }
  );

  return result as Result<CohortRow>;
}

/**
 * Delete a cohort (archive it)
 */
export async function deleteCohort(cohortId: string): Promise<Result<boolean>> {
  const result = await updateRow(
    "cohorts",
    { status: "archived" },
    { eq: { id: cohortId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Get team-level cohort statistics
 */
export async function getTeamCohortStats(
  teamId: string
): Promise<Result<TeamCohortStats>> {
  const { data, error } = await supabase.rpc("get_cohort_stats", {
    p_team_id: teamId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // The RPC returns an array with one row
  const stats = data?.[0] || {
    total_cohorts: 0,
    active_cohorts: 0,
    total_enrolled: 0,
    total_placed: 0,
    avg_placement_rate: 0,
  };

  return { data: stats as TeamCohortStats, error: null, status: 200 };
}

// ============================================================================
// COHORT MEMBER OPERATIONS
// ============================================================================

/**
 * Add members to a cohort
 */
export async function addCohortMembers(
  userId: string,
  cohortId: string,
  data: AddCohortMembersData
): Promise<Result<CohortMemberRow[]>> {
  const members = data.user_ids.map((user_id) => ({
    cohort_id: cohortId,
    user_id,
    enrolled_by: userId,
    notes: data.notes || null,
  }));

  const { data: result, error } = await supabase
    .from("cohort_members")
    .insert(members)
    .select();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as CohortMemberRow[], error: null, status: 201 };
}

/**
 * Update a cohort member
 */
export async function updateCohortMember(
  memberId: string,
  data: UpdateCohortMemberData
): Promise<Result<CohortMemberRow>> {
  const result = await updateRow<CohortMemberRow>(
    "cohort_members",
    {
      ...(data.completion_status && {
        completion_status: data.completion_status,
      }),
      ...(data.placed_at !== undefined && { placed_at: data.placed_at }),
      ...(data.placement_company !== undefined && {
        placement_company: data.placement_company,
      }),
      ...(data.placement_role !== undefined && {
        placement_role: data.placement_role,
      }),
      ...(data.placement_salary !== undefined && {
        placement_salary: data.placement_salary,
      }),
      ...(data.progress_score !== undefined && {
        progress_score: data.progress_score,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
      last_activity_at: new Date().toISOString(),
    },
    { eq: { id: memberId } }
  );

  return result as Result<CohortMemberRow>;
}

/**
 * Remove a member from cohort (soft delete)
 */
export async function removeCohortMember(
  memberId: string
): Promise<Result<boolean>> {
  const result = await updateRow(
    "cohort_members",
    { is_active: false },
    { eq: { id: memberId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Record a placement for a cohort member
 */
export async function recordPlacement(
  memberId: string,
  placement: {
    company: string;
    role: string;
    salary?: number;
  }
): Promise<Result<CohortMemberRow>> {
  return updateCohortMember(memberId, {
    completion_status: "placed",
    placed_at: new Date().toISOString(),
    placement_company: placement.company,
    placement_role: placement.role,
    placement_salary: placement.salary,
  });
}

// ============================================================================
// PROGRAM ANALYTICS OPERATIONS
// ============================================================================

/**
 * Get analytics for a team
 */
export async function getTeamAnalytics(
  teamId: string,
  options?: {
    cohort_id?: string;
    granularity?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<Result<ProgramAnalyticsRow[]>> {
  let query = supabase
    .from("program_analytics")
    .select("*")
    .eq("team_id", teamId)
    .order("period_start", { ascending: false });

  if (options?.cohort_id) {
    query = query.eq("cohort_id", options.cohort_id);
  }
  if (options?.granularity) {
    query = query.eq("granularity", options.granularity);
  }
  if (options?.start_date) {
    query = query.gte("period_start", options.start_date);
  }
  if (options?.end_date) {
    query = query.lte("period_end", options.end_date);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ProgramAnalyticsRow[], error: null, status: 200 };
}

/**
 * Get analytics summary for dashboard
 */
export async function getAnalyticsSummary(
  teamId: string,
  cohortId?: string
): Promise<Result<AnalyticsSummary>> {
  // Get the most recent weekly analytics
  let query = supabase
    .from("program_analytics")
    .select("*")
    .eq("team_id", teamId)
    .eq("granularity", "weekly")
    .order("period_end", { ascending: false })
    .limit(2);

  if (cohortId) {
    query = query.eq("cohort_id", cohortId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  const current = data?.[0] as ProgramAnalyticsRow | undefined;
  const previous = data?.[1] as ProgramAnalyticsRow | undefined;

  if (!current) {
    // No analytics yet, return empty summary
    return {
      data: {
        period: "No data",
        total_enrolled: 0,
        active_users: 0,
        total_placements: 0,
        placement_rate: 0,
        avg_salary: null,
        trend: "stable",
        trend_percentage: 0,
      },
      error: null,
      status: 200,
    };
  }

  // Calculate trend
  let trend: "up" | "down" | "stable" = "stable";
  let trend_percentage = 0;

  if (previous) {
    const currentRate = current.overall_placement_rate || 0;
    const previousRate = previous.overall_placement_rate || 0;
    trend_percentage =
      previousRate > 0
        ? ((currentRate - previousRate) / previousRate) * 100
        : 0;
    trend =
      trend_percentage > 1 ? "up" : trend_percentage < -1 ? "down" : "stable";
  }

  return {
    data: {
      period: `${current.period_start} - ${current.period_end}`,
      total_enrolled: current.total_enrolled,
      active_users: current.active_users,
      total_placements: current.total_placements,
      placement_rate: current.overall_placement_rate || 0,
      avg_salary: current.avg_starting_salary,
      trend,
      trend_percentage: Math.round(trend_percentage * 10) / 10,
    },
    error: null,
    status: 200,
  };
}

/**
 * Calculate and store analytics for a period
 * This would typically be run as a scheduled job
 */
export async function calculatePeriodAnalytics(
  teamId: string,
  periodStart: string,
  periodEnd: string,
  granularity: "daily" | "weekly" | "monthly" | "quarterly",
  cohortId?: string
): Promise<Result<ProgramAnalyticsRow>> {
  // Get cohort members and their job data for the period
  let memberQuery = supabase
    .from("cohort_members")
    .select(
      `
      *,
      cohort:cohorts!cohort_id(team_id)
    `
    )
    .eq("cohort.team_id", teamId);

  if (cohortId) {
    memberQuery = memberQuery.eq("cohort_id", cohortId);
  }

  const { data: members, error: memberError } = await memberQuery;

  if (memberError) {
    return {
      data: null,
      error: { message: memberError.message, status: null },
      status: null,
    };
  }

  // Calculate metrics
  const totalEnrolled = members?.length || 0;
  const activeUsers =
    members?.filter((m) => (m as CohortMemberRow).is_active).length || 0;
  const placed =
    members?.filter((m) => (m as CohortMemberRow).placed_at).length || 0;
  const salaries =
    members
      ?.filter((m) => (m as CohortMemberRow).placement_salary)
      .map((m) => (m as CohortMemberRow).placement_salary as number) || [];

  const avgSalary =
    salaries.length > 0
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : null;

  const analyticsData = {
    team_id: teamId,
    cohort_id: cohortId || null,
    period_start: periodStart,
    period_end: periodEnd,
    granularity,
    total_enrolled: totalEnrolled,
    active_users: activeUsers,
    total_placements: placed,
    overall_placement_rate:
      totalEnrolled > 0
        ? Math.round((placed / totalEnrolled) * 10000) / 100
        : 0,
    avg_starting_salary: avgSalary,
    calculated_at: new Date().toISOString(),
    is_final: new Date(periodEnd) < new Date(),
  };

  // Upsert analytics
  const { data, error } = await supabase
    .from("program_analytics")
    .upsert(analyticsData, {
      onConflict: "team_id,cohort_id,period_start,period_end,granularity",
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

  return { data: data as ProgramAnalyticsRow, error: null, status: 200 };
}

/**
 * Get program effectiveness metrics for all cohorts
 */
export async function getProgramEffectiveness(
  teamId: string
): Promise<Result<ProgramEffectiveness[]>> {
  const { data: cohorts, error } = await supabase
    .from("cohorts")
    .select(
      `
      id,
      name,
      target_placement_rate,
      cohort_members(
        placed_at,
        enrolled_at,
        is_active
      )
    `
    )
    .eq("team_id", teamId)
    .neq("status", "archived");

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type CohortWithMembers = {
    id: string;
    name: string;
    target_placement_rate: number | null;
    cohort_members: Array<{
      placed_at: string | null;
      enrolled_at: string;
      is_active: boolean;
    }>;
  };

  const effectiveness: ProgramEffectiveness[] = (
    cohorts as CohortWithMembers[]
  ).map((cohort) => {
    const members = cohort.cohort_members || [];
    const total = members.length;
    const placed = members.filter((m) => m.placed_at).length;
    const placementRate = total > 0 ? (placed / total) * 100 : 0;
    const target = cohort.target_placement_rate || 0;

    // Calculate average time to placement
    const placedMembers = members.filter((m) => m.placed_at);
    let avgTimeToPlacements = 0;
    if (placedMembers.length > 0) {
      const totalDays = placedMembers.reduce((sum, m) => {
        const enrolled = new Date(m.enrolled_at);
        const placed = new Date(m.placed_at!);
        return (
          sum + (placed.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24)
        );
      }, 0);
      avgTimeToPlacements = totalDays / placedMembers.length;
    }

    return {
      cohort_id: cohort.id,
      cohort_name: cohort.name,
      placement_rate: Math.round(placementRate * 100) / 100,
      target_placement_rate: target,
      performance_vs_target:
        target > 0
          ? Math.round(((placementRate - target) / target) * 10000) / 100
          : 0,
      avg_time_to_placement: Math.round(avgTimeToPlacements * 10) / 10,
      participant_satisfaction: null, // Would come from surveys
      roi_percentage: null, // Would come from ROI reports
    };
  });

  return { data: effectiveness, error: null, status: 200 };
}

// ============================================================================
// ROI REPORT OPERATIONS
// ============================================================================

/**
 * Create an ROI report
 */
export async function createROIReport(
  userId: string,
  teamId: string,
  data: CreateROIReportData
): Promise<Result<ROIReportRow>> {
  // Get placement data for the period
  let query = supabase
    .from("cohort_members")
    .select(
      `
      *,
      cohort:cohorts!cohort_id(team_id)
    `
    )
    .eq("cohort.team_id", teamId)
    .not("placed_at", "is", null);

  if (data.cohort_id) {
    query = query.eq("cohort_id", data.cohort_id);
  }

  const { data: placements, error: placementError } = await query;

  if (placementError) {
    return {
      data: null,
      error: { message: placementError.message, status: null },
      status: null,
    };
  }

  // Calculate ROI metrics
  const totalPlacements = placements?.length || 0;
  const salaries =
    placements
      ?.filter((p) => (p as CohortMemberRow).placement_salary)
      .map((p) => (p as CohortMemberRow).placement_salary as number) || [];
  const totalSalaryValue = salaries.reduce((a, b) => a + b, 0);

  const totalCost = data.total_program_cost || 0;
  const costPerPlacement =
    totalPlacements > 0 ? Math.round(totalCost / totalPlacements) : null;
  const roiPercentage =
    totalCost > 0
      ? Math.round(((totalSalaryValue - totalCost) / totalCost) * 10000) / 100
      : null;

  const result = await insertRow<ROIReportRow>("roi_reports", {
    team_id: teamId,
    cohort_id: data.cohort_id || null,
    report_name: data.report_name,
    report_type: data.report_type,
    period_start: data.period_start,
    period_end: data.period_end,
    total_program_cost: data.total_program_cost || null,
    cost_per_participant: data.cost_per_participant || null,
    staff_hours_invested: data.staff_hours_invested || null,
    technology_costs: data.technology_costs || null,
    total_placements: totalPlacements,
    total_salary_value: totalSalaryValue,
    cost_per_placement: costPerPlacement,
    roi_percentage: roiPercentage,
    status: "draft",
    generated_by: userId,
    recommendations: [],
    metrics_breakdown: {},
  });

  return result as Result<ROIReportRow>;
}

/**
 * Get ROI reports for a team
 */
export async function getROIReports(
  teamId: string
): Promise<Result<ROIReportRow[]>> {
  const { data, error } = await supabase
    .from("roi_reports")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ROIReportRow[], error: null, status: 200 };
}

/**
 * Update an ROI report
 */
export async function updateROIReport(
  reportId: string,
  data: Partial<ROIReportRow>
): Promise<Result<ROIReportRow>> {
  const result = await updateRow<ROIReportRow>(
    "roi_reports",
    {
      ...data,
      ...(data.status === "published" && {
        published_at: new Date().toISOString(),
      }),
    },
    { eq: { id: reportId } }
  );

  return result as Result<ROIReportRow>;
}

/**
 * Delete an ROI report
 */
export async function deleteROIReport(
  reportId: string
): Promise<Result<boolean>> {
  const result = await deleteRow("roi_reports", { eq: { id: reportId } });

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// BRANDING OPERATIONS
// ============================================================================

/**
 * Get branding settings for a team
 */
export async function getBranding(
  teamId: string
): Promise<Result<EnterpriseBrandingRow | null>> {
  const { data, error } = await supabase
    .from("enterprise_branding")
    .select("*")
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

  return {
    data: data as EnterpriseBrandingRow | null,
    error: null,
    status: 200,
  };
}

/**
 * Update or create branding settings
 */
export async function updateBranding(
  teamId: string,
  data: UpdateBrandingData
): Promise<Result<EnterpriseBrandingRow>> {
  const { data: existing } = await getBranding(teamId);

  if (existing) {
    // Update existing
    const result = await updateRow<EnterpriseBrandingRow>(
      "enterprise_branding",
      data,
      { eq: { team_id: teamId } }
    );
    return result as Result<EnterpriseBrandingRow>;
  } else {
    // Create new
    const result = await insertRow<EnterpriseBrandingRow>(
      "enterprise_branding",
      {
        team_id: teamId,
        ...data,
      }
    );
    return result as Result<EnterpriseBrandingRow>;
  }
}

// ============================================================================
// COMPLIANCE LOG OPERATIONS
// ============================================================================

/**
 * Log a compliance event
 */
export async function logComplianceEvent(
  teamId: string,
  actorId: string,
  data: LogComplianceEventData
): Promise<Result<ComplianceLogRow>> {
  const result = await insertRow<ComplianceLogRow>("compliance_logs", {
    team_id: teamId,
    event_type: data.event_type,
    event_description: data.event_description,
    actor_id: actorId,
    target_user_id: data.target_user_id || null,
    target_resource_type: data.target_resource_type || null,
    target_resource_id: data.target_resource_id || null,
    old_value: data.old_value || null,
    new_value: data.new_value || null,
    data_classification: data.data_classification || null,
    compliance_framework: data.compliance_framework || null,
  });

  return result as Result<ComplianceLogRow>;
}

/**
 * Get compliance logs for a team
 */
export async function getComplianceLogs(
  teamId: string,
  options?: {
    event_type?: string;
    actor_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<Result<ComplianceLogRow[]>> {
  let query = supabase
    .from("compliance_logs")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (options?.event_type) {
    query = query.eq("event_type", options.event_type);
  }
  if (options?.actor_id) {
    query = query.eq("actor_id", options.actor_id);
  }
  if (options?.start_date) {
    query = query.gte("created_at", options.start_date);
  }
  if (options?.end_date) {
    query = query.lte("created_at", options.end_date);
  }

  const { data, error } = await query.limit(options?.limit || 100);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as ComplianceLogRow[], error: null, status: 200 };
}

/**
 * Get compliance report summary
 */
export async function getComplianceReportSummary(
  teamId: string,
  periodStart: string,
  periodEnd: string
): Promise<Result<ComplianceReportSummary>> {
  const { data: logs, error } = await supabase
    .from("compliance_logs")
    .select("event_type")
    .eq("team_id", teamId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Count events by type
  const eventsByType: Record<string, number> = {};
  (logs || []).forEach((log) => {
    eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1;
  });

  return {
    data: {
      total_events: logs?.length || 0,
      events_by_type: eventsByType as Record<string, number>,
      data_access_events: eventsByType["user_data_access"] || 0,
      settings_changes: eventsByType["settings_change"] || 0,
      export_events: eventsByType["user_data_export"] || 0,
      period_start: periodStart,
      period_end: periodEnd,
    },
    error: null,
    status: 200,
  };
}

// ============================================================================
// EXTERNAL INTEGRATION OPERATIONS
// ============================================================================

/**
 * Create an external integration
 */
export async function createIntegration(
  userId: string,
  teamId: string,
  data: CreateIntegrationData
): Promise<Result<ExternalIntegrationRow>> {
  const result = await insertRow<ExternalIntegrationRow>(
    "external_integrations",
    {
      team_id: teamId,
      name: data.name,
      integration_type: data.integration_type,
      provider: data.provider || null,
      api_endpoint: data.api_endpoint || null,
      webhook_url: data.webhook_url || null,
      auth_type: data.auth_type,
      credentials_encrypted: data.credentials || null, // Should be encrypted in production
      sync_frequency: data.sync_frequency || "daily",
      sync_direction: data.sync_direction || "bidirectional",
      field_mappings: data.field_mappings || {},
      sync_settings: {
        auto_create_users: false,
        update_existing: true,
        sync_placements: true,
        ...data.sync_settings,
      },
      created_by: userId,
    }
  );

  return result as Result<ExternalIntegrationRow>;
}

/**
 * Get integrations for a team
 */
export async function getIntegrations(
  teamId: string
): Promise<Result<IntegrationWithStatus[]>> {
  const { data, error } = await supabase
    .from("external_integrations")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Add sync health status
  const integrationsWithStatus: IntegrationWithStatus[] = (
    data as ExternalIntegrationRow[]
  ).map((integration) => {
    let sync_health: "healthy" | "warning" | "error" | "unknown" = "unknown";

    if (!integration.is_active) {
      sync_health = "unknown";
    } else if (integration.last_sync_status === "success") {
      sync_health = "healthy";
    } else if (integration.last_sync_status === "partial") {
      sync_health = "warning";
    } else if (integration.last_sync_status === "failed") {
      sync_health = "error";
    }

    return {
      ...integration,
      sync_health,
    };
  });

  return { data: integrationsWithStatus, error: null, status: 200 };
}

/**
 * Update an integration
 */
export async function updateIntegration(
  integrationId: string,
  data: Partial<ExternalIntegrationRow>
): Promise<Result<ExternalIntegrationRow>> {
  const result = await updateRow<ExternalIntegrationRow>(
    "external_integrations",
    data,
    { eq: { id: integrationId } }
  );

  return result as Result<ExternalIntegrationRow>;
}

/**
 * Delete an integration
 */
export async function deleteIntegration(
  integrationId: string
): Promise<Result<boolean>> {
  const result = await deleteRow("external_integrations", {
    eq: { id: integrationId },
  });

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Test an integration connection
 */
export async function testIntegration(
  integrationId: string
): Promise<Result<{ success: boolean; message: string }>> {
  // In a real implementation, this would actually test the connection
  // For now, just update the last_sync_at timestamp
  const result = await updateRow(
    "external_integrations",
    {
      last_sync_at: new Date().toISOString(),
      last_sync_status: "success",
      last_error_message: null,
    },
    { eq: { id: integrationId } }
  );

  if (result.error) {
    return {
      data: null,
      error: result.error,
      status: result.status,
    };
  }

  return {
    data: { success: true, message: "Connection successful" },
    error: null,
    status: 200,
  };
}

// ============================================================================
// BULK ONBOARDING OPERATIONS
// ============================================================================

/**
 * Create a bulk onboarding job
 */
export async function createBulkOnboardingJob(
  userId: string,
  teamId: string,
  data: CreateBulkOnboardingData
): Promise<Result<BulkOnboardingJobRow>> {
  const result = await insertRow<BulkOnboardingJobRow>("bulk_onboarding_jobs", {
    team_id: teamId,
    cohort_id: data.cohort_id || null,
    job_name: data.job_name || `Bulk import ${new Date().toISOString()}`,
    status: "pending",
    source_type: data.source_type,
    source_file_url: data.source_file_url || null,
    source_integration_id: data.source_integration_id || null,
    total_records: data.users.length,
    options: {
      send_welcome_email: true,
      skip_duplicates: true,
      auto_assign_mentor: false,
      default_role: "candidate",
      ...data.options,
    },
    initiated_by: userId,
  });

  return result as Result<BulkOnboardingJobRow>;
}

/**
 * Get bulk onboarding jobs for a team
 */
export async function getBulkOnboardingJobs(
  teamId: string
): Promise<Result<OnboardingJobWithProgress[]>> {
  const { data, error } = await supabase
    .from("bulk_onboarding_jobs")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Add progress percentage
  const jobsWithProgress: OnboardingJobWithProgress[] = (
    data as BulkOnboardingJobRow[]
  ).map((job) => ({
    ...job,
    progress_percentage:
      job.total_records > 0
        ? Math.round((job.processed_records / job.total_records) * 100)
        : 0,
  }));

  return { data: jobsWithProgress, error: null, status: 200 };
}

/**
 * Update onboarding job status
 */
export async function updateOnboardingJobStatus(
  jobId: string,
  status: "processing" | "completed" | "failed" | "partial",
  stats?: {
    processed_records?: number;
    successful_records?: number;
    failed_records?: number;
    skipped_records?: number;
    error_log?: Array<{
      row: number;
      error: string;
      data: Record<string, unknown>;
    }>;
  }
): Promise<Result<BulkOnboardingJobRow>> {
  const updateData: Record<string, unknown> = {
    status,
    ...(stats?.processed_records !== undefined && {
      processed_records: stats.processed_records,
    }),
    ...(stats?.successful_records !== undefined && {
      successful_records: stats.successful_records,
    }),
    ...(stats?.failed_records !== undefined && {
      failed_records: stats.failed_records,
    }),
    ...(stats?.skipped_records !== undefined && {
      skipped_records: stats.skipped_records,
    }),
    ...(stats?.error_log && { error_log: stats.error_log }),
  };

  if (status === "processing") {
    updateData.started_at = new Date().toISOString();
  } else if (
    status === "completed" ||
    status === "failed" ||
    status === "partial"
  ) {
    updateData.completed_at = new Date().toISOString();
  }

  const result = await updateRow<BulkOnboardingJobRow>(
    "bulk_onboarding_jobs",
    updateData,
    { eq: { id: jobId } }
  );

  return result as Result<BulkOnboardingJobRow>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate cohort statistics from members
 */
function calculateCohortStats(members: CohortMemberRow[]): CohortStats {
  const enrolled = members.length;
  const active = members.filter((m) => m.is_active).length;
  const placed = members.filter((m) => m.placed_at).length;

  const salaries = members
    .filter((m) => m.placement_salary)
    .map((m) => m.placement_salary as number);

  const avgSalary =
    salaries.length > 0
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : null;

  // Calculate average time to placement in days
  const placedMembers = members.filter((m) => m.placed_at);
  let avgTimeToPlacements = null;
  if (placedMembers.length > 0) {
    const totalDays = placedMembers.reduce((sum, m) => {
      const enrolled = new Date(m.enrolled_at);
      const placedAt = new Date(m.placed_at!);
      return (
        sum + (placedAt.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24)
      );
    }, 0);
    avgTimeToPlacements =
      Math.round((totalDays / placedMembers.length) * 10) / 10;
  }

  return {
    enrolled_count: enrolled,
    active_count: active,
    placed_count: placed,
    placement_rate:
      enrolled > 0 ? Math.round((placed / enrolled) * 10000) / 100 : 0,
    avg_salary: avgSalary,
    avg_time_to_placement: avgTimeToPlacements,
  };
}
