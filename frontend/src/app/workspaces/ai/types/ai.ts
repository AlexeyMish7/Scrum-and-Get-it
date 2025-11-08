/**
 * Frontend types for AI service responses.
 */

export type AIKind = "resume" | "cover_letter" | "skills_optimization" | string;

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
