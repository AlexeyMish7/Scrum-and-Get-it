/**
 * APP-LEVEL QUERY PROVIDER
 *
 * Global QueryClient + Provider for the entire application.
 * This ensures cache persists across all workspaces (Profile, Teams, Jobs, etc.)
 *
 * Features:
 * - Single QueryClient instance for entire app
 * - Optional persistence to IndexedDB via localforage
 * - React Query DevTools in development (controlled by VITE_DEV_MODE)
 * - Configurable stale/cache times
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import localforage from "localforage";
import { type ReactNode, useMemo } from "react";

// Check if dev tools should be shown (same logic as ApiLogDebugProvider)
const isDevToolsEnabled = () => {
  const viteDevMode = import.meta.env.DEV;
  const explicitDevMode = import.meta.env.VITE_DEV_MODE;
  // If VITE_DEV_MODE is explicitly set to "false", hide dev tools
  if (explicitDevMode === "false") return false;
  return viteDevMode;
};

// Configure localforage for app-wide cache persistence
const appStorage = localforage.createInstance({
  name: "flowats-cache",
  storeName: "app_queries",
});

// Custom persister using localforage (IndexedDB)
const asyncStoragePersister = {
  persistClient: async (client: unknown) => {
    await appStorage.setItem("queryClient", client);
  },
  restoreClient: async () => {
    return await appStorage.getItem("queryClient");
  },
  removeClient: async () => {
    await appStorage.removeItem("queryClient");
  },
};

// Default cache configuration
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

interface AppQueryProviderProps {
  children: ReactNode;
  /** Enable IndexedDB persistence (default: true in production) */
  enablePersistence?: boolean;
}

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

function getQueryClient(): QueryClient {
  if (!appQueryClient) {
    appQueryClient = createAppQueryClient();
  }
  return appQueryClient;
}

/**
 * App-level provider that wraps the entire application with QueryClient.
 * Place this in main.tsx to enable caching across all workspaces.
 */
export function AppQueryProvider({
  children,
  enablePersistence = import.meta.env.PROD,
}: AppQueryProviderProps) {
  // Use singleton QueryClient
  const queryClient = useMemo(() => getQueryClient(), []);

  // Render with or without persistence
  if (enablePersistence) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister as Parameters<
            typeof PersistQueryClientProvider
          >[0]["persistOptions"]["persister"],
          maxAge: DEFAULT_CACHE_TIME,
          dehydrateOptions: {
            // Only persist successful queries
            shouldDehydrateQuery: (query) => query.state.status === "success",
          },
        }}
      >
        {children}
        {isDevToolsEnabled() && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevToolsEnabled() && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Get the app-level QueryClient for manual cache operations.
 * Use this when you need to invalidate queries from outside React components.
 */
export function getAppQueryClient(): QueryClient {
  return getQueryClient();
}

export default AppQueryProvider;
