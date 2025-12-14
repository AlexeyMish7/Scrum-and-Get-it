/**
 * AI QUERY KEYS
 *
 * Centralized, type-safe query keys for AI-related queries.
 * Use these keys across the app so caching + invalidation is consistent.
 */

export const aiKeys = {
  all: ["ai"] as const,

  hub: () => [...aiKeys.all, "hub"] as const,
  hubOverview: (userId: string) =>
    [...aiKeys.hub(), "overview", userId] as const,

  predictions: () => [...aiKeys.all, "predictions"] as const,
  jobSearchPredictions: (userId: string, fingerprint: string) =>
    [...aiKeys.predictions(), "job-search", userId, fingerprint] as const,

  // Documents + editor state (AI workspace)
  // NOTE: These intentionally use the "ai" root (not "core") so they are NOT
  // persisted to disk by our persistence allowlist. Document versions can be
  // large/high-cardinality and should remain in-memory only.
  documents: () => [...aiKeys.all, "documents"] as const,
  document: (userId: string, documentId: string) =>
    [...aiKeys.documents(), "by-id", userId, documentId] as const,
  documentVersions: (userId: string, documentId: string) =>
    [...aiKeys.documents(), "versions", userId, documentId] as const,

  templates: (userId: string) => [...aiKeys.all, "templates", userId] as const,
  themes: (userId: string) => [...aiKeys.all, "themes", userId] as const,
} as const;
