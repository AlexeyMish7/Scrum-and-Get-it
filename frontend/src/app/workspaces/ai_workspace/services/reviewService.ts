/**
 * REVIEW SERVICE (UC-110: Collaborative Document Review)
 *
 * Purpose:
 * - Manage document reviews between users
 * - Handle comments, suggestions, and approval workflows
 * - Track review deadlines and feedback implementation
 * - Integrate with team management for mentor/peer reviews
 *
 * Backend Connection:
 * - Database: document_reviews, review_comments tables
 * - Auth: User-scoped via userId parameter
 * - RLS: Enforces owner/reviewer access control
 *
 * Usage:
 *   import * as reviewService from '@ai_workspace/services/reviewService';
 *
 *   const reviews = await reviewService.getDocumentReviews(userId, documentId);
 *   await reviewService.createReview(userId, { documentId, reviewerId, ... });
 */

import { supabase } from "@shared/services/supabaseClient";
import type { Result } from "@shared/services/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ReviewStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";

export type ReviewType =
  | "feedback"
  | "approval"
  | "peer_review"
  | "mentor_review";

export type AccessLevel = "view" | "comment" | "suggest" | "approve";

export type CommentType =
  | "comment"
  | "suggestion"
  | "praise"
  | "change_request"
  | "question"
  | "approval"
  | "rejection";

/**
 * Document review record
 */
export interface DocumentReview {
  id: string;
  document_id: string;
  version_id: string | null;
  owner_id: string;
  reviewer_id: string;
  team_id: string | null;
  review_type: ReviewType;
  access_level: AccessLevel;
  status: ReviewStatus;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  is_approved: boolean | null;
  approval_note: string | null;
  request_message: string | null;
  reviewer_notes: string | null;
  total_comments: number;
  unresolved_comments: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  document?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Review comment record
 */
export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  comment_type: CommentType;
  section_path: string | null;
  selection_range: { start: number; end: number } | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  is_edited: boolean;
  edited_at: string | null;
  original_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  resolver?: {
    id: string;
    full_name: string | null;
  };
  replies?: ReviewComment[];
}

/**
 * Data for creating a new review
 */
export interface CreateReviewData {
  documentId: string;
  versionId?: string;
  reviewerId: string;
  teamId?: string;
  reviewType?: ReviewType;
  accessLevel?: AccessLevel;
  dueDate?: string;
  requestMessage?: string;
}

/**
 * Data for creating a new comment
 */
export interface CreateCommentData {
  reviewId: string;
  commentText: string;
  commentType?: CommentType;
  parentCommentId?: string;
  sectionPath?: string;
  selectionRange?: { start: number; end: number };
}

/**
 * Review summary statistics
 */
export interface ReviewSummary {
  totalReviews: number;
  pendingReviews: number;
  completedReviews: number;
  approvedReviews: number;
  totalComments: number;
  unresolvedComments: number;
  overdueReviews: number;
}

/**
 * Feedback summary for analytics
 */
export interface FeedbackSummary {
  totalComments: number;
  resolvedCount: number;
  unresolvedCount: number;
  byType: Record<CommentType, number>;
  bySection: Record<string, number>;
  implementationRate: number;
}

// ============================================================================
// REVIEW CRUD OPERATIONS
// ============================================================================

/**
 * Create a new document review request
 */
export async function createReview(
  userId: string,
  data: CreateReviewData
): Promise<Result<DocumentReview>> {
  try {
    const payload = {
      document_id: data.documentId,
      version_id: data.versionId || null,
      owner_id: userId,
      reviewer_id: data.reviewerId,
      team_id: data.teamId || null,
      review_type: data.reviewType || "feedback",
      access_level: data.accessLevel || "comment",
      due_date: data.dueDate || null,
      request_message: data.requestMessage || null,
    };

    const { data: review, error } = await supabase
      .from("document_reviews")
      .insert(payload)
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        reviewer:profiles!document_reviews_reviewer_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 201 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get all reviews for a specific document
 */
export async function getDocumentReviews(
  _userId: string,
  documentId: string
): Promise<Result<DocumentReview[]>> {
  try {
    const { data: reviews, error } = await supabase
      .from("document_reviews")
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        reviewer:profiles!document_reviews_reviewer_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return {
      data: (reviews || []) as DocumentReview[],
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get reviews where user is the reviewer (incoming reviews)
 */
export async function getIncomingReviews(
  userId: string,
  options?: { status?: ReviewStatus; limit?: number }
): Promise<Result<DocumentReview[]>> {
  try {
    let query = supabase
      .from("document_reviews")
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        reviewer:profiles!document_reviews_reviewer_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return {
      data: (reviews || []) as DocumentReview[],
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get reviews where user is the owner (outgoing reviews)
 */
export async function getOutgoingReviews(
  userId: string,
  options?: { status?: ReviewStatus; limit?: number }
): Promise<Result<DocumentReview[]>> {
  try {
    let query = supabase
      .from("document_reviews")
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        reviewer:profiles!document_reviews_reviewer_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return {
      data: (reviews || []) as DocumentReview[],
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(
  _userId: string,
  reviewId: string
): Promise<Result<DocumentReview | null>> {
  try {
    const { data: review, error } = await supabase
      .from("document_reviews")
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        reviewer:profiles!document_reviews_reviewer_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .eq("id", reviewId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: null, status: 404 };
      }
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  _userId: string,
  reviewId: string,
  status: ReviewStatus
): Promise<Result<DocumentReview>> {
  try {
    const updates: Record<string, unknown> = { status };

    // Set timestamps based on status
    if (status === "in_progress") {
      updates.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: review, error } = await supabase
      .from("document_reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Approve a document
 */
export async function approveDocument(
  userId: string,
  reviewId: string,
  approvalNote?: string
): Promise<Result<DocumentReview>> {
  try {
    const { data: review, error } = await supabase
      .from("document_reviews")
      .update({
        status: "completed",
        is_approved: true,
        approval_note: approvalNote || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("reviewer_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Request changes on a document
 */
export async function requestChanges(
  userId: string,
  reviewId: string,
  note: string
): Promise<Result<DocumentReview>> {
  try {
    const { data: review, error } = await supabase
      .from("document_reviews")
      .update({
        status: "completed",
        is_approved: false,
        approval_note: note,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("reviewer_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Cancel a review request (owner only)
 */
export async function cancelReview(
  userId: string,
  reviewId: string
): Promise<Result<DocumentReview>> {
  try {
    const { data: review, error } = await supabase
      .from("document_reviews")
      .update({ status: "cancelled" })
      .eq("id", reviewId)
      .eq("owner_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

/**
 * Add a comment to a review
 */
export async function addComment(
  userId: string,
  data: CreateCommentData
): Promise<Result<ReviewComment>> {
  try {
    const payload = {
      review_id: data.reviewId,
      user_id: userId,
      parent_comment_id: data.parentCommentId || null,
      comment_text: data.commentText,
      comment_type: data.commentType || "comment",
      section_path: data.sectionPath || null,
      selection_range: data.selectionRange || null,
    };

    const { data: comment, error } = await supabase
      .from("review_comments")
      .insert(payload)
      .select(
        `
        *,
        user:profiles!review_comments_user_id_fkey(id, full_name, email)
      `
      )
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: comment as ReviewComment, error: null, status: 201 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get all comments for a review
 */
export async function getReviewComments(
  _userId: string,
  reviewId: string,
  options?: { includeResolved?: boolean }
): Promise<Result<ReviewComment[]>> {
  try {
    let query = supabase
      .from("review_comments")
      .select(
        `
        *,
        user:profiles!review_comments_user_id_fkey(id, full_name, email),
        resolver:profiles!review_comments_resolved_by_fkey(id, full_name)
      `
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (!options?.includeResolved) {
      query = query.eq("is_resolved", false);
    }

    const { data: comments, error } = await query;

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    // Build threaded structure
    const threadedComments = buildCommentThreads(
      (comments || []) as ReviewComment[]
    );

    return { data: threadedComments, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Build threaded comment structure from flat list
 */
function buildCommentThreads(comments: ReviewComment[]): ReviewComment[] {
  const commentMap = new Map<string, ReviewComment>();
  const rootComments: ReviewComment[] = [];

  // First pass: create map
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree
  comments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id)!;
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(mappedComment);
      } else {
        rootComments.push(mappedComment);
      }
    } else {
      rootComments.push(mappedComment);
    }
  });

  return rootComments;
}

/**
 * Update a comment
 */
export async function updateComment(
  userId: string,
  commentId: string,
  commentText: string
): Promise<Result<ReviewComment>> {
  try {
    // Get original comment for history
    const { data: original } = await supabase
      .from("review_comments")
      .select("comment_text, is_edited, original_text")
      .eq("id", commentId)
      .eq("user_id", userId)
      .single();

    const updates: Record<string, unknown> = {
      comment_text: commentText,
      is_edited: true,
      edited_at: new Date().toISOString(),
    };

    // Preserve original text on first edit
    if (original && !original.is_edited) {
      updates.original_text = original.comment_text;
    }

    const { data: comment, error } = await supabase
      .from("review_comments")
      .update(updates)
      .eq("id", commentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: comment as ReviewComment, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Resolve a comment
 */
export async function resolveComment(
  userId: string,
  commentId: string,
  resolutionNote?: string
): Promise<Result<ReviewComment>> {
  try {
    const { data: comment, error } = await supabase
      .from("review_comments")
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_note: resolutionNote || null,
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: comment as ReviewComment, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Unresolve a comment
 */
export async function unresolveComment(
  _userId: string,
  commentId: string
): Promise<Result<ReviewComment>> {
  try {
    const { data: comment, error } = await supabase
      .from("review_comments")
      .update({
        is_resolved: false,
        resolved_at: null,
        resolved_by: null,
        resolution_note: null,
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: comment as ReviewComment, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  userId: string,
  commentId: string
): Promise<Result<{ success: boolean }>> {
  try {
    const { error } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: { success: true }, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

// ============================================================================
// SUMMARY & ANALYTICS
// ============================================================================

/**
 * Get review summary for a document
 */
export async function getDocumentReviewSummary(
  _userId: string,
  documentId: string
): Promise<Result<ReviewSummary>> {
  try {
    const { data, error } = await supabase.rpc("get_document_review_summary", {
      p_document_id: documentId,
    });

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    const summary = data?.[0] || {
      total_reviews: 0,
      pending_reviews: 0,
      completed_reviews: 0,
      approved_reviews: 0,
      total_comments: 0,
      unresolved_comments: 0,
      overdue_reviews: 0,
    };

    return {
      data: {
        totalReviews: summary.total_reviews,
        pendingReviews: summary.pending_reviews,
        completedReviews: summary.completed_reviews,
        approvedReviews: summary.approved_reviews,
        totalComments: summary.total_comments,
        unresolvedComments: summary.unresolved_comments,
        overdueReviews: summary.overdue_reviews,
      },
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get feedback summary for a review
 */
export async function getReviewFeedbackSummary(
  _userId: string,
  reviewId: string
): Promise<Result<FeedbackSummary>> {
  try {
    const { data, error } = await supabase.rpc("get_review_feedback_summary", {
      p_review_id: reviewId,
    });

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    const feedbackData = data || {};

    return {
      data: {
        totalComments: feedbackData.total_comments || 0,
        resolvedCount: feedbackData.resolved_count || 0,
        unresolvedCount: feedbackData.unresolved_count || 0,
        byType: feedbackData.by_type || {},
        bySection: feedbackData.by_section || {},
        implementationRate:
          feedbackData.total_comments > 0
            ? (feedbackData.resolved_count / feedbackData.total_comments) * 100
            : 0,
      },
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Get reviewers available for a user (team members, mentors)
 */
export async function getAvailableReviewers(
  userId: string,
  teamId?: string
): Promise<
  Result<Array<{ id: string; full_name: string; email: string; role?: string }>>
> {
  try {
    if (teamId) {
      // Get team members
      const { data: members, error } = await supabase
        .from("team_members")
        .select(
          `
          user_id,
          role,
          profile:profiles!team_members_user_id_fkey(id, full_name, email)
        `
        )
        .eq("team_id", teamId)
        .eq("is_active", true)
        .neq("user_id", userId);

      if (error) {
        return { data: null, error: { message: error.message }, status: 400 };
      }

      // Profile comes back as array from Supabase join, need to handle that
      const reviewers = (members || []).map((m: Record<string, unknown>) => {
        // Profile can be an array or single object depending on join type
        const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
        return {
          id:
            ((profile as Record<string, unknown>)?.id as string) ||
            (m.user_id as string),
          full_name:
            ((profile as Record<string, unknown>)?.full_name as string) ||
            "Unknown",
          email: ((profile as Record<string, unknown>)?.email as string) || "",
          role: m.role as string,
        };
      });

      return { data: reviewers, error: null, status: 200 };
    }

    // No team context - return empty for now (could expand to recent collaborators)
    return { data: [], error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

// ============================================================================
// DEADLINE MANAGEMENT
// ============================================================================

/**
 * Get overdue reviews for a user (as reviewer)
 */
export async function getOverdueReviews(
  userId: string
): Promise<Result<DocumentReview[]>> {
  try {
    const { data: reviews, error } = await supabase
      .from("document_reviews")
      .select(
        `
        *,
        owner:profiles!document_reviews_owner_id_fkey(id, full_name, email),
        document:documents(id, name, type)
      `
      )
      .eq("reviewer_id", userId)
      .in("status", ["pending", "in_progress"])
      .lt("due_date", new Date().toISOString())
      .order("due_date", { ascending: true });

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return {
      data: (reviews || []) as DocumentReview[],
      error: null,
      status: 200,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}

/**
 * Update review deadline
 */
export async function updateReviewDeadline(
  userId: string,
  reviewId: string,
  dueDate: string
): Promise<Result<DocumentReview>> {
  try {
    const { data: review, error } = await supabase
      .from("document_reviews")
      .update({ due_date: dueDate })
      .eq("id", reviewId)
      .eq("owner_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message }, status: 400 };
    }

    return { data: review as DocumentReview, error: null, status: 200 };
  } catch (err) {
    return { data: null, error: { message: String(err) }, status: 500 };
  }
}
