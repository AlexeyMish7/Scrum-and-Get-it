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
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import localforage from "localforage";
import { type ReactNode, useMemo } from "react";
import { shouldPersistQueryKey } from "@shared/cache/persistencePolicy";
import { getAppQueryClient } from "@shared/cache/AppQueryClient";

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

// Default persistence maxAge for allowlisted queries.
// Keep this reasonably short to avoid serving stale data across sessions.
const DEFAULT_CACHE_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Persisting everything can grow IndexedDB quickly when query keys are high-cardinality
// (e.g., per-job/per-contact datasets). We persist only a small set of “core” lists that
// are broadly reused across the app and are relatively bounded in size.

interface AppQueryProviderProps {
  children: ReactNode;
  /** Enable IndexedDB persistence (default: true in production) */
  enablePersistence?: boolean;
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
  const queryClient = useMemo(() => getAppQueryClient(), []);

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
            // And only persist a small allowlist of low-cardinality datasets.
            shouldDehydrateQuery: (query) =>
              query.state.status === "success" &&
              shouldPersistQueryKey(query.queryKey),
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

export default AppQueryProvider;
