/**
 * JobAnalyticsDialog — AI-powered analytics for individual jobs
 *
 * Purpose: Display detailed analytics and insights for a specific job.
 * Shows match score, skills analysis, company research, and optimization suggestions.
 *
 * Contract:
 * - Inputs: jobId, open state, onClose callback
 * - Outputs: Full-screen dialog with analytics tabs
 * - Features: Match analysis, skills gaps, company insights, interview prep
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Divider,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  TrendingUp as MatchIcon,
  School as SkillsIcon,
  Business as CompanyIcon,
  Assignment as PrepIcon,
} from "@mui/icons-material";
import { useJobMatch } from "@job_pipeline/hooks/useJobMatch";
import { useAuth } from "@shared/context/AuthContext";
import MatchAnalysisPanel from "@job_pipeline/components/analytics/MatchAnalysisPanel/MatchAnalysisPanel";

interface JobAnalyticsDialogProps {
  jobId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function JobAnalyticsDialog({
  jobId,
  open,
  onClose,
}: JobAnalyticsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { data: matchData, loading } = useJobMatch(user?.id, jobId);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          maxHeight: 800,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Job Analytics</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<MatchIcon />} label="Match Analysis" />
          <Tab icon={<SkillsIcon />} label="Skills Gaps" />
          <Tab icon={<CompanyIcon />} label="Company Insights" />
          <Tab icon={<PrepIcon />} label="Interview Prep" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, overflow: "auto" }}>
        {loading && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: "center" }}
            >
              Loading AI analytics...
            </Typography>
          </Box>
        )}

        {/* Tab 0: Match Analysis */}
        {activeTab === 0 && !loading && (
          <Box>
            <MatchAnalysisPanel userId={user?.id} jobId={jobId} />
          </Box>
        )}

        {/* Tab 1: Skills Gaps */}
        {activeTab === 1 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Skills Development Plan
            </Typography>
            {!matchData ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Match analysis not yet generated. Click the "Match Analysis" tab
                to calculate your match score first.
              </Alert>
            ) : matchData?.skillsGaps && matchData.skillsGaps.length > 0 ? (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Focus on these skills to improve your match score and job
                  readiness:
                </Typography>
                <List>
                  {matchData.skillsGaps.map((skill, idx) => (
                    <ListItem key={idx} sx={{ py: 1 }}>
                      <ListItemText
                        primary={skill}
                        secondary="Recommended: Take online course or build project to demonstrate"
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Alert severity="success">
                No significant skills gaps identified! You're well-qualified for
                this position.
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 2: Company Insights */}
        {activeTab === 2 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Company Research
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI-powered company insights coming soon. This will include:
            </Typography>
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Company Culture
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis of company values, work environment, and team
                    dynamics
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent News & Updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest company announcements, funding rounds, and product
                    launches
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Competitive Landscape
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    How this company compares to others in the industry
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        {/* Tab 3: Interview Prep */}
        {activeTab === 3 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Interview Preparation
            </Typography>

            {!matchData ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Generate a match analysis first to get personalized interview
                prep recommendations.
              </Alert>
            ) : (
              <>
                {matchData?.strengths && matchData.strengths.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Highlight These Strengths:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mb: 3 }}
                    >
                      {matchData.strengths.map((strength, idx) => (
                        <Chip
                          key={idx}
                          label={strength}
                          color="success"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Recommended Focus Areas:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Research the company's recent projects and initiatives"
                      secondary="Show genuine interest and alignment with company goals"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Prepare STAR stories for your strongest experiences"
                      secondary="Situation, Task, Action, Result - quantify achievements"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Review job requirements and match to your experience"
                      secondary="Be ready to explain how your skills solve their problems"
                    />
                  </ListItem>
                  {matchData?.skillsGaps && matchData.skillsGaps.length > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="Address skills gaps proactively"
                        secondary="Show willingness to learn and grow in weak areas"
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
