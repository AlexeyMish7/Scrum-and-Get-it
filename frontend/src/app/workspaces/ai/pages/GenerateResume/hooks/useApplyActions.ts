/**
 * useApplyActions
 *
 * Custom hook that manages "Apply to Draft" actions for resume generation.
 *
 * WHAT: Provides handlers for applying AI-generated content (skills, summary, experience)
 *       to the active resume draft, with change detection and success notifications.
 *
 * WHY: Centralizes apply logic, reduces GenerateResume component complexity, enables
 *      reusability and isolated testing of apply operations.
 *
 * INPUT:
 *  - active: Current resume draft (ResumeVariation | null)
 *  - lastContent: Most recent AI-generated content (ResumeArtifactContent | null)
 *  - lastJobId: Job ID for the current generation (number | null)
 *  - showSuccess: Success notification function
 *  - setLastContent: State setter to update preview content after apply
 *  - setCurrentStep: Navigate to preview step after apply
 *  - setLastAppliedJob: Record which job was last applied
 *  - setMergeOpen: Control merge dialog visibility
 *  - applyOrderedSkills: Zustand action to update draft skills
 *  - applySummary: Zustand action to update draft summary
 *  - appendExperienceFromAI: Zustand action to merge experience entries
 *
 * OUTPUT:
 *  - applySkills: Apply AI skill ordering to draft
 *  - applySummaryToDraft: Replace draft summary with AI version
 *  - mergeExperience: Open dialog to select/merge experience bullets
 *  - buildContentFromDraft: Create snapshot of current draft state
 *  - emitApplyEvent: Emit window event for analytics/tracking
 */

import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import type {
  ResumeDraftRecord,
  ResumeDraftContentExperienceItem,
} from "@workspaces/ai/hooks/useResumeDrafts";

interface UseApplyActionsProps {
  active: ResumeDraftRecord | null;
  lastContent: ResumeArtifactContent | null;
  lastJobId: number | null;
  showSuccess: (message: string) => void;
  setLastContent: (content: ResumeArtifactContent | null) => void;
  setCurrentStep: (step: number | ((prev: number) => number)) => void;
  setLastAppliedJob: (jobId: number | null) => void;
  setMergeOpen: (open: boolean) => void;
  applyOrderedSkills: (skills: string[]) => void;
  applySummary: (summary: string) => void;
}

interface ApplyEventPayload {
  action:
    | "apply-skills"
    | "apply-summary"
    | "open-experience-merge"
    | "merge-experience"
    | "copy-keywords";
  jobId?: number;
  changed?: boolean;
  entries?: number;
  applied?: number;
  ordered?: number;
}

export function useApplyActions({
  active,
  lastContent,
  lastJobId,
  showSuccess,
  setLastContent,
  setCurrentStep,
  setLastAppliedJob,
  setMergeOpen,
  applyOrderedSkills,
  applySummary,
}: UseApplyActionsProps) {
  /**
   * buildContentFromDraft
   * WHAT: Create a ResumeArtifactContent snapshot from current active draft.
   * WHY: Update preview model to reflect draft modifications after apply actions.
   * INPUT: Uses `active` from props (current resume draft)
   * OUTPUT: ResumeArtifactContent snapshot or null if no active draft
   */
  function buildContentFromDraft(): ResumeArtifactContent | null {
    if (!active) return null;
    return {
      summary: active.content.summary,
      ordered_skills: active.content.skills,
      sections: {
        experience: (active.content.experience || []).map(
          (e: ResumeDraftContentExperienceItem) => ({
            role: e.role,
            company: e.company,
            dates: e.dates,
            bullets: e.bullets.slice(),
          })
        ),
      },
      meta: {
        fromDraft: true,
        draftId: active.id,
        lastAppliedJobId: active.lastAppliedJobId,
      },
    };
  }

  /**
   * emitApplyEvent
   * WHAT: Dispatch custom window event for analytics/tracking.
   * WHY: Allow external listeners (analytics, logging) to track apply actions.
   * INPUT: ApplyEventPayload with action type and metadata
   * OUTPUT: Dispatches window event "resume:apply"
   */
  function emitApplyEvent(payload: ApplyEventPayload) {
    window.dispatchEvent(new CustomEvent("resume:apply", { detail: payload }));
  }

  /**
   * applySkills
   * WHAT: Apply AI-ordered skill list to active draft.
   * WHY: Update draft with AI skill optimization while preserving existing skills.
   * FLOW:
   *  1. Merge AI skills with existing skills (case-insensitive dedup)
   *  2. Apply ordered list to draft via Zustand action
   *  3. Update preview content snapshot
   *  4. Navigate to Preview step
   *  5. Emit analytics event
   * INPUT: Uses lastContent.ordered_skills
   * OUTPUT: Updates draft skills, shows success message, navigates to preview
   */
  function applySkills() {
    if (!active || !lastContent?.ordered_skills?.length) return;

    const existing = active.content.skills || [];
    const lowerExisting = new Map(
      existing.map((s: string) => [s.toLowerCase(), s])
    );
    const prospective: string[] = [];

    // Merge AI skills with existing (preserve casing from existing when possible)
    for (const s of lastContent.ordered_skills) {
      const match = lowerExisting.get(s.toLowerCase()) || s;
      if (!prospective.includes(match)) prospective.push(match);
    }

    // Append any existing skills not in AI list
    for (const s of existing) {
      if (!prospective.includes(s)) prospective.push(s);
    }

    const isSame =
      prospective.length === existing.length &&
      prospective.every((v, i) => v === existing[i]);

    applyOrderedSkills(lastContent.ordered_skills);
    showSuccess(
      isSame ? "No changes to apply" : "Applied ordered skills to draft"
    );

    // Refresh preview model to reflect draft modifications
    const updated = buildContentFromDraft();
    if (updated) setLastContent(updated);

    // Move to Preview after applying changes
    setCurrentStep(3);
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);

    emitApplyEvent({
      action: "apply-skills",
      jobId: lastJobId ?? undefined,
      changed: !isSame,
    });
  }

  /**
   * applySummaryToDraft
   * WHAT: Replace draft summary with AI-generated version.
   * WHY: Update resume summary with tailored content.
   * FLOW:
   *  1. Check for valid AI summary content
   *  2. Apply via Zustand action
   *  3. Update preview snapshot
   *  4. Navigate to Preview step
   *  5. Emit analytics event
   * INPUT: Uses lastContent.summary
   * OUTPUT: Updates draft summary, shows success message, navigates to preview
   */
  function applySummaryToDraft() {
    if (!active || !lastContent?.summary) return;

    const isSame = (active.content.summary || "") === lastContent.summary;

    applySummary(lastContent.summary);
    showSuccess(isSame ? "No changes to apply" : "Applied summary to draft");

    const updated = buildContentFromDraft();
    if (updated) setLastContent(updated);

    setCurrentStep(3);
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);

    emitApplyEvent({
      action: "apply-summary",
      jobId: lastJobId ?? undefined,
      changed: !isSame,
    });
  }

  /**
   * mergeExperience
   * WHAT: Open dialog to select and merge AI experience bullets into draft.
   * WHY: Allow user to choose which tailored experience entries to add.
   * FLOW:
   *  1. Validate AI experience content exists
   *  2. Open BulletMergeDialog
   *  3. Emit analytics event with entry count
   * INPUT: Uses lastContent.sections.experience
   * OUTPUT: Opens merge dialog, emits event
   */
  function mergeExperience() {
    if (!active) return;
    const exp = lastContent?.sections?.experience;
    if (!exp?.length) return;

    setMergeOpen(true);
    emitApplyEvent({
      action: "open-experience-merge",
      jobId: lastJobId ?? undefined,
      entries: exp.length,
    });
  }

  return {
    applySkills,
    applySummaryToDraft,
    mergeExperience,
    buildContentFromDraft,
    emitApplyEvent,
  };
}
