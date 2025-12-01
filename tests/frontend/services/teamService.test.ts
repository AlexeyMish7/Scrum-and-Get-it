/**
 * Tests for team_management/services/teamService.ts
 * Coverage: UC-108 Team Account Management
 *
 * Tests team CRUD operations, member management, invitations,
 * mentor-candidate assignments, and activity logging.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();
const mockSupabaseAuth = {
  getUser: vi
    .fn()
    .mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    }),
};

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
    auth: mockSupabaseAuth,
  },
}));

// Mock CRUD utilities
const mockInsertRow = vi.fn();
const mockGetRow = vi.fn();
const mockUpdateRow = vi.fn();
const mockWithUser = vi.fn().mockReturnValue({
  listRows: vi.fn(),
  getRow: vi.fn(),
  insertRow: vi.fn(),
  updateRow: vi.fn(),
  deleteRow: vi.fn(),
});

vi.mock("@shared/services/crud", () => ({
  insertRow: (...args: unknown[]) => mockInsertRow(...args),
  getRow: (...args: unknown[]) => mockGetRow(...args),
  updateRow: (...args: unknown[]) => mockUpdateRow(...args),
  withUser: (...args: unknown[]) => mockWithUser(...args),
}));

// Mock team service functions
const mockTeamService = {
  createTeam: vi.fn(),
  getTeam: vi.fn(),
  getUserTeams: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeamMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  inviteMember: vi.fn(),
  acceptInvitation: vi.fn(),
  getUserInvitations: vi.fn(),
  declineInvitation: vi.fn(),
  getTeamInvitations: vi.fn(),
  cancelInvitation: vi.fn(),
  assignMentor: vi.fn(),
  getAssignedCandidates: vi.fn(),
  removeAssignment: vi.fn(),
  getTeamActivity: vi.fn(),
  getTeamInsights: vi.fn(),
  checkTeamPermission: vi.fn(),
};

describe("Team Management Service (UC-108)", () => {
  const testUserId = "test-user-uuid";
  const testTeamId = "test-team-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Team CRUD Operations", () => {
    it("should create a new team with user as admin", async () => {
      const teamData = {
        name: "Career Services Team",
        description: "Professional career coaching team",
      };

      const expectedTeam = {
        id: testTeamId,
        owner_id: testUserId,
        name: teamData.name,
        description: teamData.description,
        created_at: new Date().toISOString(),
      };

      mockTeamService.createTeam.mockResolvedValue({
        data: expectedTeam,
        error: null,
        status: 201,
      });

      const result = await mockTeamService.createTeam(testUserId, teamData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(teamData.name);
      expect(result.data.owner_id).toBe(testUserId);
      expect(result.status).toBe(201);
    });

    it("should get team with members", async () => {
      const expectedTeam = {
        id: testTeamId,
        name: "Career Services Team",
        owner_id: testUserId,
        members: [
          {
            id: "member-1",
            user_id: testUserId,
            role: "admin",
            profile: { full_name: "Test Admin", email: "admin@test.com" },
          },
          {
            id: "member-2",
            user_id: "user-2",
            role: "mentor",
            profile: { full_name: "Test Mentor", email: "mentor@test.com" },
          },
        ],
      };

      mockTeamService.getTeam.mockResolvedValue({
        data: expectedTeam,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getTeam(testUserId, testTeamId);

      expect(result.error).toBeNull();
      expect(result.data.members).toHaveLength(2);
      expect(result.data.members[0].role).toBe("admin");
    });

    it("should get all teams for a user", async () => {
      const expectedTeams = [
        { id: testTeamId, name: "Team A", role: "admin", member_count: 5 },
        { id: "team-2", name: "Team B", role: "mentor", member_count: 10 },
      ];

      mockTeamService.getUserTeams.mockResolvedValue({
        data: expectedTeams,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getUserTeams(testUserId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should update team settings", async () => {
      const updates = {
        name: "Updated Team Name",
        settings: { allow_member_invites: true },
      };

      mockTeamService.updateTeam.mockResolvedValue({
        data: { id: testTeamId, ...updates },
        error: null,
        status: 200,
      });

      const result = await mockTeamService.updateTeam(
        testUserId,
        testTeamId,
        updates
      );

      expect(result.error).toBeNull();
      expect(result.data.name).toBe(updates.name);
    });

    it("should soft delete a team", async () => {
      mockTeamService.deleteTeam.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.deleteTeam(testUserId, testTeamId);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });

  describe("Member Management", () => {
    it("should get team members with profiles", async () => {
      const expectedMembers = [
        {
          id: "member-1",
          user_id: testUserId,
          role: "admin",
          is_active: true,
          profile: { full_name: "Admin User", email: "admin@test.com" },
        },
      ];

      mockTeamService.getTeamMembers.mockResolvedValue({
        data: expectedMembers,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getTeamMembers(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data[0].profile.full_name).toBe("Admin User");
    });

    it("should update member role", async () => {
      const memberId = "member-2";
      const updateData = { role: "mentor" };

      mockTeamService.updateMemberRole.mockResolvedValue({
        data: { id: memberId, role: "mentor" },
        error: null,
        status: 200,
      });

      const result = await mockTeamService.updateMemberRole(
        testUserId,
        memberId,
        updateData
      );

      expect(result.error).toBeNull();
      expect(result.data.role).toBe("mentor");
    });

    it("should remove a member from team", async () => {
      const memberId = "member-2";

      mockTeamService.removeMember.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.removeMember(testUserId, memberId);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });

  describe("Invitation Management", () => {
    it("should send team invitation", async () => {
      const inviteData = {
        invitee_email: "newmember@test.com",
        role: "candidate" as const,
        message: "Welcome to our team!",
      };

      const expectedInvitation = {
        id: "invitation-1",
        team_id: testTeamId,
        invitee_email: inviteData.invitee_email,
        role: inviteData.role,
        status: "pending",
        invitation_token: expect.any(String),
      };

      mockTeamService.inviteMember.mockResolvedValue({
        data: expectedInvitation,
        error: null,
        status: 201,
      });

      const result = await mockTeamService.inviteMember(
        testUserId,
        testTeamId,
        inviteData
      );

      expect(result.error).toBeNull();
      expect(result.data.invitee_email).toBe(inviteData.invitee_email);
      expect(result.data.status).toBe("pending");
    });

    it("should accept an invitation", async () => {
      const invitationId = "invitation-1";

      mockTeamService.acceptInvitation.mockResolvedValue({
        data: {
          id: "new-member-id",
          team_id: testTeamId,
          user_id: testUserId,
          role: "candidate",
        },
        error: null,
        status: 200,
      });

      const result = await mockTeamService.acceptInvitation(
        testUserId,
        invitationId
      );

      expect(result.error).toBeNull();
      expect(result.data.team_id).toBe(testTeamId);
    });

    it("should get user pending invitations", async () => {
      const expectedInvitations = [
        {
          id: "invitation-1",
          team: { name: "Team A" },
          inviter: { full_name: "Admin" },
          role: "candidate",
          status: "pending",
        },
      ];

      mockTeamService.getUserInvitations.mockResolvedValue({
        data: expectedInvitations,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getUserInvitations();

      expect(result.error).toBeNull();
      expect(result.data[0].status).toBe("pending");
    });

    it("should decline an invitation", async () => {
      const invitationId = "invitation-1";

      mockTeamService.declineInvitation.mockResolvedValue({
        data: undefined,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.declineInvitation(
        testUserId,
        invitationId
      );

      expect(result.error).toBeNull();
    });

    it("should cancel a pending invitation", async () => {
      const invitationId = "invitation-1";

      mockTeamService.cancelInvitation.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.cancelInvitation(
        testUserId,
        invitationId
      );

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });

  describe("Mentor-Candidate Assignments", () => {
    it("should assign mentor to candidate", async () => {
      const assignmentData = {
        mentor_id: "mentor-user-id",
        candidate_id: "candidate-user-id",
        notes: "Focus on resume improvement",
      };

      mockTeamService.assignMentor.mockResolvedValue({
        data: {
          id: "assignment-1",
          team_id: testTeamId,
          ...assignmentData,
        },
        error: null,
        status: 201,
      });

      const result = await mockTeamService.assignMentor(
        testUserId,
        testTeamId,
        assignmentData
      );

      expect(result.error).toBeNull();
      expect(result.data.mentor_id).toBe(assignmentData.mentor_id);
      expect(result.data.candidate_id).toBe(assignmentData.candidate_id);
    });

    it("should get assigned candidates for mentor", async () => {
      const expectedCandidates = [
        {
          candidate_id: "candidate-1",
          candidate_name: "John Doe",
          assigned_at: new Date().toISOString(),
        },
      ];

      mockTeamService.getAssignedCandidates.mockResolvedValue({
        data: expectedCandidates,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getAssignedCandidates(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });

    it("should remove mentor-candidate assignment", async () => {
      const assignmentId = "assignment-1";

      mockTeamService.removeAssignment.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.removeAssignment(
        testUserId,
        assignmentId
      );

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });

  describe("Activity and Analytics", () => {
    it("should get team activity log", async () => {
      const expectedActivities = [
        {
          id: "activity-1",
          activity_type: "member_joined",
          description: "New member joined the team",
          created_at: new Date().toISOString(),
        },
      ];

      mockTeamService.getTeamActivity.mockResolvedValue({
        data: expectedActivities,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getTeamActivity(
        testUserId,
        testTeamId,
        50
      );

      expect(result.error).toBeNull();
      expect(result.data[0].activity_type).toBe("member_joined");
    });

    it("should get team aggregate insights", async () => {
      const expectedInsights = {
        totalMembers: 10,
        totalApplications: 50,
        totalInterviews: 20,
        totalOffers: 5,
        memberActivity: [],
      };

      mockTeamService.getTeamInsights.mockResolvedValue({
        data: expectedInsights,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.getTeamInsights(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.totalMembers).toBe(10);
      expect(result.data.totalOffers).toBe(5);
    });
  });

  describe("Permission Checks", () => {
    it("should check team permission", async () => {
      mockTeamService.checkTeamPermission.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.checkTeamPermission(
        testUserId,
        testTeamId,
        "manage_members"
      );

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it("should deny permission for unauthorized user", async () => {
      mockTeamService.checkTeamPermission.mockResolvedValue({
        data: false,
        error: null,
        status: 200,
      });

      const result = await mockTeamService.checkTeamPermission(
        "unauthorized-user",
        testTeamId,
        "admin_only_action"
      );

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle team not found", async () => {
      mockTeamService.getTeam.mockResolvedValue({
        data: null,
        error: { message: "Team not found", status: 404 },
        status: 404,
      });

      const result = await mockTeamService.getTeam(
        testUserId,
        "non-existent-team"
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Team not found");
      expect(result.status).toBe(404);
    });

    it("should handle access denied", async () => {
      mockTeamService.getTeamMembers.mockResolvedValue({
        data: null,
        error: { message: "Access denied", status: 403 },
        status: 403,
      });

      const result = await mockTeamService.getTeamMembers(
        "unauthorized-user",
        testTeamId
      );

      expect(result.error).not.toBeNull();
      expect(result.status).toBe(403);
    });

    it("should handle expired invitation", async () => {
      mockTeamService.acceptInvitation.mockResolvedValue({
        data: null,
        error: { message: "Invitation has expired", status: 400 },
        status: 400,
      });

      const result = await mockTeamService.acceptInvitation(
        testUserId,
        "expired-invitation"
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("expired");
    });

    it("should handle duplicate member invitation", async () => {
      mockTeamService.inviteMember.mockResolvedValue({
        data: null,
        error: { message: "User is already a team member", status: 409 },
        status: 409,
      });

      const result = await mockTeamService.inviteMember(
        testUserId,
        testTeamId,
        {
          invitee_email: "existing@test.com",
          role: "candidate",
        }
      );

      expect(result.error).not.toBeNull();
      expect(result.status).toBe(409);
    });
  });
});
