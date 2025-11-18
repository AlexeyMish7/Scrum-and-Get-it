/**
 * useResumeVersions
 *
 * Lightweight localStorage-backed versioning helper for resume drafts.
 * Purpose: provide create/list/delete/archive/merge/set-default operations
 * for resume drafts without requiring backend changes during Sprint 2.
 */

import { useCallback } from "react";
import type { ResumeDraft } from "./useResumeDraftsV2";

// Lightweight id generator to avoid extra deps in the frontend
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface ResumeVersion {
  id: string;
  draftId: string; // id of the draft this version belongs to
  name: string;
  description?: string;
  content: ResumeDraft["content"]; // snapshot of draft.content
  jobId?: number | null;
  createdAt: string; // ISO
  archived?: boolean;
  isDefault?: boolean;
}

const STORAGE_KEY = "sgt:resume_versions";

function readAll(): ResumeVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ResumeVersion[];
  } catch (e) {
    console.error("Failed to read resume versions", e);
    return [];
  }
}

function writeAll(list: ResumeVersion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useResumeVersions() {
  const listVersions = useCallback((draftId: string) => {
    return readAll().filter((v) => v.draftId === draftId && !v.archived);
  }, []);

  const listAllIncludingArchived = useCallback((draftId: string) => {
    return readAll().filter((v) => v.draftId === draftId);
  }, []);

  const getVersion = useCallback((id: string) => {
    return readAll().find((v) => v.id === id) || null;
  }, []);

  const createVersion = useCallback(
    (
      draftId: string,
      name: string,
      content: ResumeDraft["content"],
      opts?: {
        description?: string;
        jobId?: number | null;
        setDefault?: boolean;
      }
    ) => {
      const versions = readAll();
      const version: ResumeVersion = {
        id: generateId(),
        draftId,
        name,
        description: opts?.description,
        content,
        jobId: opts?.jobId ?? null,
        createdAt: new Date().toISOString(),
        archived: false,
        isDefault: !!opts?.setDefault,
      };

      // If setDefault true, clear other defaults for this draft
      if (version.isDefault) {
        for (const v of versions) {
          if (v.draftId === draftId) v.isDefault = false;
        }
      }

      versions.push(version);
      writeAll(versions);
      return version;
    },
    []
  );

  const deleteVersion = useCallback((id: string) => {
    const versions = readAll().filter((v) => v.id !== id);
    writeAll(versions);
  }, []);

  const archiveVersion = useCallback((id: string) => {
    const versions = readAll();
    const v = versions.find((x) => x.id === id);
    if (v) {
      v.archived = true;
      // if it was default, unset
      v.isDefault = false;
      writeAll(versions);
    }
  }, []);

  const restoreVersion = useCallback((id: string) => {
    const versions = readAll();
    const v = versions.find((x) => x.id === id);
    if (v) {
      v.archived = false;
      writeAll(versions);
    }
  }, []);

  const setDefaultVersion = useCallback(
    (draftId: string, id: string | null) => {
      const versions = readAll();
      for (const v of versions) {
        if (v.draftId === draftId) {
          v.isDefault = v.id === id;
        }
      }
      writeAll(versions);
    },
    []
  );

  return {
    listVersions,
    listAllIncludingArchived,
    getVersion,
    createVersion,
    deleteVersion,
    archiveVersion,
    restoreVersion,
    setDefaultVersion,
  };
}

export default useResumeVersions;
