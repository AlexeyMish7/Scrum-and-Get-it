import {
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import { useState } from "react";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import TemplateManager from "@workspaces/ai/components/resume/TemplateManager";
import { useNavigate } from "react-router-dom";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";

/**
 * TemplatesHub
 * Centralized page for creating and managing resume & cover letter templates.
 * Users create templates here; they appear as selectable styles in the Resume Editor and Cover Letter Editor.
 */
export default function TemplatesHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"resume" | "cover-letter">(
    "resume"
  );

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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage resume templates with custom fonts, colors, sections, and
                layouts. System templates: Modern, Classic, Minimal, Creative,
                Academic.
              </Typography>
              <TemplateManager />
            </Box>
          )}

          {activeTab === "cover-letter" && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage cover letter templates with custom tones, styles, and
                formatting. System templates: Formal, Creative, Technical,
                Modern, Minimal.
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Coming Soon:</strong> Cover letter custom template
                  editor. For now, use the 5 system templates in the Cover
                  Letter Editor.
                </Typography>
              </Alert>
            </Box>
          )}
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
