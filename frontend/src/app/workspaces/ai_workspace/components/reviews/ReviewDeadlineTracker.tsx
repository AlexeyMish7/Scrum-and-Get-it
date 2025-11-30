/**
 * ReviewDeadlineTracker (UC-110: Collaborative Document Review)
 *
 * Component showing pending reviews with due dates and overdue warnings.
 * Can be used as a widget in dashboards or in the review sidebar.
 *
 * Features:
 * - List of upcoming review deadlines
 * - Visual indicators for overdue items
 * - Quick action to open review
 * - Countdown for urgent reviews
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Skeleton,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  AccessTime as DeadlineIcon,
  Warning as OverdueIcon,
  OpenInNew as OpenIcon,
  Assignment as ReviewIcon,
} from "@mui/icons-material";
import { differenceInDays, differenceInHours, isPast, format } from "date-fns";

import * as reviewService from "../../services/reviewService";
import { useAuth } from "@shared/context/AuthContext";
import type { DocumentReview } from "../../services/reviewService";

interface ReviewDeadlineTrackerProps {
  /** Maximum number of reviews to show */
  limit?: number;
  /** Only show overdue reviews */
  overdueOnly?: boolean;
  /** Title for the widget */
  title?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// Helper to format deadline text
function formatDeadline(dueDate: string | null): string {
  if (!dueDate) return "No deadline";

  const date = new Date(dueDate);
  const now = new Date();

  if (isPast(date)) {
    const daysOverdue = differenceInDays(now, date);
    if (daysOverdue === 0) {
      const hoursOverdue = differenceInHours(now, date);
      return `${hoursOverdue}h overdue`;
    }
    return `${daysOverdue}d overdue`;
  }

  const daysUntil = differenceInDays(date, now);
  if (daysUntil === 0) {
    const hoursUntil = differenceInHours(date, now);
    return `${hoursUntil}h left`;
  }
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 7) return `${daysUntil} days left`;

  return format(date, "MMM d");
}

// Get urgency level for styling
function getUrgencyLevel(
  dueDate: string | null
): "overdue" | "urgent" | "soon" | "normal" {
  if (!dueDate) return "normal";

  const date = new Date(dueDate);
  const now = new Date();

  if (isPast(date)) return "overdue";

  const daysUntil = differenceInDays(date, now);
  if (daysUntil <= 1) return "urgent";
  if (daysUntil <= 3) return "soon";

  return "normal";
}

// Get color based on urgency
function getUrgencyColor(
  urgency: "overdue" | "urgent" | "soon" | "normal"
): "error" | "warning" | "info" | "default" {
  switch (urgency) {
    case "overdue":
      return "error";
    case "urgent":
      return "warning";
    case "soon":
      return "info";
    default:
      return "default";
  }
}

export function ReviewDeadlineTracker({
  limit = 5,
  overdueOnly = false,
  title = "Review Deadlines",
  compact = false,
}: ReviewDeadlineTrackerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending reviews with deadlines
  useEffect(() => {
    async function fetchReviews() {
      if (!user) return;

      setLoading(true);
      try {
        if (overdueOnly) {
          const result = await reviewService.getOverdueReviews(user.id);
          if (result.data) {
            setReviews(result.data.slice(0, limit));
          }
        } else {
          const result = await reviewService.getIncomingReviews(user.id, {
            status: "pending",
            limit,
          });
          if (result.data) {
            // Filter to only those with deadlines and sort by due date
            const withDeadlines = result.data
              .filter((r) => r.due_date)
              .sort((a, b) => {
                if (!a.due_date || !b.due_date) return 0;
                return (
                  new Date(a.due_date).getTime() -
                  new Date(b.due_date).getTime()
                );
              });
            setReviews(withDeadlines);
          }
        }
      } catch (err) {
        console.error("Failed to fetch review deadlines:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [user, limit, overdueOnly]);

  const handleOpenReview = (reviewId: string) => {
    navigate(`/ai/reviews/${reviewId}`);
  };

  // Count overdue reviews
  const overdueCount = reviews.filter(
    (r) => r.due_date && isPast(new Date(r.due_date))
  ).length;

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={48} />
          ))}
        </Stack>
      </Paper>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box textAlign="center" py={2}>
          <DeadlineIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            {overdueOnly
              ? "No overdue reviews!"
              : "No pending review deadlines"}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: compact ? 1 : 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6">{title}</Typography>
        {overdueCount > 0 && (
          <Badge badgeContent={overdueCount} color="error">
            <OverdueIcon color="error" />
          </Badge>
        )}
      </Stack>

      <List dense={compact} disablePadding>
        {reviews.map((review) => {
          const urgency = getUrgencyLevel(review.due_date);
          const color = getUrgencyColor(urgency);

          return (
            <ListItem
              key={review.id}
              sx={{
                bgcolor: urgency === "overdue" ? "error.50" : undefined,
                borderRadius: 1,
                mb: 0.5,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => handleOpenReview(review.id)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {urgency === "overdue" ? (
                  <OverdueIcon color="error" />
                ) : (
                  <ReviewIcon color="action" />
                )}
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography variant="body2" noWrap>
                    {review.document?.name || "Document"}
                  </Typography>
                }
                secondary={
                  !compact && (
                    <Typography variant="caption" color="text.secondary">
                      From {review.owner?.full_name || "Unknown"}
                    </Typography>
                  )
                }
              />

              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={formatDeadline(review.due_date)}
                    color={color}
                    variant={urgency === "overdue" ? "filled" : "outlined"}
                    sx={{ minWidth: 80 }}
                  />
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
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>

      {reviews.length >= limit && (
        <Box textAlign="center" sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/ai/reviews")}
          >
            View all reviews →
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default ReviewDeadlineTracker;
