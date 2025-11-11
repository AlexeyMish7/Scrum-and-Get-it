import { Box, Typography } from "@mui/material";
import NextDeadlinesWidget from "@workspaces/jobs/components/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@workspaces/jobs/components/DeadlineCalendar/DeadlineCalendar";
import BenchmarkCard from "./BenchmarkCard";

export default function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Jobs Analytics
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box sx={{ width: { xs: "100%", md: "33%" } }}>
          <NextDeadlinesWidget />
        </Box>
        <Box sx={{ width: { xs: "100%", md: "67%" } }}>
          <DeadlineCalendar />
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        Success Rate by Application Approach
      </Typography>
      <Box sx={{ mb: 4 }}>
        <BenchmarkCard jobs={[]} />
      </Box>

      <Typography color="text.secondary">
        Data is computed from your jobs list (scoped to your account).
        Benchmarks are basic static values for quick comparison.
      </Typography>
    </Box>
  );
}
