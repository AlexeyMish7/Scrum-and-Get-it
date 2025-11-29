/**
 * MENTOR SERVICE
 *
 * Handles all database operations for mentor dashboard and coaching tools.
 * Uses direct Supabase access with RLS enforcement.
 *
 * Purpose (UC-109):
 * - Get assigned mentees with their progress data
 * - Access mentee job search materials for review
 * - Submit feedback and recommendations
 * - Track mentee goals and milestones
 * - Monitor engagement and activity levels
 *
 * Security:
 * - All operations scoped by authenticated user
 * - RLS policies ensure mentors only see their assigned candidates
 * - Admin role has broader access for team oversight
 */

import { supabase } from "@shared/services/supabaseClient";
import type { Result } from "@shared/services/types";
import type { AssignedCandidateInfo } from "../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extended mentee info with job search progress data
 */
export interface MenteeWithProgress extends AssignedCandidateInfo {
  jobStats: {
    total: number;
    applied: number;
    interviewing: number;
    offers: number;
    rejected: number;
  };
  recentActivity: ActivityItem[];
  engagementLevel: "high" | "medium" | "low" | "inactive";
  lastActiveAt: string | null;
}

/**
 * Activity item for timeline display
 */
export interface ActivityItem {
  id: string;
  type:
    | "job_applied"
    | "status_change"
    | "document_updated"
    | "goal_completed"
    | "feedback_received";
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mentee document for review
 */
export interface MenteeDocument {
  id: string;
  title: string;
  documentType: "resume" | "cover_letter";
  version: number;
  createdAt: string;
  updatedAt: string;
  jobId?: number;
  jobTitle?: string;
  companyName?: string;
}

/**
 * Feedback data for creating/updating
 */
export interface CreateFeedbackData {
  candidateId: string;
  teamId: string;
  feedbackType:
    | "application"
    | "interview"
    | "resume"
    | "cover_letter"
    | "general"
    | "goal"
    | "milestone";
  feedbackText: string;
  relatedJobId?: number;
  relatedDocumentId?: string;
}

/**
 * Mentor feedback record
 */
export interface MentorFeedback {
  id: string;
  teamId: string;
  mentorId: string;
  candidateId: string;
  feedbackType: string;
  feedbackText: string;
  relatedJobId?: number;
  relatedDocumentId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  mentor?: {
    fullName: string;
    email: string;
  };
  candidate?: {
    fullName: string;
    email: string;
  };
}

/**
 * Mentee goal record
 */
export interface MenteeGoal {
  id: string;
  teamId: string;
  candidateId: string;
  mentorId?: string;
  goalType: string;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue: number;
  startDate: string;
  dueDate?: string;
  status: "active" | "completed" | "missed" | "cancelled";
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create goal data
 */
export interface CreateGoalData {
  candidateId: string;
  teamId: string;
  goalType:
    | "weekly_applications"
    | "monthly_applications"
    | "interview_prep"
    | "resume_update"
    | "networking"
    | "skill_development"
    | "custom";
  title: string;
  description?: string;
  targetValue?: number;
  dueDate?: string;
}

// ============================================================================
// MENTEE OPERATIONS
// ============================================================================

/**
 * Get all mentees assigned to the current mentor with progress data
 * Includes job stats, recent activity, and engagement levels
 */
export async function getAssignedMentees(
  userId: string,
  teamId?: string
): Promise<Result<MenteeWithProgress[]>> {
  // First get assigned candidates using the existing RPC function
  const { data: assignments, error: assignError } = await supabase.rpc(
    "get_assigned_candidates",
    {
      p_mentor_id: userId,
      p_team_id: teamId || null,
    }
  );

  if (assignError) {
    return {
      data: null,
      error: { message: assignError.message, status: null },
      status: null,
    };
  }

  if (!assignments || assignments.length === 0) {
    return { data: [], error: null, status: 200 };
  }

  // For each mentee, fetch their progress data
  const menteesWithProgress: MenteeWithProgress[] = await Promise.all(
    (assignments as AssignedCandidateInfo[]).map(async (assignment) => {
      // Get job stats for this mentee
      const jobStats = await getMenteeJobStats(assignment.candidate_id);

      // Get recent activity
      const recentActivity = await getMenteeRecentActivity(
        assignment.candidate_id
      );

      // Calculate engagement level based on recent activity
      const engagementLevel = calculateEngagementLevel(recentActivity);

      // Get last active timestamp
      const lastActiveAt =
        recentActivity.length > 0 ? recentActivity[0].timestamp : null;

      return {
        ...assignment,
        jobStats,
        recentActivity,
        engagementLevel,
        lastActiveAt,
      };
    })
  );

  return { data: menteesWithProgress, error: null, status: 200 };
}

/**
 * Get detailed job stats for a specific mentee
 * Note: This uses a security definer approach via RPC or admin access
 */
async function getMenteeJobStats(candidateId: string): Promise<{
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
}> {
  // Try to fetch job stats - this may be limited by RLS
  // In production, this should use a security definer function
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, job_status")
    .eq("user_id", candidateId);

  if (error || !jobs) {
    // Return zeros if we can't access (RLS restriction)
    return {
      total: 0,
      applied: 0,
      interviewing: 0,
      offers: 0,
      rejected: 0,
    };
  }

  return {
    total: jobs.length,
    applied: jobs.filter(
      (j) => j.job_status === "Applied" || j.job_status === "Interested"
    ).length,
    interviewing: jobs.filter(
      (j) => j.job_status === "Interview" || j.job_status === "Phone Screen"
    ).length,
    offers: jobs.filter(
      (j) => j.job_status === "Offer" || j.job_status === "Accepted"
    ).length,
    rejected: jobs.filter(
      (j) => j.job_status === "Rejected" || j.job_status === "Declined"
    ).length,
  };
}

/**
 * Get recent activity for a mentee
 * Combines job updates, document changes, and goal completions
 */
async function getMenteeRecentActivity(
  candidateId: string
): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Get recent job status changes from job_history
  const { data: jobHistory } = await supabase
    .from("job_history")
    .select("id, job_id, status_change, changed_at, jobs(company_name, title)")
    .eq("user_id", candidateId)
    .order("changed_at", { ascending: false })
    .limit(10);

  if (jobHistory) {
    // Supabase returns joined data as array or object depending on relation
    type JobHistoryRow = {
      id: string;
      job_id: number;
      status_change: { from: string; to: string };
      changed_at: string;
      jobs:
        | { company_name: string; title: string }[]
        | { company_name: string; title: string }
        | null;
    };

    (jobHistory as unknown as JobHistoryRow[]).forEach((h) => {
      // Handle both array and object return types from Supabase
      const jobData = Array.isArray(h.jobs) ? h.jobs[0] : h.jobs;
      activities.push({
        id: h.id,
        type: "status_change",
        description: `${jobData?.title || "Job"} at ${
          jobData?.company_name || "Company"
        }: ${h.status_change?.from} → ${h.status_change?.to}`,
        timestamp: h.changed_at,
        metadata: { jobId: h.job_id, statusChange: h.status_change },
      });
    });
  }

  // Get recent document updates
  const { data: documents } = await supabase
    .from("document_versions")
    .select("id, title, document_type, created_at")
    .eq("user_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (documents) {
    type DocumentRow = {
      id: string;
      title: string;
      document_type: string;
      created_at: string;
    };

    (documents as DocumentRow[]).forEach((d) => {
      activities.push({
        id: d.id,
        type: "document_updated",
        description: `Updated ${d.document_type}: ${d.title}`,
        timestamp: d.created_at,
        metadata: { documentId: d.id, documentType: d.document_type },
      });
    });
  }

  // Get recent goal completions
  const { data: goals } = await supabase
    .from("mentee_goals")
    .select("id, title, completed_at")
    .eq("candidate_id", candidateId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  if (goals) {
    type GoalRow = {
      id: string;
      title: string;
      completed_at: string;
    };

    (goals as GoalRow[]).forEach((g) => {
      if (g.completed_at) {
        activities.push({
          id: g.id,
          type: "goal_completed",
          description: `Completed goal: ${g.title}`,
          timestamp: g.completed_at,
          metadata: { goalId: g.id },
        });
      }
    });
  }

  // Sort by timestamp descending
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return activities.slice(0, 15);
}

/**
 * Calculate engagement level based on recent activity
 */
function calculateEngagementLevel(
  activities: ActivityItem[]
): "high" | "medium" | "low" | "inactive" {
  if (activities.length === 0) return "inactive";

  const now = new Date();
  const lastActivity = new Date(activities[0].timestamp);
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count activities in the last 7 days
  const recentActivityCount = activities.filter((a) => {
    const activityDate = new Date(a.timestamp);
    const daysAgo = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysAgo <= 7;
  }).length;

  if (daysSinceLastActivity > 14) return "inactive";
  if (daysSinceLastActivity > 7) return "low";
  if (recentActivityCount >= 5) return "high";
  return "medium";
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Get mentee's job search documents (resumes, cover letters)
 * Mentors can review these for feedback
 */
export async function getMenteeDocuments(
  userId: string,
  candidateId: string,
  teamId: string
): Promise<Result<MenteeDocument[]>> {
  // First verify the mentor has access to this candidate
  const { data: assignment, error: assignError } = await supabase
    .from("team_member_assignments")
    .select("id")
    .eq("mentor_id", userId)
    .eq("candidate_id", candidateId)
    .eq("team_id", teamId)
    .eq("is_active", true)
    .single();

  if (assignError || !assignment) {
    return {
      data: null,
      error: {
        message: "Not authorized to view this candidate's documents",
        status: 403,
      },
      status: 403,
    };
  }

  // Get the candidate's documents
  const { data: documents, error: docError } = await supabase
    .from("document_versions")
    .select(
      `
      id,
      title,
      document_type,
      version,
      created_at,
      updated_at,
      job_id,
      jobs(title, company_name)
    `
    )
    .eq("user_id", candidateId)
    .in("document_type", ["resume", "cover_letter"])
    .order("updated_at", { ascending: false });

  if (docError) {
    return {
      data: null,
      error: { message: docError.message, status: null },
      status: null,
    };
  }

  // Supabase returns joined data as array or object depending on relation
  type DocumentRow = {
    id: string;
    title: string;
    document_type: "resume" | "cover_letter";
    version: number;
    created_at: string;
    updated_at: string;
    job_id: number | null;
    jobs:
      | { title: string; company_name: string }[]
      | { title: string; company_name: string }
      | null;
  };

  const menteeDocuments: MenteeDocument[] = (
    documents as unknown as DocumentRow[]
  ).map((d) => {
    // Handle both array and object return types from Supabase
    const jobData = Array.isArray(d.jobs) ? d.jobs[0] : d.jobs;
    return {
      id: d.id,
      title: d.title,
      documentType: d.document_type,
      version: d.version,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      jobId: d.job_id || undefined,
      jobTitle: jobData?.title,
      companyName: jobData?.company_name,
    };
  });

  return { data: menteeDocuments, error: null, status: 200 };
}

// ============================================================================
// FEEDBACK OPERATIONS
// ============================================================================

/**
 * Create feedback for a mentee
 */
export async function createFeedback(
  userId: string,
  data: CreateFeedbackData
): Promise<Result<MentorFeedback>> {
  const { data: feedback, error } = await supabase
    .from("mentor_feedback")
    .insert({
      team_id: data.teamId,
      mentor_id: userId,
      candidate_id: data.candidateId,
      feedback_type: data.feedbackType,
      feedback_text: data.feedbackText,
      related_job_id: data.relatedJobId || null,
      related_document_id: data.relatedDocumentId || null,
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

  type FeedbackRow = {
    id: string;
    team_id: string;
    mentor_id: string;
    candidate_id: string;
    feedback_type: string;
    feedback_text: string;
    related_job_id: number | null;
    related_document_id: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const row = feedback as FeedbackRow;

  return {
    data: {
      id: row.id,
      teamId: row.team_id,
      mentorId: row.mentor_id,
      candidateId: row.candidate_id,
      feedbackType: row.feedback_type,
      feedbackText: row.feedback_text,
      relatedJobId: row.related_job_id || undefined,
      relatedDocumentId: row.related_document_id || undefined,
      isRead: row.is_read,
      readAt: row.read_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    error: null,
    status: 201,
  };
}

/**
 * Get feedback written by the mentor
 */
export async function getMentorFeedback(
  userId: string,
  teamId?: string,
  candidateId?: string
): Promise<Result<MentorFeedback[]>> {
  let query = supabase
    .from("mentor_feedback")
    .select(
      `
      *,
      candidate:profiles!candidate_id(full_name, email)
    `
    )
    .eq("mentor_id", userId)
    .order("created_at", { ascending: false });

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  if (candidateId) {
    query = query.eq("candidate_id", candidateId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type FeedbackRowWithCandidate = {
    id: string;
    team_id: string;
    mentor_id: string;
    candidate_id: string;
    feedback_type: string;
    feedback_text: string;
    related_job_id: number | null;
    related_document_id: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    candidate: { full_name: string; email: string } | null;
  };

  const feedbackList: MentorFeedback[] = (
    data as FeedbackRowWithCandidate[]
  ).map((f) => ({
    id: f.id,
    teamId: f.team_id,
    mentorId: f.mentor_id,
    candidateId: f.candidate_id,
    feedbackType: f.feedback_type,
    feedbackText: f.feedback_text,
    relatedJobId: f.related_job_id || undefined,
    relatedDocumentId: f.related_document_id || undefined,
    isRead: f.is_read,
    readAt: f.read_at || undefined,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    candidate: f.candidate
      ? { fullName: f.candidate.full_name, email: f.candidate.email }
      : undefined,
  }));

  return { data: feedbackList, error: null, status: 200 };
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  userId: string,
  feedbackId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("mentor_feedback")
    .delete()
    .eq("id", feedbackId)
    .eq("mentor_id", userId);

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
// GOAL OPERATIONS
// ============================================================================

/**
 * Create a goal for a mentee
 */
export async function createMenteeGoal(
  userId: string,
  data: CreateGoalData
): Promise<Result<MenteeGoal>> {
  const { data: goal, error } = await supabase
    .from("mentee_goals")
    .insert({
      team_id: data.teamId,
      candidate_id: data.candidateId,
      mentor_id: userId,
      goal_type: data.goalType,
      title: data.title,
      description: data.description || null,
      target_value: data.targetValue || null,
      due_date: data.dueDate || null,
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

  type GoalRow = {
    id: string;
    team_id: string;
    candidate_id: string;
    mentor_id: string | null;
    goal_type: string;
    title: string;
    description: string | null;
    target_value: number | null;
    current_value: number;
    start_date: string;
    due_date: string | null;
    status: "active" | "completed" | "missed" | "cancelled";
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const row = goal as GoalRow;

  return {
    data: {
      id: row.id,
      teamId: row.team_id,
      candidateId: row.candidate_id,
      mentorId: row.mentor_id || undefined,
      goalType: row.goal_type,
      title: row.title,
      description: row.description || undefined,
      targetValue: row.target_value || undefined,
      currentValue: row.current_value,
      startDate: row.start_date,
      dueDate: row.due_date || undefined,
      status: row.status,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    error: null,
    status: 201,
  };
}

/**
 * Get goals for a specific mentee
 */
export async function getMenteeGoals(
  userId: string,
  candidateId: string,
  teamId: string
): Promise<Result<MenteeGoal[]>> {
  // Verify access (mentor assigned to this candidate)
  const { data: assignment, error: assignError } = await supabase
    .from("team_member_assignments")
    .select("id")
    .eq("mentor_id", userId)
    .eq("candidate_id", candidateId)
    .eq("team_id", teamId)
    .eq("is_active", true)
    .single();

  if (assignError || !assignment) {
    return {
      data: null,
      error: {
        message: "Not authorized to view this candidate's goals",
        status: 403,
      },
      status: 403,
    };
  }

  const { data: goals, error } = await supabase
    .from("mentee_goals")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type GoalRow = {
    id: string;
    team_id: string;
    candidate_id: string;
    mentor_id: string | null;
    goal_type: string;
    title: string;
    description: string | null;
    target_value: number | null;
    current_value: number;
    start_date: string;
    due_date: string | null;
    status: "active" | "completed" | "missed" | "cancelled";
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const goalList: MenteeGoal[] = (goals as GoalRow[]).map((g) => ({
    id: g.id,
    teamId: g.team_id,
    candidateId: g.candidate_id,
    mentorId: g.mentor_id || undefined,
    goalType: g.goal_type,
    title: g.title,
    description: g.description || undefined,
    targetValue: g.target_value || undefined,
    currentValue: g.current_value,
    startDate: g.start_date,
    dueDate: g.due_date || undefined,
    status: g.status,
    completedAt: g.completed_at || undefined,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }));

  return { data: goalList, error: null, status: 200 };
}

/**
 * Update goal progress or status
 */
export async function updateMenteeGoal(
  userId: string,
  goalId: string,
  updates: Partial<{
    currentValue: number;
    status: "active" | "completed" | "missed" | "cancelled";
    title: string;
    description: string;
    targetValue: number;
    dueDate: string;
  }>
): Promise<Result<MenteeGoal>> {
  const updateData: Record<string, unknown> = {};

  if (updates.currentValue !== undefined)
    updateData.current_value = updates.currentValue;
  if (updates.status) {
    updateData.status = updates.status;
    if (updates.status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }
  }
  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.targetValue !== undefined)
    updateData.target_value = updates.targetValue;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

  const { data: goal, error } = await supabase
    .from("mentee_goals")
    .update(updateData)
    .eq("id", goalId)
    .eq("mentor_id", userId) // Only mentor who created can update
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type GoalRow = {
    id: string;
    team_id: string;
    candidate_id: string;
    mentor_id: string | null;
    goal_type: string;
    title: string;
    description: string | null;
    target_value: number | null;
    current_value: number;
    start_date: string;
    due_date: string | null;
    status: "active" | "completed" | "missed" | "cancelled";
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const row = goal as GoalRow;

  return {
    data: {
      id: row.id,
      teamId: row.team_id,
      candidateId: row.candidate_id,
      mentorId: row.mentor_id || undefined,
      goalType: row.goal_type,
      title: row.title,
      description: row.description || undefined,
      targetValue: row.target_value || undefined,
      currentValue: row.current_value,
      startDate: row.start_date,
      dueDate: row.due_date || undefined,
      status: row.status,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    error: null,
    status: 200,
  };
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

/**
 * Get summary stats for the mentor dashboard
 * Aggregates data across all assigned mentees
 */
export async function getMentorDashboardSummary(
  userId: string,
  teamId: string
): Promise<
  Result<{
    totalMentees: number;
    activeMentees: number;
    inactiveMentees: number;
    totalActiveGoals: number;
    completedGoalsThisWeek: number;
    pendingFeedback: number;
    totalApplicationsThisWeek: number;
    totalInterviewsThisWeek: number;
  }>
> {
  // Get assigned mentees
  const menteesResult = await getAssignedMentees(userId, teamId);

  if (menteesResult.error) {
    return {
      data: null,
      error: menteesResult.error,
      status: menteesResult.status,
    };
  }

  const mentees = menteesResult.data || [];

  // Calculate engagement counts
  const activeMentees = mentees.filter(
    (m) => m.engagementLevel === "high" || m.engagementLevel === "medium"
  ).length;
  const inactiveMentees = mentees.filter(
    (m) => m.engagementLevel === "low" || m.engagementLevel === "inactive"
  ).length;

  // Get active goals count
  const candidateIds = mentees.map((m) => m.candidate_id);

  const { data: goals } = await supabase
    .from("mentee_goals")
    .select("id, status, completed_at")
    .eq("team_id", teamId)
    .in("candidate_id", candidateIds.length > 0 ? candidateIds : ["none"]);

  const activeGoals = goals?.filter((g) => g.status === "active").length || 0;

  // Goals completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const completedThisWeek =
    goals?.filter((g) => {
      if (g.status !== "completed" || !g.completed_at) return false;
      return new Date(g.completed_at) >= oneWeekAgo;
    }).length || 0;

  // Count recent activity (applications/interviews this week)
  let totalAppsThisWeek = 0;
  let totalInterviewsThisWeek = 0;

  mentees.forEach((m) => {
    m.recentActivity.forEach((a) => {
      const activityDate = new Date(a.timestamp);
      if (activityDate >= oneWeekAgo) {
        if (a.type === "job_applied") totalAppsThisWeek++;
        if (
          a.type === "status_change" &&
          a.metadata?.statusChange &&
          (a.metadata.statusChange as { to: string }).to === "Interview"
        ) {
          totalInterviewsThisWeek++;
        }
      }
    });
  });

  return {
    data: {
      totalMentees: mentees.length,
      activeMentees,
      inactiveMentees,
      totalActiveGoals: activeGoals,
      completedGoalsThisWeek: completedThisWeek,
      pendingFeedback: 0, // TODO: Implement feedback tracking
      totalApplicationsThisWeek: totalAppsThisWeek,
      totalInterviewsThisWeek: totalInterviewsThisWeek,
    },
    error: null,
    status: 200,
  };
}
