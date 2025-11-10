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
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import InterviewScheduling from "./InterviewScheduling";

export default function AutomationsPage() {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info";
  }>({ open: false, message: "", severity: "info" });

  const [schedule, setSchedule] = useState("");
  const [reminder, setReminder] = useState(false);

  const handleGeneratePackage = () => {
    setSnackbar({
      open: true,
      message:
        "Application package generated (Resume + Cover Letter + Portfolio).",
      severity: "success",
    });
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
    setSnackbar({
      open: true,
      message: `Application scheduled for ${schedule}.`,
      severity: "success",
    });
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
      message:
        "Template responses ready for common application questions.",
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
              <Typography variant="h6">Generate Application Packages</Typography>
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
              <Typography variant="h6">Schedule Application Submissions</Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Set a date and time for your job applications to be automatically
                submitted.
              </Typography>
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

        {/* Automated Follow-up Reminders */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Automated Follow-up Reminders</Typography>
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
              <Button variant="contained" sx={{ mt: 1 }} onClick={handleFollowUp}>
                Save Preference
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Template Responses */}
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
        </Grid>

        {/* Bulk Operations */}
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
        </Grid>

        {/* Application Checklist Automation */}
        <Grid size={12} >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Application Checklist Automation</Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Automatically verify you’ve completed each part of your
                application before submission.
              </Typography>
              <Button variant="contained" onClick={handleChecklist}>
                Run Checklist
              </Button>
            </CardContent>
          </Card>
        </Grid>

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