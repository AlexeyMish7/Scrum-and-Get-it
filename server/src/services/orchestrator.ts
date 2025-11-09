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

import type { GenerateResult } from "../../aiClient.js";
import aiClient from "../../aiClient.js";
import { logError, logInfo } from "../../utils/logger.js";
// Use dynamic import for supabase to avoid throwing at module load when env is missing
// import supabaseAdmin from "../../supabaseAdmin.js"; // do not import statically
// Import the TypeScript prompt builder directly; using .ts extension since ts-node/esm + allowImportingTsExtensions is enabled.
import { buildResumePrompt } from "../../prompts/resume.ts";
import { buildCoverLetterPrompt } from "../../prompts/coverLetter.ts";
import { buildSkillsOptimizationPrompt } from "../../prompts/skillsOptimization.ts";
import { buildExperienceTailoringPrompt } from "../../prompts/experienceTailoring.ts";
import type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
  ArtifactRow,
} from "../types/index.js";

// NOTE: This file does not import a DB client to avoid coupling. Replace the pseudo-DB calls
// with your Supabase server client or other DB access method (use service role key server-side).

// Types moved to types.ts for reuse

export async function handleGenerateResume(
  req: GenerateResumeRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
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
    const mod = await import("../../supabaseAdmin.js");
    getProfile = (mod as any).getProfile;
    getJob = (mod as any).getJob;
    supabase = (mod as any).default;
    if (typeof getProfile !== "function" || typeof getJob !== "function") {
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

  // 3) Load enriched profile data: skills, employment, education, projects, certifications
  let skillsList: Array<{ skill_name: string; skill_category?: string }> = [];
  let employment: Array<any> = [];
  let education: Array<any> = [];
  let projects: Array<any> = [];
  let certifications: Array<any> = [];
  try {
    // skills
    const { data: sk, error: skErr } = await supabase
      .from("skills")
      .select("skill_name, skill_category")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });
    if (skErr) throw skErr;
    skillsList = sk ?? [];
  } catch {
    // soft-fail; continue without skills enrichment
  }
  try {
    // employment
    const { data: emp, error: empErr } = await supabase
      .from("employment")
      .select("id, job_title, company_name, start_date, end_date")
      .eq("user_id", req.userId)
      .order("start_date", { ascending: true });
    if (empErr) throw empErr;
    employment = emp ?? [];
  } catch {}
  try {
    // education
    const { data: edu, error: eduErr } = await supabase
      .from("education")
      .select(
        "id, institution_name, degree_type, field_of_study, graduation_date"
      )
      .eq("user_id", req.userId)
      .order("graduation_date", { ascending: true });
    if (eduErr) throw eduErr;
    education = edu ?? [];
  } catch {}
  try {
    // projects
    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .select("id, proj_name, role, tech_and_skills")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .limit(8);
    if (projErr) throw projErr;
    projects = proj ?? [];
  } catch {}
  try {
    // certifications
    const { data: cert, error: certErr } = await supabase
      .from("certifications")
      .select("id, name, issuing_org")
      .eq("user_id", req.userId)
      .order("date_earned", { ascending: false })
      .limit(8);
    if (certErr) throw certErr;
    certifications = cert ?? [];
  } catch {}

  // 4) Prompt composition with enriched context
  const rawPrompt = buildResumePrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
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
  const normalized = sanitizeResumeContent(gen.json ?? { text: gen.text });
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
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  try {
    const mod = await import("../../supabaseAdmin.js");
    getProfile = (mod as any).getProfile;
    getJob = (mod as any).getJob;
    if (typeof getProfile !== "function" || typeof getJob !== "function") {
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

  const rawPrompt = buildCoverLetterPrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
  });
  const prompt = sanitizePrompt(rawPrompt);

  const model = selectModel(req.options as any);
  const aiOpts = {
    model,
    temperature: envNumber("AI_TEMPERATURE", 0.2),
    maxTokens: envNumber("AI_MAX_TOKENS", 800),
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
    const mod = await import("../../supabaseAdmin.js");
    getProfile = (mod as any).getProfile;
    getJob = (mod as any).getJob;
    supabase = (mod as any).default;
  } catch (e: any) {
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
    const mod = await import("../../supabaseAdmin.js");
    getProfile = (mod as any).getProfile;
    getJob = (mod as any).getJob;
    supabase = (mod as any).default;
  } catch (e: any) {
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

export default {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
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
 */
function sanitizeResumeContent(input: any): any {
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

    // sections.experience normalization
    if (out.sections && typeof out.sections === "object") {
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
      }
    }
    return out;
  } catch {
    return input;
  }
}
