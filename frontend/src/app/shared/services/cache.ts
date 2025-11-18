/**
 * DATA CACHE SERVICE
 *
 * Purpose:
 * - In-memory cache for frequently accessed data
 * - Reduce redundant API calls for unchanged data
 * - TTL-based invalidation for stale data
 *
 * Use Cases:
 * - Job listings cache (jobsService.ts)
 * - User profile data (short-term caching)
 *
 * Limitations:
 * - In-memory only (cleared on page refresh)
 * - No persistence across sessions
 * - Simple TTL expiration (no LRU eviction)
 * - Not suitable for large datasets
 *
 * Connection to Backend:
 * - Used by jobsService to cache job listings
 * - Invalidated on mutations (create/update/delete)
 *
 * Usage:
 *   import { dataCache, getCacheKey } from '@shared/services/cache';
 *
 *   const key = getCacheKey('jobs', userId);
 *   const cached = dataCache.get<JobRow[]>(key);
 *   if (!cached) {
 *     const data = await fetchJobs();
 *     dataCache.set(key, data, 5 * 60 * 1000); // 5 min TTL
 *   }
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry>();
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * GET: Retrieve cached data by key.
   *
   * Inputs:
   * - key: Cache key (string)
   *
   * Outputs:
   * - T | null: Cached data if valid, null if expired or not found
   *
   * Behavior:
   * - Auto-deletes expired entries on access
   * - Returns null for cache miss or expired data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      // Expired: auto-delete and return null
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * SET: Store data in cache with optional custom TTL.
   *
   * Inputs:
   * - key: Cache key (string)
   * - data: Data to cache (any type)
   * - ttl?: Time-to-live in milliseconds (default: 5 minutes)
   *
   * Outputs:
   * - void
   *
   * Behavior:
   * - Overwrites existing entries with same key
   * - TTL countdown starts immediately
   */
  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_TTL,
    });
  }

  /**
   * INVALIDATE: Remove specific cache entry.
   *
   * Inputs:
   * - key: Cache key to remove
   *
   * Outputs:
   * - boolean: true if entry existed, false otherwise
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * INVALIDATE PATTERN: Remove all entries matching regex pattern.
   *
   * Inputs:
   * - pattern: RegExp to match against cache keys
   *
   * Outputs:
   * - number: Count of entries removed
   *
   * Example:
   * - invalidatePattern(/^jobs-/) removes all keys starting with "jobs-"
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * CLEAR: Remove all cache entries.
   *
   * Outputs:
   * - void
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * GET STATS: Retrieve cache statistics for monitoring.
   *
   * Outputs:
   * - { size, expired, valid }: Current cache state
   */
  getStats(): { size: number; expired: number; valid: number } {
    let expired = 0;
    let valid = 0;

    for (const entry of this.cache.values()) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      size: this.cache.size,
      expired,
      valid,
    };
  }

  /**
   * CLEANUP: Manually remove all expired entries.
   * Useful for periodic maintenance.
   *
   * Outputs:
   * - number: Count of entries removed
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }
}

// Singleton instance
export const dataCache = new DataCache();

// Helper function to generate cache keys with user scoping
export function getCacheKey(
  resource: string,
  userId: string,
  suffix?: string
): string {
  const base = `${resource}-${userId}`;
  return suffix ? `${base}-${suffix}` : base;
}

// Export class for testing purposes
export { DataCache };
