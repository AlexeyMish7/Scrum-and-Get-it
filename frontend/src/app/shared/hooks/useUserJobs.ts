/**
 * useUserJobs
 * Centralized jobs loader for AI and Jobs panels.
 * Inputs: none (uses useAuth internally to scope by user).
 * Output: { jobs, loading, error, refresh }
 * Error modes: surfaces via useErrorHandler and stores last error.
 */
import * as React from "react";
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

export interface SimpleJob {
  id: number;
  title: string;
  company: string;
}

export function useUserJobs(limit: number = 50) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [jobs, setJobs] = React.useState<SimpleJob[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const u = withUser(user.id);
      const res = await u.listRows<{
        id: number;
        job_title: string | null;
        company_name: string | null;
      }>("jobs", "id, job_title, company_name", {
        order: { column: "created_at", ascending: false },
        limit,
      });
      if (res.error)
        throw new Error(res.error.message || "Failed to load jobs");
      const items: SimpleJob[] = (res.data ?? []).map((j) => ({
        id: j.id,
        title: j.job_title ?? "Untitled",
        company: j.company_name ?? "",
      }));
      setJobs(items);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load jobs";
      setError(msg);
      handleError?.(e as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError, limit]);

  React.useEffect(() => {
    (async () => {
      await load();
    })();
    return () => {};
  }, [load]);

  return { jobs, loading, error, refresh: load } as const;
}

export default useUserJobs;
