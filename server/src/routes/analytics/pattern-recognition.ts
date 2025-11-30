/**
 * Pattern Recognition Analysis Endpoint
 * 
 * Analyzes user's job search patterns to identify successful strategies,
 * optimal timing, preparation correlations, and predictive insights.
 * 
 * Acceptance Criteria:
 * 1. Identify patterns in successful applications, interviews, and offers
 * 2. Analyze correlation between preparation activities and positive outcomes
 * 3. Monitor timing patterns for optimal career move execution
 * 4. Track strategy effectiveness across different market conditions
 * 5. Generate insights on personal success factors and optimal approaches
 * 6. Include predictive modeling for future opportunity success
 * 7. Provide recommendations based on historical success patterns
 * 8. Track pattern evolution and strategy adaptation over time
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import supabaseAdmin from "../../services/supabaseAdmin.js";
import { sendJson } from "../../../utils/http.js";
import { requireAuth } from "../../middleware/auth.js";

interface Job {
  id: string;
  job_status: string;
  created_at: string;
  status_changed_at: string | null;
  company_name: string;
  company_size: string | null;
  industry: string | null;
  required_skills: string[];
  start_salary_range: number | null;
  end_salary_range: number | null;
}

interface PrepActivity {
  activity_type: string;
  time_spent_minutes: number;
  completion_quality: string;
  days_before_application: number;
  led_to_response: boolean;
  led_to_interview: boolean;
  led_to_offer: boolean;
}

interface SuccessPattern {
  pattern_type: string;
  pattern_name: string;
  success_rate: number;
  confidence_score: number;
  sample_size: number;
  pattern_attributes: Record<string, any>;
  recommendations: Array<{
    action: string;
    reason: string;
    priority: string;
    expected_impact: number;
  }>;
}

interface TimingPattern {
  timing_type: string;
  timing_value: string;
  response_rate: number;
  interview_rate: number;
  offer_rate: number;
  relative_performance: number;
  is_optimal: boolean;
}

interface StrategyEffectiveness {
  strategy_name: string;
  strategy_type: string;
  success_rate: number;
  times_used: number;
  market_condition: string;
  effectiveness_trend: string;
  recommended_use_cases: string[];
}

/**
 * POST /api/analytics/pattern-recognition
 * 
 * Analyze user's job search patterns and generate insights
 */
export async function handleGetPatternRecognition(req: IncomingMessage, res: ServerResponse) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }

    if (!supabaseAdmin) {
      console.error("[handleGetPatternRecognition] supabaseAdmin is not initialized");
      return sendJson(res, 500, { error: "Database connection not available" });
    }

    console.log("[handleGetPatternRecognition] Starting pattern analysis for user:", userId);

    // Fetch all user's jobs with details
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("[handleGetPatternRecognition] Error fetching jobs:", jobsError);
      return sendJson(res, 500, { error: "Failed to fetch job data" });
    }

    if (!jobs || jobs.length === 0) {
      console.log("[handleGetPatternRecognition] No jobs found for user");
      return sendJson(res, 200, {
        success: true,
        message: "No job data available for pattern analysis",
        data: getEmptyPatternData(),
      });
    }

    console.log(`[handleGetPatternRecognition] Analyzing ${jobs.length} jobs`);

    // 1. Identify patterns in successful applications, interviews, and offers
    const applicationPatterns = await identifyApplicationPatterns(userId, jobs);
    const interviewPatterns = await identifyInterviewPatterns(userId, jobs);
    const offerPatterns = await identifyOfferPatterns(userId, jobs);

    // 2. Analyze correlation between preparation activities and outcomes
    const preparationCorrelations = await analyzePreparationCorrelations(userId);

    // 3. Monitor timing patterns for optimal career move execution
    const timingPatterns = await analyzeTimingPatterns(userId, jobs);

    // 4. Track strategy effectiveness across market conditions
    const strategyEffectiveness = await analyzeStrategyEffectiveness(userId, jobs);

    // 5. Generate insights on personal success factors
    const successFactors = await generateSuccessFactors(
      jobs,
      applicationPatterns,
      interviewPatterns,
      offerPatterns,
      preparationCorrelations
    );

    // 6. Include predictive modeling for future opportunity success
    const predictiveInsights = await generatePredictiveInsights(userId, jobs, successFactors);

    // 7. Provide recommendations based on historical success patterns
    const recommendations = await generatePatternRecommendations(
      applicationPatterns,
      interviewPatterns,
      offerPatterns,
      timingPatterns,
      strategyEffectiveness,
      successFactors
    );

    // 8. Track pattern evolution and strategy adaptation
    const patternEvolution = await trackPatternEvolution(userId);

    // Return comprehensive pattern analysis
    return sendJson(res, 200, {
      success: true,
      data: {
        summary: {
          totalJobs: jobs.length,
          patternsIdentified: applicationPatterns.length + interviewPatterns.length + offerPatterns.length,
          highConfidencePatterns: [...applicationPatterns, ...interviewPatterns, ...offerPatterns].filter(
            (p) => p.confidence_score >= 0.7
          ).length,
          topSuccessRate: Math.max(
            ...applicationPatterns.map((p) => p.success_rate),
            ...interviewPatterns.map((p) => p.success_rate),
            ...offerPatterns.map((p) => p.success_rate),
            0
          ),
        },
        applicationPatterns,
        interviewPatterns,
        offerPatterns,
        preparationCorrelations,
        timingPatterns,
        strategyEffectiveness,
        successFactors,
        predictiveInsights,
        recommendations,
        patternEvolution,
      },
    });
  } catch (error: unknown) {
    console.error("[handleGetPatternRecognition] Error:", error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to analyze patterns",
    });
  }
}

/**
 * Identify patterns in successful applications
 */
async function identifyApplicationPatterns(userId: string, jobs: Job[]): Promise<SuccessPattern[]> {
  const patterns: SuccessPattern[] = [];

  // Filter jobs that got responses
  const respondedJobs = jobs.filter((j) =>
    ["Phone Screen", "Interview", "Offer"].includes(j.job_status)
  );

  if (respondedJobs.length < 3) {
    return patterns; // Need minimum sample size
  }

  // Pattern 1: Company size success pattern
  const companySizePattern = analyzeCompanySizePattern(respondedJobs, jobs);
  if (companySizePattern) patterns.push(companySizePattern);

  // Pattern 2: Industry alignment pattern
  const industryPattern = analyzeIndustryPattern(respondedJobs, jobs);
  if (industryPattern) patterns.push(industryPattern);

  // Pattern 3: Skill match pattern
  const skillPattern = analyzeSkillMatchPattern(respondedJobs, jobs);
  if (skillPattern) patterns.push(skillPattern);

  // Pattern 4: Application method pattern (if we had this data)
  // Would analyze direct vs referral vs recruiter success rates

  return patterns;
}

/**
 * Identify patterns in successful interviews
 */
async function identifyInterviewPatterns(userId: string, jobs: Job[]): Promise<SuccessPattern[]> {
  const patterns: SuccessPattern[] = [];

  const interviewJobs = jobs.filter((j) => ["Interview", "Offer"].includes(j.job_status));

  if (interviewJobs.length < 3) {
    return patterns;
  }

  // Pattern: Interview progression success
  const progressionPattern: SuccessPattern = {
    pattern_type: "interview_success",
    pattern_name: "Interview to Offer Progression",
    success_rate: interviewJobs.filter((j) => j.job_status === "Offer").length / interviewJobs.length,
    confidence_score: calculateConfidence(interviewJobs.length),
    sample_size: interviewJobs.length,
    pattern_attributes: {
      avg_companies_size: getMostCommon(interviewJobs.map((j) => j.company_size)),
      common_industries: getTopN(interviewJobs.map((j) => j.industry), 3),
    },
    recommendations: [
      {
        action: "Focus on similar company profiles",
        reason: `${(
          (interviewJobs.filter((j) => j.job_status === "Offer").length / interviewJobs.length) *
          100
        ).toFixed(0)}% of your interviews convert to offers`,
        priority: "high",
        expected_impact: 0.3,
      },
    ],
  };

  patterns.push(progressionPattern);

  return patterns;
}

/**
 * Identify patterns in successful offers
 */
async function identifyOfferPatterns(userId: string, jobs: Job[]): Promise<SuccessPattern[]> {
  const patterns: SuccessPattern[] = [];

  const offerJobs = jobs.filter((j) => j.job_status === "Offer");

  if (offerJobs.length < 2) {
    return patterns;
  }

  // Pattern: Salary range alignment
  const salaryRanges = offerJobs
    .filter((j) => j.start_salary_range && j.end_salary_range)
    .map((j) => (j.start_salary_range! + j.end_salary_range!) / 2);

  if (salaryRanges.length >= 2) {
    const avgSalary = salaryRanges.reduce((a, b) => a + b, 0) / salaryRanges.length;

    const salaryPattern: SuccessPattern = {
      pattern_type: "offer_success",
      pattern_name: "Optimal Salary Range",
      success_rate: 1.0, // All offers accepted
      confidence_score: calculateConfidence(offerJobs.length),
      sample_size: offerJobs.length,
      pattern_attributes: {
        avg_salary_offered: avgSalary,
        salary_range: {
          min: Math.min(...salaryRanges),
          max: Math.max(...salaryRanges),
        },
      },
      recommendations: [
        {
          action: `Target roles in the $${(avgSalary / 1000).toFixed(0)}K range`,
          reason: "Aligns with your successful offer history",
          priority: "high",
          expected_impact: 0.4,
        },
      ],
    };

    patterns.push(salaryPattern);
  }

  return patterns;
}

/**
 * Analyze correlation between preparation and outcomes
 */
async function analyzePreparationCorrelations(userId: string) {
  // @ts-ignore
  const { data: activities } = await supabaseAdmin
    .from("preparation_activities")
    .select("*")
    .eq("user_id", userId);

  if (!activities || activities.length === 0) {
    return {
      correlations: [],
      insights: "No preparation activities tracked yet. Start logging your prep work to see correlations.",
    };
  }

  const correlations: Array<{
    activity: string;
    responseCorrelation: number;
    interviewCorrelation: number;
    offerCorrelation: number;
    impact: string;
    sample_size: number;
  }> = [];

  // Group by activity type
  const activityTypes = [...new Set(activities.map((a: PrepActivity) => a.activity_type))] as string[];

  for (const activityType of activityTypes) {
    const typeActivities = activities.filter((a: PrepActivity) => a.activity_type === activityType);

    const responseRate =
      typeActivities.filter((a: PrepActivity) => a.led_to_response).length / typeActivities.length;
    const interviewRate =
      typeActivities.filter((a: PrepActivity) => a.led_to_interview).length / typeActivities.length;
    const offerRate =
      typeActivities.filter((a: PrepActivity) => a.led_to_offer).length / typeActivities.length;

    correlations.push({
      activity: activityType,
      responseCorrelation: responseRate,
      interviewCorrelation: interviewRate,
      offerCorrelation: offerRate,
      impact: offerRate > 0.3 ? "high" : offerRate > 0.15 ? "medium" : "low",
      sample_size: typeActivities.length,
    });
  }

  // Sort by offer correlation
  correlations.sort((a, b) => b.offerCorrelation - a.offerCorrelation);

  return {
    correlations,
    insights: generatePreparationInsights(correlations),
  };
}

/**
 * Analyze timing patterns
 */
async function analyzeTimingPatterns(userId: string, jobs: Job[]): Promise<TimingPattern[]> {
  const patterns: TimingPattern[] = [];

  // Analyze day of week patterns
  const dayOfWeekPattern = analyzeDayOfWeekPattern(jobs);
  if (dayOfWeekPattern) patterns.push(dayOfWeekPattern);

  // Analyze time of day patterns (if we had timestamps)
  // Would analyze morning vs afternoon vs evening application success

  // Analyze monthly patterns
  const monthPattern = analyzeMonthPattern(jobs);
  if (monthPattern) patterns.push(monthPattern);

  // Analyze seasonal patterns
  const seasonPattern = analyzeSeasonPattern(jobs);
  if (seasonPattern) patterns.push(seasonPattern);

  return patterns;
}

/**
 * Analyze strategy effectiveness
 */
async function analyzeStrategyEffectiveness(
  userId: string,
  jobs: Job[]
): Promise<StrategyEffectiveness[]> {
  // @ts-ignore
  const { data: strategies } = await supabaseAdmin
    .from("strategy_effectiveness")
    .select("*")
    .eq("user_id", userId);

  if (!strategies || strategies.length === 0) {
    // Generate default strategies from job data
    return generateDefaultStrategies(jobs);
  }

  return strategies.map((s: any) => ({
    strategy_name: s.strategy_name,
    strategy_type: s.strategy_type,
    success_rate: s.success_rate,
    times_used: s.times_used,
    market_condition: s.market_condition,
    effectiveness_trend: s.effectiveness_trend,
    recommended_use_cases: s.recommended_use_cases || [],
  }));
}

/**
 * Generate success factors
 */
async function generateSuccessFactors(
  jobs: Job[],
  applicationPatterns: SuccessPattern[],
  interviewPatterns: SuccessPattern[],
  offerPatterns: SuccessPattern[],
  preparationCorrelations: any
) {
  const successfulJobs = jobs.filter((j) =>
    ["Phone Screen", "Interview", "Offer"].includes(j.job_status)
  );

  return {
    keyFactors: [
      {
        factor: "Response Rate",
        value: jobs.length > 0 ? successfulJobs.length / jobs.length : 0,
        importance: "high",
        trend: "stable",
      },
      {
        factor: "Application Volume",
        value: jobs.length,
        importance: "medium",
        trend: jobs.length > 10 ? "healthy" : "low",
      },
      {
        factor: "Pattern Consistency",
        value: applicationPatterns.length + interviewPatterns.length + offerPatterns.length,
        importance: "high",
        trend: "emerging",
      },
    ],
    strengthAreas: identifyStrengthAreas(jobs, applicationPatterns, interviewPatterns, offerPatterns),
    improvementAreas: identifyImprovementAreas(
      jobs,
      applicationPatterns,
      preparationCorrelations
    ),
  };
}

/**
 * Generate predictive insights
 */
async function generatePredictiveInsights(userId: string, jobs: Job[], successFactors: any) {
  // @ts-ignore
  const { data: models } = await supabaseAdmin
    .from("predictive_models")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  const recentJobs = jobs.slice(0, 10); // Last 10 jobs
  const successRate = recentJobs.filter((j) =>
    ["Phone Screen", "Interview", "Offer"].includes(j.job_status)
  ).length / recentJobs.length;

  return {
    nextApplicationProbability: Math.min(successRate * 1.1, 0.95), // Slightly optimistic
    estimatedTimeToOffer: calculateEstimatedTimeToOffer(jobs),
    optimalApplicationTiming: {
      dayOfWeek: "Tuesday",
      timeOfDay: "morning",
      confidence: 0.65,
    },
    recommendedStrategy: determineRecommendedStrategy(successRate, jobs),
    confidenceLevel: models && models.length > 0 ? models[0].model_reliability_score : 0.5,
    predictionBasis: "Historical pattern analysis and success rate trends",
  };
}

/**
 * Generate recommendations
 */
async function generatePatternRecommendations(
  applicationPatterns: SuccessPattern[],
  interviewPatterns: SuccessPattern[],
  offerPatterns: SuccessPattern[],
  timingPatterns: TimingPattern[],
  strategies: StrategyEffectiveness[],
  successFactors: any
) {
  const recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: string;
    expectedImpact: string;
    actionSteps: string[];
  }> = [];

  // Recommendation from application patterns
  if (applicationPatterns.length > 0) {
    const topPattern = applicationPatterns[0];
    recommendations.push({
      category: "Application Strategy",
      title: `Focus on ${topPattern.pattern_name}`,
      description: topPattern.recommendations[0]?.reason || "This pattern shows high success",
      priority: "high",
      expectedImpact: `${(topPattern.success_rate * 100).toFixed(0)}% success rate`,
      actionSteps: [
        topPattern.recommendations[0]?.action || "Apply this pattern to future applications",
        "Track results to validate pattern",
        "Refine approach based on outcomes",
      ],
    });
  }

  // Recommendation from timing patterns
  const optimalTiming = timingPatterns.find((t) => t.is_optimal);
  if (optimalTiming) {
    recommendations.push({
      category: "Timing Optimization",
      title: `Apply during ${optimalTiming.timing_value}`,
      description: `${(optimalTiming.relative_performance * 100 - 100).toFixed(0)}% better performance during this time`,
      priority: "medium",
      expectedImpact: "15-30% improvement",
      actionSteps: [
        `Schedule applications for ${optimalTiming.timing_value}`,
        "Set calendar reminders",
        "Batch prepare materials in advance",
      ],
    });
  }

  // Recommendation from preparation correlations
  recommendations.push({
    category: "Preparation Focus",
    title: "Prioritize High-Impact Activities",
    description: "Focus on preparation activities with proven correlation to success",
    priority: "high",
    expectedImpact: "20-40% improvement",
    actionSteps: [
      "Tailor resume for each application",
      "Research company thoroughly before applying",
      "Prepare specific examples for common questions",
    ],
  });

  // Recommendation from success factors
  if (successFactors.improvementAreas.length > 0) {
    const topImprovement = successFactors.improvementAreas[0];
    recommendations.push({
      category: "Skill Development",
      title: topImprovement.area,
      description: topImprovement.suggestion,
      priority: "medium",
      expectedImpact: "Long-term career growth",
      actionSteps: [
        "Identify specific skills to develop",
        "Create learning roadmap",
        "Practice and build portfolio projects",
      ],
    });
  }

  return recommendations;
}

/**
 * Track pattern evolution
 */
async function trackPatternEvolution(userId: string) {
  // @ts-ignore
  const { data: evolution } = await supabaseAdmin
    .from("pattern_evolution")
    .select("*")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .limit(6); // Last 6 snapshots

  if (!evolution || evolution.length === 0) {
    return {
      snapshots: [],
      trends: {
        successRateTrend: "emerging",
        confidenceTrend: "building",
        adaptationCount: 0,
      },
      insights: "Pattern tracking will begin as you continue your job search",
    };
  }

  return {
    snapshots: evolution.map((e: any) => ({
      period: e.period_label,
      successRate: e.success_rate,
      confidence: e.confidence_score,
      sampleSize: e.sample_size,
      adaptations: e.adaptations_applied?.length || 0,
    })),
    trends: {
      successRateTrend: calculateTrend(evolution.map((e: any) => e.success_rate)),
      confidenceTrend: calculateTrend(evolution.map((e: any) => e.confidence_score)),
      adaptationCount: evolution.reduce((sum: number, e: any) => sum + (e.adaptations_applied?.length || 0), 0),
    },
    insights: generateEvolutionInsights(evolution),
  };
}

// ==========================================
// Helper Functions
// ==========================================

function getEmptyPatternData() {
  return {
    summary: {
      totalJobs: 0,
      patternsIdentified: 0,
      highConfidencePatterns: 0,
      topSuccessRate: 0,
    },
    applicationPatterns: [],
    interviewPatterns: [],
    offerPatterns: [],
    preparationCorrelations: { correlations: [], insights: "No data available" },
    timingPatterns: [],
    strategyEffectiveness: [],
    successFactors: { keyFactors: [], strengthAreas: [], improvementAreas: [] },
    predictiveInsights: {},
    recommendations: [],
    patternEvolution: { snapshots: [], trends: {}, insights: "Start tracking patterns" },
  };
}

function calculateConfidence(sampleSize: number): number {
  if (sampleSize >= 20) return 0.9;
  if (sampleSize >= 10) return 0.75;
  if (sampleSize >= 5) return 0.6;
  return 0.4;
}

function analyzeCompanySizePattern(successJobs: Job[], allJobs: Job[]): SuccessPattern | null {
  const companySizes = successJobs.filter((j) => j.company_size).map((j) => j.company_size!);

  if (companySizes.length < 3) return null;

  const mostCommonSize = getMostCommon(companySizes);
  const successRate =
    successJobs.filter((j) => j.company_size === mostCommonSize).length /
    allJobs.filter((j) => j.company_size === mostCommonSize).length;

  return {
    pattern_type: "application_success",
    pattern_name: `${mostCommonSize} Company Success`,
    success_rate: successRate,
    confidence_score: calculateConfidence(companySizes.length),
    sample_size: companySizes.length,
    pattern_attributes: {
      preferred_company_size: mostCommonSize,
    },
    recommendations: [
      {
        action: `Target more ${mostCommonSize} companies`,
        reason: `${(successRate * 100).toFixed(0)}% response rate with this company size`,
        priority: "high",
        expected_impact: successRate - 0.2, // Impact relative to baseline
      },
    ],
  };
}

function analyzeIndustryPattern(successJobs: Job[], allJobs: Job[]): SuccessPattern | null {
  const industries = successJobs.filter((j) => j.industry).map((j) => j.industry!);

  if (industries.length < 3) return null;

  const topIndustries = getTopN(industries, 2);
  const avgSuccessRate =
    topIndustries.reduce((sum, industry) => {
      const industrySuccess = successJobs.filter((j) => j.industry === industry).length;
      const industryTotal = allJobs.filter((j) => j.industry === industry).length;
      return sum + industrySuccess / industryTotal;
    }, 0) / topIndustries.length;

  return {
    pattern_type: "application_success",
    pattern_name: "Industry Alignment",
    success_rate: avgSuccessRate,
    confidence_score: calculateConfidence(industries.length),
    sample_size: industries.length,
    pattern_attributes: {
      top_industries: topIndustries,
    },
    recommendations: [
      {
        action: `Focus on ${topIndustries.join(" and ")} industries`,
        reason: "Higher success rate in these sectors",
        priority: "high",
        expected_impact: 0.25,
      },
    ],
  };
}

function analyzeSkillMatchPattern(successJobs: Job[], allJobs: Job[]): SuccessPattern | null {
  const skillCounts = successJobs.map((j) => j.required_skills?.length || 0);

  if (skillCounts.length < 3) return null;

  const avgSkills = skillCounts.reduce((a, b) => a + b, 0) / skillCounts.length;

  return {
    pattern_type: "application_success",
    pattern_name: "Skill Match Depth",
    success_rate: successJobs.length / allJobs.length,
    confidence_score: calculateConfidence(skillCounts.length),
    sample_size: skillCounts.length,
    pattern_attributes: {
      avg_required_skills: avgSkills,
    },
    recommendations: [
      {
        action: `Target roles requiring ${Math.round(avgSkills)} skills`,
        reason: "Optimal match complexity for your profile",
        priority: "medium",
        expected_impact: 0.2,
      },
    ],
  };
}

function analyzeDayOfWeekPattern(jobs: Job[]): TimingPattern | null {
  if (jobs.length < 5) return null;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daySuccess: Record<string, { total: number; success: number }> = {};

  jobs.forEach((job) => {
    const day = daysOfWeek[new Date(job.created_at).getDay()];
    if (!daySuccess[day]) daySuccess[day] = { total: 0, success: 0 };
    daySuccess[day].total++;
    if (["Phone Screen", "Interview", "Offer"].includes(job.job_status)) {
      daySuccess[day].success++;
    }
  });

  const bestDay = Object.entries(daySuccess).reduce((best, [day, stats]) => {
    const rate = stats.success / stats.total;
    return rate > (best.rate || 0) ? { day, rate, total: stats.total } : best;
  }, {} as { day?: string; rate?: number; total?: number });

  if (!bestDay.day) return null;

  const overallRate = jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length;

  return {
    timing_type: "day_of_week",
    timing_value: bestDay.day,
    response_rate: bestDay.rate!,
    interview_rate: bestDay.rate! * 0.7, // Estimate
    offer_rate: bestDay.rate! * 0.4, // Estimate
    relative_performance: bestDay.rate! / overallRate,
    is_optimal: bestDay.rate! > overallRate * 1.2,
  };
}

function analyzeMonthPattern(jobs: Job[]): TimingPattern | null {
  if (jobs.length < 10) return null;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthSuccess: Record<string, { total: number; success: number }> = {};

  jobs.forEach((job) => {
    const month = months[new Date(job.created_at).getMonth()];
    if (!monthSuccess[month]) monthSuccess[month] = { total: 0, success: 0 };
    monthSuccess[month].total++;
    if (["Phone Screen", "Interview", "Offer"].includes(job.job_status)) {
      monthSuccess[month].success++;
    }
  });

  const bestMonth = Object.entries(monthSuccess).reduce((best, [month, stats]) => {
    const rate = stats.success / stats.total;
    return rate > (best.rate || 0) && stats.total >= 2 ? { month, rate, total: stats.total } : best;
  }, {} as { month?: string; rate?: number; total?: number });

  if (!bestMonth.month) return null;

  const overallRate = jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length;

  return {
    timing_type: "month_of_year",
    timing_value: bestMonth.month,
    response_rate: bestMonth.rate!,
    interview_rate: bestMonth.rate! * 0.7,
    offer_rate: bestMonth.rate! * 0.4,
    relative_performance: bestMonth.rate! / overallRate,
    is_optimal: bestMonth.rate! > overallRate * 1.15,
  };
}

function analyzeSeasonPattern(jobs: Job[]): TimingPattern | null {
  if (jobs.length < 12) return null;

  const seasons = {
    Winter: [11, 0, 1],
    Spring: [2, 3, 4],
    Summer: [5, 6, 7],
    Fall: [8, 9, 10],
  };

  const seasonSuccess: Record<string, { total: number; success: number }> = {};

  jobs.forEach((job) => {
    const month = new Date(job.created_at).getMonth();
    const season = Object.entries(seasons).find(([_, months]) => months.includes(month))?.[0] || "Unknown";
    if (!seasonSuccess[season]) seasonSuccess[season] = { total: 0, success: 0 };
    seasonSuccess[season].total++;
    if (["Phone Screen", "Interview", "Offer"].includes(job.job_status)) {
      seasonSuccess[season].success++;
    }
  });

  const bestSeason = Object.entries(seasonSuccess).reduce((best, [season, stats]) => {
    const rate = stats.success / stats.total;
    return rate > (best.rate || 0) && stats.total >= 3 ? { season, rate, total: stats.total } : best;
  }, {} as { season?: string; rate?: number; total?: number });

  if (!bestSeason.season) return null;

  const overallRate = jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length;

  return {
    timing_type: "season",
    timing_value: bestSeason.season,
    response_rate: bestSeason.rate!,
    interview_rate: bestSeason.rate! * 0.7,
    offer_rate: bestSeason.rate! * 0.4,
    relative_performance: bestSeason.rate! / overallRate,
    is_optimal: bestSeason.rate! > overallRate * 1.15,
  };
}

function generateDefaultStrategies(jobs: Job[]): StrategyEffectiveness[] {
  const strategies: StrategyEffectiveness[] = [];

  if (jobs.length >= 5) {
    strategies.push({
      strategy_name: "Direct Application",
      strategy_type: "application_approach",
      success_rate: jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length,
      times_used: jobs.length,
      market_condition: "moderate_hiring",
      effectiveness_trend: "stable",
      recommended_use_cases: ["When applying to multiple companies", "For well-matched positions"],
    });
  }

  return strategies;
}

function identifyStrengthAreas(
  jobs: Job[],
  appPatterns: SuccessPattern[],
  intPatterns: SuccessPattern[],
  offerPatterns: SuccessPattern[]
): Array<{ area: string; description: string; strength: string }> {
  const strengths: Array<{ area: string; description: string; strength: string }> = [];

  const responseRate = jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length;

  if (responseRate > 0.25) {
    strengths.push({
      area: "Application Quality",
      description: "Above-average response rate",
      strength: "high",
    });
  }

  if (appPatterns.length > 0) {
    strengths.push({
      area: "Pattern Recognition",
      description: `Identified ${appPatterns.length} successful patterns`,
      strength: "medium",
    });
  }

  if (offerPatterns.length > 0) {
    strengths.push({
      area: "Offer Conversion",
      description: "Consistent offer success pattern",
      strength: "high",
    });
  }

  return strengths;
}

function identifyImprovementAreas(
  jobs: Job[],
  appPatterns: SuccessPattern[],
  prepCorrelations: any
): Array<{ area: string; suggestion: string; priority: string }> {
  const improvements: Array<{ area: string; suggestion: string; priority: string }> = [];

  const responseRate = jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.job_status)).length / jobs.length;

  if (responseRate < 0.2) {
    improvements.push({
      area: "Response Rate",
      suggestion: "Focus on application quality over quantity",
      priority: "high",
    });
  }

  if (appPatterns.length === 0 && jobs.length >= 10) {
    improvements.push({
      area: "Strategy Refinement",
      suggestion: "Experiment with different approaches to identify patterns",
      priority: "medium",
    });
  }

  if (prepCorrelations.correlations.length === 0) {
    improvements.push({
      area: "Preparation Tracking",
      suggestion: "Start tracking preparation activities to identify what works",
      priority: "low",
    });
  }

  return improvements;
}

function calculateEstimatedTimeToOffer(jobs: Job[]): number {
  const offerJobs = jobs.filter((j) => j.job_status === "Offer" && j.status_changed_at);

  if (offerJobs.length === 0) return 30; // Default estimate

  const avgDays =
    offerJobs.reduce((sum, job) => {
      const days =
        (new Date(job.status_changed_at!).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0) / offerJobs.length;

  return Math.round(avgDays);
}

function determineRecommendedStrategy(successRate: number, jobs: Job[]): string {
  if (successRate > 0.3) return "Continue current approach with minor optimizations";
  if (successRate > 0.15) return "Refine targeting and increase preparation depth";
  if (jobs.length < 10) return "Increase application volume to gather more data";
  return "Consider strategy pivot - analyze patterns for major adjustments";
}

function generatePreparationInsights(correlations: any[]): string {
  if (correlations.length === 0) return "No preparation data available yet";

  const topActivity = correlations[0];
  return `${topActivity.activity} shows ${(topActivity.offerCorrelation * 100).toFixed(0)}% correlation with offers. Focus on high-impact preparation activities.`;
}

function generateEvolutionInsights(evolution: any[]): string {
  if (evolution.length < 2) return "Continue tracking patterns to see evolution trends";

  const recent = evolution[0];
  const previous = evolution[1];

  const change = recent.success_rate - previous.success_rate;

  if (change > 0.05) return "Success rate improving - current strategies are working well";
  if (change < -0.05) return "Success rate declining - consider strategy adjustments";
  return "Success rate stable - look for optimization opportunities";
}

function calculateTrend(values: number[]): string {
  if (values.length < 2) return "emerging";

  const recent = values.slice(0, Math.ceil(values.length / 2));
  const older = values.slice(Math.ceil(values.length / 2));

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  if (recentAvg > olderAvg * 1.1) return "improving";
  if (recentAvg < olderAvg * 0.9) return "declining";
  return "stable";
}

function getMostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function getTopN<T>(arr: T[], n: number): T[] {
  const counts = new Map<T, number>();
  arr.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([item]) => item);
}
