/**
 * Shared TypeScript types for the server-side AI orchestrator.
 */

export interface GenerateResumeRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  options?: { tone?: string; focus?: string };
}

export interface GenerateCoverLetterRequest {
  userId: string; // authenticated user id (validated server-side)
  jobId: number; // target job id
  options?: { tone?: string; focus?: string };
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
