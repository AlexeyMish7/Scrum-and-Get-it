/**
 * CAREER PATH SIMULATION — AI-POWERED CAREER TRAJECTORY MODELING
 *
 * POST /api/analytics/career/paths
 *
 * Summary:
 *  As a user, I want to simulate different career path outcomes
 *  so I can make strategic job decisions aligned with long-term goals.
 *
 *  This endpoint:
 *   1. Analyzes user's current profile, employment history, and target roles
 *   2. Models career trajectories for different job choices
 *   3. Factors in industry trends, company growth stage, economic conditions
 *   4. Simulates 5-year and 10-year outcomes for each path
 *   5. Calculates expected lifetime earnings
 *   6. Identifies decision points where paths diverge significantly
 *   7. Shows probability distributions (best/worst/average case)
 *   8. Allows custom success criteria (work-life balance, learning, impact)
 *
 *  Response includes:
 *   - Multiple career path scenarios with salary projections
 *   - Career progression milestones for each path
 *   - Decision points and their long-term impact
 *   - Risk/reward analysis with probability distributions
 *   - Personalized recommendations based on user goals
 */

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../../utils/http.js";
import { requireAuth } from "../../middleware/auth.js";
import aiClient from "../../services/aiClient.js";
import supabaseAdmin from "../../services/supabaseAdmin.js";

// ---------- Types ----------

type OutcomeScenario = "best" | "average" | "worst";
type CareerPhase = "early" | "mid" | "senior" | "lead" | "executive";
type SuccessCriterion = "salary" | "work_life_balance" | "learning" | "impact" | "autonomy";

interface CareerMilestone {
  year: number;
  title: string;
  description: string;
  probability?: number; // 0-100 percentage
}

interface SalaryProjection {
  year: number;
  baseYear: number; // Year from current date (0 = current year)
  best: number;
  average: number;
  worst: number;
  percentile90: number;
  percentile50: number;
  percentile10: number;
}

interface DecisionPoint {
  year: number;
  decision: string;
  paths: string[]; // Array of path IDs affected
  recommendation: string;
}

interface RiskAnalysis {
  volatility: "low" | "medium" | "high";
  marketDependence: "low" | "medium" | "high";
  skillObsolescence: "low" | "medium" | "high";
  competitionLevel: "low" | "medium" | "high";
  details: string;
}

interface SuccessCriteriaScores {
  salary: number; // 0-100
  workLifeBalance: number;
  learningGrowth: number;
  impact: number;
  autonomy: number;
}

export interface CareerPath {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  targetIndustry: string;
  companyType: string;
  
  // Progression timeline
  milestones: CareerMilestone[];
  
  // Financial projections
  salaryProgression: SalaryProjection[];
  fiveYearEarnings: { best: number; average: number; worst: number };
  tenYearEarnings: { best: number; average: number; worst: number };
  lifetimeEarningsEstimate: number;
  
  // Risk/reward analysis
  riskAnalysis: RiskAnalysis;
  
  // Success metrics
  successScores: SuccessCriteriaScores;
  
  // Key insights
  advantages: string[];
  disadvantages: string[];
  criticalSkillsNeeded: string[];
  recommendedActions: string[];
}

interface IndustryContext {
  industryGrowthOutlook: string;
  majorDisruptors: string[];
  keyOpportunities: string[];
}

export interface CareerPathSimulationData {
  paths: CareerPath[];
  decisionPoints: DecisionPoint[];
  industryContext: IndustryContext;
  topRecommendation: string; // Path ID
  summary: string;
  customCriteriaAnalysis?: string; // If user provided custom success criteria
}

// ---------- Request/Response types ----------

interface CareerPathSimulationRequest {
  // Current state
  currentRole?: string;
  currentSalary?: number;
  yearsExperience?: number;
  
  // Target scenarios to compare
  targetRoles?: string[]; // e.g., ["Senior Engineer", "Engineering Manager", "Tech Lead"]
  targetIndustries?: string[]; // e.g., ["Fintech", "Healthcare Tech"]
  targetCompanyTypes?: Array<"startup" | "mid-size" | "enterprise">;
  
  // User preferences for success criteria
  successCriteria?: {
    salary?: number; // Weight 0-10
    workLifeBalance?: number;
    learningOpportunities?: number;
    careerImpact?: number;
    autonomy?: number;
  };
  
  // Time horizon
  projectionYears?: 5 | 10;
}

interface CareerPathSimulationResponse {
  ai: CareerPathSimulationData;
  userContext: {
    currentRole: string;
    currentSalary: number;
    yearsExperience: number;
    topSkills: string[];
    targetIndustries: string[];
  };
}

// ---------- Helper: Build user context ----------

async function buildUserContext(userId: string) {
  if (!supabaseAdmin) {
    return {
      currentRole: "Software Engineer",
      currentSalary: null,
      yearsExperience: 0,
      topSkills: [],
      industries: [],
    };
  }

  // Get user's employment history
  const { data: employment } = await supabaseAdmin
    .from("employment")
    .select("company, title, start_date, end_date, is_current")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(10);

  const currentJob = employment?.find((e) => e.is_current);
  const currentRole = currentJob?.title || "Software Engineer";

  // Calculate years of experience
  let totalExperience = 0;
  if (employment) {
    for (const job of employment) {
      const start = new Date(job.start_date);
      const end = job.end_date ? new Date(job.end_date) : new Date();
      const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      totalExperience += Math.max(0, years);
    }
  }

  // Get user's top skills
  const { data: skills } = await supabaseAdmin
    .from("skills")
    .select("name, proficiency, years_experience")
    .eq("user_id", userId)
    .order("proficiency", { ascending: false })
    .limit(10);

  const topSkills = skills?.map((s) => s.name) || [];

  // Get salary from latest job note if available
  const { data: jobNotes } = await supabaseAdmin
    .from("job_notes")
    .select("offered_salary, negotiated_salary")
    .eq("user_id", userId)
    .not("offered_salary", "is", null)
    .order("offer_received_date", { ascending: false })
    .limit(1);

  const currentSalary =
    jobNotes?.[0]?.negotiated_salary || jobNotes?.[0]?.offered_salary || null;

  // Get industries from jobs
  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select("industry")
    .eq("user_id", userId)
    .not("industry", "is", null);

  const industries = [
    ...new Set(jobs?.map((j) => j.industry).filter(Boolean) || []),
  ] as string[];

  return {
    currentRole,
    currentSalary,
    yearsExperience: Math.round(totalExperience),
    topSkills,
    industries,
  };
}

// ---------- Prompt builder ----------

function buildCareerPathSimulationPrompt(params: {
  userContext: Awaited<ReturnType<typeof buildUserContext>>;
  request: CareerPathSimulationRequest;
}): string {
  const { userContext, request } = params;

  const targetRoles = request.targetRoles || [
    "Senior " + userContext.currentRole,
    userContext.currentRole.replace("Engineer", "Manager"),
    "Tech Lead",
  ];

  const projectionYears = request.projectionYears || 10;

  const criteria = request.successCriteria || {
    salary: 7,
    workLifeBalance: 6,
    learningOpportunities: 8,
    careerImpact: 6,
    autonomy: 5,
  };

  return `
You are an AI career strategist specializing in long-term career path modeling and simulation.

USER PROFILE:
- Current Role: ${userContext.currentRole}
- Years of Experience: ${userContext.yearsExperience}
- Current Salary: ${userContext.currentSalary ? "$" + userContext.currentSalary.toLocaleString() : "Not provided"}
- Top Skills: ${userContext.topSkills.join(", ") || "Not provided"}
- Industries: ${userContext.industries.join(", ") || "Technology"}

TARGET SCENARIOS:
The user wants to evaluate these potential career paths:
${targetRoles.map((role, i) => `${i + 1}. ${role}`).join("\n")}

${request.targetIndustries ? `Target Industries: ${request.targetIndustries.join(", ")}` : ""}
${request.targetCompanyTypes ? `Company Types: ${request.targetCompanyTypes.join(", ")}` : ""}

SUCCESS CRITERIA (user priorities, scale 0-10):
- Salary/Compensation: ${criteria.salary}/10
- Work-Life Balance: ${criteria.workLifeBalance}/10
- Learning Opportunities: ${criteria.learningOpportunities}/10
- Career Impact: ${criteria.careerImpact}/10
- Autonomy: ${criteria.autonomy}/10

TASK:
Generate a comprehensive career path simulation with ${projectionYears}-year projections for each target role.

For EACH career path, provide:

1. **Career Milestones** (3-5 progression steps):
   - Year, title, salary range (min/max/median)
   - Probability of achieving (0-1)
   - Required skills
   - Description of role responsibilities

2. **Salary Projections** (annual for ${projectionYears} years):
   - Best case, average case, worst case scenarios
   - 25th and 75th percentile estimates
   - Account for industry trends, company type, experience growth

3. **5-Year and 10-Year Earnings**:
   - Total cumulative earnings for best/average/worst scenarios
   - Lifetime earnings estimate (30-year career horizon)

4. **Risk Analysis**:
   - Volatility: How stable is this career path?
   - Market dependence: Impact of economic cycles
   - Skill obsolescence: How quickly skills become outdated
   - Competition level: How competitive is progression?

5. **Success Criteria Scores** (0-100 for each criterion):
   - Salary, work-life balance, learning, impact, autonomy
   - Overall score based on user's weights

6. **Strategic Insights**:
   - 3-5 key advantages of this path
   - 3-5 disadvantages or challenges
   - Critical skills needed (not yet possessed)
   - 3-5 recommended actions to pursue this path

ALSO PROVIDE:

7. **Decision Points**: Key moments where choices significantly diverge paths
   - When does the decision need to be made?
   - What are the two primary options?
   - What's the long-term salary differential?
   - Which choice is recommended and why?

8. **Top Recommendation**: Which single path best matches the user's success criteria?

9. **Industry Context**:
   - Growth outlook for target industries
   - Emerging opportunities to watch

IMPORTANT INSTRUCTIONS:
- Be realistic with salary projections based on actual market data
- Consider the user's current experience level (${userContext.yearsExperience} years)
- Account for title progression timing (promotions every 2-4 years typically)
- Factor in company type impact (startups: higher risk/reward, enterprise: more stable)
- Generate 3-5 distinct career paths to compare
- Ensure probability distributions sum to realistic outcomes
- Base risk analysis on industry volatility and skill trends

Return ONLY valid JSON matching this structure:

{
  "paths": [
    {
      "id": "path-1",
      "name": "Path name",
      "description": "Brief description of this career trajectory",
      "targetRole": "Target role title",
      "targetIndustry": "Industry",
      "companyType": "startup|mid-size|enterprise|freelance",
      "milestones": [
        {
          "year": 1,
          "title": "Role title",
          "salaryRange": { "min": 100000, "max": 150000, "median": 125000 },
          "probability": 0.8,
          "requiredSkills": ["skill1", "skill2"],
          "description": "Role description"
        }
      ],
      "salaryProgression": [
        {
          "year": 1,
          "best": 150000,
          "average": 125000,
          "worst": 100000,
          "percentile25": 110000,
          "percentile75": 140000
        }
      ],
      "fiveYearEarnings": { "best": 800000, "average": 650000, "worst": 500000 },
      "tenYearEarnings": { "best": 2000000, "average": 1500000, "worst": 1000000 },
      "lifetimeEarningsEstimate": 5000000,
      "riskAnalysis": {
        "volatility": "medium",
        "marketDependence": "high",
        "skillObsolescence": "low",
        "competitionLevel": "medium",
        "summary": "Analysis summary"
      },
      "successScores": {
        "salary": 85,
        "workLifeBalance": 60,
        "learningOpportunities": 90,
        "careerImpact": 75,
        "autonomy": 70,
        "overall": 76
      },
      "advantages": ["advantage 1", "advantage 2"],
      "disadvantages": ["disadvantage 1"],
      "criticalSkillsNeeded": ["skill 1", "skill 2"],
      "recommendedActions": ["action 1", "action 2"]
    }
  ],
  "decisionPoints": [
    {
      "timeframe": "Year 2",
      "decision": "Description of decision",
      "pathA": "Option A description",
      "pathB": "Option B description",
      "impactDescription": "How this affects long-term trajectory",
      "salaryDifferential": 250000,
      "recommendedChoice": "Path A",
      "reasoning": "Why this is recommended"
    }
  ],
  "topRecommendation": "path-1",
  "reasoning": "Why this path is the best match for the user's criteria and goals",
  "industryContext": {
    "targetIndustries": ["Fintech", "AI/ML"],
    "growthOutlook": { "Fintech": "strong", "AI/ML": "strong" },
    "emergingOpportunities": ["AI Engineering", "ML Ops"]
  }
}
`.trim();
}

// ---------- Main handler ----------

export async function handleCareerPathSimulation(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // Authenticate
    const userId = await requireAuth(req);
    if (!userId) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    // Parse request
    const body = ((await readJson(req)) || {}) as CareerPathSimulationRequest;

    // Build user context from database
    const userContext = await buildUserContext(userId);

    // Override with request params if provided
    if (body.currentRole) userContext.currentRole = body.currentRole;
    if (body.currentSalary) userContext.currentSalary = body.currentSalary;
    if (body.yearsExperience) userContext.yearsExperience = body.yearsExperience;

    // Build AI prompt
    const prompt = buildCareerPathSimulationPrompt({ userContext, request: body });

    // Call AI
    const aiResult = await aiClient.generate("career_paths", prompt, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Parse AI response
    let aiData: any = null;
    if (aiResult.json) {
      aiData = aiResult.json;
    } else if (aiResult.text) {
      try {
        aiData = JSON.parse(aiResult.text);
      } catch (err) {
        console.error("Failed to parse AI career paths response:", err);
      }
    }

    if (!aiData || !aiData.paths || aiData.paths.length === 0) {
      sendJson(res, 500, {
        error: "AI returned invalid career path simulation data",
      });
      return;
    }

    // Transform AI data to match frontend expectations
    const transformedData: CareerPathSimulationData = {
      paths: aiData.paths.map((path: any) => ({
        id: path.id,
        name: path.name,
        description: path.description,
        targetRole: path.targetRole,
        targetIndustry: path.targetIndustry,
        companyType: path.companyType,
        // Simplify milestones - remove salaryRange and requiredSkills, convert probability to percentage
        milestones: path.milestones.map((m: any) => ({
          year: m.year,
          title: m.title,
          description: m.description,
          probability: m.probability ? Math.round(m.probability * 100) : undefined,
        })),
        // Transform salary progression - add baseYear, rename percentile fields
        salaryProgression: path.salaryProgression.map((s: any) => ({
          year: s.year,
          baseYear: s.year - 1, // Year 1 = baseYear 0
          best: s.best,
          average: s.average,
          worst: s.worst,
          percentile90: s.percentile75 || s.best,
          percentile50: s.average,
          percentile10: s.percentile25 || s.worst,
        })),
        fiveYearEarnings: path.fiveYearEarnings,
        tenYearEarnings: path.tenYearEarnings,
        lifetimeEarningsEstimate: path.lifetimeEarningsEstimate,
        // Rename riskAnalysis.summary to details
        riskAnalysis: {
          volatility: path.riskAnalysis.volatility,
          marketDependence: path.riskAnalysis.marketDependence,
          skillObsolescence: path.riskAnalysis.skillObsolescence,
          competitionLevel: path.riskAnalysis.competitionLevel,
          details: path.riskAnalysis.summary || path.riskAnalysis.details || "",
        },
        // Rename success score fields
        successScores: {
          salary: path.successScores.salary,
          workLifeBalance: path.successScores.workLifeBalance,
          learningGrowth: path.successScores.learningOpportunities || path.successScores.learningGrowth || 0,
          impact: path.successScores.careerImpact || path.successScores.impact || 0,
          autonomy: path.successScores.autonomy,
        },
        advantages: path.advantages,
        disadvantages: path.disadvantages,
        criticalSkillsNeeded: path.criticalSkillsNeeded,
        recommendedActions: path.recommendedActions,
      })),
      // Transform decision points
      decisionPoints: (aiData.decisionPoints || []).map((dp: any) => ({
        year: dp.year || parseInt(dp.timeframe?.match(/\d+/)?.[0] || "0"),
        decision: dp.decision,
        paths: dp.paths || [dp.pathA, dp.pathB].filter(Boolean),
        recommendation: dp.recommendation || dp.recommendedChoice || dp.reasoning || "",
      })),
      industryContext: aiData.industryContext || {
        industryGrowthOutlook: "Moderate growth expected",
        majorDisruptors: [],
        keyOpportunities: [],
      },
      topRecommendation: aiData.topRecommendation || (aiData.paths[0]?.id || ""),
      summary: aiData.summary || aiData.reasoning || "Career path analysis complete",
    };

    // Build response
    const response: CareerPathSimulationResponse = {
      ai: transformedData,
      userContext: {
        currentRole: userContext.currentRole,
        currentSalary: userContext.currentSalary,
        yearsExperience: userContext.yearsExperience,
        topSkills: userContext.topSkills.slice(0, 5),
        targetIndustries: userContext.industries.slice(0, 3),
      },
    };

    sendJson(res, 200, {
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Career path simulation error:", error);
    sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
