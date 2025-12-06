/**
 * Workspace Cache Configuration
 *
 * Each workspace can define its own React Query timings. Updating this file
 * lets you tune how aggressively data is refetched for specific areas of the
 * application without sprinkling constants across providers.
 */
export type WorkspaceCacheKey =
  | "ai_workspace"
  | "interview_hub"
  | "job_pipeline"
  | "network_hub"
  | "profile"
  | "team_management";

export interface WorkspaceCacheConfig {
  staleTime: number;
  cacheTime: number;
  enablePersistence: boolean;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const workspaceCacheDefaults: Record<
  WorkspaceCacheKey,
  WorkspaceCacheConfig
> = {
  ai_workspace: {
    staleTime: FIVE_MINUTES,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
  interview_hub: {
    staleTime: FIVE_MINUTES,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
  job_pipeline: {
    staleTime: TEN_MINUTES,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
  network_hub: {
    staleTime: TEN_MINUTES,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
  profile: {
    staleTime: 15 * 60 * 1000,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
  team_management: {
    staleTime: FIVE_MINUTES,
    cacheTime: THIRTY_MINUTES,
    enablePersistence: true,
  },
};
