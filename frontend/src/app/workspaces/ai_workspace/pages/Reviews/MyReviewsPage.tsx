/**
 * MyReviewsPage (UC-110: Collaborative Document Review)
 *
 * Dashboard page showing all reviews for the current user.
 * Displays both incoming (to review) and outgoing (requested) reviews.
 *
 * Features:
 * - Tabs for incoming/outgoing reviews
 * - Filter by status (pending, in progress, completed)
 * - Sort by date or deadline
 * - Quick actions (open review, cancel)
 * - Overdue warnings
 * - Review statistics
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Stack,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  OpenInNew as OpenIcon,
  Cancel as CancelIcon,
  Warning as OverdueIcon,
  CheckCircle as ApprovedIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import * as reviewService from "../../services/reviewService";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import type {
  DocumentReview,
  ReviewStatus,
} from "../../services/reviewService";

// Tab panel component
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
      {value === index && children}
    </Box>
  );
}

// Helper to format dates
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Check if review is overdue
function isOverdue(review: DocumentReview): boolean {
  if (!review.due_date) return false;
  if (review.status === "completed" || review.status === "cancelled")
    return false;
  return new Date(review.due_date) < new Date();
}

// Get status chip color
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

export function MyReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [incomingReviews, setIncomingReviews] = useState<DocumentReview[]>([]);
  const [outgoingReviews, setOutgoingReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all reviews
   */
  const fetchReviews = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch incoming reviews (where user is reviewer)
      const incomingResult = await reviewService.getIncomingReviews(user.id);
      if (incomingResult.data) {
        setIncomingReviews(incomingResult.data);
      }

      // Fetch outgoing reviews (where user is owner)
      const outgoingResult = await reviewService.getOutgoingReviews(user.id);
      if (outgoingResult.data) {
        setOutgoingReviews(outgoingResult.data);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // Initial load
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /**
   * Open a review
   */
  const handleOpenReview = (reviewId: string) => {
    navigate(`/ai/reviews/${reviewId}`);
  };

  /**
   * Cancel a review (owner only)
   */
  const handleCancelReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const result = await reviewService.cancelReview(user.id, reviewId);
      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      showSuccess("Review cancelled");
      fetchReviews();
    } catch (err) {
      handleError(err);
    }
  };

  // Count stats
  const pendingIncoming = incomingReviews.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  ).length;
  const pendingOutgoing = outgoingReviews.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  ).length;
  const overdueCount = [...incomingReviews, ...outgoingReviews].filter(
    isOverdue
  ).length;

  // Render review table
  const renderReviewTable = (
    reviews: DocumentReview[],
    isIncoming: boolean
  ) => {
    if (loading) {
      return (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} />
          ))}
        </Stack>
      );
    }

    if (reviews.length === 0) {
      return (
        <Alert severity="info">
          {isIncoming
            ? "No reviews to complete. Check back later!"
            : "You haven't requested any reviews yet."}
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>{isIncoming ? "From" : "Reviewer"}</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((review) => {
              const overdue = isOverdue(review);
              const person = isIncoming ? review.owner : review.reviewer;

              return (
                <TableRow
                  key={review.id}
                  hover
                  sx={{
                    bgcolor: overdue ? "error.50" : undefined,
                    cursor: "pointer",
                  }}
                  onClick={() => handleOpenReview(review.id)}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight="medium">
                        {review.document?.name || "Unknown Document"}
                      </Typography>
                      {review.is_approved !== null && (
                        <Tooltip
                          title={
                            review.is_approved
                              ? "Approved"
                              : "Changes Requested"
                          }
                        >
                          <ApprovedIcon
                            fontSize="small"
                            color={review.is_approved ? "success" : "error"}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    {review.unresolved_comments > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {review.unresolved_comments} unresolved comments
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                      >
                        {person?.full_name?.charAt(0) || "?"}
                      </Avatar>
                      <Typography variant="body2">
                        {person?.full_name || "Unknown"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={review.review_type.replace("_", " ")}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={review.status.replace("_", " ")}
                      size="small"
                      color={getStatusColor(review.status)}
                    />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {overdue && (
                        <Tooltip title="Overdue!">
                          <OverdueIcon fontSize="small" color="error" />
                        </Tooltip>
                      )}
                      <Typography
                        variant="body2"
                        color={overdue ? "error" : "text.secondary"}
                      >
                        {formatDate(review.due_date)}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Open Review">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReview(review.id);
                          }}
                        >
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {!isIncoming &&
                        review.status !== "completed" &&
                        review.status !== "cancelled" && (
                          <Tooltip title="Cancel Review">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelReview(review.id);
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Document Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your document reviews and feedback requests
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReviews}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {/* Stats cards */}
        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <InboxIcon color="primary" />
              <Box>
                <Typography variant="h5">{pendingIncoming}</Typography>
                <Typography variant="body2" color="text.secondary">
                  To Review
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <OutboxIcon color="secondary" />
              <Box>
                <Typography variant="h5">{pendingOutgoing}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Requested
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {overdueCount > 0 && (
            <Paper sx={{ p: 2, flex: 1, bgcolor: "error.50" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <OverdueIcon color="error" />
                <Box>
                  <Typography variant="h5" color="error">
                    {overdueCount}
                  </Typography>
                  <Typography variant="body2" color="error">
                    Overdue
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>

        {/* Tabs */}
        <Paper>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              icon={<InboxIcon />}
              iconPosition="start"
              label={`To Review (${incomingReviews.length})`}
            />
            <Tab
              icon={<OutboxIcon />}
              iconPosition="start"
              label={`My Requests (${outgoingReviews.length})`}
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <TabPanel value={activeTab} index={0}>
              {renderReviewTable(incomingReviews, true)}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {renderReviewTable(outgoingReviews, false)}
            </TabPanel>
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
}

export default MyReviewsPage;
