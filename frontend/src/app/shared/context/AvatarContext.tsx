/* eslint-disable react-refresh/only-export-components */
/**
 * AVATAR CONTEXT
 * Global avatar state management to prevent reloading on page navigation.
 *
 * Problem Solved:
 * - Previously, useAvatar() fetched profile data on every component mount
 * - This caused the avatar to "flash" or reload when navigating between pages
 *
 * Solution:
 * - Uses React Query for caching profile data (shared with profile workspace)
 * - Single context provider at app root
 * - All components share the same cached avatar URL via context
 * - Still supports real-time updates when avatar changes
 *
 * Performance:
 * - Profile data is cached via React Query (5 min stale time)
 * - Avatar signed URLs are cached in localStorage (1 hour TTL)
 * - No duplicate Supabase calls between AvatarContext and profile dashboard
 *
 * Usage:
 * ```tsx
 * // In App.tsx or root layout
 * <AvatarProvider>
 *   <App />
 * </AvatarProvider>
 *
 * // In any component
 * const { avatarUrl } = useAvatarContext();
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { useGlobalProfileMetadata, globalProfileKeys } from "@shared/cache";
import { supabase } from "@shared/services/supabaseClient";

// ============ Types ============

type AvatarContextValue = {
  avatarUrl: string | null;
  loading: boolean;
  refresh: () => void;
};

type AvatarProviderProps = {
  children: ReactNode;
};

// ============ Constants ============

const AVATAR_CACHE_PREFIX = "avatar:";
const AVATAR_TTL_SECONDS = 60 * 60; // 1 hour

type AvatarCacheEntry = {
  url: string;
  expiresAt: number;
};

// ============ Cache Utilities ============

const getCacheKey = (bucket: string, path: string) =>
  `${AVATAR_CACHE_PREFIX}${bucket}:${path}`;

const readCachedAvatar = (bucket: string, path: string): string | null => {
  try {
    const raw = window.localStorage.getItem(getCacheKey(bucket, path));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AvatarCacheEntry;
    if (Date.now() < parsed.expiresAt - 10_000) {
      return parsed.url;
    }
    window.localStorage.removeItem(getCacheKey(bucket, path));
  } catch {
    /* ignore */
  }
  return null;
};

const writeCachedAvatar = (bucket: string, path: string, url: string): void => {
  try {
    const entry: AvatarCacheEntry = {
      url,
      expiresAt: Date.now() + AVATAR_TTL_SECONDS * 1000,
    };
    window.localStorage.setItem(
      getCacheKey(bucket, path),
      JSON.stringify(entry)
    );
  } catch {
    /* ignore */
  }
};

// ============ Context ============

const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

/**
 * useAvatarContext
 * Access the global avatar state. Must be used within AvatarProvider.
 */
export function useAvatarContext(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error("useAvatarContext must be used within AvatarProvider");
  }
  return ctx;
}

/**
 * AvatarProvider
 * Wraps the app to provide global avatar state.
 * Uses React Query for profile data caching, localStorage for signed URLs.
 */
export function AvatarProvider({ children }: AvatarProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get profile metadata from React Query cache (shared with profile dashboard)
  const { data: profileData, isLoading: profileLoading } =
    useGlobalProfileMetadata(user?.id);

  // Extract avatar info from cached profile metadata
  const avatarPath = profileData?.metadata?.avatar_path ?? null;
  const avatarBucket = profileData?.metadata?.avatar_bucket ?? "avatars";

  // Generate signed URL from cached profile metadata
  // This only handles URL generation, profile fetching is done by useGlobalProfileMetadata
  const generateSignedUrl = useCallback(
    async (path: string, bucket: string) => {
      // External URL (e.g., Google profile picture) - use directly
      if (/^https?:\/\//.test(path)) {
        setAvatarUrl(path);
        setLoading(false);
        return;
      }

      // Check localStorage cache first for signed URLs
      const cached = readCachedAvatar(bucket, path);
      if (cached) {
        setAvatarUrl(cached);
        setLoading(false);
        return;
      }

      // Create signed URL for storage-based avatar
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, AVATAR_TTL_SECONDS);

        if (!error && data?.signedUrl) {
          setAvatarUrl(data.signedUrl);
          writeCachedAvatar(bucket, path, data.signedUrl);
        }
      } catch (err) {
        console.error("[AvatarContext] Error creating signed URL:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update avatar URL when profile metadata changes (from React Query cache)
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user?.id || !avatarPath) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    generateSignedUrl(avatarPath, avatarBucket);
  }, [
    authLoading,
    profileLoading,
    user?.id,
    avatarPath,
    avatarBucket,
    generateSignedUrl,
  ]);

  // Subscribe to profile changes for real-time updates
  // When profile changes, invalidate React Query cache which triggers re-fetch
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`avatar:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          // Invalidate React Query cache to trigger fresh profile fetch
          queryClient.invalidateQueries({
            queryKey: globalProfileKeys.profile(user.id),
          });
        }
      )
      .subscribe();

    // Listen for custom avatar:updated event from ProfilePicture component
    const handleAvatarUpdate = () => {
      queryClient.invalidateQueries({
        queryKey: globalProfileKeys.profile(user.id),
      });
    };
    window.addEventListener("avatar:updated", handleAvatarUpdate);

    return () => {
      channel.unsubscribe();
      window.removeEventListener("avatar:updated", handleAvatarUpdate);
    };
  }, [user?.id, queryClient]);

  // Refresh forces cache invalidation and re-fetch
  const refresh = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    queryClient.invalidateQueries({
      queryKey: globalProfileKeys.profile(user.id),
    });
  }, [user?.id, queryClient]);

  return (
    <AvatarContext.Provider value={{ avatarUrl, loading, refresh }}>
      {children}
    </AvatarContext.Provider>
  );
}

export default AvatarProvider;
