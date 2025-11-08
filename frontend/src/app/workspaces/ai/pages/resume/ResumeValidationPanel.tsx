/**
 * ResumeValidationPanel
 * UC-053: Provides quick validation & quality checks for the active resume draft.
 * Checks implemented (heuristic, client-side):
 *  - Length metrics (estimated page length lines)
 *  - Missing key sections (summary, skills, experience)
 *  - Section completeness (empty bullets or skills)
 *  - Basic ATS keyword coverage (naive substring match against job description words)
 *  - Readability proxy (avg sentence length, long sentence warnings)
 *  - Repetition (duplicate skill entries)
 * Future: passive voice detection, grammar, advanced scoring.
 */
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Box,
} from "@mui/material";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

interface JobLite {
  id: number;
  title: string;
  company: string;
  description: string;
}

export default function ResumeValidationPanel() {
  const { active, computeStats } = useResumeDrafts();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const [jobs, setJobs] = React.useState<JobLite[]>([]);
  const [jobId, setJobId] = React.useState<number | null>(null);
  const [jobDescWords, setJobDescWords] = React.useState<Set<string>>(
    new Set()
  );
  const stats = computeStats();

  React.useEffect(() => {
    let mounted = true;
    async function loadJobs() {
      if (!user?.id) return;
      try {
        const u = withUser(user.id);
        const res = await u.listRows<{
          id: number;
          job_title: string | null;
          company_name: string | null;
          job_description: string | null;
        }>("jobs", "id, job_title, company_name, job_description", {
          order: { column: "created_at", ascending: false },
          limit: 30,
        });
        if (res.error)
          throw new Error(res.error.message || "Failed to load jobs");
        if (!mounted) return;
        const items = (res.data || []).map((j) => ({
          id: j.id,
          title: j.job_title || "Untitled",
          company: j.company_name || "",
          description: j.job_description || "",
        }));
        setJobs(items);
        if (items.length && jobId == null) setJobId(items[0].id);
      } catch (e) {
        handleError?.(e);
      }
    }
    loadJobs();
    return () => {
      mounted = false;
    };
  }, [user?.id, handleError, jobId]);

  React.useEffect(() => {
    const selected = jobs.find((j) => j.id === jobId);
    if (selected) {
      const words =
        selected.description.toLowerCase().match(/[a-zA-Z][a-zA-Z0-9-]+/g) ||
        [];
      setJobDescWords(new Set(words.filter((w) => w.length > 3))); // filter short words
    } else {
      setJobDescWords(new Set());
    }
  }, [jobId, jobs]);

  // Validation heuristics
  const summary = active?.content.summary || "";
  const skills = active?.content.skills || [];
  const experience = active?.content.experience || [];

  const missingSummary = summary.trim().length === 0;
  const missingSkills = skills.length === 0;
  const missingExperience = experience.length === 0;

  const duplicateSkills = skills.filter(
    (s, idx) =>
      skills.findIndex((x) => x.toLowerCase() === s.toLowerCase()) !== idx
  );

  // ATS keyword coverage: intersection of unique job words and summary+skills+experience bullets
  const corpus = [summary, ...skills, ...experience.flatMap((e) => e.bullets)]
    .join(" ")
    .toLowerCase();
  let matched = 0;
  for (const w of jobDescWords) if (corpus.includes(w)) matched++;
  const coveragePct = jobDescWords.size
    ? Math.round((matched / jobDescWords.size) * 100)
    : 0;

  // Readability: simple sentence segmentation by period/question/exclamation
  const sentences = summary
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const avgSentenceLength = sentences.length
    ? Math.round(
        sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) /
          sentences.length
      )
    : 0;
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 28);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Resume Validation</Typography>
          {!active && (
            <Typography color="text.secondary">
              Select or create a draft to validate.
            </Typography>
          )}

          <Divider />
          {stats && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Metrics
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`Estimated lines: ${stats.estimatedPageLength}`} />
                <Chip label={`Bullets: ${stats.totalBullets}`} />
                <Chip
                  label={`Experience entries: ${stats.totalExperienceEntries}`}
                />
                <Chip label={`Skills: ${stats.skillsCount}`} />
                <Chip label={`Summary chars: ${stats.summaryLength}`} />
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Section Completeness
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={missingSummary ? "Summary: Missing" : "Summary: OK"}
                color={missingSummary ? "warning" : "success"}
              />
              <Chip
                label={missingSkills ? "Skills: Missing" : "Skills: OK"}
                color={missingSkills ? "warning" : "success"}
              />
              <Chip
                label={
                  missingExperience ? "Experience: Missing" : "Experience: OK"
                }
                color={missingExperience ? "warning" : "success"}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              ATS Keyword Coverage
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`${coveragePct}%`}
                color={
                  coveragePct >= 60
                    ? "success"
                    : coveragePct >= 35
                    ? "warning"
                    : "default"
                }
              />
              <Typography variant="body2" color="text.secondary">
                Matched {matched} / {jobDescWords.size} relevant words
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Readability
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`Avg sentence length: ${avgSentenceLength}`} />
              {longSentences.length > 0 && (
                <Chip
                  label={`Long sentences: ${longSentences.length}`}
                  color="warning"
                />
              )}
            </Stack>
          </Box>

          {duplicateSkills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Duplicates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Duplicate skills detected: {duplicateSkills.join(", ")}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Jobs Context
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {jobs.map((j) => (
                <Chip
                  key={j.id}
                  label={j.title}
                  onClick={() => setJobId(j.id)}
                  color={j.id === jobId ? "primary" : "default"}
                  variant={j.id === jobId ? "filled" : "outlined"}
                />
              ))}
            </Stack>
          </Box>

          <Divider />
          <Typography variant="caption" color="text.secondary">
            Heuristic only. Improve by refining sections, adding quantifiable
            bullets, and aligning keywords.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
