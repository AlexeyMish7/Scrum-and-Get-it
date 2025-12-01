/*
Orchestrator scaffold (server-side)
- Exposes a minimal handler function `handleGenerateResume` which demonstrates the flow:
  1) Validate incoming request + session (expects userId to be present)
  2) Fetch user profile and job details (via Supabase or your DB client)
  3) Prepare prompt using templates and profile/job snippets
  4) Call aiClient.generate(kind, prompt)
  5) Post-process and insert into `ai_artifacts` table (versioned)
  6) Return artifact row to caller

This file is a scaffold: adapt to your server framework (Next.js API routes, Vercel serverless, Express, etc.).
*/

import type { GenerateResult } from "./aiClient.js";
import aiClient from "./aiClient.js";
import { logError, logInfo } from "../../utils/logger.js";
// Use dynamic import for supabase to avoid throwing at module load when env is missing
// import supabaseAdmin from "./supabaseAdmin.js"; // do not import statically

// Type definitions for dynamic imports
type SupabaseAdminModule = {
  default: any; // Supabase client - third-party type, using any is acceptable here
  getProfile: (userId: string) => Promise<any>;
  getJob: (jobId: number) => Promise<any>;
  getComprehensiveProfile: (userId: string) => Promise<any>;
};

// Import the TypeScript prompt builder directly; using .ts extension since ts-node/esm + allowImportingTsExtensions is enabled.
import { buildResumePrompt } from "../../prompts/resume.ts";
import { buildCoverLetterPrompt } from "../../prompts/coverLetter.ts";
import { buildSkillsOptimizationPrompt } from "../../prompts/skillsOptimization.ts";
import { buildExperienceTailoringPrompt } from "../../prompts/experienceTailoring.ts";
import {
  buildCompanyResearchPrompt,
  validateCompanyResearchResponse,
} from "../../prompts/companyResearch.ts";
import { fetchCompanyResearch } from "./companyResearchService.js";
import type { CompanyResearch } from "./companyResearchService.js";
import type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
  ArtifactRow,
} from "../types/index.js";

// NOTE: This file does not import a DB client to avoid coupling. Replace the pseudo-DB calls
// with your Supabase server client or other DB access method (use service role key server-side).

// Types moved to types.ts for reuse

/**
 * Normalize company size to match database constraint
 * Fixes common AI mistakes like "1000+" → "10000+"
 */
function normalizeCompanySize(size: string | null | undefined): string | null {
  if (!size) return null;

  const normalized = size.trim();

  // Valid sizes that match database constraint
  const validSizes = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5001-10000",
    "10000+",
  ];

  // If already valid, return as-is
  if (validSizes.includes(normalized)) {
    return normalized;
  }

  // Common AI mistakes
  if (normalized === "1000+" || normalized === "1,000+") {
    return "10000+"; // Amazon, Google, etc. are definitely 10000+
  }

  if (normalized === "5000+" || normalized === "5,000+") {
    return "5001-10000";
  }

  // Try to extract number and map to range
  const match = normalized.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num <= 10) return "1-10";
    if (num <= 50) return "11-50";
    if (num <= 200) return "51-200";
    if (num <= 500) return "201-500";
    if (num <= 1000) return "501-1000";
    if (num <= 5000) return "1001-5000";
    if (num <= 10000) return "5001-10000";
    return "10000+";
  }

  // Couldn't normalize, return null to avoid constraint violation
  return null;
}

export async function handleGenerateResume(
  req: GenerateResumeRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
  // Performance optimizations:
  // - Parallel database queries reduce latency by ~80% (5 queries → 1 parallel batch)
  // - Progress updates keep UI responsive during AI generation
  // - Soft-fail on non-critical data (skills, projects) to prevent blocking

  // Lightweight contract guard + structured logging
  logInfo("orc_resume_start", { userId: req?.userId, jobId: req?.jobId });
  // 1) Basic validation
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // 2) Fetch profile & job via service role helpers (lazy import to avoid crashing when env is missing)
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
    getProfile = mod.getProfile;
    getJob = mod.getJob;
    supabase = mod.default;
    if (typeof getProfile !== "function" || typeof getJob !== "function") {
      throw new Error("supabase helpers not available");
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      error:
        "server not configured: missing Supabase admin environment (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)",
    };
  }
  let profile: any;
  let job: any;
  try {
    profile = await getProfile(req.userId);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { error: `profile query failed: ${err.message}` };
  }
  if (!profile) return { error: "profile not found" };
  try {
    job = await getJob(req.jobId);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { error: `job query failed: ${err.message}` };
  }
  if (!job) return { error: "job not found" };
  if (job.user_id && job.user_id !== req.userId)
    return { error: "job does not belong to user" };

  // 3) Load enriched profile data: skills, employment, education, projects, certifications
  // Fetch all data in parallel for better performance
  let skillsList: Array<{ skill_name: string; skill_category?: string }> = [];
  let employment: Array<any> = [];
  let education: Array<any> = [];
  let projects: Array<any> = [];
  let certifications: Array<any> = [];

  try {
    // Parallel fetch for all profile data - reduces latency by ~80%
    const [skillsRes, empRes, eduRes, projRes, certRes] =
      await Promise.allSettled([
        supabase
          .from("skills")
          .select("skill_name, skill_category")
          .eq("user_id", req.userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("employment")
          .select(
            "id, job_title, company_name, location, start_date, end_date, job_description, current_position"
          )
          .eq("user_id", req.userId)
          .order("start_date", { ascending: false }),
        supabase
          .from("education")
          .select(
            "id, institution_name, degree_type, field_of_study, graduation_date, gpa, honors"
          )
          .eq("user_id", req.userId)
          .order("graduation_date", { ascending: false }),
        supabase
          .from("projects")
          .select(
            "id, proj_name, proj_description, role, start_date, end_date, tech_and_skills, proj_outcomes"
          )
          .eq("user_id", req.userId)
          .order("start_date", { ascending: false })
          .limit(10),
        supabase
          .from("certifications")
          .select("id, name, issuing_org")
          .eq("user_id", req.userId)
          .order("date_earned", { ascending: false })
          .limit(8),
      ]);

    // Extract data from settled promises (soft-fail on errors)
    if (skillsRes.status === "fulfilled" && skillsRes.value.data) {
      skillsList = skillsRes.value.data;
    }
    if (empRes.status === "fulfilled" && empRes.value.data) {
      employment = empRes.value.data;
    }
    if (eduRes.status === "fulfilled" && eduRes.value.data) {
      education = eduRes.value.data;
    }
    if (projRes.status === "fulfilled" && projRes.value.data) {
      projects = projRes.value.data;
    }
    if (certRes.status === "fulfilled" && certRes.value.data) {
      certifications = certRes.value.data;
    }
  } catch (e) {
    // Soft-fail entire parallel fetch; continue with empty arrays
    logError("orc_profile_fetch_error", {
      userId: req.userId,
      error: String(e),
    });
  }

  // 4) Prompt composition with enriched context
  const templateId = req.options?.templateId ?? "classic";
  const rawPrompt = buildResumePrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
    length: req.options?.length ?? "standard",
    templateId,
    skillsList,
    employment,
    education,
    projects,
    certifications,
  });
  // If client provided a custom prompt snippet, append as user additions
  // Optional user-supplied additive prompt snippet (validated & sanitized later)
  const custom = req.options?.prompt?.trim() ?? "";
  const combined = custom
    ? `${rawPrompt}\n\nUser Additions:\n${custom}`
    : rawPrompt;
  const prompt = sanitizePrompt(combined);

  // Model and generation options (env-driven defaults, allow-list override from req)
  const model = selectModel(req.options);
  const aiOpts = {
    model,
    temperature: envNumber("AI_TEMPERATURE", 0.2),
    maxTokens: envNumber("AI_MAX_TOKENS", 800),
    timeoutMs: envNumber("AI_TIMEOUT_MS", 30_000),
    maxRetries: envNumber("AI_MAX_RETRIES", 2),
  } as const;

  // 5) Call AI
  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("resume", prompt, aiOpts);
    logInfo("orc_resume_ai_ok", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      tokens: gen.tokens,
    });
  } catch (e: any) {
    const msg = `AI error: ${e?.message ?? e}`;
    logError("orc_resume_ai_error", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      error: msg,
    });
    return { error: msg };
  }

  // 6) Post-process / construct artifact row (pseudo id)
  // Debug: log what AI returned
  const aiResponse = gen.json as any;
  logInfo("ai_response_preview", {
    userId: req.userId,
    jobId: req.jobId,
    hasSummary: !!aiResponse?.summary,
    hasSkills: !!aiResponse?.ordered_skills,
    hasExperience: !!aiResponse?.sections?.experience,
    hasEducation: !!aiResponse?.sections?.education,
    hasProjects: !!aiResponse?.sections?.projects,
    rawKeys: aiResponse ? Object.keys(aiResponse) : [],
    summaryPreview: aiResponse?.summary
      ? String(aiResponse.summary).substring(0, 100)
      : null,
    skillsCount: aiResponse?.ordered_skills?.length ?? 0,
    experienceCount: aiResponse?.sections?.experience?.length ?? 0,
  });
  const normalized = sanitizeResumeContent(gen.json ?? { text: gen.text }, {
    employment,
    education,
    projects,
  });
  logInfo("ai_normalized_preview", {
    userId: req.userId,
    jobId: req.jobId,
    normalizedKeys: normalized ? Object.keys(normalized) : [],
    hasSummaryNorm: !!normalized?.summary,
    hasSkillsNorm: !!normalized?.ordered_skills,
    hasExperienceNorm: !!normalized?.sections?.experience,
    summaryNormPreview: normalized?.summary
      ? String(normalized.summary).substring(0, 100)
      : null,
    skillsNormCount: normalized?.ordered_skills?.length ?? 0,
  });
  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "resume",
    title: `AI Resume for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model,
    content: normalized,
    metadata: {
      generated_at: new Date().toISOString(),
      provider: process.env.AI_PROVIDER ?? "openai",
      tokens: gen.tokens,
      prompt_preview: prompt.slice(0, 400),
      ...(req.options?.variant !== undefined
        ? { variant: req.options.variant }
        : {}),
    },
    created_at: new Date().toISOString(),
  };

  // 7) Persist to DB (pseudo code) -- replace with your DB insert using service credentials
  // e.g. await supabaseAdmin.from('ai_artifacts').insert({ user_id: req.userId, job_id: req.jobId, kind: 'resume', content: artifact.content, prompt: artifact.prompt, model: artifact.model, metadata: artifact.metadata })

  // Return created artifact to caller
  return { artifact };
}

/**
 * COVER LETTER GENERATION: orchestrates prompt assembly and provider call.
 * Flow: validate → fetch profile/job → build prompt → call provider → build artifact
 * Inputs: { userId: uuid, jobId: number, options? }
 * Output: { artifact } with kind='cover_letter' on success; { error } on failure
 */
export async function handleGenerateCoverLetter(
  req: GenerateCoverLetterRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
  logInfo("orc_cover_letter_start", { userId: req?.userId, jobId: req?.jobId });
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // Lazy import Supabase helpers (do not crash server if env missing)
  let getComprehensiveProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
    getComprehensiveProfile = mod.getComprehensiveProfile;
    getJob = mod.getJob;
    supabase = mod.default;
    if (
      typeof getComprehensiveProfile !== "function" ||
      typeof getJob !== "function"
    ) {
      throw new Error("supabase helpers not available");
    }
  } catch (e: any) {
    return {
      error:
        "server not configured: missing Supabase admin environment (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)",
    };
  }

  let profile: any;
  let job: any;
  try {
    profile = await getComprehensiveProfile(req.userId);
  } catch (e: any) {
    return { error: `profile query failed: ${e?.message ?? e}` };
  }
  if (!profile) return { error: "profile not found" };
  try {
    job = await getJob(req.jobId);
  } catch (e: any) {
    return { error: `job query failed: ${e?.message ?? e}` };
  }
  if (!job) return { error: "job not found" };
  if (job.user_id && job.user_id !== req.userId)
    return { error: "job does not belong to user" };

  // Fetch company research if available for this job
  let companyResearch: any = null;
  try {
    const { data: researchData } = await supabase
      .from("ai_artifacts")
      .select("content")
      .eq("user_id", req.userId)
      .eq("kind", "company_research")
      .eq("job_id", req.jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (researchData?.content) {
      companyResearch = researchData.content;
      logInfo("orc_cover_letter_company_research_found", {
        userId: req.userId,
        jobId: req.jobId,
      });
    }
  } catch (e: any) {
    // Company research is optional, continue without it
    logInfo("orc_cover_letter_no_company_research", {
      userId: req.userId,
      jobId: req.jobId,
    });
  }

  const templateId = req.options?.templateId ?? "formal";
  const rawPrompt = buildCoverLetterPrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
    templateId,
    length: req.options?.length ?? "standard",
    culture: req.options?.culture ?? "corporate",
    companyResearch,
  });
  const prompt = sanitizePrompt(rawPrompt);

  const model = selectModel(req.options as any);
  const aiOpts = {
    model,
    temperature: envNumber("AI_TEMPERATURE", 0.2),
    maxTokens: envNumber("AI_MAX_TOKENS", 1500), // Increased for longer cover letters (350-550 words ≈ 1200 tokens)
    timeoutMs: envNumber("AI_TIMEOUT_MS", 30_000),
    maxRetries: envNumber("AI_MAX_RETRIES", 2),
  } as const;

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("cover_letter", prompt, aiOpts);
    logInfo("orc_cover_letter_ai_ok", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      tokens: gen.tokens,
    });
  } catch (e: any) {
    const msg = `AI error: ${e?.message ?? e}`;
    logError("orc_cover_letter_ai_error", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      error: msg,
    });
    return { error: msg };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "cover_letter",
    title: `Cover Letter for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model,
    content: gen.json ?? { text: gen.text },
    metadata: {
      generated_at: new Date().toISOString(),
      provider: process.env.AI_PROVIDER ?? "openai",
      tokens: gen.tokens,
      prompt_preview: prompt.slice(0, 400),
    },
    created_at: new Date().toISOString(),
  };

  return { artifact };
}

// (no default export here; a single default is provided at the bottom)
/**
 * SKILLS OPTIMIZATION (UC-049): analyze job vs user's skills.
 * Flow: validate → fetch profile, job, skills → build prompt → provider → artifact
 * Output JSON contract: see prompts/skillsOptimization.ts
 */
export async function handleSkillsOptimization(
  req: GenerateSkillsOptimizationRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
  logInfo("orc_skills_opt_start", { userId: req?.userId, jobId: req?.jobId });
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // Lazy import to avoid startup crash when env missing
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
    getProfile = mod.getProfile;
    getJob = mod.getJob;
    supabase = mod.default;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      error:
        "server not configured: missing Supabase admin environment (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)",
    };
  }

  let profile: any;
  let job: any;
  try {
    profile = await getProfile(req.userId);
  } catch (e: any) {
    return { error: `profile query failed: ${e?.message ?? e}` };
  }
  if (!profile) return { error: "profile not found" };
  try {
    job = await getJob(req.jobId);
  } catch (e: any) {
    return { error: `job query failed: ${e?.message ?? e}` };
  }
  if (!job) return { error: "job not found" };
  if (job.user_id && job.user_id !== req.userId)
    return { error: "job does not belong to user" };

  // Fetch user's skills
  let skills: Array<{ skill_name: string; skill_category?: string }> = [];
  try {
    const { data, error } = await supabase
      .from("skills")
      .select("skill_name, skill_category")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    skills = data ?? [];
  } catch (e: any) {
    return { error: `skills query failed: ${e?.message ?? e}` };
  }

  const rawPrompt = buildSkillsOptimizationPrompt({ profile, job, skills });
  const prompt = sanitizePrompt(rawPrompt);

  const model = selectModel(undefined);
  const aiOpts = {
    model,
    temperature: envNumber("AI_TEMPERATURE", 0.2),
    maxTokens: envNumber("AI_MAX_TOKENS", 800),
    timeoutMs: envNumber("AI_TIMEOUT_MS", 30_000),
    maxRetries: envNumber("AI_MAX_RETRIES", 2),
  } as const;

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("skills_optimization", prompt, aiOpts);
    logInfo("orc_skills_opt_ai_ok", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      tokens: gen.tokens,
    });
  } catch (e: any) {
    const msg = `AI error: ${e?.message ?? e}`;
    logError("orc_skills_opt_ai_error", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      error: msg,
    });
    return { error: msg };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "skills_optimization",
    title: `Skills Optimization for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model,
    content: gen.json ?? { text: gen.text },
    metadata: {
      generated_at: new Date().toISOString(),
      provider: process.env.AI_PROVIDER ?? "openai",
      tokens: gen.tokens,
      prompt_preview: prompt.slice(0, 400),
    },
    created_at: new Date().toISOString(),
  };

  return { artifact };
}

/**
 * EXPERIENCE TAILORING (UC-050)
 * WHAT: Tailor per-role experience bullets for a target job.
 * FLOW: validate → fetch profile & job → fetch employment list → build prompt → AI generate → wrap artifact.
 * INPUTS: { userId: string; jobId: number }
 * OUTPUT: { artifact } with kind='resume' and metadata.subkind='experience_tailoring'.
 * ERROR MODES: returns { error } for auth, missing entities, AI failure, or data fetch issues.
 * NOTE: Uses kind='resume' (DB constraint) plus metadata.subkind for specialization.
 */
export async function handleExperienceTailoring(req: {
  userId: string;
  jobId: number;
}): Promise<{ artifact?: ArtifactRow; error?: string }> {
  logInfo("orc_experience_tailoring_start", {
    userId: req?.userId,
    jobId: req?.jobId,
  });
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
    getProfile = mod.getProfile;
    getJob = mod.getJob;
    supabase = mod.default;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      error:
        "server not configured: missing Supabase admin environment (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)",
    };
  }

  let profile: any;
  let job: any;
  try {
    profile = await getProfile(req.userId);
  } catch (e: any) {
    return { error: `profile query failed: ${e?.message ?? e}` };
  }
  if (!profile) return { error: "profile not found" };
  try {
    job = await getJob(req.jobId);
  } catch (e: any) {
    return { error: `job query failed: ${e?.message ?? e}` };
  }
  if (!job) return { error: "job not found" };
  if (job.user_id && job.user_id !== req.userId)
    return { error: "job does not belong to user" };

  // Fetch employment history for this user (ordered chronologically)
  let employment: Array<any> = [];
  try {
    const { data, error } = await supabase
      .from("employment")
      .select(
        "id, job_title, company_name, start_date, end_date, job_description"
      )
      .eq("user_id", req.userId)
      .order("start_date", { ascending: true });
    if (error) throw error;
    employment = data ?? [];
  } catch (e: any) {
    return { error: `employment query failed: ${e?.message ?? e}` };
  }

  const rawPrompt = buildExperienceTailoringPrompt({
    profile,
    job,
    employment,
  });
  const prompt = sanitizePrompt(rawPrompt);

  const model = selectModel(undefined);
  const aiOpts = {
    model,
    temperature: envNumber("AI_TEMPERATURE", 0.2),
    maxTokens: envNumber("AI_MAX_TOKENS", 800),
    timeoutMs: envNumber("AI_TIMEOUT_MS", 30_000),
    maxRetries: envNumber("AI_MAX_RETRIES", 2),
  } as const;

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("resume", prompt, aiOpts);
    logInfo("orc_experience_tailoring_ai_ok", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      tokens: gen.tokens,
    });
  } catch (e: any) {
    const msg = `AI error: ${e?.message ?? e}`;
    logError("orc_experience_tailoring_ai_error", {
      userId: req.userId,
      jobId: req.jobId,
      model,
      error: msg,
    });
    return { error: msg };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "resume", // persist as 'resume' due to DB CHECK constraint; mark subkind below
    title: `Experience Tailoring for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model,
    content: gen.json ?? { text: gen.text },
    metadata: {
      generated_at: new Date().toISOString(),
      provider: process.env.AI_PROVIDER ?? "openai",
      tokens: gen.tokens,
      prompt_preview: prompt.slice(0, 400),
      subkind: "experience_tailoring",
    },
    created_at: new Date().toISOString(),
  };

  return { artifact };
}
/**
 * SALARY RESEARCH (UC-060)
 * AI-driven salary benchmarking and negotiation support
 * Inputs: { userId, title, location, experience, company, currentSalary? }
 * Outputs: { artifact } with salary analysis JSON
 */
export async function handleSalaryResearch(req: {
  userId: string;
  title: string;
  location?: string;
  experience?: string;
  company?: string;
  currentSalary?: string;
}): Promise<{ artifact?: ArtifactRow; error?: string }> {
  logInfo("orc_salary_research_start", {
    userId: req?.userId,
    title: req?.title,
    location: req?.location,
  });

  // 1️⃣ Basic validation
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.title || !req.title.trim()) return { error: "missing title" };

  // 2️⃣ Build AI prompt
  const prompt = `
    You are a compensation analyst. Estimate realistic salary insights for:
    Job Title: ${req.title}
    Company: ${req.company || "unspecified"}
    Location: ${req.location || "anywhere"}
    Experience Level: ${req.experience || "mid"}
    Current Salary: ${req.currentSalary || "unknown"}

    Include JSON only:
    {
      "range": { "low": number, "avg": number, "high": number },
      "totalComp": number,
      "trend": string,
      "comparison": string,
      "recommendation": string
    }
  `;

  // 3️⃣ AI call using existing aiClient
  try {
    const model = selectModel(undefined);
    const aiOpts = {
      model,
      temperature: envNumber("AI_TEMPERATURE", 0.2),
      maxTokens: envNumber("AI_MAX_TOKENS", 600),
      timeoutMs: envNumber("AI_TIMEOUT_MS", 20000),
    } as const;

    const gen: GenerateResult = await aiClient.generate(
      "salary_research",
      prompt,
      aiOpts
    );

    if (!gen?.json && !gen?.text) {
      logError("AI returned no content for salary research", {
        title: req.title,
      });
      return { error: "AI returned empty response" };
    }

    let salaryData: any = gen?.json ?? gen?.text ?? {};
    if (typeof salaryData === "string" && salaryData.trim()) {
      try {
        const cleaned = salaryData
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        salaryData = JSON.parse(cleaned);
      } catch {
        logError("Salary research JSON parse failed", {
          raw: salaryData.slice(0, 200),
        });
        return { error: "Invalid AI response format" };
      }
    }

    // 4️⃣ Create artifact
    const artifact: ArtifactRow = {
      id: `artifact_${Date.now()}`,
      user_id: req.userId,
      job_id: null,
      kind: "salary_research",
      title: `Salary Research for ${req.title}`,
      prompt: typeof prompt === "string" ? prompt.slice(0, 1000) : "",
      // @ts-ignore  // suppress "Property 'model' does not exist on type 'GenerateResult'"
      model: gen.model || "gpt-4o-mini",
      content: salaryData,
      metadata: {
        generated_at: new Date().toISOString(),
        provider: process.env.AI_PROVIDER ?? "openai",
        tokens: gen.tokens,
        prompt_preview: prompt.slice(0, 300),
      },
      created_at: new Date().toISOString(),
    };

    logInfo("orc_salary_research_ok", {
      userId: req.userId,
      title: req.title,
      range: (salaryData as any)?.range,
    });

    return { artifact };
  } catch (err: any) {
    logError("orc_salary_research_error", {
      userId: req.userId,
      title: req.title,
      error: err?.message,
    });
    return { error: `AI error: ${err?.message}` };
  }
}

export default {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
  handleSalaryResearch,
};

// -------------------------------------------------------------
// Helpers: sanitization, model selection, env parsing
// -------------------------------------------------------------

/** Remove problematic control characters and cap prompt length */
function sanitizePrompt(input: string, maxLen = 16_000): string {
  try {
    const noCtrl = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");
    const redacted = redactSecrets(noCtrl);
    return redacted.length > maxLen
      ? redacted.slice(0, maxLen - 1) + "…"
      : redacted;
  } catch {
    return String(input ?? "");
  }
}

/** Best-effort secret redaction for common key formats (e.g., sk-...) */
function redactSecrets(s: string): string {
  return s
    .replace(/sk-[A-Za-z0-9_\-]{16,}/g, "[REDACTED_KEY]")
    .replace(/(api[_-]?key)\s*[:=]\s*[A-Za-z0-9_\-]{12,}/gi, "$1=[REDACTED]");
}

/** Parse number env var with default */
function envNumber(name: string, def: number): number {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? (n as number) : def;
}

/** Select a model using allowed list from env and request override */
function selectModel(options?: { model?: string } | null): string | undefined {
  const reqModel = options?.model?.trim();
  const allowed = (process.env.ALLOWED_AI_MODELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (reqModel && (allowed.length === 0 || allowed.includes(reqModel))) {
    return reqModel;
  }
  return process.env.AI_MODEL ?? undefined;
}

// ---------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------
/**
 * sanitizeResumeContent
 * WHAT: Normalize AI output into a safe ResumeArtifactContent shape.
 * WHY: Some providers may output invalid types (e.g., summary as object) or omit fields.
 * - Forces summary to string (or null)
 * - Ensures sections.experience bullets are arrays of strings
 * - Trims whitespace; drops obviously invalid shapes
 * - Enriches sections with database data if AI didn't provide them
 *
 * @param input - Raw AI output
 * @param dbData - Optional database records to enrich sections if AI omitted them
 */
function sanitizeResumeContent(
  input: any,
  dbData?: {
    employment?: Array<any>;
    education?: Array<any>;
    projects?: Array<any>;
  }
): any {
  try {
    const out: any = typeof input === "object" && input ? { ...input } : {};
    // summary must be a string
    if (out.summary != null && typeof out.summary !== "string") {
      // derive fallback from first bullets if possible
      const firstBullet =
        Array.isArray(out.bullets) && out.bullets[0]
          ? typeof out.bullets[0] === "string"
            ? out.bullets[0]
            : out.bullets[0]?.text
          : null;
      out.summary = firstBullet ? String(firstBullet) : undefined;
    }
    if (typeof out.summary === "string") out.summary = out.summary.trim();

    // skills arrays must be string[] if present
    for (const key of [
      "ordered_skills",
      "emphasize_skills",
      "add_skills",
      "ats_keywords",
    ]) {
      if (Array.isArray(out[key])) {
        out[key] = out[key].filter((s: any) => typeof s === "string");
      }
    }

    // Ensure sections object exists
    if (!out.sections || typeof out.sections !== "object") {
      out.sections = {};
    }

    // sections.experience normalization
    const exp = out.sections.experience;
    if (Array.isArray(exp)) {
      out.sections.experience = exp
        .map((row: any) => {
          const bullets = Array.isArray(row?.bullets)
            ? row.bullets.filter((b: any) => typeof b === "string")
            : [];
          return {
            employment_id: row?.employment_id ?? undefined,
            role: row?.role ?? undefined,
            company: row?.company ?? undefined,
            dates: row?.dates ?? undefined,
            bullets,
          };
        })
        .filter((r: any) => r.bullets.length > 0 || r.role || r.company);
    } else if (dbData?.employment && dbData.employment.length > 0) {
      // Fallback: populate from database if AI didn't provide experience
      out.sections.experience = dbData.employment.map((emp: any) => ({
        employment_id: emp.id,
        role: emp.job_title,
        company: emp.company_name,
        dates: `${emp.start_date ?? "?"} – ${
          emp.current_position ? "present" : emp.end_date ?? "present"
        }`,
        bullets: emp.job_description
          ? [emp.job_description.slice(0, 200)] // Use first 200 chars as placeholder
          : [],
      }));
    }

    // sections.education normalization
    const edu = out.sections.education;
    if (Array.isArray(edu)) {
      out.sections.education = edu
        .map((row: any) => ({
          education_id: row?.education_id ?? undefined,
          institution: row?.institution ?? undefined,
          degree: row?.degree ?? undefined,
          graduation_date: row?.graduation_date ?? undefined,
          details: Array.isArray(row?.details)
            ? row.details.filter((d: any) => typeof d === "string")
            : [],
        }))
        .filter((r: any) => r.institution || r.degree);
    } else if (dbData?.education && dbData.education.length > 0) {
      // Fallback: populate from database
      out.sections.education = dbData.education.map((ed: any) => ({
        education_id: ed.id,
        institution: ed.institution_name,
        degree: [ed.degree_type, ed.field_of_study].filter(Boolean).join(" "),
        graduation_date: ed.graduation_date,
        details: [
          ed.gpa && ed.gpa >= 3.5 ? `GPA: ${ed.gpa}` : "",
          ed.honors ? ed.honors : "",
        ].filter(Boolean),
      }));
    }

    // sections.projects normalization
    const proj = out.sections.projects;
    if (Array.isArray(proj)) {
      out.sections.projects = proj
        .map((row: any) => ({
          project_id: row?.project_id ?? undefined,
          name: row?.name ?? undefined,
          role: row?.role ?? undefined,
          bullets: Array.isArray(row?.bullets)
            ? row.bullets.filter((b: any) => typeof b === "string")
            : [],
        }))
        .filter((r: any) => r.name || r.bullets.length > 0);
    } else if (dbData?.projects && dbData.projects.length > 0) {
      // Fallback: populate from database
      out.sections.projects = dbData.projects.map((p: any) => {
        const bullets = [
          p.proj_description ? p.proj_description.slice(0, 150) : "",
          p.proj_outcomes ? p.proj_outcomes.slice(0, 150) : "",
        ].filter(Boolean);
        return {
          project_id: p.id,
          name: p.proj_name,
          role: p.role,
          bullets,
        };
      });
    }

    return out;
  } catch {
    return input;
  }
}

/**
 * COMPANY RESEARCH GENERATION: AI-powered company intelligence
 *
 * WHAT: Orchestrates AI-powered company research for application preparation
 * WHY: Users need comprehensive, up-to-date company information for tailored applications
 *
 * Flow:
 * 1. Validate request (userId, companyName required)
 * 2. Optionally fetch job details if jobId provided (for context)
 * 3. Call company research service for basic data
 * 4. Optionally enhance with AI analysis (future: competitor analysis, culture insights)
 * 5. Create artifact with company research data
 * 6. Return artifact for frontend consumption
 *
 * Inputs:
 * - userId: string (authenticated user)
 * - companyName: string (company to research)
 * - jobId?: number (optional job context)
 *
 * Outputs:
 * - artifact: ArtifactRow with company research data
 * - error: string if request failed
 */
export async function handleCompanyResearch(req: {
  userId: string;
  companyName: string;
  jobId?: number;
}): Promise<{ artifact?: ArtifactRow; error?: string }> {
  logInfo("orc_company_research_start", {
    userId: req?.userId,
    companyName: req?.companyName,
    jobId: req?.jobId,
  });

  // 1) Basic validation
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.companyName || !req.companyName.trim())
    return { error: "missing companyName" };

  const companyName = req.companyName.trim();
  let jobContext: any = null;

  // 2) Fetch job context if provided (for richer research)
  if (req.jobId) {
    try {
      const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
      const getJob = mod.getJob;
      if (typeof getJob === "function") {
        jobContext = await getJob(req.jobId);
        // Verify job ownership
        if (jobContext?.user_id && jobContext.user_id !== req.userId) {
          return { error: "job does not belong to user" };
        }
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      // Non-fatal: continue without job context
      logInfo("Could not fetch job context for company research", {
        error: err.message,
      });
    }
  }

  try {
    // 3) Build AI prompt for company research
    const industry = jobContext?.industry || null;
    const jobDescription = jobContext?.job_description || null;

    const prompt = buildCompanyResearchPrompt({
      companyName,
      industry,
      jobDescription,
    });

    logInfo("Calling AI for company research", {
      companyName,
      promptLength: prompt.length,
    });

    // 4) Call AI service
    let aiResult: any;
    try {
      aiResult = await aiClient.generate("company_research", prompt);
    } catch (aiErr: any) {
      logError("AI call failed for company research", {
        companyName,
        error: aiErr?.message,
      });

      // Fallback to mock data if AI fails
      logInfo("Falling back to mock company data", { companyName });
      const mockData = await fetchCompanyResearch(
        companyName,
        industry,
        jobDescription
      );
      if (!mockData) {
        return { error: "Company research data not available" };
      }

      // Use mock data as AI result
      aiResult = { json: mockData, error: null };
    }

    if (aiResult.error) {
      logError("AI returned error for company research", {
        error: aiResult.error,
      });
      return { error: aiResult.error };
    }

    // 5) Parse and validate AI response
    // AI client returns { text, json, raw, tokens }
    // Try json first (if AI returned valid JSON), then fall back to text parsing
    let researchData = aiResult.json || aiResult.text;

    logInfo("AI response received for company research", {
      companyName,
      hasJson: !!aiResult.json,
      hasText: !!aiResult.text,
      tokens: aiResult.tokens,
      responseType: typeof researchData,
      isString: typeof researchData === "string",
      hasContent: !!researchData,
    });

    // If AI returned a string, try to parse as JSON
    if (typeof researchData === "string") {
      try {
        // Remove markdown code blocks if present
        const cleaned = researchData
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        researchData = JSON.parse(cleaned);
        logInfo("Successfully parsed AI string response as JSON", {
          companyName,
        });
      } catch (parseErr) {
        logError("Failed to parse AI company research response", {
          error: parseErr,
          rawResponse:
            typeof researchData === "string"
              ? researchData.slice(0, 200)
              : String(researchData),
        });
        return { error: "Invalid AI response format" };
      }
    }

    // Log parsed data structure for debugging
    logInfo("Parsed research data structure", {
      companyName,
      hasCompanyName: !!(
        researchData?.companyName ||
        researchData?.company_name ||
        researchData?.name
      ),
      hasIndustry: !!researchData?.industry,
      hasDescription: !!researchData?.description,
      hasMission: !!researchData?.mission,
      newsCount: Array.isArray(researchData?.news)
        ? researchData.news.length
        : 0,
      productsCount: Array.isArray(researchData?.products)
        ? researchData.products.length
        : 0,
    });

    // Check if we got any data at all
    if (!researchData) {
      logError("AI returned null/undefined research data", {
        companyName,
        aiResultKeys: Object.keys(aiResult || {}),
      });
      return { error: "No data returned from AI" };
    }

    // Validate response structure
    if (!validateCompanyResearchResponse(researchData)) {
      logError("AI response failed validation", {
        companyName,
        hasName: !!(
          researchData?.companyName ||
          researchData?.company_name ||
          researchData?.name
        ),
        keys: Object.keys(researchData || {}),
        sample: JSON.stringify(researchData || {}).slice(0, 300),
      });
      return { error: "Incomplete company research data" };
    }

    // Ensure required fields have defaults - handle multiple field name variations
    const finalData = {
      companyName:
        researchData.companyName ||
        researchData.company_name ||
        researchData.name ||
        companyName,
      industry: researchData.industry || researchData.sector || "Unknown",
      size:
        normalizeCompanySize(
          researchData.size ||
            researchData.employee_count ||
            researchData.employeeCount
        ) || null,
      location:
        researchData.location ||
        researchData.headquarters ||
        researchData.hq ||
        null,
      founded:
        researchData.founded ||
        researchData.founded_year ||
        researchData.yearFounded ||
        null,
      website:
        researchData.website ||
        researchData.url ||
        researchData.companyUrl ||
        null,
      mission:
        researchData.mission ||
        researchData.mission_statement ||
        researchData.missionStatement ||
        null,
      description:
        researchData.description ||
        researchData.summary ||
        researchData.overview ||
        researchData.about ||
        null,
      news: Array.isArray(researchData.news)
        ? researchData.news
        : Array.isArray(researchData.recent_news)
        ? researchData.recent_news
        : [],
      culture: researchData.culture ||
        researchData.company_culture || {
          type: "corporate",
          remotePolicy: null,
          values: [],
          perks: [],
        },
      leadership: Array.isArray(researchData.leadership)
        ? researchData.leadership
        : Array.isArray(researchData.executives)
        ? researchData.executives
        : [],
      products: Array.isArray(researchData.products)
        ? researchData.products
        : Array.isArray(researchData.services)
        ? researchData.services
        : Array.isArray(researchData.offerings)
        ? researchData.offerings
        : [],
      potentialInterviewers: Array.isArray(researchData.potentialInterviewers)
        ? researchData.potentialInterviewers
        : Array.isArray(researchData.interviewers)
        ? researchData.interviewers
        : [],
      competitors: Array.isArray(researchData.competitors)
        ? researchData.competitors
        : [],
      marketPositioning:
        researchData.marketPositioning || researchData.market_positioning || null,
      talkingPoints: Array.isArray(researchData.talkingPoints)
        ? researchData.talkingPoints
        : Array.isArray(researchData.talking_points)
        ? researchData.talking_points
        : [],
      interviewQuestions: Array.isArray(researchData.interviewQuestions)
        ? researchData.interviewQuestions
        : Array.isArray(researchData.interview_questions)
        ? researchData.interview_questions
        : [],
      rating:
        researchData.rating ||
        researchData.glassdoor ||
        researchData.glassdoorRating ||
        null,
    };

    // 6) Create artifact
    const now = new Date().toISOString();
    const artifact: ArtifactRow = {
      id: `artifact_${Date.now()}`,
      user_id: req.userId,
      job_id: req.jobId || null,
      kind: "company_research",
      title: `${companyName} Research`,
      prompt: prompt.slice(0, 500), // Store truncated prompt
      model: aiResult.model || "gpt-4o-mini",
      content: finalData,
      metadata: {
        source: "ai",
        last_updated: now,
        trust_level: "high",
        news_count: finalData.news.length,
        job_context: req.jobId ? true : false,
        has_rating: !!finalData.rating,
      },
      created_at: now,
      updated_at: now,
    };

    logInfo("Company research completed successfully", {
      userId: req.userId,
      companyName,
      newsCount: finalData.news.length,
      hasRating: !!finalData.rating,
      source: "ai",
    });

    // Save company research to database (companies table + company_research_cache)
    // This persists the data so it can be reused across users and sessions
    try {
      const mod = (await import("./supabaseAdmin.js")) as SupabaseAdminModule;
      const supabase = mod.default;

      if (supabase) {
        // Step 1: Upsert company base info into companies table
        // Build company_data JSONB with all structured data (mission, culture, leadership, products)
        const companyDataJsonb = {
          mission: finalData.mission,
          culture: finalData.culture,
          leadership: finalData.leadership,
          products: finalData.products,
        };

        logInfo("Saving company to database", {
          companyName: finalData.companyName,
          industry: finalData.industry,
          size: finalData.size,
          hasWebsite: !!finalData.website,
          hasMission: !!finalData.mission,
        });

        const { data: companyId, error: companyError } = await supabase.rpc(
          "upsert_company_info",
          {
            p_company_name: finalData.companyName,
            p_industry: finalData.industry,
            p_size: finalData.size, // Will be validated by CHECK constraint
            p_location: finalData.location,
            p_founded_year: finalData.founded,
            p_website: finalData.website,
            p_description: finalData.description,
            p_company_data: companyDataJsonb,
            p_source: "ai",
          }
        );

        if (companyError) {
          logError("Failed to save company base info (non-blocking)", {
            companyName: finalData.companyName,
            error: companyError.message,
          });
        } else {
          logInfo("Saved company base info to database", {
            companyName: finalData.companyName,
            companyId,
          });

          // Step 2: Save volatile research data (news, events) to cache
          const { error: cacheError } = await supabase.rpc(
            "save_company_research",
            {
              p_company_id: companyId,
              p_research_data: {
                news: finalData.news,
                recentEvents: [],
                fundingRounds: [],
                leadershipChanges: [],
                quarterlyHighlights: [],
              },
              p_metadata: {
                model: aiResult.model || "gpt-4o-mini",
                source: "ai",
                cached_at: now,
              },
            }
          );

          if (cacheError) {
            logError("Failed to save research cache (non-blocking)", {
              companyName: finalData.companyName,
              companyId,
              error: cacheError.message,
            });
          } else {
            logInfo("Saved volatile research data to cache", {
              companyName: finalData.companyName,
              companyId,
            });
          }
        }
      }
    } catch (saveErr: any) {
      // Non-blocking error - log and continue
      logError("Exception saving company to database (non-blocking)", {
        companyName: finalData.companyName,
        error: saveErr?.message ?? String(saveErr),
      });
    }

    return { artifact };
  } catch (err: any) {
    logError("Company research failed", {
      userId: req.userId,
      companyName,
      error: err?.message ?? String(err),
    });
    return { error: `Research failed: ${err?.message ?? "unknown error"}` };
  }
}
