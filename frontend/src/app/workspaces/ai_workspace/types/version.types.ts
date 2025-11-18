/**
 * Version Control Types
 *
 * Defines types for document versioning, history tracking, comparison,
 * and branching functionality.
 */

/**
 * Change type that triggered version creation
 */
export type ChangeType =
  | "ai-generated"
  | "manual-edit"
  | "template-change"
  | "theme-change"
  | "merge"
  | "restore"
  | "import";

/**
 * Version status
 */
export type VersionStatus = "active" | "archived" | "deleted";

/**
 * Document version
 */
export interface DocumentVersion {
  /** Unique version identifier */
  id: string;

  /** Parent document ID */
  documentId: string;

  /** Sequential version number */
  versionNumber: number;

  /** Content snapshot */
  content: unknown; // Typed by document.types.ts

  /** Template used */
  templateId: string;

  /** Theme used */
  themeId: string;

  /** Job context (if applicable) */
  jobId?: number;

  /** Generation options (if AI-generated) */
  generationOptions?: unknown; // Typed by generation.types.ts

  /** Version metadata */
  metadata: VersionMetadata;

  /** Change tracking */
  changes: VersionChanges;

  /** Version lineage */
  lineage: VersionLineage;

  /** Statistics */
  stats: VersionStats;

  /** Status */
  status: VersionStatus;

  /** User flags */
  isPinned: boolean;
  isArchived: boolean;
}

/**
 * Version metadata
 */
export interface VersionMetadata {
  /** Version name/title */
  name: string;

  /** Optional description */
  description?: string;

  /** Tags for organization */
  tags: string[];

  /** Color label */
  color?: string;

  /** User notes */
  notes?: string;
}

/**
 * Version change tracking
 */
export interface VersionChanges {
  /** Type of change */
  changeType: ChangeType;

  /** Sections that were modified */
  changedSections: string[];

  /** Summary of changes */
  changesSummary: string;

  /** Detailed diff (if available) */
  diff?: VersionDiff;

  /** Was this an automatic save */
  autoSave: boolean;
}

/**
 * Version diff information
 */
export interface VersionDiff {
  /** Sections added */
  added: string[];

  /** Sections removed */
  removed: string[];

  /** Sections modified */
  modified: Array<{
    section: string;
    changes: number; // Number of changes
  }>;

  /** Character count delta */
  charDelta: number;

  /** Word count delta */
  wordDelta: number;
}

/**
 * Version lineage/ancestry
 */
export interface VersionLineage {
  /** Parent version ID */
  parentVersionId?: string;

  /** Branch name */
  branchName?: string;

  /** Is this the branch head */
  isBranchHead: boolean;

  /** Child version IDs */
  childVersionIds: string[];

  /** Merge source version IDs */
  mergeSourceIds?: string[];
}

/**
 * Version statistics
 */
export interface VersionStats {
  /** When version was created */
  createdAt: string;

  /** Who created (user ID) */
  createdBy: string;

  /** Last accessed timestamp */
  lastAccessedAt?: string;

  /** File size (bytes) */
  fileSize: number;

  /** ATS score (if calculated) */
  atsScore?: number;

  /** Keyword match score */
  keywordMatchScore?: number;

  /** Times exported */
  timesExported: number;

  /** Times used in applications */
  timesUsedInApplications: number;

  /** Application success rate */
  successRate?: number;
}

/**
 * Version branch
 */
export interface VersionBranch {
  /** Branch name */
  name: string;

  /** Branch description */
  description?: string;

  /** Base version ID */
  baseVersionId: string;

  /** Current head version ID */
  headVersionId: string;

  /** All version IDs in branch */
  versionIds: string[];

  /** Branch metadata */
  createdAt: string;
  createdBy: string;

  /** Is this the main/master branch */
  isMain: boolean;

  /** Branch color label */
  color?: string;
}

/**
 * Version comparison
 */
export interface VersionComparison {
  /** Version A (older) */
  versionA: DocumentVersion;

  /** Version B (newer) */
  versionB: DocumentVersion;

  /** Detailed diff */
  diff: ComparisonDiff;

  /** Summary statistics */
  summary: ComparisonSummary;
}

/**
 * Comparison diff
 */
export interface ComparisonDiff {
  /** Sections that differ */
  sections: Array<{
    /** Section name */
    name: string;

    /** Diff type */
    type: "added" | "removed" | "modified" | "unchanged";

    /** Content from version A */
    contentA?: unknown;

    /** Content from version B */
    contentB?: unknown;

    /** Line-by-line diff (if text) */
    lineDiff?: LineDiff[];
  }>;

  /** Template changed */
  templateChanged: boolean;

  /** Theme changed */
  themeChanged: boolean;
}

/**
 * Line-level diff
 */
export interface LineDiff {
  /** Line number */
  lineNumber: number;

  /** Diff type */
  type: "added" | "removed" | "modified" | "unchanged";

  /** Content */
  content: string;
}

/**
 * Comparison summary
 */
export interface ComparisonSummary {
  /** Total sections compared */
  totalSections: number;

  /** Sections added */
  sectionsAdded: number;

  /** Sections removed */
  sectionsRemoved: number;

  /** Sections modified */
  sectionsModified: number;

  /** Character difference */
  charDifference: number;

  /** Word difference */
  wordDifference: number;

  /** ATS score difference */
  atsScoreDifference?: number;

  /** Similarity percentage */
  similarityScore: number;
}

/**
 * Version history filter
 */
export interface VersionHistoryFilter {
  /** Filter by change type */
  changeTypes?: ChangeType[];

  /** Filter by branch */
  branchName?: string;

  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };

  /** Filter by tags */
  tags?: string[];

  /** Show archived versions */
  includeArchived: boolean;

  /** Search query */
  searchQuery?: string;
}

/**
 * Version restore options
 */
export interface VersionRestoreOptions {
  /** Version to restore */
  versionId: string;

  /** Create new version on restore */
  createNewVersion: boolean;

  /** Branch name for restored version */
  branchName?: string;

  /** Restore note */
  note?: string;
}

/**
 * Version merge request
 */
export interface VersionMergeRequest {
  /** Source version ID */
  sourceVersionId: string;

  /** Target version ID */
  targetVersionId: string;

  /** Merge strategy */
  strategy: "theirs" | "ours" | "manual";

  /** Manual merge selections (if strategy = manual) */
  manualSelections?: {
    [sectionKey: string]: "source" | "target" | "custom";
  };

  /** Custom content for manual selections */
  customContent?: {
    [sectionKey: string]: unknown;
  };

  /** Merge message */
  message?: string;
}

/**
 * Version export options
 */
export interface VersionExportOptions {
  /** Version ID to export */
  versionId: string;

  /** Export format */
  format: "pdf" | "docx" | "html" | "txt" | "json";

  /** Include metadata */
  includeMetadata: boolean;

  /** Filename */
  filename?: string;
}
