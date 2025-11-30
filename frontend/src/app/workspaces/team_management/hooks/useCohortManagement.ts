/**
 * useCohortManagement Hook
 *
 * State management for cohort-specific operations.
 * Provides CRUD operations and member management for cohorts.
 */

import { useState, useCallback } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as enterpriseService from "../services/enterpriseService";
import type {
  CohortRow,
  CohortWithMembers,
  CohortMemberRow,
  CreateCohortData,
  UpdateCohortData,
  AddCohortMembersData,
  UpdateCohortMemberData,
  OnboardingJobWithProgress,
  CreateBulkOnboardingData,
} from "../types/enterprise.types";

interface CohortManagementState {
  // Data
  cohorts: CohortRow[];
  currentCohort: CohortWithMembers | null;
  onboardingJobs: OnboardingJobWithProgress[];

  // Loading states
  loading: boolean;
  loadingCohort: boolean;
  loadingJobs: boolean;
  saving: boolean;

  // Errors
  error: string | null;
}

interface CohortManagementActions {
  // Cohort CRUD
  fetchCohorts: () => Promise<void>;
  fetchCohort: (cohortId: string) => Promise<void>;
  createCohort: (
    data: CreateCohortData
  ) => Promise<{ ok: boolean; cohort?: CohortRow; error?: string }>;
  updateCohort: (
    cohortId: string,
    data: UpdateCohortData
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteCohort: (cohortId: string) => Promise<{ ok: boolean; error?: string }>;
  activateCohort: (
    cohortId: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Member management
  addMembers: (
    cohortId: string,
    data: AddCohortMembersData
  ) => Promise<{ ok: boolean; error?: string }>;
  updateMember: (
    memberId: string,
    data: UpdateCohortMemberData
  ) => Promise<{ ok: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ ok: boolean; error?: string }>;
  recordPlacement: (
    memberId: string,
    placement: { company: string; role: string; salary?: number }
  ) => Promise<{ ok: boolean; error?: string }>;

  // Bulk onboarding
  fetchOnboardingJobs: () => Promise<void>;
  createOnboardingJob: (
    data: CreateBulkOnboardingData
  ) => Promise<{ ok: boolean; jobId?: string; error?: string }>;

  // State management
  clearCurrentCohort: () => void;
  clearError: () => void;
}

export interface UseCohortManagementReturn
  extends CohortManagementState,
    CohortManagementActions {}

/**
 * Hook for managing cohorts and their members
 */
export function useCohortManagement(): UseCohortManagementReturn {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const [state, setState] = useState<CohortManagementState>({
    cohorts: [],
    currentCohort: null,
    onboardingJobs: [],
    loading: false,
    loadingCohort: false,
    loadingJobs: false,
    saving: false,
    error: null,
  });

  /**
   * Fetch all cohorts for the current team
   */
  const fetchCohorts = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await enterpriseService.getTeamCohorts(currentTeam.id);

      if (result.error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error?.message || "Failed to fetch cohorts",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        cohorts: result.data || [],
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch cohorts",
      }));
    }
  }, [currentTeam]);

  /**
   * Fetch a specific cohort with members
   */
  const fetchCohort = useCallback(async (cohortId: string) => {
    setState((prev) => ({ ...prev, loadingCohort: true, error: null }));

    try {
      const result = await enterpriseService.getCohort(cohortId);

      if (result.error) {
        setState((prev) => ({
          ...prev,
          loadingCohort: false,
          error: result.error?.message || "Failed to fetch cohort",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        currentCohort: result.data,
        loadingCohort: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingCohort: false,
        error: err instanceof Error ? err.message : "Failed to fetch cohort",
      }));
    }
  }, []);

  /**
   * Create a new cohort
   */
  const createCohort = useCallback(
    async (
      data: CreateCohortData
    ): Promise<{ ok: boolean; cohort?: CohortRow; error?: string }> => {
      if (!currentTeam || !user) {
        return { ok: false, error: "No team or user" };
      }

      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.createCohort(
          user.id,
          currentTeam.id,
          data
        );

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Add to local state
        setState((prev) => ({
          ...prev,
          cohorts: [result.data as CohortRow, ...prev.cohorts],
          saving: false,
        }));

        return { ok: true, cohort: result.data as CohortRow };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to create cohort",
        };
      }
    },
    [currentTeam, user]
  );

  /**
   * Update a cohort
   */
  const updateCohort = useCallback(
    async (
      cohortId: string,
      data: UpdateCohortData
    ): Promise<{ ok: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.updateCohort(cohortId, data);

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          cohorts: prev.cohorts.map((c) =>
            c.id === cohortId ? { ...c, ...result.data } : c
          ),
          currentCohort:
            prev.currentCohort?.id === cohortId
              ? { ...prev.currentCohort, ...result.data }
              : prev.currentCohort,
          saving: false,
        }));

        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to update cohort",
        };
      }
    },
    []
  );

  /**
   * Delete (archive) a cohort
   */
  const deleteCohort = useCallback(
    async (cohortId: string): Promise<{ ok: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.deleteCohort(cohortId);

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Remove from local state
        setState((prev) => ({
          ...prev,
          cohorts: prev.cohorts.filter((c) => c.id !== cohortId),
          currentCohort:
            prev.currentCohort?.id === cohortId ? null : prev.currentCohort,
          saving: false,
        }));

        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to delete cohort",
        };
      }
    },
    []
  );

  /**
   * Activate a draft cohort
   */
  const activateCohort = useCallback(
    async (cohortId: string): Promise<{ ok: boolean; error?: string }> => {
      return updateCohort(cohortId, { status: "active" });
    },
    [updateCohort]
  );

  /**
   * Add members to a cohort
   */
  const addMembers = useCallback(
    async (
      cohortId: string,
      data: AddCohortMembersData
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) {
        return { ok: false, error: "No user" };
      }

      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.addCohortMembers(
          user.id,
          cohortId,
          data
        );

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Refresh current cohort to get updated members
        if (state.currentCohort?.id === cohortId) {
          await fetchCohort(cohortId);
        }

        setState((prev) => ({ ...prev, saving: false }));
        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to add members",
        };
      }
    },
    [user, state.currentCohort?.id, fetchCohort]
  );

  /**
   * Update a cohort member
   */
  const updateMember = useCallback(
    async (
      memberId: string,
      data: UpdateCohortMemberData
    ): Promise<{ ok: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.updateCohortMember(
          memberId,
          data
        );

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Update local state
        if (state.currentCohort) {
          setState((prev) => ({
            ...prev,
            currentCohort: prev.currentCohort
              ? {
                  ...prev.currentCohort,
                  members: prev.currentCohort.members.map((m) =>
                    m.id === memberId
                      ? { ...m, ...(result.data as CohortMemberRow) }
                      : m
                  ),
                }
              : null,
            saving: false,
          }));
        } else {
          setState((prev) => ({ ...prev, saving: false }));
        }

        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to update member",
        };
      }
    },
    [state.currentCohort]
  );

  /**
   * Remove a member from cohort
   */
  const removeMember = useCallback(
    async (memberId: string): Promise<{ ok: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.removeCohortMember(memberId);

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Update local state
        if (state.currentCohort) {
          setState((prev) => ({
            ...prev,
            currentCohort: prev.currentCohort
              ? {
                  ...prev.currentCohort,
                  members: prev.currentCohort.members.filter(
                    (m) => m.id !== memberId
                  ),
                }
              : null,
            saving: false,
          }));
        } else {
          setState((prev) => ({ ...prev, saving: false }));
        }

        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Failed to remove member",
        };
      }
    },
    [state.currentCohort]
  );

  /**
   * Record a placement for a member
   */
  const recordPlacement = useCallback(
    async (
      memberId: string,
      placement: { company: string; role: string; salary?: number }
    ): Promise<{ ok: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.recordPlacement(
          memberId,
          placement
        );

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Update local state
        if (state.currentCohort) {
          setState((prev) => ({
            ...prev,
            currentCohort: prev.currentCohort
              ? {
                  ...prev.currentCohort,
                  members: prev.currentCohort.members.map((m) =>
                    m.id === memberId
                      ? {
                          ...m,
                          completion_status: "placed" as const,
                          placed_at: new Date().toISOString(),
                          placement_company: placement.company,
                          placement_role: placement.role,
                          placement_salary: placement.salary || null,
                        }
                      : m
                  ),
                }
              : null,
            saving: false,
          }));
        } else {
          setState((prev) => ({ ...prev, saving: false }));
        }

        return { ok: true };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to record placement",
        };
      }
    },
    [state.currentCohort]
  );

  /**
   * Fetch bulk onboarding jobs
   */
  const fetchOnboardingJobs = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loadingJobs: true }));

    try {
      const result = await enterpriseService.getBulkOnboardingJobs(
        currentTeam.id
      );

      setState((prev) => ({
        ...prev,
        onboardingJobs: result.data || [],
        loadingJobs: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingJobs: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch onboarding jobs",
      }));
    }
  }, [currentTeam]);

  /**
   * Create a bulk onboarding job
   */
  const createOnboardingJob = useCallback(
    async (
      data: CreateBulkOnboardingData
    ): Promise<{ ok: boolean; jobId?: string; error?: string }> => {
      if (!currentTeam || !user) {
        return { ok: false, error: "No team or user" };
      }

      setState((prev) => ({ ...prev, saving: true }));

      try {
        const result = await enterpriseService.createBulkOnboardingJob(
          user.id,
          currentTeam.id,
          data
        );

        if (result.error) {
          setState((prev) => ({ ...prev, saving: false }));
          return { ok: false, error: result.error.message };
        }

        // Refresh jobs list
        await fetchOnboardingJobs();

        setState((prev) => ({ ...prev, saving: false }));
        return { ok: true, jobId: result.data?.id };
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to create onboarding job",
        };
      }
    },
    [currentTeam, user, fetchOnboardingJobs]
  );

  /**
   * Clear current cohort from state
   */
  const clearCurrentCohort = useCallback(() => {
    setState((prev) => ({ ...prev, currentCohort: null }));
  }, []);

  /**
   * Clear error from state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    fetchCohorts,
    fetchCohort,
    createCohort,
    updateCohort,
    deleteCohort,
    activateCohort,
    addMembers,
    updateMember,
    removeMember,
    recordPlacement,
    fetchOnboardingJobs,
    createOnboardingJob,
    clearCurrentCohort,
    clearError,
  };
}
