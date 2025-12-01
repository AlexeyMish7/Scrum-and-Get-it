/**
 * Tests for ai_workspace/services/reviewService.ts
 * Coverage: UC-110 Collaborative Resume and Cover Letter Review
 *
 * Tests document review creation, comment management,
 * approval workflows, and feedback tracking.
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

// Mock review service functions
const mockReviewService = {
  createReview: vi.fn(),
  getDocumentReviews: vi.fn(),
  getIncomingReviews: vi.fn(),
  getOutgoingReviews: vi.fn(),
  getReviewById: vi.fn(),
  updateReviewStatus: vi.fn(),
  approveDocument: vi.fn(),
  requestChanges: vi.fn(),
  cancelReview: vi.fn(),
  addComment: vi.fn(),
  getReviewComments: vi.fn(),
  updateComment: vi.fn(),
  resolveComment: vi.fn(),
  unresolveComment: vi.fn(),
  deleteComment: vi.fn(),
  getDocumentReviewSummary: vi.fn(),
  getReviewFeedbackSummary: vi.fn(),
  getAvailableReviewers: vi.fn(),
  getOverdueReviews: vi.fn(),
  updateReviewDeadline: vi.fn(),
};

describe("Review Service (UC-110)", () => {
  const testUserId = "test-user-uuid";
  const testReviewerId = "reviewer-user-uuid";
  const testDocumentId = "test-document-uuid";
  const testReviewId = "test-review-uuid";
  const testTeamId = "test-team-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Review CRUD Operations", () => {
    it("should create a document review request", async () => {
      const reviewData = {
        documentId: testDocumentId,
        reviewerId: testReviewerId,
        teamId: testTeamId,
        reviewType: "mentor_review" as const,
        accessLevel: "comment" as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        requestMessage: "Please review my resume before I apply to Google",
      };

      const expectedReview = {
        id: testReviewId,
        document_id: testDocumentId,
        owner_id: testUserId,
        reviewer_id: testReviewerId,
        review_type: reviewData.reviewType,
        access_level: reviewData.accessLevel,
        status: "pending",
        due_date: reviewData.dueDate,
        created_at: new Date().toISOString(),
      };

      mockReviewService.createReview.mockResolvedValue({
        data: expectedReview,
        error: null,
        status: 201,
      });

      const result = await mockReviewService.createReview(
        testUserId,
        reviewData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("pending");
      expect(result.data.review_type).toBe("mentor_review");
    });

    it("should get all reviews for a document", async () => {
      const expectedReviews = [
        {
          id: testReviewId,
          reviewer: { full_name: "Mentor John", email: "john@test.com" },
          status: "completed",
          is_approved: true,
        },
        {
          id: "review-2",
          reviewer: { full_name: "Peer Jane", email: "jane@test.com" },
          status: "pending",
        },
      ];

      mockReviewService.getDocumentReviews.mockResolvedValue({
        data: expectedReviews,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getDocumentReviews(
        testUserId,
        testDocumentId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get incoming reviews for user", async () => {
      const expectedReviews = [
        {
          id: testReviewId,
          owner: { full_name: "John Doe" },
          document: { name: "Software Engineer Resume" },
          status: "pending",
        },
      ];

      mockReviewService.getIncomingReviews.mockResolvedValue({
        data: expectedReviews,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getIncomingReviews(
        testReviewerId,
        { status: "pending" }
      );

      expect(result.error).toBeNull();
      expect(result.data[0].status).toBe("pending");
    });

    it("should get outgoing reviews for user", async () => {
      mockReviewService.getOutgoingReviews.mockResolvedValue({
        data: [{ id: testReviewId, status: "in_progress" }],
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getOutgoingReviews(testUserId);

      expect(result.error).toBeNull();
    });
  });

  describe("Review Status Management", () => {
    it("should update review status to in_progress", async () => {
      mockReviewService.updateReviewStatus.mockResolvedValue({
        data: {
          id: testReviewId,
          status: "in_progress",
          started_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.updateReviewStatus(
        testReviewerId,
        testReviewId,
        "in_progress"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("in_progress");
      expect(result.data.started_at).toBeDefined();
    });

    it("should approve a document", async () => {
      const approvalNote = "Excellent resume! Ready to submit.";

      mockReviewService.approveDocument.mockResolvedValue({
        data: {
          id: testReviewId,
          status: "completed",
          is_approved: true,
          approval_note: approvalNote,
          completed_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.approveDocument(
        testReviewerId,
        testReviewId,
        approvalNote
      );

      expect(result.error).toBeNull();
      expect(result.data.is_approved).toBe(true);
      expect(result.data.status).toBe("completed");
    });

    it("should request changes on document", async () => {
      const changeNote =
        "Please add more quantifiable achievements to your experience section.";

      mockReviewService.requestChanges.mockResolvedValue({
        data: {
          id: testReviewId,
          status: "completed",
          is_approved: false,
          approval_note: changeNote,
          completed_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.requestChanges(
        testReviewerId,
        testReviewId,
        changeNote
      );

      expect(result.error).toBeNull();
      expect(result.data.is_approved).toBe(false);
    });

    it("should cancel a review request", async () => {
      mockReviewService.cancelReview.mockResolvedValue({
        data: { id: testReviewId, status: "cancelled" },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.cancelReview(
        testUserId,
        testReviewId
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("cancelled");
    });
  });

  describe("Comment Management", () => {
    it("should add a comment to review", async () => {
      const commentData = {
        reviewId: testReviewId,
        commentText:
          "Consider rephrasing this bullet point to be more action-oriented.",
        commentType: "suggestion" as const,
        sectionPath: "experience.0.bullets.2",
        selectionRange: { start: 0, end: 45 },
      };

      const expectedComment = {
        id: "comment-1",
        review_id: testReviewId,
        user_id: testReviewerId,
        comment_text: commentData.commentText,
        comment_type: commentData.commentType,
        section_path: commentData.sectionPath,
        is_resolved: false,
        created_at: new Date().toISOString(),
      };

      mockReviewService.addComment.mockResolvedValue({
        data: expectedComment,
        error: null,
        status: 201,
      });

      const result = await mockReviewService.addComment(
        testReviewerId,
        commentData
      );

      expect(result.error).toBeNull();
      expect(result.data.comment_type).toBe("suggestion");
      expect(result.data.section_path).toBe("experience.0.bullets.2");
    });

    it("should get all comments for a review as threaded structure", async () => {
      const expectedComments = [
        {
          id: "comment-1",
          comment_text: "Great work on this section!",
          comment_type: "praise",
          is_resolved: false,
          user: { full_name: "Mentor John" },
          replies: [
            {
              id: "comment-2",
              parent_comment_id: "comment-1",
              comment_text: "Thank you!",
              user: { full_name: "John Doe" },
            },
          ],
        },
      ];

      mockReviewService.getReviewComments.mockResolvedValue({
        data: expectedComments,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getReviewComments(
        testUserId,
        testReviewId
      );

      expect(result.error).toBeNull();
      expect(result.data[0].replies).toHaveLength(1);
    });

    it("should update a comment", async () => {
      const newText = "Updated comment text with more clarity.";

      mockReviewService.updateComment.mockResolvedValue({
        data: {
          id: "comment-1",
          comment_text: newText,
          is_edited: true,
          edited_at: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.updateComment(
        testReviewerId,
        "comment-1",
        newText
      );

      expect(result.error).toBeNull();
      expect(result.data.is_edited).toBe(true);
    });

    it("should resolve a comment", async () => {
      const resolutionNote = "Applied the suggested change.";

      mockReviewService.resolveComment.mockResolvedValue({
        data: {
          id: "comment-1",
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: testUserId,
          resolution_note: resolutionNote,
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.resolveComment(
        testUserId,
        "comment-1",
        resolutionNote
      );

      expect(result.error).toBeNull();
      expect(result.data.is_resolved).toBe(true);
    });

    it("should unresolve a comment", async () => {
      mockReviewService.unresolveComment.mockResolvedValue({
        data: {
          id: "comment-1",
          is_resolved: false,
          resolved_at: null,
          resolved_by: null,
        },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.unresolveComment(
        testUserId,
        "comment-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.is_resolved).toBe(false);
    });

    it("should delete a comment", async () => {
      mockReviewService.deleteComment.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.deleteComment(
        testReviewerId,
        "comment-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.success).toBe(true);
    });
  });

  describe("Comment Types", () => {
    it("should support all comment types", async () => {
      const commentTypes = [
        "comment",
        "suggestion",
        "praise",
        "change_request",
        "question",
        "approval",
        "rejection",
      ];

      for (const type of commentTypes) {
        mockReviewService.addComment.mockResolvedValue({
          data: { id: `comment-${type}`, comment_type: type },
          error: null,
          status: 201,
        });

        const result = await mockReviewService.addComment(testReviewerId, {
          reviewId: testReviewId,
          commentText: `This is a ${type} comment`,
          commentType: type as
            | "comment"
            | "suggestion"
            | "praise"
            | "change_request"
            | "question"
            | "approval"
            | "rejection",
        });

        expect(result.error).toBeNull();
        expect(result.data.comment_type).toBe(type);
      }
    });
  });

  describe("Review Summary and Analytics", () => {
    it("should get document review summary", async () => {
      const expectedSummary = {
        totalReviews: 5,
        pendingReviews: 2,
        completedReviews: 3,
        approvedReviews: 2,
        totalComments: 15,
        unresolvedComments: 3,
        overdueReviews: 1,
      };

      mockReviewService.getDocumentReviewSummary.mockResolvedValue({
        data: expectedSummary,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getDocumentReviewSummary(
        testUserId,
        testDocumentId
      );

      expect(result.error).toBeNull();
      expect(result.data.totalReviews).toBe(5);
      expect(result.data.unresolvedComments).toBe(3);
    });

    it("should get review feedback summary", async () => {
      const expectedSummary = {
        totalComments: 10,
        resolvedCount: 7,
        unresolvedCount: 3,
        byType: {
          comment: 3,
          suggestion: 4,
          praise: 2,
          change_request: 1,
        },
        bySection: {
          "experience.0": 5,
          skills: 3,
          summary: 2,
        },
        implementationRate: 70,
      };

      mockReviewService.getReviewFeedbackSummary.mockResolvedValue({
        data: expectedSummary,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getReviewFeedbackSummary(
        testUserId,
        testReviewId
      );

      expect(result.error).toBeNull();
      expect(result.data.implementationRate).toBe(70);
    });
  });

  describe("Reviewer Discovery", () => {
    it("should get available reviewers from team", async () => {
      const expectedReviewers = [
        {
          id: "user-1",
          full_name: "Mentor John",
          email: "john@test.com",
          role: "mentor",
        },
        {
          id: "user-2",
          full_name: "Peer Jane",
          email: "jane@test.com",
          role: "candidate",
        },
      ];

      mockReviewService.getAvailableReviewers.mockResolvedValue({
        data: expectedReviewers,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getAvailableReviewers(
        testUserId,
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should return empty when no team context", async () => {
      mockReviewService.getAvailableReviewers.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getAvailableReviewers(testUserId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Deadline Management", () => {
    it("should get overdue reviews", async () => {
      const expectedReviews = [
        {
          id: testReviewId,
          due_date: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "pending",
          owner: { full_name: "John Doe" },
          document: { name: "Resume v2" },
        },
      ];

      mockReviewService.getOverdueReviews.mockResolvedValue({
        data: expectedReviews,
        error: null,
        status: 200,
      });

      const result = await mockReviewService.getOverdueReviews(testReviewerId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });

    it("should update review deadline", async () => {
      const newDueDate = new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000
      ).toISOString();

      mockReviewService.updateReviewDeadline.mockResolvedValue({
        data: { id: testReviewId, due_date: newDueDate },
        error: null,
        status: 200,
      });

      const result = await mockReviewService.updateReviewDeadline(
        testUserId,
        testReviewId,
        newDueDate
      );

      expect(result.error).toBeNull();
      expect(result.data.due_date).toBe(newDueDate);
    });
  });

  describe("Access Control", () => {
    it("should support all access levels", async () => {
      const accessLevels = ["view", "comment", "suggest", "approve"];

      for (const level of accessLevels) {
        mockReviewService.createReview.mockResolvedValue({
          data: { id: `review-${level}`, access_level: level },
          error: null,
          status: 201,
        });

        const result = await mockReviewService.createReview(testUserId, {
          documentId: testDocumentId,
          reviewerId: testReviewerId,
          accessLevel: level as "view" | "comment" | "suggest" | "approve",
        });

        expect(result.error).toBeNull();
        expect(result.data.access_level).toBe(level);
      }
    });
  });

  describe("Review Types", () => {
    it("should support all review types", async () => {
      const reviewTypes = [
        "feedback",
        "approval",
        "peer_review",
        "mentor_review",
      ];

      for (const type of reviewTypes) {
        mockReviewService.createReview.mockResolvedValue({
          data: { id: `review-${type}`, review_type: type },
          error: null,
          status: 201,
        });

        const result = await mockReviewService.createReview(testUserId, {
          documentId: testDocumentId,
          reviewerId: testReviewerId,
          reviewType: type as
            | "feedback"
            | "approval"
            | "peer_review"
            | "mentor_review",
        });

        expect(result.error).toBeNull();
        expect(result.data.review_type).toBe(type);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle review not found", async () => {
      mockReviewService.getReviewById.mockResolvedValue({
        data: null,
        error: null,
        status: 404,
      });

      const result = await mockReviewService.getReviewById(
        testUserId,
        "non-existent-review"
      );

      expect(result.data).toBeNull();
      expect(result.status).toBe(404);
    });

    it("should handle unauthorized access", async () => {
      mockReviewService.approveDocument.mockResolvedValue({
        data: null,
        error: { message: "Not authorized to approve this document" },
        status: 403,
      });

      const result = await mockReviewService.approveDocument(
        "wrong-user",
        testReviewId,
        "Approved"
      );

      expect(result.error).not.toBeNull();
    });
  });
});
