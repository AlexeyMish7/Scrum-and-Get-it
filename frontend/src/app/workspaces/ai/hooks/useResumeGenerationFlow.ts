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

export type SegmentStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "skipped";

export interface FlowOptions {
  tone?: string;
  focus?: string;
  includeSkills?: boolean;
  includeExperience?: boolean;
  model?: string;
  prompt?: string;
  /** Optional preview rendering hint (no behavior change yet) */
  previewMode?: "live" | "final";
  /** Optional per-section visibility toggles (UI only) */
  sectionToggles?: {
    summary?: boolean;
    skills?: boolean;
    experience?: boolean;
    education?: boolean;
    projects?: boolean;
  };
  /** Optional output formatting hint for later export paths */
  outputFormatIntent?: "screen" | "pdf" | "docx";
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

  const emit = useCallback((event: string, detail: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    } catch (err) {
      console.warn(`${event} dispatch failed`, err);
    }
  }, []);

  const reset = useCallback(() => {
    setState({ base: "idle", skills: "idle", experience: "idle" });
    setResult({ content: null });
    emit("sgt:resumeGeneration:reset", { ts: Date.now() });
  }, [emit]);

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
      const wantSkills = Boolean(options?.includeSkills);
      const wantExp = Boolean(options?.includeExperience);
      emit("sgt:resumeGeneration:start", {
        jobId,
        options,
        ts: Date.now(),
      });
      // Pre-mark optional segments as skipped so UI reflects toggles disabled.
      setState({
        base: "running",
        skills: wantSkills ? "idle" : "skipped",
        experience: wantExp ? "idle" : "skipped",
      });
      let skillsStatus: SegmentStatus = wantSkills ? "idle" : "skipped";
      let experienceStatus: SegmentStatus = wantExp ? "idle" : "skipped";
      try {
        // 1) Base resume
        const base = await generateResume(userId, jobId, {
          tone: options?.tone,
          focus: options?.focus,
          model: options?.model,
          prompt: options?.prompt,
        });
        setState((s) => ({ ...s, base: "success" }));
        emit("sgt:resumeGeneration:segment", {
          jobId,
          segment: "base",
          status: "success",
          ts: Date.now(),
        });

        // 2) Parallelize optional segments
        if (!wantSkills && !wantExp) {
          const mergedOnly = merge(base.content);
          setResult({
            content: mergedOnly,
            base,
            skills: null,
            experience: null,
          });
          // Broadcast fresh content for consumers
          emit("sgt:resumeGenerated", {
            content: mergedOnly,
            jobId,
            ts: Date.now(),
          });
          emit("sgt:resumeGeneration:complete", {
            jobId,
            state: {
              base: "success",
              skills: "skipped",
              experience: "skipped",
            },
            ts: Date.now(),
          });
          showSuccess("Generation complete");
          return;
        } else {
          const promises: Array<Promise<unknown>> = [];
          let skillsContent: SkillsOptimizationContent | null = null;
          let expContent: UnifiedResult["experience"] | null = null;

          if (wantSkills) {
            setState((s) => ({ ...s, skills: "running" }));
            skillsStatus = "running";
            promises.push(
              generateSkillsOptimization(userId, jobId)
                .then((r) => {
                  skillsContent = r.content ?? null;
                  setState((s) => ({ ...s, skills: "success" }));
                  skillsStatus = "success";
                  emit("sgt:resumeGeneration:segment", {
                    jobId,
                    segment: "skills",
                    status: "success",
                    ts: Date.now(),
                  });
                })
                .catch((e) => {
                  handleError?.(e);
                  setState((s) => ({ ...s, skills: "error" }));
                  skillsStatus = "error";
                  emit("sgt:resumeGeneration:segment", {
                    jobId,
                    segment: "skills",
                    status: "error",
                    ts: Date.now(),
                  });
                })
            );
          }

          if (wantExp) {
            setState((s) => ({ ...s, experience: "running" }));
            experienceStatus = "running";
            promises.push(
              generateExperienceTailoring(userId, jobId)
                .then((r) => {
                  expContent = r.content ?? null;
                  setState((s) => ({ ...s, experience: "success" }));
                  experienceStatus = "success";
                  emit("sgt:resumeGeneration:segment", {
                    jobId,
                    segment: "experience",
                    status: "success",
                    ts: Date.now(),
                  });
                })
                .catch((e) => {
                  handleError?.(e);
                  setState((s) => ({ ...s, experience: "error" }));
                  experienceStatus = "error";
                  emit("sgt:resumeGeneration:segment", {
                    jobId,
                    segment: "experience",
                    status: "error",
                    ts: Date.now(),
                  });
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
          emit("sgt:resumeGenerated", {
            content: merged,
            jobId,
            ts: Date.now(),
          });
          emit("sgt:resumeGeneration:complete", {
            jobId,
            state: {
              base: "success",
              skills: wantSkills ? skillsStatus : "skipped",
              experience: wantExp ? experienceStatus : "skipped",
            },
            ts: Date.now(),
          });
          showSuccess("Generation complete");
          return;
        }
      } catch (e) {
        handleError?.(e);
        setState((s) => ({ ...s, base: "error" }));
        emit("sgt:resumeGeneration:complete", {
          jobId,
          state: {
            base: "error",
            skills: wantSkills ? skillsStatus : "skipped",
            experience: wantExp ? experienceStatus : "skipped",
          },
          ts: Date.now(),
          error: e instanceof Error ? e.message : "unknown",
        });
      } finally {
        runningRef.current = false;
      }
    },
    [userId, handleError, merge, showSuccess, emit]
  );

  return useMemo(
    () => ({ state, result, run, reset }),
    [state, result, run, reset]
  );
}
