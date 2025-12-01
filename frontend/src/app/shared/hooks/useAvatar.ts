/**
 * USE AVATAR HOOK
 * Load and cache user avatar URLs from Supabase Storage.
 *
 * Features:
 * - Loads avatar from user profile metadata
 * - Creates signed URLs with 1-hour expiration
 * - Caches signed URLs in localStorage (reduces Supabase API calls)
 * - Real-time updates via Supabase subscriptions
 * - Auto-refreshes when profile changes
 *
 * Usage:
 * ```tsx
 * const avatarUrl = useAvatar(user?.id);
 *
 * <Avatar src={avatarUrl ?? undefined}>
 *   {!avatarUrl && user?.email?.charAt(0)?.toUpperCase()}
 * </Avatar>
 * ```
 */

import { useState, useEffect } from "react";
import { getUserProfile } from "@shared/services/crud";
import type { ProfileRow } from "@shared/services/types";
import { supabase } from "@shared/services/supabaseClient";

// Avatar caching utilities
type AvatarCacheEntry = {
  url: string;
  expiresAt: number;
};

const AVATAR_CACHE_PREFIX = "avatar:";
const AVATAR_TTL_SECONDS = 60 * 60; // 1 hour

const getCacheKey = (bucket: string, path: string) =>
  `${AVATAR_CACHE_PREFIX}${bucket}:${path}`;

const readCachedAvatar = (bucket: string, path: string): string | null => {
  try {
    const raw = window.localStorage.getItem(getCacheKey(bucket, path));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AvatarCacheEntry;
    // Refresh 10 seconds before expiry to avoid edge cases
    if (Date.now() < parsed.expiresAt - 10_000) {
      return parsed.url;
    }
    window.localStorage.removeItem(getCacheKey(bucket, path));
  } catch {
    /* ignore storage errors */
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
    /* ignore storage errors */
  }
};

/**
 * useAvatar
 * Loads and caches user avatar from Supabase Storage.
 *
 * Inputs:
 * - userId: User ID (optional, returns null if undefined)
 *
 * Outputs:
 * - avatarUrl: Signed URL string or null
 *
 * Behavior:
 * - Fetches profile metadata for avatar_path and avatar_bucket
 * - Checks localStorage cache first (instant return if valid)
 * - Creates signed URL if cache miss
 * - Subscribes to profile changes for real-time updates
 * - Cleans up subscription on unmount
 */
export function useAvatar(userId: string | undefined): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }

    let active = true;

    const load = async () => {
      console.log("🖼️ [useAvatar] Loading avatar for user:", userId);
      const res = await getUserProfile<ProfileRow>(userId);
      if (res.error) {
        console.warn("🖼️ [useAvatar] Failed to fetch profile:", res.error);
        return;
      }

      console.log("🖼️ [useAvatar] Profile data:", res.data);

      const metadata =
        (res.data?.metadata as
          | { avatar_path?: string | null; avatar_bucket?: string | null }
          | undefined) ?? {};
      const avatarPath = metadata?.avatar_path ?? null;
      const avatarBucket = metadata?.avatar_bucket ?? "avatars";

      console.log("🖼️ [useAvatar] Avatar path:", avatarPath, "bucket:", avatarBucket);

      if (!avatarPath) {
        console.log("🖼️ [useAvatar] No avatar path found in metadata");
        if (active) setAvatarUrl(null);
        return;
      }

      // Check cache first
      const cached = readCachedAvatar(avatarBucket, avatarPath);
      if (cached) {
        console.log("🖼️ [useAvatar] Using cached URL");
        if (active) setAvatarUrl(cached);
        return;
      }

      console.log("🖼️ [useAvatar] Cache miss, creating signed URL...");
      
      // Cache miss: create signed URL
      const { data, error } = await supabase.storage
        .from(avatarBucket)
        .createSignedUrl(avatarPath, AVATAR_TTL_SECONDS);

      console.log("🖼️ [useAvatar] Signed URL result:", { signedUrl: data?.signedUrl ? "✅ Got URL" : "❌ No URL", error });

      if (!error && data?.signedUrl && active) {
        setAvatarUrl(data.signedUrl);
        writeCachedAvatar(avatarBucket, avatarPath, data.signedUrl);
      } else if (error) {
        console.error("🖼️ [useAvatar] Failed to create signed URL:", error);
      }
    };

    load();

    // Subscribe to profile changes for real-time avatar updates
    const channel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe();

    // Listen for custom avatar:updated event from ProfilePicture component
    const handleAvatarUpdate = () => load();
    window.addEventListener("avatar:updated", handleAvatarUpdate);

    return () => {
      active = false;
      channel.unsubscribe();
      window.removeEventListener("avatar:updated", handleAvatarUpdate);
    };
  }, [userId]);

  return avatarUrl;
}

export default useAvatar;
