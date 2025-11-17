/**
 * JOB MATCHING: POST /api/generate/job-match
 *
 * AI-powered job matching that compares user profile against job requirements.
 * Analyzes skills, experience, education to produce match score and insights.
 *
 * Flow: fetch user profile → fetch job details → AI analysis → score → persist artifact
 *
 * Inputs:
 * - headers: { 'X-User-Id': uuid }
 * - body: { jobId: number }
 *
 * Output:
 * - 200: { matchScore: number, skillsGaps: string[], strengths: string[], recommendations: string[], artifact: {...} }
 * - 400: validation error
 * - 500: matching failure
 *
 * Contract:
 * - Fetches user profile (skills, experience, education, projects)
 * - Fetches job details (requirements, qualifications, description)
 * - Uses AI to analyze compatibility
 * - Returns structured match analysis with 0-100 score
 * - Persists result as ai_artifacts (kind='match')
 *
 * Notes:
 * - Match score: 0-100 weighted by skills (40%), experience (30%), education (20%), fit (10%)
 * - Skills gaps: missing or weak skills user should develop
 * - Strengths: areas where user exceeds requirements
 * - Recommendations: actionable steps to improve match
 * - Cached: subsequent calls for same job return cached artifact
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { generate } from "../../services/aiClient.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

/**
 * Match analysis result structure
 */
interface MatchAnalysis {
  matchScore: number; // 0-100
  breakdown: {
    skills: number; // 0-100
    experience: number; // 0-100
    education: number; // 0-100
    culturalFit: number; // 0-100
  };
  skillsGaps: string[]; // Missing or weak skills
  strengths: string[]; // Areas where user excels
  recommendations: string[]; // Actionable improvement steps
  reasoning: string; // AI explanation of score
}

/**
 * Request body type
 */
interface JobMatchRequestBody {
  jobId: number;
}

/**
 * Fetch user profile data from Supabase
 */
async function fetchUserProfile(userId: string): Promise<{
  skills: Array<{ skill_name: string; proficiency_level: string }>;
  experience: Array<{
    job_title: string;
    company_name: string;
    job_description: string;
    start_date: string;
    end_date: string | null;
  }>;
  education: Array<{
    institution_name: string;
    degree_type: string;
    field_of_study: string;
    graduation_date: string | null;
  }>;
  projects: Array<{
    proj_name: string;
    proj_description: string;
    tech_and_skills: string[];
  }>;
  profile: {
    professional_title: string;
    summary: string;
    experience_level: string;
  };
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase not configured (missing URL or service role key)"
    );
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Fetch profile
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
    {
      headers,
    }
  );
  if (!profileRes.ok) throw new Error("Failed to fetch user profile");
  const profiles = (await profileRes.json()) as any[];
  const profile = profiles[0] || {};

  // Fetch skills
  const skillsRes = await fetch(
    `${supabaseUrl}/rest/v1/skills?user_id=eq.${userId}&select=*`,
    {
      headers,
    }
  );
  if (!skillsRes.ok) throw new Error("Failed to fetch skills");
  const skills = (await skillsRes.json()) as any[];

  // Fetch experience
  const expRes = await fetch(
    `${supabaseUrl}/rest/v1/employment?user_id=eq.${userId}&select=*`,
    {
      headers,
    }
  );
  if (!expRes.ok) throw new Error("Failed to fetch employment");
  const experience = (await expRes.json()) as any[];

  // Fetch education
  const eduRes = await fetch(
    `${supabaseUrl}/rest/v1/education?user_id=eq.${userId}&select=*`,
    {
      headers,
    }
  );
  if (!eduRes.ok) throw new Error("Failed to fetch education");
  const education = (await eduRes.json()) as any[];

  // Fetch projects
  const projRes = await fetch(
    `${supabaseUrl}/rest/v1/projects?user_id=eq.${userId}&select=*`,
    {
      headers,
    }
  );
  if (!projRes.ok) throw new Error("Failed to fetch projects");
  const projects = (await projRes.json()) as any[];

  return { skills, experience, education, projects, profile };
}

/**
 * Fetch job details from Supabase
 */
async function fetchJobDetails(
  userId: string,
  jobId: number
): Promise<{
  job_title: string;
  company_name: string;
  job_description: string;
  industry: string;
  job_type: string;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const res = await fetch(
    `${supabaseUrl}/rest/v1/jobs?id=eq.${jobId}&user_id=eq.${userId}&select=*`,
    { headers }
  );

  if (!res.ok) throw new Error("Failed to fetch job details");

  const jobs = (await res.json()) as any[];
  if (!jobs || jobs.length === 0) {
    throw new Error("Job not found or does not belong to user");
  }

  return jobs[0];
}

/**
 * Build AI prompt for job matching analysis
 */
function buildMatchPrompt(
  userProfile: Awaited<ReturnType<typeof fetchUserProfile>>,
  job: Awaited<ReturnType<typeof fetchJobDetails>>
): string {
  const skillsList =
    userProfile.skills
      .map((s) => `${s.skill_name} (${s.proficiency_level})`)
      .join(", ") || "None listed";

  const experienceSummary =
    userProfile.experience
      .map(
        (e) =>
          `${e.job_title} at ${e.company_name} (${e.start_date} - ${
            e.end_date || "Present"
          })`
      )
      .join("; ") || "No experience listed";

  const educationSummary =
    userProfile.education
      .map(
        (e) =>
          `${e.degree_type} in ${e.field_of_study} from ${e.institution_name}`
      )
      .join("; ") || "No education listed";

  const projectsSummary =
    userProfile.projects
      .map((p) => `${p.proj_name}: ${p.tech_and_skills?.join(", ") || ""}`)
      .join("; ") || "No projects listed";

  return `You are a job matching AI assistant. Analyze how well this candidate matches the job requirements.

**Candidate Profile:**
- Professional Title: ${
    userProfile.profile.professional_title || "Not specified"
  }
- Experience Level: ${userProfile.profile.experience_level || "Not specified"}
- Summary: ${userProfile.profile.summary || "Not provided"}
- Skills: ${skillsList}
- Work Experience: ${experienceSummary}
- Education: ${educationSummary}
- Projects: ${projectsSummary}

**Job Requirements:**
- Title: ${job.job_title}
- Company: ${job.company_name}
- Industry: ${job.industry || "Not specified"}
- Type: ${job.job_type || "Not specified"}
- Description: ${job.job_description || "No description provided"}

**Analysis Task:**
Provide a comprehensive job match analysis in JSON format with:

1. **matchScore** (number 0-100): Overall compatibility score
2. **breakdown** (object):
   - skills (0-100): How well candidate's skills match requirements
   - experience (0-100): Relevance and level of work experience
   - education (0-100): Educational background alignment
   - culturalFit (0-100): Soft skills, industry fit, role alignment
3. **skillsGaps** (array of strings): Specific skills candidate lacks or should improve (max 5)
4. **strengths** (array of strings): Areas where candidate exceeds requirements (max 5)
5. **recommendations** (array of strings): Actionable steps to improve match (max 5)
6. **reasoning** (string): Brief explanation of the score (2-3 sentences)

**Scoring Guidelines:**
- 90-100: Excellent match, candidate exceeds requirements
- 70-89: Good match, candidate meets most requirements
- 50-69: Fair match, candidate has potential but gaps exist
- 30-49: Poor match, significant gaps in qualifications
- 0-29: Not a match, fundamental requirements not met

**Important:**
- Be realistic and honest in scoring
- Focus on objective qualifications over subjective factors
- Provide specific, actionable recommendations
- Identify concrete skill gaps, not general statements
- Highlight genuine strengths that align with role

Return ONLY valid JSON with no markdown formatting.`;
}

/**
 * Parse AI match result
 */
function parseMatchResult(aiResult: any): MatchAnalysis {
  const parsed = aiResult.json || aiResult;

  // Validate and normalize
  const matchScore = Math.max(0, Math.min(100, Number(parsed.matchScore) || 0));

  const breakdown = {
    skills: Math.max(0, Math.min(100, Number(parsed.breakdown?.skills) || 0)),
    experience: Math.max(
      0,
      Math.min(100, Number(parsed.breakdown?.experience) || 0)
    ),
    education: Math.max(
      0,
      Math.min(100, Number(parsed.breakdown?.education) || 0)
    ),
    culturalFit: Math.max(
      0,
      Math.min(100, Number(parsed.breakdown?.culturalFit) || 0)
    ),
  };

  const skillsGaps = Array.isArray(parsed.skillsGaps)
    ? parsed.skillsGaps
        .filter((s: unknown) => typeof s === "string")
        .slice(0, 5)
    : [];

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter((s: unknown) => typeof s === "string").slice(0, 5)
    : [];

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
        .filter((s: unknown) => typeof s === "string")
        .slice(0, 5)
    : [];

  const reasoning =
    String(parsed.reasoning || "").trim() || "No reasoning provided";

  return {
    matchScore,
    breakdown,
    skillsGaps,
    strengths,
    recommendations,
    reasoning,
  };
}

/**
 * Persist match artifact to Supabase
 */
async function persistMatchArtifact(
  userId: string,
  jobId: number,
  analysis: MatchAnalysis
): Promise<{ id: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };

  const payload = {
    user_id: userId,
    job_id: jobId,
    kind: "match",
    title: `Job Match Analysis`,
    content: analysis,
    metadata: {
      match_score: analysis.matchScore,
      generated_at: new Date().toISOString(),
    },
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/ai_artifacts`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to persist artifact: ${error}`);
  }

  const artifacts = (await res.json()) as any[];
  return { id: artifacts[0]?.id || "" };
}

/**
 * Check for existing match artifact (cache)
 */
async function getExistingMatch(
  userId: string,
  jobId: number
): Promise<{ id: string; content: MatchAnalysis } | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null; // Skip cache if Supabase not configured
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_artifacts?user_id=eq.${userId}&job_id=eq.${jobId}&kind=eq.match&select=id,content&order=created_at.desc&limit=1`,
    { headers }
  );

  if (!res.ok) return null;

  const artifacts = (await res.json()) as any[];
  if (!artifacts || artifacts.length === 0) return null;

  return {
    id: artifacts[0].id,
    content: artifacts[0].content as MatchAnalysis,
  };
}

/**
 * POST /api/generate/job-match
 * Generate AI job match analysis
 *
 * Rate limit: 5 requests per minute per user
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (5/min per user)
  const limit = checkLimit(`job-match:${userId}`, 5, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  // Parse request body
  let body: any;
  try {
    body = await readJson(req);
  } catch (err: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Validate jobId
  const jobId = body?.jobId;
  if (jobId === undefined || jobId === null || Number.isNaN(Number(jobId))) {
    throw new ApiError(
      400,
      "jobId is required and must be a number",
      "bad_request"
    );
  }

  logInfo("job_match_request", { userId, jobId, reqId });

  counters.generate_total++;
  const start = Date.now();

  try {
    // Check for existing match (cache)
    const existing = await getExistingMatch(userId, Number(jobId));
    if (existing) {
      logInfo("job_match_cache_hit", {
        userId,
        jobId,
        reqId,
        artifactId: existing.id,
      });
      counters.generate_success++;

      sendJson(res, 200, {
        matchScore: existing.content.matchScore,
        breakdown: existing.content.breakdown,
        skillsGaps: existing.content.skillsGaps,
        strengths: existing.content.strengths,
        recommendations: existing.content.recommendations,
        reasoning: existing.content.reasoning,
        artifact: {
          id: existing.id,
          cached: true,
        },
        meta: {
          latency_ms: Date.now() - start,
          cached: true,
        },
      });
      return;
    }

    // Step 1: Fetch user profile
    const userProfile = await fetchUserProfile(userId);

    // Step 2: Fetch job details
    const jobDetails = await fetchJobDetails(userId, Number(jobId));

    // Step 3: Build AI prompt
    const prompt = buildMatchPrompt(userProfile, jobDetails);

    // Step 4: Call AI for analysis
    const aiResult = await generate("job-match", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.2, // Slightly higher for nuanced analysis
      maxTokens: 1500,
    });

    // Step 5: Parse result
    const analysis = parseMatchResult(aiResult);

    // Step 6: Persist artifact
    let artifactId: string | null = null;
    try {
      const artifact = await persistMatchArtifact(
        userId,
        Number(jobId),
        analysis
      );
      artifactId = artifact.id;
    } catch (persistError: any) {
      logError("job_match_persist_failed", {
        reqId,
        userId,
        jobId,
        error: persistError?.message,
      });
      // Continue even if persist fails
    }

    const latencyMs = Date.now() - start;

    logInfo("job_match_success", {
      userId,
      jobId,
      reqId,
      matchScore: analysis.matchScore,
      artifactId,
      latency_ms: latencyMs,
    });

    counters.generate_success++;

    // Return match analysis
    sendJson(res, 200, {
      matchScore: analysis.matchScore,
      breakdown: analysis.breakdown,
      skillsGaps: analysis.skillsGaps,
      strengths: analysis.strengths,
      recommendations: analysis.recommendations,
      reasoning: analysis.reasoning,
      artifact: {
        id: artifactId,
        cached: false,
      },
      meta: {
        latency_ms: latencyMs,
        cached: false,
      },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;

    counters.generate_fail++;
    logError("job_match_error", {
      userId,
      jobId,
      reqId,
      error: err?.message ?? String(err),
      latency_ms: latencyMs,
    });

    throw new ApiError(
      502,
      err?.message ?? "Failed to generate job match",
      "ai_error"
    );
  }
}
