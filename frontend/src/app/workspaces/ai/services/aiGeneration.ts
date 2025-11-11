/**
 * High-level AI generation service wrappers.
 * Each function calls a backend endpoint and returns a typed response.
 */
import aiClient from "./client";
import type {
  GenerateResponse,
  SkillsOptimizationContent,
  GenerateResumeResult,
  ExperienceTailoringResult,
  AIArtifactSummary,
  AIArtifact,
} from "../types/ai";

export async function generateResume(
  userId: string,
  jobId: number,
  options?: {
    tone?: string;
    focus?: string;
    variant?: number;
    model?: string;
    prompt?: string;
  }
): Promise<GenerateResumeResult> {
  // POST /api/generate/resume (returns full content when available)
  return aiClient.postJson<GenerateResumeResult>(
    "/api/generate/resume",
    { jobId, options },
    userId
  );
}

export async function generateCoverLetter(
  userId: string,
  jobId: number,
  options?: { tone?: string; focus?: string }
) {
  // POST /api/generate/cover-letter
  return aiClient.postJson<GenerateResponse>(
    "/api/generate/cover-letter",
    { jobId, options },
    userId
  );
}

export interface SkillsOptimizationResult extends GenerateResponse {
  content?: SkillsOptimizationContent; // optional full content if backend chooses to include it later
}

export async function generateSkillsOptimization(
  userId: string,
  jobId: number
) {
  // POST /api/generate/skills-optimization
  return aiClient.postJson<SkillsOptimizationResult>(
    "/api/generate/skills-optimization",
    { jobId },
    userId
  );
}

export async function generateExperienceTailoring(
  userId: string,
  jobId: number
): Promise<ExperienceTailoringResult> {
  // POST /api/generate/experience-tailoring
  return aiClient.postJson<ExperienceTailoringResult>(
    "/api/generate/experience-tailoring",
    { jobId },
    userId
  );
}

export async function generateCompanyResearch(
  userId: string,
  companyName: string,
  jobId?: number
): Promise<GenerateResponse> {
  // POST /api/generate/company-research
  return aiClient.postJson<GenerateResponse>(
    "/api/generate/company-research",
    { companyName, jobId },
    userId
  );
}

// Artifacts listing / retrieval -------------------------------------------
export async function listArtifacts(
  userId: string,
  params: { kind?: string; jobId?: number; limit?: number; offset?: number }
): Promise<{ items: AIArtifactSummary[]; persisted: boolean }> {
  const qs = new URLSearchParams();
  if (params.kind) qs.set("kind", params.kind);
  if (typeof params.jobId === "number") qs.set("jobId", String(params.jobId));
  if (typeof params.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params.offset === "number")
    qs.set("offset", String(params.offset));
  const path = `/api/artifacts${qs.toString() ? `?${qs.toString()}` : ""}`;
  return aiClient.getJson<{ items: AIArtifactSummary[]; persisted: boolean }>(
    path,
    userId
  );
}

export async function getArtifact(
  userId: string,
  id: string
): Promise<{ artifact: AIArtifact }> {
  return aiClient.getJson<{ artifact: AIArtifact }>(
    `/api/artifacts/${encodeURIComponent(id)}`,
    userId
  );
}

export const aiGeneration = {
  generateResume,
  generateCoverLetter,
  generateSkillsOptimization,
  generateExperienceTailoring,
  generateCompanyResearch,
  // New job materials endpoints
  linkJobMaterials,
  listJobMaterials,
  listArtifacts,
  getArtifact,
  createDocumentAndLink,
};

export default aiGeneration;

/**
 * createDocumentAndLink
 * WHAT: Convenience helper to upload a generated artifact (Blob/File) to a storage bucket, create a documents row, then link it in job_materials.
 * WHY: Streamlines export → attach workflow for resume artifacts (PDF/DOCX) without duplicating logic in UI.
 * INPUT:
 *  userId: current user
 *  jobId: job to link materials to
 *  file: Blob or File produced by export pipeline
 *  filename: desired stored file name
 *  kind: documents.kind (resume|cover_letter|other)
 *  linkType: 'resume' | 'cover' (which column in job_materials to set)
 * OUTPUT: { docId, materialId }
 */
import { supabase } from "@shared/services/supabaseClient";
import { withUser } from "@shared/services/crud";

/** Lightweight type representing the inserted documents row we care about */
interface ExportDocumentRow {
  id: string;
  file_name: string;
  file_path: string;
  mime_type?: string | null;
  bytes?: number | null;
}
export async function createDocumentAndLink(params: {
  userId: string;
  jobId: number;
  file: Blob;
  filename: string;
  mime: string;
  kind?: "resume" | "cover_letter" | "other";
  linkType?: "resume" | "cover";
}): Promise<{ docId: string; materialId: string } | null> {
  const {
    userId,
    jobId,
    file,
    filename,
    mime,
    kind = "resume",
    linkType = "resume",
  } = params;
  try {
    const key = `${userId}/exports/${Date.now()}_${filename}`;
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(key, file, { contentType: mime });
    if (uploadErr) throw uploadErr;
    const userCrud = withUser(userId);
    // Insert the new exported document row (scoped by withUser)
    const docRes = await userCrud.insertRow<ExportDocumentRow>("documents", {
      kind: kind === "cover_letter" ? "cover_letter" : kind,
      file_name: filename,
      file_path: key,
      mime_type: mime,
      bytes: (file as File).size || undefined,
      meta: { source: "export", linkType },
    });
    if (docRes.error || !docRes.data)
      throw new Error(docRes.error?.message || "Failed to create document row");
    const docId = docRes.data.id as string;
    const materialRes = await linkJobMaterials(userId, {
      jobId,
      ...(linkType === "resume"
        ? { resume_document_id: docId }
        : { cover_document_id: docId }),
    });
    return { docId, materialId: materialRes.material.id };
  } catch (e) {
    console.warn("createDocumentAndLink failed", e);
    return null;
  }
}

// ---------------- Job Materials Linking -----------------------
/** Link selected resume/cover artifact or document to a job (version selection). */
export async function linkJobMaterials(
  userId: string,
  payload: {
    jobId: number;
    resume_artifact_id?: string;
    resume_document_id?: string;
    cover_artifact_id?: string;
    cover_document_id?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{
  material: {
    id: string;
    user_id: string;
    job_id: number;
    resume_artifact_id?: string | null;
    resume_document_id?: string | null;
    cover_artifact_id?: string | null;
    cover_document_id?: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
  };
}> {
  return aiClient.postJson(
    "/api/job-materials",
    {
      jobId: payload.jobId,
      resume_artifact_id: payload.resume_artifact_id,
      resume_document_id: payload.resume_document_id,
      cover_artifact_id: payload.cover_artifact_id,
      cover_document_id: payload.cover_document_id,
      metadata: payload.metadata,
    },
    userId
  );
}

/** List recently linked materials for a job. */
export async function listJobMaterials(
  userId: string,
  jobId: number,
  limit = 10
): Promise<{
  items: Array<{
    id: string;
    created_at: string;
    resume_artifact_id?: string | null;
    resume_document_id?: string | null;
    cover_artifact_id?: string | null;
    cover_document_id?: string | null;
    metadata?: Record<string, unknown>;
  }>;
  persisted: boolean;
}> {
  return aiClient.getJson(
    `/api/jobs/${encodeURIComponent(String(jobId))}/materials?limit=${limit}`,
    userId
  );
}
