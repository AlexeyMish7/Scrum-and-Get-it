/**
 * Resume Drafts Cache Service
 *
 * WHAT: localStorage cache layer for resume drafts
 * WHY: Fast page loads + offline support while maintaining database sync
 *
 * Strategy:
 * 1. Load from cache immediately on mount (instant UI)
 * 2. Background sync with database to get latest updates
 * 3. Write-through cache: update both cache + DB on edits
 * 4. Cache invalidation: timestamp-based + user-scoped
 *
 * Cache Structure:
 * {
 *   userId: string;
 *   drafts: ResumeDraft[];
 *   activeDraftId: string | null;
 *   lastSyncedAt: ISO timestamp;
 *   version: number;
 * }
 */

const CACHE_KEY = "resume_drafts_cache_v2";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedDraftsData {
  userId: string;
  drafts: unknown[]; // ResumeDraft[] but we don't import to avoid circular deps
  activeDraftId: string | null;
  lastSyncedAt: string; // ISO timestamp
  version: number;
}

/**
 * Load drafts from localStorage cache
 *
 * Returns cached data if:
 * - Cache exists for this user
 * - Cache is less than 5 minutes old
 * - Cache version matches
 *
 * Returns null if cache is stale or doesn't exist
 */
export function loadFromCache(userId: string): CachedDraftsData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedDraftsData = JSON.parse(cached);

    // Validate cache
    if (data.userId !== userId) {
      console.log("Cache userId mismatch, invalidating");
      return null;
    }

    if (data.version !== 2) {
      console.log("Cache version mismatch, invalidating");
      return null;
    }

    const cacheAge = Date.now() - new Date(data.lastSyncedAt).getTime();
    if (cacheAge > CACHE_MAX_AGE_MS) {
      console.log(
        `Cache is stale (${Math.round(
          cacheAge / 1000
        )}s old), will sync from DB`
      );
      // Return stale cache but caller should sync in background
      return data;
    }

    console.log(
      `✓ Loaded ${data.drafts.length} drafts from cache (${Math.round(
        cacheAge / 1000
      )}s old)`
    );
    return data;
  } catch (error) {
    console.error("Failed to load from cache:", error);
    return null;
  }
}

/**
 * Save drafts to localStorage cache
 *
 * Updates cache with current drafts and sync timestamp
 */
export function saveToCache(
  userId: string,
  drafts: unknown[],
  activeDraftId: string | null
): void {
  try {
    const data: CachedDraftsData = {
      userId,
      drafts,
      activeDraftId,
      lastSyncedAt: new Date().toISOString(),
      version: 2,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log(`✓ Cached ${drafts.length} drafts to localStorage`);
  } catch (error) {
    console.error("Failed to save to cache:", error);
    // Non-fatal: cache is optional
  }
}

/**
 * Clear cache for a specific user or all users
 */
export function clearCache(userId?: string): void {
  try {
    if (userId) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedDraftsData = JSON.parse(cached);
        if (data.userId === userId) {
          localStorage.removeItem(CACHE_KEY);
          console.log(`✓ Cleared cache for user ${userId}`);
        }
      }
    } else {
      localStorage.removeItem(CACHE_KEY);
      console.log("✓ Cleared all cache");
    }
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Check if cache exists and is fresh
 */
export function isCacheFresh(userId: string): boolean {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const data: CachedDraftsData = JSON.parse(cached);

    if (data.userId !== userId || data.version !== 2) {
      return false;
    }

    const cacheAge = Date.now() - new Date(data.lastSyncedAt).getTime();
    return cacheAge <= CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(userId: string): number | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedDraftsData = JSON.parse(cached);

    if (data.userId !== userId) return null;

    return Date.now() - new Date(data.lastSyncedAt).getTime();
  } catch {
    return null;
  }
}
