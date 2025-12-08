/**
 * GLOBAL PROFILE QUERIES
 *
 * Provides React Query hooks for profile data that can be used
 * anywhere in the app (not just the profile workspace).
 *
 * This enables:
 * - AvatarContext to use cached profile data
 * - GlobalTopBar to access profile without duplicate fetches
 * - Shared cache between global components and profile workspace
 *
 * Cache timing is controlled by environment variables:
 * - VITE_CACHE_STALE_TIME_MINUTES (default: 5)
 * - VITE_CACHE_GC_TIME_MINUTES (default: 30)
 *
 * The cache key structure matches profile workspace queries,
 * so data is shared automatically.
 */
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@shared/services/crud";
import { CACHE_STALE_TIME, CACHE_GC_TIME } from "@profile/cache/cacheConfig";

// Global profile keys - uses separate namespace to avoid conflicts
// with profile workspace queries that have different data transformations
export const globalProfileKeys = {
  all: ["global-profile"] as const,
  profile: (userId: string) => [...globalProfileKeys.all, userId] as const,
};

// Disabled query key - used when userId is not available
// The query won't run but React Query requires a stable key
const DISABLED_QUERY_KEY = [...globalProfileKeys.all, "disabled"] as const;

/**
 * Profile metadata type - contains avatar info
 */
export interface ProfileMetadata {
  avatar_path?: string | null;
  avatar_bucket?: string | null;
  [key: string]: unknown;
}

/**
 * Full profile row type
 */
export interface GlobalProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  metadata: ProfileMetadata | null;
}

/**
 * Fetches profile data for global use
 */
async function fetchGlobalProfile(
  userId: string
): Promise<GlobalProfileData | null> {
  const result = await getUserProfile(userId);
  if (!result?.data) return null;
  return result.data as GlobalProfileData;
}

/**
 * Hook to get profile metadata (avatar info) with caching
 * Uses separate cache key from profile workspace to avoid data shape conflicts
 */
export function useGlobalProfileMetadata(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? globalProfileKeys.profile(userId) : DISABLED_QUERY_KEY,
    queryFn: () => (userId ? fetchGlobalProfile(userId) : null),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    // Select only metadata from the full profile
    select: (data) => ({
      metadata: data?.metadata ?? null,
      firstName: data?.first_name ?? null,
      lastName: data?.last_name ?? null,
    }),
  });
}

/**
 * Hook to get basic profile info with caching
 * Can be used anywhere in the app
 */
export function useGlobalProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? globalProfileKeys.profile(userId) : DISABLED_QUERY_KEY,
    queryFn: () => (userId ? fetchGlobalProfile(userId) : null),
    enabled: !!userId,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  });
}
