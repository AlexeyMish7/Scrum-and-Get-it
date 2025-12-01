/**
 * SALARY PROGRESSION CARD
 *
 * Displays comprehensive salary and negotiation analytics:
 * - Salary progression timeline chart
 * - Negotiation success rates and outcomes
 * - Total compensation evolution
 * - Career impact on earnings
 * - AI-powered insights and recommendations
 *
 * Integrates with existing SalaryResearchCard for market benchmarking
 */

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  ShowChart,
  CheckCircle,
  EmojiEvents,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { getSalaryAnalytics } from "@shared/services/dbMappers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface SalaryAnalytics {
  salaryProgression: {
    timeline: Array<{
      date: string;
      offered: number;
      negotiated: number;
      company: string;
      title: string;
    }>;
    avgOfferedSalary: number;
    totalOffers: number;
    salaryIncrease: number;
  };
  negotiationSuccess: {
    successRate: number;
    avgNegotiationGain: number;
    totalNegotiated: number;
    outcomes: Record<string, number>;
  };
  compensationEvolution: {
    timeline: Array<{
      date: string;
      totalComp: number;
      breakdown: any;
      company: string;
    }>;
    avgTotalComp: number;
  };
  careerImpact: {
    offersByLevel: Array<{
      level: string;
      count: number;
      avgSalary: number;
    }>;
    salaryByIndustry: Array<{
      industry: string;
      count: number;
      avgSalary: number;
    }>;
    salaryByLocation: Array<{
      location: string;
      count: number;
      avgSalary: number;
    }>;
  };
  insights: string[];
  recommendations: string[];
}

interface SalaryProgressionCardProps {
  userId: string;
  timeRange?: string;
}

export default function SalaryProgressionCard({
  userId,
  timeRange = "all",
}: SalaryProgressionCardProps) {
  const { session } = useAuth();
  const [analytics, setAnalytics] = useState<SalaryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !session?.access_token) {
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSalaryAnalytics(
          userId,
          session.access_token,
          timeRange
        );

        if (result.error) {
          throw new Error(
            result.error.message || "Failed to fetch salary analytics"
          );
        }

        setAnalytics(result.data as SalaryAnalytics);
      } catch (err: any) {
        console.error("Salary analytics error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, timeRange, session]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          💰 Salary Progression & Negotiation Analytics
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          💰 Salary Progression & Negotiation Analytics
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (
    !analytics ||
    !analytics.salaryProgression ||
    analytics.salaryProgression.totalOffers === 0
  ) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6">
            Salary Progression & Negotiation Analytics
          </Typography>
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>No salary data yet.</strong> Start tracking your offers to
            unlock powerful analytics!
          </Typography>
          <Typography variant="body2">
            To add offer data: Click on any job → Edit → Scroll to "Offer
            Details & Tracking" section → Fill in offer details → Save
          </Typography>
        </Alert>
      </Paper>
    );
  }

  const {
    salaryProgression,
    negotiationSuccess,
    compensationEvolution,
    careerImpact,
    insights,
    recommendations,
  } = analytics;

  // Format salary timeline for chart
  const salaryChartData = salaryProgression.timeline.map((item) => ({
    date: item.date
      ? new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "N/A",
    offered: item.offered,
    negotiated: item.negotiated,
    company: item.company,
  }));

  // Format career impact data for chart
  const levelChartData = careerImpact.offersByLevel.map((item) => ({
    level: item.level,
    avgSalary: item.avgSalary,
    count: item.count,
  }));

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TrendingUp color="primary" />
        <Typography variant="h6">
          Salary Progression & Negotiation Analytics
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your compensation growth, negotiation success, and career
        advancement impact
      </Typography>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary.main">
              {salaryProgression.totalOffers}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Offers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              ${Math.round(salaryProgression.avgOfferedSalary / 1000)}k
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Offered Salary
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {negotiationSuccess.successRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Negotiation Success
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              ${Math.round(negotiationSuccess.avgNegotiationGain / 1000)}k
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Negotiation Gain
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Salary Progression Chart */}
      {salaryChartData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            <ShowChart sx={{ verticalAlign: "middle", mr: 0.5 }} />
            Salary Progression Over Time
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="offered"
                  stroke="#1976d2"
                  strokeWidth={2}
                  name="Offered Salary"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="negotiated"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  name="Negotiated Salary"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Negotiation Outcomes */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          <CheckCircle sx={{ verticalAlign: "middle", mr: 0.5 }} />
          Negotiation Outcomes
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {Object.entries(negotiationSuccess.outcomes).map(
            ([outcome, count]) => (
              <Chip
                key={outcome}
                label={`${outcome}: ${count}`}
                size="small"
                color={
                  outcome === "accepted"
                    ? "success"
                    : outcome === "declined"
                    ? "error"
                    : "default"
                }
              />
            )
          )}
        </Stack>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Success Rate: {negotiationSuccess.successRate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, negotiationSuccess.successRate)}
              sx={{ mt: 1 }}
            />
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {negotiationSuccess.totalNegotiated} successful
          </Typography>
        </Box>
      </Box>

      {/* Career Impact - Offers by Level */}
      {levelChartData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            <EmojiEvents sx={{ verticalAlign: "middle", mr: 0.5 }} />
            Salary by Experience Level
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="avgSalary" fill="#1976d2" name="Avg Salary" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Industry Comparison Table */}
      {careerImpact.salaryByIndustry.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Salary by Industry
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Industry</TableCell>
                <TableCell align="right">Offers</TableCell>
                <TableCell align="right">Avg Salary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {careerImpact.salaryByIndustry.map((item) => (
                <TableRow key={item.industry}>
                  <TableCell>{item.industry}</TableCell>
                  <TableCell align="right">{item.count}</TableCell>
                  <TableCell align="right">
                    ${item.avgSalary.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Location Comparison Table */}
      {careerImpact.salaryByLocation.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Salary by Location
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Location</TableCell>
                <TableCell align="right">Offers</TableCell>
                <TableCell align="right">Avg Salary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {careerImpact.salaryByLocation.map((item) => (
                <TableRow key={item.location}>
                  <TableCell>{item.location}</TableCell>
                  <TableCell align="right">{item.count}</TableCell>
                  <TableCell align="right">
                    ${item.avgSalary.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Insights */}
      {insights.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            📊 Insights
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {insights.map((insight, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {insight}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            💡 Recommendations
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {recommendations.map((rec, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {rec}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
