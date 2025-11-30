/**
 * useWellBeing.ts
 *
 * UC-113: Family and Personal Support Integration
 *
 * Custom hook for managing stress metrics and well-being analytics.
 * Provides centralized state management with caching for well-being data,
 * reducing redundant API calls and improving performance.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@shared/context/AuthContext";
import * as familySupportService from "../services/familySupportService";
import type {
  StressMetricsRow,
  StressMetricsFilters,
  StressCheckInData,
  WellBeingAnalytics,
} from "../types/familySupport.types";

// Cache configuration - 5 minutes for well-being data
const CACHE_TTL = 5 * 60 * 1000;

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Check if cache entry is still valid
function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

// Hook return type with all state and operations
interface UseWellBeingReturn {
  // State
  stressMetrics: StressMetricsRow[];
  todaysCheckIn: StressMetricsRow | null;
  analytics: WellBeingAnalytics | null;

  // Loading states
  loading: boolean;
  loadingMetrics: boolean;
  loadingAnalytics: boolean;
  submittingCheckIn: boolean;

  // Error state
  error: string | null;

  // Check-in status
  hasCheckedInToday: boolean;

  // Stress metrics operations
  loadStressMetrics: (filters?: StressMetricsFilters) => Promise<void>;
  loadTodaysCheckIn: () => Promise<void>;
  submitStressCheckIn: (data: StressCheckInData) => Promise<boolean>;

  // Analytics operations
  loadWellBeingAnalytics: (days?: number) => Promise<void>;

  // Utility
  clearError: () => void;
  refreshAll: () => Promise<void>;

  // Computed values
  currentStressLevel: string | null;
  currentMood: string | null;
  stressTrend: "improving" | "stable" | "worsening" | null;
  moodTrend: "improving" | "stable" | "worsening" | null;
}

export function useWellBeing(): UseWellBeingReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // State
  const [stressMetrics, setStressMetrics] = useState<StressMetricsRow[]>([]);
  const [todaysCheckIn, setTodaysCheckIn] = useState<StressMetricsRow | null>(
    null
  );
  const [analytics, setAnalytics] = useState<WellBeingAnalytics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Cache refs (survive re-renders)
  const metricsCache = useRef<CacheEntry<StressMetricsRow[]> | null>(null);
  const todaysCheckInCache = useRef<CacheEntry<StressMetricsRow | null> | null>(
    null
  );
  const analyticsCache = useRef<CacheEntry<WellBeingAnalytics> | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const hasCheckedInToday = todaysCheckIn !== null;
  const currentStressLevel = todaysCheckIn?.stress_level ?? null;
  const currentMood = todaysCheckIn?.mood ?? null;
  const stressTrend = analytics?.stressTrend ?? null;
  const moodTrend = analytics?.moodTrend ?? null;

  // ----- STRESS METRICS OPERATIONS -----

  // Load stress metrics with optional filters
  const loadStressMetrics = useCallback(
    async (filters?: StressMetricsFilters) => {
      if (!userId) return;

      // Only check cache if no filters
      if (!filters && isCacheValid(metricsCache.current)) {
        setStressMetrics(metricsCache.current.data);
        return;
      }

      setLoadingMetrics(true);
      setError(null);

      try {
        const result = await familySupportService.getStressMetrics(
          userId,
          filters
        );
        if (result.data) {
          setStressMetrics(result.data);
          // Only cache if no filters
          if (!filters) {
            metricsCache.current = {
              data: result.data,
              timestamp: Date.now(),
            };
          }
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading stress metrics:", err);
        setError("Failed to load stress metrics");
      } finally {
        setLoadingMetrics(false);
      }
    },
    [userId]
  );

  // Load today's check-in
  const loadTodaysCheckIn = useCallback(async () => {
    if (!userId) return;

    // Check cache - shorter TTL for today's check-in to stay current
    if (isCacheValid(todaysCheckInCache.current)) {
      setTodaysCheckIn(todaysCheckInCache.current.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await familySupportService.getTodaysCheckIn(userId);
      if (result.error) {
        setError(result.error.message);
      } else {
        // result.data can be null if no check-in today
        setTodaysCheckIn(result.data);
        todaysCheckInCache.current = {
          data: result.data,
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      console.error("Error loading today's check-in:", err);
      setError("Failed to load today's check-in");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Submit a stress check-in (create or update)
  const submitStressCheckIn = useCallback(
    async (data: StressCheckInData): Promise<boolean> => {
      if (!userId) return false;

      setSubmittingCheckIn(true);
      setError(null);

      try {
        const result = await familySupportService.submitStressCheckIn(
          userId,
          data
        );
        if (result.data) {
          // Update today's check-in
          setTodaysCheckIn(result.data);
          todaysCheckInCache.current = {
            data: result.data,
            timestamp: Date.now(),
          };
          // Invalidate metrics cache since we have new data
          metricsCache.current = null;
          // Invalidate analytics cache since data changed
          analyticsCache.current = null;
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error submitting stress check-in:", err);
        setError("Failed to submit check-in");
      } finally {
        setSubmittingCheckIn(false);
      }
      return false;
    },
    [userId]
  );

  // ----- ANALYTICS OPERATIONS -----

  // Load well-being analytics
  const loadWellBeingAnalytics = useCallback(
    async (days: number = 30) => {
      if (!userId) return;

      // Check cache
      if (isCacheValid(analyticsCache.current)) {
        setAnalytics(analyticsCache.current.data);
        return;
      }

      setLoadingAnalytics(true);
      setError(null);

      try {
        const result = await familySupportService.getWellBeingAnalytics(
          userId,
          days
        );
        if (result.data) {
          setAnalytics(result.data);
          analyticsCache.current = { data: result.data, timestamp: Date.now() };
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading well-being analytics:", err);
        setError("Failed to load well-being analytics");
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [userId]
  );

  // ----- UTILITY -----

  // Refresh all data by clearing caches and reloading
  const refreshAll = useCallback(async () => {
    // Clear all caches
    metricsCache.current = null;
    todaysCheckInCache.current = null;
    analyticsCache.current = null;

    // Reload all data in parallel
    await Promise.all([
      loadStressMetrics(),
      loadTodaysCheckIn(),
      loadWellBeingAnalytics(),
    ]);
  }, [loadStressMetrics, loadTodaysCheckIn, loadWellBeingAnalytics]);

  // Load initial data when user is available
  useEffect(() => {
    if (userId) {
      loadTodaysCheckIn();
      loadWellBeingAnalytics();
    }
  }, [userId, loadTodaysCheckIn, loadWellBeingAnalytics]);

  return {
    // State
    stressMetrics,
    todaysCheckIn,
    analytics,

    // Loading states
    loading,
    loadingMetrics,
    loadingAnalytics,
    submittingCheckIn,

    // Error state
    error,

    // Check-in status
    hasCheckedInToday,

    // Stress metrics operations
    loadStressMetrics,
    loadTodaysCheckIn,
    submitStressCheckIn,

    // Analytics operations
    loadWellBeingAnalytics,

    // Utility
    clearError,
    refreshAll,

    // Computed values
    currentStressLevel,
    currentMood,
    stressTrend,
    moodTrend,
  };
}

export default useWellBeing;
