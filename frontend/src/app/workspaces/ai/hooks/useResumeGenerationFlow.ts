import { useCallback, useMemo, useRef, useState } from "react";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import {
  generateResume,
  generateSkillsOptimization,
  generateExperienceTailoring,
} from "@workspaces/ai/services/aiGeneration";
import type {
  GenerateResumeResult,
  ResumeArtifactContent,
  ExperienceTailoringResult,
  SkillsOptimizationContent,
} from "@workspaces/ai/types/ai";

export type SegmentStatus = "idle" | "running" | "success" | "error";

export interface FlowOptions {
  tone?: string;
  focus?: string;
  includeSkills?: boolean;
  includeExperience?: boolean;
}

export interface FlowState {
  base: SegmentStatus;
  skills: SegmentStatus;
  experience: SegmentStatus;
}

export interface UnifiedResult {
  content: ResumeArtifactContent | null;
  base?: GenerateResumeResult | null;
  skills?: SkillsOptimizationContent | null;
  experience?: ExperienceTailoringResult["content"] | null;
}

/**
 * useResumeGenerationFlow
 * Orchestrates the three generation endpoints and merges results into a single ResumeArtifactContent.
 * Inputs: userId, jobId, options (tone/focus + segment toggles)
 * Output: { run, state, result, reset }
 */
export default function useResumeGenerationFlow(userId?: string) {
  const { handleError, showSuccess } = useErrorHandler();
  const [state, setState] = useState<FlowState>({
    base: "idle",
    skills: "idle",
    experience: "idle",
  });
  const [result, setResult] = useState<UnifiedResult>({ content: null });
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    setState({ base: "idle", skills: "idle", experience: "idle" });
    setResult({ content: null });
  }, []);

  const merge = useCallback(
    (
      baseContent: ResumeArtifactContent | undefined,
      skills?: SkillsOptimizationContent | null,
      tailored?: UnifiedResult["experience"] | null
    ): ResumeArtifactContent => {
      const merged: ResumeArtifactContent = {
        ...(baseContent ?? {}),
      };
      // Skills optimization: prefer ordered list from optimization if present
      if (skills?.order?.length) {
        merged.ordered_skills = skills.order.slice();
        merged.emphasize_skills = skills.emphasize?.slice();
        merged.add_skills = skills.add?.slice();
      }
      // Experience tailoring: map roles into sections.experience
      if (tailored?.roles?.length) {
        merged.sections = merged.sections || {};
        merged.sections.experience = tailored.roles.map((r) => ({
          employment_id: r.employment_id,
          role: r.role,
          company: r.company,
          dates: r.dates,
          bullets: r.tailored_bullets || [],
        }));
      }
      // Mark meta
      merged.meta = {
        ...(merged.meta ?? {}),
        unified: true,
        has_skills_opt: Boolean(skills),
        has_experience_tailoring: Boolean(tailored?.roles?.length),
      };
      return merged;
    },
    []
  );

  const run = useCallback(
    async (jobId?: number, options?: FlowOptions) => {
      if (!userId || !jobId) return;
      if (runningRef.current) return;
      runningRef.current = true;
      setState({ base: "running", skills: "idle", experience: "idle" });
      try {
        // 1) Base resume
        const base = await generateResume(userId, jobId, {
          tone: options?.tone,
          focus: options?.focus,
        });
        setState((s) => ({ ...s, base: "success" }));

        // 2) Parallelize optional segments
        const wantSkills = Boolean(options?.includeSkills);
        const wantExp = Boolean(options?.includeExperience);

        if (!wantSkills && !wantExp) {
          const mergedOnly = merge(base.content);
          setResult({
            content: mergedOnly,
            base,
            skills: null,
            experience: null,
          });
          // Broadcast fresh content for consumers
          try {
            window.dispatchEvent(
              new CustomEvent("sgt:resumeGenerated", {
                detail: { content: mergedOnly, jobId, ts: Date.now() },
              })
            );
          } catch (err) {
            console.warn("resumeGenerated event dispatch failed", err);
          }
        } else {
          const promises: Array<Promise<unknown>> = [];
          let skillsContent: SkillsOptimizationContent | null = null;
          let expContent: UnifiedResult["experience"] | null = null;

          if (wantSkills) {
            setState((s) => ({ ...s, skills: "running" }));
            promises.push(
              generateSkillsOptimization(userId, jobId)
                .then((r) => {
                  skillsContent = r.content ?? null;
                  setState((s) => ({ ...s, skills: "success" }));
                })
                .catch((e) => {
                  handleError?.(e);
                  setState((s) => ({ ...s, skills: "error" }));
                })
            );
          }

          if (wantExp) {
            setState((s) => ({ ...s, experience: "running" }));
            promises.push(
              generateExperienceTailoring(userId, jobId)
                .then((r) => {
                  expContent = r.content ?? null;
                  setState((s) => ({ ...s, experience: "success" }));
                })
                .catch((e) => {
                  handleError?.(e);
                  setState((s) => ({ ...s, experience: "error" }));
                })
            );
          }

          await Promise.all(promises);
          const merged = merge(base.content, skillsContent, expContent);
          setResult({
            content: merged,
            base,
            skills: skillsContent,
            experience: expContent,
          });
          // Broadcast fresh content for consumers
          try {
            window.dispatchEvent(
              new CustomEvent("sgt:resumeGenerated", {
                detail: { content: merged, jobId, ts: Date.now() },
              })
            );
          } catch (err) {
            console.warn("resumeGenerated event dispatch failed", err);
          }
        }

        showSuccess("Generation complete");
      } catch (e) {
        handleError?.(e);
        setState((s) => ({ ...s, base: "error" }));
      } finally {
        runningRef.current = false;
      }
    },
    [userId, handleError, merge, showSuccess]
  );

  return useMemo(
    () => ({ state, result, run, reset }),
    [state, result, run, reset]
  );
}
