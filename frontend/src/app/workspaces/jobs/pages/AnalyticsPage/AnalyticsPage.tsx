import { Box, Typography } from "@mui/material";
import NextDeadlinesWidget from "@workspaces/jobs/components/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@workspaces/jobs/components/DeadlineCalendar/DeadlineCalendar";

export default function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Jobs Analytics
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '33%' } }}>
          <NextDeadlinesWidget />
        </Box>
        <Box sx={{ width: { xs: '100%', md: '67%' } }}>
          <DeadlineCalendar />
        </Box>
      </Box>

      <Typography color="text.secondary">TODO: Charts and metrics about applications will appear here.</Typography>
    </Box>
  );
}
