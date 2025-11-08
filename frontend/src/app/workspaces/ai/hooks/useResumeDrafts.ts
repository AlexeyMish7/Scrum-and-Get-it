/**
 * useResumeDrafts
 * Lightweight localStorage-backed resume draft manager.
 * Centralizes reading/writing the `sgt:resumes` collection created by TemplateManager
 * and provides helpers to apply AI artifact content (skills ordering, experience bullets, summary).
 *
 * Data Shape (persisted):
 * resumes: Array<{
 *   id: string;
 *   name: string;
 *   templateId: string;
 *   createdAt: string;
 *   owner: string | null;
 *   content: {
 *     summary?: string;
 *     skills?: string[];
 *     experience?: Array<{ role: string; company?: string; dates?: string; bullets: string[] }>;
 *   }
 * }>
 * Active resume id stored separately at key `sgt:resumes_active`.
 *
 * Error Modes: Fallback to empty arrays when JSON parse fails.
 */
import * as React from "react";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";

const RESUMES_KEY = "sgt:resumes";
const ACTIVE_KEY = "sgt:resumes_active";

export interface ResumeDraftContentExperienceItem {
  role: string;
  company?: string;
  dates?: string;
  bullets: string[];
}

export interface ResumeDraftRecord {
  id: string;
  name: string;
  templateId?: string;
  createdAt: string;
  owner: string | null;
  /**
   * Version lineage metadata for UC-052. When a draft is duplicated, we store sourceVersionId.
   * lastAppliedJobId optionally records the most recent job used for tailoring this version.
   */
  sourceVersionId?: string;
  lastAppliedJobId?: number;
  content: {
    summary?: string;
    skills?: string[];
    experience?: ResumeDraftContentExperienceItem[];
    /** Keys of sections that should be visible in preview/export */
    visibleSections?: string[];
    /** Canonical ordering of sections in preview/export */
    sectionOrder?: string[];
  };
}

function safeLoad(): ResumeDraftRecord[] {
  try {
    const raw = localStorage.getItem(RESUMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persist(list: ResumeDraftRecord[]) {
  try {
    localStorage.setItem(RESUMES_KEY, JSON.stringify(list));
  } catch (e) {
    // Silent persistence error; caller can decide to surface if desired.
    console.warn("Failed to persist resumes", e);
  }
}

export interface UseResumeDraftsApi {
  resumes: ResumeDraftRecord[];
  activeId: string | null;
  active: ResumeDraftRecord | null;
  setActive: (id: string | null) => void;
  refresh: () => void; // reload from storage
  /** Delete a draft by id; if active, selects the next available or clears active. */
  deleteDraft: (id: string) => void;
  /** Restore a previously deleted draft (used for Undo). */
  restoreDraft: (draft: ResumeDraftRecord) => void;
  updateContent: (
    id: string,
    updater: (c: ResumeDraftRecord["content"]) => ResumeDraftRecord["content"]
  ) => void;
  applyOrderedSkills: (ordered: string[]) => void;
  appendExperienceFromAI: (
    exp: NonNullable<ResumeArtifactContent["sections"]>["experience"]
  ) => void;
  applySummary: (summary?: string) => void;
  /** Replace list of visible sections for active draft */
  setVisibleSections: (sections: string[]) => void;
  /** Replace section order for active draft */
  setSectionOrder: (order: string[]) => void;
  /** Apply a named preset for visibility and ordering */
  applyPreset: (preset: "chronological" | "functional" | "hybrid") => void;
  /** Duplicate the active draft into a new version with lineage metadata */
  duplicateActive: (newName?: string) => string | null;
  /** Update lastAppliedJobId to track which job influenced tailoring */
  setLastAppliedJob: (jobId: number) => void;
  /** Compute a diff summary between two draft IDs (summary/skills/experience bullets) */
  diffDrafts: (aId: string, bId: string) => ResumeDraftDiff | null;
  /** Merge selected parts from source into target draft */
  mergeDraftSections: (
    sourceId: string,
    targetId: string,
    opts: MergeOptions
  ) => void;
  /** Simple heuristic stats for validation (length, bullet counts) */
  computeStats: () => DraftStats | null;
}

/** Diff representation: arrays of added/removed items for skills & experience bullets */
export interface ResumeDraftDiff {
  summaryChanged: boolean;
  skillsAdded: string[];
  skillsRemoved: string[];
  experienceAdded: ResumeDraftContentExperienceItem[];
  experienceModified: Array<{
    role: string;
    addedBullets: string[];
    removedBullets: string[];
  }>;
  experienceRemoved: ResumeDraftContentExperienceItem[];
}

export interface MergeOptions {
  applySummary?: boolean;
  applySkillsAdded?: boolean;
  removeSkillsNotInSource?: boolean;
  mergeExperienceBullets?: boolean; // merge bullets per matching role/company
  addMissingExperienceEntries?: boolean;
}

export interface DraftStats {
  totalBullets: number;
  totalExperienceEntries: number;
  summaryLength: number; // chars
  skillsCount: number;
  estimatedPageLength: number; // naive lines estimate
}

/**
 * Hook Implementation
 */
export function useResumeDrafts(): UseResumeDraftsApi {
  const [resumes, setResumes] = React.useState<ResumeDraftRecord[]>(() =>
    safeLoad()
  );
  const [activeId, setActiveId] = React.useState<string | null>(() =>
    localStorage.getItem(ACTIVE_KEY)
  );

  // Keep in sync with storage updates from elsewhere (basic storage event listener)
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === RESUMES_KEY) {
        setResumes(safeLoad());
      }
      if (e.key === ACTIVE_KEY) {
        setActiveId(localStorage.getItem(ACTIVE_KEY));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const active = React.useMemo(
    () => resumes.find((r) => r.id === activeId) || null,
    [resumes, activeId]
  );

  const setActive = React.useCallback((id: string | null) => {
    setActiveId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const refresh = React.useCallback(() => {
    setResumes(safeLoad());
    setActiveId(localStorage.getItem(ACTIVE_KEY));
  }, []);

  const updateContent = React.useCallback(
    (
      id: string,
      updater: (c: ResumeDraftRecord["content"]) => ResumeDraftRecord["content"]
    ) => {
      setResumes((prev) => {
        const next = prev.map((r) =>
          r.id === id ? { ...r, content: updater(r.content || {}) } : r
        );
        persist(next);
        return next;
      });
    },
    []
  );

  const deleteDraft = React.useCallback((id: string) => {
    setResumes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persist(next);
      // Adjust active if needed
      setActiveId((current) => {
        if (current === id) {
          const fallback = next[0]?.id ?? null;
          if (fallback) localStorage.setItem(ACTIVE_KEY, fallback);
          else localStorage.removeItem(ACTIVE_KEY);
          return fallback;
        }
        return current;
      });
      return next;
    });
  }, []);

  const restoreDraft = React.useCallback((draft: ResumeDraftRecord) => {
    setResumes((prev) => {
      // Avoid duplicate IDs if already restored
      if (prev.some((r) => r.id === draft.id)) return prev;
      const next = [draft, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const computeStats = React.useCallback((): DraftStats | null => {
    if (!active) return null;
    const summaryLength = (active.content.summary || "").length;
    const skillsCount = (active.content.skills || []).length;
    const exp = active.content.experience || [];
    let totalBullets = 0;
    for (const e of exp) totalBullets += e.bullets.length;
    const totalExperienceEntries = exp.length;
    // naive page length estimate: summary lines + skills lines (~1) + experience bullets lines
    const estimatedPageLength =
      Math.ceil(summaryLength / 90) +
      (skillsCount ? 1 : 0) +
      totalBullets +
      totalExperienceEntries; // very rough heuristic
    return {
      totalBullets,
      totalExperienceEntries,
      summaryLength,
      skillsCount,
      estimatedPageLength,
    };
  }, [active]);
  /** Apply ordered skills list to active draft; missing skills appended at end; preserves case. */
  const applyOrderedSkills = React.useCallback(
    (ordered: string[]) => {
      if (!active) return;
      updateContent(active.id, (c) => {
        const existing = c.skills || [];
        const lowerExisting = new Map(
          existing.map((s) => [s.toLowerCase(), s])
        );
        const newOrdered: string[] = [];
        for (const s of ordered) {
          const match = lowerExisting.get(s.toLowerCase()) || s;
          if (!newOrdered.includes(match)) newOrdered.push(match);
        }
        // Append any existing not already included
        for (const s of existing) {
          if (!newOrdered.includes(s)) newOrdered.push(s);
        }
        return { ...c, skills: newOrdered };
      });
    },
    [active, updateContent]
  );

  /** Merge AI experience bullets. Matches by role+company when possible; otherwise appends entries. */
  const appendExperienceFromAI = React.useCallback(
    (exp: NonNullable<ResumeArtifactContent["sections"]>["experience"]) => {
      if (!active || !exp || !exp.length) return;
      updateContent(active.id, (c) => {
        const current = c.experience || [];
        const next = [...current];
        for (const aiItem of exp) {
          const keyRole = aiItem.role?.toLowerCase();
          const keyCompany = aiItem.company?.toLowerCase();
          const existingIdx = next.findIndex(
            (e) =>
              e.role.toLowerCase() === keyRole &&
              (aiItem.company ? e.company?.toLowerCase() === keyCompany : true)
          );
          if (existingIdx >= 0) {
            // Merge bullets (avoid exact duplicates) and update dates if missing
            const existing = next[existingIdx];
            const mergedBullets = [...existing.bullets];
            for (const b of aiItem.bullets) {
              if (!mergedBullets.some((m) => m.trim() === b.trim()))
                mergedBullets.push(b);
            }
            next[existingIdx] = {
              ...existing,
              dates: existing.dates || aiItem.dates,
              bullets: mergedBullets,
            };
          } else {
            next.push({
              role: aiItem.role ?? "Experience",
              company: aiItem.company,
              dates: aiItem.dates,
              bullets: [...aiItem.bullets],
            });
          }
        }
        return { ...c, experience: next };
      });
    },
    [active, updateContent]
  );

  /** Apply AI summary if present */
  const applySummary = React.useCallback(
    (summary?: string) => {
      if (!active || !summary) return;
      updateContent(active.id, (c) => ({ ...c, summary }));
    },
    [active, updateContent]
  );

  const duplicateActive = React.useCallback(
    (newName?: string) => {
      if (!active) return null;
      const clone: ResumeDraftRecord = {
        ...active,
        id: `resume-${Math.random().toString(36).slice(2, 9)}`,
        name: newName || `${active.name} (copy)`,
        createdAt: new Date().toISOString(),
        sourceVersionId: active.id,
      };
      setResumes((prev) => {
        const next = [clone, ...prev];
        persist(next);
        return next;
      });
      return clone.id;
    },
    [active]
  );

  const setLastAppliedJob = React.useCallback(
    (jobId: number) => {
      if (!active) return;
      setResumes((prev) => {
        const next = prev.map((r) =>
          r.id === active.id ? { ...r, lastAppliedJobId: jobId } : r
        );
        persist(next);
        return next;
      });
    },
    [active]
  );

  const diffDrafts = React.useCallback(
    (aId: string, bId: string): ResumeDraftDiff | null => {
      const a = resumes.find((r) => r.id === aId);
      const b = resumes.find((r) => r.id === bId);
      if (!a || !b) return null;
      const aSkills = a.content.skills || [];
      const bSkills = b.content.skills || [];
      const skillsAdded = bSkills.filter((s) => !aSkills.includes(s));
      const skillsRemoved = aSkills.filter((s) => !bSkills.includes(s));
      const aExp = a.content.experience || [];
      const bExp = b.content.experience || [];
      const experienceAdded = bExp.filter(
        (be) =>
          !aExp.some(
            (ae) =>
              ae.role.toLowerCase() === be.role.toLowerCase() &&
              (be.company
                ? ae.company?.toLowerCase() === be.company.toLowerCase()
                : true)
          )
      );
      const experienceRemoved = aExp.filter(
        (ae) =>
          !bExp.some(
            (be) =>
              be.role.toLowerCase() === ae.role.toLowerCase() &&
              (ae.company
                ? be.company?.toLowerCase() === ae.company.toLowerCase()
                : true)
          )
      );
      const experienceModified: Array<{
        role: string;
        addedBullets: string[];
        removedBullets: string[];
      }> = [];
      for (const ae of aExp) {
        const match = bExp.find(
          (be) =>
            be.role.toLowerCase() === ae.role.toLowerCase() &&
            (ae.company
              ? be.company?.toLowerCase() === ae.company.toLowerCase()
              : true)
        );
        if (!match) continue;
        const addedBullets = match.bullets.filter(
          (b) => !ae.bullets.some((x) => x.trim() === b.trim())
        );
        const removedBullets = ae.bullets.filter(
          (b) => !match.bullets.some((x) => x.trim() === b.trim())
        );
        if (addedBullets.length || removedBullets.length) {
          experienceModified.push({
            role: ae.role,
            addedBullets,
            removedBullets,
          });
        }
      }
      return {
        summaryChanged: (a.content.summary || "") !== (b.content.summary || ""),
        skillsAdded,
        skillsRemoved,
        experienceAdded,
        experienceModified,
        experienceRemoved,
      };
    },
    [resumes]
  );

  const mergeDraftSections = React.useCallback(
    (sourceId: string, targetId: string, opts: MergeOptions) => {
      const source = resumes.find((r) => r.id === sourceId);
      const target = resumes.find((r) => r.id === targetId);
      if (!source || !target) return;
      setResumes((prev) => {
        const next = prev.map((r) => {
          if (r.id !== target.id) return r;
          const newContent = { ...r.content };
          if (opts.applySummary && source.content.summary) {
            newContent.summary = source.content.summary;
          }
          if (source.content.skills && source.content.skills.length) {
            if (opts.applySkillsAdded) {
              const existing = newContent.skills || [];
              const added = source.content.skills.filter(
                (s) => !existing.includes(s)
              );
              newContent.skills = [...existing, ...added];
            }
            if (opts.removeSkillsNotInSource) {
              newContent.skills = (newContent.skills || []).filter((s) =>
                source.content.skills?.includes(s)
              );
            }
          }
          if (opts.mergeExperienceBullets || opts.addMissingExperienceEntries) {
            const tgtExp = newContent.experience || [];
            const srcExp = source.content.experience || [];
            const merged = [...tgtExp];
            for (const se of srcExp) {
              const idx = merged.findIndex(
                (te) =>
                  te.role.toLowerCase() === se.role.toLowerCase() &&
                  (se.company
                    ? te.company?.toLowerCase() === se.company.toLowerCase()
                    : true)
              );
              if (idx >= 0) {
                if (opts.mergeExperienceBullets) {
                  const existingBullets = merged[idx].bullets;
                  for (const b of se.bullets) {
                    if (!existingBullets.some((x) => x.trim() === b.trim()))
                      existingBullets.push(b);
                  }
                }
              } else if (opts.addMissingExperienceEntries) {
                merged.push({ ...se });
              }
            }
            newContent.experience = merged;
          }
          return { ...r, content: newContent };
        });
        persist(next);
        return next;
      });
    },
    [resumes]
  );

  return {
    resumes,
    activeId,
    active,
    setActive,
    refresh,
    deleteDraft,
    restoreDraft,
    updateContent,
    applyOrderedSkills,
    appendExperienceFromAI,
    applySummary,
    setVisibleSections: (sections: string[]) => {
      if (!active) return;
      updateContent(active.id, (c) => ({
        ...c,
        visibleSections: [...sections],
      }));
    },
    setSectionOrder: (order: string[]) => {
      if (!active) return;
      updateContent(active.id, (c) => ({ ...c, sectionOrder: [...order] }));
    },
    applyPreset: (preset) => {
      if (!active) return;
      // Canonical known sections
      const all = ["summary", "skills", "experience", "education", "projects"];
      let order: string[] = [];
      let visible: string[] = [];
      switch (preset) {
        case "chronological":
          order = ["summary", "skills", "experience", "education", "projects"];
          visible = [
            "summary",
            "skills",
            "experience",
            "education",
            "projects",
          ];
          break;
        case "functional":
          order = ["summary", "skills", "projects", "experience", "education"];
          visible = [
            "summary",
            "skills",
            "projects",
            "experience",
            "education",
          ];
          break;
        case "hybrid":
        default:
          order = ["summary", "skills", "experience", "projects", "education"];
          visible = [
            "summary",
            "skills",
            "experience",
            "projects",
            "education",
          ];
          break;
      }
      // Ensure all known sections appear at least once in order (append missing at end)
      for (const s of all) if (!order.includes(s)) order.push(s);
      updateContent(active.id, (c) => ({
        ...c,
        sectionOrder: order,
        visibleSections: visible,
      }));
    },
    duplicateActive,
    setLastAppliedJob,
    diffDrafts,
    mergeDraftSections,
    computeStats,
  };
}

export default useResumeDrafts;
