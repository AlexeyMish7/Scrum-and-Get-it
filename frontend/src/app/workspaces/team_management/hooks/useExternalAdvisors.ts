/**
 * UC-115: External Advisor and Coach Integration
 * Custom hook for managing external advisors
 *
 * Purpose:
 * - Manage advisor relationships (invite, update, remove)
 * - Track dashboard summary and impact metrics
 * - Provide loading and error states
 */

import { useState, useEffect, useCallback } from "react";
import * as advisorService from "../services/advisorService";
import type {
  ExternalAdvisor,
  InviteAdvisorData,
  UpdateAdvisorData,
  UpdateAdvisorPermissionsData,
  AdvisorFilters,
  AdvisorDashboardSummary,
  AdvisorImpactMetrics,
} from "../types/advisor.types";

interface UseExternalAdvisorsState {
  advisors: ExternalAdvisor[];
  loading: boolean;
  error: string | null;
  summary: AdvisorDashboardSummary | null;
  impact: AdvisorImpactMetrics[];
}

interface UseExternalAdvisorsReturn extends UseExternalAdvisorsState {
  // CRUD operations
  inviteAdvisor: (data: InviteAdvisorData) => Promise<boolean>;
  updateAdvisor: (
    advisorId: string,
    data: UpdateAdvisorData
  ) => Promise<boolean>;
  updatePermissions: (
    advisorId: string,
    permissions: UpdateAdvisorPermissionsData
  ) => Promise<boolean>;
  removeAdvisor: (advisorId: string) => Promise<boolean>;
  resendInvitation: (advisorId: string) => Promise<boolean>;

  // Data fetching
  refreshAdvisors: (filters?: AdvisorFilters) => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshImpact: (advisorId?: string) => Promise<void>;

  // Utilities
  getAdvisorById: (advisorId: string) => ExternalAdvisor | undefined;
  clearError: () => void;
}

/**
 * Hook for managing external advisors
 * Provides CRUD operations and dashboard data
 */
export function useExternalAdvisors(
  initialFilters?: AdvisorFilters
): UseExternalAdvisorsReturn {
  const [state, setState] = useState<UseExternalAdvisorsState>({
    advisors: [],
    loading: true,
    error: null,
    summary: null,
    impact: [],
  });

  // Fetch advisors with optional filters
  const refreshAdvisors = useCallback(async (filters?: AdvisorFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const result = await advisorService.getAdvisors(filters);

    if (result.data) {
      setState((prev) => ({
        ...prev,
        advisors: result.data!,
        loading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error?.message ?? "Failed to fetch advisors",
        loading: false,
      }));
    }
  }, []);

  // Fetch dashboard summary
  const refreshSummary = useCallback(async () => {
    const result = await advisorService.getDashboardSummary();

    if (result.data) {
      setState((prev) => ({
        ...prev,
        summary: result.data,
      }));
    }
  }, []);

  // Fetch advisor impact metrics
  const refreshImpact = useCallback(async (advisorId?: string) => {
    const result = await advisorService.getAdvisorImpact(advisorId);

    if (result.data) {
      setState((prev) => ({
        ...prev,
        impact: result.data!,
      }));
    }
  }, []);

  // Invite a new advisor
  const inviteAdvisor = useCallback(
    async (data: InviteAdvisorData): Promise<boolean> => {
      const result = await advisorService.inviteAdvisor(data);

      if (result.data) {
        // Add new advisor to state
        setState((prev) => ({
          ...prev,
          advisors: [result.data!, ...prev.advisors],
        }));
        // Refresh summary to update counts
        refreshSummary();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to invite advisor",
        }));
        return false;
      }
    },
    [refreshSummary]
  );

  // Update advisor details
  const updateAdvisor = useCallback(
    async (advisorId: string, data: UpdateAdvisorData): Promise<boolean> => {
      const result = await advisorService.updateAdvisor(advisorId, data);

      if (result.data) {
        // Update advisor in state
        setState((prev) => ({
          ...prev,
          advisors: prev.advisors.map((a) =>
            a.id === advisorId ? result.data! : a
          ),
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to update advisor",
        }));
        return false;
      }
    },
    []
  );

  // Update advisor permissions
  const updatePermissions = useCallback(
    async (
      advisorId: string,
      permissions: UpdateAdvisorPermissionsData
    ): Promise<boolean> => {
      const result = await advisorService.updateAdvisorPermissions(
        advisorId,
        permissions
      );

      if (result.data) {
        setState((prev) => ({
          ...prev,
          advisors: prev.advisors.map((a) =>
            a.id === advisorId ? result.data! : a
          ),
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to update permissions",
        }));
        return false;
      }
    },
    []
  );

  // Remove advisor relationship
  const removeAdvisor = useCallback(
    async (advisorId: string): Promise<boolean> => {
      const result = await advisorService.removeAdvisor(advisorId);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          advisors: prev.advisors.filter((a) => a.id !== advisorId),
        }));
        refreshSummary();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to remove advisor",
        }));
        return false;
      }
    },
    [refreshSummary]
  );

  // Resend invitation
  const resendInvitation = useCallback(
    async (advisorId: string): Promise<boolean> => {
      const result = await advisorService.resendInvitation(advisorId);

      if (result.error) {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to resend invitation",
        }));
        return false;
      }

      return true;
    },
    []
  );

  // Get advisor by ID from current state
  const getAdvisorById = useCallback(
    (advisorId: string): ExternalAdvisor | undefined => {
      return state.advisors.find((a) => a.id === advisorId);
    },
    [state.advisors]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshAdvisors(initialFilters);
    refreshSummary();
    refreshImpact();
  }, [refreshAdvisors, refreshSummary, refreshImpact, initialFilters]);

  return {
    ...state,
    inviteAdvisor,
    updateAdvisor,
    updatePermissions,
    removeAdvisor,
    resendInvitation,
    refreshAdvisors,
    refreshSummary,
    refreshImpact,
    getAdvisorById,
    clearError,
  };
}
