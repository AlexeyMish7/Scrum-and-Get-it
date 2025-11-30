/**
 * ProgramAnalyticsChart.tsx
 *
 * Visualization component for program analytics in enterprise career services.
 */

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Alert,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PeopleIcon from "@mui/icons-material/People";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useEnterprise } from "../../hooks/useEnterprise";
import type { ProgramAnalyticsRow } from "../../types/enterprise.types";

interface ProgramAnalyticsChartProps {
  teamId: string;
  cohortId?: string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon,
  color = "primary.main",
}: MetricCardProps) => (
  <Card>
    <CardContent>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          {change !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              {change >= 0 ? (
                <TrendingUpIcon fontSize="small" color="success" />
              ) : (
                <TrendingDownIcon fontSize="small" color="error" />
              )}
              <Typography
                variant="body2"
                color={change >= 0 ? "success.main" : "error.main"}
                ml={0.5}
              >
                {change >= 0 ? "+" : ""}
                {change}% from last period
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ backgroundColor: `${color}15`, borderRadius: 2, p: 1 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const ProgramAnalyticsChart = ({
  teamId,
  cohortId,
}: ProgramAnalyticsChartProps) => {
  const [period, setPeriod] = useState("30d");
  const { analytics, analyticsLoading, analyticsError, refreshAnalytics } =
    useEnterprise(teamId);

  const calculateMetrics = (data: ProgramAnalyticsRow[]) => {
    const filteredData = cohortId
      ? data.filter((a) => a.cohort_id === cohortId)
      : data;
    if (filteredData.length === 0) {
      return {
        activeUsers: 0,
        totalApplications: 0,
        totalOffers: 0,
        placementRate: 0,
        avgEngagement: 0,
        resumesGenerated: 0,
      };
    }
    // Aggregate metrics from individual fields on ProgramAnalyticsRow
    const aggregated = filteredData.reduce(
      (acc, record) => {
        return {
          activeUsers: acc.activeUsers + (record.active_users || 0),
          totalApplications:
            acc.totalApplications + (record.total_applications || 0),
          totalOffers: acc.totalOffers + (record.total_offers || 0),
          totalPlacements: acc.totalPlacements + (record.total_placements || 0),
          profileCompletenessSum:
            acc.profileCompletenessSum + (record.avg_profile_completeness || 0),
          count: acc.count + 1,
        };
      },
      {
        activeUsers: 0,
        totalApplications: 0,
        totalOffers: 0,
        totalPlacements: 0,
        profileCompletenessSum: 0,
        count: 0,
      }
    );
    return {
      activeUsers: aggregated.activeUsers,
      totalApplications: aggregated.totalApplications,
      totalOffers: aggregated.totalOffers,
      placementRate:
        aggregated.totalApplications > 0
          ? Math.round(
              (aggregated.totalOffers / aggregated.totalApplications) * 100
            )
          : 0,
      avgEngagement:
        aggregated.count > 0
          ? Math.round(aggregated.profileCompletenessSum / aggregated.count)
          : 0,
      resumesGenerated: aggregated.totalPlacements,
    };
  };

  const metrics = calculateMetrics(analytics);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const endDate = new Date();
    const startDate = new Date();
    switch (newPeriod) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    refreshAnalytics({
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    });
  };

  if (analyticsLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (analyticsError) {
    return (
      <Alert severity="error">Failed to load analytics: {analyticsError}</Alert>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Program Analytics</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => handlePeriodChange(e.target.value)}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            change={5}
            icon={<PeopleIcon sx={{ color: "primary.main" }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Applications Submitted"
            value={metrics.totalApplications.toLocaleString()}
            change={12}
            icon={<WorkIcon sx={{ color: "info.main" }} />}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Offers Received"
            value={metrics.totalOffers.toLocaleString()}
            change={8}
            icon={<CheckCircleIcon sx={{ color: "success.main" }} />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Placement Rate"
            value={`${metrics.placementRate}%`}
            change={3}
            icon={<TrendingUpIcon sx={{ color: "warning.main" }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard
            title="Resumes Generated"
            value={metrics.resumesGenerated.toLocaleString()}
            icon={<DescriptionIcon sx={{ color: "secondary.main" }} />}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard
            title="Average Engagement Score"
            value={`${metrics.avgEngagement}%`}
            icon={<TrendingUpIcon sx={{ color: "primary.main" }} />}
          />
        </Grid>
      </Grid>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Trend Over Time
        </Typography>
        <Box
          sx={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            Chart visualization placeholder
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProgramAnalyticsChart;
