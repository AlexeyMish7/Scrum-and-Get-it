/**
 * PROGRESS VISUALIZATION COMPONENT (UC-111)
 *
 * Purpose:
 * - Display visual charts showing job search progress over time
 * - Line chart for weekly activity trends
 * - Bar chart for goal completion rates
 * - Pie chart for application status distribution
 *
 * Uses recharts library for React-compatible charting
 *
 * Used by:
 * - CandidateProgressPage for personal progress view
 * - MentorDashboard for viewing mentee progress
 * - TeamProgressOverview for aggregate team visualization
 */

import { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from "@mui/material";
import {
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProgressSnapshot } from "../services/progressSharingService";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressVisualizationProps {
  // Array of snapshots to visualize (most recent first)
  snapshots: ProgressSnapshot[];
  // Loading state
  loading?: boolean;
  // Compact mode for smaller displays
  compact?: boolean;
  // Which chart to show by default
  defaultChart?: "timeline" | "goals" | "status";
}

// Time range options for filtering
type TimeRange = "1w" | "1m" | "3m" | "all";

// Chart tab options
type ChartTab = "timeline" | "goals" | "status";

// Data structure for line chart
interface TimelineDataPoint {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}

// Data structure for goal bar chart
interface GoalDataPoint {
  week: string;
  completed: number;
  total: number;
  rate: number;
}

// Data structure for status pie chart
interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================

const CHART_COLORS = {
  applications: "#1976d2", // Blue
  interviews: "#9c27b0", // Purple
  offers: "#2e7d32", // Green
  goalsCompleted: "#4caf50", // Light green
  goalsRemaining: "#e0e0e0", // Grey
};

const STATUS_COLORS: Record<string, string> = {
  applied: "#2196f3",
  screening: "#ff9800",
  interviewing: "#9c27b0",
  offer: "#4caf50",
  rejected: "#f44336",
  withdrawn: "#757575",
};

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Transform snapshots into timeline data for the line chart
 */
function transformToTimelineData(
  snapshots: ProgressSnapshot[]
): TimelineDataPoint[] {
  // Sort by date ascending for chart display
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return sorted.map((snapshot) => ({
    date: new Date(snapshot.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    applications: snapshot.applicationsTotal,
    interviews: snapshot.interviewsScheduled,
    offers: snapshot.offersReceived,
  }));
}

/**
 * Transform snapshots into goal completion data for bar chart
 */
function transformToGoalData(snapshots: ProgressSnapshot[]): GoalDataPoint[] {
  // Sort by date ascending
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return sorted.map((snapshot, index) => ({
    week: `Week ${index + 1}`,
    completed: snapshot.goalsCompleted,
    total: snapshot.goalsTotal,
    rate:
      snapshot.goalsTotal > 0
        ? Math.round((snapshot.goalsCompleted / snapshot.goalsTotal) * 100)
        : 0,
  }));
}

/**
 * Aggregate application statuses from most recent snapshot
 * Uses applicationsByStatus from ProgressSnapshot
 */
function transformToStatusData(
  snapshot: ProgressSnapshot | undefined
): StatusDataPoint[] {
  if (!snapshot?.applicationsByStatus) {
    return [];
  }

  const breakdown = snapshot.applicationsByStatus;
  const statusEntries = Object.entries(breakdown);

  return statusEntries
    .filter(([, count]) => (count as number) > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count as number,
      color: STATUS_COLORS[status] || "#9e9e9e",
    }));
}

/**
 * Filter snapshots by time range
 */
function filterByTimeRange(
  snapshots: ProgressSnapshot[],
  range: TimeRange
): ProgressSnapshot[] {
  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case "1w":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1m":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3m":
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      return snapshots;
  }

  return snapshots.filter(
    (s) => new Date(s.createdAt).getTime() >= cutoff.getTime()
  );
}

// ============================================================================
// CHART COMPONENTS
// ============================================================================

/**
 * Timeline Line Chart - shows activity over time
 */
function TimelineChart({
  data,
  height = 300,
}: {
  data: TimelineDataPoint[];
  height?: number;
}) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No timeline data available yet
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="date"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="applications"
          name="Applications"
          stroke={CHART_COLORS.applications}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.applications, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="interviews"
          name="Interviews"
          stroke={CHART_COLORS.interviews}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.interviews, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="offers"
          name="Offers"
          stroke={CHART_COLORS.offers}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.offers, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Goals Bar Chart - shows goal completion by week
 */
function GoalsChart({
  data,
  height = 300,
}: {
  data: GoalDataPoint[];
  height?: number;
}) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No goal data available yet
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="week"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
          formatter={(value, name) => {
            if (name === "rate") return [`${value}%`, "Completion Rate"];
            return [value, name];
          }}
        />
        <Legend />
        <Bar
          dataKey="completed"
          name="Completed"
          fill={CHART_COLORS.goalsCompleted}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="total"
          name="Total Goals"
          fill={CHART_COLORS.goalsRemaining}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Status Pie Chart - shows application status distribution
 */
function StatusChart({
  data,
  height = 300,
}: {
  data: StatusDataPoint[];
  height?: number;
}) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No status data available yet
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data as unknown as Record<string, unknown>[]}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} (${((percent as number) * 100).toFixed(0)}%)`
          }
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressVisualization({
  snapshots,
  loading = false,
  compact = false,
  defaultChart = "timeline",
}: ProgressVisualizationProps) {
  // State
  const [activeTab, setActiveTab] = useState<ChartTab>(defaultChart);
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");

  // Filter snapshots by time range
  const filteredSnapshots = useMemo(
    () => filterByTimeRange(snapshots, timeRange),
    [snapshots, timeRange]
  );

  // Transform data for each chart type
  const timelineData = useMemo(
    () => transformToTimelineData(filteredSnapshots),
    [filteredSnapshots]
  );

  const goalData = useMemo(
    () => transformToGoalData(filteredSnapshots),
    [filteredSnapshots]
  );

  const statusData = useMemo(
    () => transformToStatusData(filteredSnapshots[0]),
    [filteredSnapshots]
  );

  // Chart height based on compact mode
  const chartHeight = compact ? 200 : 300;

  // Handle tab change
  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: ChartTab
  ) => {
    setActiveTab(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: TimeRange | null
  ) => {
    if (newRange) {
      setTimeRange(newRange);
    }
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={chartHeight} />
        </Stack>
      </Paper>
    );
  }

  // Render empty state
  if (snapshots.length === 0) {
    return (
      <Paper sx={{ p: compact ? 2 : 3, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No progress data available yet. Progress snapshots will appear here as
          you track your job search activity.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: compact ? 2 : 3 }}>
      <Stack spacing={2}>
        {/* Header with tabs and time range */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          {/* Chart type tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 40 }}
          >
            <Tab
              value="timeline"
              icon={<TimelineIcon fontSize="small" />}
              iconPosition="start"
              label="Timeline"
              sx={{ minHeight: 40, py: 0.5 }}
            />
            <Tab
              value="goals"
              icon={<BarChartIcon fontSize="small" />}
              iconPosition="start"
              label="Goals"
              sx={{ minHeight: 40, py: 0.5 }}
            />
            <Tab
              value="status"
              icon={<PieChartIcon fontSize="small" />}
              iconPosition="start"
              label="Status"
              sx={{ minHeight: 40, py: 0.5 }}
            />
          </Tabs>

          {/* Time range selector (not shown for status chart) */}
          {activeTab !== "status" && (
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="1w">1W</ToggleButton>
              <ToggleButton value="1m">1M</ToggleButton>
              <ToggleButton value="3m">3M</ToggleButton>
              <ToggleButton value="all">All</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>

        {/* Chart display area */}
        <Box sx={{ minHeight: chartHeight }}>
          {activeTab === "timeline" && (
            <TimelineChart data={timelineData} height={chartHeight} />
          )}
          {activeTab === "goals" && (
            <GoalsChart data={goalData} height={chartHeight} />
          )}
          {activeTab === "status" && (
            <StatusChart data={statusData} height={chartHeight} />
          )}
        </Box>

        {/* Summary stats below chart */}
        {activeTab === "timeline" && timelineData.length > 0 && (
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            sx={{
              pt: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="primary.main">
                {timelineData.reduce((sum, d) => sum + d.applications, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Applications
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="secondary.main">
                {timelineData.reduce((sum, d) => sum + d.interviews, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Interviews
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="success.main">
                {timelineData.reduce((sum, d) => sum + d.offers, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Offers
              </Typography>
            </Box>
          </Stack>
        )}

        {activeTab === "goals" && goalData.length > 0 && (
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            sx={{
              pt: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="success.main">
                {goalData.reduce((sum, d) => sum + d.completed, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Goals Completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="text.primary">
                {Math.round(
                  goalData.reduce((sum, d) => sum + d.rate, 0) / goalData.length
                )}
                %
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Completion Rate
              </Typography>
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default ProgressVisualization;
