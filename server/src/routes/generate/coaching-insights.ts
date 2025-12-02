/**
 * AI COACHING INSIGHTS GENERATION (UC-109)
 *
 * POST /api/generate/coaching-insights
 *
 * Generates personalized coaching recommendations based on mentee progress data.
 * Returns actionable insights for mentors to help their mentees succeed.
 *
 * Request body:
 *   - menteeData: Object with job stats, engagement level, goals, activity
 *   - teamContext: Optional context about the team/program
 *
 * Response:
 *   - summary: Brief overall assessment
 *   - recommendations: Array of actionable coaching recommendations
 *   - focusAreas: Key areas needing attention
 *   - strengthAreas: Areas where mentee is performing well
 *   - suggestedGoals: Recommended goals for the mentee
 *   - actionPlan: Week-by-week suggested action items
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { generate } from "../../services/aiClient.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MenteeJobStats {
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
}

interface MenteeGoal {
  title: string;
  goalType: string;
  status: "active" | "completed" | "missed" | "cancelled";
  targetValue?: number;
  currentValue?: number;
  dueDate?: string;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface MenteeData {
  name: string;
  jobStats: MenteeJobStats;
  engagementLevel: "high" | "medium" | "low" | "inactive";
  lastActiveAt?: string;
  goals?: MenteeGoal[];
  recentActivity?: ActivityItem[];
  documentsCount?: number;
}

interface RequestBody {
  menteeData: MenteeData;
  teamContext?: string;
  focusArea?:
    | "applications"
    | "interviews"
    | "engagement"
    | "goals"
    | "general";
}

interface CoachingInsight {
  summary: string;
  recommendations: string[];
  focusAreas: Array<{
    area: string;
    priority: "high" | "medium" | "low";
    suggestion: string;
  }>;
  strengthAreas: string[];
  suggestedGoals: Array<{
    title: string;
    type: string;
    reason: string;
  }>;
  actionPlan: Array<{
    week: number;
    actions: string[];
  }>;
  motivationalNote: string;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildCoachingPrompt(body: RequestBody): string {
  const { menteeData, teamContext, focusArea } = body;

  // Build context about the mentee
  const statsContext = `
Job Search Stats:
- Total Applications: ${menteeData.jobStats.total}
- Applied/Interested: ${menteeData.jobStats.applied}
- Interviewing: ${menteeData.jobStats.interviewing}
- Offers: ${menteeData.jobStats.offers}
- Rejected: ${menteeData.jobStats.rejected}`;

  const conversionRate =
    menteeData.jobStats.total > 0
      ? Math.round(
          (menteeData.jobStats.interviewing / menteeData.jobStats.total) * 100
        )
      : 0;

  const offerRate =
    menteeData.jobStats.interviewing > 0
      ? Math.round(
          (menteeData.jobStats.offers / menteeData.jobStats.interviewing) * 100
        )
      : 0;

  const goalsContext =
    menteeData.goals && menteeData.goals.length > 0
      ? `\nCurrent Goals:\n${menteeData.goals
          .map(
            (g) =>
              `- ${g.title} (${g.status})${
                g.targetValue
                  ? ` - Target: ${g.targetValue}, Current: ${
                      g.currentValue || 0
                    }`
                  : ""
              }`
          )
          .join("\n")}`
      : "\nNo active goals set.";

  const activityContext =
    menteeData.recentActivity && menteeData.recentActivity.length > 0
      ? `\nRecent Activity (last ${
          menteeData.recentActivity.length
        } items):\n${menteeData.recentActivity
          .slice(0, 5)
          .map((a) => `- ${a.type}: ${a.description}`)
          .join("\n")}`
      : "\nNo recent activity recorded.";

  const focusAreaInstruction =
    focusArea && focusArea !== "general"
      ? `Focus your analysis particularly on ${focusArea} as this is the mentor's current concern.`
      : "";

  return `You are an expert career coaching advisor helping mentors support their mentees in job searches.

Analyze the following mentee data and provide actionable coaching insights:

Mentee: ${menteeData.name}
Engagement Level: ${menteeData.engagementLevel}
Last Active: ${
    menteeData.lastActiveAt
      ? new Date(menteeData.lastActiveAt).toLocaleDateString()
      : "Unknown"
  }
${statsContext}

Conversion Metrics:
- Application to Interview Rate: ${conversionRate}%
- Interview to Offer Rate: ${offerRate}%
${goalsContext}
${activityContext}

${teamContext ? `Team Context: ${teamContext}` : ""}
${focusAreaInstruction}

Based on this data, provide coaching insights in the following JSON format:

{
  "summary": "A 2-3 sentence overall assessment of the mentee's job search progress and current state",
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3",
    "Specific actionable recommendation 4"
  ],
  "focusAreas": [
    {
      "area": "Area needing attention",
      "priority": "high|medium|low",
      "suggestion": "Specific suggestion for improvement"
    }
  ],
  "strengthAreas": [
    "Area where mentee is doing well"
  ],
  "suggestedGoals": [
    {
      "title": "Specific goal title",
      "type": "weekly_applications|interview_prep|networking|skill_development",
      "reason": "Why this goal would help"
    }
  ],
  "actionPlan": [
    {
      "week": 1,
      "actions": ["Action item 1", "Action item 2"]
    },
    {
      "week": 2,
      "actions": ["Action item 1", "Action item 2"]
    }
  ],
  "motivationalNote": "An encouraging message tailored to their situation"
}

Return ONLY valid JSON. Be specific, actionable, and encouraging. Consider industry best practices for job searching.`;
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limiting - 30 requests per minute for coaching insights
  const limit = checkLimit(`coaching_insights:${userId}`, 30, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(
      429,
      "Rate limited - please wait before generating more insights",
      "rate_limited"
    );
  }

  // Parse request body
  let body: RequestBody;
  try {
    body = (await readJson(req)) as RequestBody;
  } catch (e: unknown) {
    throw new ApiError(400, "Invalid JSON body", "bad_json");
  }

  // Validate required fields
  if (!body.menteeData) {
    throw new ApiError(400, "menteeData is required", "missing_field");
  }

  if (!body.menteeData.name || !body.menteeData.jobStats) {
    throw new ApiError(
      400,
      "menteeData must include name and jobStats",
      "missing_field"
    );
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildCoachingPrompt(body);

    const aiResult = await generate("coaching_insights", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.5,
      maxTokens: 1500,
      timeoutMs: 30000,
    });

    // Parse the AI response
    let insights: CoachingInsight | null = null;

    if (aiResult.json && typeof aiResult.json === "object") {
      insights = parseInsightsResponse(aiResult.json);
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        insights = parseInsightsResponse(parsed);
      } catch {
        // If parsing fails, create a basic response
        insights = {
          summary: "Unable to generate detailed insights at this time.",
          recommendations: [
            "Continue tracking applications",
            "Set weekly goals",
            "Stay consistent with your job search",
          ],
          focusAreas: [],
          strengthAreas: [],
          suggestedGoals: [],
          actionPlan: [],
          motivationalNote:
            "Keep up the great work! Consistency is key in a job search.",
        };
      }
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("coaching_insights_generate_success", { userId, reqId, latencyMs });

    sendJson(res, 200, {
      ...insights,
      meta: {
        latency_ms: latencyMs,
        mentee_name: body.menteeData.name,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logError("coaching_insights_generate_error", {
      userId,
      reqId,
      error: errorMessage,
      latencyMs,
    });
    throw new ApiError(502, errorMessage || "AI generation failed", "ai_error");
  }
}

/**
 * Parse and validate the AI response into our expected format
 */
function parseInsightsResponse(raw: unknown): CoachingInsight {
  const data = raw as Record<string, unknown>;

  return {
    summary:
      typeof data.summary === "string" ? data.summary : "Analysis complete.",
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.filter((r): r is string => typeof r === "string")
      : [],
    focusAreas: Array.isArray(data.focusAreas)
      ? data.focusAreas.map((f: unknown) => {
          const item = f as Record<string, unknown>;
          return {
            area: typeof item.area === "string" ? item.area : "Unknown",
            priority:
              item.priority === "high" ||
              item.priority === "medium" ||
              item.priority === "low"
                ? item.priority
                : "medium",
            suggestion:
              typeof item.suggestion === "string" ? item.suggestion : "",
          };
        })
      : [],
    strengthAreas: Array.isArray(data.strengthAreas)
      ? data.strengthAreas.filter((s): s is string => typeof s === "string")
      : [],
    suggestedGoals: Array.isArray(data.suggestedGoals)
      ? data.suggestedGoals.map((g: unknown) => {
          const item = g as Record<string, unknown>;
          return {
            title: typeof item.title === "string" ? item.title : "",
            type: typeof item.type === "string" ? item.type : "custom",
            reason: typeof item.reason === "string" ? item.reason : "",
          };
        })
      : [],
    actionPlan: Array.isArray(data.actionPlan)
      ? data.actionPlan.map((p: unknown) => {
          const item = p as Record<string, unknown>;
          return {
            week: typeof item.week === "number" ? item.week : 1,
            actions: Array.isArray(item.actions)
              ? item.actions.filter((a): a is string => typeof a === "string")
              : [],
          };
        })
      : [],
    motivationalNote:
      typeof data.motivationalNote === "string"
        ? data.motivationalNote
        : "Keep pushing forward! Every step brings you closer to your goal.",
  };
}
