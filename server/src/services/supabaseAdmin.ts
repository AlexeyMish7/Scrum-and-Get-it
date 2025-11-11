import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment"
  );
}

const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // keep session storage off for server-side usage
      persistSession: false,
    },
  }
);

export default supabaseAdmin;

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

  const { data, error } = await supabaseAdmin
    .from("ai_artifacts")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Fetch a profile by user id (service role). */
export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetch a job by id (service role). */
export async function getJob(jobId: number) {
  const { data, error } = await supabaseAdmin
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
  const { userId, kind, jobId, limit = 20, offset = 0 } = params;
  let q = supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select(
      "id, user_id, kind, file_name, file_path, mime_type, bytes, uploaded_at"
    )
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
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
