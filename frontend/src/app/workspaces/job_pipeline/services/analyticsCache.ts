/**
 * Analytics Cache Service — Client-side service for job analytics caching
 *
 * Purpose: Manage analytics cache in Supabase to avoid redundant AI API calls.
 * Handles cache hits/misses, expiration, and analytics type management.
 *
 * Contract:
 * - getAnalytics(userId, jobId, type): Fetch cached analytics or null if expired/missing
 * - setAnalytics(userId, jobId, type, data, ttlDays?): Store/update analytics with TTL
 * - invalidateAnalytics(userId, jobId, type?): Clear cache for job (all types or specific)
 *
 * Analytics Types:
 * - match_score: Job match analysis with breakdown
 * - skills_gap: Skills development plan
 * - company_research: Company insights and culture
 * - interview_prep: Interview preparation recommendations
 */

import { upsertRow, withUser } from "@shared/services/crud";

export type AnalyticsType =
  | "match_score"
  | "skills_gap"
  | "company_research"
  | "interview_prep";

export interface AnalyticsCacheEntry {
  id: string;
  user_id: string;
  job_id: number;
  analytics_type: AnalyticsType;
  data: Record<string, unknown>;
  match_score?: number;
  metadata?: Record<string, unknown>;
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
 * Returns null if no valid cache exists (expired or not found).
 */
export async function getAnalytics(
  userId: string,
  jobId: number,
  type: AnalyticsType
): Promise<AnalyticsCacheEntry | null> {
  try {
    const userCrud = withUser(userId);
    const now = new Date().toISOString();

    const result = await userCrud.listRows<AnalyticsCacheEntry>(
      "job_analytics_cache",
      "*",
      {
        eq: {
          job_id: jobId,
          analytics_type: type,
        },
        limit: 1,
      }
    );

    if (result.error) {
      console.error("[AnalyticsCache] Error fetching analytics:", result.error);
      return null;
    }

    const data = result.data?.[0];

    // Check if expired
    if (data && new Date(data.expires_at) > new Date(now)) {
      return data;
    }

    return null;
  } catch (err) {
    console.error("[AnalyticsCache] Unexpected error:", err);
    return null;
  }
}

/**
 * Store or update analytics in cache.
 * Uses upsert to handle both insert and update cases.
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
      analytics_type: type,
      data,
      match_score: matchScore,
      metadata: (data.meta as Record<string, unknown>) || {},
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const result = await upsertRow<AnalyticsCacheEntry>(
      "job_analytics_cache",
      payload,
      "user_id,job_id,analytics_type"
    );

    if (result.error) {
      console.error("[AnalyticsCache] Error storing analytics:", result.error);
      return null;
    }

    console.log(
      `[AnalyticsCache] Stored ${type} for job ${jobId} (expires: ${ttlDays}d)`
    );
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
      filters.analytics_type = type;
    }

    const result = await userCrud.deleteRow("job_analytics_cache", filters);

    if (result.error) {
      console.error(
        "[AnalyticsCache] Error invalidating analytics:",
        result.error
      );
      return false;
    }

    console.log(
      `[AnalyticsCache] Invalidated ${type || "all"} for job ${jobId}`
    );
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
      eqFilters.analytics_type = type;
    }

    const result = await userCrud.listRows<AnalyticsCacheEntry>(
      "job_analytics_cache",
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
      "job_analytics_cache",
      "job_id, match_score, expires_at",
      {
        eq: { analytics_type: "match_score" },
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
};
