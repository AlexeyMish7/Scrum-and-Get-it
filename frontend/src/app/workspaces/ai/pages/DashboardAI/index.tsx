/**
 * AI Dashboard - Main Landing Page for AI Workspace
 *
 * WHAT: Overview and quick-access hub for all AI-powered features
 * WHY: Central place for users to access resume generation, cover letters, job matching, etc.
 *
 * Features:
 * - Quick-start cards for main AI features
 * - Recent activity/drafts
 * - Usage statistics
 * - Quick actions
 *
 * Layout:
 * - Hero section with welcome message
 * - Quick-start cards grid
 * - Recent activity section
 * - Tips and recommendations
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import InsightsIcon from "@mui/icons-material/Insights";
import type { AiArtifactKind } from "@shared/services/types/aiArtifacts";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import useAIDashboardData from "@workspaces/ai/hooks/useAIDashboardData";

interface QuickStartCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  badge?: string;
}

const QUICK_START_CARDS: QuickStartCard[] = [
  {
    title: "Generate Resume",
    description: "Create tailored resumes with AI assistance",
    icon: <DescriptionIcon fontSize="large" />,
    route: "/ai/resume",
    color: "#2196F3",
    badge: "Popular",
  },
  {
    title: "Cover Letter",
    description: "Write personalized cover letters for job applications",
    icon: <EmailIcon fontSize="large" />,
    route: "/ai/cover-letter",
    color: "#4CAF50",
  },
  {
    title: "Job Matching",
    description: "Find jobs that match your skills and experience",
    icon: <TrendingUpIcon fontSize="large" />,
    route: "/ai/job-match",
    color: "#FF9800",
    badge: "New",
  },
  {
    title: "Company Research",
    description: "Get insights about companies you're applying to",
    icon: <BusinessIcon fontSize="large" />,
    route: "/ai/company-research",
    color: "#9C27B0",
  },
  {
    title: "Templates Hub",
    description: "Browse and customize professional templates",
    icon: <DashboardIcon fontSize="large" />,
    route: "/ai/templates",
    color: "#F44336",
  },
];

const ARTIFACT_META: Record<
  AiArtifactKind | "default",
  { icon: React.ReactNode; label: string; color: string }
> = {
  resume: {
    icon: <DescriptionIcon />,
    label: "Resume",
    color: "primary.main",
  },
  cover_letter: {
    icon: <EmailIcon />,
    label: "Cover Letter",
    color: "secondary.main",
  },
  match: {
    icon: <TrendingUpIcon />,
    label: "Job Match",
    color: "warning.main",
  },
  company_research: {
    icon: <BusinessIcon />,
    label: "Company Research",
    color: "info.main",
  },
  skills_optimization: {
    icon: <AutoAwesomeIcon />,
    label: "Skills Optimization",
    color: "success.main",
  },
  gap_analysis: {
    icon: <WarningAmberIcon />,
    label: "Gap Analysis",
    color: "error.main",
  },
  default: {
    icon: <ArticleIcon />,
    label: "AI Artifact",
    color: "text.primary",
  },
};

const DEADLINE_COLORS = {
  overdue: "error",
  urgent: "error",
  soon: "warning",
  upcoming: "success",
} as const;

function getArtifactMeta(kind: AiArtifactKind | string) {
  const meta = ARTIFACT_META[kind as AiArtifactKind];
  return meta ?? ARTIFACT_META.default;
}

function deadlineColor(days: number) {
  if (days < 0) return DEADLINE_COLORS.overdue;
  if (days <= 7) return DEADLINE_COLORS.urgent;
  if (days <= 14) return DEADLINE_COLORS.soon;
  return DEADLINE_COLORS.upcoming;
}

function formatRelativeTime(dateStr: string) {
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return "Unknown";
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes || 1}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dt.toLocaleDateString();
}

export default function DashboardAI() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAIDashboardData();
  const { notification, closeNotification, handleError } = useErrorHandler();

  useEffect(() => {
    if (error) {
      handleError(new Error(error), "Failed to load AI dashboard data");
    }
  }, [error, handleError]);

  const quickStats = data?.quickStats ?? {
    resumes: 0,
    coverLetters: 0,
    avgMatchScore: null,
    jobsAnalyzed: 0,
  };

  const statsCards = [
    {
      label: "Resumes Created",
      value: quickStats.resumes,
      color: "primary.main",
    },
    {
      label: "Cover Letters",
      value: quickStats.coverLetters,
      color: "success.main",
    },
    {
      label: "Avg Match Score",
      value:
        quickStats.avgMatchScore != null ? `${quickStats.avgMatchScore}%` : "—",
      color: "warning.main",
    },
    {
      label: "Jobs Analyzed",
      value: quickStats.jobsAnalyzed,
      color: "info.main",
    },
  ];

  const recentArtifacts = data?.recentArtifacts ?? [];
  const deadlines = data?.deadlines ?? [];
  const skillGaps = data?.skillGaps ?? [];
  const insights = data?.insights ?? [];
  const workflow = data?.workflow ?? [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <AutoAwesomeIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h3" fontWeight={700}>
                AI-Powered Career Studio
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create professional application materials with intelligent
                assistance
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {data?.lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated {new Date(data.lastUpdated).toLocaleTimeString()}
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refresh}
              disabled={loading}
            >
              Refresh data
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fit, minmax(160px, 1fr))",
            md: "repeat(4, minmax(180px, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {statsCards.map((card) => (
          <Paper
            key={card.label}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: `${card.color}15`,
              border: "1px solid",
              borderColor: `${card.color}40`,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{ color: card.color, minHeight: 48 }}
            >
              {loading && !data ? <Skeleton width={60} /> : card.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Main Content Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* Left Column */}
        <Stack spacing={3}>
          {/* Quick Start */}
          <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Quick Start
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose an AI tool to get started
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 2,
              }}
            >
              {QUICK_START_CARDS.map((card) => (
                <Card
                  key={card.route}
                  elevation={2}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(card.route)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: `${card.color}15`,
                            color: card.color,
                            display: "inline-flex",
                          }}
                        >
                          {card.icon}
                        </Box>
                        {card.badge && (
                          <Chip
                            label={card.badge}
                            size="small"
                            color={
                              card.badge === "Popular" ? "primary" : "success"
                            }
                          />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      endIcon={<ArrowForwardIcon />}
                      sx={{ color: card.color }}
                    >
                      Get Started
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>

            {/* Tips Section */}
            <Paper elevation={1} sx={{ mt: 4, p: 3, bgcolor: "info.50" }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AutoAwesomeIcon color="info" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Pro Tip
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by generating a tailored resume for each job
                    application, then create a matching cover letter. Run Job
                    Matching to identify the best opportunities based on your
                    skills.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* Skill Gap Spotlight */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <WarningAmberIcon color="warning" />
              <Typography variant="h6">Skill Gap Spotlight</Typography>
            </Stack>
            {loading && !data ? (
              <Typography color="text.secondary">Loading insights…</Typography>
            ) : skillGaps.length === 0 ? (
              <Alert
                severity="info"
                action={
                  <Button
                    size="small"
                    onClick={() => navigate("/ai/job-match")}
                  >
                    Run match
                  </Button>
                }
              >
                Run a job match analysis to see recommended skills to highlight.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {skillGaps.map((gap, index) => (
                  <Box
                    key={`${gap.skill}-${index}`}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {gap.skill}
                    </Typography>
                    {gap.suggestion && (
                      <Typography variant="body2" color="text.secondary">
                        {gap.suggestion}
                      </Typography>
                    )}
                    {!gap.suggestion && (
                      <Typography variant="body2" color="text.secondary">
                        Highlight recent wins or add a portfolio project to
                        cover this area.
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Workflow Checklist */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <ChecklistRtlIcon color="primary" />
                <Typography variant="h6">Workflow Checklist</Typography>
              </Stack>
              <TaskAltIcon color="action" />
            </Stack>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {workflow.map((task) => (
                <Paper
                  key={task.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: task.completed ? "success.light" : "divider",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Checkbox checked={task.completed} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {task.label}
                      </Typography>
                      {task.hint && (
                        <Typography variant="caption" color="text.secondary">
                          {task.hint}
                        </Typography>
                      )}
                    </Box>
                    {!task.completed && task.route && (
                      <Button
                        size="small"
                        onClick={() => navigate(task.route as string)}
                        startIcon={<ArrowForwardIcon />}
                      >
                        Open
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Stack>

        {/* Right Column */}
        <Stack spacing={3}>
          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6">Recent Activity</Typography>
            </Stack>
            {loading && !data ? (
              <Typography color="text.secondary">Loading activity…</Typography>
            ) : recentArtifacts.length === 0 ? (
              <Alert severity="info">
                No AI artifacts yet. Generate a resume or cover letter to see it
                here.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {recentArtifacts.map((item) => {
                  const meta = getArtifactMeta(item.kind);
                  return (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: `${meta.color}15`,
                            color: meta.color,
                            display: "inline-flex",
                          }}
                        >
                          {meta.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.title}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ mb: 0.5 }}
                          >
                            <Chip label={meta.label} size="small" />
                            <AccessTimeIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatRelativeTime(item.createdAt)}
                            </Typography>
                          </Stack>
                          {item.summary && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.summary}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate("/ai/templates")}
            >
              Browse templates
            </Button>
          </Paper>

          {/* Deadline Radar */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AccessTimeIcon color="action" />
              <Typography variant="h6">Deadline Radar</Typography>
            </Stack>
            {loading && !data ? (
              <Typography color="text.secondary">Loading deadlines…</Typography>
            ) : deadlines.length === 0 ? (
              <Typography color="text.secondary">
                No upcoming deadlines tracked.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {deadlines.map((deadline) => (
                  <Box
                    key={deadline.jobId}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      pb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {deadline.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deadline.company}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 0.5 }}
                      alignItems="center"
                    >
                      <Chip
                        label={
                          deadline.daysRemaining < 0
                            ? `Overdue ${Math.abs(deadline.daysRemaining)}d`
                            : `${deadline.daysRemaining}d left`
                        }
                        color={deadlineColor(deadline.daysRemaining) as any}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Status: {deadline.status}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Insights Feed */}
          <Paper sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <InsightsIcon color="secondary" />
              <Typography variant="h6">Insights Feed</Typography>
            </Stack>
            {loading && !data ? (
              <Typography color="text.secondary">
                Gathering insights…
              </Typography>
            ) : insights.length === 0 ? (
              <Typography color="text.secondary">
                Run company research to see curated news and talking points.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {insights.map((insight, idx) => (
                  <Box
                    key={`${insight.title}-${idx}`}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      pb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {insight.company}
                    </Typography>
                    {insight.summary && (
                      <Typography variant="body2" color="text.secondary">
                        {insight.summary}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {insight.source || "Source"} •{" "}
                      {insight.date
                        ? new Date(insight.date).toLocaleDateString()
                        : "Recently"}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Getting Started Guide */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Getting Started
            </Typography>
            <List dense>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.main"
                  >
                    1.
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Complete your profile"
                  secondary="Add skills & experience"
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.main"
                  >
                    2.
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Add job opportunities"
                  secondary="Track applications"
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.main"
                  >
                    3.
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Generate materials"
                  secondary="Create tailored documents"
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            </List>
          </Paper>
        </Stack>
      </Box>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Container>
  );
}
