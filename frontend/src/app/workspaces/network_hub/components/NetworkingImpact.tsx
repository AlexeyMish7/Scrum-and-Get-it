/**
 * NetworkingImpact.tsx
 *
 * UC-112: Peer Networking and Support Groups
 *
 * Component for visualizing networking metrics and impact analytics.
 * Shows users how their peer networking activities contribute to their
 * job search success with detailed charts and statistics.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Refresh,
  TrendingUp,
  TrendingDown,
  Group,
  Forum,
  EmojiEvents,
  Work,
  Star,
  Handshake,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { getNetworkingImpact } from "../services/peerGroupsService";
import type { ImpactSummary } from "../types/peerGroups.types";

// Impact level type derived from the trend for determining display colors
type ImpactLevel = "high" | "medium" | "low";

// Helper to determine impact level from score
const getImpactLevel = (score: number): ImpactLevel => {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
};

// Helper to get color based on impact level
const getImpactLevelColor = (level: ImpactLevel): string => {
  switch (level) {
    case "high":
      return "#4caf50"; // Green
    case "medium":
      return "#ff9800"; // Orange
    case "low":
      return "#f44336"; // Red
    default:
      return "#9e9e9e"; // Grey
  }
};

// Helper to get icon based on impact level
const getImpactLevelIcon = (level: ImpactLevel) => {
  switch (level) {
    case "high":
      return <TrendingUp sx={{ color: "#4caf50" }} />;
    case "medium":
      return <TrendingUp sx={{ color: "#ff9800" }} />;
    case "low":
      return <TrendingDown sx={{ color: "#f44336" }} />;
    default:
      return null;
  }
};

// Metric card component for displaying individual statistics
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "#1976d2",
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}10 100%)`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Stack>
        {trend && trend !== "stable" && (
          <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
            {trend === "up" && (
              <TrendingUp sx={{ color: "#4caf50", fontSize: 16 }} />
            )}
            {trend === "down" && (
              <TrendingDown sx={{ color: "#f44336", fontSize: 16 }} />
            )}
            <Typography
              variant="caption"
              color={trend === "up" ? "success.main" : "error.main"}
            >
              {trend === "up" ? "Trending up" : "Trending down"}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main NetworkingImpact component
export const NetworkingImpact: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load networking impact data
  const loadImpact = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getNetworkingImpact(userId);
      if (result.data) {
        setImpact(result.data);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading networking impact:", err);
      setError("Failed to load networking impact data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadImpact();
  }, [loadImpact]);

  // Derive impact level from score
  const impactLevel = impact
    ? getImpactLevel(impact.overall_impact_score)
    : "low";

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!impact) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          No Impact Data Yet
        </Typography>
        <Typography color="text.secondary">
          Start participating in peer groups to build your networking impact!
          Join groups, create posts, complete challenges, and share referrals.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Networking Impact Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track how your peer networking activities contribute to your job
            search
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={loadImpact}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Overall Impact Level */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${getImpactLevelColor(
            impactLevel
          )}10 0%, ${getImpactLevelColor(impactLevel)}30 100%)`,
          borderLeft: `6px solid ${getImpactLevelColor(impactLevel)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {getImpactLevelIcon(impactLevel)}
          <Box>
            <Typography variant="h6">
              Overall Impact Score:{" "}
              <Chip
                label={`${impact.overall_impact_score} pts`}
                size="small"
                sx={{
                  backgroundColor: getImpactLevelColor(impactLevel),
                  color: "white",
                  fontWeight: "bold",
                }}
              />{" "}
              <Chip
                label={impactLevel.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: getImpactLevelColor(impactLevel),
                  color: getImpactLevelColor(impactLevel),
                }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Based on your networking activity, engagement, and contributions
              {impact.trend !== "stable" && (
                <>
                  {" "}
                  • Trend:{" "}
                  <strong>
                    {impact.trend === "up" ? "↑ Improving" : "↓ Declining"}
                  </strong>
                </>
              )}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Groups Joined"
            value={impact.total_groups}
            icon={<Group sx={{ fontSize: 32, color: "#2196f3" }} />}
            subtitle="Active memberships"
            color="#2196f3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Total Posts"
            value={impact.total_posts}
            icon={<Forum sx={{ fontSize: 32, color: "#4caf50" }} />}
            subtitle="Discussion contributions"
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Total Replies"
            value={impact.total_replies}
            icon={<Forum sx={{ fontSize: 32, color: "#ff9800" }} />}
            subtitle="Engagement with others"
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Challenges Completed"
            value={impact.challenges_completed}
            icon={<EmojiEvents sx={{ fontSize: 32, color: "#9c27b0" }} />}
            subtitle="Job search milestones"
            color="#9c27b0"
            trend={impact.trend}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Referrals Shared"
            value={impact.referrals_shared}
            icon={<Work sx={{ fontSize: 32, color: "#00bcd4" }} />}
            subtitle="Opportunities given"
            color="#00bcd4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Referrals Received"
            value={impact.referrals_received}
            icon={<Handshake sx={{ fontSize: 32, color: "#e91e63" }} />}
            subtitle="Opportunities received"
            color="#e91e63"
          />
        </Grid>
      </Grid>

      {/* Outcomes from Networking */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Outcomes from Peer Networking
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#e3f2fd",
                }}
              >
                <Work sx={{ fontSize: 40, color: "#1976d2" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {impact.interviews_from_peers}
                </Typography>
                <Typography color="text.secondary">
                  Interviews from peer referrals
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#e8f5e9",
                }}
              >
                <EmojiEvents sx={{ fontSize: 40, color: "#4caf50" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {impact.offers_from_peers}
                </Typography>
                <Typography color="text.secondary">
                  Job offers from peer connections
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tips for Improvement */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Star sx={{ verticalAlign: "middle", mr: 1, color: "#ffc107" }} />
          Tips to Boost Your Impact
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          {impact.total_groups < 3 && (
            <Alert severity="info" icon={<Group />}>
              Join more groups to expand your network. Try to be active in at
              least 3 groups.
            </Alert>
          )}
          {impact.total_posts < 10 && (
            <Alert severity="info" icon={<Forum />}>
              Share your experiences more often. Regular posting increases
              visibility.
            </Alert>
          )}
          {impact.challenges_completed < 3 && (
            <Alert severity="info" icon={<EmojiEvents />}>
              Participate in group challenges to stay motivated and track
              progress.
            </Alert>
          )}
          {impact.referrals_shared < 2 && (
            <Alert severity="info" icon={<Work />}>
              Share job referrals when you find good opportunities. Giving leads
              to receiving!
            </Alert>
          )}
          {impactLevel === "high" && (
            <Alert severity="success" icon={<Star />}>
              Great job! You&apos;re making a strong impact. Keep up the
              excellent networking!
            </Alert>
          )}
          {impact.total_groups >= 3 &&
            impact.total_posts >= 10 &&
            impact.challenges_completed >= 3 &&
            impact.referrals_shared >= 2 &&
            impactLevel !== "high" && (
              <Alert severity="success" icon={<TrendingUp />}>
                You&apos;re doing great! Continue being active and your impact
                will grow.
              </Alert>
            )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default NetworkingImpact;
