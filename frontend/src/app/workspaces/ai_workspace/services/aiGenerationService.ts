/**
 * AI GENERATION SERVICE (Backend Integration)
 *
 * Purpose:
 * - Wrap @workspaces/ai/services/aiGeneration for use in ai_workspace
 * - Map ai_workspace types to existing AI generation API
 * - Handle document creation and persistence after generation
 * - Track generation sessions in generation_sessions table
 *
 * Backend Connection:
 * - API: POST /api/generate/resume, POST /api/generate/cover-letter
 * - Auth: JWT token from @shared/context/AuthContext
 * - Database: documents, document_versions, generation_sessions tables
 *
 * Flow:
 * 1. Call AI backend with job context and options
 * 2. Receive generated content from AI
 * 3. Save to documents table with template/theme references
 * 4. Create initial version in document_versions table
 * 5. Link to job via document_jobs table (if jobId provided)
 * 6. Return document ID and preview for UI
 */

import aiGeneration from "@workspaces/ai/services/aiGeneration";
import { withUser } from "@shared/services/crud";
import type {
  GenerationDocumentType,
  GenerationOptions,
  GenerationResult,
  GenerationProgress,
} from "../types";
import type { Template, Theme } from "../types/template.types";

/**
 * Job context data (re-export from JobContextStep component)
 */
export interface JobContext {
  /** Optional job ID if selecting from saved jobs */
  jobId?: number;
  /** Company name */
  companyName?: string;
  /** Job title */
  jobTitle?: string;
  /** Job description text */
  jobDescription?: string;
  /** Key requirements extracted from job posting */
  keyRequirements?: string[];
}

/**
 * Generate resume with AI
 *
 * Inputs:
 * - userId: User UUID from auth context
 * - template: Selected resume template
 * - theme: Selected visual theme
 * - jobContext: Optional job details for tailoring
 * - options: Generation preferences (tone, length, ATS optimization, etc.)
 *
 * Outputs:
 * - GenerationResult with document ID, content preview, metadata
 *
 * Error modes:
 * - AI generation failure (backend error, timeout)
 * - Database save failure (RLS, validation)
 * - Job not found (if jobId provided but doesn't exist)
 */
export async function generateResume(
  userId: string,
  template: Template,
  _theme: Theme, // Unused for now, will be used when saving to database
  jobContext?: JobContext,
  options?: GenerationOptions
): Promise<GenerationResult> {
  // Call backend AI generation
  const result = await aiGeneration.generateResume(
    userId,
    jobContext?.jobId || 0, // Use 0 if no job (general resume)
    {
      tone: options?.tone || "professional",
      templateId: template.id,
      // Map ai_workspace options to backend API
      ...(options?.atsOptimized && { focus: "ats" }),
      ...(options?.skillsHighlight && { focus: "skills" }),
    }
  );

  // Save to documents table
  const userCrud = withUser(userId);

  const documentData = {
    type: "resume" as const,
    status: "draft" as const,
    name: jobContext?.jobTitle ? `Resume - ${jobContext.jobTitle}` : "Resume",
    template_id: template.id,
    theme_id: _theme.id,
    template_overrides: {},
    theme_overrides: {},
    content: result.content || {},
    job_id: jobContext?.jobId || null,
    target_role: jobContext?.jobTitle || null,
    target_company: jobContext?.companyName || null,
    tags: [],
    total_versions: 1,
    total_edits: 0,
    times_exported: 0,
    times_used: 0,
    word_count: 0,
    is_default: false,
    is_pinned: false,
    is_archived: false,
    last_edited_at: new Date().toISOString(),
  };

  const documentResult = await userCrud.insertRow<{ id: string }>(
    "documents",
    documentData
  );

  if (documentResult.error || !documentResult.data) {
    throw new Error(documentResult.error?.message || "Failed to save document");
  }

  const document = documentResult.data;

  // Create initial version in document_versions table
  const versionData = {
    document_id: document.id,
    version_number: 1,
    content: result.content || {},
    template_id: template.id,
    theme_id: _theme.id,
    template_overrides: {},
    theme_overrides: {},
    job_id: jobContext?.jobId || null,
    name: "Initial Generation",
    description: "AI-generated resume",
    tags: [],
    change_type: "ai-generated" as const,
    changed_sections: [],
    word_count: 0,
    character_count: 0,
    status: "active" as const,
    is_pinned: false,
    is_archived: false,
    created_by: userId,
  };

  const versionResult = await userCrud.insertRow<{ id: string }>(
    "document_versions",
    versionData
  );

  if (versionResult.error || !versionResult.data) {
    throw new Error(
      versionResult.error?.message || "Failed to save document version"
    );
  }

  const version = versionResult.data;

  // Update document with current_version_id
  await userCrud.updateRow(
    "documents",
    { current_version_id: version.id },
    { eq: { id: document.id } }
  );

  // Link to job via document_jobs table if jobId provided
  if (jobContext?.jobId) {
    await userCrud.insertRow("document_jobs", {
      document_id: document.id,
      job_id: jobContext.jobId,
      document_type: "resume" as const,
      status: "draft" as const,
      application_status: null,
      submitted_at: null,
    });
  }

  // Return result matching ai_workspace types
  return {
    documentId: document.id,
    versionId: version.id,
    content: result.content || {},
    preview: {
      html: result.preview || "Generated resume preview...",
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      processingTime: 0,
      tokensUsed: 0,
      model: "gpt-4o-mini",
      issues: [],
    },
  };
}

/**
 * Generate cover letter with AI
 *
 * Inputs:
 * - userId: User UUID from auth context
 * - template: Selected cover letter template
 * - theme: Selected visual theme
 * - jobContext: Job details for tailoring (required for cover letters)
 * - options: Generation preferences (tone, length, culture fit, etc.)
 *
 * Outputs:
 * - GenerationResult with document ID, content preview, metadata
 *
 * Error modes:
 * - AI generation failure (backend error, timeout)
 * - Database save failure (RLS, validation)
 * - Job not found or missing required fields
 */
export async function generateCoverLetter(
  userId: string,
  template: Template,
  _theme: Theme, // Unused for now, will be used when saving to database
  jobContext: JobContext, // Required for cover letters
  options?: GenerationOptions
): Promise<GenerationResult> {
  if (!jobContext?.jobId) {
    throw new Error("Job context required for cover letter generation");
  }

  // Call backend AI generation
  const result = await aiGeneration.generateCoverLetter(
    userId,
    jobContext.jobId,
    {
      tone: options?.tone || "professional",
      length: options?.length || "standard",
      templateId: template.id,
    }
  );

  // Save to documents table
  const userCrud = withUser(userId);

  const documentData = {
    type: "cover-letter" as const,
    status: "draft" as const,
    name: `Cover Letter - ${jobContext.jobTitle}`,
    template_id: template.id,
    theme_id: _theme.id,
    template_overrides: {},
    theme_overrides: {},
    content: result.content || {},
    job_id: jobContext.jobId,
    target_role: jobContext.jobTitle,
    target_company: jobContext.companyName,
    tags: [],
    total_versions: 1,
    total_edits: 0,
    times_exported: 0,
    times_used: 0,
    word_count: 0,
    is_default: false,
    is_pinned: false,
    is_archived: false,
    last_edited_at: new Date().toISOString(),
  };

  const documentResult = await userCrud.insertRow<{ id: string }>(
    "documents",
    documentData
  );

  if (documentResult.error || !documentResult.data) {
    throw new Error(documentResult.error?.message || "Failed to save document");
  }

  const document = documentResult.data;

  // Create initial version in document_versions table
  const versionData = {
    document_id: document.id,
    version_number: 1,
    content: result.content || {},
    template_id: template.id,
    theme_id: _theme.id,
    template_overrides: {},
    theme_overrides: {},
    job_id: jobContext.jobId,
    name: "Initial Generation",
    description: "AI-generated cover letter",
    tags: [],
    change_type: "ai-generated" as const,
    changed_sections: [],
    word_count: 0,
    character_count: 0,
    status: "active" as const,
    is_pinned: false,
    is_archived: false,
    created_by: userId,
  };

  const versionResult = await userCrud.insertRow<{ id: string }>(
    "document_versions",
    versionData
  );

  if (versionResult.error || !versionResult.data) {
    throw new Error(
      versionResult.error?.message || "Failed to save document version"
    );
  }

  const version = versionResult.data;

  // Update document with current_version_id
  await userCrud.updateRow(
    "documents",
    { current_version_id: version.id },
    { eq: { id: document.id } }
  );

  // Link to job via document_jobs table
  await userCrud.insertRow("document_jobs", {
    document_id: document.id,
    job_id: jobContext.jobId,
    document_type: "cover-letter" as const,
    status: "draft" as const,
    application_status: null,
    submitted_at: null,
  });

  // Return result matching ai_workspace types
  return {
    documentId: document.id,
    versionId: version.id,
    content: result.content || {},
    preview: {
      html: result.preview || "Generated cover letter preview...",
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      processingTime: 0,
      tokensUsed: 0,
      model: "gpt-4o-mini",
      issues: [],
    },
  };
}

/**
 * Generate document (resume or cover letter)
 * Convenience wrapper that routes to appropriate generation function
 */
export async function generateDocument(
  userId: string,
  documentType: GenerationDocumentType,
  template: Template,
  theme: Theme,
  jobContext?: JobContext,
  options?: GenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  // Report progress if callback provided
  const reportProgress = (
    step: GenerationProgress["step"],
    progress: number,
    message: string
  ) => {
    if (onProgress) {
      onProgress({ step, progress, message, complete: false });
    }
  };

  try {
    reportProgress("initializing", 10, "Initializing generation...");

    reportProgress("analyzing-profile", 25, "Analyzing your profile...");

    if (jobContext?.jobId) {
      reportProgress("analyzing-job", 40, "Analyzing job requirements...");
    }

    reportProgress("optimizing-content", 55, "Optimizing content...");

    // Route to appropriate generation function
    let result: GenerationResult;
    if (documentType === "resume") {
      reportProgress(
        "generating-sections",
        70,
        "Generating resume sections..."
      );
      result = await generateResume(
        userId,
        template,
        theme,
        jobContext,
        options
      );
    } else {
      reportProgress("generating-sections", 70, "Generating cover letter...");
      result = await generateCoverLetter(
        userId,
        template,
        theme,
        jobContext!,
        options
      );
    }

    reportProgress("applying-template", 85, "Applying template...");
    reportProgress("applying-theme", 95, "Applying theme...");
    reportProgress("finalizing", 100, "Finalizing document...");

    if (onProgress) {
      onProgress({
        step: "complete",
        progress: 100,
        message: "Document generated successfully!",
        complete: true,
      });
    }

    return result;
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}

export default {
  generateResume,
  generateCoverLetter,
  generateDocument,
};
