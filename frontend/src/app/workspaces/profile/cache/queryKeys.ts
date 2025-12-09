/**
 * PROFILE QUERY KEYS
 *
 * Centralized query key definitions for the profile workspace.
 * Using a factory pattern for type-safe, consistent cache keys.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: profileKeys.skills(userId) })
 *   useQuery({ queryKey: profileKeys.employment(userId), ... })
 */

export const profileKeys = {
  // Root key for all profile-related queries
  all: ["profile"] as const,

  // User-specific keys
  user: (userId: string) => [...profileKeys.all, userId] as const,

  // Profile header (name, email) - used by dashboard
  header: (userId: string) => [...profileKeys.user(userId), "header"] as const,

  // Full profile data (all fields) - used by ProfileDetails page
  fullProfile: (userId: string) =>
    [...profileKeys.user(userId), "fullProfile"] as const,

  // Full data queries (used by both dashboard and detail pages)
  // Each returns the complete list; dashboard derives counts from these
  skills: (userId: string) => [...profileKeys.user(userId), "skills"] as const,
  employment: (userId: string) =>
    [...profileKeys.user(userId), "employment"] as const,
  education: (userId: string) =>
    [...profileKeys.user(userId), "education"] as const,
  projects: (userId: string) =>
    [...profileKeys.user(userId), "projects"] as const,
  certifications: (userId: string) =>
    [...profileKeys.user(userId), "certifications"] as const,
} as const;

// Helper type to extract function-only keys from profileKeys
type ProfileKeyFunctions = {
  [K in keyof typeof profileKeys]: (typeof profileKeys)[K] extends (
    ...args: unknown[]
  ) => unknown
    ? K
    : never;
}[keyof typeof profileKeys];

// Type for all possible query key return values
export type ProfileQueryKey =
  | typeof profileKeys.all
  | ReturnType<(typeof profileKeys)[ProfileKeyFunctions]>;
