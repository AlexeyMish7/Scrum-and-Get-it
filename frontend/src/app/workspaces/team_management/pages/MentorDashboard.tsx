/**
 * MENTOR DASHBOARD PAGE (UC-109)
 *
 * Purpose:
 * - Specialized dashboard for mentors to coach and support mentees
 * - View mentee progress summary and key performance indicators
 * - Access mentee job search materials for review
 * - Provide feedback and recommendations
 * - Track mentee goals and engagement levels
 *
 * Acceptance Criteria:
 * - View mentee progress summary and KPIs
 * - Access mentee job search materials for review
 * - Provide feedback and recommendations
 * - Track mentee goal progress and achievements
 * - Generate coaching insights
 * - Communication tools for mentee interaction
 * - Monitor mentee engagement and activity levels
 * - Accountability tracking and milestone management
 *
 * Usage:
 *   Route: /team/mentor
 *   Access: Mentor and Admin roles only
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Chat as ChatIcon,
  FlagCircle as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  ShowChart as ShowChartIcon,
  Celebration as CelebrationIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  PriorityHigh as PriorityHighIcon,
  CalendarToday as CalendarIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as mentorService from "../services/mentorService";
import * as progressSharingService from "../services/progressSharingService";
import {
  generateCoachingInsights,
  type CoachingInsightsResult,
} from "@shared/services/ai/aiGeneration";
import type {
  MenteeWithProgress,
  MentorFeedback,
  CreateFeedbackData,
  CreateGoalData,
} from "../services/mentorService";
import type {
  ProgressSnapshot,
  AchievementCelebration,
} from "../services/progressSharingService";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mentor-tabpanel-${index}`}
      aria-labelledby={`mentor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Engagement badge component showing mentee activity level
 * Handles values from database: high, moderate, low, inactive, unknown
 */
function EngagementBadge({ level }: { level: string }) {
  const config: Record<
    string,
    {
      color: "success" | "info" | "warning" | "error" | "default";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    high: {
      color: "success",
      label: "Highly Active",
      icon: <TrendingUpIcon fontSize="small" />,
    },
    moderate: {
      color: "info",
      label: "Active",
      icon: <CheckCircleIcon fontSize="small" />,
    },
    medium: {
      color: "info",
      label: "Active",
      icon: <CheckCircleIcon fontSize="small" />,
    },
    low: {
      color: "warning",
      label: "Low Activity",
      icon: <WarningIcon fontSize="small" />,
    },
    inactive: {
      color: "error",
      label: "Inactive",
      icon: <TimerIcon fontSize="small" />,
    },
    unknown: {
      color: "default",
      label: "Unknown",
      icon: <TimerIcon fontSize="small" />,
    },
  };

  // Get config for the level, fallback to inactive if not found
  const levelConfig = config[level] || config.inactive;
  const { color, label, icon } = levelConfig;

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
      variant="outlined"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MentorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isMentor, isAdmin, loading: teamLoading } = useTeam();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [mentees, setMentees] = useState<MenteeWithProgress[]>([]);
  const [selectedMentee, setSelectedMentee] =
    useState<MenteeWithProgress | null>(null);
  const [feedback, setFeedback] = useState<MentorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<Partial<CreateFeedbackData>>(
    {
      feedbackType: "general",
      feedbackText: "",
    }
  );
  const [goalForm, setGoalForm] = useState<Partial<CreateGoalData>>({
    goalType: "weekly_applications",
    title: "",
    description: "",
  });

  // Progress sharing state - tracks mentee progress snapshots and achievements
  const [menteeProgress, setMenteeProgress] = useState<
    Map<string, ProgressSnapshot[]>
  >(new Map());
  const [menteeAchievements, setMenteeAchievements] = useState<
    Map<string, AchievementCelebration[]>
  >(new Map());
  const [progressLoading, setProgressLoading] = useState(false);

  // AI Coaching Insights state
  const [coachingInsights, setCoachingInsights] = useState<
    Map<string, CoachingInsightsResult>
  >(new Map());
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedInsightsMentee, setSelectedInsightsMentee] =
    useState<MenteeWithProgress | null>(null);

  // Documents dialog state
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [menteeDocuments, setMenteeDocuments] = useState<
    mentorService.MenteeDocument[]
  >([]);

  // Dashboard summary stats
  const [summary, setSummary] = useState<{
    totalMentees: number;
    activeMentees: number;
    inactiveMentees: number;
    totalActiveGoals: number;
    completedGoalsThisWeek: number;
    pendingFeedback: number;
    totalApplicationsThisWeek: number;
    totalInterviewsThisWeek: number;
  } | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load mentees and dashboard data
   */
  useEffect(() => {
    async function loadData() {
      if (!user || !currentTeam) return;

      setLoading(true);
      setError(null);

      try {
        // Load assigned mentees with progress
        const menteesResult = await mentorService.getAssignedMentees(
          user.id,
          currentTeam.id
        );

        if (menteesResult.error) {
          setError(menteesResult.error.message);
        } else {
          setMentees(menteesResult.data || []);
        }

        // Load dashboard summary
        const summaryResult = await mentorService.getMentorDashboardSummary(
          user.id,
          currentTeam.id
        );

        if (summaryResult.data) {
          setSummary(summaryResult.data);
        }

        // Load recent feedback
        const feedbackResult = await mentorService.getMentorFeedback(
          user.id,
          currentTeam.id
        );

        if (feedbackResult.data) {
          setFeedback(feedbackResult.data);
        }
      } catch (err) {
        setError("Failed to load mentor dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, currentTeam]);

  /**
   * Refresh data
   */
  const handleRefresh = async () => {
    if (!user || !currentTeam) return;

    setLoading(true);
    const result = await mentorService.getAssignedMentees(
      user.id,
      currentTeam.id
    );
    if (result.data) {
      setMentees(result.data);
    }
    setLoading(false);
  };

  /**
   * Load progress data for all mentees
   * Fetches progress snapshots and achievements to display in the Progress tab
   */
  const loadMenteeProgress = async () => {
    if (!currentTeam || mentees.length === 0) return;

    setProgressLoading(true);

    try {
      const progressMap = new Map<string, ProgressSnapshot[]>();
      const achievementsMap = new Map<string, AchievementCelebration[]>();

      // Load progress for each mentee in parallel
      await Promise.all(
        mentees.map(async (mentee) => {
          // Get progress snapshots - last 4 weeks
          const snapshotsResult =
            await progressSharingService.getProgressSnapshots(
              mentee.candidate_id,
              currentTeam.id,
              { limit: 4 }
            );

          if (snapshotsResult.data) {
            progressMap.set(mentee.candidate_id, snapshotsResult.data);
          }

          // Get recent achievements
          const achievementsResult =
            await progressSharingService.getAchievements(
              mentee.candidate_id,
              currentTeam.id,
              { limit: 5 }
            );

          if (achievementsResult.data) {
            achievementsMap.set(mentee.candidate_id, achievementsResult.data);
          }
        })
      );

      setMenteeProgress(progressMap);
      setMenteeAchievements(achievementsMap);
    } catch (err) {
      console.error("Failed to load mentee progress:", err);
    } finally {
      setProgressLoading(false);
    }
  };

  // Load mentee progress when tab changes to Progress tab
  useEffect(() => {
    if (tabValue === 3 && mentees.length > 0) {
      loadMenteeProgress();
    }
  }, [tabValue, mentees.length]);

  /**
   * Generate AI coaching insights for a specific mentee
   * Called when user clicks "Get Insights" in the Coaching Insights tab
   */
  const handleGenerateInsights = async (mentee: MenteeWithProgress) => {
    if (!user) return;

    setInsightsLoading(true);
    setSelectedInsightsMentee(mentee);

    try {
      // Prepare mentee data for the AI
      const menteeData = {
        name: mentee.candidate_name,
        jobStats: mentee.jobStats,
        engagementLevel: mentee.engagementLevel,
        lastActiveAt: mentee.lastActiveAt || undefined,
        recentActivity: mentee.recentActivity.map((a) => ({
          type: a.type,
          description: a.description,
          timestamp: a.timestamp,
        })),
      };

      const insights = await generateCoachingInsights(user.id, menteeData);

      // Cache the insights
      setCoachingInsights((prev) => {
        const newMap = new Map(prev);
        newMap.set(mentee.candidate_id, insights);
        return newMap;
      });
    } catch (err) {
      console.error("Failed to generate coaching insights:", err);
      setError("Failed to generate coaching insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  };

  // ============================================================================
  // DOCUMENTS HANDLERS
  // ============================================================================

  /**
   * Open dialog to view mentee's job search documents
   */
  const handleViewDocuments = async (mentee: MenteeWithProgress) => {
    if (!user || !currentTeam) return;

    setSelectedMentee(mentee);
    setDocumentsDialogOpen(true);
    setDocumentsLoading(true);
    setMenteeDocuments([]);

    try {
      const result = await mentorService.getMenteeDocuments(
        user.id,
        mentee.candidate_id,
        currentTeam.id
      );

      if (result.data) {
        setMenteeDocuments(result.data);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Failed to load mentee documents:", err);
      setError("Failed to load documents. Please try again.");
    } finally {
      setDocumentsLoading(false);
    }
  };

  // ============================================================================
  // FEEDBACK HANDLERS
  // ============================================================================

  const handleOpenFeedbackDialog = (mentee: MenteeWithProgress) => {
    setSelectedMentee(mentee);
    setFeedbackForm({
      feedbackType: "general",
      feedbackText: "",
    });
    setFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (
      !user ||
      !currentTeam ||
      !selectedMentee ||
      !feedbackForm.feedbackText
    ) {
      return;
    }

    const data: CreateFeedbackData = {
      candidateId: selectedMentee.candidate_id,
      teamId: currentTeam.id,
      feedbackType: feedbackForm.feedbackType || "general",
      feedbackText: feedbackForm.feedbackText,
    };

    const result = await mentorService.createFeedback(user.id, data);

    if (result.data) {
      // Add candidate info to the newly created feedback
      // since createFeedback doesn't include the joined candidate data
      const feedbackWithCandidate = {
        ...result.data,
        candidate: {
          fullName: selectedMentee.candidate_name,
          email: selectedMentee.candidate_email,
        },
      };
      setFeedback((prev) => [feedbackWithCandidate, ...prev]);
      setFeedbackDialogOpen(false);
      setFeedbackForm({ feedbackType: "general", feedbackText: "" });
    }
  };

  // ============================================================================
  // GOAL HANDLERS
  // ============================================================================

  const handleOpenGoalDialog = (mentee: MenteeWithProgress) => {
    setSelectedMentee(mentee);
    setGoalForm({
      goalType: "weekly_applications",
      title: "",
      description: "",
    });
    setGoalDialogOpen(true);
  };

  const handleSubmitGoal = async () => {
    if (!user || !currentTeam || !selectedMentee || !goalForm.title) {
      return;
    }

    const data: CreateGoalData = {
      candidateId: selectedMentee.candidate_id,
      teamId: currentTeam.id,
      goalType: goalForm.goalType || "custom",
      title: goalForm.title,
      description: goalForm.description,
      targetValue: goalForm.targetValue,
      dueDate: goalForm.dueDate,
    };

    const result = await mentorService.createMenteeGoal(user.id, data);

    if (result.data) {
      setGoalDialogOpen(false);
      setGoalForm({
        goalType: "weekly_applications",
        title: "",
        description: "",
      });
      // Refresh mentee data to show new goal
      handleRefresh();
    }
  };

  // ============================================================================
  // ACCESS CONTROL
  // ============================================================================

  // Still loading team context
  if (teamLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading...</Typography>
        </Stack>
      </Container>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please select or create a team to access the Mentor Dashboard.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/team")}
        >
          Go to Team Dashboard
        </Button>
      </Container>
    );
  }

  // Not a mentor or admin
  if (!isMentor && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Only mentors and admins can access the Mentor Dashboard.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/team")}
        >
          Go to Team Dashboard
        </Button>
      </Container>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => navigate("/team")}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4">Mentor Dashboard</Typography>
                <Typography variant="body2" color="text.secondary">
                  Coach and support your assigned mentees
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Error State */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Stats */}
        {summary && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <PeopleIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Assigned Mentees
                    </Typography>
                  </Stack>
                  <Typography variant="h4">{summary.totalMentees}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.activeMentees} active, {summary.inactiveMentees}{" "}
                    need attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <FlagIcon color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Active Goals
                    </Typography>
                  </Stack>
                  <Typography variant="h4">
                    {summary.totalActiveGoals}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {summary.completedGoalsThisWeek} completed this week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <AssignmentIcon color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Applications
                    </Typography>
                  </Stack>
                  <Typography variant="h4">
                    {summary.totalApplicationsThisWeek}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <EmojiEventsIcon color="success" />
                    <Typography variant="body2" color="text.secondary">
                      Interviews
                    </Typography>
                  </Stack>
                  <Typography variant="h4">
                    {summary.totalInterviewsThisWeek}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Content Tabs */}
        <Paper sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            <Tab label="My Mentees" />
            <Tab label="Recent Feedback" />
            <Tab label="Coaching Insights" />
            <Tab
              label="Mentee Progress"
              icon={<ShowChartIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Mentees Tab */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : mentees.length === 0 ? (
              <Box textAlign="center" py={4}>
                <PeopleIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Mentees Assigned
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  You don't have any candidates assigned to you yet.
                </Typography>
                <Button variant="outlined" onClick={() => navigate("/team")}>
                  View Team Dashboard
                </Button>
              </Box>
            ) : (
              <List>
                {mentees.map((mentee, index) => (
                  <Box key={mentee.candidate_id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 2,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            mentee.engagementLevel === "inactive" ? (
                              <WarningIcon
                                sx={{
                                  fontSize: 14,
                                  color: "error.main",
                                  bgcolor: "background.paper",
                                  borderRadius: "50%",
                                }}
                              />
                            ) : null
                          }
                        >
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {mentee.candidate_name?.[0]?.toUpperCase() || "?"}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography variant="subtitle1">
                              {mentee.candidate_name}
                            </Typography>
                            <EngagementBadge level={mentee.engagementLevel} />
                          </Stack>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Total Apps
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {mentee.jobStats.total}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Interviewing
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {mentee.jobStats.interviewing}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Offers
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  color="success.main"
                                >
                                  {mentee.jobStats.offers}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Last Active
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {mentee.lastActiveAt
                                    ? new Date(
                                        mentee.lastActiveAt
                                      ).toLocaleDateString()
                                    : "Never"}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: "div" }}
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Documents">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocuments(mentee)}
                            >
                              <DescriptionIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Goal">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenGoalDialog(mentee)}
                            >
                              <FlagIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Give Feedback">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenFeedbackDialog(mentee)}
                            >
                              <ChatIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Feedback Tab */}
          <TabPanel value={tabValue} index={1}>
            {feedback.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ChatIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Feedback Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your feedback history will appear here.
                </Typography>
              </Box>
            ) : (
              <List>
                {feedback.slice(0, 10).map((fb, index) => (
                  <Box key={fb.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "info.main" }}>
                          <ChatIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography variant="subtitle2">
                              {fb.candidate?.fullName || "Unknown"}
                            </Typography>
                            <Chip
                              label={fb.feedbackType}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {fb.feedbackText}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                        secondaryTypographyProps={{ component: "div" }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Coaching Insights Tab - AI-powered coaching recommendations */}
          <TabPanel value={tabValue} index={2}>
            {mentees.length === 0 ? (
              <Box textAlign="center" py={4}>
                <PsychologyIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Mentees Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assign mentees to generate coaching insights.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* Instructions */}
                <Alert severity="info" icon={<AutoAwesomeIcon />}>
                  <Typography variant="body2">
                    Select a mentee to generate AI-powered coaching insights
                    based on their job search progress, activity, and goals.
                  </Typography>
                </Alert>

                {/* Mentee selection cards */}
                <Grid container spacing={2}>
                  {mentees.map((mentee) => {
                    const hasInsights = coachingInsights.has(
                      mentee.candidate_id
                    );
                    const isSelected =
                      selectedInsightsMentee?.candidate_id ===
                      mentee.candidate_id;
                    const isGenerating = insightsLoading && isSelected;

                    return (
                      <Grid
                        size={{ xs: 12, sm: 6, md: 4 }}
                        key={mentee.candidate_id}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: "pointer",
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            "&:hover": { borderColor: "primary.light" },
                          }}
                          onClick={() =>
                            !insightsLoading && handleGenerateInsights(mentee)
                          }
                        >
                          <CardContent>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              <Avatar sx={{ bgcolor: "primary.main" }}>
                                {mentee.candidate_name?.[0]?.toUpperCase() ||
                                  "?"}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="subtitle2">
                                  {mentee.candidate_name}
                                </Typography>
                                <EngagementBadge
                                  level={mentee.engagementLevel}
                                />
                              </Box>
                              {isGenerating ? (
                                <CircularProgress size={20} />
                              ) : hasInsights ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <PsychologyIcon color="action" />
                              )}
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: "block" }}
                            >
                              {mentee.jobStats.total} apps •{" "}
                              {mentee.jobStats.interviewing} interviewing •{" "}
                              {mentee.jobStats.offers} offers
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Display insights for selected mentee */}
                {selectedInsightsMentee &&
                  coachingInsights.has(selectedInsightsMentee.candidate_id) && (
                    <Paper sx={{ p: 3 }}>
                      {(() => {
                        const insights = coachingInsights.get(
                          selectedInsightsMentee.candidate_id
                        )!;
                        return (
                          <Stack spacing={3}>
                            {/* Header */}
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 48,
                                  height: 48,
                                }}
                              >
                                {selectedInsightsMentee.candidate_name?.[0]?.toUpperCase() ||
                                  "?"}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  Coaching Insights for{" "}
                                  {selectedInsightsMentee.candidate_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Generated{" "}
                                  {insights.meta?.generated_at
                                    ? new Date(
                                        insights.meta.generated_at
                                      ).toLocaleString()
                                    : "just now"}
                                </Typography>
                              </Box>
                            </Stack>

                            {/* Summary */}
                            <Card variant="outlined">
                              <CardContent>
                                <Typography
                                  variant="subtitle2"
                                  color="primary"
                                  gutterBottom
                                >
                                  <LightbulbIcon
                                    sx={{
                                      fontSize: 16,
                                      mr: 0.5,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  Summary
                                </Typography>
                                <Typography variant="body2">
                                  {insights.summary}
                                </Typography>
                              </CardContent>
                            </Card>

                            {/* Recommendations */}
                            {insights.recommendations.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <StarIcon fontSize="small" color="warning" />
                                  Key Recommendations
                                </Typography>
                                <List dense>
                                  {insights.recommendations.map((rec, idx) => (
                                    <ListItem key={idx}>
                                      <ListItemText
                                        primary={rec}
                                        primaryTypographyProps={{
                                          variant: "body2",
                                        }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}

                            {/* Focus Areas */}
                            {insights.focusAreas.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <PriorityHighIcon
                                    fontSize="small"
                                    color="error"
                                  />
                                  Focus Areas
                                </Typography>
                                <Stack spacing={1}>
                                  {insights.focusAreas.map((area, idx) => (
                                    <Card
                                      key={idx}
                                      variant="outlined"
                                      sx={{ p: 1.5 }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        mb={0.5}
                                      >
                                        <Typography variant="subtitle2">
                                          {area.area}
                                        </Typography>
                                        <Chip
                                          label={area.priority}
                                          size="small"
                                          color={
                                            area.priority === "high"
                                              ? "error"
                                              : area.priority === "medium"
                                              ? "warning"
                                              : "default"
                                          }
                                        />
                                      </Stack>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {area.suggestion}
                                      </Typography>
                                    </Card>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {/* Strength Areas */}
                            {insights.strengthAreas.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <EmojiEventsIcon
                                    fontSize="small"
                                    color="success"
                                  />
                                  Strengths
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  {insights.strengthAreas.map(
                                    (strength, idx) => (
                                      <Chip
                                        key={idx}
                                        label={strength}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                      />
                                    )
                                  )}
                                </Stack>
                              </Box>
                            )}

                            {/* Suggested Goals */}
                            {insights.suggestedGoals.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <FlagIcon fontSize="small" color="info" />
                                  Suggested Goals
                                </Typography>
                                <Stack spacing={1}>
                                  {insights.suggestedGoals.map((goal, idx) => (
                                    <Card
                                      key={idx}
                                      variant="outlined"
                                      sx={{ p: 1.5 }}
                                    >
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                      >
                                        <Box>
                                          <Typography variant="subtitle2">
                                            {goal.title}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {goal.reason}
                                          </Typography>
                                        </Box>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => {
                                            setGoalForm({
                                              goalType: goal.type as any,
                                              title: goal.title,
                                              description: goal.reason,
                                            });
                                            setSelectedMentee(
                                              selectedInsightsMentee
                                            );
                                            setGoalDialogOpen(true);
                                          }}
                                        >
                                          Create Goal
                                        </Button>
                                      </Stack>
                                    </Card>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {/* Action Plan */}
                            {insights.actionPlan.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <CalendarIcon
                                    fontSize="small"
                                    color="primary"
                                  />
                                  Action Plan
                                </Typography>
                                <Stack spacing={1}>
                                  {insights.actionPlan.map((week) => (
                                    <Card
                                      key={week.week}
                                      variant="outlined"
                                      sx={{ p: 1.5 }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        color="primary"
                                      >
                                        Week {week.week}
                                      </Typography>
                                      <List dense disablePadding>
                                        {week.actions.map((action, idx) => (
                                          <ListItem key={idx} sx={{ py: 0.25 }}>
                                            <ListItemText
                                              primary={`• ${action}`}
                                              primaryTypographyProps={{
                                                variant: "body2",
                                              }}
                                            />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Card>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {/* Motivational Note */}
                            {insights.motivationalNote && (
                              <Alert
                                severity="success"
                                icon={<CelebrationIcon />}
                              >
                                <Typography variant="body2">
                                  {insights.motivationalNote}
                                </Typography>
                              </Alert>
                            )}

                            {/* Action buttons */}
                            <Stack direction="row" spacing={2}>
                              <Button
                                variant="contained"
                                startIcon={<ChatIcon />}
                                onClick={() =>
                                  handleOpenFeedbackDialog(
                                    selectedInsightsMentee
                                  )
                                }
                              >
                                Send Feedback
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() =>
                                  handleGenerateInsights(selectedInsightsMentee)
                                }
                                disabled={insightsLoading}
                              >
                                Regenerate
                              </Button>
                            </Stack>
                          </Stack>
                        );
                      })()}
                    </Paper>
                  )}
              </Stack>
            )}
          </TabPanel>

          {/* Mentee Progress Tab - Shows progress snapshots and achievements (UC-111) */}
          <TabPanel value={tabValue} index={3}>
            {progressLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : mentees.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ShowChartIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Mentees Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assign mentees to view their progress.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* Link to full progress view */}
                <Alert severity="info">
                  <Typography variant="body2">
                    Mentees can share detailed progress and achievements with
                    you.{" "}
                    <Button
                      size="small"
                      onClick={() => navigate("/team/progress")}
                      sx={{ ml: 1 }}
                    >
                      View Full Progress Dashboard
                    </Button>
                  </Typography>
                </Alert>

                {/* Progress cards for each mentee */}
                {mentees.map((mentee) => {
                  const snapshots =
                    menteeProgress.get(mentee.candidate_id) || [];
                  const achievements =
                    menteeAchievements.get(mentee.candidate_id) || [];
                  const latestSnapshot = snapshots[0];

                  return (
                    <Card key={mentee.candidate_id} variant="outlined">
                      <CardContent>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          mb={2}
                        >
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {mentee.candidate_name?.[0]?.toUpperCase() || "?"}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1">
                              {mentee.candidate_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {latestSnapshot
                                ? `Last snapshot: ${new Date(
                                    latestSnapshot.createdAt
                                  ).toLocaleDateString()}`
                                : "No progress data yet"}
                            </Typography>
                          </Box>
                          <EngagementBadge level={mentee.engagementLevel} />
                        </Stack>

                        {/* Latest snapshot metrics */}
                        {latestSnapshot ? (
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Box textAlign="center">
                                <Typography variant="h5" color="primary">
                                  {latestSnapshot.applicationsTotal}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Total Apps
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Box textAlign="center">
                                <Typography variant="h5" color="info.main">
                                  {latestSnapshot.applicationsByStatus
                                    ?.interviewing || 0}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Interviewing
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Box textAlign="center">
                                <Typography variant="h5" color="success.main">
                                  {latestSnapshot.applicationsByStatus?.offer ||
                                    0}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Offers
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Box textAlign="center">
                                <Typography variant="h5" color="secondary">
                                  {latestSnapshot.goalsCompleted}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Goals Done
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        ) : (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              No progress snapshots available for this mentee
                              yet.
                            </Typography>
                          </Alert>
                        )}

                        {/* Recent achievements */}
                        {achievements.length > 0 && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Recent Achievements
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {achievements.slice(0, 3).map((achievement) => (
                                <Chip
                                  key={achievement.id}
                                  icon={<CelebrationIcon />}
                                  label={achievement.description}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              ))}
                              {achievements.length > 3 && (
                                <Chip
                                  label={`+${achievements.length - 3} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>
        </Paper>
      </Stack>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Give Feedback to {selectedMentee?.candidate_name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={feedbackForm.feedbackType || "general"}
                label="Feedback Type"
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    feedbackType: e.target
                      .value as CreateFeedbackData["feedbackType"],
                  }))
                }
              >
                <MenuItem value="general">General Coaching</MenuItem>
                <MenuItem value="application">Application Feedback</MenuItem>
                <MenuItem value="interview">Interview Prep</MenuItem>
                <MenuItem value="resume">Resume Review</MenuItem>
                <MenuItem value="cover_letter">Cover Letter Review</MenuItem>
                <MenuItem value="goal">Goal Progress</MenuItem>
                <MenuItem value="milestone">Milestone Achievement</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Your Feedback"
              multiline
              rows={4}
              fullWidth
              value={feedbackForm.feedbackText || ""}
              onChange={(e) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  feedbackText: e.target.value,
                }))
              }
              placeholder="Share your coaching insights, recommendations, or encouragement..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={!feedbackForm.feedbackText}
          >
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Goal for {selectedMentee?.candidate_name}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Goal Type</InputLabel>
              <Select
                value={goalForm.goalType || "weekly_applications"}
                label="Goal Type"
                onChange={(e) =>
                  setGoalForm((prev) => ({
                    ...prev,
                    goalType: e.target.value as CreateGoalData["goalType"],
                  }))
                }
              >
                <MenuItem value="weekly_applications">
                  Weekly Applications
                </MenuItem>
                <MenuItem value="monthly_applications">
                  Monthly Applications
                </MenuItem>
                <MenuItem value="interview_prep">
                  Interview Preparation
                </MenuItem>
                <MenuItem value="resume_update">Resume Update</MenuItem>
                <MenuItem value="networking">Networking</MenuItem>
                <MenuItem value="skill_development">Skill Development</MenuItem>
                <MenuItem value="custom">Custom Goal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Goal Title"
              fullWidth
              value={goalForm.title || ""}
              onChange={(e) =>
                setGoalForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Apply to 10 jobs this week"
            />
            <TextField
              label="Description (optional)"
              multiline
              rows={2}
              fullWidth
              value={goalForm.description || ""}
              onChange={(e) =>
                setGoalForm((prev) => ({
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
              value={goalForm.targetValue || ""}
              onChange={(e) =>
                setGoalForm((prev) => ({
                  ...prev,
                  targetValue: parseInt(e.target.value) || undefined,
                }))
              }
              placeholder="e.g., 10"
            />
            <TextField
              label="Due Date (optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={goalForm.dueDate || ""}
              onChange={(e) =>
                setGoalForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitGoal}
            disabled={!goalForm.title}
          >
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Documents Dialog - View mentee's job search materials */}
      <Dialog
        open={documentsDialogOpen}
        onClose={() => setDocumentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Documents for {selectedMentee?.candidate_name}
        </DialogTitle>
        <DialogContent>
          {documentsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : menteeDocuments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <DescriptionIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No Documents Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This mentee hasn't created any resumes or cover letters yet.
              </Typography>
            </Box>
          ) : (
            <List>
              {menteeDocuments.map((doc, index) => (
                <Box key={doc.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            doc.documentType === "resume"
                              ? "primary.main"
                              : "secondary.main",
                        }}
                      >
                        <DescriptionIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">
                            {doc.title}
                          </Typography>
                          <Chip
                            label={
                              doc.documentType === "resume"
                                ? "Resume"
                                : "Cover Letter"
                            }
                            size="small"
                            color={
                              doc.documentType === "resume"
                                ? "primary"
                                : "secondary"
                            }
                            variant="outlined"
                          />
                          <Chip
                            label={`v${doc.version}`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          {doc.companyName && (
                            <Typography variant="body2" color="text.secondary">
                              For: {doc.jobTitle} at {doc.companyName}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Updated:{" "}
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Open feedback dialog with document context
                          setFeedbackForm({
                            feedbackType:
                              doc.documentType === "resume"
                                ? "resume"
                                : "cover_letter",
                            feedbackText: "",
                            relatedDocumentId: doc.id,
                          });
                          setDocumentsDialogOpen(false);
                          setFeedbackDialogOpen(true);
                        }}
                      >
                        Give Feedback
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
