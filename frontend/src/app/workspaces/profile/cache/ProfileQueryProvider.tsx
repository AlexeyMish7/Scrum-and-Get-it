/**
 * PROFILE CACHE INVALIDATION PROVIDER
 *
 * Sets up profile-specific cache invalidation logic.
 * The QueryClient is now provided at app level (AppQueryProvider).
 *
 * This component handles:
 * - Event-based cache invalidation for profile changes
 * - Supabase realtime sync for cross-tab updates
 */
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { profileKeys } from "./queryKeys";
import { unifiedProfileKeys } from "./useUnifiedProfileCache";
import { useRealtimeSync } from "./useRealtimeSync";

/**
 * Hook to set up event-based cache invalidation.
 * Listens for profile change events and invalidates relevant queries.
 */
function useProfileCacheInvalidation(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Map window events to query keys for invalidation
    const eventKeyMap: Record<string, readonly string[]> = {
      "skills:changed": profileKeys.skills(userId),
      "employment:changed": profileKeys.employment(userId),
      "education:changed": profileKeys.education(userId),
      "projects:changed": profileKeys.projects(userId),
      "profile:changed": profileKeys.header(userId),
      "certifications:changed": profileKeys.certifications(userId),
    };

    // Create handlers for each event
    const handlers = Object.entries(eventKeyMap).map(([event, queryKey]) => {
      const handler = () => {
        console.log(`[ProfileCache] Invalidating ${event}`, queryKey);
        queryClient.invalidateQueries({
          queryKey: unifiedProfileKeys.user(userId),
        });
        queryClient.invalidateQueries({ queryKey });
      };
      window.addEventListener(event, handler);
      return { event, handler };
    });

    // Cleanup on unmount
    return () => {
      handlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [queryClient, userId]);
}

interface ProfileQueryProviderProps {
  children: ReactNode;
}

/**
 * Provider component that sets up profile-specific cache invalidation.
 * The QueryClient is provided at app level, so this just adds the invalidation logic.
 */
export function ProfileQueryProvider({ children }: ProfileQueryProviderProps) {
  const { user } = useAuth();

  // Set up event-based cache invalidation (for local mutations)
  useProfileCacheInvalidation(user?.id);

  // Set up Supabase realtime sync (for cross-tab/device updates)
  useRealtimeSync({ enabled: !!user?.id });

  return <>{children}</>;
}

export default ProfileQueryProvider;
