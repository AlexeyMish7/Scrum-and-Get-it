import { Paper, Typography, Divider, Box, LinearProgress } from "@mui/material";
import {
  computeSuccessRates,
  compareToBenchmarks,
  industryBenchmarks,
  formatPercent,
} from "./analyticsHelpers";
import type { JobRecord } from "./analyticsHelpers";

/**
 * BenchmarkCard
 * Shows user's success rate vs industry benchmarks.
 * Displays meaningful message when no data available.
 */
export default function BenchmarkCard({ jobs }: { jobs: JobRecord[] }) {
  const rates = computeSuccessRates(jobs, "industry");
  const comp = compareToBenchmarks(rates, industryBenchmarks);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Benchmarks & Comparison</Typography>
      <Divider sx={{ my: 1 }} />

      {comp.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No offer data yet — start applying to see your success trends compared
          to industry benchmarks.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {comp.slice(0, 5).map((c) => (
            <Box key={c.key}>
              <Typography variant="subtitle2">
                {c.key} ({c.offers}/{c.total} offers)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, c.userRate * 100))}
                  />
                </Box>
                <Box sx={{ minWidth: 120, textAlign: "right" }}>
                  <Typography variant="caption">
                    You: {formatPercent(c.userRate)}
                  </Typography>
                  <br />
                  <Typography
                    variant="caption"
                    color={c.delta >= 0 ? "success.main" : "error.main"}
                  >
                    Bench: {formatPercent(c.benchmarkRate)} (
                    {c.delta >= 0 ? "+" : ""}
                    {formatPercent(c.delta)})
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
