/**
 * API Request Types
 *
 * Request interfaces for AI generation endpoints.
 * These define the shape of incoming POST requests to /api/generate/*.
 */

/**
 * Request payload for POST /api/generate/resume
 */
export interface GenerateResumeRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  /**
   * Optional generation tuning parameters provided by the client.
   * tone: stylistic direction (e.g., "professional", "enthusiastic", "confident", "analytical")
   * focus: optional emphasis keyword (e.g., "leadership", "backend", "ats", "skills")
   * variant: numeric index for multi-generation UX (select different seed)
   * model: request override for AI model (validated against allow-list)
   * prompt: user-supplied additive snippet appended to the base prompt
   * templateId: resume template identifier for template-aware AI generation
   * length: target content length (concise, standard, detailed)
   */
  options?: {
    tone?: string;
    focus?: string;
    variant?: number;
    model?: string;
    prompt?: string;
    templateId?: string;
    length?: string;
  };
}

/**
 * Request payload for POST /api/generate/cover-letter
 */
export interface GenerateCoverLetterRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  /**
   * See GenerateResumeRequest.options for field semantics
   * templateId: cover letter template identifier for template-aware generation
   * length: target length (brief, standard, detailed)
   * culture: company culture style (startup, corporate, etc.)
   */
  options?: {
    tone?: string;
    focus?: string;
    variant?: number;
    model?: string;
    prompt?: string;
    templateId?: string;
    length?: string;
    culture?: string;
  };
}

/**
 * Request payload for POST /api/generate/skills-optimization
 */
export interface GenerateSkillsOptimizationRequest {
  userId: string; // authenticated user id
  jobId: number; // target job id
}
