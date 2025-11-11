/**
 * useResumeFeedback
 *
 * Simple localStorage-backed feedback/share system for Sprint-2.
 * Data model is intentionally simple to avoid backend changes yet still
 * provide the collaboration UX required by UC-054.
 */

import { useCallback } from "react";

export interface FeedbackComment {
  id: string;
  author?: string;
  message: string;
  createdAt: string;
  resolved?: boolean;
}

export interface ResumeShare {
  token: string;
  draftId: string;
  versionId?: string | null;
  permissions: "view" | "comment" | "edit";
  privacy: "private" | "link"; // private = not shareable
  createdAt: string;
  expiresAt?: string | null;
  comments: FeedbackComment[];
}

const STORAGE_KEY = "sgt:resume_shares";

function readAll(): ResumeShare[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read resume shares", e);
    return [];
  }
}

function writeAll(list: ResumeShare[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
}

export function useResumeFeedback() {
  const createShare = useCallback(
    (draftId: string, opts?: { versionId?: string | null; permissions?: ResumeShare['permissions']; privacy?: ResumeShare['privacy']; expiresAt?: string | null }) => {
      const shares = readAll();
      const token = genToken();
      const s: ResumeShare = {
        token,
        draftId,
        versionId: opts?.versionId ?? null,
        permissions: opts?.permissions ?? "comment",
        privacy: opts?.privacy ?? "link",
        createdAt: new Date().toISOString(),
        expiresAt: opts?.expiresAt ?? null,
        comments: [],
      };
      shares.push(s);
      writeAll(shares);
      return s;
    },
    []
  );

  const getShare = useCallback((token: string) => {
    const shares = readAll();
    const s = shares.find((x) => x.token === token) || null;
    // check expiry
    if (s && s.expiresAt && new Date(s.expiresAt) < new Date()) return null;
    return s;
  }, []);

  const addComment = useCallback((token: string, message: string, author?: string) => {
    const shares = readAll();
    const s = shares.find((x) => x.token === token);
    if (!s) throw new Error("Share not found");
    const c: FeedbackComment = {
      id: genToken(),
      author,
      message,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    s.comments.push(c);
    writeAll(shares);
    return c;
  }, []);

  const resolveComment = useCallback((token: string, commentId: string, resolved = true) => {
    const shares = readAll();
    const s = shares.find((x) => x.token === token);
    if (!s) throw new Error("Share not found");
    const c = s.comments.find((x) => x.id === commentId);
    if (!c) throw new Error("Comment not found");
    c.resolved = resolved;
    writeAll(shares);
    return c;
  }, []);

  const listComments = useCallback((token: string) => {
    const s = getShare(token);
    return s ? s.comments.slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt)) : [];
  }, [getShare]);

  const setPermissions = useCallback((token: string, permissions: ResumeShare['permissions']) => {
    const shares = readAll();
    const s = shares.find((x) => x.token === token);
    if (!s) throw new Error("Share not found");
    s.permissions = permissions;
    writeAll(shares);
    return s;
  }, []);

  const exportFeedback = useCallback((token: string) => {
    const s = getShare(token);
    if (!s) throw new Error("Share not found");
    // return JSON stringify for download
    return JSON.stringify(s.comments, null, 2);
  }, [getShare]);

  const listSharesByDraft = useCallback((draftId: string) => {
    const shares = readAll();
    return shares.filter((s) => s.draftId === draftId && (!s.expiresAt || new Date(s.expiresAt) > new Date()));
  }, []);

  return {
    createShare,
    getShare,
    addComment,
    resolveComment,
    listComments,
    setPermissions,
    exportFeedback,
    listSharesByDraft,
  };
}

export default useResumeFeedback;
