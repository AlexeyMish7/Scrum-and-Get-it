/**
 * API TYPES
 *
 * Types for API request payloads and response structures.
 * These define the contract between frontend and backend.
 */

/**
 * Standard API response wrapper
 * All API endpoints should return this structure for consistency
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/**
 * API error structure
 * Normalized error format for all API failures
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Pagination request parameters
 * Used for list endpoints that support pagination
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Pagination response metadata
 * Returned with paginated list responses
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated list response
 * Standard structure for endpoints returning lists
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Sort parameters for list endpoints
 */
export interface SortParams {
  column: string;
  ascending?: boolean;
}

/**
 * Filter parameters for list endpoints
 */
export interface FilterParams {
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
  in?: Record<string, unknown[]>;
  gt?: Record<string, number | string>;
  gte?: Record<string, number | string>;
  lt?: Record<string, number | string>;
  lte?: Record<string, number | string>;
}

/**
 * Generic list request parameters
 * Combines pagination, sorting, and filtering
 */
export interface ListParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams;
  search?: string;
}

// ===== AI Generation Request/Response Types =====

/**
 * Resume generation request
 */
export interface GenerateResumeRequest {
  jobId?: number;
  templateId?: string;
  options?: {
    includeSkills?: boolean;
    includeProjects?: boolean;
    maxBulletPoints?: number;
    tone?: "professional" | "creative" | "technical";
  };
}

/**
 * Resume generation response
 */
export interface GenerateResumeResponse {
  artifactId: string;
  content: {
    sections: Record<string, unknown>;
    bullets: string[];
    skills: string[];
  };
  preview: string;
  createdAt: string;
}

/**
 * Cover letter generation request
 */
export interface GenerateCoverLetterRequest {
  jobId: number;
  templateId?: string;
  options?: {
    tone?: "formal" | "casual" | "enthusiastic";
    length?: "brief" | "standard" | "detailed";
    includeCompanyResearch?: boolean;
  };
}

/**
 * Cover letter generation response
 */
export interface GenerateCoverLetterResponse {
  artifactId: string;
  content: {
    opening: string;
    body: string[];
    closing: string;
  };
  preview: string;
  createdAt: string;
}

/**
 * Company research request
 */
export interface CompanyResearchRequest {
  companyName: string;
  includeNews?: boolean;
  includeFinancials?: boolean;
}

/**
 * Company research response
 */
export interface CompanyResearchResponse {
  company: {
    name: string;
    description: string;
    industry: string;
    size?: string;
    founded?: string;
    headquarters?: string;
    website?: string;
  };
  news?: Array<{
    title: string;
    summary: string;
    url: string;
    date: string;
  }>;
  financials?: {
    revenue?: string;
    funding?: string;
    status?: string;
  };
}

/**
 * Job match request
 */
export interface JobMatchRequest {
  jobId: number;
  includeSkillsGap?: boolean;
}

/**
 * Job match response
 */
export interface JobMatchResponse {
  matchScore: number; // 0-100
  breakdown: {
    skills: number;
    experience: number;
    education: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}
