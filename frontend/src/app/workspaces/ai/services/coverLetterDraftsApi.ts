/**
 * Cover Letter Drafts API Client
 *
 * Frontend service for interacting with /api/cover-letter/drafts endpoints
 * Handles all CRUD operations for cover letter drafts with Supabase persistence
 *
 * Functions:
 * - listDrafts: Get all user's active drafts
 * - getDraft: Get specific draft by ID
 * - createDraft: Create new draft
 * - updateDraft: Update existing draft (partial update)
 * - deleteDraft: Soft delete draft
 */

import { aiClient } from "./client";
import type { CoverLetterDraft } from "../hooks/useCoverLetterDrafts";

const { postJson, getJson, patchJson, deleteJson } = aiClient;

/**
 * Backend draft row type (matches server types)
 */
export interface CoverLetterDraftRow {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content: CoverLetterDraft["content"];
  metadata: CoverLetterDraft["metadata"];
  company_research?: CompanyResearch;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

/**
 * Company research type (for type safety)
 */
export interface CompanyResearch {
  companyName: string;
  size?: string;
  industry?: string;
  location?: string;
  website?: string;
  mission?: string;
  values?: string[];
  recentNews?: Array<{
    title: string;
    date: string;
    summary: string;
    source: string;
  }>;
  products?: string[];
  competitors?: string[];
  culture?: string;
  fundingStage?: string;
  lastUpdated?: string;
}

/**
 * Create draft input (matches CreateCoverLetterDraftInput from server)
 */
export interface CreateDraftInput {
  name: string;
  template_id?: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content?: CoverLetterDraft["content"];
  metadata?: Partial<CoverLetterDraft["metadata"]>;
  company_research?: CompanyResearch;
}

/**
 * Update draft input (partial update)
 */
export interface UpdateDraftInput {
  name?: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content?: Partial<CoverLetterDraft["content"]>;
  metadata?: Partial<CoverLetterDraft["metadata"]>;
  company_research?: Partial<CompanyResearch>;
}

/**
 * Convert backend row to frontend draft
 */
function rowToDraft(row: CoverLetterDraftRow): CoverLetterDraft {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    content: row.content,
    metadata: {
      ...row.metadata,
      lastModified: new Date(row.metadata.lastModified),
      createdAt: new Date(row.metadata.createdAt),
    },
    companyResearch: row.company_research
      ? {
          ...row.company_research,
          lastUpdated: row.company_research.lastUpdated
            ? new Date(row.company_research.lastUpdated)
            : undefined,
        }
      : undefined,
  };
}

/**
 * LIST DRAFTS
 * GET /api/cover-letter/drafts
 */
export async function listDrafts(userId: string): Promise<CoverLetterDraft[]> {
  const response = await getJson<{ drafts: CoverLetterDraftRow[] }>(
    "/api/cover-letter/drafts",
    userId
  );
  return response.drafts.map(rowToDraft);
}

/**
 * GET DRAFT
 * GET /api/cover-letter/drafts/:id
 */
export async function getDraft(
  draftId: string,
  userId: string
): Promise<CoverLetterDraft> {
  const response = await getJson<{ draft: CoverLetterDraftRow }>(
    `/api/cover-letter/drafts/${draftId}`,
    userId
  );
  return rowToDraft(response.draft);
}

/**
 * CREATE DRAFT
 * POST /api/cover-letter/drafts
 */
export async function createDraft(
  input: CreateDraftInput,
  userId: string
): Promise<CoverLetterDraft> {
  const response = await postJson<{ draft: CoverLetterDraftRow }>(
    "/api/cover-letter/drafts",
    input,
    userId
  );
  return rowToDraft(response.draft);
}

/**
 * UPDATE DRAFT
 * PATCH /api/cover-letter/drafts/:id
 */
export async function updateDraft(
  draftId: string,
  input: UpdateDraftInput
): Promise<CoverLetterDraft> {
  const response = await patchJson<{ draft: CoverLetterDraftRow }>(
    `/api/cover-letter/drafts/${draftId}`,
    input
  );
  return rowToDraft(response.draft);
}

/**
 * DELETE DRAFT
 * DELETE /api/cover-letter/drafts/:id
 */
export async function deleteDraft(draftId: string): Promise<void> {
  await deleteJson(`/api/cover-letter/drafts/${draftId}`);
}
