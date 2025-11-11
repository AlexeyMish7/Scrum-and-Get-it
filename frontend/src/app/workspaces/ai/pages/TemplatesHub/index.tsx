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
} from "@mui/material";
import { useState } from "react";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import { useNavigate } from "react-router-dom";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CoverLetterTemplateManager from "@workspaces/ai/components/cover-letter/CoverLetterTemplateManager";

/**
 * TemplatesHub
 * Centralized page for managing resume & cover letter templates.
 * 
 * PURPOSE: Template library and management (create custom, import, export)
 * NOT FOR: Choosing templates for new documents (that happens in the editors)
 * 
 * Flow:
 * - Users manage templates here (create custom, import from JSON, export)
 * - When creating a resume/cover letter, template selection happens in the editor
 */
export default function TemplatesHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "resume" | "cover-letter"
  >("resume");

  return (
    <Box>
      <RegionAnchor
        id="[E]"
        desc="Template library and previews for resumes & cover letters"
      />

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

      {/* Info Alert */}
      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          How Templates Work
        </Typography>
        <Typography variant="caption" component="div">
          • <strong>System Templates</strong>: Pre-built professional templates
          for both resumes and cover letters - always available and cannot be
          edited
        </Typography>
        <Typography variant="caption" component="div">
          • <strong>Custom Templates</strong>: Create your own templates with
          custom colors, fonts, and layouts for resumes and cover letters
        </Typography>
        <Typography variant="caption" component="div" sx={{ mt: 1 }}>
          💡 <strong>Tip</strong>: Custom templates you create here will appear
          alongside system templates in the Resume Editor and Cover Letter
          Editor.
        </Typography>
      </Alert>

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
