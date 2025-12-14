import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";
import { useCoreJobs } from "@shared/cache";
import { createPreparationActivity } from "@shared/services/dbMappers";

interface QA {
  id?: string;
  text: string;
  answer?: string;
}

type JobOption = {
  id: string | number;
  job_title?: string | null;
  title?: string | null;
  industry?: string | null;
  company_name?: string | null;
};

type InterviewQuestion = { id?: string; text: string };
type InterviewQuestionsResponse = { questions: InterviewQuestion[] };

type MockInterviewSummary = {
  overall_score?: number;
  score?: number;
  improvement_areas?: string[] | string;
  response_quality_analysis?: string;
  analysis?: string;
  confidence_tips?: string[] | string;
};

export default function MockInterview() {
  const [open, setOpen] = useState(false);
  const [jobTitle] = useState("Software Engineer");
  const [industry] = useState("Technology");
  const [difficulty] = useState<"entry" | "mid" | "senior">("mid");
  const { user, loading: authLoading } = useAuth();
  const jobsQuery = useCoreJobs<JobOption>(user?.id, { enabled: !authLoading });
  const jobs = jobsQuery.data ?? [];
  const jobsLoading = jobsQuery.isLoading || jobsQuery.isFetching;
  const [selectedJobId, setSelectedJobId] = useState<number | string | null>(
    null
  );
  const [questions, setQuestions] = useState<QA[] | null>(null);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MockInterviewSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track mock interview start time to calculate practice minutes
  const startTimeRef = useRef<number | null>(null);

  async function startMock() {
    setLoading(true);
    setSummary(null);
    setErrorMessage(null);
    try {
      // Choose job context: scheduled job if selected, otherwise free-text
      const selectedJob = jobs?.find(
        (j) => String(j.id) === String(selectedJobId)
      );
      const payloadBody: {
        difficulty: "entry" | "mid" | "senior";
        jobId?: string | number;
        jobTitle?: string;
        industry?: string;
        company_name?: string | null;
      } = { difficulty };
      if (selectedJob) {
        payloadBody.jobId = selectedJob.id;
        payloadBody.jobTitle =
          selectedJob.job_title ?? selectedJob.title ?? jobTitle;
        payloadBody.industry = selectedJob.industry ?? industry;
        payloadBody.company_name = selectedJob.company_name ?? null;
      } else {
        payloadBody.jobTitle = jobTitle;
        payloadBody.industry = industry;
      }

      // Try once, then retry once on network failure
      let res: InterviewQuestionsResponse | null = null;
      try {
        res = await aiClient.postJson<InterviewQuestionsResponse>(
          "/api/generate/interview-questions",
          payloadBody
        );
      } catch {
        // Small backoff before retry
        await new Promise((r) => setTimeout(r, 700));
        res = await aiClient.postJson<InterviewQuestionsResponse>(
          "/api/generate/interview-questions",
          payloadBody
        );
      }
      const qs = res?.questions ?? [];
      setQuestions(qs.map((q, i) => ({ id: q.id ?? `q_${i}`, text: q.text })));
      setIndex(0);
      setCurrentAnswer("");
      // Track when the mock interview session starts
      startTimeRef.current = Date.now();
      setOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(`Failed to start mock interview: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Save mock interview practice time to database for InterviewSuccess tracking
   * This ensures practice minutes are counted in the success probability calculation
   */
  async function savePracticeTime(elapsedMs: number, score?: number) {
    if (!user?.id) return;

    const selectedJob = jobs?.find(
      (j) => String(j.id) === String(selectedJobId)
    );
    const linkedJobId = selectedJob?.id ?? null;
    const practiceMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));

    // Determine completion quality based on time spent and score
    let completionQuality: "basic" | "thorough" | "exceptional" = "basic";
    if (practiceMinutes >= 15 && (score ?? 0) >= 70) {
      completionQuality = "exceptional";
    } else if (practiceMinutes >= 10 || (score ?? 0) >= 50) {
      completionQuality = "thorough";
    }

    try {
      await createPreparationActivity(user.id, {
        activity_type: "mock_interview",
        job_id:
          linkedJobId && !isNaN(Number(linkedJobId))
            ? Number(linkedJobId)
            : null,
        activity_description: `Mock interview practice: ${
          selectedJob?.job_title ?? selectedJob?.title ?? jobTitle
        } (${difficulty} level)`,
        time_spent_minutes: practiceMinutes,
        completion_quality: completionQuality,
        activity_date: new Date(),
        notes:
          score != null
            ? `Mock interview completed with score: ${score}%. Questions answered: ${
                questions?.length ?? 0
              }`
            : `Mock interview completed. Questions answered: ${
                questions?.length ?? 0
              }`,
      });
    } catch {
      // Silent fail - don't interrupt user flow for analytics
    }
  }

  function saveCurrentAndNext() {
    if (!questions) return;
    const clone = questions.slice();
    clone[index] = { ...clone[index], answer: currentAnswer };
    setQuestions(clone);
    setCurrentAnswer("");
    if (index < clone.length - 1) setIndex(index + 1);
  }

  function previous() {
    if (!questions) return;
    if (index === 0) return;
    // save current
    const clone = questions.slice();
    clone[index] = { ...clone[index], answer: currentAnswer };
    setQuestions(clone);
    setIndex(index - 1);
    setCurrentAnswer(clone[index - 1]?.answer ?? "");
  }

  async function finish() {
    if (!questions) return;
    // save final
    const clone = questions.map((q) => ({ ...q }));
    clone[index] = { ...clone[index], answer: currentAnswer };
    setQuestions(clone);

    // Calculate elapsed time for practice tracking
    const elapsedMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;

    // send to server for summary
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        jobTitle,
        industry,
        difficulty,
        qa: clone.map((q) => ({ question: q.text, answer: q.answer ?? "" })),
      };
      // Retry once on transient network failures
      let resp: MockInterviewSummary | null = null;
      try {
        resp = await aiClient.postJson<MockInterviewSummary>(
          "/api/generate/mock-interview-summary",
          payload
        );
      } catch {
        // Small backoff before retry
        await new Promise((r) => setTimeout(r, 700));
        resp = await aiClient.postJson<MockInterviewSummary>(
          "/api/generate/mock-interview-summary",
          payload
        );
      }
      setSummary(resp ?? null);

      // Save practice time to database so InterviewSuccess can track it
      const score = resp?.overall_score ?? resp?.score ?? null;
      await savePracticeTime(elapsedMs, score);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(`Failed to get mock interview summary: ${msg}`);

      // Still save the practice time even if summary failed
      await savePracticeTime(elapsedMs);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Mock Interview</Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="mock-job-select-label">
              Select scheduled job
            </InputLabel>
            <Select
              labelId="mock-job-select-label"
              label="Select scheduled job"
              value={selectedJobId ?? ""}
              onChange={(e) =>
                setSelectedJobId(e.target.value as unknown as string | number)
              }
              disabled={jobsLoading}
            >
              <MenuItem value="">(No job selected)</MenuItem>
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>{`${
                  j.job_title || j.title
                } — ${j.company_name ?? ""}`}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Fallback free-text when no scheduled job is chosen */}
          {/* <TextField label="Job Title (fallback)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} size="small" />
          <TextField label="Industry (fallback)" value={industry} onChange={(e) => setIndustry(e.target.value)} size="small" />
        //   <TextField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} size="small" /> */}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={startMock} disabled={loading}>
            {loading ? "Starting..." : "Start Mock Interview"}
          </Button>
        </Stack>

        {/* Dialog flow */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Mock Interview</DialogTitle>
          <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto" }}>
            {questions ? (
              <Box>
                <Typography variant="subtitle2">
                  Question {index + 1} of {questions.length}
                </Typography>
                <Typography sx={{ mt: 1 }}>{questions[index].text}</Typography>
                <TextField
                  label="Your written response"
                  multiline
                  minRows={6}
                  fullWidth
                  sx={{ mt: 2 }}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                />
              </Box>
            ) : (
              <Typography>No questions loaded.</Typography>
            )}

            {errorMessage && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Typography>
            )}
            {summary && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Performance Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Typography variant="subtitle1">
                    Overall Score:{" "}
                    {summary.overall_score ?? summary.score ?? "N/A"}%
                  </Typography>
                  <Typography sx={{ mt: 1 }} variant="subtitle2">
                    Improvement Areas
                  </Typography>
                  {Array.isArray(summary.improvement_areas) ? (
                    summary.improvement_areas.map((s: string, i: number) => (
                      <Typography key={i}>- {s}</Typography>
                    ))
                  ) : (
                    <Typography>
                      {summary.improvement_areas ?? "None"}
                    </Typography>
                  )}

                  <Typography sx={{ mt: 1 }} variant="subtitle2">
                    Response Quality Analysis
                  </Typography>
                  <Typography>
                    {summary.response_quality_analysis ??
                      summary.analysis ??
                      "N/A"}
                  </Typography>

                  <Typography sx={{ mt: 1 }} variant="subtitle2">
                    Confidence Tips
                  </Typography>
                  {Array.isArray(summary.confidence_tips) ? (
                    summary.confidence_tips.map((t: string, i: number) => (
                      <Typography key={i}>- {t}</Typography>
                    ))
                  ) : (
                    <Typography>{summary.confidence_tips ?? "N/A"}</Typography>
                  )}
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={previous} disabled={!questions || index === 0}>
              Previous
            </Button>
            {index < (questions?.length ?? 0) - 1 ? (
              <Button variant="contained" onClick={saveCurrentAndNext}>
                Next
              </Button>
            ) : (
              <Button variant="contained" onClick={finish} disabled={loading}>
                {loading ? "Summarizing..." : "Finish & Get Summary"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
