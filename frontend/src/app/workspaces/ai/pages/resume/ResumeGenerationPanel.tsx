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
import { generateResume } from "@workspaces/ai/services/aiGeneration";
import type {
  GenerateResumeResult,
  ResumeArtifactContent,
} from "@workspaces/ai/types/ai";

/**
 * ResumeGenerationPanel
 * Lets the user pick a job and generate a tailored resume snapshot.
 * Shows summary, bullets, skills ordering, sections if returned by backend.
 */
export default function ResumeGenerationPanel() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [jobs, setJobs] = React.useState<
    Array<{ id: number; title: string; company: string }>
  >([]);
  const [loadingJobs, setLoadingJobs] = React.useState(false);
  const [jobId, setJobId] = React.useState<number | "">("");

  const [tone, setTone] = React.useState<string>("professional");
  const [focus, setFocus] = React.useState<string>("");

  const [loadingGen, setLoadingGen] = React.useState(false);
  const [result, setResult] = React.useState<GenerateResumeResult | null>(null);

  React.useEffect(() => {
    let ok = true;
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
    load();
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function onGenerate() {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    setLoadingGen(true);
    try {
      const resp = await generateResume(user.id, jobId, {
        tone,
        focus: focus || undefined,
      });
      setResult(resp);
      showSuccess("Resume generated");
      // Dispatch a global custom event so parent pages can react/apply content to drafts.
      try {
        window.dispatchEvent(
          new CustomEvent("sgt:resumeGenerated", {
            detail: { content: resp.content, jobId },
          })
        );
      } catch (e) {
        // Non-fatal if CustomEvent fails (older browsers or security restrictions)
        console.warn("Failed to dispatch resumeGenerated event", e);
      }
    } catch (e) {
      handleError?.(e);
    } finally {
      setLoadingGen(false);
    }
  }

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {children}
      </Box>
    );
  }

  const content: ResumeArtifactContent | undefined = result?.content;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">AI Resume Generation</Typography>
            <Typography variant="body2" color="text.secondary">
              Tailor a resume to a selected job. This generates structured
              content you can apply to your draft.
            </Typography>
          </Box>
          <FormControl
            size="small"
            sx={{ minWidth: 220 }}
            disabled={loadingJobs}
          >
            <InputLabel id="resume-job-select">Job</InputLabel>
            <Select
              labelId="resume-job-select"
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="tone-select">Tone</InputLabel>
            <Select
              labelId="tone-select"
              value={tone}
              label="Tone"
              onChange={(e) => setTone(e.target.value)}
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="concise">Concise</MenuItem>
              <MenuItem value="impactful">Impactful</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel shrink htmlFor="focus-input">
              Focus
            </InputLabel>
            <Select
              value={focus}
              onChange={(e) => setFocus(String(e.target.value))}
              displayEmpty
              renderValue={(val) =>
                val ? String(val) : "Optional focus (e.g. leadership)"
              }
            >
              <MenuItem value="">(none)</MenuItem>
              <MenuItem value="leadership">Leadership</MenuItem>
              <MenuItem value="cloud">Cloud</MenuItem>
              <MenuItem value="frontend">Frontend</MenuItem>
              <MenuItem value="backend">Backend</MenuItem>
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

        {result && (
          <Stack spacing={2}>
            {typeof content?.score === "number" && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1">Relevance Score:</Typography>
                <Chip
                  label={`${content.score}%`}
                  color={
                    content.score >= 75
                      ? "success"
                      : content.score >= 50
                      ? "warning"
                      : "default"
                  }
                />
              </Stack>
            )}

            {content?.summary && (
              <Section title="Summary">
                <Typography variant="body2">{content.summary}</Typography>
              </Section>
            )}

            {content?.bullets && content.bullets.length > 0 && (
              <Section title="Bullets">
                <Stack spacing={0.5}>
                  {content.bullets.map((b, i) => (
                    <Typography key={`b-${i}`} variant="body2">
                      • {b.text}
                    </Typography>
                  ))}
                </Stack>
              </Section>
            )}

            {content?.ordered_skills && content.ordered_skills.length > 0 && (
              <Section title="Ordered Skills">
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {content.ordered_skills.map((s, i) => (
                    <Chip key={`osk-${s}`} label={`${i + 1}. ${s}`} />
                  ))}
                </Stack>
              </Section>
            )}

            {content?.sections?.experience &&
              content.sections.experience.length > 0 && (
                <Section title="Experience (Tailored)">
                  <Stack spacing={1.5}>
                    {content.sections.experience.map((e, i) => (
                      <Box key={`exp-${i}`}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {e.role}
                          {e.company ? ` — ${e.company}` : ""}
                        </Typography>
                        {e.dates && (
                          <Typography variant="caption" color="text.secondary">
                            {e.dates}
                          </Typography>
                        )}
                        <Stack spacing={0.5} mt={0.5}>
                          {e.bullets.map((t, j) => (
                            <Typography key={`expb-${i}-${j}`} variant="body2">
                              • {t}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Section>
              )}

            {!content && (
              <Typography variant="body2" color="text.secondary">
                Preview only. Full content will be fetched from the artifact
                record.
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
