/**
 * Job Materials Service
 *
 * WHAT: Service for linking resumes/cover letters to job applications
 * WHY: Track which materials were used for each job application
 *
 * Features:
 * - Link cover letter drafts/artifacts to jobs
 * - Link resume versions to jobs
 * - Maintain version history
 * - Query current materials for a job
 *
 * Database: job_materials table
 * - Supports both documents (uploaded files) and AI artifacts (generated content)
 * - History maintained by inserting new rows per update
 * - Latest materials retrieved via v_job_current_materials view
 */

import { supabase } from "@shared/services/supabaseClient";

export interface JobMaterial {
  id: string;
  user_id: string;
  job_id: number;
  resume_document_id?: string | null;
  resume_artifact_id?: string | null;
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CurrentJobMaterials {
  job_id: number;
  user_id: string;
  resume_document_id?: string | null;
  resume_artifact_id?: string | null;
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown>;
  linked_at: string;
}

/**
 * Link a cover letter to a job application
 * Creates a new job_materials entry (history is maintained)
 */
export async function linkCoverLetterToJob(params: {
  userId: string;
  jobId: number;
  coverDocumentId?: string;
  coverArtifactId?: string;
  metadata?: Record<string, unknown>;
}): Promise<JobMaterial | null> {
  const {
    userId,
    jobId,
    coverDocumentId,
    coverArtifactId,
    metadata = {},
  } = params;

  const { data, error } = await supabase
    .from("job_materials")
    .insert({
      user_id: userId,
      job_id: jobId,
      cover_document_id: coverDocumentId || null,
      cover_artifact_id: coverArtifactId || null,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to link cover letter to job:", error);
    return null;
  }

  return data;
}

/**
 * Link a resume to a job application
 * Creates a new job_materials entry (history is maintained)
 */
export async function linkResumeToJob(params: {
  userId: string;
  jobId: number;
  resumeDocumentId?: string;
  resumeArtifactId?: string;
  metadata?: Record<string, unknown>;
}): Promise<JobMaterial | null> {
  const {
    userId,
    jobId,
    resumeDocumentId,
    resumeArtifactId,
    metadata = {},
  } = params;

  const { data, error } = await supabase
    .from("job_materials")
    .insert({
      user_id: userId,
      job_id: jobId,
      resume_document_id: resumeDocumentId || null,
      resume_artifact_id: resumeArtifactId || null,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to link resume to job:", error);
    return null;
  }

  return data;
}

/**
 * Link both resume and cover letter to a job application
 * Creates a new job_materials entry with both materials
 */
export async function linkMaterialsToJob(params: {
  userId: string;
  jobId: number;
  resumeDocumentId?: string;
  resumeArtifactId?: string;
  coverDocumentId?: string;
  coverArtifactId?: string;
  metadata?: Record<string, unknown>;
}): Promise<JobMaterial | null> {
  const {
    userId,
    jobId,
    resumeDocumentId,
    resumeArtifactId,
    coverDocumentId,
    coverArtifactId,
    metadata = {},
  } = params;

  const { data, error } = await supabase
    .from("job_materials")
    .insert({
      user_id: userId,
      job_id: jobId,
      resume_document_id: resumeDocumentId || null,
      resume_artifact_id: resumeArtifactId || null,
      cover_document_id: coverDocumentId || null,
      cover_artifact_id: coverArtifactId || null,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to link materials to job:", error);
    return null;
  }

  return data;
}

/**
 * Get the current (latest) materials linked to a job
 */
export async function getCurrentJobMaterials(
  userId: string,
  jobId: number
): Promise<CurrentJobMaterials | null> {
  const { data, error } = await supabase
    .from("v_job_current_materials")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No materials linked yet
      return null;
    }
    console.error("Failed to get current job materials:", error);
    return null;
  }

  return data;
}

/**
 * Get the full history of materials linked to a job
 * Ordered by creation date (newest first)
 */
export async function getJobMaterialsHistory(
  userId: string,
  jobId: number
): Promise<JobMaterial[]> {
  const { data, error } = await supabase
    .from("job_materials")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get job materials history:", error);
    return [];
  }

  return data || [];
}

/**
 * Get analytics: which cover letters/resumes are used most
 */
export async function getMaterialsUsageStats(userId: string): Promise<{
  coverLetterUsage: Array<{ id: string; count: number }>;
  resumeUsage: Array<{ id: string; count: number }>;
}> {
  const { data, error } = await supabase
    .from("job_materials")
    .select("cover_artifact_id, resume_artifact_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to get materials usage stats:", error);
    return { coverLetterUsage: [], resumeUsage: [] };
  }

  // Count occurrences
  const coverCounts = new Map<string, number>();
  const resumeCounts = new Map<string, number>();

  data.forEach((row) => {
    if (row.cover_artifact_id) {
      coverCounts.set(
        row.cover_artifact_id,
        (coverCounts.get(row.cover_artifact_id) || 0) + 1
      );
    }
    if (row.resume_artifact_id) {
      resumeCounts.set(
        row.resume_artifact_id,
        (resumeCounts.get(row.resume_artifact_id) || 0) + 1
      );
    }
  });

  return {
    coverLetterUsage: Array.from(coverCounts.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    resumeUsage: Array.from(resumeCounts.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
  };
}
