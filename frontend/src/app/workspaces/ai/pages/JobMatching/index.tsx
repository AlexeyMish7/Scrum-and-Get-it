import { Box, Typography } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

export default function JobMatching() {
  return (
    <Box>
      <RegionAnchor
        id="[C]"
        desc="Match scores, skill gap analysis, and job compare pane"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Job Matching
      </Typography>
      <Typography color="text.secondary">
        TODO: Job matching analysis, match scores, and skill gap recommendations
        (UC-065, UC-066).
      </Typography>
    </Box>
  );
}
