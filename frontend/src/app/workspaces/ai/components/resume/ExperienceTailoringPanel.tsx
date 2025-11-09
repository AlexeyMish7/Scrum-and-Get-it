/**
 * ExperienceTailoringPanel.tsx
 * Purpose: UI for UC-050 experience tailoring. Select a job, call AI endpoint,
 * dispatch a resume-like content event for downstream merge with the active draft.
 */
import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import useUserJobs from "@shared/hooks/useUserJobs";
import { generateExperienceTailoring } from "@workspaces/ai/services/aiGeneration";
import type {
  ExperienceTailoringResult,
  ExperienceTailoringContent,
} from "@workspaces/ai/types/ai";

/**
 * ExperienceTailoringPanel (UC-050)
 * Lets the user pick a job and generate tailored experience bullets per role.
 * On success, dispatches a global event so the parent page can open the merge dialog.
 */
export default function ExperienceTailoringPanel() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const { jobs, loading: loadingJobs } = useUserJobs(50);
  const [jobId, setJobId] = React.useState<number | "">("");
  const [loadingGen, setLoadingGen] = React.useState(false);
  const [lastScore, setLastScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (jobs.length && jobId === "") setJobId(jobs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  async function onGenerate() {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    setLoadingGen(true);
    try {
      const resp: ExperienceTailoringResult = await generateExperienceTailoring(
        user.id,
        jobId
      );
      // Dispatch event to allow parent to merge bullets using existing dialog
      try {
        // Convert tailored content into resume-like structure for reuse
        const content: ExperienceTailoringContent | undefined = resp?.content;
        const sections = content?.roles
          ? {
              experience: content.roles.map(
                (r: ExperienceTailoringContent["roles"][number]) => ({
                  employment_id: r.employment_id,
                  role: r.role,
                  company: r.company,
                  dates: r.dates,
                  bullets: r.tailored_bullets || [],
                })
              ),
            }
          : undefined;
        const resumeLike = sections ? { sections } : undefined;
        if (resumeLike) {
          window.dispatchEvent(
            new CustomEvent("sgt:resumeGenerated", {
              detail: { content: resumeLike, jobId, ts: Date.now() },
            })
          );
        }
      } catch {
        // non-fatal
      }
      const score: number | undefined = resp?.content?.overall?.global_score;
      setLastScore(typeof score === "number" ? score : null);
      showSuccess("Experience tailoring generated");
    } catch (e) {
      handleError?.(e);
    } finally {
      setLoadingGen(false);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Experience Tailoring</Typography>
            <Typography variant="body2" color="text.secondary">
              Generate improved, role-relevant bullets for each past position.
              Then merge selected bullets into your draft.
            </Typography>
          </Box>
          <FormControl
            size="small"
            sx={{ minWidth: 260 }}
            disabled={loadingJobs}
          >
            <InputLabel id="job-select-label-xp">Job</InputLabel>
            <Select
              labelId="job-select-label-xp"
              value={jobId}
              label="Job"
              onChange={(e) => setJobId(e.target.value as number | "")}
            >
              {loadingJobs && (
                <MenuItem value="">
                  <em>Loading…</em>
                </MenuItem>
              )}
              {!loadingJobs && jobs.length === 0 && (
                <MenuItem value="">
                  <em>No jobs</em>
                </MenuItem>
              )}
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>
                  {j.title} {j.company ? `— ${j.company}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Button
              variant="contained"
              onClick={onGenerate}
              disabled={!jobId || loadingGen || loadingJobs}
              startIcon={
                loadingGen ? <CircularProgress size={16} /> : undefined
              }
            >
              {loadingGen ? "Generating…" : "Generate"}
            </Button>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {typeof lastScore === "number" && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">Overall Relevance:</Typography>
            <Chip
              label={`${lastScore}%`}
              color={
                lastScore >= 75
                  ? "success"
                  : lastScore >= 50
                  ? "warning"
                  : "default"
              }
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
