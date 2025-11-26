/**
 * Team Management Type Definitions
 *
 * TypeScript interfaces mirroring the database schema for team management.
 * Used across the team_management workspace for type safety.
 */

// ============================================================================
// ENUMS (matching database enum types)
// ============================================================================

export type TeamRole = "admin" | "mentor" | "candidate";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export type SubscriptionTier =
  | "free"
  | "starter"
  | "professional"
  | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "trialing";

export type TeamActivityType =
  | "team_created"
  | "member_invited"
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "role_changed"
  | "permissions_updated"
  | "candidate_assigned"
  | "candidate_unassigned"
  | "settings_updated";

// ============================================================================
// DATABASE ROW TYPES (match table schemas exactly)
// ============================================================================

/**
 * Team table row
 * Represents a team account with metadata and stats
 */
export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  settings: TeamSettings;
  total_members: number;
  total_candidates: number;
  total_mentors: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Team member table row
 * Links users to teams with roles and permissions
 */
export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  is_active: boolean;
  custom_permissions: TeamPermissions;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Team invitation table row
 * Tracks pending and historical invitations
 */
export interface TeamInvitationRow {
  id: string;
  team_id: string;
  invited_by: string;
  invitee_email: string;
  invitee_user_id: string | null;
  role: TeamRole;
  message: string | null;
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Team member assignment table row
 * Links mentors to specific candidates
 */
export interface TeamMemberAssignmentRow {
  id: string;
  team_id: string;
  mentor_id: string;
  candidate_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Team activity log table row
 * Audit trail of team actions
 */
export interface TeamActivityLogRow {
  id: string;
  team_id: string;
  actor_id: string | null;
  activity_type: TeamActivityType;
  description: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Team message table row
 * Internal team communication
 */
export interface TeamMessageRow {
  id: string;
  team_id: string;
  sender_id: string;
  message_text: string;
  parent_message_id: string | null;
  mentioned_users: string[];
  attachments: MessageAttachment[];
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Subscription plan table row
 * System-level subscription tier definitions
 */
export interface SubscriptionPlanRow {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string | null;
  monthly_price_cents: number;
  annual_price_cents: number;
  limits: SubscriptionLimits;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Team subscription table row
 * Tracks team subscription status and billing
 */
export interface TeamSubscriptionRow {
  id: string;
  team_id: string;
  plan_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancelled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  usage_stats: UsageStats;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Team settings table row
 * Extended team configuration and branding
 */
export interface TeamSettingsRow {
  id: string;
  team_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
  email_settings: EmailSettings;
  feature_flags: FeatureFlags;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NESTED JSONB TYPES
// ============================================================================

/**
 * Team settings stored in teams.settings column
 */
export interface TeamSettings {
  allow_member_invites: boolean;
  require_admin_approval: boolean;
  auto_assign_candidates: boolean;
  notification_preferences: {
    member_joins: boolean;
    activity_updates: boolean;
    weekly_reports: boolean;
  };
}

/**
 * Custom permissions for team members
 * Can override default role permissions
 */
export interface TeamPermissions {
  can_view_all_candidates: boolean;
  can_edit_candidates: boolean;
  can_invite_members: boolean;
  can_remove_members: boolean;
  can_change_roles: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_manage_team_settings: boolean;
}

/**
 * Message attachment metadata
 */
export interface MessageAttachment {
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

/**
 * Subscription plan limits
 */
export interface SubscriptionLimits {
  max_team_members: number | null;
  max_candidates: number | null;
  max_mentors: number | null;
  max_storage_mb: number | null;
  max_ai_generations_per_month: number | null;
  analytics_retention_days: number | null;
  priority_support: boolean;
  custom_branding: boolean;
  api_access: boolean;
}

/**
 * Team subscription usage statistics
 */
export interface UsageStats {
  current_members: number;
  current_candidates: number;
  ai_generations_this_month: number;
  storage_used_mb: number;
}

/**
 * Email notification settings
 */
export interface EmailSettings {
  send_welcome_emails: boolean;
  send_invitation_reminders: boolean;
  weekly_digest_enabled: boolean;
  notification_email: string | null;
}

/**
 * Team feature flags
 */
export interface FeatureFlags {
  enable_messaging: boolean;
  enable_analytics: boolean;
  enable_reports: boolean;
  enable_candidate_assignment: boolean;
}

// ============================================================================
// ENRICHED TYPES (with joined data for UI)
// ============================================================================

/**
 * Team with member information
 * Used in team listings and dashboards
 */
export interface TeamWithMembers extends TeamRow {
  members: TeamMemberWithProfile[];
  subscription?: TeamSubscriptionRow;
  settings_extended?: TeamSettingsRow;
}

/**
 * Team member with user profile data
 * Used to display member information
 */
export interface TeamMemberWithProfile extends TeamMemberRow {
  profile: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    professional_title: string | null;
  };
}

/**
 * Team invitation with team and inviter info
 * Used on invitations page
 */
export interface TeamInvitationWithTeam extends TeamInvitationRow {
  team: {
    name: string;
    description: string | null;
  } | null;
  inviter: {
    full_name: string;
    email: string;
  } | null;
}

/**
 * Invitation with team and inviter details
 * Used in invitation displays
 */
export interface InvitationWithDetails extends TeamInvitationRow {
  team: {
    name: string;
    description: string | null;
  };
  inviter: {
    full_name: string;
    email: string;
  };
}

/**
 * Assignment with full user details
 * Used in mentor-candidate assignment views
 */
export interface AssignmentWithDetails extends TeamMemberAssignmentRow {
  mentor: {
    full_name: string | null;
    email: string | null;
  };
  candidate: {
    full_name: string | null;
    email: string | null;
  };
  team: {
    name: string;
  };
}

/**
 * Activity log with actor details
 * Used in activity feeds
 */
export interface ActivityWithDetails extends TeamActivityLogRow {
  actor: {
    full_name: string | null;
  } | null;
  target_user: {
    full_name: string | null;
  } | null;
}

// ============================================================================
// FORM DATA TYPES (for creating/updating records)
// ============================================================================

/**
 * Form data for creating a new team
 */
export interface CreateTeamData {
  name: string;
  description?: string;
}

/**
 * Form data for inviting a team member
 */
export interface InviteMemberData {
  invitee_email: string;
  role: TeamRole;
  message?: string;
}

/**
 * Form data for updating team settings
 */
export interface UpdateTeamSettingsData {
  name?: string;
  description?: string;
  settings?: Partial<TeamSettings>;
}

/**
 * Form data for updating member role
 */
export interface UpdateMemberRoleData {
  role: TeamRole;
  custom_permissions?: Partial<TeamPermissions>;
}

/**
 * Form data for assigning mentor to candidate
 */
export interface AssignMentorData {
  mentor_id: string;
  candidate_id: string;
  notes?: string;
}

/**
 * Form data for sending team message
 */
export interface SendMessageData {
  message_text: string;
  parent_message_id?: string;
  mentioned_users?: string[];
  attachments?: MessageAttachment[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface TeamApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    status: number | null;
  } | null;
}

/**
 * Response from get_user_teams function
 */
export interface UserTeamInfo {
  team_id: string;
  team_name: string;
  team_description: string | null;
  role: TeamRole;
  is_owner: boolean;
  member_count: number;
  joined_at: string;
}

/**
 * Response from get_assigned_candidates function
 */
export interface AssignedCandidateInfo {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  team_id: string;
  team_name: string;
  assigned_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Team member with permission check utilities
 */
export interface TeamMemberPermissions {
  role: TeamRole;
  custom_permissions: TeamPermissions;
  isAdmin: boolean;
  isMentor: boolean;
  isCandidate: boolean;
  can: (permission: keyof TeamPermissions) => boolean;
}

/**
 * Team context state
 * Used in TeamContext provider
 */
export interface TeamContextState {
  currentTeam: TeamWithMembers | null;
  userRole: TeamRole | null;
  userPermissions: TeamMemberPermissions | null;
  allTeams: UserTeamInfo[];
  loading: boolean;
  error: string | null;
}
