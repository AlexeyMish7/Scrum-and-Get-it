/**
 * useFamilySupport.ts
 *
 * UC-113: Family and Personal Support Integration
 *
 * Custom hook for managing family support state and operations.
 * Provides centralized state management with caching for family support data,
 * reducing redundant API calls and improving performance.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@shared/context/AuthContext";
import * as familySupportService from "../services/familySupportService";
import type {
  FamilySupporterWithProfile,
  FamilySupportSettingsRow,
  FamilyProgressSummaryRow,
  FamilyMilestoneRow,
  FamilyResourceRow,
  SupportBoundaryRow,
  FamilyCommunicationRow,
  FamilySupportDashboard,
  InviteSupporterData,
  UpdateSupporterPermissionsData,
  UpdateFamilySupportSettingsData,
  CreateProgressSummaryData,
  CreateMilestoneData,
  CreateBoundaryData,
  SendCommunicationData,
  ResourceFilters,
  MilestoneFilters,
} from "../types/familySupport.types";

// Cache configuration - 5 minutes for family data
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
interface UseFamilySupportReturn {
  // State
  supporters: FamilySupporterWithProfile[];
  settings: FamilySupportSettingsRow | null;
  progressSummaries: FamilyProgressSummaryRow[];
  milestones: FamilyMilestoneRow[];
  resources: FamilyResourceRow[];
  boundaries: SupportBoundaryRow[];
  communications: FamilyCommunicationRow[];
  dashboard: FamilySupportDashboard | null;

  // Loading states
  loading: boolean;
  loadingSupporters: boolean;
  loadingMilestones: boolean;
  loadingResources: boolean;

  // Error state
  error: string | null;

  // Supporter operations
  loadSupporters: () => Promise<void>;
  inviteSupporter: (data: InviteSupporterData) => Promise<boolean>;
  updateSupporterPermissions: (
    supporterId: string,
    data: UpdateSupporterPermissionsData
  ) => Promise<boolean>;
  removeSupporter: (supporterId: string) => Promise<boolean>;

  // Settings operations
  loadSettings: () => Promise<void>;
  updateSettings: (data: UpdateFamilySupportSettingsData) => Promise<boolean>;

  // Progress summary operations
  loadProgressSummaries: (limit?: number) => Promise<void>;
  createProgressSummary: (data: CreateProgressSummaryData) => Promise<boolean>;

  // Milestone operations
  loadMilestones: (filters?: MilestoneFilters) => Promise<void>;
  createMilestone: (data: CreateMilestoneData) => Promise<boolean>;
  toggleMilestoneSharing: (
    milestoneId: string,
    isShared: boolean,
    sharedWithAll?: boolean,
    sharedWithSupporters?: string[]
  ) => Promise<boolean>;

  // Resource operations
  loadResources: (filters?: ResourceFilters) => Promise<void>;
  markResourceViewed: (resourceId: string) => Promise<boolean>;
  markResourceHelpful: (resourceId: string) => Promise<boolean>;

  // Boundary operations
  loadBoundaries: () => Promise<void>;
  createBoundary: (data: CreateBoundaryData) => Promise<boolean>;
  updateBoundary: (
    boundaryId: string,
    data: Partial<CreateBoundaryData>
  ) => Promise<boolean>;
  deleteBoundary: (boundaryId: string) => Promise<boolean>;

  // Communication operations
  loadCommunications: (limit?: number) => Promise<void>;
  sendCommunication: (data: SendCommunicationData) => Promise<boolean>;

  // Dashboard operations
  loadDashboard: () => Promise<void>;

  // Utility
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export function useFamilySupport(): UseFamilySupportReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // State
  const [supporters, setSupporters] = useState<FamilySupporterWithProfile[]>(
    []
  );
  const [settings, setSettings] = useState<FamilySupportSettingsRow | null>(
    null
  );
  const [progressSummaries, setProgressSummaries] = useState<
    FamilyProgressSummaryRow[]
  >([]);
  const [milestones, setMilestones] = useState<FamilyMilestoneRow[]>([]);
  const [resources, setResources] = useState<FamilyResourceRow[]>([]);
  const [boundaries, setBoundaries] = useState<SupportBoundaryRow[]>([]);
  const [communications, setCommunications] = useState<
    FamilyCommunicationRow[]
  >([]);
  const [dashboard, setDashboard] = useState<FamilySupportDashboard | null>(
    null
  );

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSupporters, setLoadingSupporters] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Cache refs (survive re-renders)
  const supportersCache = useRef<CacheEntry<
    FamilySupporterWithProfile[]
  > | null>(null);
  const settingsCache = useRef<CacheEntry<FamilySupportSettingsRow> | null>(
    null
  );
  const milestonesCache = useRef<CacheEntry<FamilyMilestoneRow[]> | null>(null);
  const resourcesCache = useRef<CacheEntry<FamilyResourceRow[]> | null>(null);
  const boundariesCache = useRef<CacheEntry<SupportBoundaryRow[]> | null>(null);
  const dashboardCache = useRef<CacheEntry<FamilySupportDashboard> | null>(
    null
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ----- SUPPORTER OPERATIONS -----

  // Load all family supporters for the user
  const loadSupporters = useCallback(async () => {
    if (!userId) return;

    // Check cache
    if (isCacheValid(supportersCache.current)) {
      setSupporters(supportersCache.current.data);
      return;
    }

    setLoadingSupporters(true);
    setError(null);

    try {
      const result = await familySupportService.getSupporters(userId);
      if (result.data) {
        setSupporters(result.data);
        supportersCache.current = { data: result.data, timestamp: Date.now() };
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading supporters:", err);
      setError("Failed to load family supporters");
    } finally {
      setLoadingSupporters(false);
    }
  }, [userId]);

  // Invite a new family supporter
  const inviteSupporter = useCallback(
    async (data: InviteSupporterData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.inviteSupporter(userId, data);
        if (result.data) {
          // Invalidate cache and reload
          supportersCache.current = null;
          await loadSupporters();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error inviting supporter:", err);
        setError("Failed to invite supporter");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadSupporters]
  );

  // Update a supporter's permissions
  const updateSupporterPermissions = useCallback(
    async (
      supporterId: string,
      data: UpdateSupporterPermissionsData
    ): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.updateSupporterPermissions(
          userId,
          supporterId,
          data
        );
        if (result.data) {
          // Invalidate cache and reload
          supportersCache.current = null;
          await loadSupporters();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error updating supporter permissions:", err);
        setError("Failed to update supporter permissions");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadSupporters]
  );

  // Remove a supporter
  const removeSupporter = useCallback(
    async (supporterId: string): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.removeSupporter(
          userId,
          supporterId
        );
        if (!result.error) {
          // Invalidate cache and update UI
          supportersCache.current = null;
          setSupporters((prev) => prev.filter((s) => s.id !== supporterId));
          return true;
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error removing supporter:", err);
        setError("Failed to remove supporter");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId]
  );

  // ----- SETTINGS OPERATIONS -----

  // Load user's family support settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    // Check cache
    if (isCacheValid(settingsCache.current)) {
      setSettings(settingsCache.current.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await familySupportService.getFamilySupportSettings(
        userId
      );
      if (result.data) {
        setSettings(result.data);
        settingsCache.current = { data: result.data, timestamp: Date.now() };
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update family support settings
  const updateSettings = useCallback(
    async (data: UpdateFamilySupportSettingsData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.updateFamilySupportSettings(
          userId,
          data
        );
        if (result.data) {
          setSettings(result.data);
          settingsCache.current = { data: result.data, timestamp: Date.now() };
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error updating settings:", err);
        setError("Failed to update settings");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId]
  );

  // ----- PROGRESS SUMMARY OPERATIONS -----

  // Load progress summaries
  const loadProgressSummaries = useCallback(
    async (limit: number = 10) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.getProgressSummaries(
          userId,
          limit
        );
        if (result.data) {
          setProgressSummaries(result.data);
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading progress summaries:", err);
        setError("Failed to load progress summaries");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Create a progress summary
  const createProgressSummary = useCallback(
    async (data: CreateProgressSummaryData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.createProgressSummary(
          userId,
          data
        );
        if (result.data) {
          await loadProgressSummaries();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating progress summary:", err);
        setError("Failed to create progress summary");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadProgressSummaries]
  );

  // ----- MILESTONE OPERATIONS -----

  // Load milestones
  const loadMilestones = useCallback(
    async (filters?: MilestoneFilters) => {
      if (!userId) return;

      // Only check cache if no filters
      if (!filters && isCacheValid(milestonesCache.current)) {
        setMilestones(milestonesCache.current.data);
        return;
      }

      setLoadingMilestones(true);
      setError(null);

      try {
        const result = await familySupportService.getMilestones(
          userId,
          filters
        );
        if (result.data) {
          setMilestones(result.data);
          // Only cache if no filters
          if (!filters) {
            milestonesCache.current = {
              data: result.data,
              timestamp: Date.now(),
            };
          }
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading milestones:", err);
        setError("Failed to load milestones");
      } finally {
        setLoadingMilestones(false);
      }
    },
    [userId]
  );

  // Create a milestone
  const createMilestone = useCallback(
    async (data: CreateMilestoneData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.createMilestone(userId, data);
        if (result.data) {
          // Invalidate cache and reload
          milestonesCache.current = null;
          await loadMilestones();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating milestone:", err);
        setError("Failed to create milestone");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadMilestones]
  );

  // Toggle milestone sharing
  const toggleMilestoneSharing = useCallback(
    async (
      milestoneId: string,
      isShared: boolean,
      sharedWithAll: boolean = true,
      sharedWithSupporters: string[] = []
    ): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.toggleMilestoneSharing(
          userId,
          milestoneId,
          isShared,
          sharedWithAll,
          sharedWithSupporters
        );
        if (result.data) {
          // Reload milestones to get updated sharing status
          milestonesCache.current = null;
          await loadMilestones();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error toggling milestone sharing:", err);
        setError("Failed to update milestone sharing");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadMilestones]
  );

  // ----- RESOURCE OPERATIONS -----

  // Load resources
  const loadResources = useCallback(async (filters?: ResourceFilters) => {
    // Only check cache if no filters
    if (!filters && isCacheValid(resourcesCache.current)) {
      setResources(resourcesCache.current.data);
      return;
    }

    setLoadingResources(true);
    setError(null);

    try {
      const result = await familySupportService.getResources(filters);
      if (result.data) {
        setResources(result.data);
        // Only cache if no filters
        if (!filters) {
          resourcesCache.current = {
            data: result.data,
            timestamp: Date.now(),
          };
        }
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading resources:", err);
      setError("Failed to load resources");
    } finally {
      setLoadingResources(false);
    }
  }, []);

  // Mark resource as viewed
  const markResourceViewed = useCallback(
    async (resourceId: string): Promise<boolean> => {
      try {
        const result = await familySupportService.markResourceViewed(
          resourceId
        );
        return !result.error;
      } catch (err) {
        console.error("Error marking resource viewed:", err);
        return false;
      }
    },
    []
  );

  // Mark resource as helpful
  const markResourceHelpful = useCallback(
    async (resourceId: string): Promise<boolean> => {
      try {
        const result = await familySupportService.markResourceHelpful(
          resourceId
        );
        return !result.error;
      } catch (err) {
        console.error("Error marking resource helpful:", err);
        return false;
      }
    },
    []
  );

  // ----- BOUNDARY OPERATIONS -----

  // Load boundaries
  const loadBoundaries = useCallback(async () => {
    if (!userId) return;

    // Check cache
    if (isCacheValid(boundariesCache.current)) {
      setBoundaries(boundariesCache.current.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await familySupportService.getBoundaries(userId);
      if (result.data) {
        setBoundaries(result.data);
        boundariesCache.current = { data: result.data, timestamp: Date.now() };
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading boundaries:", err);
      setError("Failed to load boundaries");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create a boundary
  const createBoundary = useCallback(
    async (data: CreateBoundaryData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.createBoundary(userId, data);
        if (result.data) {
          boundariesCache.current = null;
          await loadBoundaries();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating boundary:", err);
        setError("Failed to create boundary");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadBoundaries]
  );

  // Update a boundary
  const updateBoundary = useCallback(
    async (
      boundaryId: string,
      data: Partial<CreateBoundaryData>
    ): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.updateBoundary(
          userId,
          boundaryId,
          data
        );
        if (result.data) {
          boundariesCache.current = null;
          await loadBoundaries();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error updating boundary:", err);
        setError("Failed to update boundary");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadBoundaries]
  );

  // Delete a boundary
  const deleteBoundary = useCallback(
    async (boundaryId: string): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.deleteBoundary(
          userId,
          boundaryId
        );
        if (!result.error) {
          boundariesCache.current = null;
          setBoundaries((prev) => prev.filter((b) => b.id !== boundaryId));
          return true;
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error deleting boundary:", err);
        setError("Failed to delete boundary");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId]
  );

  // ----- COMMUNICATION OPERATIONS -----

  // Load communications
  const loadCommunications = useCallback(
    async (limit: number = 20) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.getCommunications(
          userId,
          limit
        );
        if (result.data) {
          setCommunications(result.data);
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading communications:", err);
        setError("Failed to load communications");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Send a communication
  const sendCommunication = useCallback(
    async (data: SendCommunicationData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await familySupportService.sendCommunication(
          userId,
          data
        );
        if (result.data) {
          await loadCommunications();
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error sending communication:", err);
        setError("Failed to send communication");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadCommunications]
  );

  // ----- DASHBOARD OPERATIONS -----

  // Load dashboard (aggregated view)
  const loadDashboard = useCallback(async () => {
    if (!userId) return;

    // Check cache
    if (isCacheValid(dashboardCache.current)) {
      setDashboard(dashboardCache.current.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await familySupportService.getFamilySupportDashboard(
        userId
      );
      if (result.data) {
        setDashboard(result.data);
        dashboardCache.current = { data: result.data, timestamp: Date.now() };
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ----- UTILITY -----

  // Refresh all data by clearing caches and reloading
  const refreshAll = useCallback(async () => {
    // Clear all caches
    supportersCache.current = null;
    settingsCache.current = null;
    milestonesCache.current = null;
    resourcesCache.current = null;
    boundariesCache.current = null;
    dashboardCache.current = null;

    // Reload all data in parallel
    await Promise.all([
      loadSupporters(),
      loadSettings(),
      loadMilestones(),
      loadResources(),
      loadBoundaries(),
      loadDashboard(),
    ]);
  }, [
    loadSupporters,
    loadSettings,
    loadMilestones,
    loadResources,
    loadBoundaries,
    loadDashboard,
  ]);

  // Load initial data when user is available
  useEffect(() => {
    if (userId) {
      loadSupporters();
      loadSettings();
      loadDashboard();
    }
  }, [userId, loadSupporters, loadSettings, loadDashboard]);

  return {
    // State
    supporters,
    settings,
    progressSummaries,
    milestones,
    resources,
    boundaries,
    communications,
    dashboard,

    // Loading states
    loading,
    loadingSupporters,
    loadingMilestones,
    loadingResources,

    // Error state
    error,

    // Supporter operations
    loadSupporters,
    inviteSupporter,
    updateSupporterPermissions,
    removeSupporter,

    // Settings operations
    loadSettings,
    updateSettings,

    // Progress summary operations
    loadProgressSummaries,
    createProgressSummary,

    // Milestone operations
    loadMilestones,
    createMilestone,
    toggleMilestoneSharing,

    // Resource operations
    loadResources,
    markResourceViewed,
    markResourceHelpful,

    // Boundary operations
    loadBoundaries,
    createBoundary,
    updateBoundary,
    deleteBoundary,

    // Communication operations
    loadCommunications,
    sendCommunication,

    // Dashboard operations
    loadDashboard,

    // Utility
    clearError,
    refreshAll,
  };
}

export default useFamilySupport;
