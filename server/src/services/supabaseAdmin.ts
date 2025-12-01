import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Instead of throwing immediately during module load (which crashes the server),
// we defer the error until the client is actually used. This allows the server
// to start and provide helpful error messages via API responses.
let _initError: string | null = null;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  _initError =
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment";
  console.warn(
    "⚠️ Supabase not configured - database operations will fail until environment variables are set"
  );
}

const supabaseAdmin: SupabaseClient | null = _initError
  ? null
  : createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        // keep session storage off for server-side usage
        persistSession: false,
      },
    });

export default supabaseAdmin;

// Runtime check helper for all database operations
function ensureClient(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error(
      _initError ||
        "Supabase client not initialized - check environment configuration"
    );
  }
  return supabaseAdmin;
}

// Helper for inserting an ai_artifacts row. Keeps a small convenience wrapper to centralize fields.
export async function insertAiArtifact(payload: {
  id?: string;
  user_id: string;
  job_id?: number | null;
  kind: string;
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: unknown;
  metadata?: Record<string, unknown>;
}) {
  const client = ensureClient();

  // Build insert row, omitting `id` entirely unless explicitly provided.
  // Passing id: undefined/null would override Postgres default and cause a NOT NULL violation.
  const row: Record<string, unknown> = {
    id: payload.id ?? randomUUID(),
    user_id: payload.user_id,
    job_id: payload.job_id ?? null,
    kind: payload.kind,
    title: payload.title ?? null,
    prompt: payload.prompt ?? null,
    model: payload.model ?? null,
    content: payload.content,
    metadata: payload.metadata ?? {},
  };

  const { data, error } = await client
    .from("ai_artifacts")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Fetch a profile by user id (service role). */
export async function getProfile(userId: string) {
  const client = ensureClient();

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Fetch comprehensive user profile with all related data for AI generation
 * Includes: education, skills, employment history, projects, certifications
 */
export async function getComprehensiveProfile(userId: string) {
  const client = ensureClient();

  // Fetch base profile
  const profile = await getProfile(userId);
  if (!profile) return null;

  // Fetch education in parallel
  const { data: education } = await client
    .from("education")
    .select("*")
    .eq("user_id", userId)
    .order("graduation_date", { ascending: false });

  // Fetch skills
  const { data: skills } = await client
    .from("skills")
    .select("*")
    .eq("user_id", userId)
    .order("proficiency_level", { ascending: false });

  // Fetch employment history
  const { data: employment } = await client
    .from("employment")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  // Fetch projects
  const { data: projects } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  // Fetch certifications
  const { data: certifications } = await client
    .from("certifications")
    .select("*")
    .eq("user_id", userId)
    .order("date_earned", { ascending: false });

  // Combine all data into comprehensive profile
  return {
    ...profile,
    education: education || [],
    skills: skills || [],
    employment: employment || [],
    projects: projects || [],
    certifications: certifications || [],
  };
}

/** Fetch a job by id (service role). */
export async function getJob(jobId: number) {
  const client = ensureClient();

  const { data, error } = await client
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** List AI artifacts for a user with optional filters. */
export async function listAiArtifactsForUser(params: {
  userId: string;
  kind?: string;
  jobId?: number;
  limit?: number;
  offset?: number;
}) {
  const client = ensureClient();

  const { userId, kind, jobId, limit = 20, offset = 0 } = params;
  let q = client
    .from("ai_artifacts")
    .select("id, user_id, job_id, kind, title, created_at, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + Math.max(limit - 1, 0));
  if (kind) q = q.eq("kind", kind);
  if (typeof jobId === "number") q = q.eq("job_id", jobId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single AI artifact by id for the given user (enforces ownership). */
export async function getAiArtifactForUser(userId: string, id: string) {
  const client = ensureClient();

  const { data, error } = await client
    .from("ai_artifacts")
    .select(
      "id, user_id, job_id, kind, title, prompt, model, content, metadata, created_at"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetch a document by id for the given user (enforces ownership). */
export async function getDocumentForUser(userId: string, id: string) {
  const client = ensureClient();

  // Updated to match new schema from 2025-11-17_ai_workspace_schema_redesign.sql
  const { data, error } = await client
    .from("documents")
    .select("id, user_id, type, name, status, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Insert a job_materials row linking chosen resume/cover to a job. */
export async function insertJobMaterials(payload: {
  user_id: string;
  job_id: number;
  resume_document_id?: string | null;
  resume_artifact_id?: string | null;
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const row: Record<string, unknown> = {
    user_id: payload.user_id,
    job_id: payload.job_id,
    resume_document_id: payload.resume_document_id ?? null,
    resume_artifact_id: payload.resume_artifact_id ?? null,
    cover_document_id: payload.cover_document_id ?? null,
    cover_artifact_id: payload.cover_artifact_id ?? null,
    metadata: payload.metadata ?? {},
  };
  const client = ensureClient();

  const { data, error } = await client
    .from("job_materials")
    .insert([row])
    .select(
      "id, user_id, job_id, resume_document_id, resume_artifact_id, cover_document_id, cover_artifact_id, metadata, created_at"
    )
    .single();
  if (error) throw error;
  return data;
}

/** List job_materials rows for a job (owned by user), newest first. */
export async function listJobMaterialsForJob(
  userId: string,
  jobId: number,
  limit = 10
) {
  const client = ensureClient();

  const { data, error } = await client
    .from("job_materials")
    .select(
      "id, user_id, job_id, resume_document_id, resume_artifact_id, cover_document_id, cover_artifact_id, metadata, created_at"
    )
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
