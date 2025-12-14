import { QueryClient } from "@tanstack/react-query";

// Default cache configuration
const DEFAULT_STALE_TIME = 15 * 60 * 1000; // 15 minutes
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Creates a QueryClient with app-wide defaults.
 */
function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes
        staleTime: DEFAULT_STALE_TIME,
        // Keep unused data in cache for 30 minutes
        gcTime: DEFAULT_CACHE_TIME,
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
        // Retry failed requests once
        retry: 1,
        // Keep previous data while fetching new data
        placeholderData: (prev: unknown) => prev,
      },
    },
  });
}

// Singleton QueryClient instance - created once for entire app
let appQueryClient: QueryClient | null = null;

/**
 * Get the app-level QueryClient for manual cache operations.
 * Use this when you need to read/write/invalidate queries from outside React components.
 */
export function getAppQueryClient(): QueryClient {
  if (!appQueryClient) {
    appQueryClient = createAppQueryClient();
  }
  return appQueryClient;
}
