import { Box, Typography } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

export default function TemplatesHub() {
  return (
    <Box>
      <RegionAnchor
        id="[E]"
        desc="Template library and previews for resumes & cover letters"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Templates Hub
      </Typography>
      <Typography color="text.secondary">
        TODO: Resume and cover letter template library, previews, and management
        (UC-046, UC-055).
      </Typography>
    </Box>
  );
}
