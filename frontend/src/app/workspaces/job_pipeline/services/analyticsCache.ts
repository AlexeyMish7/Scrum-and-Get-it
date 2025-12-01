/**
 * ANALYTICS CACHE SERVICE
 *
 * Purpose:
 * - Manage analytics cache in Supabase analytics_cache table
 * - Avoid redundant AI API calls (expensive GPT-4 requests)
 * - TTL-based expiration with configurable cache duration
 * - Profile-aware caching: auto-invalidates when user profile changes
 * - Support multiple analytics types per job
 *
 * Backend Connection:
 * - Database: analytics_cache table (via @shared/services/crud)
 * - RLS: User-scoped via withUser(userId) pattern
 * - AI Backend: Caches results from AI generation API
 *
 * Analytics Types:
 * - match_score: Job-profile compatibility analysis
 * - skills_gap: Skills development recommendations
 * - company_research: Company culture and insights
 * - interview_prep: Interview preparation strategy
 *
 * Cache Strategy:
 * 1. Check cache with getAnalytics() → returns data if valid (not expired, profile unchanged)
 * 2. On cache miss → call AI backend → setAnalytics() to store with current profile version
 * 3. On profile change → cache automatically invalidated on next read (profile_version mismatch)
 * 4. On job update → invalidateAnalytics() to clear stale cache
 *
 * Profile Version Tracking:
 * - Each cache entry stores profile_version (timestamp from ProfileChangeContext)
 * - When user updates skills/education/employment, markProfileChanged() updates the version
 * - Cache reads compare stored profile_version with current version
 * - Mismatch = automatic cache invalidation (returns null, triggers regeneration)
 * - No manual cache clearing needed - fully automatic!
 *
 * Usage:
 *   import { getAnalytics, setAnalytics, invalidateAnalytics } from '@job_pipeline/services/analyticsCache';
 *
 *   // Check cache first (auto-validates profile version)
 *   const cached = await getAnalytics(userId, jobId, 'match_score');
 *   if (!cached) {
 *     const result = await callAIBackend();
 *     await setAnalytics(userId, jobId, 'match_score', result, 7); // 7 days TTL
 *   }
 *
 *   // Profile changes are tracked automatically via ProfileChangeContext
 *   // No need to manually invalidate - next read will see version mismatch
 *
 *   // Manual invalidation (if needed for job changes)
 *   await invalidateAnalytics(userId, jobId); // Clear all types
 *   await invalidateAnalytics(userId, jobId, 'match_score'); // Clear specific type
 *
 * Contract:
 * - getAnalytics(userId, jobId, type): Fetch cached analytics or null if expired/profile changed
 * - setAnalytics(userId, jobId, type, data, ttlDays?): Store/update analytics with current profile version
 * - invalidateAnalytics(userId, jobId, type?): Clear cache for job (all types or specific)
 * - getAllAnalytics(userId, jobId?): Fetch all analytics for user or specific job
 * - getBatchMatchScores(userId, jobIds): Batch fetch match scores for multiple jobs
 * - getCurrentProfileVersion(): Get current profile state version (for debugging)
 */

import { upsertRow, withUser } from "@shared/services/crud";

export type AnalyticsType =
  | "match_score"
  | "skills_gap"
  | "company_research"
  | "interview_prep";

/**
 * Generate a profile version string based on localStorage timestamp.
 * This represents the state of the user's profile (skills, education, employment, etc.)
 *
 * Returns: ISO timestamp string from ProfileChangeContext or current time as fallback
 */
export function getCurrentProfileVersion(): string {
  try {
    const stored = localStorage.getItem("profile_last_changed");
    if (stored) {
      return stored; // Already ISO format
    }
  } catch (e) {
    console.warn("[AnalyticsCache] Failed to read profile version:", e);
  }
  // Fallback: use current time (will force regeneration on first load)
  return new Date().toISOString();
}

// Map to database analytics_type values (dash-separated)
const ANALYTICS_TYPE_MAP: Record<AnalyticsType, string> = {
  match_score: "document-match-score",
  skills_gap: "skills-gap",
  company_research: "company-research",
  interview_prep: "interview-prep",
};

export interface AnalyticsCacheEntry {
  id: string;
  user_id: string;
  job_id: number;
  analytics_type: AnalyticsType;
  data: Record<string, unknown>;
  match_score?: number;
  metadata?: Record<string, unknown>;
  profile_version?: string; // Hash of profile state when generated
  generated_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface MatchScoreData {
  matchScore: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    overall: number;
  };
  skillsGaps: string[];
  strengths: string[];
  recommendations: string[];
  meta?: {
    model?: string;
    confidence?: number;
    latency_ms?: number;
    cached?: boolean;
  };
}

/**
 * Get cached analytics for a job.
 * Returns null if no valid cache exists (expired, profile changed, or not found).
 *
 * Cache is considered invalid if:
 * 1. Entry doesn't exist
 * 2. Entry has expired (past expires_at)
 * 3. Profile has changed since generation (profile_version mismatch)
 */
export async function getAnalytics(
  userId: string,
  jobId: number,
  type: AnalyticsType
): Promise<AnalyticsCacheEntry | null> {
  try {
    const userCrud = withUser(userId);
    const now = new Date().toISOString();
    const currentProfileVersion = getCurrentProfileVersion();

    const result = await userCrud.listRows<AnalyticsCacheEntry>(
      "analytics_cache",
      "*",
      {
        eq: {
          job_id: jobId,
          analytics_type: ANALYTICS_TYPE_MAP[type],
        },
        limit: 1,
      }
    );

    if (result.error) {
      console.error("[AnalyticsCache] Error fetching analytics:", result.error);
      return null;
    }

    const data = result.data?.[0];

    if (!data) {
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) <= new Date(now)) {
      return null;
    }

    // Check if profile has changed since generation
    if (
      data.profile_version &&
      data.profile_version !== currentProfileVersion
    ) {
      return null;
    }

    return data;
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return null;
  }
}

/**
 * Store or update analytics in cache.
 * Uses upsert to handle both insert and update cases.
 * Automatically captures current profile version to enable cache invalidation.
 *
 * @param ttlDays Time-to-live in days (default: 7)
 */
export async function setAnalytics(
  userId: string,
  jobId: number,
  type: AnalyticsType,
  data: Record<string, unknown>,
  ttlDays: number = 7
): Promise<AnalyticsCacheEntry | null> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    // Extract match_score if this is a match_score analytics type
    const matchScore =
      type === "match_score" && typeof data.matchScore === "number"
        ? data.matchScore
        : null;

    const payload = {
      user_id: userId,
      job_id: jobId,
      document_id: null, // Not used for job analytics
      analytics_type: ANALYTICS_TYPE_MAP[type],
      data,
      match_score: matchScore,
      profile_version: getCurrentProfileVersion(), // Capture profile state
      metadata: (data.meta as Record<string, unknown>) || {},
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const result = await upsertRow<AnalyticsCacheEntry>(
      "analytics_cache",
      payload,
      "user_id,job_id,analytics_type"
    );

    if (result.error) {
      console.error("[AnalyticsCache] Error storing analytics:", result.error);
      return null;
    }

    return result.data || null;
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return null;
  }
}

/**
 * Invalidate (delete) cached analytics for a job.
 * If type is omitted, clears all analytics types for the job.
 */
export async function invalidateAnalytics(
  userId: string,
  jobId: number,
  type?: AnalyticsType
): Promise<boolean> {
  try {
    const userCrud = withUser(userId);

    const filters: Record<string, unknown> = {
      job_id: jobId,
    };

    if (type) {
      filters.analytics_type = ANALYTICS_TYPE_MAP[type];
    }

    const result = await userCrud.deleteRow("analytics_cache", filters);

    if (result.error) {
      console.error(
        "[AnalyticsCache] Error invalidating analytics:",
        result.error
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return false;
  }
}

/**
 * Get all active (non-expired) analytics for a user.
 * Useful for dashboard/overview pages.
 */
export async function getAllActiveAnalytics(
  userId: string,
  type?: AnalyticsType
): Promise<AnalyticsCacheEntry[]> {
  try {
    const userCrud = withUser(userId);
    const now = new Date().toISOString();

    const eqFilters: Record<string, string | number | boolean | null> = {};
    if (type) {
      eqFilters.analytics_type = ANALYTICS_TYPE_MAP[type];
    }

    const result = await userCrud.listRows<AnalyticsCacheEntry>(
      "analytics_cache",
      "*",
      {
        eq: eqFilters,
        order: { column: "generated_at", ascending: false },
      }
    );

    if (result.error) {
      console.error(
        "[AnalyticsCache] Error fetching all analytics:",
        result.error
      );
      return [];
    }

    // Filter out expired entries client-side
    return (result.data || []).filter(
      (entry) => new Date(entry.expires_at) > new Date(now)
    );
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return [];
  }
}

/**
 * Check if analytics exist and are still valid (not expired).
 */
export async function hasValidCache(
  userId: string,
  jobId: number,
  type: AnalyticsType
): Promise<boolean> {
  const cached = await getAnalytics(userId, jobId, type);
  return cached !== null;
}

/**
 * Get match scores for multiple jobs (batch operation).
 * Returns map of jobId → match score.
 */
export async function getBatchMatchScores(
  userId: string,
  jobIds: number[]
): Promise<Record<number, number>> {
  try {
    const userCrud = withUser(userId);
    const now = new Date().toISOString();

    const result = await userCrud.listRows<AnalyticsCacheEntry>(
      "analytics_cache",
      "job_id, match_score, expires_at",
      {
        eq: { analytics_type: ANALYTICS_TYPE_MAP["match_score"] },
        in: { job_id: jobIds },
      }
    );

    if (result.error) {
      console.error(
        "[AnalyticsCache] Error fetching batch match scores:",
        result.error
      );
      return {};
    }

    const scoreMap: Record<number, number> = {};

    (result.data || []).forEach((entry: AnalyticsCacheEntry) => {
      // Only include non-expired entries with valid match scores
      if (
        entry.match_score !== null &&
        entry.match_score !== undefined &&
        new Date(entry.expires_at) > new Date(now)
      ) {
        scoreMap[entry.job_id] = entry.match_score;
      }
    });

    return scoreMap;
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return {};
  }
}

export default {
  getAnalytics,
  setAnalytics,
  invalidateAnalytics,
  getAllActiveAnalytics,
  hasValidCache,
  getBatchMatchScores,
  getCurrentProfileVersion,
};
