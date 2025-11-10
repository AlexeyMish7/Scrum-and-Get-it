import {
  Box,
  Typography,
  Stack,
  Button,
  Divider,
  Alert,
  Paper,
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import TemplateManager from "@workspaces/ai/components/resume/TemplateManager";
import { useNavigate } from "react-router-dom";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/**
 * TemplatesHub
 * Centralized page for creating and managing resume & cover letter templates.
 * Users create templates here; they appear as selectable styles in the Resume Editor (Step 1).
 */
export default function TemplatesHub() {
  const navigate = useNavigate();
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
          <Typography variant="h4">Custom Resume Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Create your own templates with custom fonts, colors, and layouts
          </Typography>
        </Box>
      </Stack>

      {/* Info Alert */}
      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          How Templates Work
        </Typography>
        <Typography variant="caption" component="div">
          • <strong>System Templates</strong>: 5 pre-built professional
          templates (Modern, Classic, Minimal, Creative, Academic) - always
          available
        </Typography>
        <Typography variant="caption" component="div">
          • <strong>Custom Templates</strong>: Create your own templates here
          with custom colors, fonts, and layouts
        </Typography>
        <Typography variant="caption" component="div" sx={{ mt: 1 }}>
          💡 <strong>Tip</strong>: Custom templates you create here will appear
          in the Resume Editor alongside the system templates when you create or
          edit a resume.
        </Typography>
      </Alert>

      {/* Quick Actions */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
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
            Cover Letters
          </Button>
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Template Manager */}
      <TemplateManager />
    </Box>
  );
}
