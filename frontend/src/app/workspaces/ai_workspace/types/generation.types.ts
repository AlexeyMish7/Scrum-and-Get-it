/**
 * AI Generation Types
 *
 * Defines types for AI-powered content generation including requests,
 * responses, options, and orchestration.
 */

/**
 * Document type that can be generated
 */
export type GenerationDocumentType = "resume" | "cover-letter";

/**
 * AI tone options for generated content
 */
export type GenerationTone =
  | "professional"
  | "confident"
  | "enthusiastic"
  | "analytical";

/**
 * Content length preference
 */
export type GenerationLength = "concise" | "standard" | "detailed";

/**
 * Generation request payload
 */
export interface GenerationRequest {
  /** Type of document to generate */
  type: GenerationDocumentType;

  /** Optional job ID for job-specific optimization */
  jobId?: number;

  /** Template ID to use for structure */
  templateId: string;

  /** Theme ID to use for styling */
  themeId: string;

  /** Generation options */
  options: GenerationOptions;

  /** Section configuration */
  sections: SectionConfiguration;
}

/**
 * AI generation options
 */
export interface GenerationOptions {
  /** Optimize for ATS (Applicant Tracking Systems) */
  atsOptimized: boolean;

  /** Match keywords from job description */
  keywordMatch: boolean;

  /** Highlight relevant skills */
  skillsHighlight: boolean;

  /** Include portfolio links */
  includePortfolio: boolean;

  /** Content tone */
  tone: GenerationTone;

  /** Content length preference */
  length: GenerationLength;
}

/**
 * Section configuration for generation
 */
export interface SectionConfiguration {
  [sectionKey: string]: {
    /** Whether section is enabled */
    enabled: boolean;

    /** Custom content override */
    customContent?: unknown;

    /** Section-specific options */
    options?: Record<string, unknown>;
  };
}

/**
 * AI generation result
 */
export interface GenerationResult {
  /** Generated document ID */
  documentId: string;

  /** Version ID for this generation */
  versionId: string;

  /** Generated content */
  content: unknown; // Will be typed by document.types.ts

  /** Generation metadata */
  metadata: GenerationMetadata;

  /** Preview data */
  preview: GenerationPreview;
}

/**
 * Metadata about the generation process
 */
export interface GenerationMetadata {
  /** When content was generated */
  generatedAt: string;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Tokens used in generation */
  tokensUsed: number;

  /** ATS compatibility score (0-100) */
  atsScore?: number;

  /** Keyword match percentage (0-100) */
  keywordMatch?: number;

  /** AI model used */
  model?: string;

  /** Generation errors or warnings */
  issues?: GenerationIssue[];
}

/**
 * Generation issue/warning
 */
export interface GenerationIssue {
  /** Severity level */
  severity: "error" | "warning" | "info";

  /** Issue message */
  message: string;

  /** Affected section */
  section?: string;

  /** Suggested fix */
  suggestion?: string;
}

/**
 * Preview data for generated content
 */
export interface GenerationPreview {
  /** HTML preview */
  html: string;

  /** Optional PDF preview URL */
  pdf?: string;

  /** Preview thumbnail URL */
  thumbnail?: string;
}

/**
 * Generation progress update
 */
export interface GenerationProgress {
  /** Current step */
  step: GenerationStep;

  /** Progress percentage (0-100) */
  progress: number;

  /** Status message */
  message: string;

  /** Is generation complete */
  complete: boolean;

  /** Error if generation failed */
  error?: string;
}

/**
 * Generation process steps
 */
export type GenerationStep =
  | "initializing"
  | "analyzing-profile"
  | "analyzing-job"
  | "optimizing-content"
  | "generating-sections"
  | "applying-template"
  | "applying-theme"
  | "finalizing"
  | "complete";

/**
 * Regeneration request for specific sections
 */
export interface RegenerationRequest {
  /** Document ID to regenerate */
  documentId: string;

  /** Version to base regeneration on */
  baseVersionId: string;

  /** Sections to regenerate */
  sections: string[];

  /** Updated options */
  options?: Partial<GenerationOptions>;
}
