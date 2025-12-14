/**
 * TEAM PROGRESS OVERVIEW COMPONENT (UC-111)
 *
 * Purpose:
 * - Provides team admins with a summary view of all members' progress
 * - Aggregates progress metrics across the team
 * - Highlights top performers and members needing support
 * - Shows team-wide trends and achievements
 *
 * Features:
 * - Team-level statistics (total apps, interviews, offers)
 * - Member progress comparison cards
 * - Recent team achievements feed
 * - Activity leaderboard
 *
 * Usage:
 *   <TeamProgressOverview
 *     teamId={currentTeam.id}
 *     onMemberClick={(userId) => handleViewMember(userId)}
 *   />
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Celebration as CelebrationIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import * as progressSharingService from "../services/progressSharingService";
import type {
  ProgressSnapshot,
  AchievementCelebration,
} from "../services/progressSharingService";
import { useAuth } from "@shared/context/AuthContext";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchTeamMembersWithProfiles } from "@shared/cache/coreFetchers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TeamProgressOverviewProps {
  teamId: string;
  onMemberClick?: (userId: string) => void;
}

type TeamMemberRowWithProfile = {
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface MemberProgress {
  userId: string;
  userName: string;
  userAvatar?: string;
  latestSnapshot?: ProgressSnapshot;
  recentAchievements: AchievementCelebration[];
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  averageActivityScore: number;
  topPerformers: MemberProgress[];
  needsSupport: MemberProgress[];
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Stat card for displaying team-level metrics
 */
function StatCard({
  icon,
  label,
  value,
  trend,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h4">{value}</Typography>
          {trend !== undefined && trend !== 0 && (
            <Chip
              icon={
                trend > 0 ? (
                  <TrendingUpIcon fontSize="small" />
                ) : (
                  <TrendingDownIcon fontSize="small" />
                )
              }
              label={`${trend > 0 ? "+" : ""}${trend}%`}
              size="small"
              color={trend > 0 ? "success" : "warning"}
              variant="outlined"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Member progress card for the leaderboard
 */
function MemberCard({
  member,
  rank,
  onClick,
}: {
  member: MemberProgress;
  rank?: number;
  onClick?: () => void;
}) {
  const activityScore = member.latestSnapshot?.activityScore ?? 0;
  const applications = member.latestSnapshot?.applicationsTotal ?? 0;
  const streak = member.latestSnapshot?.streakDays ?? 0;

  // Get rank badge styling
  const getRankStyle = () => {
    if (!rank) return {};
    switch (rank) {
      case 1:
        return { bgcolor: "gold", color: "black" };
      case 2:
        return { bgcolor: "silver", color: "black" };
      case 3:
        return { bgcolor: "#CD7F32", color: "white" };
      default:
        return { bgcolor: "grey.300", color: "text.primary" };
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick
          ? { bgcolor: "action.hover", borderColor: "primary.main" }
          : {},
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Rank badge */}
          {rank && (
            <Avatar sx={{ width: 32, height: 32, ...getRankStyle() }}>
              <Typography variant="body2" fontWeight="bold">
                {rank}
              </Typography>
            </Avatar>
          )}

          {/* User avatar */}
          <Avatar
            src={member.userAvatar}
            sx={{ width: 48, height: 48, bgcolor: "primary.main" }}
          >
            {member.userName?.[0]?.toUpperCase() || "?"}
          </Avatar>

          {/* User info */}
          <Box flex={1}>
            <Typography variant="subtitle1">{member.userName}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {streak > 0 && (
                <Chip
                  icon={<StreakIcon />}
                  label={`${streak} day streak`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {member.recentAchievements.length > 0 && (
                <Chip
                  icon={<TrophyIcon />}
                  label={`${member.recentAchievements.length} achievements`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          {/* Stats */}
          <Stack alignItems="flex-end" spacing={0.5}>
            <Typography variant="h6" color="primary">
              {applications}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              applications
            </Typography>
          </Stack>

          {/* Activity score */}
          <Box sx={{ width: 60, textAlign: "center" }}>
            <CircularProgress
              variant="determinate"
              value={Math.min(activityScore, 100)}
              size={40}
              thickness={4}
              color={
                activityScore >= 70
                  ? "success"
                  : activityScore >= 40
                  ? "warning"
                  : "error"
              }
            />
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              Activity
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeamProgressOverview({
  teamId,
  onMemberClick,
}: TeamProgressOverviewProps) {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<
    AchievementCelebration[]
  >([]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load all team members and their progress data
   */
  const loadTeamProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("You must be signed in to view team progress");
        setLoading(false);
        return;
      }

      // Load team members via shared cache so team dashboards don't requery on every navigation.
      const qc = getAppQueryClient();
      const members = await qc.ensureQueryData({
        queryKey: coreKeys.teamMembers(user.id, teamId),
        queryFn: () =>
          fetchTeamMembersWithProfiles<TeamMemberRowWithProfile>(
            user.id,
            teamId
          ),
        staleTime: 60 * 60 * 1000,
      });

      // Load progress for each member
      const memberProgressData: MemberProgress[] = await Promise.all(
        (members || []).map(async (member) => {
          const profile = member.profiles;

          // Get latest snapshot
          const snapshotsResult =
            await progressSharingService.getProgressSnapshots(
              member.user_id,
              teamId,
              { limit: 1 }
            );

          // Get recent achievements
          const achievementsResult =
            await progressSharingService.getAchievements(
              member.user_id,
              teamId,
              { limit: 3 }
            );

          return {
            userId: member.user_id,
            userName: profile
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : "Unknown User",
            userAvatar: profile?.avatar_url || undefined,
            latestSnapshot: snapshotsResult.data?.[0],
            recentAchievements: achievementsResult.data || [],
          };
        })
      );

      setMemberProgress(memberProgressData);

      // Calculate team stats
      const stats = calculateTeamStats(memberProgressData);
      setTeamStats(stats);

      // Collect all recent achievements across the team
      const allAchievements = memberProgressData
        .flatMap((m) => m.recentAchievements)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
      setRecentAchievements(allAchievements);
    } catch (err) {
      console.error("Failed to load team progress:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [teamId, user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    const qc = getAppQueryClient();
    await qc.invalidateQueries({
      queryKey: coreKeys.teamMembers(user.id, teamId),
    });
    await loadTeamProgress();
  }, [loadTeamProgress, teamId, user?.id]);

  /**
   * Calculate aggregate team statistics
   */
  const calculateTeamStats = (members: MemberProgress[]): TeamStats => {
    const activeMembers = members.filter(
      (m) => m.latestSnapshot && m.latestSnapshot.activityScore > 0
    );

    // Sum up metrics from latest snapshots
    let totalApplications = 0;
    let totalInterviews = 0;
    let totalOffers = 0;
    let totalActivityScore = 0;

    members.forEach((m) => {
      if (m.latestSnapshot) {
        totalApplications += m.latestSnapshot.applicationsTotal;
        totalInterviews += m.latestSnapshot.interviewsCompleted;
        totalOffers += m.latestSnapshot.offersReceived;
        totalActivityScore += m.latestSnapshot.activityScore;
      }
    });

    const averageActivityScore =
      members.length > 0 ? Math.round(totalActivityScore / members.length) : 0;

    // Sort by activity score to find top performers and those needing support
    const sortedByActivity = [...members].sort((a, b) => {
      const scoreA = a.latestSnapshot?.activityScore ?? 0;
      const scoreB = b.latestSnapshot?.activityScore ?? 0;
      return scoreB - scoreA;
    });

    const topPerformers = sortedByActivity.slice(0, 3);
    const needsSupport = sortedByActivity
      .filter((m) => (m.latestSnapshot?.activityScore ?? 0) < 30)
      .slice(0, 3);

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      totalApplications,
      totalInterviews,
      totalOffers,
      averageActivityScore,
      topPerformers,
      needsSupport,
    };
  };

  // Load data on mount
  useEffect(() => {
    loadTeamProgress();
  }, [loadTeamProgress]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!teamStats) {
    return <Alert severity="info">No team progress data available yet.</Alert>;
  }

  return (
    <Stack spacing={3}>
      {/* Header with refresh */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Team Progress Overview</Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Team-level stats */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<PeopleIcon />}
            label="Team Members"
            value={teamStats.totalMembers}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<WorkIcon />}
            label="Total Applications"
            value={teamStats.totalApplications}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AssignmentIcon />}
            label="Total Interviews"
            value={teamStats.totalInterviews}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrophyIcon />}
            label="Total Offers"
            value={teamStats.totalOffers}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Average activity score */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Typography variant="subtitle1">Team Activity Score</Typography>
            <Typography variant="h4" color="primary">
              {teamStats.averageActivityScore}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={teamStats.averageActivityScore}
            color={
              teamStats.averageActivityScore >= 70
                ? "success"
                : teamStats.averageActivityScore >= 40
                ? "warning"
                : "error"
            }
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {teamStats.activeMembers} of {teamStats.totalMembers} members active
            this period
          </Typography>
        </CardContent>
      </Card>

      {/* Two-column layout for leaderboard and achievements */}
      <Grid container spacing={3}>
        {/* Top performers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <TrophyIcon color="warning" />
              <Typography variant="subtitle1">Top Performers</Typography>
            </Stack>
            <Stack spacing={2}>
              {teamStats.topPerformers.map((member, index) => (
                <MemberCard
                  key={member.userId}
                  member={member}
                  rank={index + 1}
                  onClick={
                    onMemberClick
                      ? () => onMemberClick(member.userId)
                      : undefined
                  }
                />
              ))}
              {teamStats.topPerformers.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No progress data available yet.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent achievements */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <CelebrationIcon color="success" />
              <Typography variant="subtitle1">Recent Achievements</Typography>
            </Stack>
            <Stack spacing={1} divider={<Divider />}>
              {recentAchievements.map((achievement) => {
                // Find the member who earned this achievement
                const member = memberProgress.find((m) =>
                  m.recentAchievements.some((a) => a.id === achievement.id)
                );

                return (
                  <Box key={achievement.id} py={1}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        src={member?.userAvatar}
                        sx={{ width: 32, height: 32, bgcolor: "success.main" }}
                      >
                        {member?.userName?.[0]?.toUpperCase() || "?"}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2">
                          <strong>{member?.userName || "Team member"}</strong>{" "}
                          {achievement.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(achievement.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <CelebrationIcon color="success" fontSize="small" />
                    </Stack>
                  </Box>
                );
              })}
              {recentAchievements.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No achievements yet. Keep going, team!
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Members needing support */}
      {teamStats.needsSupport.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <PeopleIcon color="warning" />
            <Typography variant="subtitle1">May Need Support</Typography>
          </Stack>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              These team members have lower activity scores and might benefit
              from additional mentoring or encouragement.
            </Typography>
          </Alert>
          <Grid container spacing={2}>
            {teamStats.needsSupport.map((member) => (
              <Grid key={member.userId} size={{ xs: 12, sm: 6, md: 4 }}>
                <MemberCard
                  member={member}
                  onClick={
                    onMemberClick
                      ? () => onMemberClick(member.userId)
                      : undefined
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* All members leaderboard */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" mb={2}>
          All Team Members
        </Typography>
        <Stack spacing={2}>
          {memberProgress
            .sort((a, b) => {
              const scoreA = a.latestSnapshot?.activityScore ?? 0;
              const scoreB = b.latestSnapshot?.activityScore ?? 0;
              return scoreB - scoreA;
            })
            .map((member, index) => (
              <MemberCard
                key={member.userId}
                member={member}
                rank={index + 1}
                onClick={
                  onMemberClick ? () => onMemberClick(member.userId) : undefined
                }
              />
            ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
