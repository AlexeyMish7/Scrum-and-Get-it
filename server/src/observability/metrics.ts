export type RequestMetricSample = {
  ts: number;
  duration_ms: number;
  status: number;
  method: string;
  path: string;
};

const MAX_SAMPLES = 1000;

const samples: RequestMetricSample[] = [];

export function recordRequest(sample: RequestMetricSample): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)] ?? 0;
}

function summarizeWindow(windowSamples: RequestMetricSample[]) {
  const durations = windowSamples
    .map((s) => s.duration_ms)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const count = windowSamples.length;
  const avg =
    count === 0
      ? 0
      : Math.round(
          windowSamples.reduce((sum, s) => sum + s.duration_ms, 0) / count
        );

  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);

  const statusCounts = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
  };

  for (const s of windowSamples) {
    if (s.status >= 500) statusCounts["5xx"]++;
    else if (s.status >= 400) statusCounts["4xx"]++;
    else if (s.status >= 300) statusCounts["3xx"]++;
    else statusCounts["2xx"]++;
  }

  return {
    count,
    status: statusCounts,
    latency_ms: { avg, p50, p95 },
  };
}

export function getMetricsSnapshot(options?: { windowSeconds?: number }) {
  const windowSeconds = options?.windowSeconds ?? 300;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const windowSamples = samples.filter((s) => s.ts >= windowStart);
  const totals = summarizeWindow(windowSamples);

  const byRouteMap = new Map<string, RequestMetricSample[]>();
  for (const s of windowSamples) {
    const key = `${s.method} ${s.path}`;
    const list = byRouteMap.get(key);
    if (list) list.push(s);
    else byRouteMap.set(key, [s]);
  }

  const by_route = Array.from(byRouteMap.entries())
    .map(([key, list]) => {
      const [method, ...pathParts] = key.split(" ");
      const path = pathParts.join(" ");
      const summary = summarizeWindow(list);
      return {
        method,
        path,
        count: summary.count,
        status: summary.status,
        latency_ms: summary.latency_ms,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    generated_at: new Date(now).toISOString(),
    window_seconds: windowSeconds,
    totals,
    by_route,
    buffer: {
      max_samples: MAX_SAMPLES,
      current_samples: samples.length,
    },
  };
}

export function resetMetrics(): void {
  samples.length = 0;
}
