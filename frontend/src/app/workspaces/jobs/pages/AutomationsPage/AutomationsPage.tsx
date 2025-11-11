// import { Box, Typography } from "@mui/material";
// import RegionAnchor from "@shared/components/common/RegionAnchor";

// export default function AutomationsPage() {
//   return (
//     <Box>
//       <RegionAnchor
//         id="[H]"
//         desc="Automation rules, scheduling, and bulk actions"
//       />
//       <Typography variant="h4" sx={{ mb: 1 }}>
//         Automations & Workflows
//       </Typography>
//       <Typography color="text.secondary">
//         TODO: Build and manage automation rules for follow-ups, bulk
//         submissions, and interview scheduling (UC-069–UC-071).
//       </Typography>
//     </Box>
//   );
// }

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import InterviewScheduling from "./InterviewScheduling";
import { useAuth } from "@shared/context/AuthContext";
import { supabase } from "@shared/services/supabaseClient";
import JSZip from "jszip";

export default function AutomationsPage() {
  const { user } = useAuth() as any;
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info";
  }>({ open: false, message: "", severity: "info" });

  const [schedule, setSchedule] = useState("");
  const [reminder, setReminder] = useState(false);
  const [jobName, setJobName] = useState("");
  const [scheduledApplications, setScheduledApplications] = useState<
  { id: string; datetime: string; jobTitle?: string }[]
>([]);

  function uid(prefix = "a") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  const handleGeneratePackage = () => {
    (async () => {
      setSnackbar({ open: true, message: "Generating package...", severity: "info" });
      try {
        if (!user?.id) {
          setSnackbar({ open: true, message: "Please sign in to generate package.", severity: "info" });
          return;
        }

        // Fetch latest resume artifact
        // const resumeResp = await aiClient.getJson<{ items: any[] }>(
        //   `/api/artifacts?kind=resume&limit=1`,
        //   user.id
        // );
        // const coverResp = await aiClient.getJson<{ items: any[] }>(
        //   `/api/artifacts?kind=cover_letter&limit=1`,
        //   user.id
        // );
        const { data: resumes, error: resumeError } = await supabase
          .from("resume_drafts")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        const { data: covers, error: coverError } = await supabase
          .from("cover_letter_drafts")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        const resume = resumes?.[0] ?? null;
        const cover = covers?.[0] ?? null;


        //const resume = resumeResp?.items?.[0] ?? null;
        //const cover = coverResp?.items?.[0] ?? null;

        if (!resume && !cover) {
          setSnackbar({ open: true, message: "No resume or cover letter found in your account.", severity: "info" });
          return;
        }

        const zip = new JSZip();

        if (resume) {
          const resumeContent = resume.content ?? {};
          zip.file("resume.json", JSON.stringify(resumeContent, null, 2));
        }

        if (cover) {
          const coverContent = cover.content ?? {};
          // try to extract human-readable text if present
          let coverText = "";
          if (typeof coverContent === "string") coverText = coverContent;
          else if (coverContent.sections?.opening || coverContent.sections?.body || coverContent.sections?.closing) {
            const s = coverContent.sections;
            coverText = `${s.opening || ""}\n\n${s.body || ""}\n\n${s.closing || ""}`;
          } else if (coverContent.text) coverText = String(coverContent.text);
          else coverText = JSON.stringify(coverContent, null, 2);
          zip.file("cover_letter.txt", coverText);
        }

        // Optionally include portfolio documents if available -- omitted here

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `application_package_${new Date().toISOString().slice(0,10)}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setSnackbar({ open: true, message: "Application package downloaded.", severity: "success" });
      } catch (err: any) {
        console.error("Generate package failed:", err);
        setSnackbar({ open: true, message: err?.message ?? "Failed to generate package.", severity: "info" });
      }
    })();
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

  // Reset input fields
  setSchedule("");
  setJobName("");
};


  const handleFollowUp = () => {
    setSnackbar({
      open: true,
      message: reminder
        ? "Follow-up reminders enabled."
        : "Follow-up reminders disabled.",
      severity: "success",
    });
  };

  const handleBulkOps = () => {
    setSnackbar({
      open: true,
      message: "Bulk operation executed across selected applications.",
      severity: "success",
    });
  };

  const handleChecklist = () => {
    setSnackbar({
      open: true,
      message: "Application checklist automation set up successfully.",
      severity: "success",
    });
  };

  const handleTemplateResponse = () => {
    setSnackbar({
      open: true,
      message: "Template responses ready for common application questions.",
      severity: "success",
    });
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
              <Typography variant="h6">
                Generate Application Packages
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Combine your resume, cover letter, and portfolio into one
                downloadable application package.
              </Typography>
              <Button variant="contained" onClick={handleGeneratePackage}>
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
      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
        Set a date, time, and job name for your application to be submitted.
      </Typography>

      {/* Job Name Input */}
      <TextField
        label="Job Name"
        fullWidth
        value={jobName}
        onChange={(e) => setJobName(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* DateTime Input */}
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


        {/* Automated Follow-up Reminders
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">
                Automated Follow-up Reminders
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Enable reminders to follow up after a set number of days.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reminder}
                    onChange={(e) => setReminder(e.target.checked)}
                  />
                }
                label="Enable follow-up reminders"
              />
              <Button
                variant="contained"
                sx={{ mt: 1 }}
                onClick={handleFollowUp}
              >
                Save Preference
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Template Responses
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Template Responses</Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Auto-generate template answers for common application questions.
              </Typography>
              <Button variant="contained" onClick={handleTemplateResponse}>
                Generate Responses
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Bulk Operations
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Bulk Application Operations</Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Perform actions like “apply,” “withdraw,” or “mark as reviewed”
                for multiple applications at once.
              </Typography>
              <Button variant="contained" onClick={handleBulkOps}>
                Run Bulk Operation
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Application Checklist Automation */}
        {/* <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">
                Application Checklist Automation
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Automatically verify you’ve completed each part of your
                application before submission.
              </Typography>
              <Button variant="contained" onClick={handleChecklist}>
                Run Checklist
              </Button>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Interview Scheduling Integration (UC-071) */}
        <Grid size={12}>
          <InterviewScheduling />
        </Grid>
      </Grid>

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
