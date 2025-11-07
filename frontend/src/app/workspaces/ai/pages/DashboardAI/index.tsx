import { Box, Typography } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

export default function DashboardAI() {
  return (
    <Box>
      <RegionAnchor
        id="[A]"
        desc="Hero quick-start cards: Resume / Cover / Research"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        AI Home
      </Typography>
      <Typography color="text.secondary">
        TODO: Cards and quick actions for AI features will appear here.
      </Typography>
    </Box>
  );
}
