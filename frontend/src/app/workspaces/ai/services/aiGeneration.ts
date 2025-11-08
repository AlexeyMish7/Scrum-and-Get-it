/**
 * High-level AI generation service wrappers.
 * Each function calls a backend endpoint and returns a typed response.
 */
import aiClient from "./client";
import type {
  GenerateResponse,
  SkillsOptimizationContent,
  GenerateResumeResult,
} from "../types/ai";

export async function generateResume(
  userId: string,
  jobId: number,
  options?: { tone?: string; focus?: string }
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

export const aiGeneration = {
  generateResume,
  generateCoverLetter,
  generateSkillsOptimization,
};

export default aiGeneration;
