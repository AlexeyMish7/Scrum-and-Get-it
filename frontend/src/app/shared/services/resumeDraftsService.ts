/**
 * Resume Drafts Service
 *
 * WHAT: Database CRUD operations for resume drafts
 * WHY: Persist resume drafts to database instead of localStorage for multi-device sync
 *
 * Features:
 * - Create, read, update, delete resume drafts
 * - List user's drafts with sorting/filtering
 * - Soft delete support (archive instead of hard delete)
 * - Version tracking for optimistic locking
 * - Automatic timestamp management
 * - Uses existing crud.ts helpers with withUser() scoping
 *
 * Inputs: Draft data, user authentication
 * Outputs: Database operations results
 * Errors: Returns Result<T> with error field (doesn't throw)
 */

import { supabase } from "@shared/services/supabaseClient";
import { withUser } from "@shared/services/crud";
import type { Result } from "@shared/services/types";

export interface ResumeDraftRow {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  source_artifact_id?: string | null; // Link to AI artifact if generated from AI
  content: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
      original_bullets?: string[];
      relevance_score?: number;
      notes?: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      graduation_date?: string;
      details?: string[];
    }>;
    projects?: Array<{
      name: string;
      role?: string;
      bullets?: string[];
    }>;
  };
  metadata: {
    sections: Array<{
      type: "summary" | "skills" | "experience" | "education" | "projects";
      visible: boolean;
      state: "empty" | "applied" | "from-profile" | "edited";
      lastUpdated?: string;
    }>;
    lastModified: string;
    createdAt: string;
    jobId?: number;
    jobTitle?: string;
    jobCompany?: string;
  };
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

export interface CreateResumeDraftInput {
  name: string;
  template_id?: string;
  source_artifact_id?: string | null; // Optional link to AI artifact
  content?: ResumeDraftRow["content"];
  metadata?: Partial<ResumeDraftRow["metadata"]>;
  jobId?: number;
  jobTitle?: string;
  jobCompany?: string;
}

export interface UpdateResumeDraftInput {
  name?: string;
  template_id?: string;
  source_artifact_id?: string | null; // Can update the artifact link
  content?: ResumeDraftRow["content"];
  metadata?: Partial<ResumeDraftRow["metadata"]>;
}

/**
 * List all active resume drafts for the authenticated user
 *
 * Inputs: userId (from auth session)
 * Outputs: Result<ResumeDraftRow[]> sorted by updated_at DESC
 * Errors: Returns error in Result.error field
 */
export async function listResumeDrafts(
  userId: string
): Promise<Result<ResumeDraftRow[]>> {
  const userCrud = withUser(userId);

  return userCrud.listRows<ResumeDraftRow>("resume_drafts", "*", {
    eq: { is_active: true },
    order: { column: "updated_at", ascending: false },
  });
}

/**
 * Get a single resume draft by ID
 *
 * Inputs: userId, draftId
 * Outputs: Result<ResumeDraftRow | null>
 * Errors: Returns error in Result.error field
 *
 * Side effects: Updates last_accessed_at timestamp
 */
export async function getResumeDraft(
  userId: string,
  draftId: string
): Promise<Result<ResumeDraftRow | null>> {
  const userCrud = withUser(userId);

  // First, update last accessed timestamp (non-blocking)
  await supabase
    .from("resume_drafts")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("user_id", userId);

  // Get the draft
  return userCrud.getRow<ResumeDraftRow>("resume_drafts", "*", {
    eq: { id: draftId, is_active: true },
    single: true,
  });
}

/**
 * Create a new resume draft
 *
 * Inputs: userId, draft data (name required, rest optional)
 * Outputs: Result<ResumeDraftRow> with created draft
 * Errors: Returns error in Result.error field
 */
export async function createResumeDraft(
  userId: string,
  input: CreateResumeDraftInput
): Promise<Result<ResumeDraftRow>> {
  const userCrud = withUser(userId);
  const now = new Date().toISOString();

  const draftData = {
    name: input.name,
    template_id: input.template_id || "classic",
    source_artifact_id: input.source_artifact_id || null,
    content: input.content || {},
    metadata: {
      sections: input.metadata?.sections || [],
      lastModified: now,
      createdAt: now,
      jobId: input.jobId,
      jobTitle: input.jobTitle,
      jobCompany: input.jobCompany,
      ...input.metadata,
    },
    version: 1,
    is_active: true,
  };

  return userCrud.insertRow<ResumeDraftRow>("resume_drafts", draftData);
}

/**
 * Update an existing resume draft
 *
 * Inputs: userId, draftId, partial update data
 * Outputs: Result<ResumeDraftRow> with updated draft
 * Errors: Returns error in Result.error field
 *
 * Notes: Increments version number for optimistic locking
 */
export async function updateResumeDraft(
  userId: string,
  draftId: string,
  input: UpdateResumeDraftInput
): Promise<Result<ResumeDraftRow>> {
  const userCrud = withUser(userId);

  // Get current version for optimistic locking
  const currentRes = await getResumeDraft(userId, draftId);
  if (currentRes.error || !currentRes.data) {
    return {
      data: null,
      error: currentRes.error || { message: "Resume draft not found" },
      status: currentRes.status,
    };
  }

  const current = currentRes.data;
  const updateData: Partial<ResumeDraftRow> = {
    version: current.version + 1,
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.template_id !== undefined)
    updateData.template_id = input.template_id;
  if (input.source_artifact_id !== undefined)
    updateData.source_artifact_id = input.source_artifact_id;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.metadata !== undefined) {
    updateData.metadata = {
      ...current.metadata,
      ...input.metadata,
      lastModified: new Date().toISOString(),
    };
  }

  return userCrud.updateRow<ResumeDraftRow>("resume_drafts", updateData, {
    eq: { id: draftId, version: current.version },
  });
}

/**
 * Soft delete a resume draft (archive it)
 *
 * Inputs: userId, draftId
 * Outputs: Result<null>
 * Errors: Returns error in Result.error field
 *
 * Notes: Sets is_active = false instead of deleting row
 */
export async function deleteResumeDraft(
  userId: string,
  draftId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);

  return userCrud.updateRow<null>(
    "resume_drafts",
    { is_active: false },
    { eq: { id: draftId } }
  );
}

/**
 * Permanently delete a resume draft (hard delete)
 *
 * Inputs: userId, draftId
 * Outputs: Result<null>
 * Errors: Returns error in Result.error field
 *
 * WARNING: This cannot be undone. Use deleteResumeDraft for soft delete instead.
 */
export async function permanentlyDeleteResumeDraft(
  userId: string,
  draftId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);

  return userCrud.deleteRow<null>("resume_drafts", { eq: { id: draftId } });
}

/**
 * Restore an archived draft
 *
 * Inputs: userId, draftId
 * Outputs: Result<ResumeDraftRow> with restored draft
 * Errors: Returns error in Result.error field
 */
export async function restoreResumeDraft(
  userId: string,
  draftId: string
): Promise<Result<ResumeDraftRow>> {
  const userCrud = withUser(userId);

  return userCrud.updateRow<ResumeDraftRow>(
    "resume_drafts",
    { is_active: true },
    { eq: { id: draftId } }
  );
}

/**
 * Duplicate an existing resume draft
 *
 * Inputs: userId, draftId, optional newName
 * Outputs: Result<ResumeDraftRow> with new draft
 * Errors: Returns error in Result.error field
 *
 * Notes: Creates a copy with incremented version, new timestamps
 */
export async function duplicateResumeDraft(
  userId: string,
  draftId: string,
  newName?: string
): Promise<Result<ResumeDraftRow>> {
  // Get original draft
  const originalRes = await getResumeDraft(userId, draftId);
  if (originalRes.error || !originalRes.data) {
    return {
      data: null,
      error: originalRes.error || { message: "Original draft not found" },
      status: originalRes.status,
    };
  }

  const original = originalRes.data;

  // Create copy
  return createResumeDraft(userId, {
    name: newName || `${original.name} (Copy)`,
    template_id: original.template_id,
    content: original.content,
    metadata: {
      ...original.metadata,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    jobId: original.metadata.jobId,
    jobTitle: original.metadata.jobTitle,
    jobCompany: original.metadata.jobCompany,
  });
}

/**
 * List archived resume drafts
 *
 * Inputs: userId
 * Outputs: Result<ResumeDraftRow[]> with archived drafts
 * Errors: Returns error in Result.error field
 *
 * Notes: Returns drafts where is_active = false, ordered by updated_at DESC
 */
export async function listArchivedDrafts(
  userId: string
): Promise<Result<ResumeDraftRow[]>> {
  const userCrud = withUser(userId);

  return userCrud.listRows<ResumeDraftRow>("resume_drafts", "*", {
    eq: { is_active: false },
    order: { column: "updated_at", ascending: false },
  });
}
