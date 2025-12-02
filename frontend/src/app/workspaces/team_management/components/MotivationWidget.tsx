/**
 * MOTIVATION WIDGET COMPONENT (UC-111)
 *
 * Displays motivational content including:
 * - Daily inspirational quote
 * - Activity streak counter
 * - Weekly goal progress
 * - Upcoming milestone
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FormatQuote as QuoteIcon,
  Whatshot as FireIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  Favorite as HeartIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as motivationService from "../services/motivationService";
import type { MotivationWidgetData } from "../services/motivationService";

// ============================================================================
// TYPES
// ============================================================================

interface MotivationWidgetProps {
  variant?: "full" | "compact" | "quote-only";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MotivationWidget({ variant = "full" }: MotivationWidgetProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const [data, setData] = useState<MotivationWidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMotivationData() {
      if (!user?.id || !currentTeam?.id) {
        // Still show quote without user data
        setData({
          quote: motivationService.getDailyQuote(),
          streak: {
            userId: "",
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: new Date().toISOString(),
            streakStartDate: new Date().toISOString(),
            totalActiveDays: 0,
            thisWeekActiveDays: 0,
            thisMonthActiveDays: 0,
          },
          weeklyGoalProgress: 0,
          encouragementsReceived: 0,
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await motivationService.getMotivationWidgetData(
          user.id,
          currentTeam.id
        );

        if (result.error) {
          // Fallback to just quote
          setData({
            quote: motivationService.getDailyQuote(),
            streak: {
              userId: user.id,
              currentStreak: 0,
              longestStreak: 0,
              lastActivityDate: new Date().toISOString(),
              streakStartDate: new Date().toISOString(),
              totalActiveDays: 0,
              thisWeekActiveDays: 0,
              thisMonthActiveDays: 0,
            },
            weeklyGoalProgress: 0,
            encouragementsReceived: 0,
          });
        } else {
          setData(result.data);
        }
      } catch {
        // Silently fall back to just quote on error
        setData({
          quote: motivationService.getDailyQuote(),
          streak: {
            userId: user?.id || "",
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: new Date().toISOString(),
            streakStartDate: new Date().toISOString(),
            totalActiveDays: 0,
            thisWeekActiveDays: 0,
            thisMonthActiveDays: 0,
          },
          weeklyGoalProgress: 0,
          encouragementsReceived: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadMotivationData();
  }, [user?.id, currentTeam?.id]);

  function handleRefreshQuote() {
    if (data) {
      const quotes = motivationService.getRandomQuotes(1);
      setData({ ...data, quote: quotes[0] });
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  // Quote only variant
  if (variant === "quote-only") {
    return (
      <Paper
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Stack spacing={2}>
          <QuoteIcon sx={{ fontSize: 32, opacity: 0.8 }} />
          <Typography variant="body1" fontStyle="italic">
            "{data.quote.text}"
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            — {data.quote.author}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack spacing={2}>
            {/* Quote */}
            <Box>
              <Typography
                variant="body2"
                fontStyle="italic"
                color="text.secondary"
              >
                "{data.quote.text.slice(0, 80)}..."
              </Typography>
            </Box>

            {/* Streak and Goal */}
            <Stack direction="row" spacing={2}>
              {data.streak.currentStreak > 0 && (
                <Chip
                  icon={<FireIcon />}
                  label={`${data.streak.currentStreak} day streak`}
                  size="small"
                  color="warning"
                />
              )}
              {data.encouragementsReceived > 0 && (
                <Chip
                  icon={<HeartIcon />}
                  label={`${data.encouragementsReceived}`}
                  size="small"
                  color="error"
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Daily Quote Section */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            position: "relative",
          }}
        >
          <IconButton
            size="small"
            onClick={handleRefreshQuote}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "rgba(255,255,255,0.7)",
              "&:hover": { color: "white" },
            }}
          >
            <Tooltip title="New quote">
              <RefreshIcon fontSize="small" />
            </Tooltip>
          </IconButton>

          <Stack spacing={2}>
            <QuoteIcon sx={{ fontSize: 32, opacity: 0.8 }} />
            <Typography variant="h6" fontStyle="italic">
              "{data.quote.text}"
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              — {data.quote.author}
            </Typography>
          </Stack>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {/* Streak */}
          <Card variant="outlined" sx={{ flex: 1, minWidth: 140 }}>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <FireIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {data.streak.currentStreak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Day Streak
              </Typography>
              {data.streak.longestStreak > data.streak.currentStreak && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  Best: {data.streak.longestStreak} days
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Weekly Goal */}
          <Card variant="outlined" sx={{ flex: 1, minWidth: 140 }}>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <FlagIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {Math.round(data.weeklyGoalProgress)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Weekly Goal
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.weeklyGoalProgress}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>

          {/* Encouragements */}
          <Card variant="outlined" sx={{ flex: 1, minWidth: 140 }}>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <HeartIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {data.encouragementsReceived}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Encouragements
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Upcoming Milestone */}
        {data.upcomingMilestone && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <TrophyIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                Next Milestone
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {data.upcomingMilestone.target} Applications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.upcomingMilestone.current} /{" "}
                  {data.upcomingMilestone.target}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={
                  (data.upcomingMilestone.current /
                    data.upcomingMilestone.target) *
                  100
                }
                sx={{ height: 8, borderRadius: 4 }}
                color="warning"
              />
            </Stack>
          </Box>
        )}

        {/* Activity This Week */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            {data.streak.thisWeekActiveDays} active days this week •{" "}
            {data.streak.thisMonthActiveDays} this month •{" "}
            {data.streak.totalActiveDays} total
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default MotivationWidget;
