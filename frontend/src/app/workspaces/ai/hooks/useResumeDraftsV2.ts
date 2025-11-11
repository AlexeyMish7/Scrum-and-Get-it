/**
 * useResumeDraftsV2 - Zustand Store
 *
 * WHAT: Centralized state management for Resume Editor V2
 * WHY: Single source of truth with undo/redo, database persistence, and clear action APIs
 *
 * Features:
 * - Draft CRUD: create, load, update, delete (database-backed)
 * - Apply actions: applySummary, applySkills, applyExperience, applyAll
 * - Edit actions: editSection with manual state tracking
 * - Undo/Redo: 10-level history stack (in-memory only)
 * - Persistence: Supabase database with optimistic locking
 * - Pending AI content: temporary storage before apply
 * - Loading states: track async operations
 * - Migration: automatic localStorage → database migration on first load
 *
 * State Shape:
 * - drafts: ResumeDraft[] (all user drafts from database)
 * - activeDraftId: string | null (currently editing)
 * - history: HistoryEntry[] (undo/redo stack - in memory)
 * - pendingAIContent: ResumeArtifactContent | null (generated but not applied)
 * - isLoading: boolean (async operation in progress)
 * - error: string | null (last error message)
 *
 * Usage:
 * const { draft, applySummary, applyAll, undo, redo, isLoading } = useResumeDraftsV2();
 */

import { create } from "zustand";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import {
  listResumeDrafts,
  getResumeDraft,
  createResumeDraft,
  updateResumeDraft,
  deleteResumeDraft,
  type ResumeDraftRow,
} from "@shared/services/resumeDraftsService";
import {
  loadFromCache,
  saveToCache,
  clearCache,
} from "@shared/services/resumeDraftsCache";

// TODO: Add these imports back when implementing initialization logic:
// import { useAuth } from "@shared/context/AuthContext";
// import {
//   migrateLocalStorageDraftsToDatabase,
//   isMigrationComplete,
// } from "@shared/services/resumeDraftsMigration";

// ============================================================================
// Types & Interfaces
// ============================================================================

type SectionState = "empty" | "applied" | "from-profile" | "edited";

interface DraftSection {
  type: "summary" | "skills" | "experience" | "education" | "projects";
  visible: boolean;
  state: SectionState;
  lastUpdated?: Date;
}

/**
 * CachedDraftSection - Type for draft sections loaded from cache
 * (dates are stored as ISO strings in localStorage/cache)
 */
interface CachedDraftSection {
  type: "summary" | "skills" | "experience" | "education" | "projects";
  visible: boolean;
  state: SectionState;
  lastUpdated?: string; // ISO date string in cache
}

export interface ResumeDraft {
  id: string;
  name: string;
  templateId?: string;
  content: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
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
    sections: DraftSection[];
    lastModified: Date;
    createdAt: Date;
    jobId?: number; // Linked job application ID
    jobTitle?: string; // Cached job title for display
    jobCompany?: string; // Cached company name for display
  };
}

interface HistoryEntry {
  draft: ResumeDraft;
  timestamp: Date;
  action: string;
}

interface ResumeDraftsStore {
  // State
  drafts: ResumeDraft[];
  activeDraftId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  pendingAIContent: ResumeArtifactContent | null;
  appliedSections: Set<string>;
  isLoading: boolean; // Async operation in progress
  error: string | null; // Last error message
  userId: string | null; // Authenticated user ID (required for database operations)

  // Initialization
  setUserId: (userId: string | null) => void;
  loadFromCacheSync: () => void; // Instant load from localStorage cache
  syncWithDatabase: () => Promise<void>; // Background sync with database

  // Draft Management (async - database-backed)
  createDraft: (
    name: string,
    templateId?: string,
    jobId?: number,
    jobTitle?: string,
    jobCompany?: string,
    sourceArtifactId?: string | null
  ) => Promise<string | null>;
  loadDraft: (id: string) => Promise<void>;
  deselectDraft: () => void; // Deselect active draft (return to library view)
  loadAllDrafts: () => Promise<void>; // Load user's drafts from database
  deleteDraft: (id: string) => Promise<void>;
  renameDraft: (id: string, name: string) => Promise<void>;
  clearDraft: () => void; // Clear current draft back to empty (in-memory only)
  setJobLink: (
    jobId: number,
    jobTitle: string,
    jobCompany: string
  ) => Promise<void>; // Link current draft to a job

  // AI Content Management
  setPendingAIContent: (content: ResumeArtifactContent | null) => void;
  clearPendingAIContent: () => void;

  // Apply Actions (from AI) - async to save to database
  applySummary: () => Promise<void>;
  applySkills: () => Promise<void>;
  applyExperience: () => Promise<void>;
  applyAll: () => Promise<void>;

  // Edit Actions (manual) - async to save to database
  editSection: (section: string, content: unknown) => Promise<void>;
  toggleSectionVisibility: (section: string, visible: boolean) => Promise<void>;
  reorderSections: (newOrder: string[]) => Promise<void>;
  changeTemplate: (templateId: string) => Promise<void>;

  // History Management (in-memory only, no database)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Utilities
  getActiveDraft: () => ResumeDraft | null;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_HISTORY = 10;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert database ResumeDraftRow to in-memory ResumeDraft
 */
const dbRowToDraft = (row: ResumeDraftRow): ResumeDraft => ({
  id: row.id,
  name: row.name,
  templateId: row.template_id,
  content: row.content as ResumeDraft["content"],
  metadata: {
    sections: (row.metadata.sections as DraftSection[]).map((s) => ({
      ...s,
      lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : undefined,
    })),
    lastModified: new Date(row.metadata.lastModified),
    createdAt: new Date(row.metadata.createdAt),
    jobId: row.metadata.jobId,
    jobTitle: row.metadata.jobTitle,
    jobCompany: row.metadata.jobCompany,
  },
});

const updateSectionState = (
  sections: DraftSection[],
  sectionType: string,
  state: SectionState
): DraftSection[] => {
  return sections.map((section) =>
    section.type === sectionType
      ? { ...section, state, lastUpdated: new Date() }
      : section
  );
};

/**
 * Helper to update localStorage cache after state changes
 * Call this after any operation that modifies drafts or activeDraftId
 */
const syncCacheAfterUpdate = (
  userId: string | null,
  drafts: ResumeDraft[],
  activeDraftId: string | null
) => {
  if (userId) {
    saveToCache(userId, drafts, activeDraftId);
  }
};

// ============================================================================
// Zustand Store
// ============================================================================

export const useResumeDraftsV2 = create<ResumeDraftsStore>((set, get) => ({
  // Initial State
  drafts: [],
  activeDraftId: null,
  history: [],
  historyIndex: -1,
  pendingAIContent: null,
  appliedSections: new Set<string>(),
  isLoading: false,
  error: null,
  userId: null,

  // Initialization
  setUserId: (userId: string | null) => {
    set({ userId });

    // Clear cache when user changes
    if (userId) {
      // Cache will be loaded by loadFromCacheSync
    } else {
      clearCache();
    }
  },

  // Load drafts from localStorage cache (instant, synchronous)
  loadFromCacheSync: () => {
    const userId = get().userId;
    if (!userId) return;

    const cached = loadFromCache(userId);
    if (cached && cached.drafts.length > 0) {
      // Convert cached data back to ResumeDraft objects with proper date conversion
      // Note: cached.drafts is unknown[] (to avoid circular deps in cache service)
      // so we safely cast each draft and its sections
      const drafts = cached.drafts.map((draft) => {
        const draftObj = draft as ResumeDraft & {
          metadata: {
            sections: CachedDraftSection[];
            lastModified: string;
            createdAt: string;
          };
        };
        return {
          ...draftObj,
          metadata: {
            ...draftObj.metadata,
            sections: draftObj.metadata.sections.map((s) => ({
              ...s,
              lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : undefined,
            })),
            lastModified: new Date(draftObj.metadata.lastModified),
            createdAt: new Date(draftObj.metadata.createdAt),
          },
        } as ResumeDraft;
      });

      set({
        drafts,
        // Don't restore activeDraftId from cache - let user choose from starter
        // activeDraftId: cached.activeDraftId,
      });

      // Successfully loaded from cache (instant)
    }
  },

  // Sync with database in background (updates cache if data changed)
  syncWithDatabase: async (): Promise<void> => {
    const userId = get().userId;
    if (!userId) return;

    try {
      console.log("🔄 Syncing with database...");

      const result = await listResumeDrafts(userId);

      if (result.error || !result.data) {
        console.error("Failed to sync with database:", result.error?.message);
        return;
      }

      const dbDrafts = result.data.map(dbRowToDraft);

      // Update store with fresh data
      // Keep the current activeDraftId (even if null) - don't auto-select
      const currentActiveDraftId = get().activeDraftId;

      set({
        drafts: dbDrafts,
        activeDraftId: currentActiveDraftId,
      });

      // Update cache with fresh data
      saveToCache(userId, dbDrafts, currentActiveDraftId);

      console.log(`✓ Synced ${dbDrafts.length} drafts from database`);
    } catch (error) {
      console.error("Database sync error:", error);
    }
  },

  // Draft Management (async with database)
  createDraft: async (
    name: string,
    templateId?: string,
    jobId?: number,
    jobTitle?: string,
    jobCompany?: string,
    sourceArtifactId?: string | null
  ): Promise<string | null> => {
    set({ isLoading: true, error: null });

    try {
      // Get userId from auth - we'll need to pass this in from components
      // For now, we'll use a workaround by storing it in the store
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await createResumeDraft(userId, {
        name,
        template_id: templateId || "classic",
        source_artifact_id: sourceArtifactId,
        content: {},
        metadata: {
          sections: [
            { type: "summary", visible: true, state: "empty" },
            { type: "skills", visible: true, state: "empty" },
            { type: "experience", visible: true, state: "empty" },
            { type: "education", visible: true, state: "empty" },
            { type: "projects", visible: true, state: "empty" },
          ],
          lastModified: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          jobId,
          jobTitle,
          jobCompany,
        },
        jobId,
        jobTitle,
        jobCompany,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to create draft",
        });
        return null;
      }

      const newDraft = dbRowToDraft(result.data);

      set((state) => {
        const newState = {
          drafts: [...state.drafts, newDraft],
          activeDraftId: newDraft.id,
          history: [
            { draft: newDraft, timestamp: new Date(), action: "create" },
          ],
          historyIndex: 0,
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, newState.activeDraftId);

        return newState;
      });

      return newDraft.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  loadAllDrafts: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await listResumeDrafts(userId);

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to load drafts",
        });
        return;
      }

      const drafts = result.data.map(dbRowToDraft);

      // Set the most recent draft as active if we have drafts and no active draft
      const currentActiveDraftId = get().activeDraftId;
      const activeDraftId =
        currentActiveDraftId || (drafts.length > 0 ? drafts[0].id : null);

      set({
        drafts,
        activeDraftId,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  loadDraft: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await getResumeDraft(userId, id);

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to load draft",
        });
        return;
      }

      const draft = dbRowToDraft(result.data);

      set({
        activeDraftId: id,
        history: [{ draft, timestamp: new Date(), action: "load" }],
        historyIndex: 0,
        appliedSections: new Set<string>(),
        pendingAIContent: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  // Deselect the active draft and return to library view
  deselectDraft: () => {
    const { userId, drafts, activeDraftId } = get();

    // Save current state to cache before deselecting
    if (userId && activeDraftId) {
      saveToCache(userId, drafts, null); // null = no active draft
    }

    set({
      activeDraftId: null,
      history: [],
      historyIndex: -1,
      appliedSections: new Set<string>(),
      pendingAIContent: null,
    });

    console.log("↩️ Deselected active draft - returning to library");
  },

  deleteDraft: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await deleteResumeDraft(userId, id);

      if (result.error) {
        set({ isLoading: false, error: result.error.message });
        return;
      }

      set((state) => {
        const newState = {
          drafts: state.drafts.filter((d) => d.id !== id),
          activeDraftId:
            state.activeDraftId === id ? null : state.activeDraftId,
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, newState.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  renameDraft: async (id: string, name: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await updateResumeDraft(userId, id, { name });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to rename draft",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newState = {
          drafts: state.drafts.map((d) => (d.id === id ? updatedDraft : d)),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  clearDraft: () => {
    const { activeDraftId, drafts } = get();
    if (!activeDraftId) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    // Reset draft to empty state (in-memory only - no database save yet)
    // User can save later with apply/edit actions
    const clearedDraft: ResumeDraft = {
      ...draft,
      content: {},
      metadata: {
        ...draft.metadata,
        sections: draft.metadata.sections.map((s) => ({
          ...s,
          state: "empty" as const,
        })),
        lastModified: new Date(),
      },
    };

    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === activeDraftId ? clearedDraft : d
      ),
      history: [
        { draft: clearedDraft, timestamp: new Date(), action: "clear" },
      ],
      historyIndex: 0,
      pendingAIContent: null,
      appliedSections: new Set<string>(),
    }));
  },

  setJobLink: async (
    jobId: number,
    jobTitle: string,
    jobCompany: string
  ): Promise<void> => {
    const { activeDraftId } = get();
    if (!activeDraftId) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const result = await updateResumeDraft(userId, activeDraftId, {
        metadata: {
          jobId,
          jobTitle,
          jobCompany,
        },
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to update job link",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  // AI Content Management
  setPendingAIContent: (content: ResumeArtifactContent | null) => {
    set({
      pendingAIContent: content,
      appliedSections: new Set<string>(),
    });
  },

  clearPendingAIContent: () => {
    set({
      pendingAIContent: null,
      appliedSections: new Set<string>(),
    });
  },

  // Apply Actions (async - save to database)
  applySummary: async (): Promise<void> => {
    const { activeDraftId, pendingAIContent, drafts } = get();
    if (!activeDraftId || !pendingAIContent?.summary) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedContent = {
        ...draft.content,
        summary: pendingAIContent.summary,
      };

      const updatedMetadata = {
        sections: updateSectionState(
          draft.metadata.sections,
          "summary",
          "applied"
        ).map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        content: updatedContent,
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to apply summary",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          draft: updatedDraft,
          timestamp: new Date(),
          action: "apply-summary",
        });

        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          appliedSections: new Set([...state.appliedSections, "summary"]),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  applySkills: async (): Promise<void> => {
    const { activeDraftId, pendingAIContent, drafts } = get();
    if (!activeDraftId || !pendingAIContent?.ordered_skills) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedContent = {
        ...draft.content,
        skills: pendingAIContent.ordered_skills,
      };

      const updatedMetadata = {
        sections: updateSectionState(
          draft.metadata.sections,
          "skills",
          "applied"
        ).map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        content: updatedContent,
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to apply skills",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          draft: updatedDraft,
          timestamp: new Date(),
          action: "apply-skills",
        });

        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          appliedSections: new Set([...state.appliedSections, "skills"]),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  applyExperience: async (): Promise<void> => {
    const { activeDraftId, pendingAIContent, drafts } = get();
    if (!activeDraftId || !pendingAIContent?.sections?.experience) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedContent = {
        ...draft.content,
        experience: pendingAIContent.sections.experience,
      };

      const updatedMetadata = {
        sections: updateSectionState(
          draft.metadata.sections,
          "experience",
          "applied"
        ).map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        content: updatedContent,
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to apply experience",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          draft: updatedDraft,
          timestamp: new Date(),
          action: "apply-experience",
        });

        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          appliedSections: new Set([...state.appliedSections, "experience"]),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  applyAll: async (): Promise<void> => {
    const { activeDraftId, pendingAIContent, drafts } = get();
    if (!activeDraftId || !pendingAIContent) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedContent = {
        ...draft.content,
        summary: pendingAIContent.summary || draft.content.summary,
        skills: pendingAIContent.ordered_skills || draft.content.skills,
        experience:
          pendingAIContent.sections?.experience || draft.content.experience,
      };

      const updatedMetadata = {
        sections: draft.metadata.sections.map((section) => {
          if (["summary", "skills", "experience"].includes(section.type)) {
            return {
              ...section,
              state: "applied" as SectionState,
              lastUpdated: new Date().toISOString(),
            };
          }
          return {
            ...section,
            lastUpdated: section.lastUpdated?.toISOString(),
          };
        }),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        content: updatedContent,
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to apply all",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          draft: updatedDraft,
          timestamp: new Date(),
          action: "apply-all",
        });

        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          appliedSections: new Set(["summary", "skills", "experience"]),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  // Edit Actions (async - save to database)
  editSection: async (section: string, content: unknown): Promise<void> => {
    const { activeDraftId, drafts } = get();
    if (!activeDraftId) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedContent = {
        ...draft.content,
        [section]: content,
      };

      const updatedMetadata = {
        sections: updateSectionState(
          draft.metadata.sections,
          section,
          "edited"
        ).map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        content: updatedContent,
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to edit section",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
          draft: updatedDraft,
          timestamp: new Date(),
          action: `edit-${section}`,
        });

        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  toggleSectionVisibility: async (
    section: string,
    visible: boolean
  ): Promise<void> => {
    const { activeDraftId, drafts } = get();
    if (!activeDraftId) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const updatedMetadata = {
        sections: draft.metadata.sections.map((s) => ({
          ...s,
          visible: s.type === section ? visible : s.visible,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to toggle visibility",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
    }
  },

  reorderSections: async (newOrder: string[]): Promise<void> => {
    const { activeDraftId, drafts } = get();
    if (!activeDraftId) return;

    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Reordering sections:", {
        newOrder,
        currentOrder: draft.metadata.sections.map((s) => s.type),
      });

      // Validate that newOrder contains all section types
      const currentSectionTypes = draft.metadata.sections.map((s) => s.type);
      const missingTypes = currentSectionTypes.filter(
        (type) => !newOrder.includes(type)
      );

      if (missingTypes.length > 0) {
        console.warn("Missing section types in newOrder:", missingTypes);
        throw new Error(
          `Missing sections in reorder: ${missingTypes.join(", ")}`
        );
      }

      // Reorder sections based on newOrder array
      const reorderedSections = newOrder.map((sectionType) => {
        const section = draft.metadata.sections.find(
          (s) => s.type === sectionType
        );
        if (!section) {
          throw new Error(`Section ${sectionType} not found`);
        }
        return section;
      });

      const updatedMetadata = {
        sections: reorderedSections.map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated?.toISOString(),
        })),
        lastModified: new Date().toISOString(),
        createdAt: draft.metadata.createdAt.toISOString(),
        jobId: draft.metadata.jobId,
        jobTitle: draft.metadata.jobTitle,
        jobCompany: draft.metadata.jobCompany,
      };

      const result = await updateResumeDraft(userId, activeDraftId, {
        metadata: updatedMetadata,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to reorder sections",
        });
        return;
      }

      const updatedDraft = dbRowToDraft(result.data);

      set((state) => {
        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          isLoading: false,
        };

        // Update cache
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);

        return newState;
      });

      console.log("✓ Sections reordered successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
      console.error("Reorder sections error:", error);
    }
  },

  /**
   * Change template for active draft
   * Updates template_id in database and local state
   */
  changeTemplate: async (templateId: string): Promise<void> => {
    const { activeDraftId, drafts } = get();
    if (!activeDraftId) return;
    const draft = drafts.find((d) => d.id === activeDraftId);
    if (!draft) return;

    set({ isLoading: true, error: null });

    try {
      const userId = get().userId;
      if (!userId) throw new Error("User not authenticated");

      console.log("Changing template:", { draftId: activeDraftId, templateId });

      // Update database
      const result = await updateResumeDraft(userId, activeDraftId, {
        template_id: templateId,
      });

      if (result.error || !result.data) {
        set({
          isLoading: false,
          error: result.error?.message || "Failed to change template",
        });
        return;
      }

      // Update Zustand state and sync cache
      const updatedDraft = dbRowToDraft(result.data);
      set((state) => {
        const newState = {
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId ? updatedDraft : d
          ),
          isLoading: false,
        };
        syncCacheAfterUpdate(userId, newState.drafts, state.activeDraftId);
        return newState;
      });

      console.log("✓ Template changed successfully to:", templateId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ isLoading: false, error: errorMessage });
      console.error("Change template error:", error);
    }
  },

  // History Management
  undo: () => {
    const { historyIndex, history, activeDraftId } = get();
    if (historyIndex <= 0) return;

    const previousIndex = historyIndex - 1;
    const previousDraft = history[previousIndex].draft;

    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === activeDraftId ? previousDraft : d
      ),
      historyIndex: previousIndex,
    }));

    // Note: Undo is in-memory only, no database save
  },

  redo: () => {
    const { historyIndex, history, activeDraftId } = get();
    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextDraft = history[nextIndex].draft;

    set((state) => ({
      drafts: state.drafts.map((d) => (d.id === activeDraftId ? nextDraft : d)),
      historyIndex: nextIndex,
    }));

    // Note: Redo is in-memory only, no database save
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // Utilities
  getActiveDraft: () => {
    const { drafts, activeDraftId } = get();
    return drafts.find((d) => d.id === activeDraftId) || null;
  },
}));

// TODO: Add initialization logic
// - Load drafts from database on first mount
// - Trigger localStorage migration if needed
// - Initialize userId from AuthContext
