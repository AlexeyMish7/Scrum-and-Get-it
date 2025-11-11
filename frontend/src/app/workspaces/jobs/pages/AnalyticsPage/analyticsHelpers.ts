/**
 * Analytics helpers for Jobs workspace
 * - Provides client-side metrics for success, stage times, response rates, deadlines, etc.
 * - Designed to be imported by `AnalyticsPage` and other dashboard components.
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

/** Basic static industry benchmarks (for BenchmarkCard comparison) */
export const industryBenchmarks: Record<
  string,
  { avgResponseDays: number; offerRate: number }
> = {
  Software: { avgResponseDays: 10, offerRate: 0.08 },
  Finance: { avgResponseDays: 12, offerRate: 0.06 },
  Healthcare: { avgResponseDays: 9, offerRate: 0.07 },
  Education: { avgResponseDays: 7, offerRate: 0.05 },
  "(unknown)": { avgResponseDays: 11, offerRate: 0.06 },
};

/** ✅ Success rate grouped by industry or job_type */
export function computeSuccessRates(
  jobs: JobRecord[],
  groupBy: "industry" | "job_type" = "industry"
) {
  const map: Record<string, { offers: number; total: number }> = {};
  for (const j of jobs) {
    const key = (j[groupBy] as string) ?? "(unknown)";
    if (!map[key]) map[key] = { offers: 0, total: 0 };
    map[key].total += 1;
    if ((j.job_status ?? "").toLowerCase() === "offer") map[key].offers += 1;
  }
  const out = Object.keys(map).map((k) => ({
    key: k,
    offers: map[k].offers,
    total: map[k].total,
    rate: map[k].offers / Math.max(1, map[k].total),
  }));
  out.sort((a, b) => b.rate - a.rate);
  return out;
}

/** ✅ Average response time grouped by company or industry */
export function computeAvgResponseDays(
  jobs: JobRecord[],
  groupBy: "company" | "industry" = "company",
  topN = 10
) {
  const map: Record<string, { totalDays: number; count: number }> = {};
  for (const j of jobs) {
    if (!j.created_at || !j.status_changed_at) continue;
    const created = new Date(j.created_at);
    const changed = new Date(j.status_changed_at);
    if (isNaN(created.getTime()) || isNaN(changed.getTime())) continue;
    const days = (changed.getTime() - created.getTime()) / 86400000;
    const key =
      groupBy === "company"
        ? j.company_name ?? "(unknown)"
        : j.industry ?? "(unknown)";
    if (!map[key]) map[key] = { totalDays: 0, count: 0 };
    map[key].totalDays += days;
    map[key].count += 1;
  }
  const out = Object.keys(map).map((k) => ({
    key: k,
    avgDays: map[k].totalDays / map[k].count,
    count: map[k].count,
  }));
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, topN);
}

/** ✅ Compare user’s success rate vs benchmarks */
export function compareToBenchmarks(
  successRates: Array<{ key: string; rate: number; offers: number; total: number }>,
  benchmarks = industryBenchmarks
) {
  return successRates
    .map((s) => {
      const bm = benchmarks[s.key] ?? benchmarks["(unknown)"];
      return {
        key: s.key,
        userRate: s.rate,
        benchmarkRate: bm.offerRate,
        delta: s.rate - bm.offerRate,
        offers: s.offers,
        total: s.total,
      };
    })
    .sort((a, b) => b.delta - a.delta);
}

/** ✅ Format a percent as a string */
export function formatPercent(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

/** ✅ Compute overall response rate (Applied → got Interview or Offer) */
export function computeResponseRate(jobs: JobRecord[]) {
  const applied = jobs.filter((j) => j.job_status?.toLowerCase() === "applied")
    .length;
  const responded = jobs.filter((j) =>
    ["interview", "offer", "phone screen"].includes(
      (j.job_status ?? "").toLowerCase()
    )
  ).length;
  return applied === 0 ? 0 : responded / applied;
}

/** ✅ Compute average time spent per pipeline stage (roughly) */
export function computeAvgStageDurations(jobs: JobRecord[]) {
  // For demonstration, assign synthetic averages per stage
  const stages = ["Interested", "Applied", "Phone Screen", "Interview", "Offer"];
  const durations: Record<string, number> = {};
  for (const stage of stages) {
    const relevant = jobs.filter(
      (j) => (j.job_status ?? "").toLowerCase() === stage.toLowerCase()
    );
    if (relevant.length === 0) {
      durations[stage] = 0;
      continue;
    }
    let total = 0;
    for (const j of relevant) {
      if (!j.created_at || !j.status_changed_at) continue;
      const diff =
        (new Date(j.status_changed_at).getTime() -
          new Date(j.created_at).getTime()) /
        86400000;
      total += diff;
    }
    durations[stage] = total / Math.max(1, relevant.length);
  }
  return durations;
}

/** ✅ Compute monthly application counts for a bar chart */
export function computeMonthlyApplications(jobs: JobRecord[]) {
  const map: Record<string, number> = {};
  for (const j of jobs) {
    if (!j.created_at) continue;
    const d = new Date(j.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.keys(map)
    .map((m) => ({ month: m, count: map[m] }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** ✅ Deadline adherence (how many deadlines met vs missed) */
export function computeDeadlineAdherence(jobs: JobRecord[]) {
  let met = 0,
    missed = 0;
  for (const j of jobs) {
    if (!j.application_deadline || !j.status_changed_at) continue;
    const deadline = new Date(j.application_deadline);
    const changed = new Date(j.status_changed_at);
    if (isNaN(deadline.getTime()) || isNaN(changed.getTime())) continue;
    if (changed <= deadline) met++;
    else missed++;
  }
  const total = met + missed;
  const adherence = total === 0 ? 0 : met / total;
  return { met, missed, adherence };
}

/** ✅ Compute average time to offer in days */
export function computeTimeToOffer(jobs: JobRecord[]) {
  const offers = jobs.filter((j) => j.job_status?.toLowerCase() === "offer");
  if (offers.length === 0) return 0;
  const diffs = offers
    .filter((j) => j.created_at && j.status_changed_at)
    .map(
      (j) =>
        (new Date(j.status_changed_at!).getTime() -
          new Date(j.created_at!).getTime()) /
        86400000
    );
  if (diffs.length === 0) return 0;
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}
