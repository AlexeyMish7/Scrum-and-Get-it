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
  options?: { tone?: string; focus?: string; variant?: number }
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
  listArtifacts,
  getArtifact,
};

export default aiGeneration;
