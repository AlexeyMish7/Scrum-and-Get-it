import { useEffect, useMemo } from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart, Bar } from "recharts";
import { useAnalytics } from "../hooks/useAnalytics";

const SummaryCard: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => (
  <Paper sx={{ p: 2 }} variant="outlined">
    <Typography variant="subtitle2" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Paper>
);

const AnalyticsDashboard: React.FC = () => {
  const { overview, trends } = useAnalytics();

  const chartData = useMemo(() => {
    return (trends?.conversionTimeseries ?? []).map((t: any) => ({
      date: t.date,
      conversion: Math.round((t.conversion ?? 0) * 1000) / 10,
    }));
  }, [trends]);

  const confidenceData = useMemo(() => {
    return (trends?.confidenceTimeseries ?? []).map((t: any) => ({
      date: t.date,
      confidence: Math.round((t.confidence ?? 0) * 1000) / 10,
    }));
  }, [trends]);

  const formatData = useMemo(() => {
    return (overview?.formatBreakdown ?? []).map((f: any) => ({
      format: f.format,
      conversion: Math.round((f.conversion ?? 0) * 1000) / 10,
      interviews: f.interviews,
    }));
  }, [overview]);

  const typeData = useMemo(() => {
    return (overview?.typeBreakdown ?? []).map((f: any) => ({
      type: f.type,
      conversion: Math.round((f.conversion ?? 0) * 1000) / 10,
      interviews: f.interviews,
    }));
  }, [overview]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const conv = overview?.conversionRate ?? null;
    if (conv === null) return recs;
    if (conv < 0.1)
      recs.push("Work on applying to more roles and tailoring your applications.");
    if (conv < 0.2) recs.push("Practice mock interviews focused on common formats.");
    if ((overview?.interviewsCount ?? 0) < 5)
      recs.push("Schedule regular mock sessions to accelerate improvement.");
    return recs;
  }, [overview]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Interview Performance Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Overview, trends, and personalized coaching recommendations.
      </Typography>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 3 }}>
        <Box>
          <SummaryCard
            title="Conversion Rate"
            value={overview ? `${Math.round((overview.conversionRate ?? 0) * 100)}%` : "—"}
          />
        </Box>
        <Box>
          <SummaryCard
            title="Interviews"
            value={overview ? String(overview.interviewsCount ?? 0) : "—"}
          />
        </Box>
        <Box>
          <SummaryCard
            title="Offers"
            value={overview ? String(overview.offersCount ?? 0) : "—"}
          />
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Conversion Rate Over Time
        </Typography>
        {chartData.length === 0 ? (
          <Box sx={{ height: 180, display: "flex", alignItems: "center" }}>
            <Typography color="text.secondary">No trend data yet</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="conversion" stroke="#1976d2" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Interview Formats
          </Typography>
          {formatData.length === 0 ? (
            <Typography color="text.secondary">No format data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={formatData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="format" type="category" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="conversion" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Interview Types
          </Typography>
          {typeData.length === 0 ? (
            <Typography color="text.secondary">No type data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="conversion" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Confidence Over Time
        </Typography>
        {confidenceData.length === 0 ? (
          <Box sx={{ height: 140, display: "flex", alignItems: "center" }}>
            <Typography color="text.secondary">No confidence data yet</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={confidenceData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="confidence" stroke="#ff9800" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Industry Comparison</Typography>
          <Box sx={{ mt: 1 }}>
            {(trends?.industryComparison ?? []).map((i: any) => (
              <Box key={i.industry} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                <Typography>{i.industry}</Typography>
                <Typography>{Math.round((i.conversion ?? 0) * 100)}%</Typography>
              </Box>
            ))}
            {((trends?.industryComparison ?? []).length === 0) && (
              <Typography color="text.secondary">No industry data</Typography>
            )}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Feedback Themes</Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {(overview?.feedbackThemes ?? []).map((t: any) => (
              <Chip key={t.theme} label={`${t.theme} (${t.count})`} />
            ))}
            {((overview?.feedbackThemes ?? []).length === 0) && (
              <Typography color="text.secondary">No feedback themes</Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <SummaryCard
          title="Mock Avg / Real Avg"
          value={overview ? `${overview.mockVsReal?.mockAverage ?? "—"} / ${overview.mockVsReal?.realAverage ?? "—"}` : "—"}
        />
        <SummaryCard
          title="Improvement"
          value={overview ? `${overview.mockVsReal?.improvement > 0 ? "+" : ""}${overview.mockVsReal?.improvement ?? "—"}` : "—"}
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Coaching Recommendations</Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            {recommendations.length === 0 ? (
              <li>
                <Typography color="text.secondary">No recommendations yet</Typography>
              </li>
            ) : (
              recommendations.map((r, i) => (
                <li key={i}>
                  <Typography>{r}</Typography>
                </li>
              ))
            )}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Quick Actions</Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="Start a mock interview" clickable color="primary" />
            <Chip label="Record problem walkthrough" clickable />
            <Chip label="Add feedback notes" clickable />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
