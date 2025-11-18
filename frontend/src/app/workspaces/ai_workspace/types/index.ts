/**
 * AI Workspace Types
 *
 * Central export for all AI workspace type definitions.
 */

// Generation types
export type {
  GenerationDocumentType,
  GenerationTone,
  GenerationLength,
  GenerationRequest,
  GenerationOptions,
  SectionConfiguration,
  GenerationResult,
  GenerationMetadata,
  GenerationIssue,
  GenerationPreview,
  GenerationProgress,
  GenerationStep,
  RegenerationRequest,
} from "./generation.types";

// Template & theme types
export type {
  TemplateCategory,
  TemplateSubtype,
  PageSize,
  ColumnLayout,
  Template,
  TemplateLayout,
  SectionConfig,
  SectionType,
  TemplateSchema,
  TemplateFeatures,
  TemplateMetadata,
  ThemeCategory,
  Theme,
  ThemeTypography,
  FontConfig,
  ThemeColors,
  ThemeSpacing,
  ThemeElements,
  ThemeMetadata,
  DocumentConfig,
  TemplateThemePreview,
} from "./template.types";

// Version control types
export type {
  ChangeType,
  VersionStatus,
  DocumentVersion,
  VersionMetadata,
  VersionChanges,
  VersionDiff,
  VersionLineage,
  VersionStats,
  VersionBranch,
  VersionComparison,
  ComparisonDiff,
  LineDiff,
  ComparisonSummary,
  VersionHistoryFilter,
  VersionRestoreOptions,
  VersionMergeRequest,
  VersionExportOptions,
} from "./version.types";

// Document types
export type {
  DocumentType,
  DocumentStatus,
  Document,
  DocumentConfiguration,
  DocumentContext,
  DocumentMetadata,
  DocumentStats,
  ResumeContent,
  ResumeHeader,
  ResumeSummary,
  ResumeExperience,
  ResumeEducation,
  ResumeSkills,
  ResumeProjects,
  ResumeCertifications,
  ResumePublications,
  ResumeAwards,
  ResumeLanguages,
  ResumeCustomSection,
  CoverLetterContent,
  CoverLetterHeader,
  CoverLetterRecipient,
  CoverLetterBody,
  CoverLetterSignature,
  CoverLetterInsights,
  DocumentFilter,
  DocumentSort,
} from "./document.types";

// Navigation types
export type {
  AIWorkspaceTab,
  NavigationTab,
  BreadcrumbItem,
  NavigationState,
  QuickAction,
  RecentDocument,
} from "./navigation.types";

export { AI_ROUTES } from "./navigation.types";
