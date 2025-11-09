import { Paper, Typography, Divider, Box, LinearProgress } from "@mui/material";
import { computeSuccessRates, compareToBenchmarks, industryBenchmarks, formatPercent } from "./analyticsHelpers";
import type { JobRecord } from "./analyticsHelpers";

/**
 * BenchmarkCard
 * Shows user's success rate vs industry benchmarks.
 * Displays fallback message or example data when empty.
 */
export default function BenchmarkCard({ jobs }: { jobs: JobRecord[] }) {
  // fallback demo job if user has none
  const sampleJobs =
    jobs.length > 0
      ? jobs
      : [
          {
            job_title: "Intern",
            company_name: "Google",
            job_status: "Offer",
            industry: "Software",
            created_at: new Date().toISOString(),
            status_changed_at: new Date().toISOString(),
          },
          {
            job_title: "Data Analyst",
            company_name: "JP Morgan",
            job_status: "Applied",
            industry: "Finance",
            created_at: new Date().toISOString(),
            status_changed_at: new Date().toISOString(),
          },
        ];

  const rates = computeSuccessRates(sampleJobs, "industry");
  const comp = compareToBenchmarks(rates, industryBenchmarks);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Benchmarks & Comparison</Typography>
      <Divider sx={{ my: 1 }} />

      {comp.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No offer data yet — start applying to see your success trends.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {comp.slice(0, 5).map((c) => (
            <Box key={c.key}>
              <Typography variant="subtitle2">{c.key}</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, c.userRate * 100))}
                  />
                </Box>
                <Box sx={{ minWidth: 120, textAlign: "right" }}>
                  <Typography variant="caption">You: {formatPercent(c.userRate)}</Typography>
                  <br />
                  <Typography
                    variant="caption"
                    color={c.delta >= 0 ? "success.main" : "error.main"}
                  >
                    Bench: {formatPercent(c.benchmarkRate)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
