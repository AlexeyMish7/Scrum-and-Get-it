/**
 * SUPABASE REALTIME CACHE SYNC
 *
 * Hook that subscribes to Supabase Realtime changes and invalidates
 * react-query cache when profile-related tables are modified.
 *
 * This enables real-time updates when:
 * - Another browser tab makes changes
 * - Server-side processes update data
 * - Mobile app syncs data
 *
 * Tables monitored:
 * - profiles
 * - skills
 * - employment
 * - education
 * - projects
 * - documents
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/services/supabaseClient";
import { useAuth } from "@shared/context/AuthContext";
import { profileKeys } from "./queryKeys";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Tables to monitor for changes
const PROFILE_TABLES = [
  "profiles",
  "skills",
  "employment",
  "education",
  "projects",
  "certifications",
] as const;

type ProfileTable = (typeof PROFILE_TABLES)[number];

// Map table names to query key factory functions
// Now using unified keys (one query per data type)
type ProfileKeyFunction = Exclude<keyof typeof profileKeys, "all" | "user">;
const TABLE_TO_QUERY_KEYS: Record<ProfileTable, ProfileKeyFunction[]> = {
  profiles: ["header"],
  skills: ["skills"],
  employment: ["employment"],
  education: ["education"],
  projects: ["projects"],
  certifications: ["certifications"],
};

interface UseRealtimeSyncOptions {
  /** Enable/disable realtime sync (default: true) */
  enabled?: boolean;
  /** Log realtime events to console (default: false in production) */
  debug?: boolean;
}

/**
 * Hook that syncs Supabase Realtime changes with react-query cache.
 * Automatically invalidates relevant queries when data changes in the database.
 *
 * @param options - Configuration options
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const { enabled = true, debug = process.env.NODE_ENV === "development" } =
    options;

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!enabled || !userId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      // Create a channel for profile data changes
      channel = supabase.channel(`profile-changes-${userId}`);

      // Subscribe to each table
      PROFILE_TABLES.forEach((table) => {
        channel!.on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table,
            filter: `user_id=eq.${userId}`,
          },
          (
            payload: RealtimePostgresChangesPayload<Record<string, unknown>>
          ) => {
            const queryKeyNames = TABLE_TO_QUERY_KEYS[table];

            if (debug) {
              console.log(
                `[RealtimeSync] ${payload.eventType} on ${table}`,
                payload
              );
            }

            // Invalidate all related queries (both count and list)
            queryKeyNames.forEach((keyName) => {
              const queryKey = profileKeys[keyName](userId);
              if (debug) {
                console.log(`[RealtimeSync] Invalidating query:`, queryKey);
              }
              queryClient.invalidateQueries({ queryKey });
            });

            // Also dispatch window event for backward compatibility
            const eventName = `${
              table === "profiles" ? "profile" : table
            }:changed`;
            window.dispatchEvent(new CustomEvent(eventName));
          }
        );
      });

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (debug) {
          console.log(`[RealtimeSync] Subscription status: ${status}`);
        }
      });
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        if (debug) {
          console.log("[RealtimeSync] Unsubscribing from channel");
        }
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, userId, queryClient, debug]);
}

/**
 * Hook that provides manual cache invalidation utilities.
 * Useful for triggering refreshes after mutations.
 */
export function useProfileCacheUtils() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return {
    /** Invalidate all profile queries for the current user */
    invalidateAll: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
    },

    /** Invalidate specific profile query */
    invalidate: (key: keyof typeof profileKeys) => {
      if (!userId) return;
      const queryKey =
        key === "all" ? profileKeys.all : profileKeys[key](userId);
      queryClient.invalidateQueries({ queryKey });
    },

    /** Prefetch a query (useful before navigation) */
    prefetch: async (
      key: Exclude<keyof typeof profileKeys, "all" | "user">,
      queryFn: () => Promise<unknown>
    ) => {
      if (!userId) return;
      await queryClient.prefetchQuery({
        queryKey: profileKeys[key](userId),
        queryFn,
      });
    },

    /** Clear all profile cache (logout, user switch) */
    clearAll: () => {
      queryClient.removeQueries({ queryKey: profileKeys.all });
    },
  };
}

export default useRealtimeSync;
