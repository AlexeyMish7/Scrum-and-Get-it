/**
 * Creates a single Supabase client for the whole app.
 * - Reads Vite env vars (declared in src/vite-env.d.ts)
 * - Throws early if env vars are missing (helps catch misconfig)
 
*/
import { createClient } from "@supabase/supabase-js";

// Vite injects these at build/dev time. The .d.ts tells TS they exist.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Optional runtime guard: fail fast if .env is not set correctly.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

// Export a single client to be reused everywhere.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
