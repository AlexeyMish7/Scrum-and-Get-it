/**
 * Tests for server/src/observability/metrics.ts
 * Coverage: recordRequest(), getMetricsSnapshot(), resetMetrics()
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  recordRequest,
  getMetricsSnapshot,
  resetMetrics,
} from "../../../server/src/observability/metrics.js";

describe("Observability Metrics", () => {
  beforeEach(() => {
    resetMetrics();
    vi.restoreAllMocks();
  });

  it("should summarize only samples in the window", () => {
    const now = 1_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    recordRequest({
      ts: now - 10_000,
      duration_ms: 100,
      status: 200,
      method: "GET",
      path: "/api/a",
    });

    recordRequest({
      ts: now - 1_000,
      duration_ms: 250,
      status: 500,
      method: "POST",
      path: "/api/b",
    });

    // Outside window (older than 300s)
    recordRequest({
      ts: now - 400_000,
      duration_ms: 999,
      status: 200,
      method: "GET",
      path: "/api/old",
    });

    const snapshot = getMetricsSnapshot({ windowSeconds: 300 });

    expect(snapshot.totals.count).toBe(2);
    expect(snapshot.totals.status["2xx"]).toBe(1);
    expect(snapshot.totals.status["5xx"]).toBe(1);

    // Top routes should include /api/a and /api/b
    const routes = snapshot.by_route.map((r) => `${r.method} ${r.path}`);
    expect(routes).toContain("GET /api/a");
    expect(routes).toContain("POST /api/b");
  });

  it("should compute latency percentiles", () => {
    const now = 2_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    for (const d of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
      recordRequest({
        ts: now - 1_000,
        duration_ms: d,
        status: 200,
        method: "GET",
        path: "/api/x",
      });
    }

    const snapshot = getMetricsSnapshot({ windowSeconds: 300 });

    expect(snapshot.totals.count).toBe(10);
    expect(snapshot.totals.latency_ms.p50).toBeGreaterThan(0);
    expect(snapshot.totals.latency_ms.p95).toBeGreaterThan(0);
    expect(snapshot.totals.latency_ms.p95).toBeGreaterThanOrEqual(
      snapshot.totals.latency_ms.p50
    );
  });
});
