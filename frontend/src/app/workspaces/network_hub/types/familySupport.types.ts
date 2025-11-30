/**
 * Family Support Type Definitions (UC-113)
 *
 * TypeScript interfaces mirroring the database schema for family and personal
 * support integration. Used across the network_hub workspace.
 *
 * Purpose:
 * - Family-friendly progress summaries (no sensitive details like salary/rejections)
 * - Educational resources for family members on effective support
 * - Celebration and milestone sharing with family
 * - Stress management and well-being tracking
 * - Boundary setting for healthy support dynamics
 */

// ============================================================================
// ENUMS (matching database enum types)
// ============================================================================

/**
 * Relationship type between job seeker and supporter
 */
export type SupporterRole =
  | "spouse"
  | "partner"
  | "parent"
  | "sibling"
  | "child"
  | "friend"
  | "mentor"
  | "therapist"
  | "other";

/**
 * Status of supporter invitation/relationship
 */
export type SupporterStatus = "pending" | "active" | "declined" | "removed";

/**
 * Types of milestone achievements
 */
export type MilestoneType =
  | "first_application"
  | "application_milestone"
  | "first_interview"
  | "interview_milestone"
  | "offer_received"
  | "offer_accepted"
  | "skill_learned"
  | "certification_earned"
  | "networking_milestone"
  | "goal_achieved"
  | "streak_achieved"
  | "custom";

/**
 * Stress level indicator
 */
export type StressLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

/**
 * Mood indicator for check-ins
 */
export type MoodType = "great" | "good" | "okay" | "struggling" | "overwhelmed";

/**
 * Types of support boundaries
 */
export type BoundaryType =
  | "communication_frequency"
  | "topic_restriction"
  | "advice_limitation"
  | "timing_preference"
  | "support_style"
  | "custom";

/**
 * Categories for family educational resources
 */
export type ResourceCategory =
  | "understanding_process"
  | "effective_support"
  | "what_not_to_say"
  | "emotional_support"
  | "practical_help"
  | "celebrating_wins"
  | "handling_rejection"
  | "stress_management";

/**
 * Types of family communications
 */
export type CommunicationType =
  | "progress_update"
  | "milestone_share"
  | "general_update"
  | "thank_you"
  | "boundary_reminder"
  | "custom";

// ============================================================================
// DATABASE ROW TYPES (match table schemas exactly)
// ============================================================================

/**
 * Family supporter table row
 * Represents a person invited to support the job seeker
 */
export interface FamilySupporterRow {
  id: string;
  user_id: string;
  supporter_email: string;
  supporter_name: string;
  supporter_user_id: string | null;
  role: SupporterRole;
  custom_role_name: string | null;
  status: SupporterStatus;
  invitation_token: string | null;
  invitation_message: string | null;
  invited_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  can_view_applications: boolean;
  can_view_interviews: boolean;
  can_view_progress: boolean;
  can_view_milestones: boolean;
  can_view_stress: boolean;
  can_send_encouragement: boolean;
  last_viewed_at: string | null;
  view_count: number;
  encouragements_sent: number;
  notify_on_milestones: boolean;
  notify_on_updates: boolean;
  notify_frequency: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Family support settings table row
 * Global settings for family support feature
 */
export interface FamilySupportSettingsRow {
  id: string;
  user_id: string;
  family_support_enabled: boolean;
  auto_share_milestones: boolean;
  default_view_applications: boolean;
  default_view_interviews: boolean;
  default_view_progress: boolean;
  default_view_milestones: boolean;
  default_view_stress: boolean;
  hide_salary_info: boolean;
  hide_rejection_details: boolean;
  hide_company_names: boolean;
  digest_frequency: string | null;
  stress_tracking_enabled: boolean;
  stress_alert_threshold: StressLevel | null;
  created_at: string;
  updated_at: string;
}

/**
 * Family progress summary table row
 * Family-friendly summaries without sensitive details
 */
export interface FamilyProgressSummaryRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  period_type: "daily" | "weekly" | "monthly";
  title: string;
  summary_text: string;
  applications_sent: number;
  interviews_scheduled: number;
  interviews_completed: number;
  skills_practiced: number;
  networking_activities: number;
  overall_mood: MoodType | null;
  mood_trend: "improving" | "stable" | "declining" | null;
  highlights: SummaryHighlight[];
  upcoming_events: UpcomingEvent[];
  is_shared: boolean;
  shared_at: string | null;
  shared_with_all: boolean;
  shared_with_supporters: string[];
  view_count: number;
  encouragement_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Family milestone table row
 * Shareable achievements and celebrations
 */
export interface FamilyMilestoneRow {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string | null;
  milestone_value: number | null;
  related_job_id: number | null;
  celebration_message: string | null;
  celebration_emoji: string;
  is_shared: boolean;
  shared_at: string | null;
  shared_with_all: boolean;
  shared_with_supporters: string[];
  view_count: number;
  reactions: MilestoneReaction[];
  is_auto_generated: boolean;
  achieved_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Family resource table row
 * Educational content for family supporters
 */
export interface FamilyResourceRow {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  content_type: "article" | "video" | "guide" | "checklist" | "tip";
  content_url: string | null;
  content_body: string | null;
  estimated_read_time: number | null;
  author: string | null;
  source: string | null;
  target_audience: string[];
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Stress metrics table row
 * Daily well-being check-ins
 */
export interface StressMetricsRow {
  id: string;
  user_id: string;
  check_in_date: string;
  check_in_time: string;
  stress_level: StressLevel;
  mood: MoodType;
  stress_score: number;
  energy_level: number | null;
  motivation_level: number | null;
  notes: string | null;
  stress_factors: string[];
  positive_factors: string[];
  self_care_activities: string[];
  sleep_quality: number | null;
  job_search_hours: number | null;
  applications_today: number;
  created_at: string;
  updated_at: string;
}

/**
 * Support boundary table row
 * Healthy support dynamics and preferences
 */
export interface SupportBoundaryRow {
  id: string;
  user_id: string;
  boundary_type: BoundaryType;
  title: string;
  description: string;
  applies_to_all: boolean;
  applies_to_supporters: string[];
  positive_alternatives: string[];
  is_active: boolean;
  show_to_supporters: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Family communication table row
 * Update messages to supporters
 */
export interface FamilyCommunicationRow {
  id: string;
  user_id: string;
  communication_type: CommunicationType;
  subject: string | null;
  message_body: string;
  sent_to_all: boolean;
  recipient_ids: string[];
  related_milestone_id: string | null;
  related_summary_id: string | null;
  is_sent: boolean;
  sent_at: string | null;
  read_by: ReadReceipt[];
  read_count: number;
  template_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NESTED JSONB TYPES
// ============================================================================

/**
 * Highlight in progress summary
 */
export interface SummaryHighlight {
  title: string;
  description?: string;
  emoji?: string;
  type?: "achievement" | "activity" | "learning" | "positive";
}

/**
 * Upcoming event for family awareness
 */
export interface UpcomingEvent {
  title: string;
  date: string;
  type: "interview" | "deadline" | "networking" | "other";
  notes?: string;
}

/**
 * Reaction to a milestone
 */
export interface MilestoneReaction {
  supporter_id: string;
  supporter_name: string;
  emoji: string;
  message?: string;
  created_at: string;
}

/**
 * Read receipt for communications
 */
export interface ReadReceipt {
  supporter_id: string;
  read_at: string;
}

/**
 * Supporter permissions summary
 */
export interface SupporterPermissions {
  canViewApplications: boolean;
  canViewInterviews: boolean;
  canViewProgress: boolean;
  canViewMilestones: boolean;
  canViewStress: boolean;
  canSendEncouragement: boolean;
}

// ============================================================================
// ENRICHED TYPES (with joined data for UI)
// ============================================================================

/**
 * Supporter with user profile if they have an account
 */
export interface FamilySupporterWithProfile extends FamilySupporterRow {
  supporterProfile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Progress summary with engagement stats
 */
export interface ProgressSummaryWithEngagement
  extends FamilyProgressSummaryRow {
  supporterViews: Array<{
    supporterId: string;
    supporterName: string;
    viewedAt: string;
  }>;
  encouragements: Array<{
    supporterId: string;
    supporterName: string;
    message: string;
    sentAt: string;
  }>;
}

/**
 * Milestone with reactions from supporters
 */
export interface MilestoneWithReactions extends FamilyMilestoneRow {
  reactionSummary: {
    totalReactions: number;
    uniqueSupporters: number;
    topEmojis: string[];
  };
}

/**
 * Resource with user-specific tracking
 */
export interface FamilyResourceWithTracking extends FamilyResourceRow {
  hasViewed?: boolean;
  markedHelpful?: boolean;
}

/**
 * Stress metrics with trend analysis
 */
export interface StressMetricsWithTrend extends StressMetricsRow {
  trend: {
    stressTrend: "improving" | "stable" | "worsening";
    moodTrend: "improving" | "stable" | "worsening";
    averageStress7Days: number;
    averageMood7Days: number;
  };
}

// ============================================================================
// FORM DATA TYPES (for creating/updating records)
// ============================================================================

/**
 * Form data for inviting a family supporter
 */
export interface InviteSupporterData {
  supporterEmail: string;
  supporterName: string;
  role: SupporterRole;
  customRoleName?: string;
  invitationMessage?: string;
  permissions: Partial<SupporterPermissions>;
}

/**
 * Form data for updating supporter permissions
 */
export interface UpdateSupporterPermissionsData {
  canViewApplications?: boolean;
  canViewInterviews?: boolean;
  canViewProgress?: boolean;
  canViewMilestones?: boolean;
  canViewStress?: boolean;
  canSendEncouragement?: boolean;
  notifyOnMilestones?: boolean;
  notifyOnUpdates?: boolean;
  notifyFrequency?: string;
}

/**
 * Form data for updating family support settings
 */
export interface UpdateFamilySupportSettingsData {
  familySupportEnabled?: boolean;
  autoShareMilestones?: boolean;
  defaultViewApplications?: boolean;
  defaultViewInterviews?: boolean;
  defaultViewProgress?: boolean;
  defaultViewMilestones?: boolean;
  defaultViewStress?: boolean;
  hideSalaryInfo?: boolean;
  hideRejectionDetails?: boolean;
  hideCompanyNames?: boolean;
  digestFrequency?: string;
  stressTrackingEnabled?: boolean;
  stressAlertThreshold?: StressLevel;
}

/**
 * Form data for creating a progress summary
 */
export interface CreateProgressSummaryData {
  periodStart: string;
  periodEnd: string;
  periodType: "daily" | "weekly" | "monthly";
  title: string;
  summaryText: string;
  highlights?: SummaryHighlight[];
  upcomingEvents?: UpcomingEvent[];
  isShared?: boolean;
  sharedWithAll?: boolean;
  sharedWithSupporters?: string[];
}

/**
 * Form data for creating a milestone
 */
export interface CreateMilestoneData {
  milestoneType: MilestoneType;
  title: string;
  description?: string;
  milestoneValue?: number;
  relatedJobId?: number;
  celebrationMessage?: string;
  celebrationEmoji?: string;
  isShared?: boolean;
  sharedWithAll?: boolean;
  sharedWithSupporters?: string[];
}

/**
 * Form data for daily stress check-in
 */
export interface StressCheckInData {
  stressLevel: StressLevel;
  mood: MoodType;
  stressScore: number;
  energyLevel?: number;
  motivationLevel?: number;
  notes?: string;
  stressFactors?: string[];
  positiveFactors?: string[];
  selfCareActivities?: string[];
  sleepQuality?: number;
  jobSearchHours?: number;
  applicationsToday?: number;
}

/**
 * Form data for creating a support boundary
 */
export interface CreateBoundaryData {
  boundaryType: BoundaryType;
  title: string;
  description: string;
  appliesToAll?: boolean;
  appliesToSupporters?: string[];
  positiveAlternatives?: string[];
  showToSupporters?: boolean;
}

/**
 * Form data for sending a communication
 */
export interface SendCommunicationData {
  communicationType: CommunicationType;
  subject?: string;
  messageBody: string;
  sentToAll?: boolean;
  recipientIds?: string[];
  relatedMilestoneId?: string;
  relatedSummaryId?: string;
  templateName?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface FamilySupportApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    status: number | null;
  } | null;
}

/**
 * Dashboard summary for family support
 */
export interface FamilySupportDashboard {
  settings: FamilySupportSettingsRow | null;
  activeSupporters: FamilySupporterWithProfile[];
  pendingInvitations: FamilySupporterRow[];
  recentMilestones: FamilyMilestoneRow[];
  latestSummary: FamilyProgressSummaryRow | null;
  todaysStress: StressMetricsRow | null;
  activeBoundaries: SupportBoundaryRow[];
  unreadEncouragements: number;
}

/**
 * Supporter dashboard view (what supporters see)
 */
export interface SupporterDashboard {
  jobSeeker: {
    name: string;
    email: string;
  };
  permissions: SupporterPermissions;
  recentSummaries: FamilyProgressSummaryRow[];
  sharedMilestones: FamilyMilestoneRow[];
  boundaries: SupportBoundaryRow[];
  resources: FamilyResourceRow[];
}

/**
 * Well-being analytics summary
 */
export interface WellBeingAnalytics {
  averageStress: number;
  averageMood: number;
  stressTrend: "improving" | "stable" | "worsening";
  moodTrend: "improving" | "stable" | "worsening";
  topStressFactors: Array<{ factor: string; count: number }>;
  topPositiveFactors: Array<{ factor: string; count: number }>;
  selfCareFrequency: Array<{ activity: string; count: number }>;
  weeklyBreakdown: Array<{
    date: string;
    stressScore: number;
    mood: MoodType;
  }>;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filter options for supporters
 */
export interface SupporterFilters {
  status?: SupporterStatus;
  role?: SupporterRole;
}

/**
 * Filter options for milestones
 */
export interface MilestoneFilters {
  milestoneType?: MilestoneType;
  isShared?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filter options for stress metrics
 */
export interface StressMetricsFilters {
  dateFrom?: string;
  dateTo?: string;
  stressLevel?: StressLevel;
  mood?: MoodType;
}

/**
 * Filter options for resources
 */
export interface ResourceFilters {
  category?: ResourceCategory;
  contentType?: "article" | "video" | "guide" | "checklist" | "tip";
  targetAudience?: SupporterRole;
  isFeatured?: boolean;
}

// ============================================================================
// UTILITY TYPES & CONSTANTS
// ============================================================================

/**
 * Supporter role display info
 */
export interface RoleInfo {
  value: SupporterRole;
  label: string;
  icon: string;
  description: string;
}

/**
 * Map of supporter roles to display info
 */
export const SUPPORTER_ROLE_INFO: Record<SupporterRole, RoleInfo> = {
  spouse: {
    value: "spouse",
    label: "Spouse",
    icon: "💑",
    description: "Your spouse or partner",
  },
  partner: {
    value: "partner",
    label: "Partner",
    icon: "❤️",
    description: "Your significant other",
  },
  parent: {
    value: "parent",
    label: "Parent",
    icon: "👨‍👩‍👧",
    description: "Your parent or guardian",
  },
  sibling: {
    value: "sibling",
    label: "Sibling",
    icon: "👫",
    description: "Your brother or sister",
  },
  child: {
    value: "child",
    label: "Child",
    icon: "👶",
    description: "Your adult child",
  },
  friend: {
    value: "friend",
    label: "Close Friend",
    icon: "🤝",
    description: "A trusted friend",
  },
  mentor: {
    value: "mentor",
    label: "Mentor",
    icon: "🎓",
    description: "A career mentor or advisor",
  },
  therapist: {
    value: "therapist",
    label: "Therapist/Counselor",
    icon: "💭",
    description: "Your mental health professional",
  },
  other: {
    value: "other",
    label: "Other",
    icon: "👤",
    description: "Another trusted person",
  },
};

/**
 * Milestone type display info
 */
export const MILESTONE_TYPE_INFO: Record<
  MilestoneType,
  { label: string; icon: string; defaultEmoji: string }
> = {
  first_application: {
    label: "First Application",
    icon: "📄",
    defaultEmoji: "🎯",
  },
  application_milestone: {
    label: "Application Milestone",
    icon: "📊",
    defaultEmoji: "🚀",
  },
  first_interview: {
    label: "First Interview",
    icon: "🎤",
    defaultEmoji: "🎉",
  },
  interview_milestone: {
    label: "Interview Milestone",
    icon: "📈",
    defaultEmoji: "⭐",
  },
  offer_received: {
    label: "Offer Received",
    icon: "📬",
    defaultEmoji: "🎊",
  },
  offer_accepted: {
    label: "Offer Accepted",
    icon: "✅",
    defaultEmoji: "🏆",
  },
  skill_learned: {
    label: "New Skill Learned",
    icon: "💡",
    defaultEmoji: "📚",
  },
  certification_earned: {
    label: "Certification Earned",
    icon: "🏅",
    defaultEmoji: "🎓",
  },
  networking_milestone: {
    label: "Networking Milestone",
    icon: "🔗",
    defaultEmoji: "🤝",
  },
  goal_achieved: {
    label: "Goal Achieved",
    icon: "🎯",
    defaultEmoji: "✨",
  },
  streak_achieved: {
    label: "Streak Achieved",
    icon: "🔥",
    defaultEmoji: "🔥",
  },
  custom: {
    label: "Custom Milestone",
    icon: "⭐",
    defaultEmoji: "🎉",
  },
};

/**
 * Stress level display info
 */
export const STRESS_LEVEL_INFO: Record<
  StressLevel,
  { label: string; color: string; icon: string }
> = {
  very_low: { label: "Very Low", color: "#4CAF50", icon: "😌" },
  low: { label: "Low", color: "#8BC34A", icon: "🙂" },
  moderate: { label: "Moderate", color: "#FFC107", icon: "😐" },
  high: { label: "High", color: "#FF9800", icon: "😟" },
  very_high: { label: "Very High", color: "#F44336", icon: "😰" },
};

/**
 * Mood type display info
 */
export const MOOD_TYPE_INFO: Record<
  MoodType,
  { label: string; color: string; icon: string }
> = {
  great: { label: "Great", color: "#4CAF50", icon: "😄" },
  good: { label: "Good", color: "#8BC34A", icon: "🙂" },
  okay: { label: "Okay", color: "#FFC107", icon: "😐" },
  struggling: { label: "Struggling", color: "#FF9800", icon: "😔" },
  overwhelmed: { label: "Overwhelmed", color: "#F44336", icon: "😞" },
};

/**
 * Resource category display info
 */
export const RESOURCE_CATEGORY_INFO: Record<
  ResourceCategory,
  { label: string; icon: string; description: string }
> = {
  understanding_process: {
    label: "Understanding the Process",
    icon: "📖",
    description: "Learn what job searching really looks like",
  },
  effective_support: {
    label: "Effective Support",
    icon: "💪",
    description: "How to provide meaningful support",
  },
  what_not_to_say: {
    label: "What NOT to Say",
    icon: "🚫",
    description: "Well-meaning phrases that can hurt",
  },
  emotional_support: {
    label: "Emotional Support",
    icon: "❤️",
    description: "Supporting emotional well-being",
  },
  practical_help: {
    label: "Practical Help",
    icon: "🛠️",
    description: "Concrete ways to help",
  },
  celebrating_wins: {
    label: "Celebrating Wins",
    icon: "🎉",
    description: "Recognizing progress and achievements",
  },
  handling_rejection: {
    label: "Handling Rejection",
    icon: "💙",
    description: "Responding when things don't work out",
  },
  stress_management: {
    label: "Stress Management",
    icon: "🧘",
    description: "Encouraging self-care and balance",
  },
};

/**
 * Boundary type display info
 */
export const BOUNDARY_TYPE_INFO: Record<
  BoundaryType,
  { label: string; icon: string; example: string }
> = {
  communication_frequency: {
    label: "Communication Frequency",
    icon: "📅",
    example: "I'll share updates weekly, please don't ask daily",
  },
  topic_restriction: {
    label: "Topic Restriction",
    icon: "🚫",
    example: "Please don't bring up my job search at family events",
  },
  advice_limitation: {
    label: "Advice Limitation",
    icon: "💬",
    example: "I appreciate support, but please don't offer unsolicited advice",
  },
  timing_preference: {
    label: "Timing Preference",
    icon: "⏰",
    example: "Please don't ask about job search during dinner",
  },
  support_style: {
    label: "Support Style",
    icon: "🤝",
    example: "I need emotional support, not problem-solving right now",
  },
  custom: {
    label: "Custom Boundary",
    icon: "✏️",
    example: "Define your own boundary",
  },
};

/**
 * Common stress factors for quick selection
 */
export const COMMON_STRESS_FACTORS = [
  "Job rejections",
  "Waiting to hear back",
  "Interview anxiety",
  "Financial pressure",
  "Comparison to others",
  "Lack of responses",
  "Difficult interviews",
  "Family pressure",
  "Self-doubt",
  "Time pressure",
  "Skill gaps",
  "Uncertainty",
];

/**
 * Common positive factors for quick selection
 */
export const COMMON_POSITIVE_FACTORS = [
  "Got an interview",
  "Positive feedback",
  "Support from family",
  "Learning new skills",
  "Networking connections",
  "Exercise/activity",
  "Good sleep",
  "Time with friends",
  "Achieved a goal",
  "Made progress",
  "Self-care activities",
  "Positive outlook",
];

/**
 * Common self-care activities for quick selection
 */
export const COMMON_SELF_CARE_ACTIVITIES = [
  "Exercise",
  "Meditation",
  "Reading",
  "Walking",
  "Cooking",
  "Hobbies",
  "Time with friends",
  "Nature time",
  "Music",
  "Art/creativity",
  "Gaming",
  "Rest/nap",
];

/**
 * Communication templates for common messages
 */
export const COMMUNICATION_TEMPLATES = {
  progress_update: {
    subject: "Weekly Progress Update",
    template:
      "Hi! Here's a quick update on my job search this week:\n\n• Applications: {applications}\n• Interviews: {interviews}\n• Highlights: {highlights}\n\nThank you for your continued support!",
  },
  milestone_share: {
    subject: "Exciting News to Share! 🎉",
    template:
      "I wanted to share some exciting news with you:\n\n{milestone}\n\nYour support has meant so much to me throughout this journey!",
  },
  thank_you: {
    subject: "Thank You for Your Support",
    template:
      "I just wanted to take a moment to thank you for being there for me during my job search. Your {support_type} has really made a difference.\n\nI appreciate you!",
  },
  boundary_reminder: {
    subject: "A Gentle Reminder",
    template:
      "I appreciate your care and concern. I wanted to gently remind you about something that would help me during this time:\n\n{boundary}\n\nThank you for understanding! 💙",
  },
};
