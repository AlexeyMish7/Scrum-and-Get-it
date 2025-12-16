/**
 * CACHING SERVICE (UC-137)
 * 
 * Purpose:
 * - Implement caching layer for frequently accessed data
 * - Reduce database load and improve response times
 * - Support TTL-based invalidation
 * 
 * Architecture:
 * - In-memory cache (Map-based) for free tier
 * - Redis-compatible interface for future upgrade
 * - LRU eviction when size limit reached
 * 
 * UC-137 Requirements:
 * - Caching layer with Redis (free tier: in-memory)
 * - Optimize database queries
 * - Monitor resource usage
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
  hits: number;
  size: number; // approximate bytes
}

export interface CacheStats {
  totalKeys: number;
  totalSize: number; // bytes
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number; // 0-1
}

export interface CacheConfig {
  maxSize: number; // bytes
  maxKeys: number;
  defaultTTL: number; // milliseconds
  enableLRU: boolean;
}

/**
 * Advanced Cache Service with LRU eviction
 * 
 * Features:
 * - TTL-based expiration
 * - LRU eviction when size limit reached
 * - Cache statistics for monitoring
 * - Namespace support for multi-tenant apps
 */
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    totalKeys: 0,
    totalSize: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
  };
  
  constructor(private config: CacheConfig) {}

  /**
   * Get value from cache
   * 
   * UC-137: Track cache hits/misses for monitoring
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check TTL
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      // Expired
      this.cache.delete(key);
      this.stats.totalKeys--;
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Hit - update stats and LRU
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();
    
    // Move to end (most recently used) for LRU
    if (this.config.enableLRU) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   * 
   * UC-137: Implement size-based eviction
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const existingEntry = this.cache.get(key);
    const size = this.estimateSize(value);
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      size,
    };
    
    // Remove old entry size if updating
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
    } else {
      this.stats.totalKeys++;
    }
    
    // Check if we need to evict
    const newTotalSize = this.stats.totalSize + size;
    if (newTotalSize > this.config.maxSize || this.stats.totalKeys >= this.config.maxKeys) {
      this.evictLRU();
    }
    
    this.cache.set(key, entry);
    this.stats.totalSize += size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.totalKeys--;
      this.stats.totalSize -= entry.size;
      return true;
    }
    return false;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalKeys: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
    };
  }

  /**
   * Clear expired entries
   * 
   * UC-137: Should be called periodically to free memory
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        this.stats.totalKeys--;
        this.stats.totalSize -= entry.size;
        cleared++;
      }
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   * 
   * UC-137: Monitor resource usage
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Evict least recently used entry
   * 
   * UC-137: LRU eviction for memory management
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    // First entry is least recently used (when LRU enabled)
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      const entry = this.cache.get(firstKey);
      if (entry) {
        this.cache.delete(firstKey);
        this.stats.totalKeys--;
        this.stats.totalSize -= entry.size;
        this.stats.evictions++;
      }
    }
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateSize(value: any): number {
    const json = JSON.stringify(value);
    return json.length * 2; // UTF-16 = 2 bytes per char (rough estimate)
  }

  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Create cache service instance with default config
 * 
 * Default limits (suitable for free tier):
 * - Max size: 100MB
 * - Max keys: 10,000
 * - Default TTL: 5 minutes
 */
export function createCacheService(config?: Partial<CacheConfig>): CacheService {
  const defaultConfig: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxKeys: 10000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    enableLRU: true,
  };
  
  return new CacheService({ ...defaultConfig, ...config });
}

/**
 * Singleton cache instance for server
 */
export const serverCache = createCacheService();

/**
 * Cache key builders for different data types
 * 
 * UC-137: Namespace keys to prevent collisions
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  profile: (userId: string) => `profile:${userId}`,
  jobs: (userId: string, filters?: string) => `jobs:${userId}:${filters || 'all'}`,
  job: (jobId: number) => `job:${jobId}`,
  skills: (userId: string) => `skills:${userId}`,
  education: (userId: string) => `education:${userId}`,
  employment: (userId: string) => `employment:${userId}`,
  aiArtifact: (userId: string, kind: string) => `ai:${userId}:${kind}`,
  analytics: (userId: string, type: string) => `analytics:${userId}:${type}`,
  template: (templateId: string) => `template:${templateId}`,
  theme: (themeId: string) => `theme:${themeId}`,
};

/**
 * Cache invalidation patterns
 * 
 * When to invalidate:
 * - User updates profile → invalidate profile cache
 * - User creates/updates job → invalidate jobs cache
 * - AI generates artifact → cache artifact for 7 days
 * - User deletes data → invalidate related caches
 */
export function invalidateUserCache(userId: string): void {
  serverCache.delete(CacheKeys.profile(userId));
  serverCache.delete(CacheKeys.skills(userId));
  serverCache.delete(CacheKeys.education(userId));
  serverCache.delete(CacheKeys.employment(userId));
  serverCache.delete(CacheKeys.jobs(userId));
}

/**
 * Start cache cleanup task
 * 
 * UC-137: Periodic cleanup to free memory
 * Run every 5 minutes to clear expired entries
 */
export function startCacheCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timer {
  return setInterval(() => {
    const cleared = serverCache.clearExpired();
    if (cleared > 0) {
      console.log(`🗑️ Cache cleanup: cleared ${cleared} expired entries`);
    }
  }, intervalMs);
}

/**
 * Scaling strategies for caching (UC-137 documentation)
 * 
 * Current (Free Tier):
 * - In-memory cache with LRU eviction
 * - Suitable for single-server deployment
 * - ~100MB cache size
 * 
 * Future (Production Scale):
 * - Redis/Memcached for distributed caching
 * - Multiple server instances share cache
 * - Pub/sub for cache invalidation across servers
 * - Persistent cache survives server restarts
 * 
 * Migration path:
 * 1. Replace CacheService with RedisClient
 * 2. Use same CacheKeys namespace pattern
 * 3. Configure Redis URL in environment
 * 4. No code changes needed (same interface)
 * 
 * Free Redis options:
 * - Upstash Redis (10MB free tier)
 * - Redis Cloud (30MB free tier)
 * - Vercel KV (256MB free tier with limits)
 */
