/**
 * TEAM MANAGEMENT SERVICE
 *
 * Handles all database operations for team management using direct Supabase access.
 * Uses withUser() CRUD wrapper for user-scoped operations and RLS enforcement.
 *
 * Architecture:
 * - Direct Supabase client (no server API needed for CRUD)
 * - Row Level Security (RLS) enforces permissions at database level
 * - Helper functions call database functions for complex operations
 *
 * Security:
 * - All operations scoped by authenticated user
 * - RLS policies prevent unauthorized access
 * - Admin checks handled by database functions and policies
 */

import { supabase } from "@shared/services/supabaseClient";
import {
  withUser,
  insertRow,
  getRow,
  updateRow,
  listRows,
} from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type {
  TeamRow,
  TeamMemberRow,
  TeamInvitationRow,
  TeamMemberAssignmentRow,
  TeamActivityLogRow,
  TeamWithMembers,
  TeamMemberWithProfile,
  TeamInvitationWithTeam,
  InvitationWithDetails,
  UserTeamInfo,
  AssignedCandidateInfo,
  CreateTeamData,
  InviteMemberData,
  UpdateTeamSettingsData,
  UpdateMemberRoleData,
  AssignMentorData,
  TeamRole,
} from "../types";

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

/**
 * Create a new team
 * User who creates the team automatically becomes the owner and first admin member
 */
export async function createTeam(
  userId: string,
  data: CreateTeamData
): Promise<Result<TeamRow>> {
  // Don't use withUser for teams table - it doesn't have user_id column
  // Teams table uses owner_id instead
  const teamResult = await insertRow<TeamRow>("teams", {
    name: data.name,
    description: data.description || null,
    owner_id: userId,
  });

  if (teamResult.error) {
    return { data: null, error: teamResult.error, status: teamResult.status };
  }

  const team = teamResult.data as TeamRow;

  // Add creator as admin member (team_members does NOT have user_id column either)
  // Instead, directly insert without withUser wrapper
  const memberResult = await insertRow<TeamMemberRow>("team_members", {
    team_id: team.id,
    user_id: userId,
    role: "admin" as TeamRole,
    invited_by: null,
    joined_at: new Date().toISOString(),
  });

  if (memberResult.error) {
    // If member creation fails, we should clean up the team
    // But for now, just log it
    console.error("Failed to create team member:", memberResult.error);
  }

  // Log activity
  await logTeamActivity(
    team.id,
    userId,
    "team_created",
    `${data.name} team created`
  );

  return { data: team, error: null, status: 201 };
}

/**
 * Get a specific team by ID
 * Includes member list with profile information
 */
export async function getTeam(
  _userId: string,
  teamId: string
): Promise<Result<TeamWithMembers>> {
  // Don't use withUser for teams table - it has owner_id, not user_id
  // Use direct getRow instead
  const teamResult = await getRow<TeamRow>("teams", "*", {
    eq: { id: teamId },
    single: true,
  });

  if (teamResult.error) {
    return {
      data: null,
      error: teamResult.error,
      status: teamResult.status,
    };
  }

  const team = teamResult.data as TeamRow;

  // Get team members with profiles
  // Use explicit FK reference (!user_id) since team_members has multiple FKs to profiles
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select(
      `
      *,
      profile:profiles!user_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("team_id", teamId)
    .eq("is_active", true);

  if (membersError) {
    return {
      data: null,
      error: { message: membersError.message, status: null },
      status: null,
    };
  }

  type MemberRowWithProfile = TeamMemberRow & {
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
      ...team,
      members: (members as MemberRowWithProfile[]).map((m) => ({
        ...m,
        profile: m.profile || {
          full_name: "Unknown User",
          first_name: null,
          last_name: null,
          email: "",
          professional_title: null,
        },
      })) as TeamMemberWithProfile[],
    },
    error: null,
    status: 200,
  };
}

/**
 * Get all teams user is a member of
 * Uses database function for optimized query
 */
export async function getUserTeams(
  userId: string
): Promise<Result<UserTeamInfo[]>> {
  const { data, error } = await supabase.rpc("get_user_teams", {
    p_user_id: userId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as UserTeamInfo[], error: null, status: 200 };
}

/**
 * Update team settings
 * Only admins can update team settings (enforced by RLS)
 */
export async function updateTeam(
  userId: string,
  teamId: string,
  data: UpdateTeamSettingsData
): Promise<Result<TeamRow>> {
  // Don't use withUser for teams table - it has owner_id, not user_id
  const result = await updateRow<TeamRow>(
    "teams",
    {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.settings && { settings: data.settings }),
    },
    { eq: { id: teamId, owner_id: userId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  // Log activity
  if (data.name || data.description || data.settings) {
    await logTeamActivity(
      teamId,
      userId,
      "settings_updated",
      "Team settings updated"
    );
  }

  return result as Result<TeamRow>;
}

/**
 * Delete a team (soft delete by setting is_active = false)
 * Only team owner can delete (enforced by RLS)
 */
export async function deleteTeam(
  userId: string,
  teamId: string
): Promise<Result<boolean>> {
  // Don't use withUser for teams table - it has owner_id, not user_id
  const result = await updateRow(
    "teams",
    { is_active: false },
    { eq: { id: teamId, owner_id: userId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// TEAM MEMBER OPERATIONS
// ============================================================================

/**
 * Get all members of a team
 * Includes profile information for each member
 */
export async function getTeamMembers(
  userId: string,
  teamId: string
): Promise<Result<TeamMemberWithProfile[]>> {
  // Check user has access to this team (RLS will also enforce this)
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("team_members", "id", {
    eq: { team_id: teamId, user_id: userId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  // Get members with profiles
  // Use explicit FK reference (!user_id) since team_members has multiple FKs to profiles
  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      *,
      profile:profiles!user_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type MemberRowWithProfile = TeamMemberRow & {
    profile?: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      professional_title: string | null;
    };
  };

  return {
    data: (data as MemberRowWithProfile[]).map((m) => ({
      ...m,
      profile: m.profile || {
        full_name: "Unknown User",
        first_name: null,
        last_name: null,
        email: "",
        professional_title: null,
      },
    })) as TeamMemberWithProfile[],
    error: null,
    status: 200,
  };
}

/**
 * Update a team member's role
 * Only admins can change roles (enforced by RLS)
 * Cannot demote the last admin (enforced by database constraint)
 */
export async function updateMemberRole(
  userId: string,
  memberId: string,
  data: UpdateMemberRoleData
): Promise<Result<TeamMemberRow>> {
  const userCrud = withUser(userId);

  const result = await userCrud.updateRow(
    "team_members",
    {
      role: data.role,
      ...(data.custom_permissions && {
        custom_permissions: data.custom_permissions,
      }),
    },
    { eq: { id: memberId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  const member = result.data as TeamMemberRow;

  // Log activity
  await logTeamActivity(
    member.team_id,
    userId,
    "role_changed",
    `Member role changed to ${data.role}`,
    member.user_id
  );

  return { data: member, error: null, status: 200 };
}

/**
 * Remove a member from the team (soft delete)
 * Only admins can remove members (enforced by RLS)
 * Cannot remove the last admin (enforced by database)
 */
export async function removeMember(
  userId: string,
  memberId: string
): Promise<Result<boolean>> {
  const userCrud = withUser(userId);

  // Get member info before deletion for activity log
  const memberResult = await userCrud.getRow("team_members", "*", {
    eq: { id: memberId },
    single: true,
  });

  if (memberResult.error) {
    return {
      data: null,
      error: memberResult.error,
      status: memberResult.status,
    };
  }

  const member = memberResult.data as TeamMemberRow;

  // Soft delete (set is_active = false)
  const result = await userCrud.updateRow(
    "team_members",
    { is_active: false },
    { eq: { id: memberId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  // Log activity
  await logTeamActivity(
    member.team_id,
    userId,
    "member_removed",
    "Member removed from team",
    member.user_id
  );

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// INVITATION OPERATIONS
// ============================================================================

/**
 * Check if a user exists by email
 * Used to warn admins when inviting someone without an account
 */
export async function checkUserExistsByEmail(
  email: string
): Promise<
  Result<{ exists: boolean; profile?: { full_name: string | null } }>
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  if (!data) {
    return {
      data: { exists: false },
      error: null,
      status: 200,
    };
  }

  // Build display name from available fields
  const displayName =
    data.full_name ||
    `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
    null;

  return {
    data: { exists: true, profile: { full_name: displayName } },
    error: null,
    status: 200,
  };
}

/**
 * Invite a new member to the team
 * Only admins can invite (enforced by RLS)
 * Generates a secure random invitation token
 */
export async function inviteMember(
  userId: string,
  teamId: string,
  data: InviteMemberData
): Promise<Result<TeamInvitationRow>> {
  // Don't use withUser for team_invitations - it has invited_by, not user_id
  // Generate secure random token
  const token = generateInvitationToken();

  const result = await insertRow<TeamInvitationRow>("team_invitations", {
    team_id: teamId,
    invited_by: userId,
    invitee_email: data.invitee_email,
    role: data.role,
    message: data.message || null,
    invitation_token: token,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  });

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  const invitation = result.data as TeamInvitationRow;

  // Log activity
  await logTeamActivity(
    teamId,
    userId,
    "member_invited",
    `Invited ${data.invitee_email} as ${data.role}`
  );

  return { data: invitation, error: null, status: 201 };
}

/**
 * Accept a team invitation
 * Creates team_member record and marks invitation as accepted
 */
export async function acceptInvitation(
  userId: string,
  invitationId: string
): Promise<Result<TeamMemberRow>> {
  // Don't use withUser for team_invitations - it doesn't have user_id column
  // Get invitation details by ID using raw getRow
  const invResult = await getRow<TeamInvitationRow>("team_invitations", "*", {
    eq: { id: invitationId, status: "pending" },
    single: true,
  });

  if (invResult.error || !invResult.data) {
    console.error(
      "[acceptInvitation] Failed to get invitation:",
      invResult.error
    );
    return {
      data: null,
      error: { message: "Invalid or expired invitation", status: 404 },
      status: 404,
    };
  }

  const invitation = invResult.data;

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return {
      data: null,
      error: { message: "Invitation has expired", status: 400 },
      status: 400,
    };
  }

  // Check if user is already a member of this team
  const existingMember = await getRow<TeamMemberRow>("team_members", "*", {
    eq: { team_id: invitation.team_id, user_id: userId },
    single: true,
  });

  if (existingMember.data) {
    // User is already a member - just update invitation status and return
    await updateRow(
      "team_invitations",
      {
        status: "accepted",
        accepted_at: new Date().toISOString(),
        invitee_user_id: userId,
      },
      { eq: { id: invitation.id } }
    );

    return {
      data: existingMember.data,
      error: null,
      status: 200,
    };
  }

  // Create team member record using direct insert (not withUser)
  // The RLS policy allows: user_id = auth.uid()
  // So we insert with user_id matching the authenticated user
  const { data: memberData, error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: invitation.team_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      joined_at: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (memberError) {
    console.error(
      "[acceptInvitation] Failed to create team member:",
      memberError
    );
    return {
      data: null,
      error: { message: memberError.message, status: null },
      status: null,
    };
  }

  // Update invitation status using raw updateRow (team_invitations has no user_id)
  await updateRow(
    "team_invitations",
    {
      status: "accepted",
      accepted_at: new Date().toISOString(),
      invitee_user_id: userId,
    },
    { eq: { id: invitation.id } }
  );

  // Log activity
  await logTeamActivity(
    invitation.team_id,
    userId,
    "member_joined",
    "Accepted invitation and joined team"
  );

  return {
    data: memberData as TeamMemberRow,
    error: null,
    status: 200,
  };
}

/**
 * Get user's pending invitations (by email)
 * Used on invitations page to see teams user was invited to
 */
export async function getUserInvitations(): Promise<
  Result<TeamInvitationWithTeam[]>
> {
  // Get user's email from auth
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    return {
      data: null,
      error: { message: "User not found", status: 404 },
      status: 404,
    };
  }

  const { data, error } = await supabase
    .from("team_invitations")
    .select(
      `
      *,
      team:teams!team_id(id, name, description),
      inviter:profiles!invited_by(id, first_name, last_name, full_name, email)
    `
    )
    .eq("invitee_email", userData.user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type InviterProfile = {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string;
  };

  type InvitationRowWithJoins = TeamInvitationRow & {
    team?: { id?: string; name: string; description: string | null } | null;
    inviter?: InviterProfile | null;
  };

  // Helper to build display name from profile fields
  const getDisplayName = (
    inviter: InviterProfile | null | undefined
  ): string => {
    if (!inviter) return "Unknown User";
    if (inviter.full_name) return inviter.full_name;
    if (inviter.first_name || inviter.last_name) {
      return `${inviter.first_name || ""} ${inviter.last_name || ""}`.trim();
    }
    if (inviter.email) return inviter.email.split("@")[0];
    return "Unknown User";
  };

  return {
    data: (data as InvitationRowWithJoins[]).map((inv) => ({
      ...inv,
      team: inv.team || { name: "Unknown Team", description: null },
      inviter: {
        full_name: getDisplayName(inv.inviter),
        email: inv.inviter?.email || "",
      },
    })) as TeamInvitationWithTeam[],
    error: null,
    status: 200,
  };
}

/**
 * Decline a team invitation
 * User declines invitation sent to their email
 */
export async function declineInvitation(
  _userId: string,
  invitationId: string
): Promise<Result<void>> {
  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);

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
 * Get invitations for a team (admin view)
 * Supports filtering by status or getting all
 * Only admins can view invitations (enforced by RLS)
 */
export async function getTeamInvitations(
  _userId: string,
  teamId: string,
  options?: { status?: "pending" | "all" }
): Promise<Result<InvitationWithDetails[]>> {
  let query = supabase
    .from("team_invitations")
    .select(
      `
      *,
      team:teams!team_id(id, name, description),
      inviter:profiles!invited_by(id, first_name, last_name, full_name, email)
    `
    )
    .eq("team_id", teamId);

  // Filter by status unless requesting all
  if (options?.status !== "all") {
    query = query.eq("status", "pending");
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type InviterProfile = {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string;
  };

  type InvitationRowWithJoins = TeamInvitationRow & {
    team?: { id?: string; name: string; description: string | null } | null;
    inviter?: InviterProfile | null;
  };

  // Helper to build display name from profile fields
  const getDisplayName = (
    inviter: InviterProfile | null | undefined
  ): string => {
    if (!inviter) return "Unknown User";
    if (inviter.full_name) return inviter.full_name;
    if (inviter.first_name || inviter.last_name) {
      return `${inviter.first_name || ""} ${inviter.last_name || ""}`.trim();
    }
    if (inviter.email) return inviter.email.split("@")[0];
    return "Unknown User";
  };

  return {
    data: (data as InvitationRowWithJoins[]).map((inv) => ({
      ...inv,
      team: inv.team || { name: "Unknown Team", description: null },
      inviter: {
        full_name: getDisplayName(inv.inviter),
        email: inv.inviter?.email || "",
      },
    })) as InvitationWithDetails[],
    error: null,
    status: 200,
  };
}

/**
 * Cancel a pending invitation
 * Only the inviter or admin can cancel (enforced by RLS)
 */
export async function cancelInvitation(
  _userId: string,
  invitationId: string
): Promise<Result<boolean>> {
  // Don't use withUser for team_invitations - it doesn't have user_id column
  const result = await updateRow(
    "team_invitations",
    { status: "cancelled" },
    { eq: { id: invitationId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// MENTOR-CANDIDATE ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Assign a mentor to a candidate
 * Only admins can create assignments (enforced by RLS)
 */
export async function assignMentor(
  userId: string,
  teamId: string,
  data: AssignMentorData
): Promise<Result<TeamMemberAssignmentRow>> {
  // Don't use withUser for team_member_assignments - it has assigned_by, not user_id
  const result = await insertRow<TeamMemberAssignmentRow>(
    "team_member_assignments",
    {
      team_id: teamId,
      mentor_id: data.mentor_id,
      candidate_id: data.candidate_id,
      assigned_by: userId,
      assigned_at: new Date().toISOString(),
      notes: data.notes || null,
    }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  // Log activity
  await logTeamActivity(
    teamId,
    userId,
    "candidate_assigned",
    "Mentor assigned to candidate",
    data.candidate_id
  );

  return {
    data: result.data as TeamMemberAssignmentRow,
    error: null,
    status: 201,
  };
}

/**
 * Get candidates assigned to a mentor
 * Uses database function for optimized query
 */
export async function getAssignedCandidates(
  userId: string,
  teamId?: string
): Promise<Result<AssignedCandidateInfo[]>> {
  const { data, error } = await supabase.rpc("get_assigned_candidates", {
    p_mentor_id: userId,
    p_team_id: teamId || null,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as AssignedCandidateInfo[], error: null, status: 200 };
}

/**
 * Remove a mentor-candidate assignment
 * Only admins can remove assignments (enforced by RLS)
 */
export async function removeAssignment(
  userId: string,
  assignmentId: string
): Promise<Result<boolean>> {
  // Don't use withUser for team_member_assignments - it doesn't have user_id column
  // Get assignment info before deletion
  const assignmentResult = await getRow<TeamMemberAssignmentRow>(
    "team_member_assignments",
    "*",
    {
      eq: { id: assignmentId },
      single: true,
    }
  );

  if (assignmentResult.error || !assignmentResult.data) {
    return {
      data: null,
      error: assignmentResult.error || {
        message: "Assignment not found",
        status: 404,
      },
      status: assignmentResult.status || 404,
    };
  }

  const assignment = assignmentResult.data;

  // Soft delete using raw updateRow
  const result = await updateRow(
    "team_member_assignments",
    { is_active: false },
    { eq: { id: assignmentId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  // Log activity
  await logTeamActivity(
    assignment.team_id,
    userId,
    "candidate_unassigned",
    "Mentor-candidate assignment removed",
    assignment.candidate_id
  );

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// ACTIVITY LOG OPERATIONS
// ============================================================================

/**
 * Get recent activity for a team
 * Returns activity log with actor and target user details
 */
export async function getTeamActivity(
  userId: string,
  teamId: string,
  limit: number = 50
): Promise<Result<TeamActivityLogRow[]>> {
  // Verify user has access to this team (team_members DOES have user_id)
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("team_members", "id", {
    eq: { team_id: teamId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  // Don't use withUser for team_activity_log - it doesn't have user_id column
  const result = await listRows<TeamActivityLogRow>("team_activity_log", "*", {
    eq: { team_id: teamId },
    order: { column: "created_at", ascending: false },
    limit,
  });

  return result;
}

/**
 * Log a team activity (internal helper)
 * Used by other service functions to track actions
 */
async function logTeamActivity(
  teamId: string,
  actorId: string,
  activityType: string,
  description: string,
  targetUserId?: string
): Promise<void> {
  try {
    await supabase.from("team_activity_log").insert({
      team_id: teamId,
      actor_id: actorId,
      activity_type: activityType,
      description,
      target_user_id: targetUserId || null,
      metadata: {},
    });
  } catch (err) {
    // Silently fail - activity logging shouldn't break main operations
    console.error("Failed to log team activity:", err);
  }
}

// ============================================================================
// TEAM ANALYTICS AND INSIGHTS
// ============================================================================

/**
 * Get aggregate team progress insights
 * Shows total applications, interviews, offers for all team members
 * Note: Due to RLS, this may only show data for the current user's jobs
 */
export async function getTeamInsights(
  userId: string,
  teamId: string
): Promise<
  Result<{
    totalMembers: number;
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    memberActivity: Array<{
      userId: string;
      name: string;
      applications: number;
      interviews: number;
      offers: number;
    }>;
  }>
> {
  // Get team members
  const membersResult = await getTeamMembers(userId, teamId);
  if (membersResult.error) {
    return {
      data: null,
      error: membersResult.error,
      status: membersResult.status,
    };
  }

  const members = membersResult.data || [];

  // Note: Due to RLS on the jobs table, we can only see the current user's jobs
  // For team-wide insights, we would need a security definer function
  // For now, we'll just show data for the current user or return zeros for others
  const { data: jobs, error: jobError } = await supabase
    .from("jobs")
    .select("user_id, job_status")
    .eq("user_id", userId);

  // If query fails, just return empty data instead of erroring
  // This allows the dashboard to still load
  const userJobs = jobError ? [] : jobs || [];

  // Calculate metrics for current user only (RLS limitation)
  const memberActivity = members.map((member) => {
    // Only the current user's jobs are visible due to RLS
    const isCurrentUser = member.user_id === userId;
    const memberJobs = isCurrentUser ? userJobs : [];

    const applications = memberJobs.length;
    const interviews = memberJobs.filter(
      (job) =>
        job.job_status === "Interview" || job.job_status === "Phone Screen"
    ).length;
    const offers = memberJobs.filter(
      (job) => job.job_status === "Offer" || job.job_status === "Accepted"
    ).length;

    return {
      userId: member.user_id,
      name: member.profile?.full_name || "Unknown",
      applications,
      interviews,
      offers,
    };
  });

  const totalApplications = memberActivity.reduce(
    (sum, m) => sum + m.applications,
    0
  );
  const totalInterviews = memberActivity.reduce(
    (sum, m) => sum + m.interviews,
    0
  );
  const totalOffers = memberActivity.reduce((sum, m) => sum + m.offers, 0);

  return {
    data: {
      totalMembers: members.length,
      totalApplications,
      totalInterviews,
      totalOffers,
      memberActivity,
    },
    error: null,
    status: 200,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a secure random invitation token
 * Uses crypto.randomUUID() for security
 */
function generateInvitationToken(): string {
  return `inv_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Check if user has a specific permission in a team
 * Calls database function check_team_permission
 */
export async function checkTeamPermission(
  userId: string,
  teamId: string,
  permission: string
): Promise<Result<boolean>> {
  const { data, error } = await supabase.rpc("check_team_permission", {
    p_user_id: userId,
    p_team_id: teamId,
    p_permission: permission,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as boolean, error: null, status: 200 };
}
