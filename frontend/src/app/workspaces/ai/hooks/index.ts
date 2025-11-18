/**
 * AI Workspace Hooks
 * Barrel export for simplified imports
 *
 * Usage:
 * ```ts
 * import {
 *   useResumeDraftsV2,
 *   useCoverLetterDrafts,
 *   useJobMatching
 * } from "@workspaces/ai/hooks";
 * ```
 */

// ========== DASHBOARD & ANALYTICS ==========
export { default as useAIDashboardData } from "./useAIDashboardData";
export { default as useCoverLetterAnalytics } from "./useCoverLetterAnalytics";

// ========== DRAFTS MANAGEMENT ==========
export { useResumeDraftsV2 } from "./useResumeDraftsV2";
export { default as useCoverLetterDrafts } from "./useCoverLetterDrafts";

// ========== RESUME FEATURES ==========
export { default as useResumeFeedback } from "./useResumeFeedback";
export { default as useResumeVersions } from "./useResumeVersions";
export { default as useShouldShowTour } from "./useShouldShowTour";

// ========== AI FEATURES ==========
export { default as useJobMatching } from "./useJobMatching";
export { default as useCompanyResearch } from "./useCompanyResearch";

// ========== TYPE EXPORTS ==========

// useResumeDraftsV2 types
export type {
  ResumeDraft,
  ResumeDraftsStore,
  ResumeContent,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SectionKey,
} from "./useResumeDraftsV2";

// useResumeFeedback types
export type { FeedbackComment, ResumeShare } from "./useResumeFeedback";

// useResumeVersions types
export type { ResumeVersion } from "./useResumeVersions";
