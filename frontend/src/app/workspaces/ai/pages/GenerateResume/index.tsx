import { Box, Typography, Stack } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import TemplateManager from "../resume/TemplateManager";
import SkillsOptimizationPanel from "../resume/SkillsOptimizationPanel";

export default function GenerateResume() {
  return (
    <Box>
      <RegionAnchor
        id="[F]"
        desc="Resume editor, templates, and ATS-optimization tools"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Resume Editor
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Manage templates and create new resumes tailored to positions.
      </Typography>

      <Stack spacing={3}>
        <TemplateManager />
        <SkillsOptimizationPanel />
      </Stack>
    </Box>
  );
}
