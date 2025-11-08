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
import { buildResumePrompt } from "./prompts/resume.js";

// NOTE: This file does not import a DB client to avoid coupling. Replace the pseudo-DB calls
// with your Supabase server client or other DB access method (use service role key server-side).

export interface GenerateResumeRequest {
  userId: string; // authenticated user's id (server must verify via session)
  jobId: number; // ID of job to target
  options?: { tone?: string; focus?: string };
}

export interface ArtifactRow {
  id: string;
  user_id: string;
  job_id?: number | null;
  kind: string;
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: unknown;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export async function handleGenerateResume(
  req: GenerateResumeRequest
): Promise<{ artifact?: ArtifactRow; error?: string }> {
  // 1) Basic validation
  if (!req?.userId) return { error: "unauthenticated" };
  if (!req?.jobId) return { error: "missing jobId" };

  // 2) Fetch profile & job via Supabase (service role)
  let profile: any;
  let job: any;
  try {
    const mod = await import("./supabaseAdmin.js");
    const supabase = (mod as any).default;
    const profRes = await supabase.from("profiles").select("*").eq("id", req.userId).maybeSingle();
    if (profRes.error) return { error: `profile query failed: ${profRes.error.message}` };
    profile = profRes.data;
    if (!profile) return { error: "profile not found" };

    const jobRes = await supabase.from("jobs").select("*").eq("id", req.jobId).maybeSingle();
    if (jobRes.error) return { error: `job query failed: ${jobRes.error.message}` };
    job = jobRes.data;
    if (!job) return { error: "job not found" };
    if (job.user_id && job.user_id !== req.userId) return { error: "job does not belong to user" };
  } catch (e: any) {
    return { error: `supabase unavailable: ${e?.message ?? e}` };
  }

  // 3) Prompt composition (simple example; use templates)
  const prompt = buildResumePrompt({ profile, job, tone: req.options?.tone ?? "professional", focus: req.options?.focus });

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
    },
    created_at: new Date().toISOString(),
  };

  // 6) Persist to DB (pseudo code) -- replace with your DB insert using service credentials
  // e.g. await supabaseAdmin.from('ai_artifacts').insert({ user_id: req.userId, job_id: req.jobId, kind: 'resume', content: artifact.content, prompt: artifact.prompt, model: artifact.model, metadata: artifact.metadata })

  // Return created artifact to caller
  return { artifact };
}

export default { handleGenerateResume };
