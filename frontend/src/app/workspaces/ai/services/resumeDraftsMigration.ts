/**
 * Resume Drafts Migration Utility
 *
 * WHAT: Migrates resume drafts from localStorage to database
 * WHY: One-time migration to move existing drafts when user first logs in
 *
 * Flow:
 * 1. Check if migration already done (localStorage flag)
 * 2. Load drafts from localStorage
 * 3. Create drafts in database
 * 4. Mark migration complete
 * 5. Clear localStorage drafts
 *
 * Inputs: None (reads from localStorage)
 * Outputs: Number of drafts migrated
 * Errors: Logs errors but doesn't throw (allows partial migration)
 */

import {
  createResumeDraft,
  type ResumeDraftRow,
} from "@ai/services/resumeDraftsService";

const MIGRATION_FLAG_KEY = "resume_drafts_migrated_to_db";
const STORAGE_KEY = "resume_drafts_v2";

type DraftSection = ResumeDraftRow["metadata"]["sections"][number];

interface LocalStorageDraft {
  id: string;
  name: string;
  templateId?: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
}

/**
 * Migrate all localStorage drafts to database
 *
 * Inputs: userId (required for database operations)
 * Outputs: Object with success count and errors
 *
 * Side effects:
 * - Creates drafts in database
 * - Sets migration flag in localStorage
 * - Optionally clears localStorage drafts (if clearAfter = true)
 */
export async function migrateLocalStorageDraftsToDatabase(
  userId: string,
  clearAfter = false
): Promise<{
  migrated: number;
  errors: Array<{ draftName: string; error: string }>;
}> {
  // Check if already migrated
  if (isMigrationComplete()) {
    console.log("Resume drafts already migrated to database");
    return { migrated: 0, errors: [] };
  }

  const errors: Array<{ draftName: string; error: string }> = [];
  let migrated = 0;

  try {
    // Load drafts from localStorage
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      console.log("No localStorage drafts found to migrate");
      markMigrationComplete();
      return { migrated: 0, errors: [] };
    }

    const parsed = JSON.parse(storedData);
    const drafts: LocalStorageDraft[] = parsed.drafts || [];

    console.log(`Found ${drafts.length} drafts to migrate from localStorage`);

    // Migrate each draft
    for (const draft of drafts) {
      try {
        await createResumeDraft(userId, {
          name: draft.name,
          template_id: draft.templateId || "classic",
          content: draft.content as ResumeDraftRow["content"],
          metadata: {
            sections: (draft.metadata.sections as DraftSection[]) || [],
            lastModified:
              (draft.metadata.lastModified as string) ||
              new Date().toISOString(),
            createdAt:
              (draft.metadata.createdAt as string) || new Date().toISOString(),
            jobId: draft.metadata.jobId as number | undefined,
            jobTitle: draft.metadata.jobTitle as string | undefined,
            jobCompany: draft.metadata.jobCompany as string | undefined,
          },
        });
        migrated++;
        console.log(`✓ Migrated draft: ${draft.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({
          draftName: draft.name,
          error: errorMessage,
        });
        console.error(`✗ Failed to migrate draft "${draft.name}":`, error);
      }
    }

    // Mark migration complete
    markMigrationComplete();

    // Optionally clear localStorage
    if (clearAfter && migrated > 0) {
      localStorage.removeItem(STORAGE_KEY);
      console.log("Cleared localStorage drafts after successful migration");
    }

    console.log(
      `Migration complete: ${migrated}/${drafts.length} drafts migrated successfully`
    );

    return { migrated, errors };
  } catch (error) {
    console.error("Error during migration:", error);
    return { migrated, errors };
  }
}

/**
 * Mark migration as complete in localStorage
 */
function markMigrationComplete() {
  localStorage.setItem(MIGRATION_FLAG_KEY, "true");
}

/**
 * Reset migration flag (for testing/debugging only)
 */
export function resetMigrationFlag() {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
  console.warn(
    "Migration flag reset - drafts will be migrated again on next load"
  );
}

/**
 * Get migration status and draft counts
 */
export function getMigrationStatus(): {
  isComplete: boolean;
  localDraftsCount: number;
} {
  const isComplete = isMigrationComplete();
  let localDraftsCount = 0;

  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      localDraftsCount = parsed.drafts?.length || 0;
    }
  } catch (error) {
    console.error("Error reading localStorage drafts:", error);
  }

  return {
    isComplete,
    localDraftsCount,
  };
}
