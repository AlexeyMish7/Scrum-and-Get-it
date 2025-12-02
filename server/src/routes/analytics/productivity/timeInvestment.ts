/**
 * TIME INVESTMENT & PRODUCTIVITY ANALYTICS (AI + USER DATA)
 *
 * POST /api/analytics/productivity/time-investment
 *
 * Summary: As a user, I want to analyze how I spend time on job search
 * activities so I can optimize my productivity.
 *
 * Acceptance Criteria mapping:
 *  1. Track time spent on different job search activities
 *      → timeByActivity
 *  2. Analyze productivity patterns and optimal working schedules
 *      → schedulePatterns (byHour, byWeekday, bestHours)
 *  3. Monitor task completion rates and efficiency improvements
 *      → efficiencyMetrics
 *  4. Compare time investment with outcome generation and success rates
 *      → outcomesByActivity (outcomesPerHour, successRate)
 *  5. Generate recommendations for time allocation optimization
 *      → aiRecommendations.timeAllocation
 *  6. Include burnout prevention and work-life balance monitoring
 *      → wellness (burnoutRisk, avgEnergy)
 *      → aiRecommendations.burnoutPrevention
 *  7. Track energy levels and performance correlation patterns
 *      → energyCorrelation
 *  8. Provide productivity coaching and efficiency improvement suggestions
 *      → aiRecommendations.coaching
 */

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../../../utils/http.js";
import { requireAuth } from "../../../middleware/auth.js";
import supabaseAdmin from "../../../services/supabaseAdmin.js";
import aiClient from "../../../services/aiClient.js";

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

interface ApiResponseBody {
  success: boolean;
  data?: TimeInvestmentPayload;
  error?: string;
}

interface TimeInvestmentRequestBody {
  daysBack?: number;
}

export async function handleTimeInvestmentAnalytics(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const userId = await requireAuth(req);

    let body: TimeInvestmentRequestBody = {};
    try {
      body = ((await readJson(req)) || {}) as TimeInvestmentRequestBody;
    } catch {
      body = {};
    }

    const daysBack = body.daysBack ?? 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    if (!supabaseAdmin) {
      return sendJson(res, 500, {
        success: false,
        error: "Supabase not configured for time analytics",
      });
    }

    // Load time entries for this user
    const { data: rows, error } = await supabaseAdmin
      .from("job_time_entries")
      .select(
        "activity_type, duration_minutes, energy_level, outcome_type, created_at"
      )
      .eq("user_id", userId)
      .gte("created_at", sinceDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[timeInvestment] DB error:", error);
      return sendJson(res, 500, {
        success: false,
        error: "Failed to load time tracking data",
      });
    }

    const entries = (rows || []) as any[];

    // If no data, return empty payload
    if (entries.length === 0) {
      const emptyPayload: TimeInvestmentPayload = {
        timeByActivity: [],
        outcomesByActivity: [],
        schedulePatterns: {
          byHour: [],
          byWeekday: [],
          bestHours: [],
          bestWeekdays: [],
        },
        wellness: {
          avgEnergyLevel: null,
          highEnergyShare: null,
          lowEnergyShare: null,
          burnoutRisk: "low",
        },
        energyCorrelation: {
          description:
            "No time tracking data yet. Once you log focused sessions, we'll show how energy levels relate to your outcomes.",
        },
        efficiencyMetrics: [],
        aiRecommendations: {
          timeAllocation: [],
          burnoutPrevention: [],
          coaching: [],
        },
      };

      return sendJson(res, 200, {
        success: true,
        data: emptyPayload,
      });
    }

    // Aggregate time by activity
    const activityMap: Record<
      string,
      { minutes: number; sessions: number }
    > = {};
    const outcomeMap: Record<
      string,
      { minutes: number; outcomes: number; success: number }
    > = {};

    // For schedule patterns
    const byHourMap: Record<number, number> = {};
    const byWeekdayMap: Record<number, number> = {};

    // For wellness
    let energySum = 0;
    let energyCount = 0;
    let highEnergyCount = 0;
    let lowEnergyCount = 0;

    for (const row of entries) {
      const activity = row.activity_type || "Other";
      const minutes = Number(row.duration_minutes) || 0;
      if (!activityMap[activity]) {
        activityMap[activity] = { minutes: 0, sessions: 0 };
      }
      activityMap[activity].minutes += minutes;
      activityMap[activity].sessions += 1;

      const outcomeType: string | null = row.outcome_type || null;
      const isSuccess =
        outcomeType === "offer" ||
        outcomeType === "interview" ||
        outcomeType === "referral";

      if (!outcomeMap[activity]) {
        outcomeMap[activity] = { minutes: 0, outcomes: 0, success: 0 };
      }
      outcomeMap[activity].minutes += minutes;
      if (outcomeType) {
        outcomeMap[activity].outcomes += 1;
        if (isSuccess) outcomeMap[activity].success += 1;
      }

      const createdAt = new Date(row.created_at);
      const hour = createdAt.getHours();
      const weekday = createdAt.getDay();
      byHourMap[hour] = (byHourMap[hour] || 0) + minutes;
      byWeekdayMap[weekday] = (byWeekdayMap[weekday] || 0) + minutes;

      const energy = row.energy_level;
      if (typeof energy === "number") {
        energySum += energy;
        energyCount += 1;
        if (energy >= 4) highEnergyCount += 1;
        if (energy <= 2) lowEnergyCount += 1;
      }
    }

    const timeByActivity: TimeActivityStats[] = Object.entries(activityMap)
      .map(([activityType, v]) => ({
        activityType,
        totalMinutes: v.minutes,
        sessionCount: v.sessions,
        avgMinutesPerSession: v.sessions ? v.minutes / v.sessions : 0,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    const outcomesByActivity: OutcomeStats[] = Object.entries(outcomeMap)
      .map(([activityType, v]) => {
        const hours = v.minutes / 60 || 1;
        return {
          activityType,
          totalMinutes: v.minutes,
          outcomeCount: v.outcomes,
          successCount: v.success,
          outcomesPerHour: v.outcomes / hours,
          successRate: v.outcomes ? v.success / v.outcomes : 0,
        };
      })
      .sort((a, b) => b.outcomesPerHour - a.outcomesPerHour);

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      minutes: byHourMap[h] || 0,
    }));
    const byWeekday = Array.from({ length: 7 }, (_, d) => ({
      weekday: d,
      minutes: byWeekdayMap[d] || 0,
    }));

    const bestHours = [...byHour]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3)
      .map((x) => x.hour)
      .filter((h) => byHourMap[h] > 0);

    const bestWeekdays = [...byWeekday]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 2)
      .map((x) => x.weekday)
      .filter((d) => byWeekdayMap[d] > 0);

    const avgEnergy =
      energyCount > 0 ? Number((energySum / energyCount).toFixed(2)) : null;
    const highShare = energyCount > 0 ? highEnergyCount / energyCount : null;
    const lowShare = energyCount > 0 ? lowEnergyCount / energyCount : null;

    let burnoutRisk: WellnessStats["burnoutRisk"] = "low";
    if (lowShare !== null && lowShare > 0.4) {
      burnoutRisk = "high";
    } else if (lowShare !== null && lowShare > 0.25) {
      burnoutRisk = "medium";
    }

    const wellness: WellnessStats = {
      avgEnergyLevel: avgEnergy,
      highEnergyShare: highShare,
      lowEnergyShare: lowShare,
      burnoutRisk,
    };

    const energyCorrelation: EnergyCorrelation = {
      description:
        avgEnergy === null
          ? "Not enough energy data to correlate energy and performance yet."
          : "We can compare high-/low-energy sessions against outcomes to see when you perform best.",
    };

    // Simple efficiency metrics
    const totalMinutes = entries.reduce(
      (sum, r) => sum + (Number(r.duration_minutes) || 0),
      0
    );
    const totalHours = totalMinutes / 60 || 1;
    const totalApplicationsActivity = outcomesByActivity.find(
      (o) =>
        o.activityType === "Applications" || o.activityType === "applications"
    );
    const appsPerHour =
      totalApplicationsActivity?.outcomeCount &&
      totalApplicationsActivity.totalMinutes
        ? totalApplicationsActivity.outcomeCount /
          (totalApplicationsActivity.totalMinutes / 60)
        : 0;

    const efficiencyMetrics: EfficiencyMetric[] = [
      {
        label: "Total focused hours",
        value: Number(totalHours.toFixed(1)),
        unit: "hrs",
        explanation: `Total time logged on job search activities in the last ${daysBack} days.`,
      },
    ];

    if (appsPerHour > 0) {
      efficiencyMetrics.push({
        label: "Applications per focused hour",
        value: Number(appsPerHour.toFixed(2)),
        unit: "apps/hr",
        explanation: "How many applications you typically complete per hour.",
      });
    }

    const prompt = buildAiPrompt({
      daysBack,
      timeByActivity,
      outcomesByActivity,
      schedulePatterns: {
        byHour,
        byWeekday,
        bestHours,
        bestWeekdays,
      },
      wellness,
      efficiencyMetrics,
    });

    const aiResult = await aiClient.generate("time_investment", prompt);

    let aiRecs: AIRecommendations = {
      timeAllocation: [],
      burnoutPrevention: [],
      coaching: [],
    };

    if (aiResult?.json) {
      aiRecs = aiResult.json as AIRecommendations;
    } else if (typeof aiResult?.text === "string") {
      aiRecs = JSON.parse(aiResult.text) as AIRecommendations;
    }

    const payload: TimeInvestmentPayload = {
      timeByActivity,
      outcomesByActivity,
      schedulePatterns: {
        byHour,
        byWeekday,
        bestHours,
        bestWeekdays,
      },
      wellness,
      energyCorrelation,
      efficiencyMetrics,
      aiRecommendations: aiRecs,
    };

    return sendJson(res, 200, {
      success: true,
      data: payload,
    });
  } catch (err: any) {
    console.error("[timeInvestment] Unexpected error:", err);
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Unexpected server error",
    });
  }
}

function buildAiPrompt(args: {
  daysBack: number;
  timeByActivity: TimeActivityStats[];
  outcomesByActivity: OutcomeStats[];
  schedulePatterns: SchedulePatterns;
  wellness: WellnessStats;
  efficiencyMetrics: EfficiencyMetric[];
}): string {
  const {
    daysBack,
    timeByActivity,
    outcomesByActivity,
    schedulePatterns,
    wellness,
  } = args;

  const activityLines = timeByActivity
    .map(
      (a) =>
        `- ${a.activityType}: ${a.totalMinutes} minutes across ${a.sessionCount} sessions`
    )
    .join("\n");

  const outcomeLines = outcomesByActivity
    .map(
      (o) =>
        `- ${o.activityType}: ${o.outcomeCount} outcomes (${(
          o.outcomesPerHour || 0
        ).toFixed(2)} outcomes/hr, success rate ${(o.successRate * 100).toFixed(
          0
        )}%)`
    )
    .join("\n");

  const bestHoursLabel =
    schedulePatterns.bestHours.length > 0
      ? schedulePatterns.bestHours.join(", ")
      : "none yet";
  const bestDaysLabel =
    schedulePatterns.bestWeekdays.length > 0
      ? schedulePatterns.bestWeekdays.join(", ")
      : "none yet";

  return `
You are a productivity coach and behavioral scientist for job seekers.

You are given structured time-tracking analytics for the last ${daysBack} days.

Time by activity:
${activityLines || "- (no entries)"}

Outcomes by activity (used to compute efficiency/success):
${outcomeLines || "- (no outcome data)"}

Best hours (by time investment): ${bestHoursLabel}
Best weekdays (by time investment): ${bestDaysLabel}

Wellness:
- Average energy level (1–5): ${wellness.avgEnergyLevel ?? "unknown"}
- High energy share: ${wellness.highEnergyShare ?? "unknown"}
- Low energy share: ${wellness.lowEnergyShare ?? "unknown"}
- Burnout risk signal: ${wellness.burnoutRisk}

TASK:
Using this data, generate targeted recommendations that satisfy:

1) Time allocation optimization
2) Burnout prevention & work-life balance
3) Productivity coaching & efficiency improvement

Respond as STRICT JSON with this exact shape:

{
  "timeAllocation": ["string", "..."],
  "burnoutPrevention": ["string", "..."],
  "coaching": ["string", "..."]
}

Each array should have 3–6 concise, concrete suggestions.
Return ONLY JSON, no backticks, no comments.
`;
}
