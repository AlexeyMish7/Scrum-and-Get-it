import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import InterviewScheduling from "./InterviewScheduling";
import { useAuth } from "@shared/context/AuthContext";
import { supabase } from "@shared/services/supabaseClient";
import JSZip from "jszip";
import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";

export default function AutomationsPage() {
  const { user } = useAuth() as any;
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "info",
  });

  const [resumeList, setResumeList] = useState<any[]>([]);
  const [coverList, setCoverList] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [selectedCover, setSelectedCover] = useState<string>("");

  const [openDialog, setOpenDialog] = useState(false);

  const [schedule, setSchedule] = useState("");
  const [jobName, setJobName] = useState("");
  const [scheduledApplications, setScheduledApplications] = useState<
    { id: string; datetime: string; jobTitle?: string }[]
  >([]);

  function uid(prefix = "a") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // Load resumes and cover letters on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        // First, try to read any locally cached cover-letter drafts from the
        // cover-letter Zustand store. This lets users see drafts that haven't
        // been synced to the DB yet (created/edited in the Cover Letter editor).
        const store = useCoverLetterDrafts.getState();

        // If the store expects a user id / cache load, call those helpers.
        // These are no-ops if the implementation doesn't require them.
        if (store.setUserId) store.setUserId(user.id);
        if (store.loadFromCacheSync) store.loadFromCacheSync();

        const cachedCovers = store.drafts ?? [];

        // Then fetch persisted drafts from the DB as a fallback / canonical source.
        const { data: resumes } = await supabase
          .from("resume_drafts")
          .select("*")
          .eq("user_id", user.id);

        const { data: covers } = await supabase
          .from("cover_letter_drafts")
          .select("*")
          .eq("user_id", user.id);

        // Merge cached covers with DB covers. If an ID exists in DB, prefer DB
        // (assumed canonical). Otherwise include the cached draft so it is
        // available to the Automations UI immediately.
        const dbCovers = covers || [];
        const mergedMap = new Map<string, any>();

        dbCovers.forEach((c: any) => mergedMap.set(String(c.id), c));
        cachedCovers.forEach((c: any) => {
          if (!mergedMap.has(String(c.id))) mergedMap.set(String(c.id), c);
        });

        setResumeList(resumes || []);
        setCoverList(Array.from(mergedMap.values()));
      } catch (err) {
        console.error("Failed to load resumes/covers:", err);
        setResumeList([]);
        setCoverList([]);
      }
    })();
  }, [user]);

  // When user clicks Generate Package, open dialog
  const handleOpenDialog = () => {
    if (!user?.id) {
      setSnackbar({
        open: true,
        message: "Please sign in to generate a package.",
        severity: "info",
      });
      return;
    }

    if (resumeList.length === 0 && coverList.length === 0) {
      setSnackbar({
        open: true,
        message: "No resumes or cover letters found in your account.",
        severity: "info",
      });
      return;
    }

    setOpenDialog(true);
  };

  const handleGeneratePackage = async () => {
    try {
      const zip = new JSZip();

      const resume = resumeList.find((r) => r.id === selectedResume);
      const cover = coverList.find((c) => c.id === selectedCover);

      if (!resume && !cover) {
        setSnackbar({
          open: true,
          message: "Please select at least one document.",
          severity: "info",
        });
        return;
      }

      if (resume) {
        const resumeContent = resume.content ?? {};
        zip.file("resume.json", JSON.stringify(resumeContent, null, 2));
      }

      if (cover) {
        const coverContent = cover.content ?? {};
        let coverText = "";
        if (typeof coverContent === "string") coverText = coverContent;
        else if (
          coverContent.sections?.opening ||
          coverContent.sections?.body ||
          coverContent.sections?.closing
        ) {
          const s = coverContent.sections;
          coverText = `${s.opening || ""}\n\n${s.body || ""}\n\n${
            s.closing || ""
          }`;
        } else if (coverContent.text) coverText = String(coverContent.text);
        else coverText = JSON.stringify(coverContent, null, 2);
        zip.file("cover_letter.txt", coverText);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `application_package_${new Date()
        .toISOString()
        .slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Application package downloaded.",
        severity: "success",
      });
      setOpenDialog(false);
    } catch (err: any) {
      console.error("Generate package failed:", err);
      setSnackbar({
        open: true,
        message: err?.message ?? "Failed to generate package.",
        severity: "info",
      });
    }
  };

  const handleScheduleSubmission = () => {
    if (!schedule) {
      setSnackbar({
        open: true,
        message: "Please enter a submission date/time.",
        severity: "info",
      });
      return;
    }

    setScheduledApplications((cur) => [
      ...cur,
      { id: uid(), datetime: schedule, jobTitle: jobName },
    ]);

    setSnackbar({
      open: true,
      message: `Application for "${jobName}" scheduled for ${schedule}.`,
      severity: "success",
    });

    setSchedule("");
    setJobName("");
  };

  return (
    <Box sx={{ p: 4 }}>
      <RegionAnchor
        id="[H]"
        desc="Automation rules, scheduling, and bulk actions"
      />
      <Typography variant="h4" sx={{ mb: 2 }}>
        Automations & Workflows
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Build and manage automation rules for job application efficiency.
      </Typography>

      <Grid container spacing={3}>
        {/* Generate Application Packages */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Generate Application Packages</Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Choose a resume and cover letter to combine into one downloadable
                package.
              </Typography>
              <Button variant="contained" onClick={handleOpenDialog}>
                Generate Package
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Application Submissions */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">
                Schedule Application Submissions
              </Typography>
              <TextField
                label="Job Name"
                fullWidth
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                type="datetime-local"
                fullWidth
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" onClick={handleScheduleSubmission}>
                Schedule Submission
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Submissions */}
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">Scheduled Submissions</Typography>
            {scheduledApplications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No scheduled submissions yet.
              </Typography>
            ) : (
              <List>
                {scheduledApplications.map((app) => (
                  <ListItem key={app.id}>
                    <ListItemText
                      primary={app.jobTitle || "Job Application"}
                      secondary={new Date(app.datetime).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Grid size={12}>
          <InterviewScheduling />
        </Grid>
      </Grid>

      {/* Dialog for selecting resume/cover letter */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Select Resume and Cover Letter</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Resume</InputLabel>
            <Select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              label="Resume"
            >
              <MenuItem value="">None</MenuItem>
              {resumeList.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.title || r.name || `Resume ${r.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Cover Letter</InputLabel>
            <Select
              value={selectedCover}
              onChange={(e) => setSelectedCover(e.target.value)}
              label="Cover Letter"
            >
              <MenuItem value="">None</MenuItem>
              {coverList.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.title || c.name || `Cover Letter ${c.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGeneratePackage}>
            Generate Package
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}