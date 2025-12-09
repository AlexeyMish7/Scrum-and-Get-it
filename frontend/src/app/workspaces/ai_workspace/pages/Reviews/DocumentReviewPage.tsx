/**
 * DocumentReviewPage (UC-110: Collaborative Document Review)
 *
 * Main page for viewing a document with review features.
 * Displays the document alongside a review sidebar for comments and feedback.
 *
 * Features:
 * - View document with reviewer permissions
 * - Add/edit/reply to comments
 * - Approve or request changes (for approval reviews)
 * - Track unresolved comments
 * - View review history and deadline
 *
 * URL: /ai/reviews/:reviewId
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  Chip,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Comment as CommentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AccessTime as DeadlineIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { ReviewSidebar } from "../../components/reviews/ReviewSidebar";
import { ApprovalWorkflow } from "../../components/reviews/ApprovalWorkflow";
import { DocumentPreview } from "../../components/editor/DocumentPreview";
import * as reviewService from "../../services/reviewService";
import { supabase } from "@shared/services/supabaseClient";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import type {
  DocumentReview,
  ReviewComment,
  ReviewStatus,
} from "../../services/reviewService";
import type { Document } from "../../types/document.types";

// Helper to format dates
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No deadline";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to check if review is overdue
function isOverdue(dueDate: string | null, status: ReviewStatus): boolean {
  if (!dueDate || status === "completed" || status === "cancelled") {
    return false;
  }
  return new Date(dueDate) < new Date();
}

// Helper to get status chip color
function getStatusColor(
  status: ReviewStatus
): "default" | "primary" | "success" | "warning" | "error" {
  switch (status) {
    case "pending":
      return "warning";
    case "in_progress":
      return "primary";
    case "completed":
      return "success";
    case "expired":
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

export function DocumentReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  // State
  const [review, setReview] = useState<DocumentReview | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Computed values
  const isReviewer = user?.id === review?.reviewer_id;
  const canApprove =
    isReviewer &&
    review?.access_level === "approve" &&
    review?.review_type !== "feedback";
  const canComment =
    isReviewer &&
    ["comment", "suggest", "approve"].includes(review?.access_level || "");
  const isCompleted =
    review?.status === "completed" || review?.status === "cancelled";
  const overdue = isOverdue(
    review?.due_date || null,
    review?.status || "pending"
  );

  /**
   * Fetch review data and document
   */
  const fetchReviewData = useCallback(async () => {
    if (!user || !reviewId) return;

    setLoading(true);
    try {
      // Fetch review details
      const reviewResult = await reviewService.getReviewById(user.id, reviewId);
      if (reviewResult.error || !reviewResult.data) {
        handleError(
          new Error(reviewResult.error?.message || "Review not found")
        );
        navigate("/ai/reviews");
        return;
      }

      setReview(reviewResult.data);

      // Fetch full document data if review has document_id
      // Uses Supabase directly so RLS can check reviewer access via auth.uid()
      if (reviewResult.data.document_id) {
        console.log(
          "[DocumentReviewPage] Fetching document:",
          reviewResult.data.document_id
        );

        const { data: docData, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", reviewResult.data.document_id)
          .single();

        console.log("[DocumentReviewPage] Document result:", {
          data: docData,
          error: docError,
        });

        if (docData && !docError) {
          setDocument(docData as unknown as Document);
        } else {
          // Document might not be accessible or doesn't exist
          console.warn(
            "[DocumentReviewPage] Could not fetch document:",
            docError?.message
          );
        }
      }

      // Mark review as in_progress if pending and user is reviewer
      if (
        reviewResult.data.status === "pending" &&
        user.id === reviewResult.data.reviewer_id
      ) {
        await reviewService.updateReviewStatus(
          user.id,
          reviewId,
          "in_progress"
        );
        setReview((prev) =>
          prev ? { ...prev, status: "in_progress" as ReviewStatus } : prev
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user, reviewId, handleError, navigate]);

  /**
   * Fetch comments for the review
   */
  const fetchComments = useCallback(async () => {
    if (!user || !reviewId) return;

    setCommentsLoading(true);
    try {
      const result = await reviewService.getReviewComments(user.id, reviewId, {
        includeResolved: true,
      });
      if (result.data) {
        setComments(result.data);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setCommentsLoading(false);
    }
  }, [user, reviewId, handleError]);

  // Initial load
  useEffect(() => {
    fetchReviewData();
  }, [fetchReviewData]);

  // Load comments when review is loaded
  useEffect(() => {
    if (review) {
      fetchComments();
    }
  }, [review, fetchComments]);

  /**
   * Handle adding a new comment
   */
  const handleAddComment = async (
    text: string,
    type: ReviewComment["comment_type"] = "comment",
    parentId?: string
  ) => {
    if (!user || !reviewId) return;

    try {
      const result = await reviewService.addComment(user.id, {
        reviewId,
        commentText: text,
        commentType: type,
        parentCommentId: parentId,
      });

      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      // Refresh comments to show new one
      await fetchComments();
      showSuccess("Comment added");
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Handle resolving a comment
   */
  const handleResolveComment = async (commentId: string, note?: string) => {
    if (!user) return;

    try {
      const result = await reviewService.resolveComment(
        user.id,
        commentId,
        note
      );
      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      await fetchComments();
      showSuccess("Comment resolved");
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Handle approving the document
   */
  const handleApprove = async (note: string) => {
    if (!user || !reviewId) return;

    try {
      const result = await reviewService.approveDocument(
        user.id,
        reviewId,
        note
      );
      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      setReview((prev) =>
        prev
          ? {
              ...prev,
              status: "completed" as ReviewStatus,
              is_approved: true,
              approval_note: note,
            }
          : prev
      );
      showSuccess("Document approved!");
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Handle requesting changes
   */
  const handleRequestChanges = async (note: string) => {
    if (!user || !reviewId) return;

    try {
      const result = await reviewService.requestChanges(
        user.id,
        reviewId,
        note
      );
      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      setReview((prev) =>
        prev
          ? {
              ...prev,
              status: "completed" as ReviewStatus,
              is_approved: false,
              approval_note: note,
            }
          : prev
      );
      showSuccess("Changes requested");
    } catch (err) {
      handleError(err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, pt: 2 }}>
        <AutoBreadcrumbs />
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={40} width={300} />
          <Stack direction="row" spacing={3}>
            <Skeleton variant="rectangular" height={600} sx={{ flex: 2 }} />
            <Skeleton variant="rectangular" height={600} sx={{ flex: 1 }} />
          </Stack>
        </Stack>
      </Container>
    );
  }

  // Review not found
  if (!review) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, pt: 2 }}>
        <AutoBreadcrumbs />
        <Alert severity="error">
          Review not found or you don't have access to it.
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/ai/reviews")}
          sx={{ mt: 2 }}
        >
          Back to Reviews
        </Button>
      </Container>
    );
  }

  // Compute unresolved comment count
  const unresolvedCount = comments.filter((c) => !c.is_resolved).length;

  return (
    <Container maxWidth="xl" sx={{ py: 3, pt: 2 }}>
      <AutoBreadcrumbs />
      <Stack spacing={3}>
        {/* Header with breadcrumbs and actions */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Breadcrumbs sx={{ mb: 1 }}>
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => navigate("/ai")}
              >
                AI Workspace
              </Link>
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => navigate("/ai/reviews")}
              >
                Reviews
              </Link>
              <Typography color="text.primary">
                {review.document?.name || "Document Review"}
              </Typography>
            </Breadcrumbs>

            <Typography variant="h4" gutterBottom>
              {review.document?.name || "Document Review"}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={review.status.replace("_", " ").toUpperCase()}
                color={getStatusColor(review.status)}
                size="small"
              />
              <Chip
                label={review.review_type.replace("_", " ")}
                variant="outlined"
                size="small"
              />
              {review.due_date && (
                <Chip
                  icon={<DeadlineIcon />}
                  label={formatDate(review.due_date)}
                  color={overdue ? "error" : "default"}
                  variant="outlined"
                  size="small"
                />
              )}
              {unresolvedCount > 0 && (
                <Chip
                  icon={<CommentIcon />}
                  label={`${unresolvedCount} unresolved`}
                  color="warning"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchReviewData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<CommentIcon />}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "Hide" : "Show"} Comments
            </Button>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate("/ai/reviews")}
            >
              Back
            </Button>
          </Stack>
        </Stack>

        {/* Overdue warning */}
        {overdue && (
          <Alert severity="warning">
            This review is overdue. Please complete it as soon as possible.
          </Alert>
        )}

        {/* Approval result banner */}
        {isCompleted && review.is_approved !== null && (
          <Alert
            severity={review.is_approved ? "success" : "info"}
            icon={review.is_approved ? <ApproveIcon /> : <RejectIcon />}
          >
            <Typography variant="subtitle1">
              {review.is_approved ? "Document Approved" : "Changes Requested"}
            </Typography>
            {review.approval_note && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {review.approval_note}
              </Typography>
            )}
          </Alert>
        )}

        {/* Main content area */}
        <Stack direction="row" spacing={3}>
          {/* Document preview */}
          <Paper
            sx={{
              flex: 2,
              p: 3,
              minHeight: 600,
              overflow: "auto",
            }}
          >
            {document ? (
              <DocumentPreview document={document} />
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography color="text.secondary">
                  Document content not available
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Review sidebar */}
          {sidebarOpen && (
            <Box sx={{ flex: 1, minWidth: 350, maxWidth: 450 }}>
              <Stack spacing={2}>
                {/* Request message from owner */}
                {review.request_message && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Message from {review.owner?.full_name || "Owner"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {review.request_message}
                    </Typography>
                  </Paper>
                )}

                {/* Approval workflow for reviewers */}
                {canApprove && !isCompleted && (
                  <ApprovalWorkflow
                    review={review}
                    onApprove={handleApprove}
                    onRequestChanges={handleRequestChanges}
                  />
                )}

                <Divider />

                {/* Comments sidebar */}
                <ReviewSidebar
                  comments={comments}
                  loading={commentsLoading}
                  canComment={canComment && !isCompleted}
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                  onRefresh={fetchComments}
                />
              </Stack>
            </Box>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}

export default DocumentReviewPage;
