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
 * - Single context provider loads avatar once at app root
 * - All components share the same cached avatar URL via context
 * - Still supports real-time updates when avatar changes
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
import { useAuth } from "./AuthContext";
import { getUserProfile } from "@shared/services/crud";
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
 * Loads avatar once on auth and caches it in memory + localStorage.
 */
export function AvatarProvider({ children }: AvatarProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load avatar from profile metadata
  const loadAvatar = useCallback(async () => {
    if (!user?.id) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getUserProfile(user.id);
      if (res.error) {
        console.warn("[AvatarContext] Failed to fetch profile:", res.error);
        setLoading(false);
        return;
      }

      // Profile data - access metadata field which contains avatar_path
      const profileData = res.data as Record<string, unknown> | null;
      const metadata =
        (profileData?.metadata as {
          avatar_path?: string | null;
          avatar_bucket?: string | null;
        }) ?? {};
      const avatarPath = metadata.avatar_path ?? null;
      const avatarBucket = metadata.avatar_bucket ?? "avatars";

      if (!avatarPath) {
        setAvatarUrl(null);
        setLoading(false);
        return;
      }

      // External URL (e.g., Google profile picture) - use directly
      if (/^https?:\/\//.test(avatarPath)) {
        setAvatarUrl(avatarPath);
        setLoading(false);
        return;
      }

      // Check localStorage cache first
      const cached = readCachedAvatar(avatarBucket, avatarPath);
      if (cached) {
        setAvatarUrl(cached);
        setLoading(false);
        return;
      }

      // Create signed URL for storage-based avatar
      const { data, error } = await supabase.storage
        .from(avatarBucket)
        .createSignedUrl(avatarPath, AVATAR_TTL_SECONDS);

      if (!error && data?.signedUrl) {
        setAvatarUrl(data.signedUrl);
        writeCachedAvatar(avatarBucket, avatarPath, data.signedUrl);
      }
    } catch (err) {
      console.error("[AvatarContext] Error loading avatar:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load avatar when user changes
  useEffect(() => {
    if (authLoading) return;
    loadAvatar();
  }, [authLoading, loadAvatar]);

  // Subscribe to profile changes for real-time updates
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
        () => loadAvatar()
      )
      .subscribe();

    // Listen for custom avatar:updated event from ProfilePicture component
    const handleAvatarUpdate = () => loadAvatar();
    window.addEventListener("avatar:updated", handleAvatarUpdate);

    return () => {
      channel.unsubscribe();
      window.removeEventListener("avatar:updated", handleAvatarUpdate);
    };
  }, [user?.id, loadAvatar]);

  const refresh = useCallback(() => {
    setLoading(true);
    loadAvatar();
  }, [loadAvatar]);

  return (
    <AvatarContext.Provider value={{ avatarUrl, loading, refresh }}>
      {children}
    </AvatarContext.Provider>
  );
}

export default AvatarProvider;
