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

  // For each mentee, fetch their progress data using SECURITY DEFINER functions
  // These bypass RLS to allow mentors to view their assigned candidates' data
  const menteesWithProgress: MenteeWithProgress[] = await Promise.all(
    (assignments as AssignedCandidateInfo[]).map(async (assignment) => {
      // Get job stats using the RPC function (bypasses RLS)
      const jobStats = await getMenteeJobStats(userId, assignment.candidate_id);

      // Get recent activity using RPC function (bypasses RLS)
      const recentActivity = await getMenteeRecentActivity(
        userId,
        assignment.candidate_id
      );

      // Get activity summary from RPC for engagement level
      const activitySummary = await getMenteeActivitySummary(
        userId,
        assignment.candidate_id
      );

      // Use engagement level from server, or calculate from recent activity as fallback
      const engagementLevel =
        activitySummary?.engagement_level ||
        calculateEngagementLevel(recentActivity);

      // Get last active timestamp from summary or activity
      const lastActiveAt =
        activitySummary?.last_activity_at ||
        (recentActivity.length > 0 ? recentActivity[0].timestamp : null);

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
 * Uses SECURITY DEFINER RPC function to bypass RLS
 * Only returns data if the mentor has an active assignment with this candidate
 */
async function getMenteeJobStats(
  mentorId: string,
  candidateId: string
): Promise<{
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
}> {
  // Use RPC function that bypasses RLS after verifying mentor-candidate relationship
  const { data, error } = await supabase.rpc("get_mentee_job_stats", {
    p_mentor_id: mentorId,
    p_candidate_id: candidateId,
  });

  if (error || !data || data.length === 0) {
    // Return zeros if we can't access
    return {
      total: 0,
      applied: 0,
      interviewing: 0,
      offers: 0,
      rejected: 0,
    };
  }

  // RPC returns an array with one row
  const stats = data[0];
  return {
    total: stats.total_jobs || 0,
    applied: stats.applied_count || 0,
    interviewing: stats.interviewing_count || 0,
    offers: stats.offer_count || 0,
    rejected: stats.rejected_count || 0,
  };
}

/**
 * Get activity summary for a mentee from the server
 * Uses SECURITY DEFINER RPC function for cross-user data access
 */
async function getMenteeActivitySummary(
  mentorId: string,
  candidateId: string
): Promise<{
  jobs_created_7d: number;
  jobs_updated_7d: number;
  documents_updated_7d: number;
  goals_completed_7d: number;
  last_activity_at: string | null;
  engagement_level: string;
} | null> {
  const { data, error } = await supabase.rpc("get_mentee_activity_summary", {
    p_mentor_id: mentorId,
    p_candidate_id: candidateId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

/**
 * Get recent activity for a mentee
 * Uses SECURITY DEFINER RPC function to get job data, then combines with
 * document and goal data
 *
 * Note: Activity data comes from multiple sources:
 * - jobs table via RPC (created_at, updated_at) for application activity
 * - document_versions for document updates
 * - mentee_goals for goal completions
 */
async function getMenteeRecentActivity(
  mentorId: string,
  candidateId: string
): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Get recent job applications using RPC function (bypasses RLS)
  const { data: recentJobs } = await supabase.rpc("get_mentee_recent_jobs", {
    p_mentor_id: mentorId,
    p_candidate_id: candidateId,
    p_limit: 15,
  });

  if (recentJobs) {
    type JobRow = {
      job_id: number;
      title: string;
      company_name: string;
      job_status: string;
      created_at: string;
      updated_at: string;
    };

    (recentJobs as JobRow[]).forEach((job) => {
      // Check if this is a recent creation (created within last 30 days)
      const createdDate = new Date(job.created_at);
      const now = new Date();
      const daysSinceCreated = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Add job application activity
      if (daysSinceCreated <= 30) {
        activities.push({
          id: `job-created-${job.job_id}`,
          type: "job_applied",
          description: `Applied to ${job.title} at ${job.company_name}`,
          timestamp: job.created_at,
          metadata: { jobId: job.job_id, status: job.job_status },
        });
      }

      // If updated_at is different from created_at, there was an update
      const updatedDate = new Date(job.updated_at);
      const timeDiff = Math.abs(updatedDate.getTime() - createdDate.getTime());
      if (timeDiff > 60000) {
        // More than 1 minute difference = genuine update
        activities.push({
          id: `job-updated-${job.job_id}`,
          type: "status_change",
          description: `Updated ${job.title} at ${job.company_name} (${job.job_status})`,
          timestamp: job.updated_at,
          metadata: { jobId: job.job_id, currentStatus: job.job_status },
        });
      }
    });
  }

  // Note: Document activity is included in the activity summary from RPC
  // We don't query document_versions directly due to RLS restrictions
  // The mentor can view documents via getMenteeDocuments() when needed
  const documents: Array<{
    id: string;
    title: string;
    document_type: string;
    created_at: string;
  }> | null = null;

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

  // Get recent goal completions - mentee_goals should be accessible
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
 * Uses SECURITY DEFINER RPC to bypass RLS after verifying mentor-candidate assignment
 * Mentors can review these for feedback
 */
export async function getMenteeDocuments(
  userId: string,
  candidateId: string,
  teamId: string
): Promise<Result<MenteeDocument[]>> {
  // Use RPC function that verifies mentor-candidate relationship and bypasses RLS
  const { data: documents, error } = await supabase.rpc(
    "get_mentee_documents",
    {
      p_mentor_id: userId,
      p_candidate_id: candidateId,
      p_team_id: teamId,
    }
  );

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  if (!documents || documents.length === 0) {
    return { data: [], error: null, status: 200 };
  }

  // Map RPC response to MenteeDocument type
  type DocumentRow = {
    document_id: string;
    title: string;
    document_type: string;
    version_number: number;
    created_at: string;
    updated_at: string;
    job_id: number | null;
    job_title: string | null;
    company_name: string | null;
  };

  const menteeDocuments: MenteeDocument[] = (documents as DocumentRow[]).map(
    (d) => ({
      id: d.document_id,
      title: d.title,
      documentType: d.document_type as "resume" | "cover_letter",
      version: d.version_number,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      jobId: d.job_id || undefined,
      jobTitle: d.job_title || undefined,
      companyName: d.company_name || undefined,
    })
  );

  return { data: menteeDocuments, error: null, status: 200 };
}

/**
 * Mentee profile summary type for mentor viewing
 */
export interface MenteeProfileSummary {
  candidateId: string;
  fullName: string;
  email: string;
  professionalTitle: string | null;
  experienceLevel: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  skillCount: number;
  employmentCount: number;
  educationCount: number;
  projectCount: number;
  certificationCount: number;
}

/**
 * Get a summary of the mentee's profile for mentor viewing
 * Uses SECURITY DEFINER RPC to bypass RLS after verifying mentor-candidate assignment
 */
export async function getMenteeProfileSummary(
  userId: string,
  candidateId: string
): Promise<Result<MenteeProfileSummary | null>> {
  const { data, error } = await supabase.rpc("get_mentee_profile_summary", {
    p_mentor_id: userId,
    p_candidate_id: candidateId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  if (!data || data.length === 0) {
    return { data: null, error: null, status: 200 };
  }

  const row = data[0];
  return {
    data: {
      candidateId: row.candidate_id,
      fullName: row.full_name,
      email: row.email,
      professionalTitle: row.professional_title,
      experienceLevel: row.experience_level,
      industry: row.industry,
      city: row.city,
      state: row.state,
      skillCount: row.skill_count || 0,
      employmentCount: row.employment_count || 0,
      educationCount: row.education_count || 0,
      projectCount: row.project_count || 0,
      certificationCount: row.certification_count || 0,
    },
    error: null,
    status: 200,
  };
}

/**
 * Mentee skill type for mentor viewing
 */
export interface MenteeSkill {
  id: string;
  name: string;
  proficiencyLevel: string;
  category: string;
  yearsOfExperience: number | null;
}

/**
 * Get all skills for a mentee
 * Uses SECURITY DEFINER RPC to bypass RLS after verifying mentor-candidate assignment
 */
export async function getMenteeSkills(
  userId: string,
  candidateId: string
): Promise<Result<MenteeSkill[]>> {
  const { data, error } = await supabase.rpc("get_mentee_skills", {
    p_mentor_id: userId,
    p_candidate_id: candidateId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  if (!data || data.length === 0) {
    return { data: [], error: null, status: 200 };
  }

  type SkillRow = {
    skill_id: string;
    skill_name: string;
    proficiency_level: string;
    skill_category: string;
    years_of_experience: number | null;
  };

  const skills: MenteeSkill[] = (data as SkillRow[]).map((s) => ({
    id: s.skill_id,
    name: s.skill_name,
    proficiencyLevel: s.proficiency_level,
    category: s.skill_category,
    yearsOfExperience: s.years_of_experience,
  }));

  return { data: skills, error: null, status: 200 };
}

/**
 * Mentee employment type for mentor viewing
 */
export interface MenteeEmployment {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  currentPosition: boolean;
  description: string | null;
  achievements: string[];
}

/**
 * Get employment history for a mentee
 * Uses SECURITY DEFINER RPC to bypass RLS after verifying mentor-candidate assignment
 */
export async function getMenteeEmployment(
  userId: string,
  candidateId: string
): Promise<Result<MenteeEmployment[]>> {
  const { data, error } = await supabase.rpc("get_mentee_employment", {
    p_mentor_id: userId,
    p_candidate_id: candidateId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  if (!data || data.length === 0) {
    return { data: [], error: null, status: 200 };
  }

  type EmploymentRow = {
    employment_id: string;
    job_title: string;
    company_name: string;
    location: string | null;
    start_date: string;
    end_date: string | null;
    current_position: boolean;
    job_description: string | null;
    achievements: string[] | null;
  };

  const employment: MenteeEmployment[] = (data as EmploymentRow[]).map((e) => ({
    id: e.employment_id,
    jobTitle: e.job_title,
    companyName: e.company_name,
    location: e.location,
    startDate: e.start_date,
    endDate: e.end_date,
    currentPosition: e.current_position,
    description: e.job_description,
    achievements: e.achievements || [],
  }));

  return { data: employment, error: null, status: 200 };
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
