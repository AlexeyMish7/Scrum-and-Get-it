import {
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Divider,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaletteIcon from "@mui/icons-material/Palette";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CompareIcon from "@mui/icons-material/Compare";
import CoverLetterTemplateManager from "@workspaces/ai/components/cover-letter/CoverLetterTemplateManager";

/**
 * TemplatesHub
 * Centralized page for managing resume & cover letter templates.
 *
 * PURPOSE: Template library and management (create custom, import, export)
 * Enhanced with visual demonstrations showing how templates affect AI generation.
 *
 * Flow:
 * - Users manage templates here (create custom, import from JSON, export)
 * - When creating a resume/cover letter, template selection happens in the editor
 * - See visual comparisons of how different templates change AI output
 */
export default function TemplatesHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"resume" | "cover-letter">(
    "resume"
  );
  const [showComparison, setShowComparison] = useState(false);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <PaletteIcon sx={{ fontSize: 40, color: "primary.main" }} />
        <Box>
          <Typography variant="h4">Template Library</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage custom templates for resumes and cover letters
          </Typography>
        </Box>
      </Stack>

      {/* How Templates Work - Enhanced Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "primary.50",
          border: "1px solid",
          borderColor: "primary.200",
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              How Templates Work
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Templates control both the <strong>visual appearance</strong> and{" "}
            <strong>AI generation behavior</strong> of your documents. Each
            template includes:
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🎨 Visual Styling
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Custom fonts, colors, spacing, and layout that match your
                industry and personal brand.
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🤖 AI Behavior
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each template tells the AI to write in a specific tone and style
                (formal, creative, technical, etc.).
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                📄 Content Structure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Templates determine section order, bullet formatting, and
                emphasis areas.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={() => setShowComparison(!showComparison)}
            sx={{ alignSelf: "flex-start" }}
          >
            {showComparison ? "Hide" : "Show"} Template Comparison
          </Button>

          {/* Template Comparison Section */}
          {showComparison && (
            <Box
              sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Example: How Different Templates Affect AI Generation
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {/* Classic Template Example */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Chip label="Classic" size="small" color="default" />
                      <Typography variant="caption" color="text.secondary">
                        Traditional & Conservative
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontStyle="italic">
                      "Managed cross-functional team of 8 engineers to deliver
                      enterprise software solutions. Consistently exceeded
                      quarterly performance targets by 15%."
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      → Emphasizes stability, proven results, formal language
                    </Typography>
                  </CardContent>
                </Card>

                {/* Modern Template Example */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Chip label="Modern" size="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        Contemporary & Tech-Forward
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontStyle="italic">
                      "Led agile transformation initiative, implementing CI/CD
                      pipelines and microservices architecture. Accelerated
                      deployment velocity 3x while improving system
                      reliability."
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      → Focuses on innovation, technical skills, modern
                      methodologies
                    </Typography>
                  </CardContent>
                </Card>

                {/* Creative Template Example */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Chip label="Creative" size="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">
                        Engaging & Dynamic
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontStyle="italic">
                      "Transformed traditional software delivery into a
                      collaborative innovation engine. Empowered team to ship
                      user-delighting features 40% faster through design
                      thinking workshops."
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      → Emphasizes creativity, problem-solving, storytelling
                      approach
                    </Typography>
                  </CardContent>
                </Card>

                {/* Minimal Template Example */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Chip label="Minimal" size="small" />
                      <Typography variant="caption" color="text.secondary">
                        Concise & Direct
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontStyle="italic">
                      "Led 8-person engineering team. Delivered enterprise
                      solutions. Exceeded targets by 15%."
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      → Brief bullets, core achievements, concise language
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Same experience, different templates!</strong> The AI
                  automatically adjusts language, tone, and emphasis based on
                  your selected template.
                </Typography>
              </Alert>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Tabs for Resume vs Cover Letter Templates */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label="Resume Templates"
            value="resume"
            icon={<DescriptionIcon />}
            iconPosition="start"
          />
          <Tab
            label="Cover Letter Templates"
            value="cover-letter"
            icon={<EmailIcon />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === "resume" && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Professional resume templates are available in the Resume
                Editor. Choose from multiple layouts, color schemes, and
                formatting styles.
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: 2,
                }}
              >
                {["Modern", "Classic", "Minimal", "Creative", "Academic"].map(
                  (template) => (
                    <Card
                      variant="outlined"
                      sx={{ height: "100%" }}
                      key={template}
                    >
                      <CardContent>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="h6">{template}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Professional {template.toLowerCase()} template with
                            customizable sections
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                )}
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>💡 Access templates</strong> in the Resume Editor when
                  creating or editing a draft. Templates are built-in and ready
                  to use.
                </Typography>
              </Alert>
            </Box>
          )}

          {activeTab === "cover-letter" && <CoverLetterTemplateManager />}
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            onClick={() => navigate("/ai/resume")}
            size="medium"
          >
            Go to Resume Editor
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/ai/cover-letter")}
            size="medium"
          >
            Go to Cover Letter Editor
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
