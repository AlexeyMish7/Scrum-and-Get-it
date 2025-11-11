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

import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
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

const RECENT_ACTIVITY = [
  {
    title: "Software Engineer Resume - v3",
    subtitle: "Updated 2 hours ago",
    type: "resume",
  },
  {
    title: "Google Cover Letter",
    subtitle: "Created yesterday",
    type: "cover-letter",
  },
  {
    title: "TechCorp Research Report",
    subtitle: "Generated 3 days ago",
    type: "research",
  },
];

export default function DashboardAI() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 5 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
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
      </Box>

      {/* Quick Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "primary.50" }}>
          <Typography variant="h4" fontWeight={600} color="primary.main">
            12
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumes Created
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "success.50" }}>
          <Typography variant="h4" fontWeight={600} color="success.main">
            8
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cover Letters
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "warning.50" }}>
          <Typography variant="h4" fontWeight={600} color="warning.main">
            85%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Match Score
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "info.50" }}>
          <Typography variant="h4" fontWeight={600} color="info.main">
            24
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jobs Analyzed
          </Typography>
        </Paper>
      </Stack>

      {/* Main Content Grid */}
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Left: Quick Start Cards (70%) */}
        <Box sx={{ flex: "0 0 70%" }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Quick Start
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose an AI tool to get started
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                  application, then create a matching cover letter. Use Job
                  Matching to identify the best opportunities based on your
                  skills.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Right: Recent Activity (30%) */}
        <Box sx={{ flex: "0 0 30%" }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your latest AI-generated documents
          </Typography>

          <Stack spacing={2}>
            {RECENT_ACTIVITY.map((item, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "primary.50",
                      color: "primary.main",
                    }}
                  >
                    {item.type === "resume" && <DescriptionIcon />}
                    {item.type === "cover-letter" && <EmailIcon />}
                    {item.type === "research" && <ArticleIcon />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AccessTimeIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            ))}

            <Divider />

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/ai/templates")}
            >
              View All Documents
            </Button>
          </Stack>

          {/* Getting Started Guide */}
          <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
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

          {/* Quick Action Alert */}
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Ready to apply?
            </Typography>
            <Typography variant="caption">
              Generate a resume and cover letter in minutes!
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  );
}
