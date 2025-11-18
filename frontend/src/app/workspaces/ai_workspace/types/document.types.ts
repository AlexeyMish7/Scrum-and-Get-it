/**
 * Document Types
 *
 * Defines types for resume and cover letter documents, their content
 * structure, and metadata.
 */

/**
 * Document type
 */
export type DocumentType = "resume" | "cover-letter";

/**
 * Document status
 */
export type DocumentStatus = "draft" | "final" | "archived";

/**
 * Base document model
 */
export interface Document {
  /** Unique document identifier */
  id: string;

  /** Owner user ID */
  userId: string;

  /** Document type */
  type: DocumentType;

  /** Document status */
  status: DocumentStatus;

  /** Configuration */
  config: DocumentConfiguration;

  /** Current content */
  content: ResumeContent | CoverLetterContent;

  /** Current version ID */
  currentVersionId: string;

  /** Context information */
  context: DocumentContext;

  /** Metadata */
  metadata: DocumentMetadata;

  /** Statistics */
  stats: DocumentStats;

  /** Timestamps */
  createdAt: string;
  lastEditedAt: string;
  lastGeneratedAt?: string;

  /** User flags */
  isDefault: boolean;
  isPinned: boolean;
  isArchived: boolean;
}

/**
 * Document configuration
 */
export interface DocumentConfiguration {
  /** Display name */
  name: string;

  /** Optional description */
  description?: string;

  /** Template ID */
  templateId: string;

  /** Theme ID */
  themeId: string;

  /** Custom overrides */
  customOverrides?: {
    templateOverrides?: Record<string, unknown>;
    themeOverrides?: Record<string, unknown>;
  };
}

/**
 * Document context
 */
export interface DocumentContext {
  /** Target job ID */
  jobId?: number;

  /** Target role */
  targetRole?: string;

  /** Target company */
  targetCompany?: string;

  /** Target industry */
  targetIndustry?: string;

  /** Custom context notes */
  notes?: string;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  /** Tags for organization */
  tags: string[];

  /** Folder/category */
  folder?: string;

  /** Color label */
  color?: string;

  /** Star rating */
  rating?: number;

  /** User notes */
  notes?: string;
}

/**
 * Document statistics
 */
export interface DocumentStats {
  /** Total versions */
  totalVersions: number;

  /** Total edits */
  totalEdits: number;

  /** Times exported */
  timesExported: number;

  /** Times used in job applications */
  timesUsedInApplications: number;

  /** Success rate (interviews/applications) */
  successRate?: number;

  /** Average ATS score across versions */
  averageAtsScore?: number;

  /** Word count */
  wordCount: number;

  /** Character count */
  charCount: number;

  /** File size (bytes) */
  fileSize: number;
}

/**
 * Resume content structure
 */
export interface ResumeContent {
  /** Header section */
  header: ResumeHeader;

  /** Professional summary */
  summary?: ResumeSummary;

  /** Work experience */
  experience: ResumeExperience;

  /** Education */
  education: ResumeEducation;

  /** Skills */
  skills: ResumeSkills;

  /** Projects (optional) */
  projects?: ResumeProjects;

  /** Certifications (optional) */
  certifications?: ResumeCertifications;

  /** Publications (optional) */
  publications?: ResumePublications;

  /** Awards (optional) */
  awards?: ResumeAwards;

  /** Languages (optional) */
  languages?: ResumeLanguages;

  /** Custom sections */
  customSections?: ResumeCustomSection[];
}

/**
 * Resume header
 */
export interface ResumeHeader {
  /** Full name */
  fullName: string;

  /** Professional title */
  title: string;

  /** Email address */
  email: string;

  /** Phone number */
  phone: string;

  /** Location (city, state) */
  location: string;

  /** Links (LinkedIn, GitHub, portfolio, etc.) */
  links: Array<{
    type: string;
    url: string;
    label: string;
  }>;

  /** Profile photo URL (optional) */
  photoUrl?: string;
}

/**
 * Resume summary section
 */
export interface ResumeSummary {
  /** Section enabled */
  enabled: boolean;

  /** Summary text */
  text: string;

  /** Key highlights */
  highlights?: string[];
}

/**
 * Resume experience section
 */
export interface ResumeExperience {
  /** Section enabled */
  enabled: boolean;

  /** Experience items */
  items: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string | null;
    current: boolean;
    bullets: string[];
    highlights?: string[];
    technologies?: string[];
  }>;
}

/**
 * Resume education section
 */
export interface ResumeEducation {
  /** Section enabled */
  enabled: boolean;

  /** Education items */
  items: Array<{
    degree: string;
    field?: string;
    institution: string;
    location: string;
    graduationDate: string;
    gpa?: number;
    honors?: string;
    relevant?: string[];
  }>;
}

/**
 * Resume skills section
 */
export interface ResumeSkills {
  /** Section enabled */
  enabled: boolean;

  /** Skill categories */
  categories: Array<{
    name: string;
    skills: Array<{
      name: string;
      level?: "beginner" | "intermediate" | "advanced" | "expert";
      highlighted: boolean;
      yearsExperience?: number;
    }>;
  }>;
}

/**
 * Resume projects section
 */
export interface ResumeProjects {
  /** Section enabled */
  enabled: boolean;

  /** Project items */
  items: Array<{
    name: string;
    description: string;
    role: string;
    technologies: string[];
    url?: string;
    highlights: string[];
    startDate?: string;
    endDate?: string;
  }>;
}

/**
 * Resume certifications section
 */
export interface ResumeCertifications {
  /** Section enabled */
  enabled: boolean;

  /** Certification items */
  items: Array<{
    name: string;
    issuer: string;
    date: string;
    expires?: string;
    credentialId?: string;
    url?: string;
  }>;
}

/**
 * Resume publications section
 */
export interface ResumePublications {
  /** Section enabled */
  enabled: boolean;

  /** Publication items */
  items: Array<{
    title: string;
    publication: string;
    date: string;
    authors: string[];
    url?: string;
    doi?: string;
  }>;
}

/**
 * Resume awards section
 */
export interface ResumeAwards {
  /** Section enabled */
  enabled: boolean;

  /** Award items */
  items: Array<{
    name: string;
    issuer: string;
    date: string;
    description?: string;
  }>;
}

/**
 * Resume languages section
 */
export interface ResumeLanguages {
  /** Section enabled */
  enabled: boolean;

  /** Language items */
  items: Array<{
    language: string;
    proficiency:
      | "native"
      | "fluent"
      | "professional"
      | "conversational"
      | "basic";
  }>;
}

/**
 * Resume custom section
 */
export interface ResumeCustomSection {
  /** Section ID */
  id: string;

  /** Section title */
  title: string;

  /** Section enabled */
  enabled: boolean;

  /** Section content */
  content: unknown;

  /** Section type/format */
  format: "text" | "list" | "table" | "custom";
}

/**
 * Cover letter content structure
 */
export interface CoverLetterContent {
  /** Header (can use same as resume or custom) */
  header: CoverLetterHeader;

  /** Recipient information */
  recipient: CoverLetterRecipient;

  /** Letter salutation */
  salutation: string;

  /** Letter body */
  body: CoverLetterBody;

  /** Letter signature */
  signature: CoverLetterSignature;

  /** AI-generated insights (metadata) */
  insights?: CoverLetterInsights;
}

/**
 * Cover letter header
 */
export interface CoverLetterHeader {
  /** Full name */
  fullName: string;

  /** Email */
  email: string;

  /** Phone */
  phone: string;

  /** Location */
  location: string;

  /** Letter date */
  date: string;

  /** Custom header format */
  customFormat?: boolean;
}

/**
 * Cover letter recipient
 */
export interface CoverLetterRecipient {
  /** Recipient name */
  name?: string;

  /** Recipient title */
  title?: string;

  /** Company name */
  company: string;

  /** Company address */
  address?: string;
}

/**
 * Cover letter body
 */
export interface CoverLetterBody {
  /** Opening paragraph */
  opening: string;

  /** Body paragraph 1 (experience/qualifications) */
  body1: string;

  /** Body paragraph 2 (additional selling points) */
  body2?: string;

  /** Body paragraph 3 (optional) */
  body3?: string;

  /** Closing paragraph (call to action) */
  closing: string;
}

/**
 * Cover letter signature
 */
export interface CoverLetterSignature {
  /** Closing phrase */
  closing: string;

  /** Signer name */
  name: string;

  /** Signature image URL (optional) */
  signatureUrl?: string;
}

/**
 * Cover letter AI insights
 */
export interface CoverLetterInsights {
  /** Company research data */
  companyResearch?: unknown;

  /** Keywords matched from job posting */
  keywordsMatched: string[];

  /** Detected tone */
  tone: string;

  /** Confidence score */
  confidenceScore?: number;
}

/**
 * Document filter options
 */
export interface DocumentFilter {
  /** Filter by type */
  type?: DocumentType;

  /** Filter by status */
  status?: DocumentStatus;

  /** Filter by tags */
  tags?: string[];

  /** Filter by folder */
  folder?: string;

  /** Filter by job ID */
  jobId?: number;

  /** Search query */
  searchQuery?: string;

  /** Date range */
  dateRange?: {
    start: string;
    end: string;
  };

  /** Include archived */
  includeArchived: boolean;
}

/**
 * Document sort options
 */
export interface DocumentSort {
  /** Sort field */
  field: "name" | "createdAt" | "lastEditedAt" | "rating" | "successRate";

  /** Sort direction */
  direction: "asc" | "desc";
}
