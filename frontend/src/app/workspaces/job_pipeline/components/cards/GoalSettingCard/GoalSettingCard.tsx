/**
 * GoalSettingCard Component
 * Sprint 3 - UC-101: Goal Setting and Achievement Tracking
 *
 * Comprehensive career goal management with SMART framework:
 * - Create and track SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
 * - Monitor progress with visual indicators
 * - Milestone tracking with celebration features
 * - AI-powered insights and recommendations
 * - Goal impact analytics on job search success
 */

import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useAuth } from "@shared/context/AuthContext";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsAnalytics,
} from "@shared/services/dbMappers";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

// ====================================================================
// TYPE DEFINITIONS
// ====================================================================

interface CareerGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  timeframe: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  completion_date: string | null;
  milestones: Milestone[];
  notes: string | null;
  motivation_notes: string | null;
  is_shared: boolean;
  reminder_frequency: string | null;
  progress_percentage: number;
  days_remaining: number;
  days_elapsed: number;
  is_on_track: boolean;
  next_milestone: Milestone | null;
  achievements: Achievement[];
  celebration_message: string | null;
}

interface Milestone {
  id: string;
  title: string;
  target_value: number;
  completed: boolean;
  completed_at: string | null;
}

interface Achievement {
  milestone: string;
  achieved_at: string;
  message: string;
  progress_at_achievement: number;
}

interface GoalAnalytics {
  summary: {
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    on_track: number;
    behind_schedule: number;
    avg_progress: number;
    completed_this_month: number;
  };
  insights: string[];
  recommendations: string[];
  impact: {
    total_applications: number;
    interview_stage_count: number;
    goals_driving_action: boolean;
  };
}

// Goal categories with display labels
const GOAL_CATEGORIES = [
  { value: "application_volume", label: "Application Volume" },
  { value: "interview_success", label: "Interview Success" },
  { value: "skill_development", label: "Skill Development" },
  { value: "networking", label: "Networking" },
  { value: "salary_target", label: "Salary Target" },
  { value: "career_advancement", label: "Career Advancement" },
  { value: "work_life_balance", label: "Work-Life Balance" },
  { value: "custom", label: "Custom" },
];

const TIMEFRAMES = [
  { value: "short_term", label: "Short-term (1-3 months)" },
  { value: "medium_term", label: "Medium-term (3-6 months)" },
  { value: "long_term", label: "Long-term (6-12 months)" },
];

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export default function GoalSettingCard() {
  const { user, session } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "application_volume" as string,
    timeframe: "short_term" as string,
    target_value: 10,
    current_value: 0,
    unit: "applications",
    start_date: new Date().toISOString().split("T")[0],
    target_date: "",
    notes: "",
    motivation_notes: "",
    is_shared: false,
    reminder_frequency: "weekly" as string,
    success_metrics: {
      applications_sent: 0,
      interviews_scheduled: 0,
      offers_received: 0,
    },
    milestones: [] as { id: string; title: string; target_value: number }[],
  });

  // Load goals and analytics on mount
  useEffect(() => {
    if (!user || !session?.access_token) return;
    loadGoalsData();
  }, [user, session?.access_token]);

  async function loadGoalsData() {
    if (!user || !session?.access_token) return;

    setLoading(true);
    try {
      // Load active goals
      const goalsResult = await getGoals(user.id, session.access_token, {
        status: "active",
      });

      if (goalsResult.error) {
        handleError(goalsResult.error.message);
      } else {
        const fetchedGoals = (goalsResult.data as any)?.goals || [];
        setGoals(fetchedGoals);
      }

      // Load analytics
      const analyticsResult = await getGoalsAnalytics(
        user.id,
        session.access_token
      );

      if (analyticsResult.error) {
        console.error("Analytics error:", analyticsResult.error);
      } else {
        setAnalytics((analyticsResult.data as any) || null);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingGoal(null);
    setForm({
      title: "",
      description: "",
      category: "application_volume",
      timeframe: "short_term",
      target_value: 10,
      current_value: 0,
      unit: "applications",
      start_date: new Date().toISOString().split("T")[0],
      target_date: "",
      notes: "",
      motivation_notes: "",
      is_shared: false,
      reminder_frequency: "weekly",
      success_metrics: {
        applications_sent: 0,
        interviews_scheduled: 0,
        offers_received: 0,
      },
      milestones: [],
    });
    setDialogOpen(true);
  }

  function openEditDialog(goal: CareerGoal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      timeframe: goal.timeframe,
      target_value: goal.target_value,
      current_value: goal.current_value,
      unit: goal.unit,
      start_date: goal.start_date,
      target_date: goal.target_date,
      notes: goal.notes || "",
      motivation_notes: goal.motivation_notes || "",
      is_shared: goal.is_shared || false,
      reminder_frequency: goal.reminder_frequency || "weekly",
      success_metrics: (goal as any).success_metrics || {
        applications_sent: 0,
        interviews_scheduled: 0,
        offers_received: 0,
      },
      milestones: goal.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        target_value: m.target_value,
      })),
    });
    setDialogOpen(true);
  }

  async function handleSaveGoal() {
    if (!user || !session?.access_token) {
      return;
    }

    try {
      if (editingGoal) {
        const updatePayload = {
          title: form.title,
          description: form.description,
          category: form.category,
          timeframe: form.timeframe,
          target_value: form.target_value,
          target_date: form.target_date,
          unit: form.unit,
          notes: form.notes,
          is_shared: form.is_shared,
          reminder_frequency: form.reminder_frequency,
          success_metrics: form.success_metrics,
          milestones: form.milestones,
        };

        // Update existing goal
        const result = await updateGoal(
          user.id,
          session.access_token,
          editingGoal.id,
          updatePayload
        );

        if (result.error) {
          handleError(result.error.message);
        } else {
          showSuccess("Goal updated successfully!");
          setDialogOpen(false);
          loadGoalsData();
        }
      } else {
        // Create new goal
        const result = await createGoal(user.id, session.access_token, {
          title: form.title,
          description: form.description,
          category: form.category,
          timeframe: form.timeframe,
          target_value: form.target_value,
          current_value: form.current_value,
          unit: form.unit,
          start_date: form.start_date,
          target_date: form.target_date,
          notes: form.notes,
          motivation_notes: form.motivation_notes,
          is_shared: form.is_shared,
          reminder_frequency: form.reminder_frequency,
          success_metrics: form.success_metrics,
          milestones: form.milestones,
        });

        if (result.error) {
          handleError(result.error.message);
        } else {
          showSuccess("Goal created successfully!");
          setDialogOpen(false);
          loadGoalsData();
        }
      }
    } catch (err: any) {
      handleError(err.message);
    }
  }

  async function handleUpdateProgress(goalId: string, newValue: number) {
    if (!user || !session?.access_token) return;

    try {
      const result = await updateGoal(user.id, session.access_token, goalId, {
        current_value: newValue,
      });

      if (result.error) {
        handleError(result.error.message);
      } else {
        const updatedGoal = (result.data as any)?.goal;

        // Check for celebrations
        if (updatedGoal?.celebration_message) {
          showSuccess(updatedGoal.celebration_message);
        } else if (
          updatedGoal?.achievements &&
          updatedGoal.achievements.length > 0
        ) {
          // Show latest achievement
          const latest =
            updatedGoal.achievements[updatedGoal.achievements.length - 1];
          showSuccess(latest.message);
        } else {
          showSuccess("Progress updated!");
        }

        loadGoalsData();
      }
    } catch (err: any) {
      handleError(err.message);
    }
  }

  function handleExportGoal(goal: CareerGoal) {
    // Create shareable text format
    const shareText = `
🎯 Career Goal: ${goal.title}
${goal.description ? `\n${goal.description}\n` : ""}
📊 Progress: ${goal.current_value}/${goal.target_value} ${goal.unit} (${
      goal.progress_percentage
    }%)
${goal.is_on_track ? "✅" : "⚠️"} Status: ${
      goal.is_on_track ? "On Track" : "Behind Schedule"
    }
📅 Timeline: ${new Date(goal.start_date).toLocaleDateString()} - ${new Date(
      goal.target_date
    ).toLocaleDateString()}
⏰ Days Remaining: ${goal.days_remaining}

${
  goal.milestones.length > 0
    ? `🎯 Milestones:\n${goal.milestones
        .map(
          (m) => `  ${m.completed ? "✅" : "⭕"} ${m.title} (${m.target_value})`
        )
        .join("\n")}\n`
    : ""
}
${
  goal.achievements?.length > 0
    ? `\n🏆 Achievements: ${goal.achievements.length}\n`
    : ""
}
${
  (goal as any).success_metrics?.applications_sent > 0
    ? `\n📈 Impact:\n  • Applications: ${
        (goal as any).success_metrics.applications_sent
      }\n  • Interviews: ${
        (goal as any).success_metrics.interviews_scheduled
      }\n  • Offers: ${(goal as any).success_metrics.offers_received}\n`
    : ""
}
---
Exported from FlowATS Career Goals
${new Date().toLocaleDateString()}
    `.trim();

    // Create downloadable file
    const blob = new Blob([shareText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goal-${goal.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also copy to clipboard
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        showSuccess("Goal exported to file and copied to clipboard!");
      })
      .catch(() => {
        showSuccess("Goal exported to file!");
      });
  }

  async function handleDeleteGoal(goalId: string) {
    if (!user || !session?.access_token) return;
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const result = await deleteGoal(user.id, session.access_token, goalId);

      if (result.error) {
        handleError(result.error.message);
      } else {
        showSuccess("Goal deleted");
        loadGoalsData();
      }
    } catch (err: any) {
      handleError(err.message);
    }
  }

  function addMilestone() {
    setForm({
      ...form,
      milestones: [
        ...form.milestones,
        {
          id: `milestone-${Date.now()}`,
          title: "",
          target_value: 0,
        },
      ],
    });
  }

  function updateMilestone(
    index: number,
    field: string,
    value: string | number
  ) {
    const updated = [...form.milestones];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, milestones: updated });
  }

  function removeMilestone(index: number) {
    setForm({
      ...form,
      milestones: form.milestones.filter((_, i) => i !== index),
    });
  }

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <FlagIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Career Goals & Achievement Tracking
        </Typography>
        <Chip label="SMART Goals" size="small" color="primary" />
      </Box>

      {/* Summary Statistics */}
      {analytics && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 2,
              mb: 2,
            }}
          >
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", p: 1.5 }}>
                <Typography variant="h4" color="primary">
                  {analytics.summary.active_goals}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Goals
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", p: 1.5 }}>
                <Typography variant="h4" color="success.main">
                  {analytics.summary.completed_goals}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", p: 1.5 }}>
                <Typography variant="h4" color="info.main">
                  {analytics.summary.avg_progress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Progress
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", p: 1.5 }}>
                <Typography variant="h4" color="warning.main">
                  {analytics.summary.on_track}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  On Track
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Action Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          fullWidth
        >
          Create New Goal
        </Button>
      </Box>

      {/* Goals List */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="text.secondary">Loading goals...</Typography>
        </Box>
      ) : goals.length === 0 ? (
        <Alert severity="info">
          No active goals yet. Create your first SMART goal to start tracking
          your career progress!
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          {goals.map((goal) => (
            <Card key={goal.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                {/* Goal Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {goal.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                      <Chip
                        label={
                          GOAL_CATEGORIES.find((c) => c.value === goal.category)
                            ?.label
                        }
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={
                          goal.is_on_track ? "On Track" : "Behind Schedule"
                        }
                        size="small"
                        color={goal.is_on_track ? "success" : "warning"}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleExportGoal(goal)}
                      title="Export/Share Goal"
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(goal)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2">
                      Progress: {goal.current_value} / {goal.target_value}{" "}
                      {goal.unit}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      {goal.progress_percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, goal.progress_percentage)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {goal.days_remaining} days remaining
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Progress Update */}
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <TextField
                    size="small"
                    type="number"
                    defaultValue={goal.current_value}
                    label="Update Progress"
                    sx={{ flex: 1 }}
                    inputProps={{ min: 0, max: goal.target_value }}
                    id={`progress-input-${goal.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.target as HTMLInputElement;
                        handleUpdateProgress(goal.id, Number(input.value));
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const input = document.getElementById(
                        `progress-input-${goal.id}`
                      ) as HTMLInputElement;
                      if (input) {
                        handleUpdateProgress(goal.id, Number(input.value));
                      }
                    }}
                  >
                    Update
                  </Button>
                </Box>

                {/* Next Milestone */}
                {goal.next_milestone && (
                  <Alert severity="info" icon={<TrophyIcon />} sx={{ mt: 2 }}>
                    Next milestone: {goal.next_milestone.title} (
                    {goal.next_milestone.target_value} {goal.unit})
                  </Alert>
                )}

                {/* Celebration Message */}
                {goal.celebration_message && (
                  <Alert
                    severity="success"
                    icon={<TrophyIcon />}
                    sx={{ mt: 2 }}
                  >
                    {goal.celebration_message}
                  </Alert>
                )}

                {/* Progress Adjustment Recommendations */}
                {goal.motivation_notes && (
                  <Alert
                    severity={goal.is_on_track ? "success" : "warning"}
                    sx={{ mt: 2 }}
                  >
                    {goal.motivation_notes}
                  </Alert>
                )}

                {/* Achievements Display */}
                {goal.achievements && goal.achievements.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      🏆 Recent Achievements
                    </Typography>
                    {goal.achievements
                      .slice(-3)
                      .reverse()
                      .map((achievement, idx) => (
                        <Alert
                          key={idx}
                          severity="info"
                          sx={{ mt: 1, py: 0.5 }}
                        >
                          {achievement.message}
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {new Date(
                              achievement.achieved_at
                            ).toLocaleDateString()}{" "}
                            • {achievement.progress_at_achievement.toFixed(0)}%
                            complete
                          </Typography>
                        </Alert>
                      ))}
                  </Box>
                )}

                {/* Accountability & Impact Tracking Info */}
                <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
                  {goal.is_shared && (
                    <Chip
                      icon={<span>🤝</span>}
                      label="Shared for Accountability"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {goal.reminder_frequency &&
                    goal.reminder_frequency !== "none" && (
                      <Chip
                        icon={<span>🔔</span>}
                        label={`${
                          goal.reminder_frequency.charAt(0).toUpperCase() +
                          goal.reminder_frequency.slice(1)
                        } Reminders`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  {(goal as any).success_metrics &&
                    ((goal as any).success_metrics.applications_sent > 0 ||
                      (goal as any).success_metrics.interviews_scheduled > 0 ||
                      (goal as any).success_metrics.offers_received > 0) && (
                      <Chip
                        icon={<span>📈</span>}
                        label={`Impact: ${
                          (goal as any).success_metrics.applications_sent
                        } apps • ${
                          (goal as any).success_metrics.interviews_scheduled
                        } interviews • ${
                          (goal as any).success_metrics.offers_received
                        } offers`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Insights & Recommendations */}
      {analytics && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            📊 Insights
          </Typography>
          <List dense>
            {analytics.insights.map((insight, i) => (
              <ListItem key={i}>
                <ListItemText primary={insight} />
              </ListItem>
            ))}
          </List>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            gutterBottom
            sx={{ mt: 2 }}
          >
            💡 Recommendations
          </Typography>
          <List dense>
            {analytics.recommendations.map((rec, i) => (
              <ListItem key={i}>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Create/Edit Goal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingGoal ? "Edit Goal" : "Create New Goal"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Goal Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              placeholder="e.g., Apply to 50 jobs"
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                select
                label="Category *"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Timeframe *"
                value={form.timeframe}
                onChange={(e) =>
                  setForm({ ...form, timeframe: e.target.value })
                }
              >
                {TIMEFRAMES.map((tf) => (
                  <MenuItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 2,
              }}
            >
              <TextField
                label="Target Value *"
                type="number"
                value={form.target_value}
                onChange={(e) =>
                  setForm({ ...form, target_value: Number(e.target.value) })
                }
              />

              <TextField
                label="Current Value"
                type="number"
                value={form.current_value}
                onChange={(e) =>
                  setForm({ ...form, current_value: Number(e.target.value) })
                }
              />

              <TextField
                label="Unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g., applications"
              />
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="Start Date *"
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Target Date *"
                type="date"
                value={form.target_date}
                onChange={(e) =>
                  setForm({ ...form, target_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Divider />

            {/* Accountability & Sharing */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🤝 Accountability & Reminders (Optional)
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_shared || false}
                    onChange={(e) =>
                      setForm({ ...form, is_shared: e.target.checked })
                    }
                  />
                }
                label="Share this goal for accountability"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ ml: 4, mt: -1, mb: 2 }}
              >
                ✨ Sharing goals increases commitment and success rate by 65%
              </Typography>

              <TextField
                select
                fullWidth
                size="small"
                label="Reminder Frequency"
                value={form.reminder_frequency || "weekly"}
                onChange={(e) =>
                  setForm({ ...form, reminder_frequency: e.target.value })
                }
                helperText="Get reminders to update your progress and stay on track"
              >
                <MenuItem value="daily">📅 Daily - Every day</MenuItem>
                <MenuItem value="weekly">📆 Weekly - Every week</MenuItem>
                <MenuItem value="biweekly">
                  🗓️ Bi-weekly - Every 2 weeks
                </MenuItem>
                <MenuItem value="monthly">📊 Monthly - Every month</MenuItem>
                <MenuItem value="none">🔕 None - No reminders</MenuItem>
              </TextField>
            </Box>

            <Divider />

            {/* Impact Tracking Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                📈 Impact Tracking (Optional)
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
              >
                Link this goal to your job applications to track how it impacts
                your job search success. Goals with tracked impact show 40%
                higher completion rates.
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mt: 2,
                }}
              >
                <TextField
                  size="small"
                  type="number"
                  label="Applications Sent"
                  helperText="During this goal"
                  inputProps={{ min: 0 }}
                  value={form.success_metrics.applications_sent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      success_metrics: {
                        ...form.success_metrics,
                        applications_sent: Number(e.target.value),
                      },
                    })
                  }
                />
                <TextField
                  size="small"
                  type="number"
                  label="Interviews"
                  helperText="Secured"
                  inputProps={{ min: 0 }}
                  value={form.success_metrics.interviews_scheduled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      success_metrics: {
                        ...form.success_metrics,
                        interviews_scheduled: Number(e.target.value),
                      },
                    })
                  }
                />
                <TextField
                  size="small"
                  type="number"
                  label="Offers"
                  helperText="Received"
                  inputProps={{ min: 0 }}
                  value={form.success_metrics.offers_received}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      success_metrics: {
                        ...form.success_metrics,
                        offers_received: Number(e.target.value),
                      },
                    })
                  }
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  💡 <strong>Pro Tip:</strong> Tracking these metrics helps you
                  understand which goals drive the best results. You can adjust
                  your strategy based on real data!
                </Typography>
              </Alert>
            </Box>

            <Divider />

            {/* Milestones Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🎯 Milestones (Optional)
              </Typography>
              {form.milestones.map((milestone, index) => (
                <Box
                  key={milestone.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr auto",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <TextField
                    size="small"
                    label="Milestone Title"
                    value={milestone.title}
                    onChange={(e) =>
                      updateMilestone(index, "title", e.target.value)
                    }
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Target Value"
                    value={milestone.target_value}
                    onChange={(e) =>
                      updateMilestone(
                        index,
                        "target_value",
                        Number(e.target.value)
                      )
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeMilestone(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addMilestone}
              >
                Add Milestone
              </Button>
            </Box>

            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            {!editingGoal && (
              <TextField
                label="Motivation Notes"
                value={form.motivation_notes}
                onChange={(e) =>
                  setForm({ ...form, motivation_notes: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                placeholder="Why is this goal important to you?"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveGoal}
            disabled={!form.title || !form.target_date}
          >
            {editingGoal ? "Update Goal" : "Create Goal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
