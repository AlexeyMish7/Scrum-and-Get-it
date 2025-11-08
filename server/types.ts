/**
 * Shared TypeScript types for the server-side AI orchestrator.
 */

export interface GenerateResumeRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  options?: { tone?: string; focus?: string; variant?: number }; // variant index for multi-generation UI
}

export interface GenerateCoverLetterRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  options?: { tone?: string; focus?: string; variant?: number };
}

export interface GenerateSkillsOptimizationRequest {
  userId: string; // authenticated user id
  jobId: number; // target job id
}

export interface ArtifactRow {
  id: string;
  user_id: string;
  job_id?: number | null;
  kind: string; // 'resume' | 'cover_letter' | ...
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: unknown;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

/**
 * ResumeArtifactContent
 * Normalized JSON contract returned/stored for resume generation artifacts.
 * This goes into ai_artifacts.content (jsonb) for kind='resume'.
 * Fields are optional to allow incremental enhancement without breaking existing rows.
 */
export interface ResumeArtifactContent {
  /** Candidate summary rewritten or optimized (optional) */
  summary?: string;
  /** Primary bullet points (flattened list when sections are not distinguished) */
  bullets?: Array<{ text: string }>;
  /** ATS-relevant ordered skills list (already prioritized) */
  ordered_skills?: string[];
  /** Skills recommended to emphasize (subset of ordered_skills) */
  emphasize_skills?: string[];
  /** Optional additional skills to consider adding */
  add_skills?: string[];
  /** Extracted or suggested ATS keywords */
  ats_keywords?: string[];
  /** Overall relevance / optimization score (0–100) */
  score?: number;
  /** Structured sections for richer editors */
  sections?: {
    experience?: Array<{
      employment_id?: string; // references employment.id (uuid) when available
      role?: string;
      company?: string;
      dates?: string; // human-readable date range
      bullets: string[]; // tailored bullets per role
    }>;
    education?: Array<{
      education_id?: string; // references education.id
      institution?: string;
      degree?: string;
      graduation_date?: string;
      details?: string[]; // optional lines
    }>;
    projects?: Array<{
      project_id?: string; // references projects.id
      name?: string;
      role?: string;
      bullets: string[];
    }>;
  };
  /** Free-form provider or orchestration metadata (version, model hints, etc.) */
  meta?: Record<string, unknown>;
}

/** Response shape for POST /api/generate/resume when we return full content */
export interface GenerateResumeResponse {
  id: string;
  kind: "resume";
  created_at?: string;
  preview?: string | null;
  content?: ResumeArtifactContent; // included when not suppressed for perf
  persisted?: boolean; // true when stored in ai_artifacts
  metadata?: Record<string, unknown>;
}
