/**
 * useCoverLetterDrafts - Zustand Store
 *
 * WHAT: Centralized state management for Cover Letter Editor
 * WHY: Single source of truth with database persistence, tone/style settings, company research integration
 *
 * Features:
 * - Draft CRUD: create, load, update, delete (database-backed)
 * - Content editing: opening, body paragraphs, closing
 * - Tone/Style: change tone, length, company culture
 * - Template management: change template, apply formatting
 * - Company research: fetch and integrate company information
 * - Persistence: Supabase database with caching
 * - Loading states: track async operations
 *
 * State Shape:
 * - drafts: CoverLetterDraft[] (all user drafts from database)
 * - activeDraftId: string | null (currently editing)
 * - pendingAIContent: CoverLetterArtifactContent | null (generated but not applied)
 * - isLoading: boolean (async operation in progress)
 * - error: string | null (last error message)
 *
 * Usage:
 * const { drafts, createDraft, updateContent, changeTone, isLoading } = useCoverLetterDrafts();
 */

import { create } from "zustand";
import * as coverLetterDraftsApi from "../services/coverLetterDraftsApi";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type Tone = "formal" | "casual" | "enthusiastic" | "analytical";
export type Length = "brief" | "standard" | "detailed";
export type CompanyCulture = "corporate" | "startup" | "creative";

export interface CoverLetterContent {
  header: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    date?: string;
    companyName?: string;
    companyAddress?: string;
    hiringManager?: string;
  };
  opening: string; // Opening paragraph
  body: string[]; // Array of body paragraphs (2-3 typically)
  closing: string; // Closing paragraph
  signature?: string; // Name for signature
}

export interface CompanyResearch {
  companyName: string;
  size?: string; // e.g., "500-1000 employees"
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
  lastUpdated?: Date;
}

export interface CoverLetterDraft {
  id: string;
  name: string;
  templateId: string;

  // Job context
  jobId?: number;
  companyName?: string;
  jobTitle?: string;

  // Content
  content: CoverLetterContent;

  // Metadata
  metadata: {
    tone: Tone;
    length: Length;
    culture: CompanyCulture;
    industry?: string;
    lastModified: Date;
    createdAt: Date;
    wordCount?: number;
  };

  // Company research
  companyResearch?: CompanyResearch;
}

export interface CoverLetterArtifactContent {
  opening: string;
  body: string[];
  closing: string;
  tone: Tone;
  companyResearch?: Partial<CompanyResearch>;
}

interface CoverLetterDraftsStore {
  // State
  drafts: CoverLetterDraft[];
  activeDraftId: string | null;
  pendingAIContent: CoverLetterArtifactContent | null;
  isLoading: boolean;
  error: string | null;
  userId: string | null;

  // Initialization
  setUserId: (userId: string | null) => void;
  loadFromCacheSync: () => void;
  syncWithDatabase: () => Promise<void>;

  // Draft Management (async - database-backed)
  createDraft: (
    name: string,
    templateId?: string,
    jobId?: number,
    jobTitle?: string,
    companyName?: string
  ) => Promise<string | null>;
  loadDraft: (id: string) => Promise<void>;
  loadAllDrafts: () => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  renameDraft: (id: string, name: string) => Promise<void>;
  clearDraft: () => void;
  setJobLink: (
    jobId: number,
    jobTitle: string,
    companyName: string
  ) => Promise<void>;

  // AI Content Management
  setPendingAIContent: (content: CoverLetterArtifactContent | null) => void;
  clearPendingAIContent: () => void;
  applyPendingContent: () => Promise<void>;

  // Content Editing
  updateOpening: (opening: string) => Promise<void>;
  updateBody: (body: string[]) => Promise<void>;
  updateClosing: (closing: string) => Promise<void>;
  updateHeader: (
    header: Partial<CoverLetterContent["header"]>
  ) => Promise<void>;

  // Tone & Style
  changeTone: (tone: Tone) => Promise<void>;
  changeLength: (length: Length) => Promise<void>;
  changeCulture: (culture: CompanyCulture) => Promise<void>;

  // Template Management
  changeTemplate: (templateId: string) => Promise<void>;

  // Company Research
  fetchCompanyResearch: (companyName: string) => Promise<void>;
  updateCompanyResearch: (research: Partial<CompanyResearch>) => Promise<void>;

  // Utility
  getActiveDraft: () => CoverLetterDraft | null;
  getWordCount: () => number;
  clearError: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * CALCULATE WORD COUNT
 * Counts words in cover letter content
 */
function calculateWordCount(content: CoverLetterContent): number {
  const text = [content.opening, ...content.body, content.closing].join(" ");
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * SAVE TO CACHE (localStorage)
 * Cache drafts for instant loading
 */
function saveToCache(drafts: CoverLetterDraft[], activeDraftId: string | null) {
  try {
    localStorage.setItem(
      "sgt:cover_letter_drafts_cache",
      JSON.stringify({ drafts, activeDraftId, timestamp: Date.now() })
    );
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
}

/**
 * DEBOUNCED DATABASE UPDATE
 * Delays database writes to reduce server load during typing
 */
let debouncedUpdateTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 2000; // 2 seconds

function debouncedDatabaseUpdate(
  draftId: string,
  updates: coverLetterDraftsApi.UpdateDraftInput
) {
  if (debouncedUpdateTimer) {
    clearTimeout(debouncedUpdateTimer);
  }

  debouncedUpdateTimer = setTimeout(async () => {
    try {
      await coverLetterDraftsApi.updateDraft(draftId, updates);
      console.log("✅ Cover letter auto-saved to database");
    } catch (error) {
      console.error("❌ Failed to auto-save cover letter:", error);
    }
  }, DEBOUNCE_MS);
}

/**
 * LOAD FROM CACHE (localStorage)
 * Returns cached drafts or null
 */
function loadFromCache(): {
  drafts: CoverLetterDraft[];
  activeDraftId: string | null;
} | null {
  try {
    const cached = localStorage.getItem("sgt:cover_letter_drafts_cache");
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    // Convert date strings back to Date objects
    const drafts = parsed.drafts.map((d: CoverLetterDraft) => ({
      ...d,
      metadata: {
        ...d.metadata,
        lastModified: new Date(d.metadata.lastModified),
        createdAt: new Date(d.metadata.createdAt),
      },
      companyResearch: d.companyResearch
        ? {
            ...d.companyResearch,
            lastUpdated: d.companyResearch.lastUpdated
              ? new Date(d.companyResearch.lastUpdated)
              : undefined,
            recentNews: d.companyResearch.recentNews?.map((news) => ({
              ...news,
            })),
          }
        : undefined,
    }));

    return { drafts, activeDraftId: parsed.activeDraftId };
  } catch (error) {
    console.error("Error loading from cache:", error);
    return null;
  }
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useCoverLetterDrafts = create<CoverLetterDraftsStore>(
  (set, get) => ({
    // Initial State
    drafts: [],
    activeDraftId: null,
    pendingAIContent: null,
    isLoading: false,
    error: null,
    userId: null,

    // ========== Initialization ==========

    setUserId: (userId) => {
      set({ userId });
    },

    loadFromCacheSync: () => {
      const cached = loadFromCache();
      if (cached) {
        set({
          drafts: cached.drafts,
          activeDraftId: cached.activeDraftId,
        });
      }
    },

    syncWithDatabase: async () => {
      // FUTURE: Implement database sync when backend service is ready
      // - Fetch latest drafts from cover_letter_drafts table
      // - Compare with local state by updated_at timestamp
      // - Merge changes and update cache
      // Note: Current implementation uses localStorage only
    },

    // ========== Draft Management ==========

    createDraft: async (
      name,
      templateId = "formal",
      jobId,
      jobTitle,
      companyName
    ) => {
      const { userId } = get();
      if (!userId) {
        set({ error: "User not authenticated", isLoading: false });
        return null;
      }

      try {
        set({ isLoading: true, error: null });

        // Create draft in database
        const newDraft = await coverLetterDraftsApi.createDraft(
          {
            name,
            template_id: templateId,
            job_id: jobId,
            company_name: companyName,
            job_title: jobTitle,
          },
          userId
        );

        set((state) => ({
          drafts: [...state.drafts, newDraft],
          activeDraftId: newDraft.id,
          isLoading: false,
        }));

        // Update cache
        const { drafts, activeDraftId } = get();
        saveToCache(drafts, activeDraftId);

        return newDraft.id;
      } catch (error) {
        console.error("Error creating draft:", error);
        set({ error: "Failed to create draft", isLoading: false });
        return null;
      }
    },

    loadDraft: async (id) => {
      const { userId } = get();
      if (!userId) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }

      try {
        set({ isLoading: true, error: null });

        // Check if draft exists in local state
        const existingDraft = get().drafts.find((d) => d.id === id);

        if (existingDraft) {
          set({ activeDraftId: id, isLoading: false });

          // Update cache
          const { drafts, activeDraftId } = get();
          saveToCache(drafts, activeDraftId);
        } else {
          // Load from database
          const draft = await coverLetterDraftsApi.getDraft(id, userId);

          set((state) => ({
            drafts: [...state.drafts, draft],
            activeDraftId: id,
            isLoading: false,
          }));

          // Update cache
          const { drafts, activeDraftId } = get();
          saveToCache(drafts, activeDraftId);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        set({ error: "Failed to load draft", isLoading: false });
      }
    },

    loadAllDrafts: async () => {
      const { userId } = get();
      if (!userId) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }

      try {
        set({ isLoading: true, error: null });

        // Load all drafts from database
        const drafts = await coverLetterDraftsApi.listDrafts(userId);

        set({ drafts, isLoading: false });

        // Update cache
        const { activeDraftId } = get();
        saveToCache(drafts, activeDraftId);
      } catch (error) {
        console.error("Error loading drafts:", error);
        set({ error: "Failed to load drafts", isLoading: false });
      }
    },

    deleteDraft: async (id) => {
      try {
        set({ isLoading: true, error: null });

        // Delete from database
        await coverLetterDraftsApi.deleteDraft(id);

        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          activeDraftId:
            state.activeDraftId === id ? null : state.activeDraftId,
          isLoading: false,
        }));

        // Update cache
        const { drafts, activeDraftId } = get();
        saveToCache(drafts, activeDraftId);
      } catch (error) {
        console.error("Error deleting draft:", error);
        set({ error: "Failed to delete draft", isLoading: false });
      }
    },

    renameDraft: async (id, name) => {
      try {
        set({ isLoading: true, error: null });

        // Update database
        await coverLetterDraftsApi.updateDraft(id, { name });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id
              ? {
                  ...d,
                  name,
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // Update cache
        const { drafts, activeDraftId } = get();
        saveToCache(drafts, activeDraftId);
      } catch (error) {
        console.error("Error renaming draft:", error);
        set({ error: "Failed to rename draft", isLoading: false });
      }
    },

    clearDraft: () => {
      set({ activeDraftId: null });
    },

    setJobLink: async (jobId, jobTitle, companyName) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        // Update database
        await coverLetterDraftsApi.updateDraft(activeDraftId, {
          job_id: jobId,
          job_title: jobTitle,
          company_name: companyName,
        });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  jobId,
                  jobTitle,
                  companyName,
                  content: {
                    ...d.content,
                    header: {
                      ...d.content.header,
                      companyName,
                    },
                  },
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error setting job link:", error);
        set({ error: "Failed to link job", isLoading: false });
      }
    },

    // ========== AI Content Management ==========

    setPendingAIContent: (content) => {
      set({ pendingAIContent: content });
    },

    clearPendingAIContent: () => {
      set({ pendingAIContent: null });
    },

    applyPendingContent: async () => {
      const { pendingAIContent, activeDraftId } = get();
      if (!pendingAIContent || !activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        const updatedContent = {
          opening: pendingAIContent.opening,
          body: pendingAIContent.body,
          closing: pendingAIContent.closing,
        };

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  content: {
                    ...d.content,
                    ...updatedContent,
                  },
                  metadata: {
                    ...d.metadata,
                    tone: pendingAIContent.tone,
                    lastModified: new Date(),
                    wordCount: calculateWordCount({
                      ...d.content,
                      ...updatedContent,
                    }),
                  },
                  companyResearch:
                    pendingAIContent.companyResearch && d.companyResearch
                      ? ({
                          ...d.companyResearch,
                          ...pendingAIContent.companyResearch,
                          companyName: d.companyResearch.companyName, // Ensure required field
                        } as CompanyResearch)
                      : d.companyResearch,
                }
              : d
          ),
          pendingAIContent: null,
          isLoading: false,
        }));

        // Update database with AI-generated content
        await coverLetterDraftsApi.updateDraft(activeDraftId, {
          content: updatedContent,
          metadata: {
            tone: pendingAIContent.tone,
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error applying pending content:", error);
        set({ error: "Failed to apply content", isLoading: false });
      }
    },

    // ========== Content Editing ==========

    updateOpening: async (opening) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  content: { ...d.content, opening },
                  metadata: {
                    ...d.metadata,
                    lastModified: new Date(),
                    wordCount: calculateWordCount({ ...d.content, opening }),
                  },
                }
              : d
          ),
        }));

        // Debounced database update
        debouncedDatabaseUpdate(activeDraftId, {
          content: {
            opening,
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error updating opening:", error);
        set({ error: "Failed to update opening" });
      }
    },

    updateBody: async (body) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  content: { ...d.content, body },
                  metadata: {
                    ...d.metadata,
                    lastModified: new Date(),
                    wordCount: calculateWordCount({ ...d.content, body }),
                  },
                }
              : d
          ),
        }));

        // Debounced database update
        debouncedDatabaseUpdate(activeDraftId, {
          content: {
            body,
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error updating body:", error);
        set({ error: "Failed to update body" });
      }
    },

    updateClosing: async (closing) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  content: { ...d.content, closing },
                  metadata: {
                    ...d.metadata,
                    lastModified: new Date(),
                    wordCount: calculateWordCount({ ...d.content, closing }),
                  },
                }
              : d
          ),
        }));

        // Debounced database update
        debouncedDatabaseUpdate(activeDraftId, {
          content: {
            closing,
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error updating closing:", error);
        set({ error: "Failed to update closing" });
      }
    },

    updateHeader: async (header) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        const currentDraft = get().drafts.find((d) => d.id === activeDraftId);
        if (!currentDraft) return;

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  content: {
                    ...d.content,
                    header: { ...d.content.header, ...header },
                  },
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
        }));

        // Debounced database update
        debouncedDatabaseUpdate(activeDraftId, {
          content: {
            header: { ...currentDraft.content.header, ...header },
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error updating header:", error);
        set({ error: "Failed to update header" });
      }
    },

    // ========== Tone & Style ==========

    changeTone: async (tone) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  metadata: { ...d.metadata, tone, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // TODO: Trigger AI regeneration with new tone

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error changing tone:", error);
        set({ error: "Failed to change tone", isLoading: false });
      }
    },

    changeLength: async (length) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  metadata: { ...d.metadata, length, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // TODO: Trigger AI regeneration with new length

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error changing length:", error);
        set({ error: "Failed to change length", isLoading: false });
      }
    },

    changeCulture: async (culture) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  metadata: {
                    ...d.metadata,
                    culture,
                    lastModified: new Date(),
                  },
                }
              : d
          ),
          isLoading: false,
        }));

        // TODO: Trigger AI regeneration with new culture

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error changing culture:", error);
        set({ error: "Failed to change culture", isLoading: false });
      }
    },

    // ========== Template Management ==========

    changeTemplate: async (templateId) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  templateId,
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // TODO: Update database

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error changing template:", error);
        set({ error: "Failed to change template", isLoading: false });
      }
    },

    // ========== Company Research ==========

    fetchCompanyResearch: async (companyName) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        set({ isLoading: true, error: null });

        // TODO: Call backend API to fetch company research
        // const research = await fetchCompanyResearchAPI(companyName);

        // Mock research for now
        const mockResearch: CompanyResearch = {
          companyName,
          size: "500-1000 employees",
          industry: "Technology",
          mission: "To innovate and deliver exceptional solutions",
          values: ["Innovation", "Collaboration", "Customer Focus"],
          recentNews: [
            {
              title: "Company raises $50M Series B",
              date: "2025-11-01",
              summary: "Funding will accelerate product development",
              source: "TechCrunch",
            },
          ],
          lastUpdated: new Date(),
        };

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  companyResearch: mockResearch,
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
          isLoading: false,
        }));

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error fetching company research:", error);
        set({ error: "Failed to fetch company research", isLoading: false });
      }
    },

    updateCompanyResearch: async (research) => {
      const { activeDraftId } = get();
      if (!activeDraftId) return;

      try {
        const currentDraft = get().drafts.find((d) => d.id === activeDraftId);
        if (!currentDraft) return;

        const updatedResearch = {
          ...currentDraft.companyResearch,
          ...research,
        } as CompanyResearch;

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === activeDraftId
              ? {
                  ...d,
                  companyResearch: updatedResearch,
                  metadata: { ...d.metadata, lastModified: new Date() },
                }
              : d
          ),
        }));

        // Update database with company research (convert dates to strings)
        await coverLetterDraftsApi.updateDraft(activeDraftId, {
          company_research: {
            ...updatedResearch,
            lastUpdated: updatedResearch.lastUpdated?.toISOString(),
          },
        });

        // Update cache
        const { drafts, activeDraftId: activeId } = get();
        saveToCache(drafts, activeId);
      } catch (error) {
        console.error("Error updating company research:", error);
        set({ error: "Failed to update company research" });
      }
    },

    // ========== Utility ==========

    getActiveDraft: () => {
      const { drafts, activeDraftId } = get();
      return drafts.find((d) => d.id === activeDraftId) || null;
    },

    getWordCount: () => {
      const draft = get().getActiveDraft();
      return draft?.metadata.wordCount || 0;
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
