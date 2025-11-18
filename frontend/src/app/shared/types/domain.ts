/**
 * DOMAIN TYPES
 *
 * Types representing business entities as used in the UI layer.
 * These are transformed from database rows to be more UI-friendly:
 * - Snake_case → camelCase
 * - Date strings → Date objects
 * - Combined or computed fields
 * - Nullable fields handled appropriately
 *
 * Services are responsible for mapping between database rows and domain models.
 */

// Profile domain model
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  professionalTitle?: string;
  summary?: string;
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive";
  industry?: string;
  city?: string;
  state?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Education domain model
export interface Education {
  id: string;
  institutionName: string;
  degreeType?: string;
  fieldOfStudy?: string;
  startDate: Date;
  graduationDate?: Date;
  gpa?: number;
  enrollmentStatus?: string;
  educationLevel?: string;
  honors?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Employment domain model
export interface Employment {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  jobDescription?: string;
  currentPosition: boolean;
  // Computed field
  duration: string; // e.g., "2 years 3 months" or "Present"
  createdAt: Date;
  updatedAt: Date;
}

// Skill domain model
export interface Skill {
  id: string;
  skillName: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  skillCategory: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project domain model
export interface Project {
  id: string;
  projectName: string;
  description?: string;
  role?: string;
  startDate: Date;
  endDate?: Date;
  techAndSkills: string[];
  projectUrl?: string;
  teamSize?: number;
  teamDetails?: string;
  industryProjectType?: string;
  outcomes?: string;
  status: "planned" | "in_progress" | "completed" | "on_hold";
  mediaPath?: string;
  mediaUrl?: string; // Resolved URL for media (computed)
  createdAt: Date;
  updatedAt: Date;
}

// Certification domain model
export interface Certification {
  id: string;
  name: string;
  issuingOrganization?: string;
  category?: string;
  dateEarned?: Date;
  expirationDate?: Date;
  doesNotExpire: boolean;
  certificationId?: string;
  mediaPath?: string;
  verificationStatus: "unverified" | "pending" | "verified" | "expired";
  // Computed field
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Job domain model
export interface Job {
  id: number;
  jobTitle: string;
  companyName: string;
  location?: {
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  salaryRange?: {
    min?: number;
    max?: number;
  };
  jobLink?: string;
  applicationDeadline?: Date;
  jobDescription?: string;
  industry?: string;
  jobType?: string;
  status: string;
  statusChangedAt?: Date;
  // Computed fields
  daysUntilDeadline?: number;
  isOverdue: boolean;
  createdAt: Date;
}

// Document domain model
export interface Document {
  id: string;
  kind: "resume" | "cover_letter" | "portfolio" | "other";
  fileName: string;
  filePath: string;
  mimeType?: string;
  sizeBytes?: number;
  downloadUrl?: string; // Resolved download URL (computed)
  uploadedAt: Date;
  projectId?: string;
}

// AI Artifact domain model
export interface AIArtifact {
  id: string;
  jobId?: number;
  kind:
    | "resume"
    | "cover_letter"
    | "skills_optimization"
    | "company_research"
    | "match"
    | "gap_analysis";
  title?: string;
  prompt?: string;
  model?: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Job Materials domain model (links jobs to materials)
export interface JobMaterial {
  id: string;
  jobId: number;
  resumeDocumentId?: string;
  resumeArtifactId?: string;
  coverDocumentId?: string;
  coverArtifactId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Job Notes domain model
export interface JobNote {
  id: string;
  jobId: number;
  personalNotes?: string;
  contacts: {
    recruiter?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    hiringManager?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  applicationHistory: Array<{
    status: string;
    date: Date;
    notes?: string;
  }>;
  salaryNegotiationNotes?: string;
  interviewNotes?: string;
  interviewFeedback?: string;
  createdAt: Date;
  updatedAt?: Date;
}
