/**
 * COVER LETTER COMPONENTS
 *
 * Barrel export for cover letter editor workflow components.
 *
 * Main Editor Workflow (3-panel layout):
 * - CoverLetterStarter: Draft selection and template picker onboarding
 * - CoverLetterGenerationPanel: Left panel (job selection + AI options)
 * - CoverLetterAIResultsPanel: Middle panel (AI output review/apply)
 * - CoverLetterPreviewPanel: Right panel (live preview + inline editing)
 *
 * Template Management (TemplatesHub page):
 * - CoverLetterTemplateManager: Template library admin interface
 * - CoverLetterTemplateCreator: Custom template builder form
 * - CoverLetterTemplateShowcase: Template browser dialog with preview
 *
 * Analytics:
 * - CoverLetterAnalyticsDialog: Performance tracking and A/B testing
 *
 * Usage:
 * ```ts
 * import {
 *   CoverLetterStarter,
 *   CoverLetterGenerationPanel,
 *   CoverLetterPreviewPanel
 * } from "@workspaces/ai/components/cover-letter";
 * ```
 */

// Main editor workflow components
export { default as CoverLetterStarter } from "./CoverLetterStarter";
export { default as CoverLetterGenerationPanel } from "./CoverLetterGenerationPanel";
export { default as CoverLetterAIResultsPanel } from "./CoverLetterAIResultsPanel";
export { default as CoverLetterPreviewPanel } from "./CoverLetterPreviewPanel";

// Template management
export { default as CoverLetterTemplateManager } from "./CoverLetterTemplateManager";
export { default as CoverLetterTemplateCreator } from "./CoverLetterTemplateCreator";
export { default as CoverLetterTemplateShowcase } from "./CoverLetterTemplateShowcase";

// Analytics
export { default as CoverLetterAnalyticsDialog } from "./CoverLetterAnalyticsDialog";
