/**
 * useEnterprise Hook
 *
 * State management for enterprise career services features.
 * Provides access to team-level analytics, branding, compliance, and integrations.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as enterpriseService from "../services/enterpriseService";
import type {
  TeamCohortStats,
  AnalyticsSummary,
  ProgramEffectiveness,
  EnterpriseBrandingRow,
  IntegrationWithStatus,
  ComplianceReportSummary,
  UpdateBrandingData,
  CreateIntegrationData,
  ProgramAnalyticsRow,
  ROIReportRow,
  BulkOnboardingJobRow,
} from "../types/enterprise.types";

interface EnterpriseState {
  // Data
  cohortStats: TeamCohortStats | null;
  analyticsSummary: AnalyticsSummary | null;
  programEffectiveness: ProgramEffectiveness[];
  branding: EnterpriseBrandingRow | null;
  integrations: IntegrationWithStatus[];
  complianceSummary: ComplianceReportSummary | null;

  // Analytics data (for ProgramAnalyticsChart)
  analytics: ProgramAnalyticsRow[];
  analyticsLoading: boolean;
  analyticsError: string | null;

  // ROI data (for ROIReportGenerator)
  roiReports: ROIReportRow[];
  roiLoading: boolean;
  roiError: string | null;

  // Bulk onboarding (for BulkOnboardingWizard)
  bulkOnboardingProgress: BulkOnboardingJobRow | null;

  // Loading states
  loading: boolean;
  loadingStats: boolean;
  loadingBranding: boolean;
  loadingIntegrations: boolean;
  loadingCompliance: boolean;

  // Errors
  error: string | null;
}

interface EnterpriseActions {
  // Refresh functions
  refreshAll: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshBranding: () => Promise<void>;
  refreshIntegrations: () => Promise<void>;
  refreshCompliance: () => Promise<void>;
  refreshAnalytics: (dateRange?: {
    start: string;
    end: string;
  }) => Promise<void>;
  refreshROIReports: () => Promise<void>;

  // Branding actions
  updateBranding: (
    data: UpdateBrandingData
  ) => Promise<{ ok: boolean; error?: string }>;

  // Integration actions
  createIntegration: (
    data: CreateIntegrationData
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteIntegration: (id: string) => Promise<{ ok: boolean; error?: string }>;
  testIntegration: (
    id: string
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;

  // ROI actions
  generateROIReport: (
    cohortId?: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Bulk onboarding actions
  startBulkOnboarding: (
    users: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      cohort_id?: string;
      role?: string;
    }>,
    options?: { send_welcome_email?: boolean }
  ) => Promise<{ id: string } | null>;
}

interface UseEnterpriseReturn extends EnterpriseState, EnterpriseActions {
  // Computed
  hasEnterpriseAccess: boolean;
  isAdmin: boolean;
}

/**
 * Hook for managing enterprise features
 * Note: teamId parameter is kept for backward compatibility but is unused - team is obtained from useTeam()
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useEnterprise(_teamId?: string): UseEnterpriseReturn {
  const { user } = useAuth();
  const { currentTeam, isAdmin } = useTeam();

  const [state, setState] = useState<EnterpriseState>({
    cohortStats: null,
    analyticsSummary: null,
    programEffectiveness: [],
    branding: null,
    integrations: [],
    complianceSummary: null,
    analytics: [],
    analyticsLoading: false,
    analyticsError: null,
    roiReports: [],
    roiLoading: false,
    roiError: null,
    bulkOnboardingProgress: null,
    loading: true,
    loadingStats: false,
    loadingBranding: false,
    loadingIntegrations: false,
    loadingCompliance: false,
    error: null,
  });

  // Cache timestamps for future optimization (cache invalidation)
  const [, setCacheTimestamps] = useState<{
    stats: number;
    branding: number;
    integrations: number;
    compliance: number;
  }>({
    stats: 0,
    branding: 0,
    integrations: 0,
    compliance: 0,
  });

  /**
   * Refresh cohort stats and analytics
   */
  const refreshStats = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loadingStats: true }));

    try {
      const [statsResult, summaryResult, effectivenessResult] =
        await Promise.all([
          enterpriseService.getTeamCohortStats(currentTeam.id),
          enterpriseService.getAnalyticsSummary(currentTeam.id),
          enterpriseService.getProgramEffectiveness(currentTeam.id),
        ]);

      setState((prev) => ({
        ...prev,
        cohortStats: statsResult.data,
        analyticsSummary: summaryResult.data,
        programEffectiveness: effectivenessResult.data || [],
        loadingStats: false,
        error: null,
      }));

      setCacheTimestamps((prev) => ({ ...prev, stats: Date.now() }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingStats: false,
        error: err instanceof Error ? err.message : "Failed to load stats",
      }));
    }
  }, [currentTeam]);

  /**
   * Refresh branding settings
   */
  const refreshBranding = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loadingBranding: true }));

    try {
      const result = await enterpriseService.getBranding(currentTeam.id);

      setState((prev) => ({
        ...prev,
        branding: result.data,
        loadingBranding: false,
      }));

      setCacheTimestamps((prev) => ({ ...prev, branding: Date.now() }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingBranding: false,
        error: err instanceof Error ? err.message : "Failed to load branding",
      }));
    }
  }, [currentTeam]);

  /**
   * Refresh integrations
   */
  const refreshIntegrations = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loadingIntegrations: true }));

    try {
      const result = await enterpriseService.getIntegrations(currentTeam.id);

      setState((prev) => ({
        ...prev,
        integrations: result.data || [],
        loadingIntegrations: false,
      }));

      setCacheTimestamps((prev) => ({ ...prev, integrations: Date.now() }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingIntegrations: false,
        error:
          err instanceof Error ? err.message : "Failed to load integrations",
      }));
    }
  }, [currentTeam]);

  /**
   * Refresh compliance summary
   */
  const refreshCompliance = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, loadingCompliance: true }));

    try {
      // Get last 30 days of compliance data
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = await enterpriseService.getComplianceReportSummary(
        currentTeam.id,
        startDate,
        endDate
      );

      setState((prev) => ({
        ...prev,
        complianceSummary: result.data,
        loadingCompliance: false,
      }));

      setCacheTimestamps((prev) => ({ ...prev, compliance: Date.now() }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingCompliance: false,
        error:
          err instanceof Error ? err.message : "Failed to load compliance data",
      }));
    }
  }, [currentTeam]);

  /**
   * Refresh all enterprise data
   */
  const refreshAll = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    await Promise.all([
      refreshStats(),
      refreshBranding(),
      refreshIntegrations(),
      refreshCompliance(),
    ]);

    setState((prev) => ({ ...prev, loading: false }));
  }, [refreshStats, refreshBranding, refreshIntegrations, refreshCompliance]);

  /**
   * Update branding settings
   */
  const updateBranding = useCallback(
    async (
      data: UpdateBrandingData
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!currentTeam) {
        return { ok: false, error: "No team selected" };
      }

      try {
        const result = await enterpriseService.updateBranding(
          currentTeam.id,
          data
        );

        if (result.error) {
          return { ok: false, error: result.error.message };
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          branding: result.data,
        }));

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to update branding",
        };
      }
    },
    [currentTeam]
  );

  /**
   * Create a new integration
   */
  const createIntegration = useCallback(
    async (
      data: CreateIntegrationData
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!currentTeam || !user) {
        return { ok: false, error: "No team or user" };
      }

      try {
        const result = await enterpriseService.createIntegration(
          user.id,
          currentTeam.id,
          data
        );

        if (result.error) {
          return { ok: false, error: result.error.message };
        }

        // Refresh integrations list
        await refreshIntegrations();

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to create integration",
        };
      }
    },
    [currentTeam, user, refreshIntegrations]
  );

  /**
   * Delete an integration
   */
  const deleteIntegration = useCallback(
    async (integrationId: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const result = await enterpriseService.deleteIntegration(integrationId);

        if (result.error) {
          return { ok: false, error: result.error.message };
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          integrations: prev.integrations.filter((i) => i.id !== integrationId),
        }));

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to delete integration",
        };
      }
    },
    []
  );

  /**
   * Test an integration connection
   */
  const testIntegration = useCallback(
    async (
      integrationId: string
    ): Promise<{ ok: boolean; message?: string; error?: string }> => {
      try {
        const result = await enterpriseService.testIntegration(integrationId);

        if (result.error) {
          return { ok: false, error: result.error.message };
        }

        // Refresh integrations to get updated status
        await refreshIntegrations();

        return { ok: true, message: result.data?.message };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to test integration",
        };
      }
    },
    [refreshIntegrations]
  );

  /**
   * Refresh analytics data (for ProgramAnalyticsChart)
   */
  const refreshAnalytics = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      if (!currentTeam) return;

      setState((prev) => ({
        ...prev,
        analyticsLoading: true,
        analyticsError: null,
      }));

      try {
        // Use provided date range or default to last 30 days
        const endDate =
          dateRange?.end || new Date().toISOString().split("T")[0];
        const startDate =
          dateRange?.start ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        const result = await enterpriseService.getTeamAnalytics(
          currentTeam.id,
          {
            start_date: startDate,
            end_date: endDate,
          }
        );

        setState((prev) => ({
          ...prev,
          analytics: result.data || [],
          analyticsLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          analyticsLoading: false,
          analyticsError:
            err instanceof Error ? err.message : "Failed to load analytics",
        }));
      }
    },
    [currentTeam]
  );

  /**
   * Refresh ROI reports (for ROIReportGenerator)
   */
  const refreshROIReports = useCallback(async () => {
    if (!currentTeam) return;

    setState((prev) => ({ ...prev, roiLoading: true, roiError: null }));

    try {
      const result = await enterpriseService.getROIReports(currentTeam.id);

      setState((prev) => ({
        ...prev,
        roiReports: result.data || [],
        roiLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        roiLoading: false,
        roiError:
          err instanceof Error ? err.message : "Failed to load ROI reports",
      }));
    }
  }, [currentTeam]);

  /**
   * Generate a new ROI report
   */
  const generateROIReport = useCallback(
    async (cohortId?: string): Promise<{ ok: boolean; error?: string }> => {
      if (!currentTeam || !user) {
        return { ok: false, error: "No team or user" };
      }

      try {
        const result = await enterpriseService.createROIReport(
          user.id,
          currentTeam.id,
          {
            report_name: `ROI Report - ${new Date().toLocaleDateString()}`,
            report_type: cohortId ? "cohort" : "program",
            cohort_id: cohortId,
            period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            period_end: new Date().toISOString().split("T")[0],
          }
        );

        if (result.error) {
          return { ok: false, error: result.error.message };
        }

        // Refresh reports list
        await refreshROIReports();

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to generate ROI report",
        };
      }
    },
    [currentTeam, user, refreshROIReports]
  );

  /**
   * Start bulk user onboarding (for BulkOnboardingWizard)
   */
  const startBulkOnboarding = useCallback(
    async (
      users: Array<{
        email: string;
        first_name?: string;
        last_name?: string;
        cohort_id?: string;
        role?: string;
      }>,
      options?: { send_welcome_email?: boolean }
    ): Promise<{ id: string } | null> => {
      if (!currentTeam || !user) {
        return null;
      }

      try {
        const result = await enterpriseService.createBulkOnboardingJob(
          user.id,
          currentTeam.id,
          {
            source_type: "csv_upload",
            users: users.map((u) => ({
              email: u.email,
              first_name: u.first_name,
              last_name: u.last_name,
              role: u.role,
              metadata: u.cohort_id ? { cohort_id: u.cohort_id } : undefined,
            })),
            options: {
              send_welcome_email: options?.send_welcome_email ?? true,
              skip_duplicates: true,
              auto_assign_mentor: false,
              default_role: "member",
            },
          }
        );

        if (result.error || !result.data) {
          return null;
        }

        // Update progress state
        setState((prev) => ({
          ...prev,
          bulkOnboardingProgress: result.data,
        }));

        return { id: result.data.id };
      } catch {
        return null;
      }
    },
    [currentTeam, user]
  );

  // Initial load when team changes
  useEffect(() => {
    if (currentTeam && isAdmin) {
      refreshAll();
    } else {
      // Reset state if no team or not admin
      setState((prev) => ({
        ...prev,
        cohortStats: null,
        analyticsSummary: null,
        programEffectiveness: [],
        branding: null,
        integrations: [],
        complianceSummary: null,
        loading: false,
      }));
    }
  }, [currentTeam?.id, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if user has enterprise access (admin + enterprise subscription)
  const hasEnterpriseAccess = useMemo(() => {
    // For now, just check if admin. In production, also check subscription tier
    return isAdmin;
  }, [isAdmin]);

  return {
    // State
    ...state,

    // Computed
    hasEnterpriseAccess,
    isAdmin,

    // Actions
    refreshAll,
    refreshStats,
    refreshBranding,
    refreshIntegrations,
    refreshCompliance,
    refreshAnalytics,
    refreshROIReports,
    updateBranding,
    createIntegration,
    deleteIntegration,
    testIntegration,
    generateROIReport,
    startBulkOnboarding,
  };
}
