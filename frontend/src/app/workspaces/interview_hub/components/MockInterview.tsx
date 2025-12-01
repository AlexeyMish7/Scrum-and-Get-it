import React, { useEffect, useState } from "react";
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
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";
import jobsService from "@job_pipeline/services/jobsService";

interface QA {
  id?: string;
  text: string;
  answer?: string;
}

export default function MockInterview() {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("Software Engineer");
  const [industry, setIndustry] = useState("Technology");
  const [difficulty, setDifficulty] = useState<"entry" | "mid" | "senior">("mid");
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | string | null>(null);
  const [questions, setQuestions] = useState<QA[] | null>(null);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startMock() {
    setLoading(true);
    setSummary(null);
    setErrorMessage(null);
    try {
      // Choose job context: scheduled job if selected, otherwise free-text
      const selectedJob = jobs?.find((j) => String(j.id) === String(selectedJobId));
      const payloadBody: any = {
        difficulty,
      };
      if (selectedJob) {
        payloadBody.jobId = selectedJob.id;
        payloadBody.jobTitle = selectedJob.job_title ?? selectedJob.title ?? jobTitle;
        payloadBody.industry = selectedJob.industry ?? industry;
        payloadBody.company_name = selectedJob.company_name ?? null;
      } else {
        payloadBody.jobTitle = jobTitle;
        payloadBody.industry = industry;
      }

      // Try once, then retry once on network failure
      let res: any = null;
      try {
        res = await aiClient.postJson<{ questions: QA[] }>("/api/generate/interview-questions", payloadBody as any);
      } catch (err) {
        console.warn("First attempt to fetch interview questions failed, retrying...", err);
        // small backoff
        await new Promise((r) => setTimeout(r, 700));
        res = await aiClient.postJson<{ questions: QA[] }>("/api/generate/interview-questions", payloadBody as any);
      }
      const qs = (res as any)?.questions ?? [];
      setQuestions(qs.map((q: any, i: number) => ({ id: q.id ?? `q_${i}`, text: q.text })));
      setIndex(0);
      setCurrentAnswer("");
      setOpen(true);
    } catch (e) {
      console.error("Failed to start mock interview", e);
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(`Failed to start mock interview: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load scheduled jobs for the user so they can select one for the mock
    let mounted = true;
    async function loadJobs() {
      if (!user) return;
      setJobsLoading(true);
      try {
        const res = await jobsService.listJobs(user.id);
        if (!res.error && res.data) {
          if (mounted) setJobs(Array.isArray(res.data) ? res.data : [res.data]);
        } else {
          if (mounted) setJobs([]);
        }
      } catch (err) {
        console.error("MockInterview: failed to load jobs", err);
        if (mounted) setJobs([]);
      } finally {
        if (mounted) setJobsLoading(false);
      }
    }

    if (!authLoading) loadJobs();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

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
      let resp: any = null;
      try {
        resp = await aiClient.postJson("/api/generate/mock-interview-summary", payload as any);
      } catch (err) {
        console.warn("First attempt to fetch mock summary failed, retrying...", err);
        await new Promise((r) => setTimeout(r, 700));
        resp = await aiClient.postJson("/api/generate/mock-interview-summary", payload as any);
      }
      setSummary(resp);
    } catch (e) {
      console.error("Failed to get mock interview summary", e);
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(`Failed to get mock interview summary: ${msg}`);
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
            <InputLabel id="mock-job-select-label">Select scheduled job</InputLabel>
            <Select
              labelId="mock-job-select-label"
              label="Select scheduled job"
              value={selectedJobId ?? ""}
              onChange={(e) => setSelectedJobId(e.target.value as any)}
              disabled={jobsLoading}
            >
              <MenuItem value="">(No job selected)</MenuItem>
              {jobs && jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>{`${j.job_title || j.title} — ${j.company_name ?? ""}`}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Fallback free-text when no scheduled job is chosen */}
          {/* <TextField label="Job Title (fallback)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} size="small" />
          <TextField label="Industry (fallback)" value={industry} onChange={(e) => setIndustry(e.target.value)} size="small" />
        //   <TextField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} size="small" /> */}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={startMock} disabled={loading}>{loading ? "Starting..." : "Start Mock Interview"}</Button>
        </Stack>

        {/* Dialog flow */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>Mock Interview</DialogTitle>
          <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {questions ? (
              <Box>
                <Typography variant="subtitle2">Question {index + 1} of {questions.length}</Typography>
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
              <Typography color="error" sx={{ mt: 2 }}>{errorMessage}</Typography>
            )}
            {summary && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Performance Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Typography variant="subtitle1">Overall Score: {summary.overall_score ?? summary.score ?? "N/A"}%</Typography>
                  <Typography sx={{ mt: 1 }} variant="subtitle2">Improvement Areas</Typography>
                  {Array.isArray(summary.improvement_areas) ? summary.improvement_areas.map((s: any, i: number) => (
                    <Typography key={i}>- {s}</Typography>
                  )) : <Typography>{summary.improvement_areas ?? "None"}</Typography>}

                  <Typography sx={{ mt: 1 }} variant="subtitle2">Response Quality Analysis</Typography>
                  <Typography>{summary.response_quality_analysis ?? summary.analysis ?? "N/A"}</Typography>

                  <Typography sx={{ mt: 1 }} variant="subtitle2">Confidence Tips</Typography>
                  {Array.isArray(summary.confidence_tips) ? summary.confidence_tips.map((t: any, i: number) => (
                    <Typography key={i}>- {t}</Typography>
                  )) : <Typography>{summary.confidence_tips ?? "N/A"}</Typography>}
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={previous} disabled={!questions || index === 0}>Previous</Button>
            {index < (questions?.length ?? 0) - 1 ? (
              <Button variant="contained" onClick={saveCurrentAndNext}>Next</Button>
            ) : (
              <Button variant="contained" onClick={finish} disabled={loading}>{loading ? "Summarizing..." : "Finish & Get Summary"}</Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
