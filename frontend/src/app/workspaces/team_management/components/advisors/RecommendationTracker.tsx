/**
 * UC-115: External Advisor and Coach Integration
 * Component for tracking and managing advisor recommendations
 */

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  Checkbox,
  TextField,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useState } from "react";

import type {
  AdvisorRecommendation,
  UpdateRecommendationData,
} from "../../types/advisor.types";
import {
  RECOMMENDATION_CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  RECOMMENDATION_STATUS_LABELS,
  RECOMMENDATION_STATUS_COLORS,
} from "../../types/advisor.types";

interface RecommendationTrackerProps {
  recommendation: AdvisorRecommendation;
  onUpdate?: (id: string, data: UpdateRecommendationData) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onMarkImplemented?: (
    id: string,
    impact?: string,
    rating?: number
  ) => Promise<boolean>;
}

/**
 * Card component for displaying and tracking a single recommendation
 * Shows progress, allows status updates, and step completion
 */
export function RecommendationTracker({
  recommendation,
  onUpdate,
  onDelete,
  onMarkImplemented,
}: RecommendationTrackerProps) {
  // State
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(
    recommendation.progress_notes ?? ""
  );

  const menuOpen = Boolean(menuAnchor);

  // Calculate progress from implementation steps
  const steps = recommendation.implementation_steps ?? [];
  const completedSteps = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Handle step toggle
  const handleStepToggle = async (stepId: string) => {
    if (!onUpdate) return;

    const updatedSteps = steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            completed: !step.completed,
            completed_at: !step.completed
              ? new Date().toISOString()
              : undefined,
          }
        : step
    );

    await onUpdate(recommendation.id, {
      implementation_steps: updatedSteps,
      // If all steps completed, suggest implementing
      status:
        updatedSteps.every((s) => s.completed) &&
        recommendation.status === "in_progress"
          ? "implemented"
          : recommendation.status === "pending" &&
            updatedSteps.some((s) => s.completed)
          ? "in_progress"
          : undefined,
    });
  };

  // Handle status change to in-progress
  const handleStartProgress = async () => {
    handleMenuClose();
    if (onUpdate) {
      await onUpdate(recommendation.id, { status: "in_progress" });
    }
  };

  // Handle mark as implemented
  const handleMarkImplemented = async () => {
    handleMenuClose();
    if (onMarkImplemented) {
      await onMarkImplemented(recommendation.id);
    }
  };

  // Handle notes save
  const handleSaveNotes = async () => {
    if (onUpdate) {
      await onUpdate(recommendation.id, { progress_notes: notesValue });
      setEditingNotes(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    handleMenuClose();
    if (onDelete) {
      await onDelete(recommendation.id);
    }
  };

  // Check if recommendation is actionable
  const isActionable = ["pending", "in_progress"].includes(
    recommendation.status
  );

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {recommendation.title}
            </Typography>
            {recommendation.advisor && (
              <Typography variant="body2" color="text.secondary">
                from {recommendation.advisor.advisor_name}
                {recommendation.session?.title &&
                  ` • ${recommendation.session.title}`}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={RECOMMENDATION_CATEGORY_LABELS[recommendation.category]}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<FlagIcon />}
              label={PRIORITY_LABELS[recommendation.priority]}
              size="small"
              color={PRIORITY_COLORS[recommendation.priority]}
            />
            <Chip
              label={RECOMMENDATION_STATUS_LABELS[recommendation.status]}
              size="small"
              color={RECOMMENDATION_STATUS_COLORS[recommendation.status]}
            />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ mt: 2 }}>
          {recommendation.description}
        </Typography>

        {/* Target Date */}
        {recommendation.target_date && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Target:{" "}
              {new Date(recommendation.target_date).toLocaleDateString()}
            </Typography>
          </Stack>
        )}

        {/* Progress Bar (if has steps) */}
        {steps.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedSteps} / {steps.length} steps
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 1 }}
              color={progress === 100 ? "success" : "primary"}
            />
          </Box>
        )}

        {/* Expandable Steps Section */}
        {steps.length > 0 && (
          <>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mt: 1 }}
            >
              {expanded ? "Hide Steps" : "Show Steps"}
            </Button>

            <Collapse in={expanded}>
              <List dense sx={{ mt: 1 }}>
                {steps.map((step) => (
                  <ListItem key={step.id} disablePadding>
                    <ListItemButton
                      onClick={() => isActionable && handleStepToggle(step.id)}
                      disabled={!isActionable}
                    >
                      <Checkbox
                        edge="start"
                        checked={step.completed}
                        tabIndex={-1}
                        disableRipple
                        disabled={!isActionable}
                      />
                      <ListItemText
                        primary={step.title}
                        secondary={step.description}
                        sx={{
                          textDecoration: step.completed
                            ? "line-through"
                            : "none",
                          color: step.completed
                            ? "text.disabled"
                            : "text.primary",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Progress Notes */}
        {isActionable && (
          <Box sx={{ mt: 2 }}>
            {editingNotes ? (
              <Stack spacing={1}>
                <TextField
                  label="Progress Notes"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={handleSaveNotes}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesValue(recommendation.progress_notes ?? "");
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "grey.100" },
                }}
                onClick={() => setEditingNotes(true)}
              >
                <Typography variant="body2" color="text.secondary">
                  {recommendation.progress_notes ||
                    "Click to add progress notes..."}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Impact (for completed recommendations) */}
        {recommendation.status === "implemented" &&
          recommendation.actual_impact && (
            <Box
              sx={{ mt: 2, p: 1.5, bgcolor: "success.light", borderRadius: 1 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  Impact: {recommendation.actual_impact}
                  {recommendation.impact_rating &&
                    ` (${recommendation.impact_rating}/5)`}
                </Typography>
              </Stack>
            </Box>
          )}
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {recommendation.status === "pending" && onUpdate && (
          <MenuItem onClick={handleStartProgress}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Working</ListItemText>
          </MenuItem>
        )}
        {isActionable && onMarkImplemented && (
          <MenuItem onClick={handleMarkImplemented}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Mark as Implemented</ListItemText>
          </MenuItem>
        )}
        {onUpdate && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setEditingNotes(true);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Notes</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

export default RecommendationTracker;
