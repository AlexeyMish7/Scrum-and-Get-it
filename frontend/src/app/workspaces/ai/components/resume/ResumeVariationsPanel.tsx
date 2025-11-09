/**
 * ResumeVariationsPanel
 * PURPOSE: Generate multiple resume variations (UC-047 extension) and allow applying
 * summary, ordered skills, or merging experience bullets from each variation card.
 */
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { withUser } from "@shared/services/crud";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import BulletMergeDialog from "./BulletMergeDialog";
import { generateResume } from "@workspaces/ai/services/aiGeneration";
import type {
  GenerateResumeResult,
  ResumeArtifactContent,
} from "@workspaces/ai/types/ai";

interface VariationState {
  loading: boolean;
  result?: GenerateResumeResult;
  error?: string;
  variantIndex: number;
}

export default function ResumeVariationsPanel() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const { active, applyOrderedSkills, applySummary, appendExperienceFromAI } =
    useResumeDrafts();

  const [jobs, setJobs] = useState<
    Array<{ id: number; title: string; company: string }>
  >([]);
  const [jobId, setJobId] = useState<number | "">("");
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [variants, setVariants] = useState<VariationState[]>([]);
  const [running, setRunning] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeContent, setMergeContent] =
    useState<ResumeArtifactContent | null>(null);

  // Load jobs similar to other panels
  useEffect(() => {
    let mounted = true;
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
        if (res.error) throw new Error(res.error.message);
        if (!mounted) return;
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
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const generateVariations = useCallback(async () => {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    setRunning(true);
    // Guard: track mounted state for this run to avoid state updates after unmount/job change
    let cancelled = false;
    const currentJob = jobId;
    // Initialize 3 variant slots
    setVariants([
      { loading: true, variantIndex: 0 },
      { loading: true, variantIndex: 1 },
      { loading: true, variantIndex: 2 },
    ]);
    const promises = [0, 1, 2].map(async (i) => {
      try {
        const result = await generateResume(user.id, jobId, { variant: i });
        return { i, result } as { i: number; result: GenerateResumeResult };
      } catch (e) {
        const msg = (e as Error)?.message || "Failed";
        return { i, error: msg } as { i: number; error: string };
      }
    });
    const settled = await Promise.all(promises);
    if (cancelled || currentJob !== jobId) {
      // job changed or unmounted; skip updating state
      setRunning(false);
      return;
    }
    setVariants((prev) =>
      prev.map((v) => {
        const match = settled.find((s) => s.i === v.variantIndex);
        if (!match) return v;
        if ("result" in match) {
          return {
            ...v,
            loading: false,
            result: match.result,
            error: undefined,
          };
        }
        return {
          ...v,
          loading: false,
          error: (match as { error: string }).error,
        };
      })
    );
    setRunning(false);
    return () => {
      cancelled = true;
    };
  }, [user?.id, jobId]);

  function applySkills(content?: ResumeArtifactContent) {
    if (!content) return handleError?.(new Error("No content"));
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!content.ordered_skills?.length)
      return handleError?.(new Error("No ordered skills"));
    applyOrderedSkills(content.ordered_skills);
    showSuccess("Applied ordered skills");
  }

  function applySummaryToDraft(content?: ResumeArtifactContent) {
    if (!content) return handleError?.(new Error("No content"));
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!content.summary) return handleError?.(new Error("No summary"));
    applySummary(content.summary);
    showSuccess("Applied summary");
  }

  function mergeExperience(content?: ResumeArtifactContent) {
    if (!content) return handleError?.(new Error("No content"));
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    const exp = content.sections?.experience;
    if (!exp?.length) return handleError?.(new Error("No experience bullets"));
    setMergeContent(content);
    setMergeOpen(true);
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Resume Variations</Typography>
              <Typography variant="body2" color="text.secondary">
                Generate multiple tailored versions to compare and selectively
                apply improvements.
              </Typography>
            </Box>
            <FormControl
              size="small"
              sx={{ minWidth: 240 }}
              disabled={loadingJobs || running}
            >
              <InputLabel id="variations-job-select">Job</InputLabel>
              <Select
                labelId="variations-job-select"
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
            <Button
              variant="contained"
              onClick={generateVariations}
              disabled={!jobId || running || loadingJobs}
              startIcon={running ? <CircularProgress size={16} /> : undefined}
            >
              {running ? "Generating…" : "Generate 3 Variations"}
            </Button>
          </Stack>
          <Divider />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {variants.map((v) => {
              const content = v.result?.content;
              return (
                <Box key={v.variantIndex} sx={{ flex: 1, minWidth: 0 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      opacity: v.loading ? 0.6 : 1,
                      borderColor: v.error ? "error.main" : "divider",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">
                            Variant {v.variantIndex + 1}
                          </Typography>
                          {v.loading && <CircularProgress size={14} />}
                          {v.error && (
                            <Chip size="small" color="error" label="Error" />
                          )}
                          {content?.score !== undefined && (
                            <Chip
                              size="small"
                              label={`${content.score}%`}
                              color={
                                content.score >= 75
                                  ? "success"
                                  : content.score >= 50
                                  ? "warning"
                                  : "default"
                              }
                            />
                          )}
                        </Stack>
                        {content?.summary && (
                          <Typography variant="body2" sx={{ fontSize: 12 }}>
                            {content.summary.slice(0, 140)}
                            {content.summary.length > 140 ? "…" : ""}
                          </Typography>
                        )}
                        {content?.ordered_skills && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {content.ordered_skills.slice(0, 6).map((s, i2) => (
                              <Chip
                                key={s + i2}
                                label={`${i2 + 1}. ${s}`}
                                size="small"
                              />
                            ))}
                          </Stack>
                        )}
                        {content?.sections?.experience && (
                          <Stack spacing={0.5}>
                            {content.sections.experience
                              .slice(0, 2)
                              .map((e, ie) => (
                                <Typography key={ie} variant="caption">
                                  • {e.role} {e.company ? `— ${e.company}` : ""}{" "}
                                  ({e.bullets.length} bullets)
                                </Typography>
                              ))}
                          </Stack>
                        )}
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={0.5}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => applySummaryToDraft(content)}
                            disabled={!active || !content?.summary || v.loading}
                          >
                            Summary
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => applySkills(content)}
                            disabled={
                              !active ||
                              !content?.ordered_skills?.length ||
                              v.loading
                            }
                          >
                            Skills
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => mergeExperience(content)}
                            disabled={
                              !active ||
                              !content?.sections?.experience?.length ||
                              v.loading
                            }
                          >
                            Experience
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Stack>
        </Stack>
        <BulletMergeDialog
          open={mergeOpen}
          onClose={() => setMergeOpen(false)}
          aiContent={mergeContent || undefined}
          draftExperience={active?.content.experience}
          onApply={(rows) => {
            appendExperienceFromAI(
              rows.map((r) => ({
                role: r.role || "Experience",
                company: r.company,
                dates: r.dates,
                bullets: r.bullets,
              })) as {
                role: string;
                company?: string;
                dates?: string;
                bullets: string[];
              }[]
            );
            showSuccess("Merged experience from variation");
          }}
        />
      </CardContent>
    </Card>
  );
}
