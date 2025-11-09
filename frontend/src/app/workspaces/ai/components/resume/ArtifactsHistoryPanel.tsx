/**
 * ArtifactsHistoryPanel
 * PURPOSE: List recent resume artifacts for a selected job and allow applying
 * summary, ordered skills, or merging experience bullets into the active draft.
 * FLOW: load jobs → select job → fetch artifacts → preview → apply actions.
 */
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { withUser } from "@shared/services/crud";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import BulletMergeDialog from "./BulletMergeDialog";
import { aiGeneration } from "@workspaces/ai/services/aiGeneration";
import type {
  AIArtifactSummary,
  AIArtifact,
  ResumeArtifactContent,
} from "@workspaces/ai/types/ai";

export default function ArtifactsHistoryPanel() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const { active, applyOrderedSkills, applySummary, appendExperienceFromAI } =
    useResumeDrafts();

  const [jobs, setJobs] = React.useState<
    Array<{ id: number; title: string; company: string }>
  >([]);
  const [jobId, setJobId] = React.useState<number | "">("");
  const [loadingJobs, setLoadingJobs] = React.useState(false);

  const [artifacts, setArtifacts] = React.useState<AIArtifactSummary[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = React.useState(false);
  const [selectedArtifact, setSelectedArtifact] = React.useState<
    AIArtifactSummary | AIArtifact | null
  >(null);
  const [loadingSelected, setLoadingSelected] = React.useState(false);
  const [mergeOpen, setMergeOpen] = React.useState(false);

  // Load jobs
  React.useEffect(() => {
    let mounted = true;
    async function load() {
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
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load artifacts when job changes
  React.useEffect(() => {
    let mounted = true;
    async function loadArtifacts() {
      if (!user?.id || !jobId || typeof jobId !== "number") return;
      setLoadingArtifacts(true);
      try {
        const resp = await aiGeneration.listArtifacts(user.id, {
          kind: "resume",
          jobId,
          limit: 10,
        });
        if (!mounted) return;
        setArtifacts(resp.items);
        setSelectedArtifact(null);
      } catch (e) {
        handleError?.(e);
      } finally {
        setLoadingArtifacts(false);
      }
    }
    loadArtifacts();
    return () => {
      mounted = false;
    };
  }, [user?.id, jobId, handleError]);

  async function selectArtifact(a: AIArtifactSummary) {
    setSelectedArtifact(a);
    // If content is missing/partial, attempt to fetch the full artifact
    const hasContent = a && typeof a.content === "object" && a.content !== null;
    if (!user?.id) return;
    if (!hasContent) {
      setLoadingSelected(true);
      try {
        const full = await aiGeneration.getArtifact(user.id, a.id);
        setSelectedArtifact(full.artifact);
      } catch (e) {
        handleError?.(e);
      } finally {
        setLoadingSelected(false);
      }
    }
  }

  // Artifact content may be partial; attempt to coerce
  const resumeContent: ResumeArtifactContent | null = React.useMemo(() => {
    const raw = selectedArtifact?.content;
    if (raw && typeof raw === "object") {
      return raw as ResumeArtifactContent;
    }
    return null;
  }, [selectedArtifact]);

  function applySkills() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!resumeContent?.ordered_skills?.length)
      return handleError?.(new Error("No ordered skills in artifact"));
    applyOrderedSkills(resumeContent.ordered_skills);
    showSuccess("Applied ordered skills from artifact");
  }

  function applySummaryToDraft() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!resumeContent?.summary)
      return handleError?.(new Error("No summary in artifact"));
    applySummary(resumeContent.summary);
    showSuccess("Applied summary from artifact");
  }

  function mergeExperience() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    const exp = resumeContent?.sections?.experience;
    if (!exp?.length)
      return handleError?.(new Error("No experience section in artifact"));
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
              <Typography variant="h6">Resume Artifacts History</Typography>
              <Typography variant="body2" color="text.secondary">
                Review previously generated resume versions and apply portions
                to your active draft.
              </Typography>
            </Box>
            <FormControl
              size="small"
              sx={{ minWidth: 240 }}
              disabled={loadingJobs}
            >
              <InputLabel id="artifacts-job-select">Job</InputLabel>
              <Select
                labelId="artifacts-job-select"
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
          </Stack>

          <Divider />

          {loadingArtifacts && (
            <Typography variant="body2" color="text.secondary">
              Loading artifacts…
            </Typography>
          )}
          {!loadingArtifacts && artifacts.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No artifacts yet for this job.
            </Typography>
          )}
          {!loadingArtifacts && artifacts.length > 0 && (
            <Stack spacing={1}>
              {artifacts.map((a) => (
                <Box
                  key={a.id}
                  onClick={() => selectArtifact(a)}
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderColor:
                      selectedArtifact?.id === a.id
                        ? "primary.main"
                        : "divider",
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" sx={{ flex: 1 }}>
                      {a.title || "Resume Artifact"}
                    </Typography>
                    {a.created_at && (
                      <Chip
                        size="small"
                        label={new Date(a.created_at).toLocaleDateString()}
                      />
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          {selectedArtifact && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Selected Artifact Preview
              </Typography>
              {loadingSelected && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Loading artifact…
                </Typography>
              )}
              {!loadingSelected && !resumeContent && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  No preview content available for this artifact.
                </Typography>
              )}
              {resumeContent?.summary && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Summary:</strong> {resumeContent?.summary}
                </Typography>
              )}
              {resumeContent?.ordered_skills && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ordered Skills
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
                    {resumeContent?.ordered_skills.map((s, i) => (
                      <Chip key={s + i} label={`${i + 1}. ${s}`} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
              {resumeContent?.sections?.experience && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Experience (tailored bullets)
                  </Typography>
                  <Stack spacing={0.75} mt={0.5}>
                    {resumeContent?.sections?.experience
                      .slice(0, 3)
                      .map((e, idx) => (
                        <Typography key={idx} variant="body2">
                          • {e.role} {e.company ? `— ${e.company}` : ""} (
                          {e.bullets.length} bullets)
                        </Typography>
                      ))}
                  </Stack>
                </Box>
              )}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={applySummaryToDraft}
                  disabled={
                    !active || !resumeContent?.summary || loadingSelected
                  }
                >
                  Apply Summary
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={applySkills}
                  disabled={
                    !active ||
                    !resumeContent?.ordered_skills?.length ||
                    loadingSelected
                  }
                >
                  Apply Ordered Skills
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={mergeExperience}
                  disabled={
                    !active ||
                    !resumeContent?.sections?.experience?.length ||
                    loadingSelected
                  }
                >
                  Merge Experience
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
        <BulletMergeDialog
          open={mergeOpen}
          onClose={() => setMergeOpen(false)}
          aiContent={resumeContent || undefined}
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
            showSuccess("Merged experience bullets from artifact");
          }}
        />
      </CardContent>
    </Card>
  );
}
