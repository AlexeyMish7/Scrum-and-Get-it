/**
 * NETWORKING ANALYTICS ENDPOINT
 *
 * POST /api/analytics/networking
 *
 * Calculates comprehensive networking analytics from contact_interactions data:
 * - Activity volume (total interactions, by type, over time)
 * - Referral generation metrics (count, conversion rate, success rate)
 * - Job opportunity sourcing (opportunities created, conversion to jobs)
 * - Relationship strength trends (average, distribution, improvement rate)
 * - Event ROI (events attended, outcomes, value per event)
 * - Value exchange balance (provided vs received, reciprocity score)
 * - Engagement quality (interaction quality scores, follow-up rates)
 * - Strategic insights (best practices, recommended actions, benchmarks)
 *
 * Uses existing contact_interactions and contacts tables - no AI calls needed.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface NetworkingAnalyticsRequest {
  timeRange?: "7d" | "30d" | "90d" | "1y" | "all";
}

/**
 * Calculate comprehensive networking analytics
 */
async function calculateNetworkingAnalytics(
  userId: string,
  timeRange: string = "30d"
) {
  // Calculate date threshold based on time range
  const now = new Date();
  let dateThreshold: Date | null = null;
  
  switch (timeRange) {
    case "7d":
      dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateThreshold = null; // All time
  }

  // Fetch all contact interactions for user within time range
  let query = supabase
    .from("contact_interactions")
    .select("*")
    .eq("user_id", userId);

  if (dateThreshold) {
    query = query.gte("occurred_at", dateThreshold.toISOString());
  }

  const { data: interactions, error: interactionsError } = await query;

  if (interactionsError) {
    throw new Error(`Failed to fetch interactions: ${interactionsError.message}`);
  }

  // Fetch all contacts for relationship strength tracking
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, relationship_strength, industry, company")
    .eq("user_id", userId);

  if (contactsError) {
    throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
  }

  const totalInteractions = interactions?.length || 0;
  const totalContacts = contacts?.length || 0;

  // Activity Volume Metrics
  const interactionsByType: Record<string, number> = {};
  interactions?.forEach((int: any) => {
    const type = int.interaction_type || "Other";
    interactionsByType[type] = (interactionsByType[type] || 0) + 1;
  });

  // Referral Metrics
  const referralsGenerated = interactions?.filter((int: any) => int.referral_generated).length || 0;
  const referralRate = totalInteractions > 0 ? (referralsGenerated / totalInteractions) * 100 : 0;

  // Job Opportunity Metrics
  const jobOpportunitiesCreated = interactions?.filter((int: any) => int.job_opportunity_created).length || 0;
  const jobOpportunityRate = totalInteractions > 0 ? (jobOpportunitiesCreated / totalInteractions) * 100 : 0;

  // Relationship Strength Analysis
  const strengthScores = contacts?.map((c: any) => c.relationship_strength).filter((s: any) => s != null) || [];
  const avgRelationshipStrength = strengthScores.length > 0
    ? strengthScores.reduce((sum: number, s: number) => sum + s, 0) / strengthScores.length
    : 0;

  const strengthDistribution = {
    weak: strengthScores.filter((s: number) => s <= 3).length,
    moderate: strengthScores.filter((s: number) => s > 3 && s <= 6).length,
    strong: strengthScores.filter((s: number) => s > 6).length,
  };

  // Event ROI Analysis
  const eventsAttended = [...new Set(interactions?.filter((int: any) => int.event_name).map((int: any) => int.event_name))];
  const eventOutcomes: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
    pending: 0,
  };

  interactions?.filter((int: any) => int.event_outcome).forEach((int: any) => {
    eventOutcomes[int.event_outcome] = (eventOutcomes[int.event_outcome] || 0) + 1;
  });

  const eventROI = eventsAttended.length > 0
    ? ((jobOpportunitiesCreated + referralsGenerated) / eventsAttended.length)
    : 0;

  // Value Exchange Tracking
  const valueProvided = interactions?.filter((int: any) => int.value_provided).length || 0;
  const valueReceived = interactions?.filter((int: any) => int.value_received).length || 0;
  const reciprocityScore = valueProvided > 0 ? (valueReceived / valueProvided) : 0;

  // Engagement Quality
  const qualityScores = interactions?.map((int: any) => int.interaction_quality).filter((q: any) => q != null) || [];
  const avgInteractionQuality = qualityScores.length > 0
    ? qualityScores.reduce((sum: number, q: number) => sum + q, 0) / qualityScores.length
    : 0;

  const followUpsScheduled = interactions?.filter((int: any) => int.follow_up_scheduled).length || 0;
  const followUpRate = totalInteractions > 0 ? (followUpsScheduled / totalInteractions) * 100 : 0;

  // Industry Breakdown
  const contactsByIndustry: Record<string, number> = {};
  contacts?.forEach((c: any) => {
    if (c.industry) {
      contactsByIndustry[c.industry] = (contactsByIndustry[c.industry] || 0) + 1;
    }
  });

  // Strategic Insights & Recommendations
  const insights = [];
  const recommendations = [];

  // Generate insights based on data
  if (referralRate > 10) {
    insights.push("Your network generates referrals at an above-average rate");
  } else if (referralRate > 0) {
    insights.push("You're generating some referrals, but there's room for improvement");
    recommendations.push("Ask for introductions more frequently in your conversations");
  } else {
    recommendations.push("Start tracking referrals by following up on connections made");
  }

  if (avgRelationshipStrength > 7) {
    insights.push("Your relationships are strong - you're maintaining connections well");
  } else if (avgRelationshipStrength < 5) {
    recommendations.push("Focus on deepening existing relationships before expanding network");
  }

  if (reciprocityScore < 0.5) {
    recommendations.push("Balance giving and receiving value in your network");
    insights.push("You're providing more value than receiving - this builds goodwill");
  } else if (reciprocityScore > 1.5) {
    recommendations.push("Offer more value to your network to strengthen relationships");
  }

  if (followUpRate < 30) {
    recommendations.push("Schedule follow-ups for at least 30% of your interactions");
  }

  if (eventROI > 2) {
    insights.push("Networking events are highly productive for you");
  } else if (eventsAttended.length > 0) {
    recommendations.push("Be more strategic about which events you attend");
  }

  // Industry-specific benchmarks (mock data - in production, query across users)
  const benchmarks = {
    avgInteractionsPerMonth: 15,
    avgReferralRate: 8,
    avgRelationshipStrength: 6.5,
    avgEventROI: 1.5,
    topPerformingIndustries: Object.entries(contactsByIndustry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([industry]) => industry),
  };

  return {
    summary: {
      totalContacts,
      totalInteractions,
      referralsGenerated,
      jobOpportunitiesCreated,
      avgRelationshipStrength: Math.round(avgRelationshipStrength * 10) / 10,
      networkingROI: jobOpportunitiesCreated > 0
        ? Math.round((jobOpportunitiesCreated / totalInteractions) * 100 * 10) / 10
        : 0,
    },
    activityVolume: {
      totalInteractions,
      interactionsByType,
      interactionsPerContact: totalContacts > 0 ? Math.round((totalInteractions / totalContacts) * 10) / 10 : 0,
    },
    referrals: {
      total: referralsGenerated,
      rate: Math.round(referralRate * 10) / 10,
    },
    jobOpportunities: {
      total: jobOpportunitiesCreated,
      rate: Math.round(jobOpportunityRate * 10) / 10,
      conversionRate: referralsGenerated > 0
        ? Math.round((jobOpportunitiesCreated / referralsGenerated) * 100 * 10) / 10
        : 0,
    },
    relationshipStrength: {
      average: Math.round(avgRelationshipStrength * 10) / 10,
      distribution: strengthDistribution,
      totalTracked: strengthScores.length,
    },
    events: {
      attended: eventsAttended.length,
      outcomes: eventOutcomes,
      roi: Math.round(eventROI * 10) / 10,
      eventNames: eventsAttended.slice(0, 10),
    },
    valueExchange: {
      provided: valueProvided,
      received: valueReceived,
      reciprocityScore: Math.round(reciprocityScore * 100) / 100,
      balance: valueProvided === valueReceived ? "balanced" : valueProvided > valueReceived ? "giving" : "receiving",
    },
    engagementQuality: {
      avgQuality: Math.round(avgInteractionQuality * 10) / 10,
      followUpRate: Math.round(followUpRate * 10) / 10,
      followUpsScheduled,
    },
    industries: contactsByIndustry,
    insights,
    recommendations,
    benchmarks,
    timeRange,
  };
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
  // Rate limit: moderate (30 requests/5min per user)
  const limit = checkLimit(`networking-analytics:${userId}`, 30, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: NetworkingAnalyticsRequest;
  try {
    body = (await readJson(req)) as NetworkingAnalyticsRequest;
  } catch (e: any) {
    // Default to empty body if no JSON provided
    body = {};
  }

  const start = Date.now();

  try {
    const analytics = await calculateNetworkingAnalytics(
      userId,
      body.timeRange || "30d"
    );

    const latencyMs = Date.now() - start;
    logInfo("networking_analytics_success", { userId, reqId, latencyMs });

    sendJson(res, 200, {
      success: true,
      data: analytics,
      meta: { latency_ms: latencyMs },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    logError("networking_analytics_error", {
      userId,
      reqId,
      error: err?.message ?? String(err),
      latencyMs,
    });
    throw new ApiError(
      500,
      err?.message ?? "Analytics calculation failed",
      "analytics_error"
    );
  }
}
