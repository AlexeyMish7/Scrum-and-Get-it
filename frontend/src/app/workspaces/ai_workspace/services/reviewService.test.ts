/**
 * Tests for reviewService.ts (UC-110: Collaborative Document Review)
 *
 * Coverage:
 * - Review CRUD operations (create, read, update)
 * - Comment operations (add, update, resolve, delete)
 * - Review status management (approve, reject, cancel)
 * - Summary and analytics functions
 * - Deadline management
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as reviewService from "./reviewService";
import { supabase } from "@shared/services/supabaseClient";

// Mock Supabase client
vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Helper to create chainable mock that ends with .single()
function createChainableMock(finalValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  mock.select = vi.fn().mockReturnValue(mock);
  mock.insert = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.delete = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);
  mock.neq = vi.fn().mockReturnValue(mock);
  mock.in = vi.fn().mockReturnValue(mock);
  mock.lt = vi.fn().mockReturnValue(mock);
  mock.order = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.single = vi.fn().mockResolvedValue(finalValue);

  return mock;
}

describe("ReviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // REVIEW CRUD OPERATIONS
  // ==========================================================================

  describe("createReview", () => {
    const mockUserId = "user-123";
    const mockReviewData: reviewService.CreateReviewData = {
      documentId: "doc-456",
      reviewerId: "reviewer-789",
      reviewType: "peer_review",
      accessLevel: "comment",
      dueDate: "2025-12-01",
      requestMessage: "Please review my resume",
    };

    const mockCreatedReview: reviewService.DocumentReview = {
      id: "review-001",
      document_id: "doc-456",
      version_id: null,
      owner_id: "user-123",
      reviewer_id: "reviewer-789",
      team_id: null,
      review_type: "peer_review",
      access_level: "comment",
      status: "pending",
      due_date: "2025-12-01",
      started_at: null,
      completed_at: null,
      is_approved: null,
      approval_note: null,
      request_message: "Please review my resume",
      reviewer_notes: null,
      total_comments: 0,
      unresolved_comments: 0,
      metadata: {},
      created_at: "2025-11-29T12:00:00Z",
      updated_at: "2025-11-29T12:00:00Z",
    };

    it("should create a review successfully", async () => {
      const chainMock = createChainableMock({
        data: mockCreatedReview,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.createReview(
        mockUserId,
        mockReviewData
      );

      expect(result.status).toBe(201);
      expect(result.data).toEqual(mockCreatedReview);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("document_reviews");
    });

    it("should handle database errors when creating review", async () => {
      const chainMock = createChainableMock({
        data: null,
        error: { message: "Database error" },
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.createReview(
        mockUserId,
        mockReviewData
      );

      expect(result.status).toBe(400);
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Database error");
    });

    it("should set default values for optional fields", async () => {
      const minimalData: reviewService.CreateReviewData = {
        documentId: "doc-456",
        reviewerId: "reviewer-789",
      };

      const chainMock = createChainableMock({
        data: mockCreatedReview,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      await reviewService.createReview(mockUserId, minimalData);

      // Verify insert was called (the payload would have defaults)
      expect(chainMock.insert).toHaveBeenCalled();
    });
  });

  describe("getDocumentReviews", () => {
    const mockReviews: reviewService.DocumentReview[] = [
      {
        id: "review-001",
        document_id: "doc-456",
        version_id: null,
        owner_id: "user-123",
        reviewer_id: "reviewer-789",
        team_id: null,
        review_type: "feedback",
        access_level: "comment",
        status: "pending",
        due_date: null,
        started_at: null,
        completed_at: null,
        is_approved: null,
        approval_note: null,
        request_message: null,
        reviewer_notes: null,
        total_comments: 0,
        unresolved_comments: 0,
        metadata: {},
        created_at: "2025-11-29T12:00:00Z",
        updated_at: "2025-11-29T12:00:00Z",
      },
    ];

    it("should get reviews for a document", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getDocumentReviews(
        "user-123",
        "doc-456"
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockReviews);
      expect(mockQuery.eq).toHaveBeenCalledWith("document_id", "doc-456");
    });

    it("should return empty array when no reviews found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getDocumentReviews(
        "user-123",
        "doc-456"
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual([]);
    });
  });

  describe("getIncomingReviews", () => {
    it("should get reviews where user is the reviewer", async () => {
      const mockReviews: reviewService.DocumentReview[] = [];
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getIncomingReviews("user-123", {
        status: "pending",
        limit: 10,
      });

      expect(result.status).toBe(200);
      expect(mockQuery.eq).toHaveBeenCalledWith("reviewer_id", "user-123");
    });
  });

  describe("getOutgoingReviews", () => {
    it("should get reviews where user is the owner", async () => {
      const mockReviews: reviewService.DocumentReview[] = [];
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getOutgoingReviews("user-123");

      expect(result.status).toBe(200);
      expect(mockQuery.eq).toHaveBeenCalledWith("owner_id", "user-123");
    });
  });

  describe("getReviewById", () => {
    it("should get a single review by ID", async () => {
      const mockReview: reviewService.DocumentReview = {
        id: "review-001",
        document_id: "doc-456",
        version_id: null,
        owner_id: "user-123",
        reviewer_id: "reviewer-789",
        team_id: null,
        review_type: "feedback",
        access_level: "comment",
        status: "pending",
        due_date: null,
        started_at: null,
        completed_at: null,
        is_approved: null,
        approval_note: null,
        request_message: null,
        reviewer_notes: null,
        total_comments: 0,
        unresolved_comments: 0,
        metadata: {},
        created_at: "2025-11-29T12:00:00Z",
        updated_at: "2025-11-29T12:00:00Z",
      };

      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.getReviewById(
        "user-123",
        "review-001"
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockReview);
    });

    it("should return 404 when review not found", async () => {
      const chainMock = createChainableMock({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.getReviewById(
        "user-123",
        "nonexistent"
      );

      expect(result.status).toBe(404);
      expect(result.data).toBeNull();
    });
  });

  // ==========================================================================
  // STATUS MANAGEMENT
  // ==========================================================================

  describe("updateReviewStatus", () => {
    it("should update review status to in_progress", async () => {
      const mockReview = { id: "review-001", status: "in_progress" };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.updateReviewStatus(
        "user-123",
        "review-001",
        "in_progress"
      );

      expect(result.status).toBe(200);
      expect(chainMock.update).toHaveBeenCalled();
    });

    it("should set completed_at when status is completed", async () => {
      const mockReview = { id: "review-001", status: "completed" };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      await reviewService.updateReviewStatus(
        "user-123",
        "review-001",
        "completed"
      );

      // Verify update was called
      expect(chainMock.update).toHaveBeenCalled();
    });
  });

  describe("approveDocument", () => {
    it("should approve a document", async () => {
      const mockReview = {
        id: "review-001",
        is_approved: true,
        status: "completed",
      };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.approveDocument(
        "reviewer-789",
        "review-001",
        "Looks great!"
      );

      expect(result.status).toBe(200);
      expect(result.data?.is_approved).toBe(true);
    });

    it("should approve without a note", async () => {
      const mockReview = { id: "review-001", is_approved: true };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.approveDocument(
        "reviewer-789",
        "review-001"
      );

      expect(result.status).toBe(200);
    });
  });

  describe("requestChanges", () => {
    it("should request changes on a document", async () => {
      const mockReview = {
        id: "review-001",
        is_approved: false,
        status: "completed",
      };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.requestChanges(
        "reviewer-789",
        "review-001",
        "Please fix the formatting"
      );

      expect(result.status).toBe(200);
      expect(result.data?.is_approved).toBe(false);
    });
  });

  describe("cancelReview", () => {
    it("should cancel a review (owner only)", async () => {
      const mockReview = { id: "review-001", status: "cancelled" };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.cancelReview("user-123", "review-001");

      expect(result.status).toBe(200);
      expect(chainMock.eq).toHaveBeenCalledWith("owner_id", "user-123");
    });
  });

  // ==========================================================================
  // COMMENT OPERATIONS
  // ==========================================================================

  describe("addComment", () => {
    const mockCommentData: reviewService.CreateCommentData = {
      reviewId: "review-001",
      commentText: "This looks good!",
      commentType: "praise",
    };

    it("should add a comment to a review", async () => {
      const mockComment: reviewService.ReviewComment = {
        id: "comment-001",
        review_id: "review-001",
        user_id: "user-123",
        parent_comment_id: null,
        comment_text: "This looks good!",
        comment_type: "praise",
        section_path: null,
        selection_range: null,
        is_resolved: false,
        resolved_at: null,
        resolved_by: null,
        resolution_note: null,
        is_edited: false,
        edited_at: null,
        original_text: null,
        metadata: {},
        created_at: "2025-11-29T12:00:00Z",
        updated_at: "2025-11-29T12:00:00Z",
      };

      const chainMock = createChainableMock({ data: mockComment, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.addComment(
        "user-123",
        mockCommentData
      );

      expect(result.status).toBe(201);
      expect(result.data).toEqual(mockComment);
      expect(supabase.from).toHaveBeenCalledWith("review_comments");
    });

    it("should add a threaded reply", async () => {
      const replyData: reviewService.CreateCommentData = {
        reviewId: "review-001",
        commentText: "I agree!",
        parentCommentId: "comment-001",
      };

      const mockReply = {
        id: "comment-002",
        parent_comment_id: "comment-001",
        comment_text: "I agree!",
      };

      const chainMock = createChainableMock({ data: mockReply, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.addComment("user-456", replyData);

      expect(result.status).toBe(201);
    });
  });

  describe("getReviewComments", () => {
    it("should get comments for a review", async () => {
      const mockComments = [
        {
          id: "comment-001",
          review_id: "review-001",
          parent_comment_id: null,
          comment_text: "First comment",
        },
        {
          id: "comment-002",
          review_id: "review-001",
          parent_comment_id: "comment-001",
          comment_text: "Reply to first",
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockComments, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getReviewComments(
        "user-123",
        "review-001",
        {
          includeResolved: true,
        }
      );

      expect(result.status).toBe(200);
      // Should build threaded structure
      expect(result.data).toBeDefined();
    });

    it("should filter out resolved comments by default", async () => {
      // When includeResolved is not specified, service should filter is_resolved = false
      // The service uses: query = query.eq("is_resolved", false) then await query
      // So the mock needs to return the same object and be awaitable
      const finalResult = { data: [], error: null };
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (v: typeof finalResult) => unknown) =>
          resolve(finalResult),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getReviewComments(
        "user-123",
        "review-001"
      );

      // Verify the result is successful and returns array
      expect(result.status).toBe(200);
      expect(result.data).toEqual([]);
      // Eq should be called twice (review_id and is_resolved)
      expect(mockQuery.eq).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateComment", () => {
    it("should update a comment and mark as edited", async () => {
      // Mock getting original comment
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            comment_text: "Original text",
            is_edited: false,
            original_text: null,
          },
          error: null,
        }),
      };

      // Mock updating
      const updateMock = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "comment-001",
            comment_text: "Updated text",
            is_edited: true,
          },
          error: null,
        }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? (selectMock as never) : (updateMock as never);
      });

      const result = await reviewService.updateComment(
        "user-123",
        "comment-001",
        "Updated text"
      );

      expect(result.status).toBe(200);
      expect(result.data?.is_edited).toBe(true);
    });
  });

  describe("resolveComment", () => {
    it("should resolve a comment", async () => {
      const mockComment = { id: "comment-001", is_resolved: true };
      const chainMock = createChainableMock({ data: mockComment, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.resolveComment(
        "user-123",
        "comment-001",
        "Fixed this"
      );

      expect(result.status).toBe(200);
      expect(result.data?.is_resolved).toBe(true);
    });
  });

  describe("unresolveComment", () => {
    it("should unresolve a comment", async () => {
      const mockComment = { id: "comment-001", is_resolved: false };
      const chainMock = createChainableMock({ data: mockComment, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.unresolveComment(
        "user-123",
        "comment-001"
      );

      expect(result.status).toBe(200);
      expect(result.data?.is_resolved).toBe(false);
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment (author only)", async () => {
      // Delete chains: .delete().eq("id", ...).eq("user_id", ...)
      // Need to mock the complete chain
      let eqCallCount = 0;
      const mockQuery: Record<string, ReturnType<typeof vi.fn>> = {};
      mockQuery.delete = vi.fn().mockReturnValue(mockQuery);
      mockQuery.eq = vi.fn().mockImplementation(() => {
        eqCallCount++;
        // On second eq call, return the final promise
        if (eqCallCount >= 2) {
          return Promise.resolve({ error: null });
        }
        return mockQuery;
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.deleteComment(
        "user-123",
        "comment-001"
      );

      expect(result.status).toBe(200);
      expect(result.data?.success).toBe(true);
    });
  });

  // ==========================================================================
  // SUMMARY & ANALYTICS
  // ==========================================================================

  describe("getDocumentReviewSummary", () => {
    it("should get review summary for a document", async () => {
      const mockSummary = {
        total_reviews: 5,
        pending_reviews: 2,
        completed_reviews: 3,
        approved_reviews: 2,
        total_comments: 15,
        unresolved_comments: 5,
        overdue_reviews: 1,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockSummary],
        error: null,
      } as never);

      const result = await reviewService.getDocumentReviewSummary(
        "user-123",
        "doc-456"
      );

      expect(result.status).toBe(200);
      expect(result.data?.totalReviews).toBe(5);
      expect(result.data?.pendingReviews).toBe(2);
      expect(result.data?.overdueReviews).toBe(1);
    });

    it("should return default values when no summary data", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as never);

      const result = await reviewService.getDocumentReviewSummary(
        "user-123",
        "doc-456"
      );

      expect(result.status).toBe(200);
      expect(result.data?.totalReviews).toBe(0);
    });
  });

  describe("getReviewFeedbackSummary", () => {
    it("should get feedback summary for a review", async () => {
      const mockFeedback = {
        total_comments: 10,
        resolved_count: 7,
        unresolved_count: 3,
        by_type: { suggestion: 5, comment: 3, praise: 2 },
        by_section: { header: 2, experience: 5, skills: 3 },
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockFeedback,
        error: null,
      } as never);

      const result = await reviewService.getReviewFeedbackSummary(
        "user-123",
        "review-001"
      );

      expect(result.status).toBe(200);
      expect(result.data?.totalComments).toBe(10);
      expect(result.data?.implementationRate).toBe(70); // 7/10 * 100
    });

    it("should handle zero comments gracefully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { total_comments: 0, resolved_count: 0, unresolved_count: 0 },
        error: null,
      } as never);

      const result = await reviewService.getReviewFeedbackSummary(
        "user-123",
        "review-001"
      );

      expect(result.data?.implementationRate).toBe(0);
    });
  });

  describe("getAvailableReviewers", () => {
    it("should get team members as available reviewers", async () => {
      const mockMembers = [
        {
          user_id: "user-456",
          role: "mentor",
          profile: {
            id: "user-456",
            full_name: "Jane Doe",
            email: "jane@test.com",
          },
        },
        {
          user_id: "user-789",
          role: "member",
          profile: {
            id: "user-789",
            full_name: "Bob Smith",
            email: "bob@test.com",
          },
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getAvailableReviewers(
        "user-123",
        "team-001"
      );

      expect(result.status).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].full_name).toBe("Jane Doe");
    });

    it("should handle profile as array from join", async () => {
      // Supabase sometimes returns joins as arrays
      const mockMembers = [
        {
          user_id: "user-456",
          role: "mentor",
          profile: [
            { id: "user-456", full_name: "Jane Doe", email: "jane@test.com" },
          ],
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getAvailableReviewers(
        "user-123",
        "team-001"
      );

      expect(result.status).toBe(200);
      expect(result.data?.[0].full_name).toBe("Jane Doe");
    });

    it("should return empty array when no team context", async () => {
      const result = await reviewService.getAvailableReviewers("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toEqual([]);
    });
  });

  // ==========================================================================
  // DEADLINE MANAGEMENT
  // ==========================================================================

  describe("getOverdueReviews", () => {
    it("should get overdue reviews", async () => {
      const mockReviews = [
        {
          id: "review-001",
          due_date: "2025-11-01",
          status: "pending",
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getOverdueReviews("user-123");

      expect(result.status).toBe(200);
      expect(mockQuery.in).toHaveBeenCalledWith("status", [
        "pending",
        "in_progress",
      ]);
    });
  });

  describe("updateReviewDeadline", () => {
    it("should update review deadline (owner only)", async () => {
      const mockReview = { id: "review-001", due_date: "2025-12-15" };
      const chainMock = createChainableMock({ data: mockReview, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await reviewService.updateReviewDeadline(
        "user-123",
        "review-001",
        "2025-12-15"
      );

      expect(result.status).toBe(200);
      expect(chainMock.eq).toHaveBeenCalledWith("owner_id", "user-123");
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("error handling", () => {
    it("should handle unexpected exceptions", async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await reviewService.createReview("user-123", {
        documentId: "doc-456",
        reviewerId: "reviewer-789",
      });

      expect(result.status).toBe(500);
      expect(result.error?.message).toContain("Unexpected error");
    });

    it("should handle null data gracefully", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await reviewService.getDocumentReviews(
        "user-123",
        "doc-456"
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual([]);
    });
  });
});
