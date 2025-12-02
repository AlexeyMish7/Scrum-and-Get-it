/**
 * MARKET INTELLIGENCE & INDUSTRY TRENDS — AI + USER DATA ENDPOINT
 *
 * POST /api/analytics/market/intelligence
 *
 * Summary:
 *  As a user, I want market intelligence and industry trend analysis
 *  so I can make informed career decisions.
 *
 *  This endpoint:
 *   1. Infers target industries/locations from the user's actual job search data
 *   2. Calls AI to generate market intelligence tailored to those targets
 *   3. Returns both AI insights AND user's own job search stats
 *
 *  Response includes:
 *   - AI market intelligence (8 acceptance criteria)
 *   - User context (their real applications, industries, locations)
 */

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../../utils/http.js";
import { requireAuth } from "../../middleware/auth.js";
import aiClient from "../../services/aiClient.js";
import supabaseAdmin from "../../services/supabaseAdmin.js";

// ---------- AI types ----------

type DemandLevel = "hot" | "growing" | "stable" | "cool";
type Timing = "now" | "soon" | "later";
type Priority = "high" | "medium" | "low";

export interface JobMarketTrend {
  industry: string;
  location: string;
  demandLevel: DemandLevel;
  trendLabel: string;
  summary: string;
}

export interface SkillTrend {
  name: string;
  category: "core" | "emerging" | "declining";
  trend: "rising" | "stable" | "declining";
  commentary: string;
}

export interface SalaryTrendSegment {
  role: string;
  location: string;
  median: number;
  range: string;
  trend: "rising" | "flat" | "declining";
  commentary: string;
}

export interface CompanyTrend {
  name: string;
  industry: string;
  hiringOutlook: "aggressive" | "selective" | "slowing";
  commentary: string;
}

export interface OpportunityWindow {
  label: string;
  timing: Timing;
  priority: Priority;
  description: string;
}

export interface MarketIntelligenceData {
  jobMarketTrends: JobMarketTrend[];
  skillDemand: {
    coreSkills: SkillTrend[];
    emergingSkills: SkillTrend[];
    decliningSkills: SkillTrend[];
  };
  salaryTrends: SalaryTrendSegment[];
  companyGrowthPatterns: CompanyTrend[];
  industryDisruptionInsights: string[];
  recommendations: string[];
  opportunityWindows: OpportunityWindow[];
  competitiveLandscapeSummary: string;
}

// ---------- User data types ----------

interface UserIndustryStats {
  industry: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface UserLocationStats {
  location: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface UserContextSummary {
  targetRole: string;
  targetIndustries: string[];
  targetLocations: string[];
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  byIndustry: UserIndustryStats[];
  byLocation: UserLocationStats[];
}

interface MarketIntelligenceResponseBody {
  // AI market view
  ai: MarketIntelligenceData;
  // User's own data used to tailor the AI
  userContext: UserContextSummary;
}

interface MarketIntelligenceRequestBody {
  targetRole?: string;
  targetIndustries?: string[];
  targetLocations?: string[];
  experienceLevel?: "intern" | "junior" | "mid" | "senior" | "lead" | "exec";
}

// ---------- Helper: build user context from jobs ----------

async function buildUserContextFromJobs(
  userId: string
): Promise<UserContextSummary> {
  if (!supabaseAdmin) {
    return {
      targetRole: "software engineer",
      targetIndustries: [],
      targetLocations: [],
      totalApplications: 0,
      totalInterviews: 0,
      totalOffers: 0,
      byIndustry: [],
      byLocation: [],
    };
  }

  const { data: jobs, error } = await supabaseAdmin
    .from("jobs")
    .select("job_title, industry, city_name, state_code, job_status")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error || !jobs || jobs.length === 0) {
    return {
      targetRole: "software engineer",
      targetIndustries: [],
      targetLocations: [],
      totalApplications: 0,
      totalInterviews: 0,
      totalOffers: 0,
      byIndustry: [],
      byLocation: [],
    };
  }

  const industryCounts: Record<string, UserIndustryStats> = {};
  const locationCounts: Record<string, UserLocationStats> = {};
  let totalApps = 0;
  let totalInts = 0;
  let totalOffers = 0;
  const titles: string[] = [];

  for (const j of jobs as any[]) {
    const rawStatus = (j.job_status || "").toLowerCase();
    const hasInterview = ["interview", "offer"].includes(rawStatus);
    const hasOffer = rawStatus === "offer";

    const industry = j.industry?.trim() || "Technology";
    const city = j.city_name?.trim();
    const state = j.state_code?.trim();
    const location =
      city && state ? `${city}, ${state}` : state || city || "United States";

    if (!industryCounts[industry]) {
      industryCounts[industry] = {
        industry,
        applications: 0,
        interviews: 0,
        offers: 0,
      };
    }
    if (!locationCounts[location]) {
      locationCounts[location] = {
        location,
        applications: 0,
        interviews: 0,
        offers: 0,
      };
    }

    industryCounts[industry].applications += 1;
    locationCounts[location].applications += 1;
    totalApps += 1;

    if (hasInterview) {
      industryCounts[industry].interviews += 1;
      locationCounts[location].interviews += 1;
      totalInts += 1;
    }
    if (hasOffer) {
      industryCounts[industry].offers += 1;
      locationCounts[location].offers += 1;
      totalOffers += 1;
    }

    if (j.job_title) titles.push(String(j.job_title));
  }

  const byIndustry = Object.values(industryCounts).sort(
    (a, b) => b.applications - a.applications
  );
  const byLocation = Object.values(locationCounts).sort(
    (a, b) => b.applications - a.applications
  );

  const topIndustries = byIndustry.slice(0, 3).map((i) => i.industry);
  const topLocations = byLocation.slice(0, 3).map((l) => l.location);

  const targetRoleGuess = titles[0] || "software engineer";

  return {
    targetRole: targetRoleGuess,
    targetIndustries: topIndustries,
    targetLocations: topLocations,
    totalApplications: totalApps,
    totalInterviews: totalInts,
    totalOffers: totalOffers,
    byIndustry,
    byLocation,
  };
}

// ---------- Helper: build AI prompt ----------

function buildMarketIntelligencePrompt(params: {
  userId: string;
  userContext: UserContextSummary;
  experienceLevel: string;
}): string {
  const { userId, userContext, experienceLevel } = params;

  const industryStatsLines = userContext.byIndustry
    .slice(0, 5)
    .map(
      (i) =>
        `- ${i.industry}: ${i.applications} apps, ${i.interviews} interviews, ${i.offers} offers`
    )
    .join("\n");

  const locationStatsLines = userContext.byLocation
    .slice(0, 5)
    .map(
      (l) =>
        `- ${l.location}: ${l.applications} apps, ${l.interviews} interviews, ${l.offers} offers`
    )
    .join("\n");

  return `
You are a career market intelligence analyst for job seekers.

The user segment is:
- User ID (for reference only): ${userId}
- Target role: ${userContext.targetRole}
- Target industries (inferred from their job search & applications): ${userContext.targetIndustries.join(
    ", "
  )}
- Target locations (inferred from their job search & applications): ${userContext.targetLocations.join(
    ", "
  )}
- Experience level: ${experienceLevel}

User pipeline summary:
- Total tracked applications: ${userContext.totalApplications}
- Total interviews: ${userContext.totalInterviews}
- Total offers: ${userContext.totalOffers}

User performance by industry:
${industryStatsLines || "- (no industry data)"}

User performance by location:
${locationStatsLines || "- (no location data)"}

TASK:
Using BOTH:
1) your knowledge of the broader job market, and
2) this user's actual search/application patterns,

produce AI-driven job market and industry trend analysis tailored to this user.

CRITICAL: Respond as STRICT JSON matching exactly this TypeScript-like schema:

{
  "jobMarketTrends": [
    {
      "industry": "string",
      "location": "string",
      "demandLevel": "hot" | "growing" | "stable" | "cool",
      "trendLabel": "string",
      "summary": "string"
    }
  ],
  "skillDemand": {
    "coreSkills": [
      {
        "name": "string",
        "category": "core",
        "trend": "rising" | "stable" | "declining",
        "commentary": "string"
      }
    ],
    "emergingSkills": [
      {
        "name": "string",
        "category": "emerging",
        "trend": "rising" | "stable" | "declining",
        "commentary": "string"
      }
    ],
    "decliningSkills": [
      {
        "name": "string",
        "category": "declining",
        "trend": "rising" | "stable" | "declining",
        "commentary": "string"
      }
    ]
  },
  "salaryTrends": [
    {
      "role": "string",
      "location": "string",
      "median": 0,
      "range": "string",
      "trend": "rising" | "flat" | "declining",
      "commentary": "string"
    }
  ],
  "companyGrowthPatterns": [
    {
      "name": "string",
      "industry": "string",
      "hiringOutlook": "aggressive" | "selective" | "slowing",
      "commentary": "string"
    }
  ],
  "industryDisruptionInsights": ["string"],
  "recommendations": ["string"],
  "opportunityWindows": [
    {
      "label": "string",
      "timing": "now" | "soon" | "later",
      "priority": "high" | "medium" | "low",
      "description": "string"
    }
  ],
  "competitiveLandscapeSummary": "string"
}

CONSTRAINTS:
- Return ONLY valid JSON. No backticks. No comments. No extra keys.
- All numbers are approximate but realistic for the described segment.
- Ensure each array has at least 3 entries where it makes sense.
`;
}

// ---------- Main handler ----------

export async function handleGetMarketIntelligence(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const userId = await requireAuth(req);

    let body: MarketIntelligenceRequestBody = {};
    try {
      body = ((await readJson(req)) || {}) as MarketIntelligenceRequestBody;
    } catch {
      body = {};
    }

    // Build user context from DB (real user input)
    let userContext = await buildUserContextFromJobs(userId);

    // Allow explicit overrides from frontend filters, if passed
    if (body.targetRole) userContext.targetRole = body.targetRole;
    if (body.targetIndustries && body.targetIndustries.length > 0) {
      userContext.targetIndustries = body.targetIndustries;
    }
    if (body.targetLocations && body.targetLocations.length > 0) {
      userContext.targetLocations = body.targetLocations;
    }

    const experienceLevel = body.experienceLevel || "mid";

    const prompt = buildMarketIntelligencePrompt({
      userId,
      userContext,
      experienceLevel,
    });

    const aiResult = await aiClient.generate("market_intelligence", prompt);

    let aiData: MarketIntelligenceData | null = null;
    if (aiResult?.json) {
      aiData = aiResult.json as MarketIntelligenceData;
    } else if (typeof aiResult?.text === "string") {
      try {
        aiData = JSON.parse(aiResult.text) as MarketIntelligenceData;
      } catch {
        // JSON parse error - aiData remains null
      }
    }

    if (!aiData) {
      return sendJson(res, 500, {
        success: false,
        error: "AI returned invalid market intelligence payload",
      });
    }

    const payload: MarketIntelligenceResponseBody = {
      ai: aiData,
      userContext,
    };

    return sendJson(res, 200, {
      success: true,
      data: payload,
    });
  } catch (err: any) {
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Unexpected server error",
    });
  }
}
