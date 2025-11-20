/**
 * Cover Letter Drafts Service
 *
 * CRUD operations for cover_letter_drafts table
 * Handles database operations for cover letter drafts with RLS
 *
 * Functions:
 * - listCoverLetterDrafts: Get all drafts for a user
 * - getCoverLetterDraft: Get specific draft by ID
 * - createCoverLetterDraft: Insert new draft
 * - updateCoverLetterDraft: Update existing draft
 * - deleteCoverLetterDraft: Soft delete (set is_active = false)
 */

import { ApiError } from "../../utils/errors.js";
import { logInfo, legacyLogError as logError } from "../../utils/logger.js";

// Helper to get supabase client with proper error handling
async function getSupabaseAdmin() {
  const { default: supabaseAdmin } = await import("./supabaseAdmin.js");
  if (!supabaseAdmin) {
    throw new ApiError(
      503,
      "Database not configured - server environment variables missing"
    );
  }
  return supabaseAdmin;
}

// ============================================================================
// Types
// ============================================================================

export interface CoverLetterDraftRow {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content: {
    header?: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      date?: string;
      companyName?: string;
      companyAddress?: string;
      hiringManager?: string;
    };
    opening?: string;
    body?: string[];
    closing?: string;
    signature?: string;
  };
  metadata: {
    tone: "formal" | "casual" | "enthusiastic" | "analytical";
    length: "brief" | "standard" | "detailed";
    culture: "corporate" | "startup" | "creative";
    industry?: string;
    lastModified: string;
    createdAt: string;
    wordCount?: number;
  };
  company_research?: {
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
  };
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

export interface CreateCoverLetterDraftInput {
  user_id: string;
  name: string;
  template_id?: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content?: CoverLetterDraftRow["content"];
  metadata?: Partial<CoverLetterDraftRow["metadata"]>;
  company_research?: CoverLetterDraftRow["company_research"];
}

export interface UpdateCoverLetterDraftInput {
  name?: string;
  template_id?: string;
  job_id?: number;
  company_name?: string;
  job_title?: string;
  content?: Partial<CoverLetterDraftRow["content"]>;
  metadata?: Partial<CoverLetterDraftRow["metadata"]>;
  company_research?: Partial<CoverLetterDraftRow["company_research"]>;
}

// ============================================================================
// CRUD Functions
// ============================================================================

/**
 * LIST COVER LETTER DRAFTS
 * Get all active drafts for a user
 */
export async function listCoverLetterDrafts(
  userId: string
): Promise<CoverLetterDraftRow[]> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    logInfo("list_cover_letter_drafts_start", { userId });

    const { data, error } = await supabaseAdmin
      .from("cover_letter_drafts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) {
      logError("list_cover_letter_drafts_error", {
        userId,
        error: error.message,
      });
      throw new ApiError(500, `Database error: ${error.message}`, "db_error");
    }

    logInfo("list_cover_letter_drafts_success", {
      userId,
      count: data?.length ?? 0,
    });

    return (data ?? []) as CoverLetterDraftRow[];
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    logError("list_cover_letter_drafts_exception", {
      userId,
      error: error.message,
    });
    throw new ApiError(
      500,
      "Failed to list cover letter drafts",
      "internal_error"
    );
  }
}

/**
 * GET COVER LETTER DRAFT
 * Get specific draft by ID (with RLS check)
 */
export async function getCoverLetterDraft(
  draftId: string,
  userId: string
): Promise<CoverLetterDraftRow> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    logInfo("get_cover_letter_draft_start", { draftId, userId });

    const { data, error } = await supabaseAdmin
      .from("cover_letter_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        throw new ApiError(404, "Cover letter draft not found", "not_found");
      }
      logError("get_cover_letter_draft_error", {
        draftId,
        userId,
        error: error.message,
      });
      throw new ApiError(500, `Database error: ${error.message}`, "db_error");
    }

    // Update last_accessed_at
    await supabaseAdmin
      .from("cover_letter_drafts")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", draftId)
      .eq("user_id", userId);

    logInfo("get_cover_letter_draft_success", { draftId, userId });

    return data as CoverLetterDraftRow;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    logError("get_cover_letter_draft_exception", {
      draftId,
      userId,
      error: error.message,
    });
    throw new ApiError(
      500,
      "Failed to get cover letter draft",
      "internal_error"
    );
  }
}

/**
 * CREATE COVER LETTER DRAFT
 * Insert new draft with default values
 */
export async function createCoverLetterDraft(
  input: CreateCoverLetterDraftInput
): Promise<CoverLetterDraftRow> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    logInfo("create_cover_letter_draft_start", {
      userId: input.user_id,
      name: input.name,
    });

    const now = new Date().toISOString();

    const draft = {
      user_id: input.user_id,
      name: input.name,
      template_id: input.template_id || "formal",
      job_id: input.job_id || null,
      company_name: input.company_name || null,
      job_title: input.job_title || null,
      content: input.content || {
        header: {
          name: "",
          address: "",
          phone: "",
          email: "",
          date: new Date().toLocaleDateString(),
          companyName: input.company_name || "",
          companyAddress: "",
          hiringManager: "",
        },
        opening: "",
        body: ["", ""],
        closing: "",
        signature: "",
      },
      metadata: {
        tone: input.metadata?.tone || "formal",
        length: input.metadata?.length || "standard",
        culture: input.metadata?.culture || "corporate",
        industry: input.metadata?.industry || "",
        lastModified: now,
        createdAt: now,
        wordCount: 0,
        ...input.metadata,
      },
      company_research: input.company_research || null,
      version: 1,
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from("cover_letter_drafts")
      .insert(draft)
      .select()
      .single();

    if (error) {
      logError("create_cover_letter_draft_error", {
        userId: input.user_id,
        error: error.message,
      });
      throw new ApiError(500, `Database error: ${error.message}`, "db_error");
    }

    logInfo("create_cover_letter_draft_success", {
      userId: input.user_id,
      draftId: data.id,
    });

    return data as CoverLetterDraftRow;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    logError("create_cover_letter_draft_exception", {
      userId: input.user_id,
      error: error.message,
    });
    throw new ApiError(
      500,
      "Failed to create cover letter draft",
      "internal_error"
    );
  }
}

/**
 * UPDATE COVER LETTER DRAFT
 * Update existing draft (partial update)
 */
export async function updateCoverLetterDraft(
  draftId: string,
  userId: string,
  input: UpdateCoverLetterDraftInput
): Promise<CoverLetterDraftRow> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    logInfo("update_cover_letter_draft_start", { draftId, userId });

    // Get current draft for merging
    const current = await getCoverLetterDraft(draftId, userId);

    const updates: any = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.template_id !== undefined)
      updates.template_id = input.template_id;
    if (input.job_id !== undefined) updates.job_id = input.job_id;
    if (input.company_name !== undefined)
      updates.company_name = input.company_name;
    if (input.job_title !== undefined) updates.job_title = input.job_title;

    // Merge content
    if (input.content !== undefined) {
      updates.content = { ...current.content, ...input.content };
    }

    // Merge metadata
    if (input.metadata !== undefined) {
      updates.metadata = {
        ...current.metadata,
        ...input.metadata,
        lastModified: new Date().toISOString(),
      };
    }

    // Merge company research
    if (input.company_research !== undefined) {
      updates.company_research = {
        ...current.company_research,
        ...input.company_research,
      };
    }

    // Increment version for optimistic locking
    updates.version = current.version + 1;

    const { data, error } = await supabaseAdmin
      .from("cover_letter_drafts")
      .update(updates)
      .eq("id", draftId)
      .eq("user_id", userId)
      .eq("version", current.version) // Optimistic lock check
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Version mismatch - conflict
        throw new ApiError(
          409,
          "Draft was modified by another request",
          "version_conflict"
        );
      }
      logError("update_cover_letter_draft_error", {
        draftId,
        userId,
        error: error.message,
      });
      throw new ApiError(500, `Database error: ${error.message}`, "db_error");
    }

    logInfo("update_cover_letter_draft_success", { draftId, userId });

    return data as CoverLetterDraftRow;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    logError("update_cover_letter_draft_exception", {
      draftId,
      userId,
      error: error.message,
    });
    throw new ApiError(
      500,
      "Failed to update cover letter draft",
      "internal_error"
    );
  }
}

/**
 * DELETE COVER LETTER DRAFT
 * Soft delete (set is_active = false)
 */
export async function deleteCoverLetterDraft(
  draftId: string,
  userId: string
): Promise<void> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    logInfo("delete_cover_letter_draft_start", { draftId, userId });

    const { error } = await supabaseAdmin
      .from("cover_letter_drafts")
      .update({ is_active: false })
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) {
      logError("delete_cover_letter_draft_error", {
        draftId,
        userId,
        error: error.message,
      });
      throw new ApiError(500, `Database error: ${error.message}`, "db_error");
    }

    logInfo("delete_cover_letter_draft_success", { draftId, userId });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    logError("delete_cover_letter_draft_exception", {
      draftId,
      userId,
      error: error.message,
    });
    throw new ApiError(
      500,
      "Failed to delete cover letter draft",
      "internal_error"
    );
  }
}
