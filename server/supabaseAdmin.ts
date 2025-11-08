import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  const { data, error } = await supabaseAdmin
    .from("ai_artifacts")
    .insert([
      {
        id: payload.id,
        user_id: payload.user_id,
        job_id: payload.job_id ?? null,
        kind: payload.kind,
        title: payload.title ?? null,
        prompt: payload.prompt ?? null,
        model: payload.model ?? null,
        content: payload.content,
        metadata: payload.metadata ?? {},
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
