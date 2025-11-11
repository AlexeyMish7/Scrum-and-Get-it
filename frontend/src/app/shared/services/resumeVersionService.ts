/**
 * Resume Draft Versioning Service
 *
 * WHAT: Handles automatic version creation and side-by-side comparison
 * WHY: Provides version control for resume drafts similar to Git
 *
 * Features:
 * - Auto-version on save if content changed (via hash comparison)
 * - Retrieve version history for a draft
 * - Side-by-side comparison of two versions
 * - Restore previous version (creates new version from old content)
 * - Delete version (soft delete - marks as inactive)
 *
 * Usage:
 * const newVersionId = await createVersionIfChanged(draftId, newContent);
 * const versions = await getVersionHistory(draftId);
 * const comparison = await compareVersions(versionId1, versionId2);
 */

import { supabase } from "@shared/services/supabaseClient";
import type { ResumeDraft } from "@workspaces/ai/hooks/useResumeDraftsV2";

// ============================================================================
// Types
// ============================================================================

export interface ResumeDraftVersion {
  id: string;
  user_id: string;
  name: string;
  version: number;
  is_active: boolean;
  parent_draft_id: string | null;
  origin_source: string;
  template_id: string;
  content: ResumeDraft["content"];
  metadata: ResumeDraft["metadata"];
  content_hash: string | null;
  created_at: string;
  updated_at: string;
  root_draft_id?: string; // From view
  total_versions?: number; // From view
}

export interface VersionComparison {
  version1: ResumeDraftVersion;
  version2: ResumeDraftVersion;
  differences: {
    summary?: { old: string; new: string };
    skills?: { added: string[]; removed: string[] };
    experience?: { added: number; removed: number; modified: number };
    education?: { added: number; removed: number; modified: number };
    projects?: { added: number; removed: number; modified: number };
  };
}

// ============================================================================
// Hash Utility
// ============================================================================

/**
 * Generate SHA-256 hash of content for change detection
 */
async function hashContent(content: unknown): Promise<string> {
  const contentObj = content as Record<string, unknown>;
  const sortedKeys = Object.keys(contentObj).sort();
  const contentStr = JSON.stringify(contentObj, sortedKeys);
  const encoder = new TextEncoder();
  const data = encoder.encode(contentStr);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================================
// Version Creation
// ============================================================================

/**
 * Create a new version if content has changed
 * Returns new version ID if created, null if no change detected
 */
export async function createVersionIfChanged(
  currentDraftId: string,
  newContent: ResumeDraft["content"],
  newMetadata: ResumeDraft["metadata"],
  userId: string,
  originSource: string = "manual"
): Promise<string | null> {
  try {
    // Get current draft
    const { data: currentDraft, error: fetchError } = await supabase
      .from("resume_drafts")
      .select("*")
      .eq("id", currentDraftId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentDraft) {
      console.error("Failed to fetch current draft:", fetchError);
      return null;
    }

    // Calculate hash of new content
    const newHash = await hashContent(newContent);

    // If hash matches, no change - don't create version
    if (currentDraft.content_hash === newHash) {
      console.log("No content change detected, skipping version creation");
      return null;
    }

    // Content changed - create new version
    const { data: newVersion, error: createError } = await supabase
      .from("resume_drafts")
      .insert({
        user_id: userId,
        name: currentDraft.name, // Keep same name
        template_id: currentDraft.template_id,
        content: newContent,
        metadata: newMetadata,
        parent_draft_id: currentDraftId, // Link to parent
        origin_source: originSource,
        content_hash: newHash,
        is_active: true, // New version becomes active
        // version auto-incremented by trigger
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create new version:", createError);
      return null;
    }

    console.log(
      `Created version ${newVersion.version} for draft ${currentDraft.name}`
    );
    return newVersion.id;
  } catch (error) {
    console.error("Error in createVersionIfChanged:", error);
    return null;
  }
}

/**
 * Update existing draft in-place (no versioning)
 * Use this for metadata-only changes that shouldn't create versions
 */
export async function updateDraftInPlace(
  draftId: string,
  updates: Partial<ResumeDraftVersion>,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("resume_drafts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update draft in place:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateDraftInPlace:", error);
    return false;
  }
}

// ============================================================================
// Version History
// ============================================================================

/**
 * Get all versions for a draft (entire version family)
 */
export async function getVersionHistory(
  draftId: string,
  userId: string
): Promise<ResumeDraftVersion[]> {
  try {
    // Use the view to get version family information
    const { data, error } = await supabase
      .from("v_resume_draft_versions")
      .select("*")
      .eq("user_id", userId)
      .or(
        `id.eq.${draftId},parent_draft_id.eq.${draftId},root_draft_id.eq.${draftId}`
      )
      .order("version", { ascending: true });

    if (error) {
      console.error("Failed to fetch version history:", error);
      return [];
    }

    return data as ResumeDraftVersion[];
  } catch (error) {
    console.error("Error in getVersionHistory:", error);
    return [];
  }
}

/**
 * Get latest active version for a draft family
 */
export async function getLatestVersion(
  rootDraftId: string,
  userId: string
): Promise<ResumeDraftVersion | null> {
  try {
    const { data, error } = await supabase
      .from("resume_drafts")
      .select("*")
      .eq("user_id", userId)
      .or(`id.eq.${rootDraftId},parent_draft_id.eq.${rootDraftId}`)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Failed to fetch latest version:", error);
      return null;
    }

    return data as ResumeDraftVersion;
  } catch (error) {
    console.error("Error in getLatestVersion:", error);
    return null;
  }
}

// ============================================================================
// Version Comparison
// ============================================================================

/**
 * Compare two versions side-by-side
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string,
  userId: string
): Promise<VersionComparison | null> {
  try {
    const { data: versions, error } = await supabase
      .from("resume_drafts")
      .select("*")
      .eq("user_id", userId)
      .in("id", [versionId1, versionId2]);

    if (error || !versions || versions.length !== 2) {
      console.error("Failed to fetch versions for comparison:", error);
      return null;
    }

    const v1 = versions[0] as ResumeDraftVersion;
    const v2 = versions[1] as ResumeDraftVersion;

    // Calculate differences
    const differences: VersionComparison["differences"] = {};

    // Summary diff
    if (v1.content.summary !== v2.content.summary) {
      differences.summary = {
        old: v1.content.summary || "",
        new: v2.content.summary || "",
      };
    }

    // Skills diff
    const skills1 = new Set(v1.content.skills || []);
    const skills2 = new Set(v2.content.skills || []);
    const addedSkills = Array.from(skills2).filter((s) => !skills1.has(s));
    const removedSkills = Array.from(skills1).filter((s) => !skills2.has(s));

    if (addedSkills.length > 0 || removedSkills.length > 0) {
      differences.skills = { added: addedSkills, removed: removedSkills };
    }

    // Experience diff (simple count comparison)
    const exp1Count = v1.content.experience?.length || 0;
    const exp2Count = v2.content.experience?.length || 0;
    if (exp1Count !== exp2Count) {
      differences.experience = {
        added: Math.max(0, exp2Count - exp1Count),
        removed: Math.max(0, exp1Count - exp2Count),
        modified: 0, // TODO: Deep comparison
      };
    }

    // Education diff
    const edu1Count = v1.content.education?.length || 0;
    const edu2Count = v2.content.education?.length || 0;
    if (edu1Count !== edu2Count) {
      differences.education = {
        added: Math.max(0, edu2Count - edu1Count),
        removed: Math.max(0, edu1Count - edu2Count),
        modified: 0, // TODO: Deep comparison
      };
    }

    // Projects diff
    const proj1Count = v1.content.projects?.length || 0;
    const proj2Count = v2.content.projects?.length || 0;
    if (proj1Count !== proj2Count) {
      differences.projects = {
        added: Math.max(0, proj2Count - proj1Count),
        removed: Math.max(0, proj1Count - proj2Count),
        modified: 0, // TODO: Deep comparison
      };
    }

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  } catch (error) {
    console.error("Error in compareVersions:", error);
    return null;
  }
}

// ============================================================================
// Version Restoration
// ============================================================================

/**
 * Restore a previous version (creates new version with old content)
 */
export async function restoreVersion(
  versionToRestoreId: string,
  userId: string
): Promise<string | null> {
  try {
    // Get the version to restore
    const { data: oldVersion, error: fetchError } = await supabase
      .from("resume_drafts")
      .select("*")
      .eq("id", versionToRestoreId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !oldVersion) {
      console.error("Failed to fetch version to restore:", fetchError);
      return null;
    }

    // Find current active version in this family
    const { data: currentVersion } = await supabase
      .from("resume_drafts")
      .select("id")
      .eq("user_id", userId)
      .or(
        `id.eq.${
          oldVersion.parent_draft_id || oldVersion.id
        },parent_draft_id.eq.${oldVersion.parent_draft_id || oldVersion.id}`
      )
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const parentId = currentVersion?.id || oldVersion.id;

    // Create new version with restored content
    return await createVersionIfChanged(
      parentId,
      oldVersion.content,
      oldVersion.metadata,
      userId,
      "restore"
    );
  } catch (error) {
    console.error("Error in restoreVersion:", error);
    return null;
  }
}

// ============================================================================
// Version Deletion
// ============================================================================

/**
 * Delete a version (soft delete - marks as inactive)
 * Cannot delete the only active version
 */
export async function deleteVersion(
  versionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if this is the only active version
    const { data: draft } = await supabase
      .from("resume_drafts")
      .select("parent_draft_id, is_active")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (!draft) return false;

    // Count active versions in family
    const { count } = await supabase
      .from("resume_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .or(
        `id.eq.${draft.parent_draft_id || versionId},parent_draft_id.eq.${
          draft.parent_draft_id || versionId
        }`
      )
      .eq("is_active", true);

    if (count === 1 && draft.is_active) {
      console.error("Cannot delete the only active version");
      return false;
    }

    // Soft delete (mark as inactive)
    const { error } = await supabase
      .from("resume_drafts")
      .update({ is_active: false })
      .eq("id", versionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete version:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteVersion:", error);
    return false;
  }
}
