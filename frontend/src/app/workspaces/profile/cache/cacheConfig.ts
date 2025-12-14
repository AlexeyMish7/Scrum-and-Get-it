/**
 * CACHE CONFIGURATION
 *
 * Centralized cache timing settings for React Query.
 * Uses environment variables with sensible defaults.
 *
 * Environment Variables:
 * - VITE_CACHE_STALE_TIME_MINUTES: How long data is considered "fresh" (default: 15)
 * - VITE_CACHE_GC_TIME_MINUTES: How long unused data stays in cache (default: 30)
 *
 * Usage:
 *   import { CACHE_STALE_TIME, CACHE_GC_TIME } from "./cacheConfig";
 *   useQuery({ staleTime: CACHE_STALE_TIME, gcTime: CACHE_GC_TIME, ... });
 */

// Parse env vars with defaults (Vite exposes env vars via import.meta.env)
const staleTimeMinutes =
  Number(import.meta.env.VITE_CACHE_STALE_TIME_MINUTES) || 15;
const gcTimeMinutes = Number(import.meta.env.VITE_CACHE_GC_TIME_MINUTES) || 30;

/**
 * How long data is considered "fresh" before refetching
 * During this time, navigation between pages uses cached data instantly
 */
export const CACHE_STALE_TIME = staleTimeMinutes * 60 * 1000;

/**
 * How long unused data stays in cache before garbage collection
 * Even after stale, data remains available for instant display while refetching
 */
export const CACHE_GC_TIME = gcTimeMinutes * 60 * 1000;

/**
 * Default query options for profile-related queries
 * Spread this into useQuery calls for consistent caching behavior
 */
export const defaultQueryOptions = {
  staleTime: CACHE_STALE_TIME,
  gcTime: CACHE_GC_TIME,
} as const;
