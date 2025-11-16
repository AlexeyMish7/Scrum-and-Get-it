/**
 * JobMatch Page - UC-065, UC-066, UC-049, UC-050
 *
 * Features:
 * - AI-powered job matching with skills gap analysis
 * - Calculate match score based on skills, experience, and requirements
 * - Identify missing or weak skills with learning suggestions
 * - Experience tailoring recommendations for specific jobs
 * - Save analysis artifacts for future reference
 */
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  TrendingUp as TrendingUpIcon,
  Code as CodeIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useUserJobs from "@shared/hooks/useUserJobs";
import useJobMatching from "@workspaces/ai/hooks/useJobMatching";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";

export default function JobMatchPage() {
  const navigate = useNavigate();
  const { jobs, loading: jobsLoading } = useUserJobs(50);
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const jm = useJobMatching();
  const { notification, closeNotification, showSuccess } = useErrorHandler();

  const handleAnalyze = async () => {
    if (!selectedJobId) return;
    await jm.runMatch(Number(selectedJobId));
  };

  const handleSave = async () => {
    if (!selectedJobId) return;
    const selectedJob = jobs.find((j) => j.id === Number(selectedJobId));
    const title = selectedJob
      ? `Match: ${selectedJob.title} at ${selectedJob.company}`
      : `Match Analysis #${selectedJobId}`;

    const res = await jm.saveArtifact({
      kind: "match",
      title,
      jobId: Number(selectedJobId),
    });

    if (res.error) {
      const errorMsg = res.error?.message || "Unknown error";
      closeNotification();
      setTimeout(() => {
        showSuccess("Failed to save: " + errorMsg);
      }, 100);
    } else {
      showSuccess("Analysis saved successfully!");
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text.secondary";
    if (score >= 80) return "success.main";
    if (score >= 60) return "warning.main";
    return "error.main";
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate("/ai")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            Job Matching & Skills Gap Analysis
          </Typography>
        </Stack>

        {/* Job Selection */}
        <Paper sx={{ p: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value as number)}
              displayEmpty
              disabled={jobsLoading}
              sx={{ minWidth: 420, flex: 1 }}
            >
              <MenuItem value="">
                {jobsLoading
                  ? "Loading jobs..."
                  : jobs.length === 0
                  ? "No jobs available - add a job first"
                  : "Select a job to analyze"}
              </MenuItem>
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>
                  {j.title} — {j.company}
                </MenuItem>
              ))}
            </Select>

            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={jm.isLoading || !selectedJobId || jobs.length === 0}
              startIcon={jm.matchScore ? <RefreshIcon /> : <TrendingUpIcon />}
            >
              {jm.matchScore ? "Re-analyze" : "Analyze"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={!jm.matchScore}
              startIcon={<SaveIcon />}
            >
              Save Analysis
            </Button>
          </Stack>

          {/* Empty state for no jobs */}
          {!jobsLoading && jobs.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No jobs found. Add a job opportunity first in the{" "}
              <strong>Jobs workspace</strong> to analyze your match score.
            </Alert>
          )}
        </Paper>

        {/* Loading State */}
        {jm.isLoading && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing job match...
            </Typography>
            <Typography color="text.secondary">
              Comparing your profile with job requirements
            </Typography>
          </Paper>
        )}

        {/* Error State */}
        {jm.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Failed
            </Typography>
            <Typography variant="body2">{jm.error}</Typography>
            {jm.error.includes("Authentication") && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Please try refreshing the page or logging out and back in.
              </Typography>
            )}
          </Alert>
        )}

        {/* Results */}
        {!jm.isLoading && jm.matchScore !== null && (
          <Stack spacing={2}>
            {/* Match Score Overview */}
            <Card elevation={2}>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6">Match Score</Typography>
                </Stack>

                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography
                    variant="h2"
                    fontWeight={600}
                    sx={{ color: getScoreColor(jm.matchScore) }}
                  >
                    {jm.matchScore}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Overall Match Score
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Breakdown */}
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <CodeIcon
                      sx={{
                        color: getScoreColor(jm.breakdown?.skills),
                        fontSize: 32,
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant="h5"
                      sx={{ color: getScoreColor(jm.breakdown?.skills) }}
                    >
                      {jm.breakdown?.skills ?? 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Skills
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={jm.breakdown?.skills ?? 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider orientation="vertical" flexItem />

                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <WorkIcon
                      sx={{
                        color: getScoreColor(jm.breakdown?.experience),
                        fontSize: 32,
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant="h5"
                      sx={{ color: getScoreColor(jm.breakdown?.experience) }}
                    >
                      {jm.breakdown?.experience ?? 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Experience
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={jm.breakdown?.experience ?? 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Skills & Experience Suggestions */}
            <Stack direction="row" spacing={2}>
              {/* Skills Gap */}
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skills Gap Analysis
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Skills identified from job requirements that match your
                    profile or need attention.
                  </Typography>

                  {jm.skillsSuggestions.length === 0 ? (
                    <Alert severity="info">
                      No skill suggestions generated. Try analyzing again.
                    </Alert>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {jm.skillsSuggestions.map((s, idx) => (
                        <Chip
                          key={s + idx}
                          label={s}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Experience Tailoring */}
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Experience Tailoring
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    AI-suggested bullets and accomplishments to highlight for
                    this job.
                  </Typography>

                  {jm.experienceSuggestions.length === 0 ? (
                    <Alert severity="info">
                      {jm.breakdown?.experience === 0
                        ? "No experience data found. Make sure you have employment history in your profile."
                        : "No experience suggestions yet. Analysis may still be processing."}
                    </Alert>
                  ) : (
                    <Stack spacing={1}>
                      {jm.experienceSuggestions.slice(0, 5).map((b, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="body2">{b}</Typography>
                        </Paper>
                      ))}
                      {jm.experienceSuggestions.length > 5 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textAlign: "center", pt: 1 }}
                        >
                          + {jm.experienceSuggestions.length - 5} more
                          suggestions
                        </Typography>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        )}

        {/* Error State (Duplicate removed - already shown above) */}

        {/* Empty State */}
        {!jm.isLoading && jm.matchScore === null && !jm.error && (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <TrendingUpIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No Analysis Yet
            </Typography>
            <Typography color="text.secondary">
              Select a job from the dropdown above and click "Analyze" to see
              your match score and skills gap.
            </Typography>
          </Paper>
        )}
      </Stack>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Container>
  );
}
