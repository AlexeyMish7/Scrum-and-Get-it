import { useState, useEffect } from "react";
import { supabase } from "@shared/services/supabaseClient";

export function useAnalytics(reloadTrigger = 0) {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Get auth token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        // If a userId is provided in the URL (dev/testing), include it as a query param
        const url = new URL(window.location.href);
        const userId = url.searchParams.get("userId");
        const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";

        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const o = await fetch(`/api/analytics/overview${q}`, { headers }).then((r) => r.json());
        const t = await fetch(`/api/analytics/trends${q}`, { headers }).then((r) => r.json());
        // Diagnostic logs to help debug why the UI may be empty
        // These will appear in the browser console when the analytics page loads
        try {
          // eslint-disable-next-line no-console
          console.info("[useAnalytics] fetched overview:", o);
          // eslint-disable-next-line no-console
          console.info("[useAnalytics] fetched trends:", t);
        } catch (e) {
          // ignore console errors in environments that restrict console
        }
        if (mounted) {
          setOverview(o);
          setTrends(t);
          setLoading(false);
        }
      } catch (e) {
        // log fetch errors for debugging
        const errorMsg = e instanceof Error ? e.message : 'Failed to fetch analytics';
        setError(errorMsg);
        try {
          // eslint-disable-next-line no-console
          console.error("[useAnalytics] fetch error:", e);
        } catch (err) {
          // ignore
        }
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [reloadTrigger]);

  return { overview, trends, loading, error };
}
