/**
 * USER-SCOPED LOCAL STORAGE UTILITY
 *
 * Purpose: Ensure localStorage data is scoped to the current user to prevent
 * data leakage between different user sessions on the same browser.
 *
 * Problem: Standard localStorage keys like "sgt:interviews" are shared across
 * all users. If User A logs out and User B logs in, User B sees User A's data.
 *
 * Solution: Prefix all user-specific keys with the user's ID:
 * - "sgt:interviews" becomes "sgt:user:{userId}:interviews"
 *
 * Usage:
 * ```ts
 * import { getUserStorage } from "@shared/utils/userStorage";
 *
 * // In a component with access to user
 * const storage = getUserStorage(user?.id);
 * const interviews = storage.get("interviews", []);
 * storage.set("interviews", updatedInterviews);
 * ```
 */

/**
 * Creates a user-scoped localStorage interface.
 * All keys are automatically prefixed with the user's ID.
 *
 * @param userId - The current user's UUID. If null/undefined, returns a no-op storage.
 * @returns Object with get, set, remove, and clear methods
 */
export function getUserStorage(userId: string | null | undefined) {
  // Build the key prefix for this user
  const prefix = userId ? `sgt:user:${userId}:` : null;

  return {
    /**
     * Get a value from user-scoped localStorage
     * @param key - The key (without user prefix)
     * @param defaultValue - Value to return if key doesn't exist
     */
    get<T>(key: string, defaultValue: T): T {
      if (!prefix) return defaultValue;

      try {
        const raw = localStorage.getItem(`${prefix}${key}`);
        if (raw === null) return defaultValue;
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Get a raw string value from user-scoped localStorage
     * @param key - The key (without user prefix)
     */
    getRaw(key: string): string | null {
      if (!prefix) return null;
      try {
        return localStorage.getItem(`${prefix}${key}`);
      } catch {
        return null;
      }
    },

    /**
     * Set a value in user-scoped localStorage
     * @param key - The key (without user prefix)
     * @param value - The value to store (will be JSON stringified)
     */
    set<T>(key: string, value: T): void {
      if (!prefix) return;

      try {
        localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
      } catch {
        // Ignore storage errors (quota exceeded, etc.)
      }
    },

    /**
     * Set a raw string value in user-scoped localStorage
     * @param key - The key (without user prefix)
     * @param value - The string value to store
     */
    setRaw(key: string, value: string): void {
      if (!prefix) return;
      try {
        localStorage.setItem(`${prefix}${key}`, value);
      } catch {
        // Ignore storage errors
      }
    },

    /**
     * Remove a key from user-scoped localStorage
     * @param key - The key (without user prefix)
     */
    remove(key: string): void {
      if (!prefix) return;

      try {
        localStorage.removeItem(`${prefix}${key}`);
      } catch {
        // Ignore errors
      }
    },

    /**
     * Get the full prefixed key (useful for event listeners)
     * @param key - The key (without user prefix)
     */
    getFullKey(key: string): string | null {
      return prefix ? `${prefix}${key}` : null;
    },

    /**
     * Check if a key exists in user-scoped localStorage
     * @param key - The key (without user prefix)
     */
    has(key: string): boolean {
      if (!prefix) return false;
      try {
        return localStorage.getItem(`${prefix}${key}`) !== null;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Migrate old unscoped localStorage data to user-scoped storage.
 * Call this once when a user logs in to move their old data.
 *
 * @param userId - The current user's UUID
 */
export function migrateToUserScopedStorage(userId: string): void {
  if (!userId) return;

  const storage = getUserStorage(userId);

  // List of keys to migrate from old format to new user-scoped format
  const keysToMigrate = [
    { oldKey: "sgt:interviews", newKey: "interviews" },
    { oldKey: "sgt:interview_reminders", newKey: "interview_reminders" },
    { oldKey: "sgt:interview_followups", newKey: "interview_followups" },
    {
      oldKey: "sgt:interview_question_practice",
      newKey: "interview_question_practice",
    },
    {
      oldKey: "sgt:technical_prep_attempts",
      newKey: "technical_prep_attempts",
    },
    { oldKey: "jobs:weeklyGoal", newKey: "weeklyGoal" },
  ];

  for (const { oldKey, newKey } of keysToMigrate) {
    try {
      const oldValue = localStorage.getItem(oldKey);

      // Only migrate if old data exists and new data doesn't
      if (oldValue !== null && !storage.has(newKey)) {
        // Parse and re-store in user-scoped location
        const parsed = JSON.parse(oldValue);
        storage.set(newKey, parsed);
        console.log(`Migrated ${oldKey} to user-scoped storage`);
      }

      // Remove old unscoped key to prevent confusion
      localStorage.removeItem(oldKey);
    } catch {
      // If migration fails, just remove old key to clean up
      try {
        localStorage.removeItem(oldKey);
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Clear all data for the current user from localStorage.
 * Useful when user explicitly wants to reset their local data.
 *
 * @param userId - The user's UUID
 */
export function clearUserStorage(userId: string): void {
  if (!userId) return;

  const prefix = `sgt:user:${userId}:`;

  try {
    // Get all keys and remove ones matching our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore errors
  }
}

export default getUserStorage;
