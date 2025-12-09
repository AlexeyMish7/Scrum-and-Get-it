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
 * - Interview analytics dashboard
 */

import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AppShell from "@shared/layouts/AppShell";
import InterviewScheduling from "./components/InterviewScheduling";
import InterviewQuestionBank from "./components/InterviewQuestionBank";
import TechnicalPrep from "./components/TechnicalPrep";
import SalaryPrep from "./components/SalaryPrep";
import MockInterview from "./components/MockInterview";
import InterviewSuccess from "./components/InterviewSuccess";

export default function InterviewHub() {
  const navigate = useNavigate();

  return (
    <AppShell sidebar={null}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Interview Hub
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Schedule, prepare, and track your interviews in one place
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate("/interviews/analytics")}
              size="large"
            >
              View Analytics
            </Button>
          </Stack>
        </Box>

        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <InterviewScheduling />
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <InterviewSuccess />
        </Paper>

        <Paper elevation={0} sx={{ p: 3 }}>
          <InterviewQuestionBank />
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <TechnicalPrep />
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <MockInterview />
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <SalaryPrep />
        </Paper>
      </Container>
    </AppShell>
  );
}
