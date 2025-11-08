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
  content: {
    summary?: string;
    skills?: string[];
    experience?: ResumeDraftContentExperienceItem[];
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
  updateContent: (
    id: string,
    updater: (c: ResumeDraftRecord["content"]) => ResumeDraftRecord["content"]
  ) => void;
  applyOrderedSkills: (ordered: string[]) => void;
  appendExperienceFromAI: (
    exp: NonNullable<ResumeArtifactContent["sections"]>["experience"]
  ) => void;
  applySummary: (summary?: string) => void;
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

  return {
    resumes,
    activeId,
    active,
    setActive,
    refresh,
    updateContent,
    applyOrderedSkills,
    appendExperienceFromAI,
    applySummary,
  };
}

export default useResumeDrafts;
