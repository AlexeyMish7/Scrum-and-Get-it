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
