/**
 * DocumentsDrawer — Reusable job materials browser in drawer format
 *
 * Purpose: Display resumes and cover letters for a selected job in a
 * right-anchored drawer overlay. Used in Pipeline page or anywhere
 * job materials need to be viewed without navigation.
 *
 * Contract:
 * - Inputs:
 *   - open: boolean — drawer visibility
 *   - onClose: () => void — callback to close drawer
 *   - selectedJobId?: number — optional pre-selected job ID
 * - Outputs:
 *   - UI with job selector dropdown, resume list, cover letter list
 *   - Download actions for each document
 * - Error modes: uses `useErrorHandler()` for feedback
 */

import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { supabase } from "@shared/services/supabaseClient";
import { withUser } from "@shared/services/crud";
import type { JobRow } from "@job_pipeline/types";

// Types for resume/cover drafts (minimal interface)
interface DraftDocument {
  id: string;
  title?: string;
  name?: string;
  content?: unknown;
  preview?: unknown;
  text?: unknown;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  data?: Record<string, unknown>;
  job_id?: number;
  jobId?: number;
}

interface DocumentsDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedJobId?: number;
}

export default function DocumentsDrawer({
  open,
  onClose,
  selectedJobId: initialJobId,
}: DocumentsDrawerProps) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | "">(
    initialJobId || ""
  );

  const [resumes, setResumes] = useState<DraftDocument[]>([]);
  const [covers, setCovers] = useState<DraftDocument[]>([]);

  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Update selected job if prop changes
  useEffect(() => {
    if (initialJobId) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId]);

  // Load jobs for this user
  useEffect(() => {
    if (!user?.id) return;
    setLoadingJobs(true);
    (async () => {
      try {
        const userCrud = withUser(user.id);
        const res = await userCrud.listRows("jobs", "*", {
          order: { column: "created_at", ascending: false },
        });
        if (res.error) throw new Error(res.error.message);
        setJobs((res.data || []) as JobRow[]);
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

        const resumeCandidates = (resumeRows || []).filter(
          (r: DraftDocument) => {
            const meta = r.metadata ?? r.meta ?? r.data ?? {};
            const jobId =
              meta?.jobId ?? meta?.jobid ?? meta?.job_id ?? meta?.job;
            return String(jobId) === String(selectedJobId);
          }
        );

        // 2) Cover letters from database for this job
        const { data: dbCovers, error: coverErr } = await supabase
          .from("cover_letter_drafts")
          .select("*")
          .eq("user_id", user.id)
          .eq("job_id", selectedJobId as number);
        if (coverErr) throw coverErr;

        setResumes(resumeCandidates || []);
        setCovers(dbCovers || []);
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

  function downloadResume(r: DraftDocument) {
    try {
      const content = r.content ?? r.preview ?? r;
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      });
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

  function downloadCover(c: DraftDocument) {
    try {
      const content = c.content ?? c.text ?? c;
      let text = "";
      if (typeof content === "string") text = content;
      else if (
        content &&
        typeof content === "object" &&
        "sections" in content
      ) {
        const s = content.sections as Record<string, string>;
        text = `${s.opening || ""}\n\n${s.body || ""}\n\n${s.closing || ""}`;
      } else text = JSON.stringify(content, null, 2);

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        c.title || c.name || "cover_letter"
      }_${selectedJobId}.txt`;
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
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 500,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">Documents & Materials</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Job Selector */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" fullWidth>
              <InputLabel>Job</InputLabel>
              <Select
                value={selectedJobId}
                label="Job"
                onChange={(e) => {
                  const v = e.target.value;
                  if (typeof v === "string" && v === "") {
                    setSelectedJobId("");
                  } else {
                    setSelectedJobId(Number(v));
                  }
                }}
              >
                <MenuItem value="">-- Select a job --</MenuItem>
                {jobs.map((j) => (
                  <MenuItem key={j.id} value={j.id}>
                    {j.job_title} — {j.company_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingJobs && <CircularProgress size={20} />}
          </Stack>
        </Box>

        {/* Materials Lists */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {/* Resumes Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Resumes
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {loadingMaterials ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : resumes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No resumes found for this job.
              </Typography>
            ) : (
              <List dense>
                {resumes.map((r) => (
                  <ListItem key={r.id} disablePadding>
                    <ListItemButton>
                      <ListItemText
                        primary={r.title || r.name || `Resume ${r.id}`}
                        secondary={
                          r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : ""
                        }
                      />
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => downloadResume(r)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Cover Letters Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Cover Letters
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {loadingMaterials ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : covers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No cover letters found for this job.
              </Typography>
            ) : (
              <List dense>
                {covers.map((c) => (
                  <ListItem key={c.id} disablePadding>
                    <ListItemButton>
                      <ListItemText
                        primary={c.title || c.name || `Cover ${c.id}`}
                        secondary={
                          c.last_accessed_at
                            ? new Date(c.last_accessed_at).toLocaleString()
                            : ""
                        }
                      />
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => downloadCover(c)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
