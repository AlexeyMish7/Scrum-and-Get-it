/**
 * PROGRESS SHARING TYPE DEFINITIONS (UC-111)
 *
 * TypeScript interfaces for progress sharing and accountability features.
 * Mirrors the database schema from 2025-11-30_add_progress_sharing_tables.sql
 */

// ============================================================================
// SHARE SETTINGS TYPES
// ============================================================================

/**
 * Privacy controls for what data to share
 */
export interface ShareSettings {
  share_job_stats: boolean;
  share_application_count: boolean;
  share_interview_count: boolean;
  share_offer_count: boolean;
  share_goals: boolean;
  share_milestones: boolean;
  share_activity_timeline: boolean;
  share_company_names: boolean;
  share_salary_info: boolean;
  share_documents: boolean;
}

/**
 * Report generation preferences
 */
export interface ReportSettings {
  auto_generate_weekly: boolean;
  auto_generate_monthly: boolean;
  include_insights: boolean;
  include_recommendations: boolean;
}

/**
 * Notification preferences for progress sharing
 */
export interface NotificationSettings {
  notify_on_milestone: boolean;
  notify_on_goal_complete: boolean;
  notify_mentor_on_inactivity: boolean;
  inactivity_threshold_days: number;
}

/**
 * Progress share configuration row
 */
export interface ProgressShareRow {
  id: string;
  user_id: string;
  team_id: string;
  share_settings: ShareSettings;
  report_settings: ReportSettings;
  notification_settings: NotificationSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

/**
 * Types of milestones that can be achieved
 */
export type MilestoneType =
  | "first_application"
  | "applications_5"
  | "applications_10"
  | "applications_25"
  | "applications_50"
  | "applications_100"
  | "first_interview"
  | "interviews_5"
  | "interviews_10"
  | "first_offer"
  | "goal_completed"
  | "streak_7_days"
  | "streak_14_days"
  | "streak_30_days"
  | "profile_complete"
  | "resume_created"
  | "cover_letter_created"
  | "custom";

/**
 * Milestone database row
 */
export interface MilestoneRow {
  id: string;
  user_id: string;
  team_id: string | null;
  milestone_type: MilestoneType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  achieved_at: string;
  is_celebrated: boolean;
  celebrated_at: string | null;
  celebrated_by: string[];
  is_shared: boolean;
  created_at: string;
}

/**
 * Milestone with user profile info (for display)
 */
export interface MilestoneWithUser extends MilestoneRow {
  user?: {
    full_name: string | null;
    email: string | null;
  };
}

// ============================================================================
// PROGRESS REPORT TYPES
// ============================================================================

/**
 * Report type options
 */
export type ReportType = "weekly" | "monthly" | "custom";

/**
 * Report data structure
 */
export interface ReportData {
  summary: {
    total_applications?: number;
    total_interviews?: number;
    total_offers?: number;
    applications_change?: number;
    interviews_change?: number;
    activity_level?: "high" | "medium" | "low" | "inactive";
  };
  job_stats: {
    by_status?: Record<string, number>;
    by_source?: Record<string, number>;
    response_rate?: number;
    average_time_to_response?: number;
  };
  goal_progress: Array<{
    goal_id: string;
    title: string;
    target: number;
    current: number;
    status: string;
  }>;
  milestones_achieved: Array<{
    id: string;
    type: MilestoneType;
    title: string;
    achieved_at: string;
  }>;
  activity_highlights: Array<{
    date: string;
    description: string;
    type: string;
  }>;
  insights: string[];
  recommendations: string[];
}

/**
 * Progress report database row
 */
export interface ProgressReportRow {
  id: string;
  user_id: string;
  team_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  report_data: ReportData;
  generated_at: string;
  generated_by: "system" | "user" | "mentor";
  is_shared: boolean;
  shared_with: string[];
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
}

// ============================================================================
// ENCOURAGEMENT TYPES
// ============================================================================

/**
 * Types of encouragement messages
 */
export type EncouragementType =
  | "congratulation"
  | "encouragement"
  | "milestone_celebration"
  | "goal_cheer"
  | "motivation"
  | "check_in";

/**
 * Encouragement database row
 */
export interface EncouragementRow {
  id: string;
  team_id: string;
  sender_id: string;
  recipient_id: string;
  message_type: EncouragementType;
  message_text: string;
  related_milestone_id: string | null;
  related_goal_id: string | null;
  reaction_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Encouragement with sender info (for display)
 */
export interface EncouragementWithSender extends EncouragementRow {
  sender?: {
    full_name: string | null;
    email: string | null;
  };
}

// ============================================================================
// ACCOUNTABILITY METRICS TYPES
// ============================================================================

/**
 * Engagement statistics between partners
 */
export interface EngagementStats {
  messages_sent: number;
  messages_received: number;
  encouragements_sent: number;
  encouragements_received: number;
  feedback_given: number;
  feedback_received: number;
  check_ins: number;
  milestone_celebrations: number;
}

/**
 * Effectiveness tracking for accountability
 */
export interface EffectivenessStats {
  goals_set_by_partner: number;
  goals_completed: number;
  goals_completion_rate: number;
  activity_increase_percent: number;
  streak_maintained: number;
}

/**
 * Accountability metrics database row
 */
export interface AccountabilityMetricsRow {
  id: string;
  user_id: string;
  partner_id: string;
  team_id: string;
  engagement_stats: EngagementStats;
  effectiveness_stats: EffectivenessStats;
  last_interaction_at: string | null;
  interaction_frequency_days: number | null;
  health_score: number | null;
  period_start: string;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Accountability metrics with partner info (for display)
 */
export interface AccountabilityMetricsWithPartner extends AccountabilityMetricsRow {
  partner?: {
    full_name: string | null;
    email: string | null;
  };
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Form data for updating share settings
 */
export interface UpdateShareSettingsData {
  share_settings?: Partial<ShareSettings>;
  report_settings?: Partial<ReportSettings>;
  notification_settings?: Partial<NotificationSettings>;
  is_active?: boolean;
}

/**
 * Form data for creating a milestone
 */
export interface CreateMilestoneData {
  milestone_type: MilestoneType;
  title: string;
  description?: string;
  team_id?: string;
  metadata?: Record<string, unknown>;
  is_shared?: boolean;
}

/**
 * Form data for sending encouragement
 */
export interface SendEncouragementData {
  team_id: string;
  recipient_id: string;
  message_type: EncouragementType;
  message_text: string;
  related_milestone_id?: string;
  related_goal_id?: string;
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================

/**
 * Progress summary for dashboard display
 */
export interface ProgressSummary {
  sharing_enabled: boolean;
  job_stats?: {
    total: number;
    applied: number;
    interviewing: number;
    offers: number;
  };
  milestones_count: number;
  recent_milestones: Array<{
    id: string;
    type: MilestoneType;
    title: string;
    achieved_at: string;
  }>;
  goals_summary?: {
    active: number;
    completed: number;
    completion_rate: number;
  };
  activity_level?: "high" | "medium" | "low" | "inactive";
  last_active_at?: string;
}

/**
 * Accountability dashboard data
 */
export interface AccountabilityDashboard {
  partners: AccountabilityMetricsWithPartner[];
  total_engagements: number;
  total_encouragements_sent: number;
  total_encouragements_received: number;
  average_health_score: number;
  recent_encouragements: EncouragementWithSender[];
}
