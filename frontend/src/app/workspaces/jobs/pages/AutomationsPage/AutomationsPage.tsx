import { Box, Typography } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

export default function AutomationsPage() {
  return (
    <Box>
      <RegionAnchor
        id="[H]"
        desc="Automation rules, scheduling, and bulk actions"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Automations & Workflows
      </Typography>
      <Typography color="text.secondary">
        TODO: Build and manage automation rules for follow-ups, bulk
        submissions, and interview scheduling (UC-069–UC-071).
      </Typography>
    </Box>
  );
}
