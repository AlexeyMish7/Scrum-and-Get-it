import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";

export default function GettingStartedModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  function closeAndMark() {
    try {
      localStorage.setItem("sgt:seen_getting_started", "1");
    } catch {}
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Getting Started — Scrum-and-Get-it</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body1">
            Welcome — this short guide will show you the main areas of the
            product and how to get the most value from them. Use the quick
            actions at the bottom to jump directly to pages.
          </Typography>

          <Divider />

          <Box>
            <Typography variant="h6">Profile Hub</Typography>
            <Typography variant="body2" color="text.secondary">
              Your Profile Hub is where you add and maintain your professional
              information: headline, summary, employment history, education,
              skills and projects. Completing your profile improves AI match
              suggestions and makes generated resumes more accurate.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: Add 6–10 focused skills and at least one project or role per
              major employment entry to give the AI meaningful context.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">AI Generation Hub</Typography>
            <Typography variant="body2" color="text.secondary">
              Use the AI Workspace to generate tailored resumes, cover
              letters, and other documents. The generator uses your profile
              data and the job details you provide to craft role-specific
              artifacts.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: When generating a resume or cover letter, provide the job
              title and key responsibilities — the AI will prioritize relevant
              skills and examples.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">Jobs Pipeline</Typography>
            <Typography variant="body2" color="text.secondary">
              The Jobs Pipeline is a kanban-style workspace for tracking
              opportunities through the application lifecycle: Interested,
              Applied, Phone Screen, Interview, Offer, Rejected. Add jobs,
              attach documents, and move cards as you progress.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: Add an application deadline where applicable — the pipeline
              and calendar will surface reminders and deadlines.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">Interview Hub</Typography>
            <Typography variant="body2" color="text.secondary">
              Track scheduled interviews, log preparation activities, and run
              mock interview sessions. Preparation activities (time spent,
              activity type, notes) increase your practice minutes and feed
              readiness scoring shown on scheduled interview cards.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: Log mock interviews and focused practice with minutes and
              short notes — this both improves scores and creates a useful
              study record.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">Network Hub</Typography>
            <Typography variant="body2" color="text.secondary">
              Build and manage your professional network. Add contacts,
              organize them into groups, and track outreach and follow-ups.
              Use networking to discover referrals and informational interviews.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: Tag contacts with how you met them and follow-up dates to
              keep momentum in outreach.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">Team Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Invite mentors, coaches, or collaborators to view your progress
              and offer feedback. Team members can help review documents,
              join mock interviews, and see analytics on your pipeline.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tip: Add at least one mentor or reviewer early — external input
              accelerates improvements and helps with interview prep.
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Frequently Asked Questions</Typography>
            <Stack spacing={1}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">How do I improve my AI-generated resume?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Complete your Profile with detailed employment history, skills, and projects.
                    When generating a resume for a specific role, provide the job title and key
                    responsibilities — the AI uses these to prioritize relevant achievements and
                    keywords. You can also edit drafts directly in the Document Editor.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Why are my interview success scores so low?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Success scores are based on preparation (practice minutes logged), company research
                    completion, and role-match strength. To improve: (1) log preparation activities
                    with time spent, (2) mark company research as complete in the interview checklist,
                    and (3) ensure the interview is linked to the relevant job in the pipeline.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">How do I add a job to the pipeline?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Go to the Jobs Pipeline and click "New Job" or use the "Add Job" button. Fill in
                    the job title, company, and other details (location, salary, deadline). Once saved,
                    the job card appears in the "Interested" stage — drag it across stages as you progress
                    through the application process.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Can mentors or coaches see my progress?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Yes. Invite team members from the Team Management area — they can view your profile,
                    generated documents, and pipeline analytics. You control which team members have
                    access and at what permission level. This is useful for getting feedback from mentors
                    or having coaches review your progress.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">How do I track my network and follow-ups?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Use the Network Hub to add contacts, tag them with how you met them, and set
                    follow-up dates. You can organize contacts into peer groups or industry categories.
                    The system will help you stay on top of outreach and nurture your professional network.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">How do I export my pipeline analytics?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    From the Jobs Pipeline, click the "Analytics" button to open the full analytics page.
                    You can generate custom reports filtered by company, role, or industry and export them
                    as CSV. This is helpful for tracking conversion rates and understanding your job search trends.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Where do I find my generated resumes and cover letters?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    All generated documents are stored in the AI Workspace — visit "Document Library" to
                    view, edit, and download them. You can also save templates for recurring use and set
                    up versioning to track changes over time.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Box>

          <Divider />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeAndMark}> Close</Button>
      </DialogActions>
    </Dialog>
  );
}
