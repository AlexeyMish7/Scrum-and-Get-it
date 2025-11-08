import React, { useMemo, useState } from "react";
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
import {
  generateSkillsOptimization,
  type SkillsOptimizationResult,
} from "@workspaces/ai/services/aiGeneration";
import type { SkillsOptimizationContent } from "@workspaces/ai/types/ai";

/**
 * SkillsOptimizationPanel
 * UC-049 frontend UI: select a job, call AI to optimize resume skills, and display results.
 * Inputs: uses current auth user, loads user's jobs, accepts selection, triggers backend POST.
 * Output: Renders emphasize/add/order/categories/gaps/score with simple visual cues.
 */
export default function SkillsOptimizationPanel() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [jobs, setJobs] = useState<
    Array<{ id: number; title: string; company: string }>
  >([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobId, setJobId] = useState<number | "">("");
  const [loadingGen, setLoadingGen] = useState(false);
  const [result, setResult] = useState<SkillsOptimizationContent | null>(null);

  // Load jobs lazily when the panel first renders (scoped to user)
  React.useEffect(() => {
    let mounted = true;
    async function loadJobs() {
      if (!user?.id) return;
      setLoadingJobs(true);
      try {
        // Use user-scoped CRUD to ensure RLS-safe filtering
        const u = withUser(user.id);
        const res = await u.listRows<{
          id: number;
          job_title: string | null;
          company_name: string | null;
        }>("jobs", "id, job_title, company_name", {
          order: { column: "created_at", ascending: false },
          limit: 50,
        });
        if (!mounted) return;
        if (res.error)
          throw new Error(res.error.message || "Failed to load jobs");
        const items = (res.data ?? []).map((j) => ({
          id: j.id,
          title: j.job_title ?? "Untitled",
          company: j.company_name ?? "",
        }));
        setJobs(items);
        // Preselect most recent job if available
        if (items.length && jobId === "") setJobId(items[0].id);
      } catch (e) {
        handleError?.(e);
      } finally {
        setLoadingJobs(false);
      }
    }
    loadJobs();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function runOptimization() {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    setLoadingGen(true);
    try {
      const resp: SkillsOptimizationResult = await generateSkillsOptimization(
        user.id,
        jobId
      );
      // Backend may or may not include full content; we optimistically read it if present
      const content = resp?.content as SkillsOptimizationContent | undefined;
      if (content) {
        setResult(content);
      } else {
        // As a fallback, tell the user an artifact was created and can be viewed later
        setResult(null);
      }
      showSuccess("Skills optimization generated");
    } catch (e) {
      handleError?.(e);
    } finally {
      setLoadingGen(false);
    }
  }

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Skills Optimization</Typography>
            <Typography variant="body2" color="text.secondary">
              Analyze a job posting against your profile to emphasize the right
              skills and order them for ATS.
            </Typography>
          </Box>
          <FormControl
            size="small"
            sx={{ minWidth: 260 }}
            disabled={loadingJobs}
          >
            <InputLabel id="job-select-label">Job</InputLabel>
            <Select
              labelId="job-select-label"
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
                  <em>No jobs found</em>
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
              onClick={runOptimization}
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

        {/* Results */}
        {!loadingGen && result && (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <Typography variant="subtitle1">Match Score:</Typography>
              <Chip
                color={
                  result.score >= 75
                    ? "success"
                    : result.score >= 50
                    ? "warning"
                    : "default"
                }
                label={`${result.score}%`}
              />
              {selectedJob && (
                <Typography variant="body2" color="text.secondary">
                  for {selectedJob.title}{" "}
                  {selectedJob.company ? `@ ${selectedJob.company}` : ""}
                </Typography>
              )}
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Emphasize
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {result.emphasize.map((s) => (
                  <Chip
                    key={`em-${s}`}
                    label={s}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Add
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {result.add.map((s) => (
                  <Chip
                    key={`add-${s}`}
                    label={s}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Recommended Order
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {result.order.map((s, idx) => (
                  <Chip key={`ord-${s}`} label={`${idx + 1}. ${s}`} />
                ))}
              </Stack>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Technical
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {result.categories.technical.map((s) => (
                    <Chip key={`tech-${s}`} label={s} size="small" />
                  ))}
                </Stack>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Soft
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {result.categories.soft.map((s) => (
                    <Chip key={`soft-${s}`} label={s} size="small" />
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Gaps
              </Typography>
              {result.gaps.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No major gaps detected.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {result.gaps.map((s) => (
                    <Chip
                      key={`gap-${s}`}
                      label={s}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}

        {loadingGen && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Analyzing skills…
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
