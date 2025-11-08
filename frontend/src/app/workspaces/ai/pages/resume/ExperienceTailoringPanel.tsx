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
import { withUser } from "@shared/services/crud";
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

  const [jobs, setJobs] = React.useState<
    Array<{ id: number; title: string; company: string }>
  >([]);
  const [loadingJobs, setLoadingJobs] = React.useState(false);
  const [jobId, setJobId] = React.useState<number | "">("");
  const [loadingGen, setLoadingGen] = React.useState(false);
  const [lastScore, setLastScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    let ok = true;
    async function loadJobs() {
      if (!user?.id) return;
      setLoadingJobs(true);
      try {
        const u = withUser(user.id);
        const res = await u.listRows<{
          id: number;
          job_title: string | null;
          company_name: string | null;
        }>("jobs", "id, job_title, company_name", {
          order: { column: "created_at", ascending: false },
          limit: 50,
        });
        if (!ok) return;
        if (res.error)
          throw new Error(res.error.message || "Failed to load jobs");
        const items = (res.data ?? []).map((j) => ({
          id: j.id,
          title: j.job_title ?? "Untitled",
          company: j.company_name ?? "",
        }));
        setJobs(items);
        if (items.length && jobId === "") setJobId(items[0].id);
      } catch (e) {
        handleError?.(e);
      } finally {
        setLoadingJobs(false);
      }
    }
    loadJobs();
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
              detail: { content: resumeLike, jobId },
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
