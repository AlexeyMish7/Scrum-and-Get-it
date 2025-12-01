/**
 * ProfileChangeContext
 *
 * Tracks when user profile data changes to invalidate cached analytics.
 * Any component that modifies skills, education, employment, certifications, or projects
 * should call markProfileChanged() to trigger analytics regeneration.
 *
 * Usage:
 * - Wrap app with ProfileChangeProvider
 * - Import useProfileChange in components
 * - Call markProfileChanged() after successful profile updates
 * - Check hasProfileChanged in analytics hooks to decide cache vs regenerate
 */

/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";

interface ProfileChangeContextValue {
  /** True if profile has changed since last analytics generation */
  hasProfileChanged: boolean;
  /** Timestamp of last profile change */
  lastChangedAt: Date | null;
  /** Mark profile as changed (call after updates to skills, education, etc.) */
  markProfileChanged: () => void;
  /** Reset change flag (call after analytics regeneration) */
  resetProfileChanged: () => void;
}

const ProfileChangeContext = createContext<
  ProfileChangeContextValue | undefined
>(undefined);

const STORAGE_KEY = "profile_last_changed";

interface ProviderProps {
  children: ReactNode;
}

export function ProfileChangeProvider({ children }: ProviderProps) {
  const [hasProfileChanged, setHasProfileChanged] = useState<boolean>(() => {
    // Check localStorage for persisted change state
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const timestamp = new Date(stored);
        // Consider changed if modified in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return timestamp > thirtyDaysAgo;
      }
    } catch (e) {
      console.warn("Failed to read profile change timestamp:", e);
    }
    return false;
  });

  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Date(stored) : null;
    } catch {
      return null;
    }
  });

  const markProfileChanged = useCallback(() => {
    const now = new Date();
    setHasProfileChanged(true);
    setLastChangedAt(now);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, now.toISOString());
    } catch (e) {
      console.warn("Failed to persist profile change timestamp:", e);
    }
  }, []);

  const resetProfileChanged = useCallback(() => {
    setHasProfileChanged(false);
    // Keep lastChangedAt for reference, but clear the flag
  }, []);

  // Expose to window for debugging
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__profileChangeContext = {
      hasProfileChanged,
      lastChangedAt,
      markProfileChanged,
      resetProfileChanged,
    };
  }, [
    hasProfileChanged,
    lastChangedAt,
    markProfileChanged,
    resetProfileChanged,
  ]);

  return (
    <ProfileChangeContext.Provider
      value={{
        hasProfileChanged,
        lastChangedAt,
        markProfileChanged,
        resetProfileChanged,
      }}
    >
      {children}
    </ProfileChangeContext.Provider>
  );
}

/**
 * Hook to access profile change tracking.
 *
 * @example
 * // In a skills editor component:
 * const { markProfileChanged } = useProfileChange();
 * const handleSave = async () => {
 *   await saveSkills(data);
 *   markProfileChanged(); // Invalidate analytics cache
 * };
 *
 * @example
 * // In an analytics hook:
 * const { hasProfileChanged, resetProfileChanged } = useProfileChange();
 * if (hasProfileChanged) {
 *   // Regenerate analytics instead of using cache
 *   await generateAnalytics();
 *   resetProfileChanged();
 * }
 */
export function useProfileChange(): ProfileChangeContextValue {
  const context = useContext(ProfileChangeContext);
  if (!context) {
    throw new Error(
      "useProfileChange must be used within ProfileChangeProvider"
    );
  }
  return context;
}
