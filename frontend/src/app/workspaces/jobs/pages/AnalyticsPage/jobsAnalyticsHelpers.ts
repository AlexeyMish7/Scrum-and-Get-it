/**
 * jobsAnalyticsHelpers.ts
 *
 * Additive helper utilities for computing jobs analytics.
 * These functions are pure and do not change any existing files.
 * Import them from pages or components as needed.
 */

export type JobRow = {
  id?: number | string;
  job_title?: string | null;
  company_name?: string | null;
  industry?: string | null;
  job_type?: string | null;
  application_method?: string | null;
  created_at?: string | null;
  status_changed_at?: string | null;
  job_status?: string | null;
  application_deadline?: string | null;
};

/** Compute a funnel breakdown from a list of jobs.
 * Returns a record of stage -> count. Known stages returned as keys: Interested, Applied, Phone Screen, Interview, Offer, Rejected, Unknown
 */
export function computeFunnel(rows: JobRow[]) {
  const buckets: Record<string, number> = {
    Interested: 0,
    Applied: 0,
    "Phone Screen": 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
    Unknown: 0,
  };
  for (const r of rows) {
    const s = (r.job_status ?? "Unknown") as string;
    if (buckets[s] !== undefined) buckets[s] += 1;
    else buckets.Unknown += 1;
  }
  return buckets;
}

/** Compute average time-to-response (in days) grouped by a key selector.
 * - groupByFn maps a JobRow to a grouping string (company or industry)
 * - topN controls how many groups to return (sorted by count desc)
 */
export function computeAvgResponseDays(rows: JobRow[], groupByFn: (r: JobRow) => string, topN = 10) {
  const map: Record<string, { totalDays: number; count: number }> = {};
  for (const r of rows) {
    // skip if both timestamps are missing
    if (!r.created_at && !r.status_changed_at) continue;
    // provide safe fallbacks: created -> 7 days ago, changed -> now
    const created = r.created_at ? new Date(r.created_at) : new Date(Date.now() - 7 * 86400000);
    const changed = r.status_changed_at ? new Date(r.status_changed_at) : new Date();
    if (isNaN(created.getTime()) || isNaN(changed.getTime())) continue;
    const days = (changed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const key = groupByFn(r) ?? "(unknown)";
    if (!map[key]) map[key] = { totalDays: 0, count: 0 };
    map[key].totalDays += days;
    map[key].count += 1;
  }
  const out: Array<{ key: string; avgDays: number; count: number }> = [];
  for (const k of Object.keys(map)) out.push({ key: k, avgDays: map[k].totalDays / map[k].count, count: map[k].count });
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, topN);
}

/** Compute success rates grouped by a key selector (offers / total)
 * Returns array of { key, offers, total, rate }
 */
export function computeSuccessRates(rows: JobRow[], groupByFn: (r: JobRow) => string) {
  const map: Record<string, { offers: number; total: number }> = {};
  for (const r of rows) {
    const key = groupByFn(r) ?? "(unknown)";
    if (!map[key]) map[key] = { offers: 0, total: 0 };
    map[key].total += 1;
    // handle missing or blank status; count any status that contains "offer"
    const status = ((r.job_status ?? "") as string).toLowerCase();
    if (status.includes("offer")) map[key].offers += 1;
  }
  const out = Object.keys(map).map((k) => ({ key: k, offers: map[k].offers, total: map[k].total, rate: map[k].offers / Math.max(1, map[k].total) }));
  out.sort((a, b) => b.rate - a.rate);
  return out;
}

/** Build weekly trends (count of created jobs per ISO-style week) for the last `weeks` weeks.
 * Returns array of { week: string, count }
 */
export function computeWeeklyTrends(rows: JobRow[], weeks = 12) {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const w = `${d.getFullYear()}-${getWeekNumber(d)}`;
    buckets[w] = 0;
  }
  for (const r of rows) {
    if (!r.created_at) continue;
    const d = new Date(r.created_at);
    if (isNaN(d.getTime())) continue;
    const w = `${d.getFullYear()}-${getWeekNumber(d)}`;
    if (buckets[w] === undefined) buckets[w] = 0; // include out-of-range weeks
    buckets[w] += 1;
  }
  return Object.keys(buckets).map((k) => ({ week: k, count: buckets[k] })).sort((a, b) => a.week.localeCompare(b.week));
}

/** Simple recommendations derived from metrics. Non-destructive; returns a string array.
 * - Accepts funnel, avgResponseByIndustry (from computeAvgResponseDays), weeklyTrends, and a weeklyGoal number
 */
export function recommendActions(
  funnel: Record<string, number>,
  avgResponseByIndustry: Array<{ key: string; avgDays: number; count: number }>,
  weeklyTrends: Array<{ week: string; count: number }>,
  weeklyGoal = 5
) {
  const recs: string[] = [];
  const offers = funnel["Offer"] ?? 0;
  const total = Object.values(funnel).reduce((a, b) => a + b, 0) || 1;
  const offerRate = offers / total;
  if (offerRate < 0.05) recs.push("Offer rate is low. Try improving tailoring and applying to higher-match roles.");
  if (avgResponseByIndustry.length && avgResponseByIndustry[0].avgDays > 14) recs.push("Response times are long for common industries; consider earlier follow-ups.");
  const thisWeek = weeklyTrends.length ? weeklyTrends[weeklyTrends.length - 1].count : 0;
  if (thisWeek < weeklyGoal) recs.push("You're below your weekly application goal — schedule focused application time.");
  if (recs.length === 0) recs.push("Analytics look healthy — continue monitoring trends.");
  return recs;
}

/** Build rows suitable for CSV export (array of arrays) from computed metrics. Pure helper — does not trigger downloads.
 * Consumers can stringify and download as needed.
 */
export function buildCsvRows(
  funnel: Record<string, number>,
  avgByCompany: Array<{ key: string; avgDays: number; count: number }>,
  successByIndustry: Array<{ key: string; rate: number; offers: number; total: number }>,
  weeklyGoal: number
) {
  const rows: string[][] = [];
  rows.push(["Metric", "Value"]);
  rows.push(["Total jobs", String(Object.values(funnel).reduce((a, b) => a + b, 0))]);
  rows.push(["Offers", String(funnel["Offer"] ?? 0)]);
  rows.push(["Offer rate", String(((funnel["Offer"] ?? 0) / Math.max(1, Object.values(funnel).reduce((a, b) => a + b, 0))).toFixed(3))]);
  rows.push(["Weekly goal", String(weeklyGoal)]);
  rows.push([]);
  rows.push(["Funnel breakdown"]);
  for (const k of Object.keys(funnel)) rows.push([k, String(funnel[k])]);
  rows.push([]);
  rows.push(["Avg response by company (days)"]);
  for (const r of avgByCompany) rows.push([r.key, String(r.avgDays.toFixed(1)), String(r.count)]);
  rows.push([]);
  rows.push(["Success by industry"]);
  for (const r of successByIndustry) rows.push([r.key, String((r.rate * 100).toFixed(1) + "%"), String(r.offers), String(r.total)]);
  return rows;
}

// --- small helper: ISO-like week number ---
function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7).toString().padStart(2, "0");
}
