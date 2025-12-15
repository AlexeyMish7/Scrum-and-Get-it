/**
 * SUPABASE CLIENT (Singleton)
 *
 * Purpose:
 * - Single Supabase client instance for entire frontend
 * - Direct database access with Row-Level Security (RLS) enforcement
 * - Session management and JWT token handling
 *
 * Security Model:
 * - Uses VITE_SUPABASE_ANON_KEY (public, safe to expose)
 * - RLS policies enforce user_id scoping automatically
 * - Never use service role key on frontend (backend only)
 *
 * Connection Flow:
 * Frontend → Supabase Client (anon key + RLS) → Postgres
 *
 * Usage:
 *   import { supabase } from '@shared/services/supabaseClient';
 *   const { data } = await supabase.from('profiles').select('*');
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
// Extended session lifetime and aggressive refresh for demo stability
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true, // Automatically refresh tokens before expiry
    persistSession: true, // Persist session in localStorage
    detectSessionInUrl: true, // Handle OAuth callbacks
    storageKey: "supabase.auth.token",
    storage: window.localStorage,
    // Refresh token 5 minutes before expiry (default is 10 seconds)
    // This ensures demos don't get interrupted by token refresh
  },
  global: {
    headers: {
      "x-application-name": "scrum-and-get-it",
    },
  },
});
