/**
 * Resume V2 Components - Barrel Export
 *
 * PURPOSE: Centralized exports for Resume Editor V2 components
 *
 * ORGANIZATION:
 * - Main 3-Panel Editor Workflow (6 components)
 * - Version Management (3 components)
 * - Feedback & Collaboration (3 components)
 * - Template Browser (1 component)
 *
 * USAGE:
 * ```typescript
 * import {
 *   ResumeStarter,
 *   GenerationPanel,
 *   AIResultsPanel,
 *   DraftPreviewPanel
 * } from "@workspaces/ai/components/resume-v2";
 * ```
 */

// ===========================
// MAIN 3-PANEL EDITOR WORKFLOW
// ===========================

// Onboarding: Draft selection and creation
export { default as ResumeStarter } from "./ResumeStarter";

// Left Panel: Job selection + AI generation controls
export { default as GenerationPanel } from "./GenerationPanel";

// Middle Panel: AI results review with apply actions
export { default as AIResultsPanel } from "./AIResultsPanel";

// Right Panel: Live draft preview with inline editing
export { default as DraftPreviewPanel } from "./DraftPreviewPanel";

// Template Selection: Visual template picker with AI behavior explanation
export { TemplateSelector } from "./TemplateSelector";

// Product Tour: Interactive walkthrough for first-time users
export { default as ProductTour } from "./ProductTour";

// ===========================
// VERSION MANAGEMENT
// ===========================

// Version Panel: Create, compare, merge, restore versions
export { default as ResumeVersionsPanel } from "./ResumeVersionsPanel";

// Version History: Timeline view of all version changes
export { VersionHistoryPanel } from "./VersionHistoryPanel";

// Version Comparison: Side-by-side diff with restore capability
export { VersionComparisonDialog } from "./VersionComparisonDialog";

// ===========================
// FEEDBACK & COLLABORATION
// ===========================

// Feedback Panel: Comment thread UI for shared resumes
export { default as FeedbackPanel } from "./FeedbackPanel";

// Feedback Dialog: Manage shares and feedback for a draft
export { default as FeedbackDialog } from "./FeedbackDialog";

// Share Dialog: Create shareable links with permissions
export { default as ShareDialog } from "./ShareDialog";

// ===========================
// TEMPLATE BROWSER
// ===========================

// Template Showcase: Full-screen template gallery with live preview
export { default as TemplateShowcaseDialog } from "./TemplateShowcaseDialog";
