import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicPageLayout from "@shared/layouts/PublicPageLayout";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { useAuth } from "@shared/context/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();

  const { user, loading } = useAuth();

  // If the user is already signed in, treat "/" as the app entry point and
  // immediately take them to their workspace instead of showing marketing.
  useEffect(() => {
    if (!loading && user) {
      navigate("/profile", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <PublicPageLayout centerContent>
        <LoadingSpinner />
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout containerMaxWidth="lg">
      <Stack spacing={{ xs: 4, md: 6 }} sx={{ py: { xs: 2, md: 4 } }}>
        {/* Hero */}
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  FlowATS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, mt: 1.5, lineHeight: 1.15 }}
                >
                  A single place to run your job search.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ opacity: 0.85, mt: 1.5, lineHeight: 1.55 }}
                >
                  Track applications, keep materials organized, prepare for
                  interviews, and use AI assistance — with a workflow that keeps
                  you moving.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip label="Profile" color="primary" variant="outlined" />
                <Chip label="Job Pipeline" color="primary" variant="outlined" />
                <Chip label="Documents" color="primary" variant="outlined" />
                <Chip label="AI Workspace" color="primary" variant="outlined" />
                <Chip label="Interviews" color="primary" variant="outlined" />
                <Chip label="Networking" color="primary" variant="outlined" />
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/register")}
                >
                  Get started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Create an account in under a minute, or sign in to continue.
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, md: 3.5 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ opacity: 0.8 }}>
                  What you get
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <WorkOutlineOutlinedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={650}>
                      Visual job pipeline
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DescriptionOutlinedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={650}>
                      Materials that stay attached to each application
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <AutoAwesomeOutlinedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={650}>
                      AI help for resumes and cover letters
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <EventNoteOutlinedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={650}>
                      Interview prep and scheduling
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <InsightsOutlinedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={650}>
                      Analytics to spot what’s working
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2.5, opacity: 0.2 }} />

              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Built for momentum
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Spend less time hunting for notes and files, and more time
                  applying and following up.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Feature highlights */}
        <Box>
          <Typography variant="h5" fontWeight={850} sx={{ mb: 1 }}>
            Everything organized by the work you’re doing
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 860 }}>
            FlowATS keeps your profile, applications, documents, interview prep,
            and contacts connected — so every next step is obvious.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <WorkOutlineOutlinedIcon />
                  <Typography fontWeight={800}>Jobs Pipeline</Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Track every application stage and keep outcomes visible.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <AutoAwesomeOutlinedIcon />
                  <Typography fontWeight={800}>AI Workspace</Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Generate, iterate, and version resumes/cover letters.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <PeopleAltOutlinedIcon />
                  <Typography fontWeight={800}>Network Hub</Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Keep contacts and follow-ups tied to real progress.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* How it works */}
        <Paper elevation={2} sx={{ p: { xs: 3, md: 3.5 } }}>
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={850}>
              How it works
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Chip
                    label="1"
                    color="primary"
                    variant="outlined"
                    sx={{ width: "fit-content" }}
                  />
                  <Typography fontWeight={800}>Set up your profile</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Save your baseline info once and reuse it everywhere.
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Chip
                    label="2"
                    color="primary"
                    variant="outlined"
                    sx={{ width: "fit-content" }}
                  />
                  <Typography fontWeight={800}>Track applications</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Move jobs through stages and keep notes/materials attached.
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Chip
                    label="3"
                    color="primary"
                    variant="outlined"
                    sx={{ width: "fit-content" }}
                  />
                  <Typography fontWeight={800}>
                    Prepare and follow up
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Keep interview prep, reminders, and contacts in sync.
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </PublicPageLayout>
  );
};

export default HomePage;
