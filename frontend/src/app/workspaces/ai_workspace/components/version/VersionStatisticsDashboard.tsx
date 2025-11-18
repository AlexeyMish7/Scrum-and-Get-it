/**
 * VERSION STATISTICS DASHBOARD
 * Displays aggregated statistics across all document versions.
 */

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

/**
 * Version statistics data
 */
interface VersionStatistics {
  totalVersions: number;
  totalBranches: number;
  mostUsedVersion: {
    name: string;
    usageCount: number;
  } | null;
  highestATSScore: number | null;
  averageSuccessRate: number | null;
}

/**
 * VersionStatisticsDashboard Props
 */
interface VersionStatisticsDashboardProps {
  /** Statistics data */
  statistics: VersionStatistics;
}

/**
 * StatCard Component
 * Individual statistic card
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  progress?: number;
}> = ({ icon, label, value, color = "primary.main", subtitle, progress }) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography
            variant="caption"
            color="text.secondary"
            textTransform="uppercase"
          >
            {label}
          </Typography>
        </Stack>

        <Typography variant="h4" fontWeight={600}>
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1 }}
          />
        )}
      </Stack>
    </Paper>
  );
};

/**
 * VersionStatisticsDashboard Component
 *
 * Inputs:
 * - statistics: Aggregated version statistics
 *
 * Outputs:
 * - Visual dashboard with key metrics
 */
export const VersionStatisticsDashboard: React.FC<
  VersionStatisticsDashboardProps
> = ({ statistics }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Version Analytics
      </Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
          {/* Total Versions */}
          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 8px)",
                md: "1 1 calc(25% - 12px)",
              },
              minWidth: 200,
            }}
          >
            <StatCard
              icon={<AssignmentIcon />}
              label="Total Versions"
              value={statistics.totalVersions}
              color="primary.main"
            />
          </Box>

          {/* Total Branches */}
          <Box
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 8px)",
                md: "1 1 calc(25% - 12px)",
              },
              minWidth: 200,
            }}
          >
            <StatCard
              icon={<TrendingUpIcon />}
              label="Active Branches"
              value={statistics.totalBranches}
              color="secondary.main"
            />
          </Box>

          {/* Highest ATS Score */}
          {statistics.highestATSScore !== null && (
            <Box
              sx={{
                flex: {
                  xs: "1 1 100%",
                  sm: "1 1 calc(50% - 8px)",
                  md: "1 1 calc(25% - 12px)",
                },
                minWidth: 200,
              }}
            >
              <StatCard
                icon={<StarIcon />}
                label="Best ATS Score"
                value={`${statistics.highestATSScore}%`}
                color="success.main"
                progress={statistics.highestATSScore}
              />
            </Box>
          )}

          {/* Average Success Rate */}
          {statistics.averageSuccessRate !== null && (
            <Box
              sx={{
                flex: {
                  xs: "1 1 100%",
                  sm: "1 1 calc(50% - 8px)",
                  md: "1 1 calc(25% - 12px)",
                },
                minWidth: 200,
              }}
            >
              <StatCard
                icon={<VisibilityIcon />}
                label="Avg Success Rate"
                value={`${Math.round(statistics.averageSuccessRate)}%`}
                color="info.main"
                progress={statistics.averageSuccessRate}
              />
            </Box>
          )}
        </Stack>

        {/* Most Used Version */}
        {statistics.mostUsedVersion && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textTransform="uppercase"
                >
                  Most Used Version
                </Typography>
                <Typography variant="h6">
                  {statistics.mostUsedVersion.name}
                </Typography>
              </Box>
              <Chip
                label={`${statistics.mostUsedVersion.usageCount} applications`}
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};
