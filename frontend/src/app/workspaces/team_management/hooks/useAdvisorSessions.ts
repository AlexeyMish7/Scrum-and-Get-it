/**
 * UC-115: External Advisor and Coach Integration
 * Custom hook for managing advisor sessions
 *
 * Purpose:
 * - Schedule and manage coaching sessions
 * - Track upcoming sessions
 * - Handle session updates and cancellations
 */

import { useState, useEffect, useCallback } from "react";
import * as advisorService from "../services/advisorService";
import type {
  AdvisorSession,
  UpcomingSession,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
} from "../types/advisor.types";

interface UseAdvisorSessionsState {
  sessions: AdvisorSession[];
  upcomingSessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
}

interface UseAdvisorSessionsReturn extends UseAdvisorSessionsState {
  // CRUD operations
  createSession: (data: CreateSessionData) => Promise<boolean>;
  updateSession: (
    sessionId: string,
    data: UpdateSessionData
  ) => Promise<boolean>;
  cancelSession: (sessionId: string, reason?: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;

  // Data fetching
  refreshSessions: (filters?: SessionFilters) => Promise<void>;
  refreshUpcoming: (limit?: number) => Promise<void>;

  // Utilities
  getSessionById: (sessionId: string) => AdvisorSession | undefined;
  clearError: () => void;
}

/**
 * Hook for managing advisor coaching sessions
 * Provides CRUD operations and scheduling utilities
 */
export function useAdvisorSessions(
  initialFilters?: SessionFilters
): UseAdvisorSessionsReturn {
  const [state, setState] = useState<UseAdvisorSessionsState>({
    sessions: [],
    upcomingSessions: [],
    loading: true,
    error: null,
  });

  // Fetch sessions with optional filters
  const refreshSessions = useCallback(async (filters?: SessionFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const result = await advisorService.getSessions(filters);

    if (result.data) {
      setState((prev) => ({
        ...prev,
        sessions: result.data!,
        loading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error?.message ?? "Failed to fetch sessions",
        loading: false,
      }));
    }
  }, []);

  // Fetch upcoming sessions
  const refreshUpcoming = useCallback(async (limit: number = 10) => {
    const result = await advisorService.getUpcomingSessions(limit);

    if (result.data) {
      setState((prev) => ({
        ...prev,
        upcomingSessions: result.data!,
      }));
    }
  }, []);

  // Create a new session
  const createSession = useCallback(
    async (data: CreateSessionData): Promise<boolean> => {
      const result = await advisorService.createSession(data);

      if (result.data) {
        // Add new session to state, sorted by scheduled start
        setState((prev) => ({
          ...prev,
          sessions: [...prev.sessions, result.data!].sort(
            (a, b) =>
              new Date(a.scheduled_start).getTime() -
              new Date(b.scheduled_start).getTime()
          ),
        }));
        // Refresh upcoming sessions
        refreshUpcoming();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to create session",
        }));
        return false;
      }
    },
    [refreshUpcoming]
  );

  // Update session
  const updateSession = useCallback(
    async (sessionId: string, data: UpdateSessionData): Promise<boolean> => {
      const result = await advisorService.updateSession(sessionId, data);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId ? result.data! : s
          ),
        }));
        // Refresh upcoming if status changed
        if (data.status) {
          refreshUpcoming();
        }
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to update session",
        }));
        return false;
      }
    },
    [refreshUpcoming]
  );

  // Cancel session
  const cancelSession = useCallback(
    async (sessionId: string, reason?: string): Promise<boolean> => {
      const result = await advisorService.cancelSession(sessionId, reason);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: "cancelled" as const } : s
          ),
        }));
        refreshUpcoming();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to cancel session",
        }));
        return false;
      }
    },
    [refreshUpcoming]
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const result = await advisorService.deleteSession(sessionId);

      if (result.data) {
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.id !== sessionId),
        }));
        refreshUpcoming();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message ?? "Failed to delete session",
        }));
        return false;
      }
    },
    [refreshUpcoming]
  );

  // Get session by ID from current state
  const getSessionById = useCallback(
    (sessionId: string): AdvisorSession | undefined => {
      return state.sessions.find((s) => s.id === sessionId);
    },
    [state.sessions]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshSessions(initialFilters);
    refreshUpcoming();
  }, [refreshSessions, refreshUpcoming, initialFilters]);

  return {
    ...state,
    createSession,
    updateSession,
    cancelSession,
    deleteSession,
    refreshSessions,
    refreshUpcoming,
    getSessionById,
    clearError,
  };
}
