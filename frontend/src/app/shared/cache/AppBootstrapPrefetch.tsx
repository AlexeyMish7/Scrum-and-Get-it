import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";

// Core datasets are used across multiple workspaces.
// Keep them fresh for a while to avoid repeated Supabase reads on navigation.
const CORE_STALE_TIME_MS = 60 * 60 * 1000; // 1 hour

export default function AppBootstrapPrefetch() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const lastPrefetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // StrictMode mounts effects twice in dev; avoid duplicate prefetch bursts.
    if (lastPrefetchedUserId.current === userId) return;
    lastPrefetchedUserId.current = userId;

    // Fire-and-forget prefetch: components can render immediately and read cache.
    void queryClient.prefetchQuery({
      queryKey: coreKeys.jobs(userId),
      queryFn: () => fetchCoreJobs(userId),
      staleTime: CORE_STALE_TIME_MS,
    });
  }, [queryClient, userId]);

  return null;
}
