/**
 * Frontend types for AI service responses.
 */

export type AIKind = "resume" | "cover_letter" | "skills_optimization" | string; // future kinds or subkinds flagged via metadata

export interface GenerateResponse {
  id: string;
  kind: AIKind;
  created_at?: string;
  preview?: string | null;
  persisted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SkillsOptimizationContent {
  emphasize: string[];
  add: string[];
  order: string[];
  categories: { technical: string[]; soft: string[] };
  gaps: string[];
  score: number; // 0..100
}

// Resume content contract (subset aligning with server/types ResumeArtifactContent)
export interface ResumeArtifactContent {
  summary?: string;
  bullets?: Array<{ text: string }>;
  ordered_skills?: string[];
  emphasize_skills?: string[];
  add_skills?: string[];
  ats_keywords?: string[];
  score?: number;
  sections?: {
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
      original_bullets?: string[]; // Original bullets from profile (for comparison)
      relevance_score?: number; // 0..100 how relevant this role is to the target job
      notes?: string[]; // AI notes explaining tailoring choices
    }>;
    education?: Array<{
      education_id?: string;
      institution?: string;
      degree?: string;
      graduation_date?: string;
      details?: string[];
    }>;
    projects?: Array<{
      project_id?: string;
      name?: string;
      role?: string;
      bullets: string[];
    }>;
  };
  meta?: Record<string, unknown>;
}

export interface GenerateResumeResult extends GenerateResponse {
  content?: ResumeArtifactContent;
}

// Experience tailoring content (subset of resume, specialized for UC-050)
export interface ExperienceTailoringContent {
  roles: Array<{
    employment_id?: string;
    role?: string;
    company?: string;
    dates?: string;
    original_bullets?: string[];
    tailored_bullets: string[];
    relevance_score: number; // 0..100
    notes?: string[];
  }>;
  overall?: {
    summary_suggestion?: string;
    keywords?: string[];
    global_score: number; // 0..100
  };
}

export interface ExperienceTailoringResult extends GenerateResponse {
  content?: ExperienceTailoringContent;
}

// AI Artifact listing (resume artifacts history) ---------------------------
export interface AIArtifactSummary {
  id: string;
  kind: AIKind;
  job_id?: number | null;
  title?: string | null;
  created_at?: string;
  // content may be included by list endpoint (we request it) but can be partial.
  content?: unknown; // will be narrowed when applying (cast to ResumeArtifactContent)
}

export interface AIArtifact extends AIArtifactSummary {
  prompt?: string | null;
  model?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ---------------- Preview modeling (UI-focused) ---------------------------
/**
 * ResumePreviewModel
 * A UI-friendly shape for rendering the resume preview consistently.
 * Derived from ResumeArtifactContent with minor normalization.
 */
export interface ResumePreviewModel {
  summary?: string;
  skills?: string[];
  emphasize_skills?: string[];
  add_skills?: string[];
  experience?: Array<{
    employment_id?: string;
    role?: string;
    company?: string;
    dates?: string;
    bullets: string[];
  }>;
  education?: Array<{
    education_id?: string;
    institution?: string;
    degree?: string;
    graduation_date?: string;
    details?: string[];
  }>;
  projects?: Array<{
    project_id?: string;
    name?: string;
    role?: string;
    bullets: string[];
  }>;
  ats_keywords?: string[];
  score?: number;
  meta?: Record<string, unknown>;
}

/** Optional UI hints for output formatting intent */
export type OutputFormatIntent = "screen" | "pdf" | "docx";
/** Optional preview mode for the editor */
export type PreviewMode = "live" | "final";
/** Optional per-section visibility toggles */
export interface SectionToggles {
  summary?: boolean;
  skills?: boolean;
  experience?: boolean;
  education?: boolean;
  projects?: boolean;
}
