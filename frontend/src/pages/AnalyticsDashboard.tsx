import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Chip, Button } from "@mui/material";
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
import AddInterviewDialog from "../app/workspaces/interview_hub/components/AddInterviewDialog";

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
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { overview, trends, loading, error } = useAnalytics(reloadTrigger);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInterviewAdded = () => {
    setReloadTrigger(prev => prev + 1);
  };

  const chartData = useMemo(() => {
    return (trends?.conversionTimeseries ?? []).map((t: any) => ({
      date: t.date,
      conversion: Math.round((t.conversion ?? 0) * 1000) / 10,
    }));
  }, [trends]);

  const confidenceData = useMemo(() => {
    return (trends?.confidenceTimeseries ?? []).map((t: any) => ({
      date: t.date,
      confidence: Math.round((t.confidence ?? 0) * 10 * 10) / 10, // Scale 0-1 to 0-10, round to 1 decimal
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
    if (!overview) return recs;

    const conv = overview.conversionRate ?? 0;
    const count = overview.interviewsCount ?? 0;
    const mockAvg = overview.mockVsReal?.mockAverage;
    const realAvg = overview.mockVsReal?.realAverage;
    const improvement = overview.mockVsReal?.improvement;
    const formatBreakdown = overview.formatBreakdown ?? [];
    const typeBreakdown = overview.typeBreakdown ?? [];
    const feedbackThemes = overview.feedbackThemes ?? [];

    // Conversion rate recommendations
    if (count === 0) {
      recs.push("Start logging your interviews to track progress and identify improvement areas.");
    } else if (conv < 0.1) {
      recs.push("Work on tailoring your applications and improving your initial screening responses.");
    } else if (conv < 0.2) {
      recs.push("Practice mock interviews focused on common formats to boost your confidence.");
    } else if (conv >= 0.3) {
      recs.push("Great conversion rate! Continue refining your approach and aim for consistency.");
    }

    // Mock interview recommendations
    if (count < 5) {
      recs.push("Schedule regular mock sessions to accelerate improvement and build confidence.");
    } else if (mockAvg !== null && realAvg !== null) {
      if (improvement && improvement > 10) {
        recs.push(`Excellent progress! Your real interviews score ${Math.round(improvement)} points higher than mocks.`);
      } else if (improvement && improvement < -5) {
        recs.push("Real interviews are scoring lower than mocks. Focus on managing interview anxiety.");
      }
    } else if (realAvg !== null && mockAvg === null) {
      recs.push("Consider doing mock interviews to practice in a low-pressure environment before real ones.");
    }

    // Format-specific recommendations
    const weakestFormat = formatBreakdown.sort((a, b) => a.conversion - b.conversion)[0];
    if (weakestFormat && weakestFormat.conversion < conv - 0.1) {
      recs.push(`Focus on improving ${weakestFormat.format} interviews - your conversion rate is lower in this format.`);
    }

    // Feedback themes - highlight most common improvement areas
    const topThemes = feedbackThemes.slice(0, 3);
    if (topThemes.length > 0) {
      const themeNames = topThemes.map((t: any) => t.theme).join(', ');
      const mostCommon = topThemes[0];
      if (mostCommon.count >= 3) {
        recs.push(`🎯 Critical: "${mostCommon.theme}" appears in ${mostCommon.count} interviews. This is your #1 improvement priority.`);
      } else {
        recs.push(`Common feedback areas: ${themeNames}. Create action items to address these.`);
      }
    }

    // Confidence and practice
    if (count >= 5 && conv < 0.15) {
      recs.push("Review your interview recordings or notes to identify patterns in unsuccessful interviews.");
    }

    return recs.slice(0, 5); // Show top 5 recommendations
  }, [overview]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>Failed to load analytics: {error}</Typography>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Interview Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview, trends, and personalized coaching recommendations.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => setDialogOpen(true)}
          size="large"
          disabled={loading}
        >
          Log Interview
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 3 }}>
        <Box>
          <SummaryCard
            title="Conversion Rate"
            value={overview ? `${Math.round((overview.conversionRate ?? 0) * 100)}%` : "—"}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 2 }}>
            Offers received ÷ Total interviews
          </Typography>
        </Box>
        <Box>
          <SummaryCard
            title="Interviews"
            value={overview ? String(overview.interviewsCount ?? 0) : "—"}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 2 }}>
            All interviews logged (mock + real)
          </Typography>
        </Box>
        <Box>
          <SummaryCard
            title="Offers"
            value={overview ? String(overview.offersCount ?? 0) : "—"}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 2 }}>
            Interviews that resulted in job offers
          </Typography>
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
              <BarChart data={formatData} layout="vertical" margin={{ left: 60, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="format" type="category" width={80} />
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
              <BarChart data={typeData} layout="vertical" margin={{ left: 60, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={80} />
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
              <YAxis domain={[0, 10]} />
              <Tooltip formatter={(v: any) => `${v}/10`} />
              <Line type="monotone" dataKey="confidence" stroke="#ff9800" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Industry Comparison</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Your conversion rate (offer ÷ interviews) by industry
          </Typography>
          <Box sx={{ mt: 1 }}>
            {(trends?.industryComparison ?? []).filter((i: any) => i.industry?.trim()).map((i: any) => (
              <Box key={i.industry} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                <Typography sx={{ textTransform: 'capitalize' }}>{i.industry.trim()}</Typography>
                <Typography fontWeight="medium">{Math.round((i.conversion ?? 0) * 100)}%</Typography>
              </Box>
            ))}
            {((trends?.industryComparison ?? []).length === 0) && (
              <Typography color="text.secondary">No industry data</Typography>
            )}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Common Improvement Areas</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Themes from feedback across your interviews
          </Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {(overview?.feedbackThemes ?? []).map((t: any) => (
              <Chip 
                key={t.theme} 
                label={`${t.theme} (${t.count})`}
                color={t.count >= 3 ? "warning" : "default"}
                size="small"
              />
            ))}
            {((overview?.feedbackThemes ?? []).length === 0) && (
              <Typography color="text.secondary">No feedback themes yet. Add feedback to your interviews to track improvement areas.</Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Company Culture Performance</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Your success rate across different company types
        </Typography>
        <Box sx={{ mt: 1 }}>
          {(trends?.cultureComparison ?? []).filter((c: any) => c.culture?.trim()).map((c: any) => (
            <Box key={c.culture} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
              <Typography sx={{ textTransform: 'capitalize' }}>{c.culture.trim().replace(/-/g, ' ')}</Typography>
              <Typography fontWeight="medium">{Math.round((c.conversion ?? 0) * 100)}%</Typography>
            </Box>
          ))}
          {((trends?.cultureComparison ?? []).length === 0) && (
            <Typography color="text.secondary">Add company culture to your interviews</Typography>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <SummaryCard
          title="Mock Avg / Real Avg"
          value={overview ? `${overview.mockVsReal?.mockAverage ? Math.round(overview.mockVsReal.mockAverage) : "—"} / ${overview.mockVsReal?.realAverage ? Math.round(overview.mockVsReal.realAverage) : "—"}` : "—"}
        />
        <SummaryCard
          title="Improvement"
          value={overview && overview.mockVsReal?.improvement ? `${overview.mockVsReal.improvement > 0 ? "+" : ""}${Math.round(overview.mockVsReal.improvement)}` : "—"}
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>📊</span> Benchmarking & Success Patterns
        </Typography>
        <Box sx={{ mt: 1 }}>
          {overview && overview.conversionRate > 0.25 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Your {Math.round((overview.conversionRate ?? 0) * 100)}% conversion rate is above the typical 15-20% range!
            </Typography>
          )}
          {overview && overview.interviewsCount >= 10 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ You've completed {overview.interviewsCount} interviews - consistent practice leads to mastery.
            </Typography>
          )}
          {overview && overview.mockVsReal?.improvement && overview.mockVsReal.improvement > 5 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ {Math.round(overview.mockVsReal.improvement)} point improvement shows your practice is paying off!
            </Typography>
          )}
          {(!overview || overview.interviewsCount < 5) && (
            <Typography variant="body2" color="text.secondary">
              Complete more interviews to unlock personalized benchmarking insights.
            </Typography>
          )}
        </Box>
      </Paper>

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
      
      <AddInterviewDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSuccess={handleInterviewAdded}
      />
    </Box>
  );
};

export default AnalyticsDashboard;
