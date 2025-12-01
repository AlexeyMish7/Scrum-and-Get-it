/**
 * Competitive Benchmarking & Market Positioning API
 * 
 * Purpose: Provide comprehensive competitive analysis comparing user's job search
 * performance, skills, and career progression against anonymized peer data and
 * industry standards.
 * 
 * Features:
 * - Peer benchmark comparison (application rates, response rates, offer rates)
 * - Competitive positioning assessment (percentile rankings)
 * - Industry standard monitoring (deviations from market averages)
 * - Career progression pattern tracking (typical timelines and paths)
 * - Skill gap analysis (missing skills vs top performers)
 * - Competitive advantage recommendations (strategic improvements)
 * - Differentiation strategy insights (unique strengths to leverage)
 * - Market position optimization (actionable visibility improvements)
 * 
 * Endpoints:
 * - POST /api/analytics/competitive/position
 * 
 * Dependencies:
 * - Supabase admin client for database queries
 * - Analytics cache for historical job search data
 * - User profile, skills, employment data
 */

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../../utils/http.js";
import { requireAuth } from "../../middleware/auth.js";
import supabaseAdmin from "../../services/supabaseAdmin.js";

interface UserMetrics {
  applicationsPerMonth: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgTimeToInterview: number;
  avgTimeToOffer: number;
  totalSkills: number;
  skillsByCategory: Record<string, number>;
}

interface PeerBenchmark {
  industry: string;
  experience_level: string;
  avg_applications_per_month: number;
  avg_response_rate: number;
  avg_interview_rate: number;
  avg_offer_rate: number;
  avg_time_to_first_interview_days: number;
  avg_time_to_offer_days: number;
  top_required_skills: Array<{skill: string; frequency: number}>;
  top_missing_skills: Array<{skill: string; frequency: number}>;
  avg_skills_per_profile: number;
  median_salary: number;
  sample_size: number;
}

interface IndustryStandard {
  industry: string;
  standard_applications_per_month: number;
  standard_response_rate: number;
  standard_interview_rate: number;
  standard_offer_rate: number;
  standard_time_to_hire_days: number;
  salary_benchmarks: Record<string, {min: number; max: number; median: number}>;
  required_skills_by_level: Record<string, string[]>;
}

interface CareerPath {
  from_title: string;
  to_title: string;
  industry: string;
  avg_months_to_transition: number;
  min_months: number;
  max_months: number;
  skills_acquired: string[];
  success_factors: string[];
  success_rate: number;
}

/**
 * POST /api/analytics/competitive/position
 * 
 * Calculate and return comprehensive competitive positioning analysis
 * 
 * Request body: empty (uses authenticated user)
 * Response: {
 *   percentileRankings: {...},
 *   peerComparison: {...},
 *   industryStandards: {...},
 *   careerProgression: {...},
 *   skillGapAnalysis: {...},
 *   competitiveAdvantages: [...],
 *   differentiationStrategies: [...],
 *   marketOptimization: {...}
 * }
 */
export async function handleGetCompetitivePosition(
  req: IncomingMessage,
  res: ServerResponse
) {
  console.log("[CompetitivePosition] Handler called!");
  
  try {
    // Check Supabase is configured
    if (!supabaseAdmin) {
      return sendJson(res, 500, {
        error: "Database not configured - check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables",
      });
    }
    
    // Create non-null reference for TypeScript
    const db = supabaseAdmin;

    // Authentication
    const userId = await requireAuth(req);
    console.log("[CompetitivePosition] User authenticated:", userId);

    // Real analysis enabled - comment out this section to use mock data for testing
    // console.log("[CompetitivePosition] Sending mock response...");
    // return sendJson(res, 200, { success: true, data: { /* mock data */ } });

    // 1. Load user profile and determine segment
    // @ts-ignore - supabaseAdmin is checked for null at function entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("industry, experience_level, professional_title")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return sendJson(res, 404, {
        error: "Profile not found",
      });
    }

    // @ts-ignore - profile is checked for null above
    const industry = profile.industry || "Software";
    // @ts-ignore
    const experienceLevel = profile.experience_level || "mid";
    // @ts-ignore
    const professionalTitle = profile.professional_title || "";
    console.log("[CompetitivePosition] User segment:", { industry, experienceLevel, professionalTitle });

    // Normalize title to category (simplified)
    const titleCategory = normalizeTitleCategory(professionalTitle);

    // 2. Calculate user's current metrics
    console.log("[CompetitivePosition] Calculating user metrics...");
    const userMetrics = await calculateUserMetrics(userId);
    console.log("[CompetitivePosition] User metrics:", userMetrics);

    // 3. Fetch peer benchmark for user's segment
    console.log("[CompetitivePosition] Fetching peer benchmark...");
    const peerBenchmark = await getPeerBenchmark(industry, experienceLevel, titleCategory);
    console.log("[CompetitivePosition] Peer benchmark:", peerBenchmark?.sample_size || 0, "users");

    // 4. Fetch industry standards
    console.log("[CompetitivePosition] Fetching industry standards...");
    const industryStandard = await getIndustryStandard(industry);

    // 5. Fetch career progression patterns
    console.log("[CompetitivePosition] Fetching career paths...");
    const careerPaths = await getCareerProgressionPaths(professionalTitle, industry);

    // 6. Analyze skill gaps against peer data
    console.log("[CompetitivePosition] Analyzing skill gaps...");
    const skillGapAnalysis = await analyzeSkillGaps(userId, industry, experienceLevel, peerBenchmark);

    // 7. Calculate percentile rankings
    const percentileRankings = calculatePercentiles(userMetrics, peerBenchmark);

    // 8. Generate competitive advantage recommendations
    const competitiveAdvantages = generateCompetitiveAdvantages(
      userMetrics,
      peerBenchmark,
      industryStandard,
      skillGapAnalysis
    );

    // 9. Generate differentiation strategies
    const differentiationStrategies = generateDifferentiationStrategies(
      userMetrics,
      skillGapAnalysis,
      careerPaths
    );

    // 10. Generate market optimization recommendations
    const marketOptimization = generateMarketOptimization(
      userMetrics,
      peerBenchmark,
      industryStandard,
      skillGapAnalysis
    );

    // 11. Cache results in user_competitive_position table
    await cacheCompetitivePosition(
      userId,
      industry,
      experienceLevel,
      titleCategory,
      percentileRankings,
      userMetrics,
      peerBenchmark,
      competitiveAdvantages,
      skillGapAnalysis
    );

    // Return comprehensive analysis
    return sendJson(res, 200, {
      success: true,
      data: {
        segment: {
          industry,
          experienceLevel,
          titleCategory,
        },
        userMetrics: {
          applicationsPerMonth: userMetrics.applicationsPerMonth,
          responseRate: userMetrics.responseRate,
          interviewRate: userMetrics.interviewRate,
          offerRate: userMetrics.offerRate,
          avgTimeToInterview: userMetrics.avgTimeToInterview,
          avgTimeToOffer: userMetrics.avgTimeToOffer,
          totalSkills: userMetrics.totalSkills,
        },
        percentileRankings,
        peerComparison: {
          benchmark: {
            applicationsPerMonth: peerBenchmark?.avg_applications_per_month || 0,
            responseRate: peerBenchmark?.avg_response_rate || 0,
            interviewRate: peerBenchmark?.avg_interview_rate || 0,
            offerRate: peerBenchmark?.avg_offer_rate || 0,
            sampleSize: peerBenchmark?.sample_size || 0,
          },
          yourPerformance: {
            applicationsPerMonth: userMetrics.applicationsPerMonth,
            responseRate: userMetrics.responseRate,
            interviewRate: userMetrics.interviewRate,
            offerRate: userMetrics.offerRate,
          },
          comparison: {
            applicationsPerMonth: calculateDelta(
              userMetrics.applicationsPerMonth,
              peerBenchmark?.avg_applications_per_month || 0
            ),
            responseRate: calculateDelta(
              userMetrics.responseRate,
              peerBenchmark?.avg_response_rate || 0
            ),
            interviewRate: calculateDelta(
              userMetrics.interviewRate,
              peerBenchmark?.avg_interview_rate || 0
            ),
            offerRate: calculateDelta(
              userMetrics.offerRate,
              peerBenchmark?.avg_offer_rate || 0
            ),
          },
        },
        industryStandards: {
          applicationsPerMonth: industryStandard?.standard_applications_per_month || 0,
          responseRate: industryStandard?.standard_response_rate || 0,
          interviewRate: industryStandard?.standard_interview_rate || 0,
          offerRate: industryStandard?.standard_offer_rate || 0,
          timeToHire: industryStandard?.standard_time_to_hire_days || 0,
          salaryRange: industryStandard?.salary_benchmarks?.[experienceLevel] || null,
          requiredSkills: industryStandard?.required_skills_by_level?.[experienceLevel] || [],
        },
        careerProgression: {
          currentTitle: professionalTitle,
          possiblePaths: careerPaths.map((path) => ({
            nextTitle: path.to_title,
            avgMonths: path.avg_months_to_transition,
            skillsNeeded: path.skills_acquired,
            successFactors: path.success_factors,
            successRate: path.success_rate,
          })),
        },
        skillGapAnalysis,
        competitiveAdvantages,
        differentiationStrategies,
        marketOptimization,
      },
    });
  } catch (error: unknown) {
    console.error("[handleGetCompetitivePosition] Error:", error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to generate competitive analysis",
    });
  }
}

/**
 * Calculate user's job search metrics from jobs table
 */
async function calculateUserMetrics(userId: string): Promise<UserMetrics> {
  // Get jobs
  const { data: jobs, error: jobsError } = await supabaseAdmin!
    .from("jobs")
    .select("id, job_status, created_at")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError);
    return getDefaultMetrics();
  }

  const totalJobs = jobs?.length || 0;

  // Calculate application volume (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentJobs = jobs?.filter((j) => new Date(j.created_at) >= threeMonthsAgo) || [];
  const applicationsPerMonth = recentJobs.length / 3;

  // Calculate conversion rates
  const appliedJobs = jobs?.filter((j) =>
    ["Applied", "Phone Screen", "Interview", "Offer", "Rejected"].includes(
      j.job_status || ""
    )
  ) || [];

  const respondedJobs = jobs?.filter((j) =>
    ["Phone Screen", "Interview", "Offer"].includes(
      j.job_status || ""
    )
  ) || [];

  const interviewJobs = jobs?.filter((j) =>
    ["Interview", "Offer"].includes(j.job_status || "")
  ) || [];

  const offerJobs = jobs?.filter((j) =>
    j.job_status === "Offer"
  ) || [];

  const responseRate = appliedJobs.length > 0 ? respondedJobs.length / appliedJobs.length : 0;
  const interviewRate = appliedJobs.length > 0 ? interviewJobs.length / appliedJobs.length : 0;
  const offerRate = appliedJobs.length > 0 ? offerJobs.length / appliedJobs.length : 0;

  // Get skills count
  // @ts-ignore - supabaseAdmin checked at handler entry
  const { data: skills, error: skillsError } = await supabaseAdmin
    .from("skills")
    .select("skill_name, skill_category")
    .eq("user_id", userId);

  const totalSkills = skills?.length || 0;
  const skillsByCategory: Record<string, number> = {};
  skills?.forEach((skill) => {
    const category = skill.skill_category || "Other";
    skillsByCategory[category] = (skillsByCategory[category] || 0) + 1;
  });

  return {
    applicationsPerMonth,
    responseRate,
    interviewRate,
    offerRate,
    avgTimeToInterview: 0,  // TODO: Calculate from status_changed_at
    avgTimeToOffer: 0,  // TODO: Calculate from status_changed_at
    totalSkills,
    skillsByCategory,
  };
}

/**
 * Fetch peer benchmark for segment
 */
async function getPeerBenchmark(
  industry: string,
  experienceLevel: string,
  titleCategory: string
): Promise<PeerBenchmark | null> {
  const { data, error } = await supabaseAdmin!
    .from("peer_benchmarks")
    .select("*")
    .eq("industry", industry)
    .eq("experience_level", experienceLevel)
    .limit(1)
    .single();

  if (error || !data) {
    console.warn("Peer benchmark not found, using fallback");
    return getFallbackPeerBenchmark(industry, experienceLevel);
  }

  return data as PeerBenchmark;
}

/**
 * Fetch industry standard
 */
async function getIndustryStandard(industry: string): Promise<IndustryStandard | null> {
  const { data, error } = await supabaseAdmin!
    .from("industry_standards")
    .select("*")
    .eq("industry", industry)
    .single();

  if (error || !data) {
    console.warn("Industry standard not found");
    return null;
  }

  return data as IndustryStandard;
}

/**
 * Fetch career progression paths
 */
async function getCareerProgressionPaths(
  currentTitle: string,
  industry: string
): Promise<CareerPath[]> {
  const { data, error } = await supabaseAdmin!
    .from("career_progression_patterns")
    .select("*")
    .eq("from_title", currentTitle)
    .eq("industry", industry);

  if (error || !data || data.length === 0) {
    // Try generic paths for industry
    // @ts-ignore - supabaseAdmin checked at handler entry
    const { data: genericPaths } = await supabaseAdmin
      .from("career_progression_patterns")
      .select("*")
      .eq("industry", industry)
      .limit(3);

    return (genericPaths || []) as CareerPath[];
  }

  return data as CareerPath[];
}

/**
 * Analyze skill gaps against peer and industry data
 */
async function analyzeSkillGaps(
  userId: string,
  industry: string,
  experienceLevel: string,
  peerBenchmark: PeerBenchmark | null
) {
  // Get user's current skills
  // @ts-ignore - supabaseAdmin checked at handler entry
  const { data: userSkills } = await supabaseAdmin
    .from("skills")
    .select("skill_name")
    .eq("user_id", userId);

  const userSkillSet = new Set((userSkills || []).map((s) => s.skill_name.toLowerCase()));

  // Get industry required skills
  // @ts-ignore - supabaseAdmin checked at handler entry
  const { data: industryStandard } = await supabaseAdmin
    .from("industry_standards")
    .select("required_skills_by_level")
    .eq("industry", industry)
    .single();

  const requiredSkills = (industryStandard?.required_skills_by_level?.[experienceLevel] || []) as string[];

  // Calculate missing skills
  const missingSkills = requiredSkills.filter(
    (skill) => !userSkillSet.has(skill.toLowerCase())
  );

  // Get top missing skills from peer benchmark
  const peerMissingSkills = peerBenchmark?.top_missing_skills || [];

  // Skill depth comparison
  const skillsDepth = {
    user: userSkills?.length || 0,
    peerAverage: peerBenchmark?.avg_skills_per_profile || 0,
    industryRequired: requiredSkills.length,
  };

  // Calculate skill match percentage
  const matchedSkills = requiredSkills.filter((skill) =>
    userSkillSet.has(skill.toLowerCase())
  );
  const skillMatchPercentage = requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 0;

  return {
    missingSkills,
    matchedSkills,
    skillMatchPercentage,
    skillsDepth,
    topMissingAcrossPeers: peerMissingSkills.slice(0, 10),
    recommendations: generateSkillRecommendations(missingSkills, peerMissingSkills),
  };
}

/**
 * Calculate percentile rankings
 */
function calculatePercentiles(
  userMetrics: UserMetrics,
  peerBenchmark: PeerBenchmark | null
): Record<string, number> {
  if (!peerBenchmark) {
    return {
      applicationVolume: 50,
      responseRate: 50,
      interviewRate: 50,
      offerRate: 50,
      skillsDepth: 50,
    };
  }

  // Simple percentile calculation (in production, use proper statistical distribution)
  const calculatePercentile = (userValue: number, benchmarkValue: number): number => {
    if (benchmarkValue === 0) return 50;
    const ratio = userValue / benchmarkValue;
    // Convert ratio to approximate percentile (50 = at benchmark)
    return Math.round(Math.min(99, Math.max(1, 50 + (ratio - 1) * 50)));
  };

  return {
    applicationVolume: calculatePercentile(
      userMetrics.applicationsPerMonth,
      peerBenchmark.avg_applications_per_month
    ),
    responseRate: calculatePercentile(
      userMetrics.responseRate,
      peerBenchmark.avg_response_rate
    ),
    interviewRate: calculatePercentile(
      userMetrics.interviewRate,
      peerBenchmark.avg_interview_rate
    ),
    offerRate: calculatePercentile(
      userMetrics.offerRate,
      peerBenchmark.avg_offer_rate
    ),
    skillsDepth: calculatePercentile(
      userMetrics.totalSkills,
      peerBenchmark.avg_skills_per_profile
    ),
  };
}

/**
 * Generate competitive advantage recommendations
 */
function generateCompetitiveAdvantages(
  userMetrics: UserMetrics,
  peerBenchmark: PeerBenchmark | null,
  industryStandard: IndustryStandard | null,
  skillGapAnalysis: any
): Array<{type: string; advantage: string; action: string; impact: string}> {
  const advantages: Array<{type: string; advantage: string; action: string; impact: string}> = [];

  // Response rate advantage
  if (peerBenchmark && userMetrics.responseRate > peerBenchmark.avg_response_rate * 1.2) {
    advantages.push({
      type: "performance",
      advantage: `Your response rate (${(userMetrics.responseRate * 100).toFixed(1)}%) is ${((userMetrics.responseRate / peerBenchmark.avg_response_rate - 1) * 100).toFixed(0)}% above peer average`,
      action: "Maintain current application quality and continue early submissions",
      impact: "high",
    });
  } else if (peerBenchmark && userMetrics.responseRate < peerBenchmark.avg_response_rate * 0.8) {
    advantages.push({
      type: "improvement",
      advantage: `Your response rate (${(userMetrics.responseRate * 100).toFixed(1)}%) is below peer average`,
      action: "Review resume with AI optimization, apply earlier in posting cycle, tailor each application",
      impact: "high",
    });
  }

  // Interview conversion
  if (peerBenchmark && userMetrics.interviewRate > peerBenchmark.avg_interview_rate * 1.15) {
    advantages.push({
      type: "strength",
      advantage: "Strong interview conversion rate",
      action: "Document your successful interview preparation methods to replicate",
      impact: "medium",
    });
  }

  // Skill coverage
  if (skillGapAnalysis.skillMatchPercentage >= 80) {
    advantages.push({
      type: "strength",
      advantage: `Excellent skill match (${skillGapAnalysis.skillMatchPercentage.toFixed(0)}% of required skills)`,
      action: "Highlight this comprehensive skill set prominently in applications",
      impact: "high",
    });
  } else if (skillGapAnalysis.skillMatchPercentage < 50) {
    advantages.push({
      type: "gap",
      advantage: `Skill coverage below target (${skillGapAnalysis.skillMatchPercentage.toFixed(0)}%)`,
      action: `Focus on learning: ${skillGapAnalysis.missingSkills.slice(0, 3).join(", ")}`,
      impact: "high",
    });
  }

  // Application volume
  if (peerBenchmark && userMetrics.applicationsPerMonth < peerBenchmark.avg_applications_per_month * 0.5) {
    advantages.push({
      type: "volume",
      advantage: "Low application volume may limit opportunities",
      action: `Increase to ${Math.ceil(peerBenchmark.avg_applications_per_month)} applications/month (peer average)`,
      impact: "high",
    });
  }

  return advantages;
}

/**
 * Generate differentiation strategies
 */
function generateDifferentiationStrategies(
  userMetrics: UserMetrics,
  skillGapAnalysis: any,
  careerPaths: CareerPath[]
): Array<{strategy: string; rationale: string; actions: string[]}> {
  const strategies: Array<{strategy: string; rationale: string; actions: string[]}> = [];

  // Skill-based differentiation
  if (skillGapAnalysis.matchedSkills.length > 0) {
    strategies.push({
      strategy: "Highlight Unique Skill Combinations",
      rationale: `You have ${skillGapAnalysis.matchedSkills.length} in-demand skills that can set you apart`,
      actions: [
        "Feature these skills prominently in your resume summary",
        "Provide specific project examples demonstrating each skill",
        "Mention unique combinations (e.g., technical + leadership)",
      ],
    });
  }

  // Niche specialization
  if (userMetrics.skillsByCategory && Object.keys(userMetrics.skillsByCategory).length <= 2) {
    const topCategory = Object.entries(userMetrics.skillsByCategory)
      .sort(([, a], [, b]) => b - a)[0];
    if (topCategory) {
      strategies.push({
        strategy: "Position as Specialist",
        rationale: `Strong concentration in ${topCategory[0]} (${topCategory[1]} skills)`,
        actions: [
          `Target roles requiring deep ${topCategory[0]} expertise`,
          "Emphasize specialization over generalist positioning",
          "Seek companies valuing expert knowledge in this area",
        ],
      });
    }
  }

  // Career progression differentiation
  if (careerPaths.length > 0) {
    const nextPath = careerPaths[0];
    strategies.push({
      strategy: "Demonstrate Career Trajectory",
      rationale: `Position yourself for ${nextPath.to_title} progression`,
      actions: [
        `Acquire key skills: ${nextPath.skills_acquired.slice(0, 3).join(", ")}`,
        `Highlight experiences matching success factors: ${nextPath.success_factors[0]}`,
        "Frame current role as stepping stone to senior position",
      ],
    });
  }

  // Unique value proposition
  strategies.push({
    strategy: "Craft Unique Value Proposition",
    rationale: "Stand out by clearly articulating what makes you different",
    actions: [
      "Identify your most uncommon but valuable skill combination",
      "Develop a personal brand around your unique strengths",
      "Share thought leadership content in your niche (LinkedIn, blog)",
    ],
  });

  return strategies;
}

/**
 * Generate market optimization recommendations
 */
function generateMarketOptimization(
  userMetrics: UserMetrics,
  peerBenchmark: PeerBenchmark | null,
  industryStandard: IndustryStandard | null,
  skillGapAnalysis: any
): {
  visibility: string[];
  targeting: string[];
  timing: string[];
  quality: string[];
} {
  const optimization = {
    visibility: [] as string[],
    targeting: [] as string[],
    timing: [] as string[],
    quality: [] as string[],
  };

  // Visibility recommendations
  optimization.visibility.push(
    "Optimize LinkedIn profile with all matched skills in Skills section",
    "Add portfolio projects demonstrating key competencies",
    "Request recommendations from colleagues highlighting unique strengths",
    "Participate in industry discussions to increase profile views"
  );

  if (skillGapAnalysis.skillMatchPercentage < 70) {
    optimization.visibility.push(
      `Add missing high-demand skills to LinkedIn: ${skillGapAnalysis.missingSkills.slice(0, 3).join(", ")}`
    );
  }

  // Targeting recommendations
  if (peerBenchmark && userMetrics.responseRate < peerBenchmark.avg_response_rate) {
    optimization.targeting.push(
      "Target companies where your skill set is better aligned (80%+ match)",
      "Focus on roles 1-2 levels below your aspirational target to improve response",
      "Prioritize companies with posted skills matching your strongest areas"
    );
  }

  optimization.targeting.push(
    "Research company culture fit before applying to improve conversion",
    "Network with current employees to get referrals (3x higher response rate)"
  );

  // Timing recommendations
  optimization.timing.push(
    "Apply within first 24-48 hours of job posting for maximum visibility",
    "Schedule applications for Tuesday-Thursday mornings (higher open rates)",
    "Follow up 7-10 days after application if no response"
  );

  if (peerBenchmark && userMetrics.applicationsPerMonth < peerBenchmark.avg_applications_per_month) {
    optimization.timing.push(
      `Increase application frequency to ${Math.ceil(peerBenchmark.avg_applications_per_month)} per month (peer average)`
    );
  }

  // Quality recommendations
  optimization.quality.push(
    "Use AI-powered resume tailoring for each application",
    "Include 3-5 quantified achievements per role in work experience",
    "Customize cover letter opening paragraph to reference specific company projects/values"
  );

  if (skillGapAnalysis.missingSkills.length > 0) {
    optimization.quality.push(
      `Proactively address skill gaps in cover letter: "${skillGapAnalysis.missingSkills[0]} - currently learning through online course"`
    );
  }

  return optimization;
}

/**
 * Generate skill learning recommendations
 */
function generateSkillRecommendations(
  missingSkills: string[],
  peerMissingSkills: Array<{skill: string; frequency: number}>
): Array<{skill: string; priority: string; reason: string; resources: string[]}> {
  const recommendations: Array<{skill: string; priority: string; reason: string; resources: string[]}> = [];

  // Prioritize skills missing by many peers (high demand)
  const highDemandSkills = peerMissingSkills
    .filter((ps) => ps.frequency >= 5)
    .map((ps) => ps.skill.toLowerCase());

  missingSkills.slice(0, 5).forEach((skill) => {
    const isHighDemand = highDemandSkills.includes(skill.toLowerCase());

    recommendations.push({
      skill,
      priority: isHighDemand ? "high" : "medium",
      reason: isHighDemand
        ? `Required by many roles in your target industry - common gap among peers`
        : `Important for role requirements in your experience level`,
      resources: [
        `Online course: Search "${skill} tutorial" on Coursera/Udemy/Pluralsight`,
        `Certification: Explore ${skill} certification programs`,
        `Practice: Build portfolio project demonstrating ${skill}`,
        `Reading: Follow ${skill} blogs and documentation`,
      ],
    });
  });

  return recommendations;
}

/**
 * Cache competitive position in database
 */
async function cacheCompetitivePosition(
  userId: string,
  industry: string,
  experienceLevel: string,
  titleCategory: string,
  percentiles: Record<string, number>,
  userMetrics: UserMetrics,
  peerBenchmark: PeerBenchmark | null,
  advantages: any[],
  skillGaps: any
) {
  const profileVersion = new Date().toISOString(); // Simple version tracking

  const competitiveStrengths: string[] = [];
  const competitiveGaps: string[] = [];

  // Extract strengths and gaps from advantages
  advantages.forEach((adv) => {
    if (adv.type === "strength" || adv.type === "performance") {
      competitiveStrengths.push(adv.advantage);
    } else if (adv.type === "gap" || adv.type === "improvement") {
      competitiveGaps.push(adv.advantage);
    }
  });

  // Add skill gaps
  if (skillGaps.missingSkills.length > 0) {
    competitiveGaps.push(`Missing ${skillGaps.missingSkills.length} key skills for target roles`);
  }

  // @ts-ignore - supabaseAdmin checked at handler entry
  const { error } = await supabaseAdmin
    .from("user_competitive_position")
    .upsert({
      user_id: userId,
      industry,
      experience_level: experienceLevel,
      job_title_category: titleCategory,
      application_volume_percentile: percentiles.applicationVolume,
      response_rate_percentile: percentiles.responseRate,
      interview_rate_percentile: percentiles.interviewRate,
      offer_rate_percentile: percentiles.offerRate,
      skills_depth_percentile: percentiles.skillsDepth,
      skills_relevance_percentile: skillGaps.skillMatchPercentage,
      vs_peer_application_rate: peerBenchmark
        ? userMetrics.applicationsPerMonth / peerBenchmark.avg_applications_per_month
        : 1,
      vs_peer_response_rate: peerBenchmark
        ? userMetrics.responseRate / peerBenchmark.avg_response_rate
        : 1,
      vs_peer_interview_rate: peerBenchmark
        ? userMetrics.interviewRate / peerBenchmark.avg_interview_rate
        : 1,
      vs_peer_offer_rate: peerBenchmark
        ? userMetrics.offerRate / peerBenchmark.avg_offer_rate
        : 1,
      competitive_strengths: competitiveStrengths,
      competitive_gaps: competitiveGaps,
      differentiation_factors: [],  // TODO: Extract from strategies
      positioning_recommendations: advantages,
      profile_version: profileVersion,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Error caching competitive position:", error);
  }
}

/**
 * Helper functions
 */

function normalizeTitleCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("engineer") || lowerTitle.includes("developer")) return "Software Engineer";
  if (lowerTitle.includes("manager")) return "Manager";
  if (lowerTitle.includes("analyst")) return "Analyst";
  if (lowerTitle.includes("designer")) return "Designer";
  return "Other";
}

function calculateDelta(userValue: number, benchmarkValue: number): number {
  if (benchmarkValue === 0) return 0;
  return ((userValue - benchmarkValue) / benchmarkValue) * 100;
}

function getDefaultMetrics(): UserMetrics {
  return {
    applicationsPerMonth: 0,
    responseRate: 0,
    interviewRate: 0,
    offerRate: 0,
    avgTimeToInterview: 0,
    avgTimeToOffer: 0,
    totalSkills: 0,
    skillsByCategory: {},
  };
}

function getFallbackPeerBenchmark(industry: string, experienceLevel: string): PeerBenchmark {
  // Fallback values when no peer data exists
  return {
    industry,
    experience_level: experienceLevel,
    avg_applications_per_month: 10,
    avg_response_rate: 0.20,
    avg_interview_rate: 0.12,
    avg_offer_rate: 0.06,
    avg_time_to_first_interview_days: 14,
    avg_time_to_offer_days: 45,
    top_required_skills: [],
    top_missing_skills: [],
    avg_skills_per_profile: 15,
    median_salary: 80000,
    sample_size: 0,
  };
}
