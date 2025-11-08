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
// Use dynamic import for supabase to avoid throwing at module load when env is missing
// import supabaseAdmin from "./supabaseAdmin.js"; // do not import statically
// Import the TypeScript prompt builder directly; using .ts extension since ts-node/esm + allowImportingTsExtensions is enabled.
import { buildResumePrompt } from "./prompts/resume.ts";
import { buildCoverLetterPrompt } from "./prompts/coverLetter.ts";
import { buildSkillsOptimizationPrompt } from "./prompts/skillsOptimization.ts";
import { buildExperienceTailoringPrompt } from "./prompts/experienceTailoring.ts";
import type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
  ArtifactRow,
} from "./types.js";

// NOTE: This file does not import a DB client to avoid coupling. Replace the pseudo-DB calls
// with your Supabase server client or other DB access method (use service role key server-side).

// Types moved to types.ts for reuse

export async function handleGenerateResume(
  req: GenerateResumeRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
  // 1) Basic validation
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // 2) Fetch profile & job via service role helpers (lazy import to avoid crashing when env is missing)
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  try {
    const mod = await import("./supabaseAdmin.js");
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

  // 3) Prompt composition (simple example; use templates)
  const prompt = buildResumePrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
  });

  // 4) Call AI
  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("resume", prompt, {
      model: process.env.AI_MODEL ?? undefined,
    });
  } catch (e: any) {
    return { error: `AI error: ${e?.message ?? e}` };
  }

  // 5) Post-process / construct artifact row (pseudo id)
  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "resume",
    title: `AI Resume for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model: process.env.AI_MODEL ?? "",
    content: gen.json ?? { text: gen.text },
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

  // 6) Persist to DB (pseudo code) -- replace with your DB insert using service credentials
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
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // Lazy import Supabase helpers (do not crash server if env missing)
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  try {
    const mod = await import("./supabaseAdmin.js");
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

  const prompt = buildCoverLetterPrompt({
    profile,
    job,
    tone: req.options?.tone ?? "professional",
    focus: req.options?.focus,
  });

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("cover_letter", prompt, {
      model: process.env.AI_MODEL ?? undefined,
    });
  } catch (e: any) {
    return { error: `AI error: ${e?.message ?? e}` };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "cover_letter",
    title: `Cover Letter for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model: process.env.AI_MODEL ?? "",
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
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // Lazy import to avoid startup crash when env missing
  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = await import("./supabaseAdmin.js");
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

  const prompt = buildSkillsOptimizationPrompt({ profile, job, skills });

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("skills_optimization", prompt, {
      model: process.env.AI_MODEL ?? undefined,
    });
  } catch (e: any) {
    return { error: `AI error: ${e?.message ?? e}` };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "skills_optimization",
    title: `Skills Optimization for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model: process.env.AI_MODEL ?? "",
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
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  let getProfile: (userId: string) => Promise<any>;
  let getJob: (jobId: number) => Promise<any>;
  let supabase: any;
  try {
    const mod = await import("./supabaseAdmin.js");
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

  const prompt = buildExperienceTailoringPrompt({
    profile,
    job,
    employment,
  });

  let gen: GenerateResult;
  try {
    gen = await aiClient.generate("resume", prompt, {
      model: process.env.AI_MODEL ?? undefined,
    });
  } catch (e: any) {
    return { error: `AI error: ${e?.message ?? e}` };
  }

  const artifact: ArtifactRow = {
    id: "generated-temp-id",
    user_id: req.userId,
    job_id: req.jobId,
    kind: "resume", // persist as 'resume' due to DB CHECK constraint; mark subkind below
    title: `Experience Tailoring for ${job.job_title ?? "Target Role"}`,
    prompt: prompt.slice(0, 2000),
    model: process.env.AI_MODEL ?? "",
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
