import { useCallback, useMemo, useRef, useState } from "react";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import {
  generateResume,
  generateSkillsOptimization,
  generateExperienceTailoring,
} from "@workspaces/ai/services/aiGeneration";
import type {
  ResumeArtifactContent,
  SkillsOptimizationContent,
  ExperienceTailoringResult,
  GenerateResumeResult,
  ResumePreviewModel,
} from "@workspaces/ai/types/ai";
import { toPreviewModel } from "@workspaces/ai/utils/previewModel";

/**
 * useResumeGenerationFlowV2
 * Enhanced generation orchestrator with granular retry & abort semantics.
 * WHAT: Coordinates base resume, skills optimization, and experience tailoring.
 * WHY: Provide finer UI control (retry failed segment only, live preview, abort).
 * INPUTS: userId (auth required), options passed per run.
 * OUTPUT: state map, merged artifact content, preview model, helpers.
 * ERROR MODES: Errors captured per segment; lastError tracks most recent failure.
 */

export type SegmentKey = "base" | "skills" | "experience";
export type SegmentStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "skipped";

export interface FlowOptionsV2 {
  tone?: string;
  focus?: string;
  includeSkills?: boolean;
  includeExperience?: boolean;
  model?: string;
  prompt?: string;
  previewMode?: "live" | "final";
  sectionToggles?: {
    summary?: boolean;
    skills?: boolean;
    experience?: boolean;
    education?: boolean;
    projects?: boolean;
  };
  outputFormatIntent?: "screen" | "pdf" | "docx";
}

export interface FlowStateMap {
  base: SegmentStatus;
  skills: SegmentStatus;
  experience: SegmentStatus;
}

export interface UnifiedResultV2 {
  content: ResumeArtifactContent | null;
  base?: GenerateResumeResult | null;
  skills?: SkillsOptimizationContent | null;
  experience?: ExperienceTailoringResult["content"] | null;
}

interface GenerationControllers {
  cancelled: boolean; // soft abort flag (no network cancellation yet)
}

export default function useResumeGenerationFlowV2(userId?: string) {
  const { handleError, showSuccess } = useErrorHandler();
  const [state, setState] = useState<FlowStateMap>({
    base: "idle",
    skills: "idle",
    experience: "idle",
  });
  const [result, setResult] = useState<UnifiedResultV2>({ content: null });
  const [lastError, setLastError] = useState<string | null>(null);
  const ctrlRef = useRef<GenerationControllers>({ cancelled: false });
  const runningRef = useRef(false);
  const lastJobRef = useRef<number | null>(null);
  const lastOptionsRef = useRef<FlowOptionsV2 | undefined>(undefined);

  // EVENT EMITTER ------------------------------------------------------------
  const emit = useCallback((event: string, detail: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    } catch {
      // noop: best-effort custom event dispatch
      // (errors here are non-fatal and usually environment-specific)
    }
  }, []);

  // RESET -------------------------------------------------------------------
  const reset = useCallback(() => {
    ctrlRef.current.cancelled = false;
    runningRef.current = false;
    setState({ base: "idle", skills: "idle", experience: "idle" });
    setResult({ content: null });
    setLastError(null);
    emit("sgt:resumeGeneration:reset", { ts: Date.now() });
  }, [emit]);

  // MERGE -------------------------------------------------------------------
  const mergeContent = useCallback(
    (
      baseContent: ResumeArtifactContent | undefined,
      skills?: SkillsOptimizationContent | null,
      tailored?: ExperienceTailoringResult["content"] | null
    ): ResumeArtifactContent => {
      const merged: ResumeArtifactContent = { ...(baseContent ?? {}) };
      if (skills?.order?.length) {
        merged.ordered_skills = skills.order.slice();
        merged.emphasize_skills = skills.emphasize?.slice();
        merged.add_skills = skills.add?.slice();
      }
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

  // PREVIEW MODEL -----------------------------------------------------------
  const preview: ResumePreviewModel = useMemo(
    () => toPreviewModel(result.content),
    [result.content]
  );

  // RUN FULL FLOW -----------------------------------------------------------
  const run = useCallback(
    async (jobId?: number, options?: FlowOptionsV2) => {
      if (!userId || !jobId) return;
      if (runningRef.current) return; // ignore concurrent runs
      ctrlRef.current.cancelled = false;
      runningRef.current = true;
      lastJobRef.current = jobId;
      lastOptionsRef.current = options;
      setLastError(null);
      const wantSkills = Boolean(options?.includeSkills);
      const wantExp = Boolean(options?.includeExperience);
      setState({
        base: "running",
        skills: wantSkills ? "idle" : "skipped",
        experience: wantExp ? "idle" : "skipped",
      });
      emit("sgt:resumeGeneration:start", { jobId, options, ts: Date.now() });
      try {
        // Base resume
        const base = await generateResume(userId, jobId, {
          tone: options?.tone,
          focus: options?.focus,
          model: options?.model,
          prompt: options?.prompt,
        });
        if (ctrlRef.current.cancelled) return; // aborted mid-flight
        setState((s) => ({ ...s, base: "success" }));
        emit("sgt:resumeGeneration:segment", {
          jobId,
          segment: "base",
          status: "success",
          ts: Date.now(),
          content: base.content,
        });

        // If no optional segments needed.
        if (!wantSkills && !wantExp) {
          const mergedOnly = mergeContent(base.content);
          setResult({
            content: mergedOnly,
            base,
            skills: null,
            experience: null,
          });
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
        }

        // Optional segments in parallel
        const promises: Array<Promise<void>> = [];
        let skillsContent: SkillsOptimizationContent | null = null;
        let expContent: ExperienceTailoringResult["content"] | null = null;
        // Track local statuses to avoid stale React state in final emit
        let skillsStatus: SegmentStatus = wantSkills ? "idle" : "skipped";
        let experienceStatus: SegmentStatus = wantExp ? "idle" : "skipped";

        if (wantSkills) {
          setState((s) => ({ ...s, skills: "running" }));
          skillsStatus = "running";
          promises.push(
            generateSkillsOptimization(userId, jobId)
              .then((r) => {
                if (ctrlRef.current.cancelled) return;
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
                setLastError(e instanceof Error ? e.message : String(e));
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
                if (ctrlRef.current.cancelled) return;
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
                setLastError(e instanceof Error ? e.message : String(e));
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
        if (ctrlRef.current.cancelled) return;
        const merged = mergeContent(base.content, skillsContent, expContent);
        setResult({
          content: merged,
          base,
          skills: skillsContent,
          experience: expContent,
        });
        emit("sgt:resumeGenerated", { content: merged, jobId, ts: Date.now() });
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
      } catch (e) {
        handleError?.(e);
        setLastError(e instanceof Error ? e.message : String(e));
        setState((s) => ({ ...s, base: "error" }));
        emit("sgt:resumeGeneration:complete", {
          jobId,
          state: {
            base: "error",
            skills: state.skills,
            experience: state.experience,
          },
          ts: Date.now(),
          error: e instanceof Error ? e.message : "unknown",
        });
      } finally {
        runningRef.current = false;
      }
    },
    [
      userId,
      handleError,
      mergeContent,
      showSuccess,
      emit,
      state.skills,
      state.experience,
    ]
  );

  // ABORT -------------------------------------------------------------------
  const abort = useCallback(() => {
    if (!runningRef.current) return;
    ctrlRef.current.cancelled = true;
    runningRef.current = false;
    setState((s) => ({
      base: s.base === "running" ? "error" : s.base,
      skills: s.skills === "running" ? "error" : s.skills,
      experience: s.experience === "running" ? "error" : s.experience,
    }));
    setLastError("aborted");
    emit("sgt:resumeGeneration:aborted", {
      ts: Date.now(),
      jobId: lastJobRef.current,
    });
  }, [emit]);

  // RETRY SINGLE SEGMENT (only meaningful after base success) ---------------
  const retrySegment = useCallback(
    async (segment: SegmentKey) => {
      const jobId = lastJobRef.current;
      const options = lastOptionsRef.current;
      if (!userId || !jobId || !options) return;
      if (segment === "base") {
        // full rerun for base (others depend on base content)
        return run(jobId, options);
      }
      if (state.base !== "success") return; // can't retry optional without base success
      if (segment === "skills" && options.includeSkills) {
        setState((s) => ({ ...s, skills: "running" }));
        try {
          const skillsRes = await generateSkillsOptimization(userId, jobId);
          const skillsContent = skillsRes.content ?? null;
          setState((s) => ({ ...s, skills: "success" }));
          setResult((prev) => {
            const merged = mergeContent(
              prev.base?.content,
              skillsContent,
              prev.experience
            );
            return { ...prev, content: merged, skills: skillsContent };
          });
        } catch (e) {
          handleError?.(e);
          setLastError(e instanceof Error ? e.message : String(e));
          setState((s) => ({ ...s, skills: "error" }));
        }
      } else if (segment === "experience" && options.includeExperience) {
        setState((s) => ({ ...s, experience: "running" }));
        try {
          const expRes = await generateExperienceTailoring(userId, jobId);
          const expContent = expRes.content ?? null;
          setState((s) => ({ ...s, experience: "success" }));
          setResult((prev) => {
            const merged = mergeContent(
              prev.base?.content,
              prev.skills,
              expContent
            );
            return { ...prev, content: merged, experience: expContent };
          });
        } catch (e) {
          handleError?.(e);
          setLastError(e instanceof Error ? e.message : String(e));
          setState((s) => ({ ...s, experience: "error" }));
        }
      }
    },
    [userId, run, mergeContent, state.base, handleError]
  );

  // RETRY ALL FAILED OPTIONAL SEGMENTS --------------------------------------
  const retryFailedOptional = useCallback(async () => {
    if (state.base !== "success") return; // base must be successful first
    if (state.skills !== "error" && state.experience !== "error") return; // nothing to retry
    await (state.skills === "error"
      ? retrySegment("skills")
      : Promise.resolve());
    await (state.experience === "error"
      ? retrySegment("experience")
      : Promise.resolve());
  }, [state.base, state.skills, state.experience, retrySegment]);

  // Derived convenience booleans -------------------------------------------
  const generating =
    state.base === "running" ||
    state.skills === "running" ||
    state.experience === "running";

  // Expose API --------------------------------------------------------------
  return useMemo(
    () => ({
      state,
      result,
      preview,
      lastError,
      generating,
      run,
      reset,
      abort,
      retrySegment,
      retryFailedOptional,
    }),
    [
      state,
      result,
      preview,
      lastError,
      generating,
      run,
      reset,
      abort,
      retrySegment,
      retryFailedOptional,
    ]
  );
}
