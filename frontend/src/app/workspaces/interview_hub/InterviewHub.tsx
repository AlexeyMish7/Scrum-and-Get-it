/**
 * InterviewHub - Main workspace for interview preparation and scheduling
 *
 * Purpose: Centralized interview management, scheduling, and preparation
 *
 * Features:
 * - Interview scheduling with Google Calendar integration
 * - Conflict detection and reminders
 * - Preparation tasks and STAR stories
 * - Interview outcome tracking
 * - Calendar download (.ics files)
 */

import { Box, Container, Typography, Paper } from "@mui/material";
import AppShell from "@shared/layouts/AppShell";
import InterviewScheduling from "./components/InterviewScheduling";
import InterviewQuestionBank from "./components/InterviewQuestionBank";
import TechnicalPrep from "./components/TechnicalPrep";
import SalaryPrep from "./components/SalaryPrep";

export default function InterviewHub() {
  return (
    <AppShell sidebar={null}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Interview Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule, prepare, and track your interviews in one place
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <InterviewScheduling />
        </Paper>

        <Paper elevation={0} sx={{ p: 3 }}>
          <InterviewQuestionBank />
        </Paper>
        
        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <TechnicalPrep />
        </Paper>
        
        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <SalaryPrep />
        </Paper>
      </Container>
    </AppShell>
  );
}
