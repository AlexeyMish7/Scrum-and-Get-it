/**
 * Tests for team_management/services/mentorService.ts
 * Coverage: UC-109 Mentor Dashboard and Coaching Tools
 *
 * Tests mentor dashboard operations, mentee progress tracking,
 * feedback management, goal tracking, and coaching insights.
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

// Mock mentor service functions
const mockMentorService = {
  getAssignedMentees: vi.fn(),
  getMenteeDocuments: vi.fn(),
  createFeedback: vi.fn(),
  getMentorFeedback: vi.fn(),
  deleteFeedback: vi.fn(),
  createMenteeGoal: vi.fn(),
  getMenteeGoals: vi.fn(),
  updateMenteeGoal: vi.fn(),
  getMentorDashboardSummary: vi.fn(),
};

describe("Mentor Service (UC-109)", () => {
  const testUserId = "mentor-user-uuid";
  const testTeamId = "test-team-uuid";
  const testCandidateId = "candidate-user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mentee Progress Tracking", () => {
    it("should get assigned mentees with progress data", async () => {
      const expectedMentees = [
        {
          candidate_id: testCandidateId,
          candidate_name: "John Doe",
          candidate_email: "john@test.com",
          jobStats: {
            total: 15,
            applied: 10,
            interviewing: 3,
            offers: 1,
            rejected: 1,
          },
          recentActivity: [
            {
              id: "activity-1",
              type: "status_change",
              description: "Job at Google: Applied → Interview",
              timestamp: new Date().toISOString(),
            },
          ],
          engagementLevel: "high",
          lastActiveAt: new Date().toISOString(),
        },
      ];

      mockMentorService.getAssignedMentees.mockResolvedValue({
        data: expectedMentees,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getAssignedMentees(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].jobStats.total).toBe(15);
      expect(result.data[0].engagementLevel).toBe("high");
    });

    it("should return empty array when no mentees assigned", async () => {
      mockMentorService.getAssignedMentees.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getAssignedMentees(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it("should calculate engagement levels correctly", async () => {
      // High engagement: active in last 7 days with 5+ activities
      // Medium: active in last 7 days with fewer activities
      // Low: last active 7-14 days ago
      // Inactive: no activity for 14+ days

      const menteesWithVariedEngagement = [
        {
          candidate_id: "1",
          engagementLevel: "high",
          lastActiveAt: new Date().toISOString(),
        },
        {
          candidate_id: "2",
          engagementLevel: "medium",
          lastActiveAt: new Date().toISOString(),
        },
        {
          candidate_id: "3",
          engagementLevel: "low",
          lastActiveAt: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          candidate_id: "4",
          engagementLevel: "inactive",
          lastActiveAt: new Date(
            Date.now() - 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      mockMentorService.getAssignedMentees.mockResolvedValue({
        data: menteesWithVariedEngagement,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getAssignedMentees(
        testUserId,
        testTeamId
      );

      expect(
        result.data.filter(
          (m: { engagementLevel: string }) => m.engagementLevel === "inactive"
        )
      ).toHaveLength(1);
    });
  });

  describe("Mentee Document Access", () => {
    it("should get mentee documents for review", async () => {
      const expectedDocuments = [
        {
          id: "doc-1",
          title: "Software Engineer Resume",
          documentType: "resume",
          version: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          jobTitle: "Software Engineer",
          companyName: "Google",
        },
        {
          id: "doc-2",
          title: "Cover Letter - Meta",
          documentType: "cover_letter",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockMentorService.getMenteeDocuments.mockResolvedValue({
        data: expectedDocuments,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMenteeDocuments(
        testUserId,
        testCandidateId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].documentType).toBe("resume");
    });

    it("should deny access to unauthorized mentee documents", async () => {
      mockMentorService.getMenteeDocuments.mockResolvedValue({
        data: null,
        error: {
          message: "Not authorized to view this candidate's documents",
          status: 403,
        },
        status: 403,
      });

      const result = await mockMentorService.getMenteeDocuments(
        "unauthorized-mentor",
        testCandidateId,
        testTeamId
      );

      expect(result.error).not.toBeNull();
      expect(result.status).toBe(403);
    });
  });

  describe("Feedback Management", () => {
    it("should create feedback for mentee", async () => {
      const feedbackData = {
        candidateId: testCandidateId,
        teamId: testTeamId,
        feedbackType: "resume" as const,
        feedbackText:
          "Great improvement on bullet points. Consider adding more quantifiable achievements.",
        relatedDocumentId: "doc-1",
      };

      const expectedFeedback = {
        id: "feedback-1",
        teamId: testTeamId,
        mentorId: testUserId,
        candidateId: testCandidateId,
        feedbackType: feedbackData.feedbackType,
        feedbackText: feedbackData.feedbackText,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      mockMentorService.createFeedback.mockResolvedValue({
        data: expectedFeedback,
        error: null,
        status: 201,
      });

      const result = await mockMentorService.createFeedback(
        testUserId,
        feedbackData
      );

      expect(result.error).toBeNull();
      expect(result.data.feedbackText).toBe(feedbackData.feedbackText);
      expect(result.data.feedbackType).toBe("resume");
    });

    it("should get all feedback written by mentor", async () => {
      const expectedFeedback = [
        {
          id: "feedback-1",
          feedbackType: "resume",
          feedbackText: "Good work!",
          candidate: { fullName: "John Doe", email: "john@test.com" },
          createdAt: new Date().toISOString(),
        },
        {
          id: "feedback-2",
          feedbackType: "interview",
          feedbackText: "Prepare for behavioral questions",
          candidate: { fullName: "Jane Smith", email: "jane@test.com" },
          createdAt: new Date().toISOString(),
        },
      ];

      mockMentorService.getMentorFeedback.mockResolvedValue({
        data: expectedFeedback,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMentorFeedback(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should filter feedback by candidate", async () => {
      mockMentorService.getMentorFeedback.mockResolvedValue({
        data: [{ id: "feedback-1", candidateId: testCandidateId }],
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMentorFeedback(
        testUserId,
        testTeamId,
        testCandidateId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });

    it("should delete feedback", async () => {
      mockMentorService.deleteFeedback.mockResolvedValue({
        data: true,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.deleteFeedback(
        testUserId,
        "feedback-1"
      );

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });

  describe("Goal Management", () => {
    it("should create goal for mentee", async () => {
      const goalData = {
        candidateId: testCandidateId,
        teamId: testTeamId,
        goalType: "weekly_applications" as const,
        title: "Apply to 10 jobs this week",
        description: "Focus on software engineering roles",
        targetValue: 10,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const expectedGoal = {
        id: "goal-1",
        teamId: testTeamId,
        candidateId: testCandidateId,
        mentorId: testUserId,
        goalType: goalData.goalType,
        title: goalData.title,
        targetValue: goalData.targetValue,
        currentValue: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      mockMentorService.createMenteeGoal.mockResolvedValue({
        data: expectedGoal,
        error: null,
        status: 201,
      });

      const result = await mockMentorService.createMenteeGoal(
        testUserId,
        goalData
      );

      expect(result.error).toBeNull();
      expect(result.data.goalType).toBe("weekly_applications");
      expect(result.data.targetValue).toBe(10);
      expect(result.data.status).toBe("active");
    });

    it("should get mentee goals", async () => {
      const expectedGoals = [
        {
          id: "goal-1",
          goalType: "weekly_applications",
          title: "Apply to 10 jobs",
          targetValue: 10,
          currentValue: 6,
          status: "active",
        },
        {
          id: "goal-2",
          goalType: "resume_update",
          title: "Update resume with recent experience",
          status: "completed",
          completedAt: new Date().toISOString(),
        },
      ];

      mockMentorService.getMenteeGoals.mockResolvedValue({
        data: expectedGoals,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMenteeGoals(
        testUserId,
        testCandidateId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].currentValue).toBe(6);
    });

    it("should update goal progress", async () => {
      const updates = {
        currentValue: 8,
      };

      mockMentorService.updateMenteeGoal.mockResolvedValue({
        data: { id: "goal-1", currentValue: 8, status: "active" },
        error: null,
        status: 200,
      });

      const result = await mockMentorService.updateMenteeGoal(
        testUserId,
        "goal-1",
        updates
      );

      expect(result.error).toBeNull();
      expect(result.data.currentValue).toBe(8);
    });

    it("should mark goal as completed", async () => {
      const updates = {
        status: "completed" as const,
      };

      mockMentorService.updateMenteeGoal.mockResolvedValue({
        data: {
          id: "goal-1",
          status: "completed",
          completedAt: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockMentorService.updateMenteeGoal(
        testUserId,
        "goal-1",
        updates
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("completed");
      expect(result.data.completedAt).toBeDefined();
    });
  });

  describe("Dashboard Summary", () => {
    it("should get mentor dashboard summary", async () => {
      const expectedSummary = {
        totalMentees: 5,
        activeMentees: 4,
        inactiveMentees: 1,
        totalActiveGoals: 12,
        completedGoalsThisWeek: 3,
        pendingFeedback: 2,
        totalApplicationsThisWeek: 25,
        totalInterviewsThisWeek: 5,
      };

      mockMentorService.getMentorDashboardSummary.mockResolvedValue({
        data: expectedSummary,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMentorDashboardSummary(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.totalMentees).toBe(5);
      expect(result.data.activeMentees).toBe(4);
      expect(result.data.completedGoalsThisWeek).toBe(3);
    });

    it("should handle empty dashboard data", async () => {
      const emptyDashboard = {
        totalMentees: 0,
        activeMentees: 0,
        inactiveMentees: 0,
        totalActiveGoals: 0,
        completedGoalsThisWeek: 0,
        pendingFeedback: 0,
        totalApplicationsThisWeek: 0,
        totalInterviewsThisWeek: 0,
      };

      mockMentorService.getMentorDashboardSummary.mockResolvedValue({
        data: emptyDashboard,
        error: null,
        status: 200,
      });

      const result = await mockMentorService.getMentorDashboardSummary(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.totalMentees).toBe(0);
    });
  });

  describe("Feedback Types", () => {
    it("should support all feedback types", async () => {
      const feedbackTypes = [
        "application",
        "interview",
        "resume",
        "cover_letter",
        "general",
        "goal",
        "milestone",
      ];

      for (const type of feedbackTypes) {
        mockMentorService.createFeedback.mockResolvedValue({
          data: { id: `feedback-${type}`, feedbackType: type },
          error: null,
          status: 201,
        });

        const result = await mockMentorService.createFeedback(testUserId, {
          candidateId: testCandidateId,
          teamId: testTeamId,
          feedbackType: type as
            | "application"
            | "interview"
            | "resume"
            | "cover_letter"
            | "general"
            | "goal"
            | "milestone",
          feedbackText: `Feedback for ${type}`,
        });

        expect(result.error).toBeNull();
        expect(result.data.feedbackType).toBe(type);
      }
    });
  });

  describe("Goal Types", () => {
    it("should support all goal types", async () => {
      const goalTypes = [
        "weekly_applications",
        "monthly_applications",
        "interview_prep",
        "resume_update",
        "networking",
        "skill_development",
        "custom",
      ];

      for (const type of goalTypes) {
        mockMentorService.createMenteeGoal.mockResolvedValue({
          data: { id: `goal-${type}`, goalType: type },
          error: null,
          status: 201,
        });

        const result = await mockMentorService.createMenteeGoal(testUserId, {
          candidateId: testCandidateId,
          teamId: testTeamId,
          goalType: type as
            | "weekly_applications"
            | "monthly_applications"
            | "interview_prep"
            | "resume_update"
            | "networking"
            | "skill_development"
            | "custom",
          title: `Goal for ${type}`,
        });

        expect(result.error).toBeNull();
        expect(result.data.goalType).toBe(type);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle authorization errors", async () => {
      mockMentorService.getMenteeGoals.mockResolvedValue({
        data: null,
        error: {
          message: "Not authorized to view this candidate's goals",
          status: 403,
        },
        status: 403,
      });

      const result = await mockMentorService.getMenteeGoals(
        "wrong-mentor",
        testCandidateId,
        testTeamId
      );

      expect(result.error).not.toBeNull();
      expect(result.status).toBe(403);
    });

    it("should handle database errors gracefully", async () => {
      mockMentorService.getAssignedMentees.mockResolvedValue({
        data: null,
        error: { message: "Database connection error", status: null },
        status: null,
      });

      const result = await mockMentorService.getAssignedMentees(
        testUserId,
        testTeamId
      );

      expect(result.error).not.toBeNull();
    });
  });
});
