/**
 * UC-115: External Advisor and Coach Integration
 * TypeScript types for external advisor management
 */

// ============================================================================
// ENUMS - Match database enum types
// ============================================================================

/**
 * Types of external advisors a user can invite
 */
export type AdvisorType =
  | "career_coach"
  | "resume_writer"
  | "interview_coach"
  | "industry_mentor"
  | "executive_coach"
  | "recruiter"
  | "counselor"
  | "consultant"
  | "other";

/**
 * Status of advisor relationship
 */
export type AdvisorStatus =
  | "pending" // Invitation sent
  | "active" // Active relationship
  | "paused" // Temporarily paused
  | "ended" // Relationship ended
  | "declined"; // Invitation declined

/**
 * Coaching session status
 */
export type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

/**
 * Recommendation implementation status
 */
export type RecommendationStatus =
  | "pending"
  | "in_progress"
  | "implemented"
  | "partially_done"
  | "declined"
  | "not_applicable";

/**
 * Billing status for paid coaching
 */
export type BillingStatus =
  | "free"
  | "pending"
  | "paid"
  | "overdue"
  | "refunded"
  | "cancelled";

/**
 * Session location type
 */
export type LocationType = "video" | "phone" | "in_person";

/**
 * Session type
 */
export type SessionType =
  | "coaching"
  | "review"
  | "planning"
  | "check_in"
  | "other";

/**
 * Recommendation category
 */
export type RecommendationCategory =
  | "resume"
  | "interview"
  | "networking"
  | "skills"
  | "strategy"
  | "other";

/**
 * Priority level
 */
export type Priority = "high" | "medium" | "low";

/**
 * Material type that can be shared
 */
export type MaterialType =
  | "document"
  | "job"
  | "profile_section"
  | "progress_report";

/**
 * Billing type
 */
export type BillingType = "session" | "package" | "subscription" | "one_time";

// ============================================================================
// DATABASE ROW TYPES - Direct mapping to database tables
// ============================================================================

/**
 * External advisor relationship row from database
 */
export interface ExternalAdvisorRow {
  id: string;
  user_id: string;
  advisor_email: string;
  advisor_name: string;
  advisor_user_id: string | null;
  advisor_type: AdvisorType;
  custom_type_name: string | null;
  organization_name: string | null;
  organization_website: string | null;
  advisor_title: string | null;
  status: AdvisorStatus;
  relationship_started_at: string | null;
  relationship_ended_at: string | null;
  end_reason: string | null;

  // Permissions
  can_view_profile: boolean;
  can_view_jobs: boolean;
  can_view_documents: boolean;
  can_view_analytics: boolean;
  can_view_interviews: boolean;
  can_add_recommendations: boolean;
  can_schedule_sessions: boolean;
  can_send_messages: boolean;

  // Notification preferences
  notify_on_milestones: boolean;
  notify_on_updates: boolean;
  update_frequency: string;

  // Engagement tracking
  last_accessed_at: string | null;
  access_count: number;
  total_sessions: number;
  total_recommendations: number;

  // Notes
  user_notes: string | null;
  advisor_notes: string | null;

  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Advisor invitation row from database
 */
export interface AdvisorInvitationRow {
  id: string;
  advisor_id: string;
  user_id: string;
  invitation_token: string;
  invitation_message: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string;
  sent_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  response_message: string | null;
  reminder_sent_at: string | null;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Advisor session row from database
 */
export interface AdvisorSessionRow {
  id: string;
  advisor_id: string;
  user_id: string;
  title: string;
  description: string | null;
  session_type: SessionType;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  location_type: LocationType;
  meeting_url: string | null;
  meeting_id: string | null;
  phone_number: string | null;
  physical_location: string | null;
  status: SessionStatus;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  agenda: AgendaItem[];
  session_notes: string | null;
  action_items: ActionItem[];
  follow_up_scheduled: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  user_rating: number | null;
  user_feedback: string | null;
  advisor_feedback: string | null;
  related_job_id: number | null;
  related_document_id: string | null;
  calendar_event_id: string | null;
  calendar_sync_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Advisor recommendation row from database
 */
export interface AdvisorRecommendationRow {
  id: string;
  advisor_id: string;
  user_id: string;
  session_id: string | null;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: Priority;
  status: RecommendationStatus;
  target_date: string | null;
  completed_at: string | null;
  progress_notes: string | null;
  implementation_steps: ImplementationStep[];
  expected_impact: string | null;
  actual_impact: string | null;
  impact_rating: number | null;
  related_job_id: number | null;
  related_document_id: string | null;
  related_skill: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Shared material row from database
 */
export interface AdvisorSharedMaterialRow {
  id: string;
  advisor_id: string;
  user_id: string;
  material_type: MaterialType;
  document_id: string | null;
  document_version_id: string | null;
  job_id: number | null;
  share_message: string | null;
  shared_at: string;
  expires_at: string | null;
  is_active: boolean;
  accessed_at: string | null;
  access_count: number;
  advisor_feedback: string | null;
  feedback_received_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Advisor billing row from database
 */
export interface AdvisorBillingRow {
  id: string;
  advisor_id: string;
  user_id: string;
  session_id: string | null;
  billing_type: BillingType;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: BillingStatus;
  payment_method: string | null;
  payment_reference: string | null;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_customer_id: string | null;
  notes: string | null;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Advisor message row from database
 */
export interface AdvisorMessageRow {
  id: string;
  advisor_id: string;
  sender_id: string;
  sender_type: "user" | "advisor";
  message_text: string;
  attachments: MessageAttachment[];
  is_read: boolean;
  read_at: string | null;
  parent_message_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// NESTED/JSONB TYPES
// ============================================================================

/**
 * Session agenda item
 */
export interface AgendaItem {
  id: string;
  title: string;
  duration_minutes?: number;
  completed?: boolean;
  notes?: string;
}

/**
 * Session action item
 */
export interface ActionItem {
  id: string;
  title: string;
  assignee: "user" | "advisor";
  due_date?: string;
  completed: boolean;
  completed_at?: string;
}

/**
 * Recommendation implementation step
 */
export interface ImplementationStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  filename: string;
  url: string;
  type: string;
  size_bytes?: number;
}

// ============================================================================
// ENRICHED TYPES - With joined profile data
// ============================================================================

/**
 * External advisor with enriched profile data
 */
export interface ExternalAdvisor extends ExternalAdvisorRow {
  // Advisor profile data (if they have an account)
  advisor_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;

  // Computed fields
  display_name: string;
  initials: string;
}

/**
 * Advisor session with enriched data
 */
export interface AdvisorSession extends AdvisorSessionRow {
  advisor?: {
    id: string;
    advisor_name: string;
    advisor_email: string;
    advisor_type: AdvisorType;
  };

  // Related entities
  job?: {
    id: number;
    company_name: string | null;
    position_title: string | null;
  } | null;

  document?: {
    id: string;
    document_type: string;
    file_name: string;
  } | null;
}

/**
 * Advisor recommendation with enriched data
 */
export interface AdvisorRecommendation extends AdvisorRecommendationRow {
  advisor?: {
    id: string;
    advisor_name: string;
    advisor_type: AdvisorType;
  };

  session?: {
    id: string;
    title: string;
    scheduled_start: string;
  } | null;
}

/**
 * Shared material with enriched data
 */
export interface AdvisorSharedMaterial extends AdvisorSharedMaterialRow {
  advisor?: {
    id: string;
    advisor_name: string;
  };

  document?: {
    id: string;
    document_type: string;
    file_name: string;
  } | null;

  job?: {
    id: number;
    company_name: string | null;
    position_title: string | null;
  } | null;
}

/**
 * Advisor message with enriched data
 */
export interface AdvisorMessage extends AdvisorMessageRow {
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;

  replies?: AdvisorMessage[];
}

// ============================================================================
// FORM DATA TYPES - For creating/updating records
// ============================================================================

/**
 * Data required to invite a new advisor
 */
export interface InviteAdvisorData {
  advisor_email: string;
  advisor_name: string;
  advisor_type: AdvisorType;
  custom_type_name?: string;
  organization_name?: string;
  organization_website?: string;
  advisor_title?: string;
  invitation_message?: string;

  // Initial permissions
  can_view_profile?: boolean;
  can_view_jobs?: boolean;
  can_view_documents?: boolean;
  can_view_analytics?: boolean;
  can_view_interviews?: boolean;
  can_add_recommendations?: boolean;
  can_schedule_sessions?: boolean;
  can_send_messages?: boolean;
}

/**
 * Data to update advisor permissions
 */
export interface UpdateAdvisorPermissionsData {
  can_view_profile?: boolean;
  can_view_jobs?: boolean;
  can_view_documents?: boolean;
  can_view_analytics?: boolean;
  can_view_interviews?: boolean;
  can_add_recommendations?: boolean;
  can_schedule_sessions?: boolean;
  can_send_messages?: boolean;
  notify_on_milestones?: boolean;
  notify_on_updates?: boolean;
  update_frequency?: string;
}

/**
 * Data to update advisor relationship
 */
export interface UpdateAdvisorData {
  advisor_name?: string;
  advisor_type?: AdvisorType;
  custom_type_name?: string;
  organization_name?: string;
  organization_website?: string;
  advisor_title?: string;
  user_notes?: string;
  status?: AdvisorStatus;
  end_reason?: string;
}

/**
 * Data to schedule a new session
 */
export interface CreateSessionData {
  advisor_id: string;
  title: string;
  description?: string;
  session_type?: SessionType;
  scheduled_start: string;
  scheduled_end: string;
  timezone?: string;
  location_type: LocationType;
  meeting_url?: string;
  meeting_id?: string;
  phone_number?: string;
  physical_location?: string;
  agenda?: AgendaItem[];
  related_job_id?: number;
  related_document_id?: string;
}

/**
 * Data to update a session
 */
export interface UpdateSessionData {
  title?: string;
  description?: string;
  session_type?: SessionType;
  scheduled_start?: string;
  scheduled_end?: string;
  location_type?: LocationType;
  meeting_url?: string;
  status?: SessionStatus;
  cancellation_reason?: string;
  session_notes?: string;
  action_items?: ActionItem[];
  user_rating?: number;
  user_feedback?: string;
  follow_up_scheduled?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
}

/**
 * Data to create a recommendation
 */
export interface CreateRecommendationData {
  advisor_id: string;
  session_id?: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority?: Priority;
  target_date?: string;
  expected_impact?: string;
  implementation_steps?: Omit<ImplementationStep, "id">[];
  related_job_id?: number;
  related_document_id?: string;
  related_skill?: string;
}

/**
 * Data to update a recommendation
 */
export interface UpdateRecommendationData {
  title?: string;
  description?: string;
  category?: RecommendationCategory;
  priority?: Priority;
  status?: RecommendationStatus;
  target_date?: string;
  progress_notes?: string;
  implementation_steps?: ImplementationStep[];
  actual_impact?: string;
  impact_rating?: number;
}

/**
 * Data to share a material with advisor
 */
export interface ShareMaterialData {
  advisor_id: string;
  material_type: MaterialType;
  document_id?: string;
  document_version_id?: string;
  job_id?: number;
  share_message?: string;
  expires_at?: string;
}

/**
 * Data to create a billing record
 */
export interface CreateBillingData {
  advisor_id: string;
  session_id?: string;
  billing_type: BillingType;
  description?: string;
  amount_cents: number;
  currency?: string;
  status?: BillingStatus;
  payment_method?: string;
  due_date?: string;
  notes?: string;
}

/**
 * Data to send a message
 */
export interface SendMessageData {
  advisor_id: string;
  message_text: string;
  attachments?: MessageAttachment[];
  parent_message_id?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Advisor impact metrics returned from database function
 */
export interface AdvisorImpactMetrics {
  advisor_id: string;
  advisor_name: string;
  total_sessions: number;
  completed_sessions: number;
  total_recommendations: number;
  implemented_recommendations: number;
  implementation_rate: number;
  average_session_rating: number | null;
  total_hours: number;
  active_since: string | null;
}

/**
 * Upcoming session from database function
 */
export interface UpcomingSession {
  session_id: string;
  advisor_id: string;
  advisor_name: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  status: SessionStatus;
  location_type: LocationType;
  meeting_url: string | null;
}

/**
 * Pending recommendation from database function
 */
export interface PendingRecommendation {
  recommendation_id: string;
  advisor_id: string;
  advisor_name: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: Priority;
  target_date: string | null;
  created_at: string;
}

/**
 * Dashboard summary data
 */
export interface AdvisorDashboardSummary {
  total_advisors: number;
  active_advisors: number;
  pending_invitations: number;
  upcoming_sessions: number;
  pending_recommendations: number;
  total_hours_coached: number;
  average_rating: number | null;
}

/**
 * Conversation thread for messaging
 */
export interface MessageThread {
  advisor_id: string;
  advisor_name: string;
  advisor_email: string;
  last_message: AdvisorMessage | null;
  unread_count: number;
  messages: AdvisorMessage[];
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

/**
 * Filter options for advisor list
 */
export interface AdvisorFilters {
  status?: AdvisorStatus | AdvisorStatus[];
  advisor_type?: AdvisorType | AdvisorType[];
  search?: string;
}

/**
 * Filter options for sessions
 */
export interface SessionFilters {
  advisor_id?: string;
  status?: SessionStatus | SessionStatus[];
  session_type?: SessionType | SessionType[];
  date_from?: string;
  date_to?: string;
}

/**
 * Filter options for recommendations
 */
export interface RecommendationFilters {
  advisor_id?: string;
  status?: RecommendationStatus | RecommendationStatus[];
  category?: RecommendationCategory | RecommendationCategory[];
  priority?: Priority | Priority[];
}

/**
 * Sort options
 */
export type SortDirection = "asc" | "desc";

export interface SortOption<T extends string> {
  field: T;
  direction: SortDirection;
}

export type AdvisorSortField =
  | "advisor_name"
  | "created_at"
  | "total_sessions"
  | "last_accessed_at";
export type SessionSortField = "scheduled_start" | "created_at" | "title";
export type RecommendationSortField =
  | "created_at"
  | "priority"
  | "target_date"
  | "status";

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper type for advisor permission keys
 */
export type AdvisorPermissionKey =
  | "can_view_profile"
  | "can_view_jobs"
  | "can_view_documents"
  | "can_view_analytics"
  | "can_view_interviews"
  | "can_add_recommendations"
  | "can_schedule_sessions"
  | "can_send_messages";

/**
 * Advisor permissions object
 */
export type AdvisorPermissions = Record<AdvisorPermissionKey, boolean>;

/**
 * Labels for advisor types
 */
export const ADVISOR_TYPE_LABELS: Record<AdvisorType, string> = {
  career_coach: "Career Coach",
  resume_writer: "Resume Writer",
  interview_coach: "Interview Coach",
  industry_mentor: "Industry Mentor",
  executive_coach: "Executive Coach",
  recruiter: "Recruiter",
  counselor: "Career Counselor",
  consultant: "Career Consultant",
  other: "Other",
};

/**
 * Labels for advisor status
 */
export const ADVISOR_STATUS_LABELS: Record<AdvisorStatus, string> = {
  pending: "Pending",
  active: "Active",
  paused: "Paused",
  ended: "Ended",
  declined: "Declined",
};

/**
 * Labels for session status
 */
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  rescheduled: "Rescheduled",
};

/**
 * Labels for recommendation status
 */
export const RECOMMENDATION_STATUS_LABELS: Record<
  RecommendationStatus,
  string
> = {
  pending: "Pending",
  in_progress: "In Progress",
  implemented: "Implemented",
  partially_done: "Partially Done",
  declined: "Declined",
  not_applicable: "Not Applicable",
};

/**
 * Labels for recommendation categories
 */
export const RECOMMENDATION_CATEGORY_LABELS: Record<
  RecommendationCategory,
  string
> = {
  resume: "Resume",
  interview: "Interview",
  networking: "Networking",
  skills: "Skills",
  strategy: "Strategy",
  other: "Other",
};

/**
 * Labels for priority levels
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Colors for priority levels (Material-UI theme colors)
 */
export const PRIORITY_COLORS: Record<Priority, "error" | "warning" | "info"> = {
  high: "error",
  medium: "warning",
  low: "info",
};

/**
 * Colors for advisor status
 */
export const ADVISOR_STATUS_COLORS: Record<
  AdvisorStatus,
  "success" | "warning" | "error" | "info" | "default"
> = {
  pending: "warning",
  active: "success",
  paused: "info",
  ended: "default",
  declined: "error",
};

/**
 * Colors for session status
 */
export const SESSION_STATUS_COLORS: Record<
  SessionStatus,
  "success" | "warning" | "error" | "info" | "default"
> = {
  scheduled: "info",
  confirmed: "success",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
  no_show: "error",
  rescheduled: "warning",
};

/**
 * Colors for recommendation status
 */
export const RECOMMENDATION_STATUS_COLORS: Record<
  RecommendationStatus,
  "success" | "warning" | "error" | "info" | "default"
> = {
  pending: "warning",
  in_progress: "info",
  implemented: "success",
  partially_done: "warning",
  declined: "error",
  not_applicable: "default",
};
