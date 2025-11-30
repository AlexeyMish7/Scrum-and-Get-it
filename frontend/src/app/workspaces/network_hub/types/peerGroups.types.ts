/**
 * Peer Groups Type Definitions
 *
 * TypeScript interfaces mirroring the database schema for peer networking
 * and support groups (UC-112). Used across the network_hub workspace.
 */

// ============================================================================
// ENUMS (matching database enum types)
// ============================================================================

export type PeerGroupCategory =
  | "technology"
  | "healthcare"
  | "finance"
  | "marketing"
  | "sales"
  | "engineering"
  | "design"
  | "data_science"
  | "product_management"
  | "human_resources"
  | "legal"
  | "education"
  | "consulting"
  | "entry_level"
  | "mid_career"
  | "senior_executive"
  | "career_transition"
  | "remote_work"
  | "freelance"
  | "general";

export type PeerMembershipStatus = "pending" | "active" | "suspended" | "left";

export type PeerPostType =
  | "discussion"
  | "question"
  | "insight"
  | "resource"
  | "celebration"
  | "advice_request";

export type PeerChallengeStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled";

export type ChallengeParticipantStatus =
  | "joined"
  | "in_progress"
  | "completed"
  | "failed"
  | "withdrawn";

export type PeerPrivacyLevel = "full_name" | "initials_only" | "anonymous";

export type PeerReferralStatus =
  | "shared"
  | "interested"
  | "applied"
  | "hired"
  | "expired";

export type GroupMemberRole = "owner" | "moderator" | "member";

export type ChallengeType =
  | "applications"
  | "networking"
  | "interviews"
  | "learning"
  | "custom";

// ============================================================================
// DATABASE ROW TYPES (match table schemas exactly)
// ============================================================================

/**
 * Peer group table row
 * Represents a support group organized by industry/role
 */
export interface PeerGroupRow {
  id: string;
  name: string;
  description: string | null;
  category: PeerGroupCategory;
  is_public: boolean;
  requires_approval: boolean;
  max_members: number | null;
  created_by: string;
  tags: string[];
  rules: string | null;
  welcome_message: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  member_count: number;
  post_count: number;
  active_challenge_count: number;
  has_coaching_sessions: boolean;
  coaching_schedule: CoachingSession[];
  upcoming_webinars: Webinar[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Peer group member table row
 * Links users to groups with roles and privacy settings
 */
export interface PeerGroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  status: PeerMembershipStatus;
  role: GroupMemberRole;
  privacy_level: PeerPrivacyLevel;
  show_activity: boolean;
  notifications_enabled: boolean;
  notification_preferences: NotificationPreferences;
  posts_count: number;
  challenges_completed: number;
  referrals_shared: number;
  joined_at: string;
  last_active_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Peer group post table row
 * Discussions, insights, and shared strategies
 */
export interface PeerGroupPostRow {
  id: string;
  group_id: string;
  author_id: string;
  post_type: PeerPostType;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  parent_post_id: string | null;
  reply_count: number;
  like_count: number;
  attachments: PostAttachment[];
  is_pinned: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Post like table row
 */
export interface PeerPostLikeRow {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Peer group challenge table row
 * Accountability programs and group challenges
 */
export interface PeerGroupChallengeRow {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  status: PeerChallengeStatus;
  participant_count: number;
  completion_count: number;
  badge_name: string | null;
  badge_icon: string | null;
  celebration_message: string | null;
  rules: string | null;
  verification_required: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Challenge participant table row
 * Tracks individual progress in challenges
 */
export interface ChallengeParticipantRow {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ChallengeParticipantStatus;
  current_value: number;
  progress_history: ProgressEntry[];
  completed_at: string | null;
  joined_at: string;
  last_updated_at: string | null;
}

/**
 * Peer success story table row
 * Shared success stories and learning opportunities
 */
export interface PeerSuccessStoryRow {
  id: string;
  author_id: string;
  group_id: string | null;
  title: string;
  story_content: string;
  is_anonymous: boolean;
  industry: string | null;
  role_type: string | null;
  job_search_duration_weeks: number | null;
  key_learnings: string[];
  advice_for_others: string | null;
  helpful_factors: HelpfulFactors;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Peer referral table row
 * Job opportunity sharing within groups
 */
export interface PeerReferralRow {
  id: string;
  shared_by: string;
  group_id: string;
  job_title: string;
  company_name: string;
  job_description: string | null;
  job_link: string | null;
  location: string | null;
  salary_range: string | null;
  is_internal_referral: boolean;
  referral_notes: string | null;
  application_deadline: string | null;
  status: PeerReferralStatus;
  views_count: number;
  interested_count: number;
  applied_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Referral interest table row
 */
export interface PeerReferralInterestRow {
  id: string;
  referral_id: string;
  user_id: string;
  status: "interested" | "applied" | "hired";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Peer networking impact table row
 * Tracks the value/impact of peer networking on job search
 */
export interface PeerNetworkingImpactRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  groups_joined: number;
  posts_created: number;
  replies_given: number;
  challenges_participated: number;
  challenges_completed: number;
  referrals_shared: number;
  referrals_received: number;
  connections_made: number;
  interviews_from_peers: number;
  offers_from_peers: number;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

/**
 * User peer settings table row
 * Global privacy and notification settings
 */
export interface UserPeerSettingsRow {
  id: string;
  user_id: string;
  default_privacy_level: PeerPrivacyLevel;
  show_group_memberships: boolean;
  show_challenge_progress: boolean;
  show_success_stories: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  allow_group_invites: boolean;
  discoverable_in_groups: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NESTED JSONB TYPES
// ============================================================================

/**
 * Coaching session in group schedule
 */
export interface CoachingSession {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  host_name?: string;
  meeting_link?: string;
}

/**
 * Upcoming webinar in group
 */
export interface Webinar {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  presenter?: string;
  registration_link?: string;
}

/**
 * Notification preferences for group membership
 */
export interface NotificationPreferences {
  new_posts: boolean;
  replies_to_my_posts: boolean;
  challenge_updates: boolean;
  referrals: boolean;
  coaching_sessions: boolean;
}

/**
 * Post attachment metadata
 */
export interface PostAttachment {
  filename: string;
  url: string;
  file_size?: number;
  mime_type?: string;
}

/**
 * Progress entry for challenge tracking
 */
export interface ProgressEntry {
  date: string;
  value: number;
  note?: string;
}

/**
 * What helped most in success story
 */
export interface HelpfulFactors {
  peer_support: boolean;
  group_challenges: boolean;
  referrals: boolean;
  networking: boolean;
  resume_help: boolean;
  interview_prep: boolean;
}

// ============================================================================
// ENRICHED TYPES (with joined data for UI)
// ============================================================================

/**
 * Peer group with membership info
 * Used in group listings showing user's membership status
 */
export interface PeerGroupWithMembership extends PeerGroupRow {
  membership?: PeerGroupMemberRow | null;
  is_member: boolean;
}

/**
 * Group member with user profile data
 * Used to display member information
 */
export interface PeerGroupMemberWithProfile extends PeerGroupMemberRow {
  profile: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    professional_title: string | null;
    avatar_url?: string | null;
  };
}

/**
 * Post with author info (respecting privacy)
 * Used to display posts in discussions
 */
export interface PeerPostWithAuthor extends PeerGroupPostRow {
  author: {
    display_name: string;
    avatar_url: string | null;
    professional_title: string | null;
  } | null;
  replies?: PeerPostWithAuthor[];
  is_liked_by_user?: boolean;
}

/**
 * Challenge with participant info
 * Used in challenge listings
 */
export interface ChallengeWithParticipation extends PeerGroupChallengeRow {
  participation?: ChallengeParticipantRow | null;
  is_participating: boolean;
  top_participants?: ChallengeLeaderboardEntry[];
}

/**
 * Leaderboard entry for challenges
 */
export interface ChallengeLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_value: number;
  rank: number;
}

/**
 * Success story with author (respecting privacy)
 * Used to display stories
 */
export interface SuccessStoryWithAuthor extends PeerSuccessStoryRow {
  author: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Referral with sharer info
 * Used to display referrals
 */
export interface PeerReferralWithSharer extends PeerReferralRow {
  sharer: {
    display_name: string;
    avatar_url: string | null;
  };
  user_interest?: PeerReferralInterestRow | null;
}

// ============================================================================
// FORM DATA TYPES (for creating/updating records)
// ============================================================================

/**
 * Form data for creating a new peer group
 */
export interface CreatePeerGroupData {
  name: string;
  description?: string;
  category: PeerGroupCategory;
  is_public?: boolean;
  requires_approval?: boolean;
  max_members?: number;
  tags?: string[];
  rules?: string;
  welcome_message?: string;
}

/**
 * Form data for joining a group
 */
export interface JoinGroupData {
  group_id: string;
  privacy_level?: PeerPrivacyLevel;
}

/**
 * Form data for creating a post
 */
export interface CreatePostData {
  group_id: string;
  post_type: PeerPostType;
  title?: string;
  content: string;
  is_anonymous?: boolean;
  parent_post_id?: string;
  attachments?: PostAttachment[];
}

/**
 * Form data for creating a challenge
 */
export interface CreateChallengeData {
  group_id: string;
  title: string;
  description?: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit?: string;
  start_date: string;
  end_date: string;
  badge_name?: string;
  badge_icon?: string;
  celebration_message?: string;
  rules?: string;
}

/**
 * Form data for updating challenge progress
 */
export interface UpdateProgressData {
  challenge_id: string;
  value: number;
  note?: string;
}

/**
 * Form data for sharing a success story
 */
export interface CreateSuccessStoryData {
  group_id?: string;
  title: string;
  story_content: string;
  is_anonymous?: boolean;
  industry?: string;
  role_type?: string;
  job_search_duration_weeks?: number;
  key_learnings?: string[];
  advice_for_others?: string;
  helpful_factors?: Partial<HelpfulFactors>;
}

/**
 * Form data for sharing a referral
 */
export interface CreateReferralData {
  group_id: string;
  job_title: string;
  company_name: string;
  job_description?: string;
  job_link?: string;
  location?: string;
  salary_range?: string;
  is_internal_referral?: boolean;
  referral_notes?: string;
  application_deadline?: string;
}

/**
 * Form data for updating privacy settings
 */
export interface UpdatePrivacySettingsData {
  default_privacy_level?: PeerPrivacyLevel;
  show_group_memberships?: boolean;
  show_challenge_progress?: boolean;
  show_success_stories?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  allow_group_invites?: boolean;
  discoverable_in_groups?: boolean;
}

/**
 * Form data for updating group membership settings
 */
export interface UpdateMembershipData {
  privacy_level?: PeerPrivacyLevel;
  show_activity?: boolean;
  notifications_enabled?: boolean;
  notification_preferences?: Partial<NotificationPreferences>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface PeerApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    status: number | null;
  } | null;
}

/**
 * Paginated response for lists
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/**
 * Impact summary for analytics
 */
export interface ImpactSummary {
  total_groups: number;
  total_posts: number;
  total_replies: number;
  challenges_completed: number;
  referrals_shared: number;
  referrals_received: number;
  interviews_from_peers: number;
  offers_from_peers: number;
  overall_impact_score: number;
  trend: "up" | "down" | "stable";
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filter options for group discovery
 */
export interface GroupFilters {
  category?: PeerGroupCategory;
  search?: string;
  is_public?: boolean;
  has_coaching?: boolean;
  min_members?: number;
  max_members?: number;
}

/**
 * Filter options for posts
 */
export interface PostFilters {
  post_type?: PeerPostType;
  author_id?: string;
  is_pinned?: boolean;
  search?: string;
}

/**
 * Filter options for challenges
 */
export interface ChallengeFilters {
  status?: PeerChallengeStatus;
  challenge_type?: ChallengeType;
  participating_only?: boolean;
}

/**
 * Filter options for success stories
 */
export interface SuccessStoryFilters {
  industry?: string;
  role_type?: string;
  is_featured?: boolean;
  group_id?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Category display info for UI
 */
export interface CategoryInfo {
  value: PeerGroupCategory;
  label: string;
  icon: string;
  description: string;
  color: string; // Hex color for UI theming
}

/**
 * Map of categories to display info
 */
export const CATEGORY_INFO: Record<PeerGroupCategory, CategoryInfo> = {
  technology: {
    value: "technology",
    label: "Technology",
    icon: "💻",
    description: "Software, IT, and tech roles",
    color: "#2196F3",
  },
  healthcare: {
    value: "healthcare",
    label: "Healthcare",
    icon: "🏥",
    description: "Medical and healthcare professionals",
    color: "#4CAF50",
  },
  finance: {
    value: "finance",
    label: "Finance",
    icon: "💰",
    description: "Banking, investment, and financial roles",
    color: "#FF9800",
  },
  marketing: {
    value: "marketing",
    label: "Marketing",
    icon: "📢",
    description: "Marketing and advertising professionals",
    color: "#E91E63",
  },
  sales: {
    value: "sales",
    label: "Sales",
    icon: "🤝",
    description: "Sales and business development",
    color: "#9C27B0",
  },
  engineering: {
    value: "engineering",
    label: "Engineering",
    icon: "⚙️",
    description: "Engineering disciplines",
    color: "#607D8B",
  },
  design: {
    value: "design",
    label: "Design",
    icon: "🎨",
    description: "UX, UI, and creative design",
    color: "#FF5722",
  },
  data_science: {
    value: "data_science",
    label: "Data Science",
    icon: "📊",
    description: "Data, analytics, and ML roles",
    color: "#00BCD4",
  },
  product_management: {
    value: "product_management",
    label: "Product Management",
    icon: "📋",
    description: "Product and program managers",
    color: "#3F51B5",
  },
  human_resources: {
    value: "human_resources",
    label: "Human Resources",
    icon: "👥",
    description: "HR and people operations",
    color: "#795548",
  },
  legal: {
    value: "legal",
    label: "Legal",
    icon: "⚖️",
    description: "Legal and compliance roles",
    color: "#455A64",
  },
  education: {
    value: "education",
    label: "Education",
    icon: "📚",
    description: "Teachers and educators",
    color: "#8BC34A",
  },
  consulting: {
    value: "consulting",
    label: "Consulting",
    icon: "💼",
    description: "Consultants and advisors",
    color: "#673AB7",
  },
  entry_level: {
    value: "entry_level",
    label: "Entry Level",
    icon: "🌱",
    description: "New grads and career starters",
    color: "#4CAF50",
  },
  mid_career: {
    value: "mid_career",
    label: "Mid-Career",
    icon: "📈",
    description: "Mid-level professionals",
    color: "#2196F3",
  },
  senior_executive: {
    value: "senior_executive",
    label: "Senior & Executive",
    icon: "🎯",
    description: "Senior and executive roles",
    color: "#F44336",
  },
  career_transition: {
    value: "career_transition",
    label: "Career Transition",
    icon: "🔄",
    description: "Career changers and pivoters",
    color: "#00ACC1",
  },
  remote_work: {
    value: "remote_work",
    label: "Remote Work",
    icon: "🏠",
    description: "Remote and distributed roles",
    color: "#9575CD",
  },
  freelance: {
    value: "freelance",
    label: "Freelance",
    icon: "✨",
    description: "Freelancers and contractors",
    color: "#FFB300",
  },
  general: {
    value: "general",
    label: "General",
    icon: "🌐",
    description: "General job search support",
    color: "#78909C",
  },
};

/**
 * Challenge type display info
 */
export const CHALLENGE_TYPE_INFO: Record<
  ChallengeType,
  { label: string; icon: string; unit: string }
> = {
  applications: {
    label: "Job Applications",
    icon: "📝",
    unit: "applications",
  },
  networking: { label: "Networking", icon: "🤝", unit: "connections" },
  interviews: { label: "Interviews", icon: "🎤", unit: "interviews" },
  learning: { label: "Learning", icon: "📚", unit: "hours" },
  custom: { label: "Custom", icon: "🎯", unit: "count" },
};

/**
 * Post type display info
 */
export const POST_TYPE_INFO: Record<
  PeerPostType,
  { label: string; icon: string }
> = {
  discussion: { label: "Discussion", icon: "💬" },
  question: { label: "Question", icon: "❓" },
  insight: { label: "Insight", icon: "💡" },
  resource: { label: "Resource", icon: "📎" },
  celebration: { label: "Celebration", icon: "🎉" },
  advice_request: { label: "Advice Request", icon: "🙋" },
};
