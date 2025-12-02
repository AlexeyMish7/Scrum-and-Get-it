/**
 * TIME INVESTMENT & PRODUCTIVITY CARD
 * 
 * AI + time tracking analytics showing 8 explicit acceptance criteria:
 * 1. Track time spent on different job search activities
 * 2. Analyze productivity patterns and optimal working schedules
 * 3. Monitor task completion rates and efficiency improvements
 * 4. Compare time investment with outcome generation and success rates
 * 5. Generate recommendations for time allocation optimization
 * 6. Include burnout prevention and work-life balance monitoring
 * 7. Track energy levels and performance correlation patterns
 * 8. Provide productivity coaching and efficiency improvement suggestions
 * 
 * Backend: POST /api/analytics/productivity/time-investment (AI + user time logs)
 */

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  Psychology as AIIcon,
  TrendingUp as TrendIcon,
  TaskAlt as TaskIcon,
  FavoriteBorder as WellnessIcon,
  Bolt as EnergyIcon,
  TipsAndUpdates as CoachingIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";

interface TimeActivityStats {
  activityType: string;
  totalMinutes: number;
  sessionCount: number;
  avgMinutesPerSession: number;
}

interface OutcomeStats {
  activityType: string;
  totalMinutes: number;
  outcomeCount: number;
  successCount: number;
  outcomesPerHour: number;
  successRate: number;
}

interface SchedulePatterns {
  byHour: { hour: number; minutes: number }[];
  byWeekday: { weekday: number; minutes: number }[];
  bestHours: number[];
  bestWeekdays: number[];
}

interface WellnessStats {
  avgEnergyLevel: number | null;
  highEnergyShare: number | null;
  lowEnergyShare: number | null;
  burnoutRisk: "low" | "medium" | "high";
}

interface EnergyCorrelation {
  description: string;
}

interface EfficiencyMetric {
  label: string;
  value: number;
  unit: string;
  explanation: string;
}

interface AIRecommendations {
  timeAllocation: string[];
  burnoutPrevention: string[];
  coaching: string[];
}

interface TimeInvestmentPayload {
  timeByActivity: TimeActivityStats[];
  outcomesByActivity: OutcomeStats[];
  schedulePatterns: SchedulePatterns;
  wellness: WellnessStats;
  energyCorrelation: EnergyCorrelation;
  efficiencyMetrics: EfficiencyMetric[];
  aiRecommendations: AIRecommendations;
}

interface ApiResponse {
  success: boolean;
  data?: TimeInvestmentPayload;
  error?: string;
}

interface Props {
  daysBack?: number;
}

export default function TimeInvestmentCard({ daysBack = 30 }: Props) {
  const { session } = useAuth();
  const [data, setData] = useState<TimeInvestmentPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "http://localhost:8787/api/analytics/productivity/time-investment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ daysBack }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as ApiResponse;
      if (!json.success || !json.data) {
        throw new Error(json.error || "Failed to load time analytics");
      }

      setData(json.data);
    } catch (err: any) {
      console.error("[TimeInvestmentCard] error:", err);
      setError(
        err?.message ||
          "Failed to load time investment analytics. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, daysBack]);

  const totalMinutes =
    data?.timeByActivity.reduce((sum, a) => sum + a.totalMinutes, 0) || 0;
  const totalHours = totalMinutes / 60;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <TimeIcon />
        <Typography variant="h6" fontWeight={600}>
          Time Investment & Productivity
        </Typography>
        <Chip
          icon={<AIIcon fontSize="small" />}
          label="AI + Time Tracking"
          size="small"
          color="primary"
          variant="outlined"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" onClick={loadData} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Analyze how you spend time on job search activities, powered by your
        logged sessions and AI productivity coaching.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && data && data.timeByActivity.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No time tracking data yet. Log focused job search sessions to unlock
          productivity insights.
        </Alert>
      )}

      {data && data.timeByActivity.length > 0 && (
        <Box>
          <Grid container spacing={2}>
            {/* 1. Track time spent on different activities */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TimeIcon fontSize="small" />}
                title="1. Time by Activity"
                subtitle="Where your job search time actually goes"
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Total focused time (last {daysBack} days):{" "}
                <strong>{totalHours.toFixed(1)} hrs</strong>
              </Typography>

              <Stack spacing={0.75}>
                {data.timeByActivity.map((a) => {
                  const pct =
                    totalMinutes > 0
                      ? (a.totalMinutes / totalMinutes) * 100
                      : 0;
                  return (
                    <Box key={a.activityType}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {a.activityType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(a.totalMinutes)} min ·{" "}
                          {Math.round(pct)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 6, borderRadius: 1, mt: 0.25 }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {a.sessionCount} sessions · avg{" "}
                        {a.avgMinutesPerSession.toFixed(1)} min/session
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Grid>

            {/* 2. Productivity patterns & optimal schedule */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TrendIcon fontSize="small" />}
                title="2. Productivity Patterns & Optimal Schedule"
                subtitle="When your effort tends to be most focused"
              />
              <Divider sx={{ my: 1 }} />

              <Stack spacing={0.75}>
                <Typography variant="subtitle2">Best hours</Typography>
                {data.schedulePatterns.bestHours.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Not enough data yet to highlight productive hours.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {data.schedulePatterns.bestHours.map((h) => (
                      <Chip
                        key={h}
                        size="small"
                        label={`${h.toString().padStart(2, "0")}:00`}
                      />
                    ))}
                  </Box>
                )}

                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Best days
                </Typography>
                {data.schedulePatterns.bestWeekdays.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Not enough data yet to highlight best weekdays.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {data.schedulePatterns.bestWeekdays.map((d) => (
                      <Chip
                        key={d}
                        size="small"
                        label={weekdayName(d)}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* 3. Task completion & efficiency */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TaskIcon fontSize="small" />}
                title="3. Completion & Efficiency"
                subtitle="How much you get done in focused time"
              />
              <Divider sx={{ my: 1 }} />

              {data.efficiencyMetrics.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Not enough outcome data yet to calculate efficiency metrics.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {data.efficiencyMetrics.map((m, idx) => (
                    <Box key={idx}>
                      <Typography variant="body2" fontWeight={600}>
                        {m.label}: {m.value} {m.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.explanation}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* 4. Time vs outcomes */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TrendIcon fontSize="small" />}
                title="4. Time vs Outcomes"
                subtitle="Which activities convert time into results"
              />
              <Divider sx={{ my: 1 }} />
              {data.outcomesByActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No outcome data linked to your time entries yet.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {data.outcomesByActivity.map((o) => (
                    <Box key={o.activityType}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {o.activityType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.outcomeCount} outcomes · success rate{" "}
                          {(o.successRate * 100).toFixed(0)}%
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {o.outcomesPerHour.toFixed(2)} outcomes/hr from{" "}
                        {(o.totalMinutes / 60).toFixed(1)} hrs invested.
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* 5 + 6 + 7: wellness, energy */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<WellnessIcon fontSize="small" />}
                title="6. Burnout & Work–Life Balance"
                subtitle="Signals from your energy and workload"
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                Average energy level:{" "}
                <strong>
                  {data.wellness.avgEnergyLevel ?? "not enough data"}
                </strong>
              </Typography>
              <Typography variant="body2">
                Burnout risk:{" "}
                <Chip
                  size="small"
                  label={data.wellness.burnoutRisk.toUpperCase()}
                  color={
                    data.wellness.burnoutRisk === "high"
                      ? "error"
                      : data.wellness.burnoutRisk === "medium"
                      ? "warning"
                      : "success"
                  }
                  sx={{ ml: 0.5 }}
                />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High-/low-energy share helps monitor whether you might be
                overworking or consistently drained.
              </Typography>

              <Box sx={{ mt: 1.5 }}>
                <SectionHeader
                  icon={<EnergyIcon fontSize="small" />}
                  title="7. Energy & Performance Correlation"
                />
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {data.energyCorrelation.description}
                </Typography>
              </Box>
            </Grid>

            {/* 5 + 8: AI recommendations */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<CoachingIcon fontSize="small" />}
                title="5 & 8. Time Coaching & Recommendations"
                subtitle="How to allocate time and improve efficiency"
              />
              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2">
                Time allocation optimization
              </Typography>
              <BulletList items={data.aiRecommendations.timeAllocation} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Burnout prevention & balance
              </Typography>
              <BulletList items={data.aiRecommendations.burnoutPrevention} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Productivity coaching tips
              </Typography>
              <BulletList items={data.aiRecommendations.coaching} />
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

/* ---- Small helpers ---- */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      {icon}
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No AI recommendations yet (not enough data or AI call failed).
      </Typography>
    );
  }
  return (
    <Box component="ul" sx={{ pl: 3, mt: 0.5 }}>
      {items.map((text, idx) => (
        <li key={idx}>
          <Typography variant="body2">{text}</Typography>
        </li>
      ))}
    </Box>
  );
}

function weekdayName(d: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d] ?? `Day ${d}`;
}
