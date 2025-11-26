/**
 * TEAM CONTEXT (Global Team State Management)
 *
 * Purpose:
 * - Manage team state across entire application
 * - Provide centralized team switching and member management
 * - Handle team selection persistence via localStorage
 * - Track user's role and permissions within current team
 *
 * Backend Connection:
 * - Uses teamService for direct Supabase database access
 * - RLS policies enforce permission checks at database level
 * - No server API needed - all operations direct to Supabase
 *
 * Team Flow:
 * 1. User logs in → loads all teams they belong to
 * 2. Auto-selects team (last used from localStorage or first team)
 * 3. Switching teams updates context and localStorage
 * 4. All team operations use current team ID
 * 5. Permission checks use user's role in current team
 *
 * Security Model:
 * - RLS policies ensure users only see their own teams
 * - Role-based permissions (admin/mentor/candidate)
 * - Database functions validate permissions
 * - Team admins can manage members and settings
 *
 * Usage:
 *   import { useTeam } from '@shared/context/TeamContext';
 *
 *   function MyComponent() {
 *     const { currentTeam, userRole, isAdmin, switchTeam, inviteMember } = useTeam();
 *
 *     if (!currentTeam) return <CreateTeamPrompt />;
 *
 *     return <div>Team: {currentTeam.name} (Role: {userRole})</div>;
 *   }
 *
 * Provider Setup:
 *   AuthProvider wraps TeamProvider wraps App
 */

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { TeamContext } from "./TeamContextDefinition";
import * as teamService from "@workspaces/team_management/services/teamService";
import type {
  TeamWithMembers,
  UserTeamInfo,
  TeamRole,
  CreateTeamData,
  InviteMemberData,
  UpdateMemberRoleData,
} from "@workspaces/team_management/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Team context value shape
 * Provides all team state and operations
 */
type TeamContextValue = {
  // Current team state
  currentTeam: TeamWithMembers | null;
  userRole: TeamRole | null;
  userTeams: UserTeamInfo[];
  loading: boolean;
  error: string | null;

  // Permission helpers
  isAdmin: boolean;
  isMentor: boolean;
  isCandidate: boolean;
  can: (permission: string) => boolean;

  // Team operations
  createTeam: (
    data: CreateTeamData
  ) => Promise<{ ok: boolean; error?: string }>;
  switchTeam: (teamId: string) => Promise<void>;
  refreshTeam: () => Promise<void>;
  refreshTeams: () => Promise<void>;

  // Member management
  inviteMember: (
    data: InviteMemberData
  ) => Promise<{ ok: boolean; error?: string }>;
  updateMemberRole: (
    memberId: string,
    data: UpdateMemberRoleData
  ) => Promise<{ ok: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ ok: boolean; error?: string }>;
};

type TeamProviderProps = {
  children: ReactNode;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

const STORAGE_KEY = "flowats_current_team_id";

export function TeamProvider({ children }: TeamProviderProps) {
  const { user } = useAuth();

  // State
  const [currentTeam, setCurrentTeam] = useState<TeamWithMembers | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's role in current team
  const userRole =
    currentTeam?.members.find((m) => m.user_id === user?.id)?.role || null;

  // Permission helpers
  const isAdmin = userRole === "admin";
  const isMentor = userRole === "mentor";
  const isCandidate = userRole === "candidate";

  /**
   * Load all teams user belongs to
   */
  const refreshTeams = useCallback(async () => {
    if (!user) {
      setUserTeams([]);
      return;
    }

    const result = await teamService.getUserTeams(user.id);

    if (result.error) {
      setError(result.error.message);
      setUserTeams([]);
    } else {
      setUserTeams(result.data || []);
      setError(null);
    }
  }, [user]);

  /**
   * Load current team details with members
   */
  const refreshTeam = useCallback(async () => {
    if (!user || !currentTeam) return;

    setLoading(true);
    const result = await teamService.getTeam(user.id, currentTeam.id);

    if (result.error) {
      setError(result.error.message);
      setCurrentTeam(null);
    } else {
      setCurrentTeam(result.data);
      setError(null);
    }
    setLoading(false);
  }, [user, currentTeam]);

  /**
   * Switch to a different team
   * Saves selection to localStorage
   */
  const switchTeam = useCallback(
    async (teamId: string) => {
      if (!user) return;

      setLoading(true);
      const result = await teamService.getTeam(user.id, teamId);

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      setCurrentTeam(result.data);
      setError(null);
      setLoading(false);

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, teamId);
    },
    [user]
  );

  /**
   * Create a new team
   * User becomes owner and first admin
   */
  const createTeam = useCallback(
    async (data: CreateTeamData): Promise<{ ok: boolean; error?: string }> => {
      if (!user) {
        return { ok: false, error: "Not authenticated" };
      }

      const result = await teamService.createTeam(user.id, data);

      if (result.error) {
        return { ok: false, error: result.error.message };
      }

      // Refresh teams list
      await refreshTeams();

      // Auto-switch to new team
      if (result.data) {
        await switchTeam(result.data.id);
      }

      return { ok: true };
    },
    [user, refreshTeams, switchTeam]
  );

  /**
   * Invite a new member to current team
   * Only admins can invite (enforced by RLS)
   */
  const inviteMember = useCallback(
    async (
      data: InviteMemberData
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user || !currentTeam) {
        return { ok: false, error: "No team selected" };
      }

      if (!isAdmin) {
        return { ok: false, error: "Only admins can invite members" };
      }

      const result = await teamService.inviteMember(
        user.id,
        currentTeam.id,
        data
      );

      if (result.error) {
        return { ok: false, error: result.error.message };
      }

      return { ok: true };
    },
    [user, currentTeam, isAdmin]
  );

  /**
   * Update a team member's role
   * Only admins can change roles (enforced by RLS)
   */
  const updateMemberRole = useCallback(
    async (
      memberId: string,
      data: UpdateMemberRoleData
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user || !currentTeam) {
        return { ok: false, error: "No team selected" };
      }

      if (!isAdmin) {
        return { ok: false, error: "Only admins can update member roles" };
      }

      const result = await teamService.updateMemberRole(
        user.id,
        memberId,
        data
      );

      if (result.error) {
        return { ok: false, error: result.error.message };
      }

      // Refresh team to show updated roles
      await refreshTeam();

      return { ok: true };
    },
    [user, currentTeam, isAdmin, refreshTeam]
  );

  /**
   * Remove a member from the team
   * Only admins can remove members (enforced by RLS)
   * Cannot remove the last admin (enforced by database)
   */
  const removeMember = useCallback(
    async (memberId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user || !currentTeam) {
        return { ok: false, error: "No team selected" };
      }

      if (!isAdmin) {
        return { ok: false, error: "Only admins can remove members" };
      }

      const result = await teamService.removeMember(user.id, memberId);

      if (result.error) {
        return { ok: false, error: result.error.message };
      }

      // Refresh team to show updated member list
      await refreshTeam();

      return { ok: true };
    },
    [user, currentTeam, isAdmin, refreshTeam]
  );

  /**
   * Initialize on mount or when user changes
   * Loads user's teams and sets current team
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!user) {
        // User logged out - clear state
        setCurrentTeam(null);
        setUserTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Load all user's teams
      const teamsResult = await teamService.getUserTeams(user.id);

      if (!mounted) return;

      if (teamsResult.error) {
        setError(teamsResult.error.message);
        setUserTeams([]);
        setLoading(false);
        return;
      }

      const teams = teamsResult.data || [];
      setUserTeams(teams);

      // No teams - user hasn't created/joined any yet
      if (teams.length === 0) {
        setCurrentTeam(null);
        setLoading(false);
        return;
      }

      // Determine which team to load
      let teamIdToLoad: string | null = null;

      // Try to restore last selected team from localStorage
      const savedTeamId = localStorage.getItem(STORAGE_KEY);
      if (savedTeamId && teams.some((t) => t.team_id === savedTeamId)) {
        teamIdToLoad = savedTeamId;
      } else {
        // Default to first team
        teamIdToLoad = teams[0].team_id;
      }

      // Load the selected team with full details
      const teamResult = await teamService.getTeam(user.id, teamIdToLoad);

      if (!mounted) return;

      if (teamResult.error) {
        setError(teamResult.error.message);
        setCurrentTeam(null);
      } else {
        setCurrentTeam(teamResult.data);
        // Persist selection
        localStorage.setItem(STORAGE_KEY, teamIdToLoad);
      }

      setLoading(false);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Context value
  const value: TeamContextValue = {
    // State
    currentTeam,
    userRole,
    userTeams,
    loading,
    error,

    // Permission helpers
    isAdmin,
    isMentor,
    isCandidate,
    can: () => {
      // Simple permission check - admins have all permissions
      // For complex role-based checks, use userRole directly
      return isAdmin;
    },

    // Operations
    createTeam,
    switchTeam,
    refreshTeam,
    refreshTeams,
    inviteMember,
    updateMemberRole,
    removeMember,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}
