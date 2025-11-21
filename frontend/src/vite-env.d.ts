/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase configuration
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  // AI Backend Server URL (Node.js/Express server)
  // Default: http://localhost:8787
  readonly VITE_AI_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
