/**
 * useProgressSharing Hook (UC-111)
 *
 * Custom hook for managing progress sharing state across components.
 * Provides centralized access to progress data, settings, partnerships,
 * and achievements with caching and refetch capabilities.
 *
 * Purpose:
 * - Centralize progress sharing data management
 * - Provide loading and error states
 * - Enable data refresh on demand
 * - Share state between components efficiently
 *
 * Usage:
 *   const {
 *     snapshots,
 *     settings,
 *     partnerships,
 *     achievements,
 *     loading,
 *     error,
 *     refetch,
 *     createSnapshot,
 *     updateSettings,
 *   } = useProgressSharing(userId, teamId);
 */

import { useState, useEffect, useCallback } from "react";
import * as progressSharingService from "../services/progressSharingService";
import type {
  ProgressSnapshot,
  ProgressSharingSettings,
  AccountabilityPartnership,
  AchievementCelebration,
  SharingVisibility,
  UpdateSharingSettingsData,
} from "../services/progressSharingService";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UseProgressSharingOptions {
  /** Auto-fetch data on mount. Defaults to true */
  autoFetch?: boolean;
  /** Number of snapshots to fetch. Defaults to 10 */
  snapshotLimit?: number;
  /** Number of achievements to fetch. Defaults to 20 */
  achievementLimit?: number;
}

interface UseProgressSharingResult {
  /** Progress snapshots for the user */
  snapshots: ProgressSnapshot[];
  /** Current sharing settings */
  settings: ProgressSharingSettings | null;
  /** Active accountability partnerships */
  partnerships: AccountabilityPartnership[];
  /** Recent achievements/celebrations */
  achievements: AchievementCelebration[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message if data fetch failed */
  error: string | null;
  /** Refetch all data */
  refetch: () => Promise<void>;
  /** Create a new progress snapshot - returns snapshot ID */
  createSnapshot: (
    periodType: "daily" | "weekly" | "monthly"
  ) => Promise<string | null>;
  /** Update sharing settings */
  updateSettings: (
    updates: UpdateSharingSettingsData
  ) => Promise<ProgressSharingSettings | null>;
  /** Update visibility level */
  updateVisibility: (
    visibility: SharingVisibility
  ) => Promise<ProgressSharingSettings | null>;
  /** Send encouragement to a partner */
  sendEncouragement: (partnershipId: string) => Promise<boolean>;
  /** Check in with a partner */
  checkIn: (partnershipId: string) => Promise<boolean>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useProgressSharing(
  userId: string | undefined,
  teamId: string | undefined,
  options: UseProgressSharingOptions = {}
): UseProgressSharingResult {
  const {
    autoFetch = true,
    snapshotLimit = 10,
    achievementLimit = 20,
  } = options;

  // State
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [settings, setSettings] = useState<ProgressSharingSettings | null>(
    null
  );
  const [partnerships, setPartnerships] = useState<AccountabilityPartnership[]>(
    []
  );
  const [achievements, setAchievements] = useState<AchievementCelebration[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all progress sharing data in parallel
   */
  const fetchData = useCallback(async () => {
    if (!userId || !teamId) {
      setSnapshots([]);
      setSettings(null);
      setPartnerships([]);
      setAchievements([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for efficiency
      const [
        snapshotsResult,
        settingsResult,
        partnershipsResult,
        achievementsResult,
      ] = await Promise.all([
        progressSharingService.getProgressSnapshots(userId, teamId, {
          limit: snapshotLimit,
        }),
        progressSharingService.getProgressSharingSettings(userId, teamId),
        progressSharingService.getActivePartnerships(userId, teamId),
        progressSharingService.getAchievements(userId, teamId, {
          limit: achievementLimit,
        }),
      ]);

      // Handle errors but continue with what we got
      if (snapshotsResult.error) {
        console.warn("Failed to load snapshots:", snapshotsResult.error);
      } else {
        setSnapshots(snapshotsResult.data || []);
      }

      if (settingsResult.error) {
        console.warn("Failed to load settings:", settingsResult.error);
      } else {
        setSettings(settingsResult.data || null);
      }

      if (partnershipsResult.error) {
        console.warn("Failed to load partnerships:", partnershipsResult.error);
      } else {
        setPartnerships(partnershipsResult.data || []);
      }

      if (achievementsResult.error) {
        console.warn("Failed to load achievements:", achievementsResult.error);
      } else {
        setAchievements(achievementsResult.data || []);
      }

      // Set error only if all requests failed
      if (
        snapshotsResult.error &&
        settingsResult.error &&
        partnershipsResult.error &&
        achievementsResult.error
      ) {
        setError("Failed to load progress data. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching progress sharing data:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId, teamId, snapshotLimit, achievementLimit]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Create a new progress snapshot
   * Returns the snapshot ID on success, null on failure
   */
  const createSnapshot = useCallback(
    async (
      periodType: "daily" | "weekly" | "monthly"
    ): Promise<string | null> => {
      if (!userId || !teamId) return null;

      const result = await progressSharingService.createProgressSnapshot(
        userId,
        teamId,
        periodType
      );

      if (result.error) {
        console.error("Failed to create snapshot:", result.error);
        return null;
      }

      // Refetch snapshots to include the new one
      if (result.data) {
        const snapshotsResult =
          await progressSharingService.getProgressSnapshots(userId, teamId, {
            limit: snapshotLimit,
          });
        if (snapshotsResult.data) {
          setSnapshots(snapshotsResult.data);
        }
      }

      return result.data || null;
    },
    [userId, teamId, snapshotLimit]
  );

  /**
   * Update sharing settings
   */
  const updateSettings = useCallback(
    async (
      updates: UpdateSharingSettingsData
    ): Promise<ProgressSharingSettings | null> => {
      if (!userId || !teamId) return null;

      const result = await progressSharingService.updateProgressSharingSettings(
        userId,
        teamId,
        updates
      );

      if (result.error) {
        console.error("Failed to update settings:", result.error);
        return null;
      }

      if (result.data) {
        setSettings(result.data);
      }

      return result.data || null;
    },
    [userId, teamId]
  );

  /**
   * Quick update for visibility level only
   */
  const updateVisibility = useCallback(
    async (
      visibility: SharingVisibility
    ): Promise<ProgressSharingSettings | null> => {
      return updateSettings({ visibility });
    },
    [updateSettings]
  );

  /**
   * Send encouragement to an accountability partner
   */
  const sendEncouragement = useCallback(
    async (partnershipId: string): Promise<boolean> => {
      const result = await progressSharingService.recordPartnerInteraction(
        partnershipId,
        true // isEncouragement
      );

      if (result.error) {
        console.error("Failed to send encouragement:", result.error);
        return false;
      }

      // Refresh partnerships to get updated data
      if (userId && teamId) {
        const partnershipsResult =
          await progressSharingService.getActivePartnerships(userId, teamId);
        if (partnershipsResult.data) {
          setPartnerships(partnershipsResult.data);
        }
      }

      return result.data ?? false;
    },
    [userId, teamId]
  );

  /**
   * Check in with an accountability partner
   */
  const checkIn = useCallback(
    async (partnershipId: string): Promise<boolean> => {
      const result = await progressSharingService.recordPartnerInteraction(
        partnershipId,
        false // not encouragement = check-in
      );

      if (result.error) {
        console.error("Failed to check in:", result.error);
        return false;
      }

      // Refresh partnerships to get updated data
      if (userId && teamId) {
        const partnershipsResult =
          await progressSharingService.getActivePartnerships(userId, teamId);
        if (partnershipsResult.data) {
          setPartnerships(partnershipsResult.data);
        }
      }

      return result.data ?? false;
    },
    [userId, teamId]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    snapshots,
    settings,
    partnerships,
    achievements,
    loading,
    error,
    refetch: fetchData,
    createSnapshot,
    updateSettings,
    updateVisibility,
    sendEncouragement,
    checkIn,
  };
}
