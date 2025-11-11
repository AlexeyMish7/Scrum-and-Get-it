/**
 * DocumentsPage2 — Job-centric Materials Browser (experimental)
 *
 * Purpose: an alternate Documents UI that lets users search/select a job and
 * view resumes and cover letters generated for that job. This file is a
 * non-destructive experiment; the original `DocumentsPage.tsx` is left
 * unchanged and can be used as the canonical page.
 *
 * Contract:
 * - Inputs: none (reads current authenticated user via `useAuth()`)
 * - Outputs: UI with searchable job selector, lists of resumes and cover
 *   letters associated with the selected job, and download actions.
 * - Error modes: uses `useErrorHandler()`; failures show the global snackbar.
 */

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { supabase } from "@shared/services/supabaseClient";
import { withUser } from "@shared/services/crud";
import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";

export default function DocumentsPage2() {
  const { user } = useAuth() as any;
  const { handleError, showSuccess } = useErrorHandler();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");

  const [resumes, setResumes] = useState<any[]>([]);
  const [covers, setCovers] = useState<any[]>([]);

  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Load jobs for this user
  useEffect(() => {
    if (!user?.id) return;
    setLoadingJobs(true);
    (async () => {
      try {
        const userCrud = withUser(user.id);
        const res = await userCrud.listRows("jobs", "*", { order: { column: "created_at", ascending: false } });
        if (res.error) throw new Error(res.error.message);
        setJobs(res.data || []);
      } catch (err) {
        handleError(err, "Failed to load jobs");
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load materials whenever a job is selected
  useEffect(() => {
    if (!user?.id || selectedJobId === "") return;
    setLoadingMaterials(true);
    (async () => {
      try {
        // 1) Resume drafts: fetch all resumes for user and filter by metadata keys
        const { data: resumeRows, error: resumeErr } = await supabase
          .from("resume_drafts")
          .select("*")
          .eq("user_id", user.id);
        if (resumeErr) throw resumeErr;

        const resumeCandidates = (resumeRows || []).filter((r: any) => {
          const meta = r.metadata ?? r.meta ?? r.data ?? {};
          const jobId = meta?.jobId ?? meta?.jobid ?? meta?.job_id ?? meta?.job;
          return String(jobId) === String(selectedJobId);
        });

  // 2) Cover letters: merge local cache with DB rows for this job
  /**
   * BACKEND NOTE:
   * The client currently reads `cover_letter_drafts` filtered by `user_id`
   * and `job_id` directly via Supabase. To improve performance and
   * avoid client-side merging in high-volume accounts, provide backend
   * support (one of the options below):
   *
   * - RPC / endpoint: an RPC or REST endpoint that returns cover letter
   *   drafts for a given user and job (e.g., GET /api/users/:id/jobs/:jobId/cover-letters).
   *   The endpoint should honor RLS and return only permitted rows and
   *   a small projection (id, title, content, metadata, last_accessed_at).
   *
   * - DB view or indexed query: expose a view or indexed query that
   *   supports fast lookup by `job_id` (and optionally by JSON metadata
   *   keys) so the frontend doesn't need to fetch and filter large
   *   result sets.
   *
   * - Pagination & projection: if large result sets are possible,
   *   the backend should support pagination and returning only the
   *   necessary fields used by this UI.
   *
   * When adding backend support, update this client call to use the
   * new endpoint and remove the ad-hoc client-side merge logic.
   */
  const store = useCoverLetterDrafts.getState();
        if (store.setUserId) store.setUserId(user.id);
        if (store.loadFromCacheSync) store.loadFromCacheSync();
        const cached = (store.drafts || []).filter((c: any) =>
          String(c.job_id ?? c.jobId ?? c.metadata?.jobId ?? "") === String(selectedJobId)
        );

        const { data: dbCovers, error: coverErr } = await supabase
          .from("cover_letter_drafts")
          .select("*")
          .eq("user_id", user.id)
          .eq("job_id", selectedJobId as number);
        if (coverErr) throw coverErr;

        const map = new Map<string, any>();
        (dbCovers || []).forEach((c: any) => map.set(String(c.id), c));
        (cached || []).forEach((c: any) => {
          if (!map.has(String(c.id))) map.set(String(c.id), c);
        });

        setResumes(resumeCandidates || []);
        setCovers(Array.from(map.values()));
      } catch (err) {
        console.error(err);
        handleError(err, "Failed to load materials for job");
        setResumes([]);
        setCovers([]);
      } finally {
        setLoadingMaterials(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, user?.id]);

  // No free-text search: the job selector is a simple dropdown of recent jobs

  function downloadResume(r: any) {
    try {
      const content = r.content ?? r.preview ?? r;
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.title || r.name || "resume"}_${selectedJobId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess("Resume downloaded");
    } catch (err) {
      handleError(err, "Failed to download resume");
    }
  }

  function downloadCover(c: any) {
    try {
      const content = c.content ?? c.text ?? c;
      let text = "";
      if (typeof content === "string") text = content;
      else if (content.sections) {
        const s = content.sections;
        text = `${s.opening || ""}\n\n${s.body || ""}\n\n${s.closing || ""}`;
      } else text = JSON.stringify(content, null, 2);

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${c.title || c.name || "cover_letter"}_${selectedJobId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess("Cover letter downloaded");
    } catch (err) {
      handleError(err, "Failed to download cover letter");
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Documents & Materials — Experiment</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Search for a job and view resumes / cover letters generated for that job.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 380 }}>
            <InputLabel>Job</InputLabel>
            <Select
              value={selectedJobId}
              label="Job"
              onChange={(e) => {
                const v = (e.target.value as any);
                setSelectedJobId(v === "" ? "" : Number(v));
              }}
            >
              <MenuItem value="">-- Select a job --</MenuItem>
              {jobs.map((j) => (
                <MenuItem key={j.id} value={j.id}>{j.job_title} — {j.company_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>{loadingJobs && <CircularProgress size={20} />}</Box>
        </Stack>
      </Paper>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Paper sx={{ width: "50%", p: 2 }}>
          <Typography variant="h6">Resumes</Typography>
          <Divider sx={{ my: 1 }} />
          {loadingMaterials ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}><CircularProgress /></Box>
          ) : resumes.length === 0 ? (
            <Typography color="text.secondary">No resumes found for this job.</Typography>
          ) : (
            <List>
              {resumes.map((r) => (
                <ListItem key={r.id} disablePadding>
                  <ListItemButton>
                    <ListItemText primary={r.title || r.name || `Resume ${r.id}`} secondary={r.created_at ? new Date(r.created_at).toLocaleString() : ""} />
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadResume(r)}>Download</Button>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ width: "50%", p: 2 }}>
          <Typography variant="h6">Cover Letters</Typography>
          <Divider sx={{ my: 1 }} />
          {loadingMaterials ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}><CircularProgress /></Box>
          ) : covers.length === 0 ? (
            <Typography color="text.secondary">No cover letters found for this job.</Typography>
          ) : (
            <List>
              {covers.map((c) => (
                <ListItem key={c.id} disablePadding>
                  <ListItemButton>
                    <ListItemText primary={c.title || c.name || `Cover ${c.id}`} secondary={c.last_accessed_at ? new Date(c.last_accessed_at).toLocaleString() : ""} />
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadCover(c)}>Download</Button>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* global error/snackbar is rendered by SystemLayer; keep local notification hook wired */}
    </Box>
  );
}

