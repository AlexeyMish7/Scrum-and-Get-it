/**
 * Peer Networking Type Definitions
 *
 * TypeScript interfaces mirroring the database schema for peer networking features.
 * Used across the team_management workspace for type safety.
 */

// ============================================================================
// ENUMS (matching database enum types)
// ============================================================================

export type PeerGroupType =
  | "industry"
  | "role"
  | "location"
  | "experience"
  | "general";

export type PeerGroupVisibility = "public" | "private" | "hidden";

export type ChallengeStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type DiscussionStatus = "active" | "hidden" | "flagged" | "archived";

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

/**
 * Peer group settings stored as JSONB
 */
export interface PeerGroupSettings {
  allow_anonymous_posts: boolean;
  require_approval_to_join: boolean;
  max_members: number | null;
  allow_referral_sharing: boolean;
  allow_success_stories: boolean;
}

/**
 * Peer group table row
 */
export interface PeerGroupRow {
  id: string;
  name: string;
  description: string | null;
  group_type: PeerGroupType;
  visibility: PeerGroupVisibility;
  industry: string | null;
  role_focus: string | null;
  location: string | null;
  experience_level: string | null;
  created_by: string;
  settings: PeerGroupSettings;
  member_count: number;
  discussion_count: number;
  active_challenges: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Member privacy settings stored as JSONB
 */
export interface MemberPrivacySettings {
  share_job_stats: boolean;
  share_success_stories: boolean;
  share_company_names: boolean;
  share_salary_info: boolean;
  receive_referral_alerts: boolean;
  receive_challenge_notifications: boolean;
}

/**
 * Peer group member table row
 */
export interface PeerGroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string | null;
  is_anonymous: boolean;
  privacy_settings: MemberPrivacySettings;
  posts_count: number;
  challenges_completed: number;
  referrals_shared: number;
  is_active: boolean;
  is_moderator: boolean;
  joined_at: string;
  last_active_at: string;
}

/**
 * Peer discussion table row
 */
export interface PeerDiscussionRow {
  id: string;
  group_id: string;
  author_id: string;
  parent_id: string | null;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  anonymous_display_name: string | null;
  category: string | null;
  tags: string[];
  likes_count: number;
  replies_count: number;
  views_count: number;
  status: DiscussionStatus;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Discussion like table row
 */
export interface PeerDiscussionLikeRow {
  id: string;
  discussion_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Challenge settings stored as JSONB
 */
export interface ChallengeSettings {
  allow_late_join: boolean;
  show_leaderboard: boolean;
  send_reminders: boolean;
  reminder_frequency_days: number;
}

/**
 * Group challenge table row
 */
export interface GroupChallengeRow {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  goal_type: string;
  goal_target: number;
  goal_timeframe_days: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  participant_count: number;
  completed_count: number;
  settings: ChallengeSettings;
  created_at: string;
  updated_at: string;
}

/**
 * Challenge participant table row
 */
export interface ChallengeParticipantRow {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  goal_met: boolean;
  goal_met_at: string | null;
  is_active: boolean;
  joined_at: string;
  last_updated_at: string;
}

/**
 * Peer referral table row
 */
export interface PeerReferralRow {
  id: string;
  group_id: string;
  shared_by: string;
  company_name: string;
  job_title: string;
  job_link: string | null;
  description: string | null;
  is_internal_referral: boolean;
  application_deadline: string | null;
  is_active: boolean;
  interested_count: number;
  created_at: string;
  expires_at: string | null;
}

/**
 * Success story table row
 */
export interface SuccessStoryRow {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  content: string;
  company_name: string | null;
  job_title: string | null;
  journey_days: number | null;
  applications_submitted: number | null;
  interviews_completed: number | null;
  key_learnings: string[] | null;
  tips_for_others: string | null;
  is_anonymous: boolean;
  share_company_name: boolean;
  likes_count: number;
  comments_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMPOSITE TYPES (with joined data)
// ============================================================================

/**
 * Profile info for display in member lists
 */
export interface MemberProfileInfo {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  professional_title: string | null;
}

/**
 * Peer group with creator profile info
 */
export interface PeerGroupWithCreator extends PeerGroupRow {
  creator?: MemberProfileInfo;
}

/**
 * Peer group member with profile info
 */
export interface PeerGroupMemberWithProfile extends PeerGroupMemberRow {
  profile?: MemberProfileInfo;
}

/**
 * Discussion with author profile info
 */
export interface PeerDiscussionWithAuthor extends PeerDiscussionRow {
  author?: MemberProfileInfo;
  has_liked?: boolean;
  replies?: PeerDiscussionWithAuthor[];
}

/**
 * Challenge with progress info
 */
export interface GroupChallengeWithProgress extends GroupChallengeRow {
  is_participant?: boolean;
  my_progress?: number;
  my_goal_met?: boolean;
}

/**
 * Success story with author profile
 */
export interface SuccessStoryWithAuthor extends SuccessStoryRow {
  author?: MemberProfileInfo;
  has_liked?: boolean;
}

// ============================================================================
// INPUT TYPES (for creating/updating)
// ============================================================================

/**
 * Data for creating a new peer group
 */
export interface CreatePeerGroupData {
  name: string;
  description?: string;
  group_type: PeerGroupType;
  visibility?: PeerGroupVisibility;
  industry?: string;
  role_focus?: string;
  location?: string;
  experience_level?: string;
  settings?: Partial<PeerGroupSettings>;
}

/**
 * Data for joining a peer group
 */
export interface JoinPeerGroupData {
  group_id: string;
  display_name?: string;
  is_anonymous?: boolean;
  privacy_settings?: Partial<MemberPrivacySettings>;
}

/**
 * Data for creating a discussion
 */
export interface CreateDiscussionData {
  group_id: string;
  title?: string;
  content: string;
  parent_id?: string;
  is_anonymous?: boolean;
  anonymous_display_name?: string;
  category?: string;
  tags?: string[];
}

/**
 * Data for creating a challenge
 */
export interface CreateChallengeData {
  group_id: string;
  title: string;
  description?: string;
  goal_type: string;
  goal_target: number;
  goal_timeframe_days: number;
  start_date: string;
  end_date: string;
  settings?: Partial<ChallengeSettings>;
}

/**
 * Data for sharing a referral
 */
export interface CreateReferralData {
  group_id: string;
  company_name: string;
  job_title: string;
  job_link?: string;
  description?: string;
  is_internal_referral?: boolean;
  application_deadline?: string;
}

/**
 * Data for sharing a success story
 */
export interface CreateSuccessStoryData {
  group_id: string;
  title: string;
  content: string;
  company_name?: string;
  job_title?: string;
  journey_days?: number;
  applications_submitted?: number;
  interviews_completed?: number;
  key_learnings?: string[];
  tips_for_others?: string;
  is_anonymous?: boolean;
  share_company_name?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * User's peer group info from get_user_peer_groups function
 */
export interface UserPeerGroupInfo {
  group_id: string;
  group_name: string;
  group_type: string;
  member_count: number;
  is_moderator: boolean;
  joined_at: string;
}

/**
 * Search results from search_peer_groups function
 */
export interface PeerGroupSearchResult {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  industry: string | null;
  role_focus: string | null;
  member_count: number;
  is_featured: boolean;
}

/**
 * Challenge leaderboard entry
 */
export interface ChallengeLeaderboardEntry {
  user_id: string;
  display_name: string;
  progress: number;
  goal_met: boolean;
  rank: number;
}
