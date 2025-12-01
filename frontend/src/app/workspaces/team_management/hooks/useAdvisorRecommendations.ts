/**
 * UC-115: External Advisor and Coach Integration
 * Custom hook for managing advisor recommendations
 *
 * Purpose:
 * - Track advisor recommendations
 * - Manage implementation progress
 * - Measure recommendation impact
 */

import { useState, useEffect, useCallback } from "react";
import * as advisorService from "../services/advisorService";
import type {
  AdvisorRecommendation,
  PendingRecommendation,
  CreateRecommendationData,
  UpdateRecommendationData,
  RecommendationFilters,
} from "../types/advisor.types";

interface UseAdvisorRecommendationsState {
  recommendations: AdvisorRecommendation[];
  pendingRecommendations: PendingRecommendation[];
  loading: boolean;
  error: string | null;
}

interface UseAdvisorRecommendationsReturn
  extends UseAdvisorRecommendationsState {
  // CRUD operations
  createRecommendation: (data: CreateRecommendationData) => Promise<boolean>;
  updateRecommendation: (
    id: string,
    data: UpdateRecommendationData
  ) => Promise<boolean>;
  deleteRecommendation: (id: string) => Promise<boolean>;
  markAsImplemented: (
    id: string,
    impact?: string,
    rating?: number
  ) => Promise<boolean>;

  // Data fetching
  refreshRecommendations: (filters?: RecommendationFilters) => Promise<void>;
  refreshPending: () => Promise<void>;

  // Utilities
  getRecommendationById: (id: string) => AdvisorRecommendation | undefined;
  clearError: () => void;
}

/**
 * Hook for managing advisor recommendations
 * Tracks advice implementation and impact
 */
export function useAdvisorRecommendations(
  initialFilters?: RecommendationFilters
): UseAdvisorRecommendationsReturn {
  const [state, setState] = useState<UseAdvisorRecommendationsState>({
    recommendations: [],
    pendingRecommendations: [],
    loading: true,
    error: null,
  });

  // Fetch recommendations with optional filters
  const refreshRecommendations = useCallback(
    async (filters?: RecommendationFilters) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await advisorService.getRecommendations(filters);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          recommendations: result.data!,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to fetch recommendations",
          loading: false,
        }));
      }
    },
    []
  );

  // Fetch pending recommendations
  const refreshPending = useCallback(async () => {
    const result = await advisorService.getPendingRecommendations();

    if (result.data) {
      setState((prev) => ({
        ...prev,
        pendingRecommendations: result.data!,
      }));
    }
  }, []);

  // Create a new recommendation
  const createRecommendation = useCallback(
    async (data: CreateRecommendationData): Promise<boolean> => {
      const result = await advisorService.createRecommendation(data);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          recommendations: [result.data!, ...prev.recommendations],
        }));
        refreshPending();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to create recommendation",
        }));
        return false;
      }
    },
    [refreshPending]
  );

  // Update recommendation
  const updateRecommendation = useCallback(
    async (id: string, data: UpdateRecommendationData): Promise<boolean> => {
      const result = await advisorService.updateRecommendation(id, data);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          recommendations: prev.recommendations.map((r) =>
            r.id === id ? result.data! : r
          ),
        }));
        // Refresh pending if status changed
        if (data.status) {
          refreshPending();
        }
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to update recommendation",
        }));
        return false;
      }
    },
    [refreshPending]
  );

  // Delete recommendation
  const deleteRecommendation = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await advisorService.deleteRecommendation(id);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.id !== id),
        }));
        refreshPending();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to delete recommendation",
        }));
        return false;
      }
    },
    [refreshPending]
  );

  // Mark recommendation as implemented with optional impact details
  const markAsImplemented = useCallback(
    async (id: string, impact?: string, rating?: number): Promise<boolean> => {
      return updateRecommendation(id, {
        status: "implemented",
        actual_impact: impact,
        impact_rating: rating,
      });
    },
    [updateRecommendation]
  );

  // Get recommendation by ID from current state
  const getRecommendationById = useCallback(
    (id: string): AdvisorRecommendation | undefined => {
      return state.recommendations.find((r) => r.id === id);
    },
    [state.recommendations]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshRecommendations(initialFilters);
    refreshPending();
  }, [refreshRecommendations, refreshPending, initialFilters]);

  return {
    ...state,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    markAsImplemented,
    refreshRecommendations,
    refreshPending,
    getRecommendationById,
    clearError,
  };
}
