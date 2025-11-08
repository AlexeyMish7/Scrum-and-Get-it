// AI Artifacts TypeScript contract
// Keep interfaces simple and serializable. These mirror the jsonb `content` stored per artifact row.
// Kind discriminator allows narrowing at usage sites.

export type AiArtifactKind =
  | "resume"
  | "cover_letter"
  | "skills_optimization"
  | "company_research"
  | "match"
  | "gap_analysis";

// Resume artifact content
export interface ResumeBullet {
  text: string; // Final bullet text
  impact_score?: number; // Optional 0..1 or relative ranking
  source_employment_id?: string | null; // Link to employment row that inspired this bullet
}

export interface ResumeVariant {
  id: string; // Client-generated UUID or short id
  name?: string; // Optional display name, e.g. "Leadership Emphasis"
  bullets: ResumeBullet[]; // Bullet set for this variant
  relevance_score?: number; // Optional numeric score relative to target job
}

export interface ResumeContent {
  bullets: ResumeBullet[]; // Primary chosen bullets
  variants?: ResumeVariant[]; // Alternative sets user can switch to
  summary?: string; // Optional short professional summary tailored to job
}

// Cover letter artifact content
export interface CoverLetterSections {
  opening: string;
  body: string;
  closing: string;
}

export interface HighlightedExperience {
  employment_id?: string; // Reference to employment row
  snippet: string; // Short tailored sentence/phrase
  reason: string; // Why it's relevant (for explainability/UI tooltip)
}

export interface CoverLetterVariant {
  id: string;
  tone: string; // e.g. "formal" | "casual" | "enthusiastic" | custom
  content: CoverLetterSections;
  relevance_score?: number;
}

export interface CoverLetterContent {
  sections: CoverLetterSections; // Selected final sections
  variants?: CoverLetterVariant[]; // Alternate tone/style variations
  highlighted_experiences?: HighlightedExperience[]; // Experiences surfaced during generation
}

// Skills optimization artifact content
export interface OriginalSkillEntry {
  skill_name: string;
  proficiency?: string; // Raw proficiency (enum or free-form)
}

export interface OptimizedSkillEntry {
  skill_name: string;
  recommended_proficiency?: string; // Suggested proficiency label
  reason: string; // Why prioritize / emphasize
  weight?: number; // Relative importance weight
}

export interface SkillsOptimizationContent {
  original_skills: OriginalSkillEntry[];
  optimized_skills: OptimizedSkillEntry[];
  keywords_to_add?: string[]; // Extra keyword suggestions for ATS
  overall_score?: number; // Aggregate relevance score 0..100 or 0..1
}

// Company research artifact content
export interface CompanyNewsItem {
  title: string;
  source: string;
  date: string; // ISO date string
  url?: string;
  summary: string; // Brief distilled points
}

export interface CompanyResearchContent {
  name: string;
  size?: string;
  industry?: string;
  mission?: string;
  top_products?: string[];
  recent_news?: CompanyNewsItem[];
  trust_level?: "verified" | "needs_review" | "unverified"; // Data confidence indicator
}

// Match score artifact content
export interface MatchedSkillEntry {
  skill_name: string;
  match_level: number; // e.g. 0..1 or 0..100 representing closeness
}

export interface MissingSkillEntry {
  skill_name: string;
  impact: number; // Impact weight on overall match
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  other?: number;
}

export interface MatchContent {
  overall_score: number; // 0..100
  breakdown: MatchBreakdown;
  matched_skills: MatchedSkillEntry[];
  missing_skills: MissingSkillEntry[];
  explanation: string; // Human readable summary of results
}

// Gap analysis artifact content
export interface GapSkillEntry {
  skill_name: string;
  recommended_learning: string[]; // e.g. course titles, topics, actions
  impact_rank: number; // Relative priority (1 = highest)
}

export interface SuggestedPlanStep {
  step: string; // Action description
  est_hours: number; // Estimated time to complete
}

export interface GapAnalysisContent {
  missing: GapSkillEntry[];
  suggested_plan?: SuggestedPlanStep[];
}

// Union of all content types
export type AiArtifactContentUnion =
  | ResumeContent
  | CoverLetterContent
  | SkillsOptimizationContent
  | CompanyResearchContent
  | MatchContent
  | GapAnalysisContent;

// Row shape (mirrors DB columns); content + metadata remain generic JSON structures
export interface AiArtifactRow {
  id: string;
  user_id: string;
  job_id?: number | null;
  kind: AiArtifactKind;
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: Record<string, unknown>; // Raw jsonb from DB; caller can narrow via kind
  metadata?: Record<string, unknown> | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Payload for insertion (content must already match expected shape for its kind)
export interface InsertAiArtifactPayload {
  kind: AiArtifactKind;
  content: AiArtifactContentUnion | Record<string, unknown>;
  title?: string;
  job_id?: number; // optional association
  prompt?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

// Type guards (lightweight runtime narrowing)
export function isResumeContent(c: unknown): c is ResumeContent {
  if (!c || typeof c !== "object") return false;
  const obj = c as { bullets?: unknown };
  return Array.isArray(obj.bullets);
}

export function isCoverLetterContent(c: unknown): c is CoverLetterContent {
  if (!c || typeof c !== "object") return false;
  const obj = c as { sections?: { opening?: unknown } };
  return !!obj.sections && typeof obj.sections.opening === "string";
}

export function isMatchContent(c: unknown): c is MatchContent {
  if (!c || typeof c !== "object") return false;
  const obj = c as { overall_score?: unknown; breakdown?: unknown };
  return typeof obj.overall_score === "number" && !!obj.breakdown;
}

export function isGapAnalysisContent(c: unknown): c is GapAnalysisContent {
  if (!c || typeof c !== "object") return false;
  const obj = c as { missing?: unknown };
  return Array.isArray(obj.missing);
}

// Example artifact factory helpers (optional usage by orchestrator tests)
export function createEmptyResumeContent(): ResumeContent {
  return { bullets: [], variants: [] };
}

export function createEmptyCoverLetterContent(): CoverLetterContent {
  return {
    sections: { opening: "", body: "", closing: "" },
    variants: [],
    highlighted_experiences: [],
  };
}
