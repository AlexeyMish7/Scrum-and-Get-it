/**
 * AI Workspace Hooks
 * Barrel export for simplified imports
 */

export { default as useResumeDrafts } from './useResumeDrafts';
export { default as useResumeGenerationFlowV2 } from './useResumeGenerationFlowV2';

// Re-export types from useResumeDrafts
export type {
  ResumeDraftRecord,
  ResumeDraftContentExperienceItem,
  UseResumeDraftsApi,
  ResumeDraftDiff,
  MergeOptions,
  DraftStats,
} from './useResumeDrafts';

// Re-export types from useResumeGenerationFlowV2
export type {
  SegmentKey,
  SegmentStatus,
  FlowOptionsV2,
  FlowStateMap,
  UnifiedResultV2,
} from './useResumeGenerationFlowV2';
