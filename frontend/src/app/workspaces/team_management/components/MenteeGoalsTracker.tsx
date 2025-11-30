/**
 * MENTEE GOALS TRACKER COMPONENT (UC-109)
 *
 * Purpose:
 * - Display and track mentee goal progress
 * - Show weekly application targets and milestones
 * - Display deadline tracking and achievement status
 * - Provide recommendations for catching up on goals
 *
 * Used by:
 * - MentorDashboard for goal overview
 * - Mentee detail views for full goal management
 */

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  IconButton,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Collapse,
  Divider,
} from "@mui/material";
import {
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Code as CodeIcon,
  Star as StarIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import type { MenteeGoal, CreateGoalData } from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface MenteeGoalsTrackerProps {
  candidateId: string;
  candidateName: string;
  teamId: string;
  goals: MenteeGoal[];
  onCreateGoal: (data: CreateGoalData) => Promise<void>;
  onUpdateGoal?: (
    goalId: string,
    updates: Partial<MenteeGoal>
  ) => Promise<void>;
  loading?: boolean;
}

type GoalType = CreateGoalData["goalType"];
type GoalStatus = MenteeGoal["status"];

// ============================================================================
// CONSTANTS
// ============================================================================

const GOAL_TYPES: {
  value: GoalType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "weekly_applications",
    label: "Weekly Applications",
    icon: <WorkIcon />,
  },
  {
    value: "monthly_applications",
    label: "Monthly Applications",
    icon: <WorkIcon />,
  },
  {
    value: "interview_prep",
    label: "Interview Preparation",
    icon: <SchoolIcon />,
  },
  { value: "resume_update", label: "Resume Update", icon: <DescriptionIcon /> },
  { value: "networking", label: "Networking", icon: <PeopleIcon /> },
  {
    value: "skill_development",
    label: "Skill Development",
    icon: <CodeIcon />,
  },
  { value: "custom", label: "Custom Goal", icon: <StarIcon /> },
];

const STATUS_CONFIG: Record<
  GoalStatus,
  {
    color: "success" | "warning" | "error" | "default";
    label: string;
    icon: React.ReactNode;
  }
> = {
  active: { color: "warning", label: "In Progress", icon: <TimerIcon /> },
  completed: {
    color: "success",
    label: "Completed",
    icon: <CheckCircleIcon />,
  },
  missed: { color: "error", label: "Missed", icon: <CancelIcon /> },
  cancelled: { color: "default", label: "Cancelled", icon: <CancelIcon /> },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getGoalTypeConfig(type: string) {
  return (
    GOAL_TYPES.find((t) => t.value === type) || {
      value: "custom",
      label: "Custom",
      icon: <StarIcon />,
    }
  );
}

function getDaysRemaining(dueDate: string | undefined): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getProgressColor(
  current: number,
  target: number | undefined,
  daysRemaining: number | null
): "success" | "warning" | "error" | "info" {
  if (!target) return "info";

  const percentComplete = (current / target) * 100;

  if (percentComplete >= 100) return "success";
  if (daysRemaining !== null && daysRemaining <= 0) return "error";
  if (daysRemaining !== null && daysRemaining <= 2 && percentComplete < 50)
    return "warning";
  if (percentComplete >= 75) return "success";
  if (percentComplete >= 50) return "info";
  return "warning";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MenteeGoalsTracker({
  candidateId,
  candidateName,
  teamId,
  goals,
  onCreateGoal,
  onUpdateGoal,
}: MenteeGoalsTrackerProps) {
  // State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateGoalData>>({
    goalType: "weekly_applications",
    title: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter goals by status
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const missedGoals = goals.filter((g) => g.status === "missed");

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.title) return;

    setSubmitting(true);
    try {
      await onCreateGoal({
        candidateId,
        teamId,
        goalType: formData.goalType || "custom",
        title: formData.title,
        description: formData.description,
        targetValue: formData.targetValue,
        dueDate: formData.dueDate,
      });
      setShowAddDialog(false);
      setFormData({
        goalType: "weekly_applications",
        title: "",
        description: "",
      });
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle goal status update
  const handleStatusChange = async (goalId: string, status: GoalStatus) => {
    if (!onUpdateGoal) return;
    await onUpdateGoal(goalId, { status });
  };

  // Render a single goal item
  const renderGoalItem = (goal: MenteeGoal) => {
    const typeConfig = getGoalTypeConfig(goal.goalType);
    const statusConfig = STATUS_CONFIG[goal.status];
    const daysRemaining = getDaysRemaining(goal.dueDate);
    const progressPercent = goal.targetValue
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : null;
    const progressColor = getProgressColor(
      goal.currentValue,
      goal.targetValue,
      daysRemaining
    );

    return (
      <ListItem
        key={goal.id}
        sx={{
          flexDirection: "column",
          alignItems: "stretch",
          py: 2,
          px: 0,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2} width="100%">
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {typeConfig.icon}
          </Box>

          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="subtitle2">{goal.title}</Typography>
              <Chip
                icon={statusConfig.icon as React.ReactElement}
                label={statusConfig.label}
                size="small"
                color={statusConfig.color}
                variant="outlined"
              />
            </Stack>

            {goal.description && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                {goal.description}
              </Typography>
            )}

            {/* Progress bar for goals with target values */}
            {goal.targetValue && (
              <Box mb={1}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress: {goal.currentValue} / {goal.targetValue}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {progressPercent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent ?? 0}
                  color={progressColor}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            )}

            {/* Due date and days remaining */}
            {goal.dueDate && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimerIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Due: {new Date(goal.dueDate).toLocaleDateString()}
                </Typography>
                {daysRemaining !== null && goal.status === "active" && (
                  <Chip
                    size="small"
                    label={
                      daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : daysRemaining === 0
                        ? "Due today"
                        : `${daysRemaining} days left`
                    }
                    color={
                      daysRemaining < 0
                        ? "error"
                        : daysRemaining <= 2
                        ? "warning"
                        : "default"
                    }
                    variant="outlined"
                  />
                )}
              </Stack>
            )}
          </Box>

          {/* Action buttons for active goals */}
          {goal.status === "active" && onUpdateGoal && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Mark as Complete">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleStatusChange(goal.id, "completed")}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as Missed">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleStatusChange(goal.id, "missed")}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </ListItem>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <FlagIcon color="primary" />
            <Box>
              <Typography variant="h6">Goals for {candidateName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {activeGoals.length} active, {completedGoals.length} completed
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Goal
          </Button>
        </Stack>

        {/* Recommendations for inactive or struggling mentees */}
        {missedGoals.length > 0 && (
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>{candidateName}</strong> has {missedGoals.length} missed
              goal
              {missedGoals.length > 1 ? "s" : ""}. Consider scheduling a
              check-in to discuss obstacles and adjust targets.
            </Typography>
          </Alert>
        )}

        {/* Active Goals */}
        {activeGoals.length === 0 ? (
          <Box textAlign="center" py={3}>
            <FlagIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">No active goals</Typography>
            <Typography variant="body2" color="text.secondary">
              Set goals to help track progress and stay accountable.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {activeGoals.map((goal, index) => (
              <Box key={goal.id}>
                {index > 0 && <Divider />}
                {renderGoalItem(goal)}
              </Box>
            ))}
          </List>
        )}

        {/* Completed Goals (Collapsible) */}
        {completedGoals.length > 0 && (
          <>
            <Divider />
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: "pointer" }}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Completed Goals ({completedGoals.length})
                </Typography>
                <IconButton size="small">
                  <ExpandMoreIcon
                    sx={{
                      transform: showCompleted
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </IconButton>
              </Stack>

              <Collapse in={showCompleted}>
                <List disablePadding>
                  {completedGoals.map((goal, index) => (
                    <Box key={goal.id}>
                      {index > 0 && <Divider />}
                      {renderGoalItem(goal)}
                    </Box>
                  ))}
                </List>
              </Collapse>
            </Box>
          </>
        )}
      </Stack>

      {/* Add Goal Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Goal for {candidateName}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Goal Type</InputLabel>
              <Select
                value={formData.goalType || "weekly_applications"}
                label="Goal Type"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    goalType: e.target.value as GoalType,
                  }))
                }
              >
                {GOAL_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {type.icon}
                      <span>{type.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Goal Title"
              fullWidth
              value={formData.title || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Apply to 10 jobs this week"
            />

            <TextField
              label="Description (optional)"
              multiline
              rows={2}
              fullWidth
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Additional details or criteria..."
            />

            <TextField
              label="Target Value (optional)"
              type="number"
              fullWidth
              value={formData.targetValue || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetValue: parseInt(e.target.value) || undefined,
                }))
              }
              placeholder="e.g., 10"
              helperText="Numeric target for tracking progress (e.g., number of applications)"
            />

            <TextField
              label="Due Date (optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.title || submitting}
          >
            {submitting ? "Creating..." : "Create Goal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MenteeGoalsTracker;
