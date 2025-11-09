/**
 * useGenerationEvents Hook
 *
 * Manages window event listeners for resume generation lifecycle events.
 * Listens for events dispatched by ResumeGenerationPanel and updates state accordingly.
 *
 * Events handled:
 * - sgt:resumeGeneration:start - Generation started
 * - sgt:resumeGenerated - Content generated
 * - sgt:resumeGeneration:complete - Generation completed with all segments
 * - sgt:resumeGeneration:segment - Individual segment completed
 * - sgt:resumeGeneration:reset - Reset generation state
 *
 * @param {Object} params - Hook parameters
 * @param {Function} params.setLastContent - Setter for last generated content
 * @param {Function} params.setLastSegments - Setter for segment state
 * @param {Function} params.setLastJobId - Setter for job ID
 * @param {React.MutableRefObject<number>} params.generationRunTokenRef - Ref to current generation run token
 * @param {React.MutableRefObject<number>} params.lastGenTsRef - Ref to last generation timestamp
 */

import { useEffect } from "react";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import type { FlowState } from "@workspaces/ai/hooks/useResumeGenerationFlow";

interface GenerationEventParams {
  setLastContent: (content: ResumeArtifactContent | null) => void;
  setLastSegments: (segments: FlowState | null) => void;
  setLastJobId: (jobId: number | null) => void;
  generationRunTokenRef: React.MutableRefObject<number>;
  lastGenTsRef: React.MutableRefObject<number>;
}

export default function useGenerationEvents({
  setLastContent,
  setLastSegments,
  setLastJobId,
  generationRunTokenRef,
  lastGenTsRef,
}: GenerationEventParams) {
  useEffect(() => {
    function onStart(e: Event) {
      const detail = (e as CustomEvent).detail as {
        jobId?: number;
        options?: Record<string, unknown>;
        ts?: number;
      };
      const ts = typeof detail?.ts === "number" ? detail.ts : Date.now();
      generationRunTokenRef.current = ts; // tag current run
      lastGenTsRef.current = ts; // track as latest event baseline
      // Clear any previous content to avoid unintended auto-advance from stale data
      setLastContent(null);
      setLastSegments(null);
      if (typeof detail?.jobId === "number") setLastJobId(detail.jobId);
    }

    function onGenerated(e: Event) {
      const detail = (e as CustomEvent).detail as {
        content?: ResumeArtifactContent;
        jobId?: number;
        ts?: number;
      };
      const ts = typeof detail?.ts === "number" ? detail.ts : Date.now();
      if (ts < lastGenTsRef.current) return; // ignore stale
      lastGenTsRef.current = ts;
      if (detail?.content) setLastContent(detail.content);
      if (typeof detail?.jobId === "number") setLastJobId(detail.jobId);
    }

    function onComplete(e: Event) {
      const detail = (e as CustomEvent).detail as {
        state?: FlowState;
        jobId?: number;
        ts?: number;
      };
      const ts = typeof detail?.ts === "number" ? detail.ts : Date.now();
      if (ts < lastGenTsRef.current) return;
      lastGenTsRef.current = ts;
      if (detail?.state) setLastSegments(detail.state);
      if (typeof detail?.jobId === "number") setLastJobId(detail.jobId);
    }

    // Early segment success (base) -> show partial preview immediately.
    function onSegment(e: Event) {
      const detail = (e as CustomEvent).detail as {
        segment?: string;
        status?: string;
        content?: ResumeArtifactContent;
        jobId?: number;
        ts?: number;
      };
      if (
        detail.segment === "base" &&
        detail.status === "success" &&
        detail.content
      ) {
        const ts = typeof detail?.ts === "number" ? detail.ts : Date.now();
        if (ts < lastGenTsRef.current) return;
        lastGenTsRef.current = ts;
        setLastContent(detail.content);
        if (typeof detail?.jobId === "number") setLastJobId(detail.jobId);
      }
    }

    function onReset() {
      setLastContent(null);
      setLastSegments(null);
      setLastJobId(null);
      lastGenTsRef.current = 0;
    }

    window.addEventListener(
      "sgt:resumeGeneration:start",
      onStart as EventListener
    );
    window.addEventListener(
      "sgt:resumeGenerated",
      onGenerated as EventListener
    );
    window.addEventListener(
      "sgt:resumeGeneration:complete",
      onComplete as EventListener
    );
    window.addEventListener(
      "sgt:resumeGeneration:segment",
      onSegment as EventListener
    );
    window.addEventListener(
      "sgt:resumeGeneration:reset",
      onReset as EventListener
    );

    return () => {
      window.removeEventListener(
        "sgt:resumeGeneration:start",
        onStart as EventListener
      );
      window.removeEventListener(
        "sgt:resumeGenerated",
        onGenerated as EventListener
      );
      window.removeEventListener(
        "sgt:resumeGeneration:complete",
        onComplete as EventListener
      );
      window.removeEventListener(
        "sgt:resumeGeneration:segment",
        onSegment as EventListener
      );
      window.removeEventListener(
        "sgt:resumeGeneration:reset",
        onReset as EventListener
      );
    };
  }, [
    setLastContent,
    setLastSegments,
    setLastJobId,
    generationRunTokenRef,
    lastGenTsRef,
  ]);
}
