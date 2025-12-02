/**
 * ACCOUNTABILITY IMPACT CARD COMPONENT (UC-111)
 *
 * Displays analytics showing how accountability partnerships affect job search success.
 * Shows improvement metrics, engagement stats, and partner effectiveness.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Skeleton,
  Alert,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  EmojiEvents as TrophyIcon,
  Favorite as HeartIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as analyticsService from "../services/analyticsService";
import type {
  AccountabilityImpact,
  PartnerEffectiveness,
  AnalyticsPeriod,
} from "../services/analyticsService";

// ============================================================================
// TYPES
// ============================================================================

interface AccountabilityImpactCardProps {
  compact?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const isPositive = (change || 0) >= 0;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            {icon}
          </Stack>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {change !== undefined && (
              <Chip
                size="small"
                icon={
                  isPositive ? (
                    <TrendingUpIcon fontSize="small" />
                  ) : (
                    <TrendingDownIcon fontSize="small" />
                  )
                }
                label={`${isPositive ? "+" : ""}${change}%`}
                color={isPositive ? "success" : "error"}
                sx={{ height: 24 }}
              />
            )}
          </Stack>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function PartnerCard({ partner }: { partner: PartnerEffectiveness }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {partner.partnerName}
          </Typography>
          <Chip
            size="small"
            label={`${partner.effectivenessScore}%`}
            color={
              partner.effectivenessScore >= 70
                ? "success"
                : partner.effectivenessScore >= 40
                ? "warning"
                : "default"
            }
          />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={partner.effectivenessScore}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Stack direction="row" spacing={2}>
          <Typography variant="caption" color="text.secondary">
            {partner.messageCount} messages
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partner.encouragementCount} encouragements
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partner.durationDays} days
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AccountabilityImpactCard({
  compact = false,
}: AccountabilityImpactCardProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const [impact, setImpact] = useState<AccountabilityImpact | null>(null);
  const [partners, setPartners] = useState<PartnerEffectiveness[]>([]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user?.id || !currentTeam?.id) return;

      setLoading(true);
      setError(null);

      try {
        const [impactResult, partnersResult] = await Promise.all([
          analyticsService.getAccountabilityImpact(
            user.id,
            currentTeam.id,
            period
          ),
          analyticsService.getPartnerEffectiveness(user.id, currentTeam.id),
        ]);

        if (impactResult.error) {
          setError(impactResult.error.message);
          return;
        }

        setImpact(impactResult.data);
        setPartners(partnersResult.data || []);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user?.id, currentTeam?.id, period]);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={32} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Skeleton variant="rectangular" height={100} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
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
        <PeopleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Analytics Available
        </Typography>
        <Typography color="text.secondary">
          Add accountability partners to start tracking your progress impact.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Accountability Impact
            </Typography>
            <Typography variant="body2" color="text.secondary">
              How partnerships are helping your job search
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {(["week", "month", "quarter"] as AnalyticsPeriod[]).map((p) => (
              <Chip
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                size="small"
                variant={period === p ? "filled" : "outlined"}
                onClick={() => setPeriod(p)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Overall Improvement */}
        {impact.improvement.overall > 0 && (
          <Alert severity="success" icon={<TrendingUpIcon />}>
            Your performance has improved by{" "}
            <strong>{impact.improvement.overall}%</strong> since starting with
            accountability partners!
          </Alert>
        )}

        {/* Key Metrics */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard
              title="Applications/Week"
              value={impact.withPartnership.applicationsPerWeek}
              change={impact.improvement.applicationsPerWeek}
              icon={<TrendingUpIcon color="primary" fontSize="small" />}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard
              title="Interview Rate"
              value={`${impact.withPartnership.interviewConversionRate}%`}
              change={impact.improvement.interviewConversionRate}
              icon={<TrophyIcon color="warning" fontSize="small" />}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard
              title="Active Partners"
              value={impact.activePartners}
              subtitle={`${impact.partnershipDurationDays} days avg`}
              icon={<PeopleIcon color="info" fontSize="small" />}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard
              title="Current Streak"
              value={`${impact.withPartnership.longestStreak} days`}
              icon={<HeartIcon color="error" fontSize="small" />}
            />
          </Grid>
        </Grid>

        {!compact && (
          <>
            <Divider />

            {/* Engagement Stats */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Engagement This{" "}
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Tooltip title="Messages exchanged with partners">
                  <Chip
                    icon={<MessageIcon />}
                    label={`${
                      impact.engagement.messagesSent +
                      impact.engagement.messagesReceived
                    } messages`}
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Encouragements received">
                  <Chip
                    icon={<HeartIcon />}
                    label={`${impact.engagement.encouragementsReceived} encouragements`}
                    variant="outlined"
                    color="error"
                  />
                </Tooltip>
                <Tooltip title="Achievements shared">
                  <Chip
                    icon={<TrophyIcon />}
                    label={`${impact.engagement.celebrationsShared} celebrations`}
                    variant="outlined"
                    color="warning"
                  />
                </Tooltip>
              </Stack>
            </Box>

            {/* Partner Effectiveness */}
            {partners.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Partner Effectiveness
                </Typography>
                <Stack spacing={1}>
                  {partners.slice(0, 3).map((partner) => (
                    <PartnerCard key={partner.partnerId} partner={partner} />
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default AccountabilityImpactCard;
