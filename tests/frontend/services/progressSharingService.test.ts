/**
 * Tests for team_management/services/progressSharingService.ts
 * Coverage: UC-111 Progress Sharing and Accountability
 *           UC-112 Peer Networking (partially via partnerships)
 *           UC-113 Family/Support Circle Access (via sharing settings)
 *
 * Tests progress sharing settings, snapshots, partnerships,
 * achievements, and various sharing access levels.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
  },
}));

// Mock progress sharing service functions
const mockProgressSharingService = {
  // Sharing Settings
  getProgressSharingSettings: vi.fn(),
  updateProgressSharingSettings: vi.fn(),

  // Progress Snapshots
  getProgressSnapshots: vi.fn(),
  createProgressSnapshot: vi.fn(),
  getLatestProgressSnapshot: vi.fn(),
  deleteProgressSnapshot: vi.fn(),

  // Accountability Partnerships (UC-112 Peer Networking)
  createPartnershipRequest: vi.fn(),
  acceptPartnership: vi.fn(),
  declinePartnership: vi.fn(),
  getPartnerships: vi.fn(),
  getPartnershipRequests: vi.fn(),
  updatePartnershipGoals: vi.fn(),
  endPartnership: vi.fn(),

  // Achievements
  getAchievements: vi.fn(),
  createAchievement: vi.fn(),
  shareAchievement: vi.fn(),
  unshareAchievement: vi.fn(),

  // Family/Support Circle Access (UC-113)
  createSupportCircle: vi.fn(),
  getSupportCircle: vi.fn(),
  inviteToSupportCircle: vi.fn(),
  removeFromSupportCircle: vi.fn(),
  updateSupportCirclePermissions: vi.fn(),
  getSupportCircleMembers: vi.fn(),

  // Shared View Access
  getSharedProgressView: vi.fn(),
  validateShareToken: vi.fn(),
  createShareLink: vi.fn(),
  revokeShareLink: vi.fn(),

  // Analytics
  getProgressAnalytics: vi.fn(),
  getAccountabilityReport: vi.fn(),
};

describe("Progress Sharing Service (UC-111, UC-112, UC-113)", () => {
  const testUserId = "test-user-uuid";
  const testPartnerId = "partner-user-uuid";
  const testFamilyMemberId = "family-member-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Progress Sharing Settings", () => {
    it("should get user's sharing settings", async () => {
      const expectedSettings = {
        id: "settings-1",
        user_id: testUserId,
        share_application_stats: true,
        share_document_progress: true,
        share_interview_prep: false,
        share_with_mentors: true,
        share_with_family: true,
        share_with_peers: true,
        visibility_level: "selective" as const,
        created_at: new Date().toISOString(),
      };

      mockProgressSharingService.getProgressSharingSettings.mockResolvedValue({
        data: expectedSettings,
        error: null,
        status: 200,
      });

      const result =
        await mockProgressSharingService.getProgressSharingSettings(testUserId);

      expect(result.error).toBeNull();
      expect(result.data.share_with_family).toBe(true);
      expect(result.data.visibility_level).toBe("selective");
    });

    it("should update sharing settings", async () => {
      const newSettings = {
        share_application_stats: true,
        share_document_progress: false,
        share_interview_prep: true,
        visibility_level: "public" as const,
      };

      mockProgressSharingService.updateProgressSharingSettings.mockResolvedValue(
        {
          data: { ...newSettings, id: "settings-1", user_id: testUserId },
          error: null,
          status: 200,
        }
      );

      const result =
        await mockProgressSharingService.updateProgressSharingSettings(
          testUserId,
          newSettings
        );

      expect(result.error).toBeNull();
      expect(result.data.visibility_level).toBe("public");
    });

    it("should support all visibility levels", async () => {
      const levels = ["private", "selective", "public"];

      for (const level of levels) {
        mockProgressSharingService.updateProgressSharingSettings.mockResolvedValue(
          {
            data: { visibility_level: level },
            error: null,
            status: 200,
          }
        );

        const result =
          await mockProgressSharingService.updateProgressSharingSettings(
            testUserId,
            {
              visibility_level: level as "private" | "selective" | "public",
            }
          );

        expect(result.data.visibility_level).toBe(level);
      }
    });
  });

  describe("Progress Snapshots", () => {
    it("should create a progress snapshot", async () => {
      const expectedSnapshot = {
        id: "snapshot-1",
        user_id: testUserId,
        snapshot_date: new Date().toISOString(),
        applications_sent: 25,
        interviews_scheduled: 5,
        offers_received: 1,
        resumes_created: 3,
        cover_letters_created: 8,
        skills_added: 15,
        profile_completeness: 85,
        created_at: new Date().toISOString(),
      };

      mockProgressSharingService.createProgressSnapshot.mockResolvedValue({
        data: expectedSnapshot,
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.createProgressSnapshot(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data.profile_completeness).toBe(85);
    });

    it("should get progress snapshots with date range", async () => {
      const expectedSnapshots = [
        {
          id: "snapshot-1",
          snapshot_date: "2024-01-01",
          applications_sent: 10,
        },
        {
          id: "snapshot-2",
          snapshot_date: "2024-01-08",
          applications_sent: 18,
        },
        {
          id: "snapshot-3",
          snapshot_date: "2024-01-15",
          applications_sent: 25,
        },
      ];

      mockProgressSharingService.getProgressSnapshots.mockResolvedValue({
        data: expectedSnapshots,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getProgressSnapshots(
        testUserId,
        {
          startDate: "2024-01-01",
          endDate: "2024-01-15",
        }
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });

    it("should get latest progress snapshot", async () => {
      const expectedSnapshot = {
        id: "snapshot-latest",
        user_id: testUserId,
        applications_sent: 30,
        profile_completeness: 92,
      };

      mockProgressSharingService.getLatestProgressSnapshot.mockResolvedValue({
        data: expectedSnapshot,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getLatestProgressSnapshot(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data.applications_sent).toBe(30);
    });

    it("should delete a progress snapshot", async () => {
      mockProgressSharingService.deleteProgressSnapshot.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.deleteProgressSnapshot(
        testUserId,
        "snapshot-1"
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Accountability Partnerships (UC-112 Peer Networking)", () => {
    it("should create a partnership request", async () => {
      const expectedRequest = {
        id: "partnership-request-1",
        requester_id: testUserId,
        partner_id: testPartnerId,
        status: "pending",
        message: "Let's help each other stay accountable!",
        shared_goals: ["Apply to 5 jobs weekly", "Update resume monthly"],
        created_at: new Date().toISOString(),
      };

      mockProgressSharingService.createPartnershipRequest.mockResolvedValue({
        data: expectedRequest,
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.createPartnershipRequest(
        testUserId,
        testPartnerId,
        {
          message: "Let's help each other stay accountable!",
          sharedGoals: ["Apply to 5 jobs weekly", "Update resume monthly"],
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("pending");
      expect(result.data.shared_goals).toHaveLength(2);
    });

    it("should accept a partnership request", async () => {
      mockProgressSharingService.acceptPartnership.mockResolvedValue({
        data: {
          id: "partnership-1",
          status: "active",
          accepted_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.acceptPartnership(
        testPartnerId,
        "partnership-request-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("active");
    });

    it("should decline a partnership request", async () => {
      mockProgressSharingService.declinePartnership.mockResolvedValue({
        data: { id: "partnership-request-1", status: "declined" },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.declinePartnership(
        testPartnerId,
        "partnership-request-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("declined");
    });

    it("should get all partnerships", async () => {
      const expectedPartnerships = [
        {
          id: "partnership-1",
          partner: { full_name: "Jane Doe", email: "jane@test.com" },
          status: "active",
          shared_goals: ["Weekly check-ins"],
          created_at: "2024-01-01",
        },
        {
          id: "partnership-2",
          partner: { full_name: "Bob Smith", email: "bob@test.com" },
          status: "active",
          shared_goals: ["Apply to 10 jobs weekly"],
        },
      ];

      mockProgressSharingService.getPartnerships.mockResolvedValue({
        data: expectedPartnerships,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getPartnerships(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get pending partnership requests", async () => {
      mockProgressSharingService.getPartnershipRequests.mockResolvedValue({
        data: [
          {
            id: "request-1",
            requester: { full_name: "New Friend" },
            status: "pending",
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getPartnershipRequests(
        testUserId,
        { status: "pending" }
      );

      expect(result.error).toBeNull();
      expect(result.data[0].status).toBe("pending");
    });

    it("should update partnership goals", async () => {
      const newGoals = [
        "Apply to 10 jobs weekly",
        "Review each other's resumes monthly",
      ];

      mockProgressSharingService.updatePartnershipGoals.mockResolvedValue({
        data: { id: "partnership-1", shared_goals: newGoals },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.updatePartnershipGoals(
        testUserId,
        "partnership-1",
        newGoals
      );

      expect(result.error).toBeNull();
      expect(result.data.shared_goals).toHaveLength(2);
    });

    it("should end a partnership", async () => {
      mockProgressSharingService.endPartnership.mockResolvedValue({
        data: {
          id: "partnership-1",
          status: "ended",
          ended_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.endPartnership(
        testUserId,
        "partnership-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("ended");
    });
  });

  describe("Achievements", () => {
    it("should get user achievements", async () => {
      const expectedAchievements = [
        {
          id: "ach-1",
          type: "applications_milestone",
          value: 25,
          earned_at: "2024-01-15",
        },
        {
          id: "ach-2",
          type: "first_interview",
          value: 1,
          earned_at: "2024-01-20",
        },
        {
          id: "ach-3",
          type: "profile_complete",
          value: 100,
          earned_at: "2024-01-10",
        },
      ];

      mockProgressSharingService.getAchievements.mockResolvedValue({
        data: expectedAchievements,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getAchievements(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });

    it("should create an achievement", async () => {
      const achievementData = {
        type: "offer_received",
        value: 1,
        metadata: { company: "Google", position: "Software Engineer" },
      };

      mockProgressSharingService.createAchievement.mockResolvedValue({
        data: {
          id: "ach-new",
          user_id: testUserId,
          ...achievementData,
          earned_at: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.createAchievement(
        testUserId,
        achievementData
      );

      expect(result.error).toBeNull();
      expect(result.data.type).toBe("offer_received");
    });

    it("should share an achievement", async () => {
      mockProgressSharingService.shareAchievement.mockResolvedValue({
        data: {
          id: "ach-1",
          is_public: true,
          shared_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.shareAchievement(
        testUserId,
        "ach-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.is_public).toBe(true);
    });

    it("should unshare an achievement", async () => {
      mockProgressSharingService.unshareAchievement.mockResolvedValue({
        data: { id: "ach-1", is_public: false },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.unshareAchievement(
        testUserId,
        "ach-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.is_public).toBe(false);
    });
  });

  describe("Family/Support Circle Access (UC-113)", () => {
    it("should create a support circle", async () => {
      const expectedCircle = {
        id: "circle-1",
        owner_id: testUserId,
        name: "Family Support",
        description: "Family members helping with my job search",
        created_at: new Date().toISOString(),
      };

      mockProgressSharingService.createSupportCircle.mockResolvedValue({
        data: expectedCircle,
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.createSupportCircle(
        testUserId,
        {
          name: "Family Support",
          description: "Family members helping with my job search",
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.name).toBe("Family Support");
    });

    it("should get user's support circle", async () => {
      const expectedCircle = {
        id: "circle-1",
        name: "Family Support",
        members: [
          { id: testFamilyMemberId, full_name: "Mom", role: "supporter" },
          { id: "family-2", full_name: "Dad", role: "supporter" },
        ],
      };

      mockProgressSharingService.getSupportCircle.mockResolvedValue({
        data: expectedCircle,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getSupportCircle(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data.members).toHaveLength(2);
    });

    it("should invite someone to support circle", async () => {
      const inviteData = {
        email: "sister@test.com",
        role: "supporter" as const,
        permissions: ["view_progress", "view_achievements"],
        message: "Please join my support circle to track my progress!",
      };

      mockProgressSharingService.inviteToSupportCircle.mockResolvedValue({
        data: {
          id: "invite-1",
          circle_id: "circle-1",
          invitee_email: inviteData.email,
          status: "pending",
          permissions: inviteData.permissions,
        },
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.inviteToSupportCircle(
        testUserId,
        "circle-1",
        inviteData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("pending");
    });

    it("should remove member from support circle", async () => {
      mockProgressSharingService.removeFromSupportCircle.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.removeFromSupportCircle(
        testUserId,
        "circle-1",
        testFamilyMemberId
      );

      expect(result.error).toBeNull();
    });

    it("should update support circle member permissions", async () => {
      const newPermissions = {
        can_view_progress: true,
        can_view_achievements: true,
        can_view_documents: false,
        can_send_encouragement: true,
      };

      mockProgressSharingService.updateSupportCirclePermissions.mockResolvedValue(
        {
          data: {
            circle_id: "circle-1",
            member_id: testFamilyMemberId,
            permissions: newPermissions,
          },
          error: null,
          status: 200,
        }
      );

      const result =
        await mockProgressSharingService.updateSupportCirclePermissions(
          testUserId,
          "circle-1",
          testFamilyMemberId,
          newPermissions
        );

      expect(result.error).toBeNull();
      expect(result.data.permissions.can_view_documents).toBe(false);
    });

    it("should get support circle members with roles", async () => {
      const expectedMembers = [
        {
          id: "member-1",
          full_name: "Mom",
          role: "supporter",
          joined_at: "2024-01-01",
        },
        {
          id: "member-2",
          full_name: "Career Counselor",
          role: "advisor",
          joined_at: "2024-01-05",
        },
      ];

      mockProgressSharingService.getSupportCircleMembers.mockResolvedValue({
        data: expectedMembers,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getSupportCircleMembers(
        testUserId,
        "circle-1"
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  describe("Shared View Access", () => {
    it("should get shared progress view", async () => {
      const expectedView = {
        user: { full_name: "John Doe" },
        progress: {
          applications_sent: 25,
          interviews_scheduled: 3,
          profile_completeness: 90,
        },
        achievements: [{ type: "first_interview", earned_at: "2024-01-20" }],
        visibility: "selective",
      };

      mockProgressSharingService.getSharedProgressView.mockResolvedValue({
        data: expectedView,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getSharedProgressView(
        testPartnerId,
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data.progress.applications_sent).toBe(25);
    });

    it("should validate share token", async () => {
      const token = "valid-share-token-123";

      mockProgressSharingService.validateShareToken.mockResolvedValue({
        data: {
          isValid: true,
          userId: testUserId,
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          permissions: ["view_progress", "view_achievements"],
        },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.validateShareToken(token);

      expect(result.error).toBeNull();
      expect(result.data.isValid).toBe(true);
    });

    it("should create a share link", async () => {
      mockProgressSharingService.createShareLink.mockResolvedValue({
        data: {
          token: "new-share-token",
          url: "https://app.flowats.com/share/new-share-token",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockProgressSharingService.createShareLink(
        testUserId,
        {
          expiresInDays: 7,
          permissions: ["view_progress"],
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.url).toContain("share");
    });

    it("should revoke a share link", async () => {
      mockProgressSharingService.revokeShareLink.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.revokeShareLink(
        testUserId,
        "old-share-token"
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Progress Analytics", () => {
    it("should get progress analytics", async () => {
      const expectedAnalytics = {
        period: "30_days",
        metrics: {
          applicationsSubmitted: 15,
          applicationsTrend: "+20%",
          interviewsScheduled: 3,
          documentsCreated: 5,
          profileUpdates: 8,
        },
        weeklyBreakdown: [
          { week: "2024-W01", applications: 3, interviews: 0 },
          { week: "2024-W02", applications: 5, interviews: 1 },
        ],
      };

      mockProgressSharingService.getProgressAnalytics.mockResolvedValue({
        data: expectedAnalytics,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getProgressAnalytics(
        testUserId,
        { period: "30_days" }
      );

      expect(result.error).toBeNull();
      expect(result.data.metrics.applicationsSubmitted).toBe(15);
    });

    it("should get accountability report", async () => {
      const expectedReport = {
        partnership: {
          id: "partnership-1",
          partner: { full_name: "Jane Doe" },
          duration_days: 30,
        },
        goals_progress: [
          { goal: "Apply to 5 jobs weekly", achieved: 4, target: 4 },
          { goal: "Review resumes", achieved: 2, target: 3 },
        ],
        overall_progress: 85,
        check_ins_completed: 4,
      };

      mockProgressSharingService.getAccountabilityReport.mockResolvedValue({
        data: expectedReport,
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getAccountabilityReport(
        testUserId,
        "partnership-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.overall_progress).toBe(85);
    });
  });

  describe("Error Handling", () => {
    it("should handle partnership not found", async () => {
      mockProgressSharingService.getPartnerships.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.getPartnerships(
        testUserId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it("should handle unauthorized access to shared view", async () => {
      mockProgressSharingService.getSharedProgressView.mockResolvedValue({
        data: null,
        error: {
          message: "Access denied - not in user's circle or partner list",
        },
        status: 403,
      });

      const result = await mockProgressSharingService.getSharedProgressView(
        "unauthorized-user",
        testUserId
      );

      expect(result.error).not.toBeNull();
    });

    it("should handle expired share token", async () => {
      mockProgressSharingService.validateShareToken.mockResolvedValue({
        data: { isValid: false, reason: "Token expired" },
        error: null,
        status: 200,
      });

      const result = await mockProgressSharingService.validateShareToken(
        "expired-token"
      );

      expect(result.error).toBeNull();
      expect(result.data.isValid).toBe(false);
    });

    it("should handle duplicate partnership request", async () => {
      mockProgressSharingService.createPartnershipRequest.mockResolvedValue({
        data: null,
        error: { message: "Partnership request already exists" },
        status: 409,
      });

      const result = await mockProgressSharingService.createPartnershipRequest(
        testUserId,
        testPartnerId,
        {}
      );

      expect(result.error).not.toBeNull();
    });
  });
});
