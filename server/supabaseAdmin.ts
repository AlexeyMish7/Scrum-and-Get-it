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
