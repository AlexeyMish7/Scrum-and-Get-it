import { useState, useEffect } from "react";

export function useAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // If a userId is provided in the URL (dev/testing), include it as a query param
        const url = new URL(window.location.href);
        const userId = url.searchParams.get("userId");
        const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";

        const o = await fetch(`/api/analytics/overview${q}`).then((r) => r.json());
        const t = await fetch(`/api/analytics/trends${q}`).then((r) => r.json());
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
        }
      } catch (e) {
        // log fetch errors for debugging
        try {
          // eslint-disable-next-line no-console
          console.error("[useAnalytics] fetch error:", e);
        } catch (err) {
          // ignore
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { overview, trends };
}
