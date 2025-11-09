/**
 * Analytics helpers for Jobs workspace
 * - Provides lightweight helpers for computing success rates and comparing to basic benchmarks
 * - Designed to be imported by `AnalyticsPage` or auxiliary components without changing existing page code
 *
 * Contracts:
 * - Inputs: array of job rows returned from `crud.listRows('jobs', ...)` where created_at and status_changed_at are ISO strings
 * - Outputs: small, serializable summaries useful for UI rendering
 */

export type JobRecord = {
  id?: number | string;
  job_title?: string;
  company_name?: string;
  industry?: string | null;
  job_type?: string | null;
  created_at?: string | null;
  status_changed_at?: string | null;
  job_status?: string | null;
  application_deadline?: string | null;
};

/** Basic static industry benchmarks used for lightweight client-side comparison.
 *  Note: these are intentionally conservative placeholders — server-side benchmarking will replace them.
 */
export const industryBenchmarks: Record<string, { avgResponseDays: number; offerRate: number }> = {
  "Software": { avgResponseDays: 10, offerRate: 0.08 },
  "Finance": { avgResponseDays: 12, offerRate: 0.06 },
  "Healthcare": { avgResponseDays: 9, offerRate: 0.07 },
  "Education": { avgResponseDays: 7, offerRate: 0.05 },
  "(unknown)": { avgResponseDays: 11, offerRate: 0.06 },
};

/** Compute success (offer) rates grouped by a dimension (industry or job_type).
 *
 * Inputs:
 * - jobs: JobRecord[]
 * - groupBy: 'industry' | 'job_type'
 * Outputs:
 * - Array of { key, offers, total, rate }
 */
export function computeSuccessRates(jobs: JobRecord[], groupBy: 'industry' | 'job_type' = 'industry') {
  const map: Record<string, { offers: number; total: number }> = {};
  for (const j of jobs) {
    const key = (j[groupBy] as string) ?? '(unknown)';
    if (!map[key]) map[key] = { offers: 0, total: 0 };
    map[key].total += 1;
    if (((j.job_status ?? '') as string).toLowerCase() === 'offer') map[key].offers += 1;
  }
  const out = Object.keys(map).map((k) => ({ key: k, offers: map[k].offers, total: map[k].total, rate: map[k].offers / Math.max(1, map[k].total) }));
  out.sort((a, b) => b.rate - a.rate);
  return out;
}

/** Compute average time-to-response (days) grouped by a key (company or industry).
 * Returns the top N groups sorted by count desc.
 */
export function computeAvgResponseDays(jobs: JobRecord[], groupBy: 'company' | 'industry' = 'company', topN = 10) {
  const map: Record<string, { totalDays: number; count: number }> = {};
  for (const j of jobs) {
    if (!j.created_at || !j.status_changed_at) continue;
    const created = new Date(j.created_at);
    const changed = new Date(j.status_changed_at);
    if (isNaN(created.getTime()) || isNaN(changed.getTime())) continue;
    const days = (changed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const key = groupBy === 'company' ? (j.company_name ?? '(unknown)') : (j.industry ?? '(unknown)');
    if (!map[key]) map[key] = { totalDays: 0, count: 0 };
    map[key].totalDays += days;
    map[key].count += 1;
  }
  const out: Array<{ key: string; avgDays: number; count: number }> = [];
  for (const k of Object.keys(map)) out.push({ key: k, avgDays: map[k].totalDays / map[k].count, count: map[k].count });
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, topN);
}

/** Compare computed success rates against the provided benchmarks.
 * Returns entries with user's rate, benchmark rate and a relative delta.
 */
export function compareToBenchmarks(successRates: Array<{ key: string; rate: number; offers: number; total: number }>, benchmarks = industryBenchmarks) {
  return successRates.map((s) => {
    const bm = benchmarks[s.key] ?? benchmarks['(unknown)'] ?? { avgResponseDays: 0, offerRate: 0 };
    return {
      key: s.key,
      userRate: s.rate,
      benchmarkRate: bm.offerRate,
      delta: s.rate - bm.offerRate,
      offers: s.offers,
      total: s.total,
    };
  }).sort((a, b) => b.delta - a.delta);
}

/** Utility: format percent as localized string */
export function formatPercent(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}
