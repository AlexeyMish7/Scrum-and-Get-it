import { Box, Typography, Stack, Button, Divider } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import TemplateManager from "@workspaces/ai/components/resume/TemplateManager";
import { useNavigate } from "react-router-dom";

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
      <Typography variant="h4" sx={{ mb: 1 }}>
        Templates Hub
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Create and customize templates here first. Then head to the Resume
        Editor (AI → Resume) to apply styles and generate tailored content.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => navigate("/ai/resume")}>
          Go to Resume Editor
        </Button>
        <Button variant="outlined" onClick={() => navigate("/ai/cover-letter")}>
          Cover Letters
        </Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <TemplateManager />
    </Box>
  );
}
