import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@shared/context/AuthContext";
import {
  fetchAIDashboardSnapshot,
  type AiDashboardSnapshot,
} from "@workspaces/ai/services/dashboardService";

export function useAIDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<AiDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchAIDashboardSnapshot(user.id);
      setData(snapshot);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load AI dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setData(null);
      return;
    }
    load();
  }, [user?.id, load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}

export default useAIDashboardData;
