/**
 * Local analytics store for cover letter performance tracking.
 *
 * PURPOSE:
 * - Persist simple report events locally (frontend-only for Sprint 2)
 * - Provide utilities to compute response rates by template, A/B test groups,
 *   and export reports for offline analysis.
 *
 * Data model (stored in localStorage under `sgt:cover_letter_reports`):
 * {
 *   id: string,
 *   draftId?: string,
 *   jobId?: number,
 *   templateId?: string,
 *   abTestGroup?: string,
 *   sentAt: string (ISO),
 *   outcome: 'no_response'|'response'|'interview'|'offer'|'rejected',
 *   notes?: string
 * }
 */

type Outcome = "no_response" | "response" | "interview" | "offer" | "rejected";

export interface CoverLetterReport {
  id: string;
  draftId?: string;
  jobId?: number;
  templateId?: string;
  abTestGroup?: string;
  sentAt: string;
  outcome: Outcome;
  notes?: string;
}

const STORAGE_KEY = "sgt:cover_letter_reports";

function readAll(): CoverLetterReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CoverLetterReport[];
  } catch (e) {
    console.error("Failed to read cover letter reports:", e);
    return [];
  }
}

function writeAll(items: CoverLetterReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to write cover letter reports:", e);
  }
}

function makeId() {
  // Small, dependency-free id generator sufficient for local-only usage
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9)
  );
}

export function recordCoverLetterOutcome(input: {
  draftId?: string;
  jobId?: number;
  templateId?: string;
  abTestGroup?: string;
  outcome: Outcome;
  notes?: string;
  sentAt?: string;
}): CoverLetterReport {
  const all = readAll();
  const rec: CoverLetterReport = {
    id: makeId(),
    draftId: input.draftId,
    jobId: input.jobId,
    templateId: input.templateId,
    abTestGroup: input.abTestGroup,
    outcome: input.outcome,
    notes: input.notes,
    sentAt: input.sentAt || new Date().toISOString(),
  };
  all.push(rec);
  writeAll(all);
  return rec;
}

export function listCoverLetterReports(opts?: {
  draftId?: string;
  jobId?: number;
  templateId?: string;
  since?: string; // ISO
}): CoverLetterReport[] {
  const all = readAll();
  return all.filter((r) => {
    if (opts?.draftId && r.draftId !== opts.draftId) return false;
    if (opts?.jobId && r.jobId !== opts.jobId) return false;
    if (opts?.templateId && r.templateId !== opts.templateId) return false;
    if (opts?.since && new Date(r.sentAt) < new Date(opts.since)) return false;
    return true;
  });
}

export function clearAllReports() {
  writeAll([]);
}

export function exportReportsJSON(): string {
  const all = readAll();
  return JSON.stringify({ exportedAt: new Date().toISOString(), reports: all }, null, 2);
}

export function getTemplateStats() {
  const all = readAll();
  const byTemplate: Record<
    string,
    { sent: number; responses: number; interviews: number; offers: number }
  > = {};

  for (const r of all) {
    const key = r.templateId || "(unknown)";
    if (!byTemplate[key])
      byTemplate[key] = { sent: 0, responses: 0, interviews: 0, offers: 0 };
    byTemplate[key].sent += 1;
    if (r.outcome === "response") byTemplate[key].responses += 1;
    if (r.outcome === "interview") byTemplate[key].interviews += 1;
    if (r.outcome === "offer") byTemplate[key].offers += 1;
  }

  const result = Object.entries(byTemplate).map(([templateId, metrics]) => {
    const responseRate = metrics.sent ? metrics.responses / metrics.sent : 0;
    const interviewRate = metrics.sent ? metrics.interviews / metrics.sent : 0;
    const offerRate = metrics.sent ? metrics.offers / metrics.sent : 0;
    // Simple effectiveness score: weighted sum
    const score = responseRate * 0.5 + interviewRate * 0.3 + offerRate * 0.2;
    return {
      templateId,
      sent: metrics.sent,
      responses: metrics.responses,
      interviews: metrics.interviews,
      offers: metrics.offers,
      responseRate,
      interviewRate,
      offerRate,
      score,
    };
  });

  // Sort by score desc
  result.sort((a, b) => b.score - a.score);
  return result;
}

export function getOverallStats() {
  const all = readAll();
  const sent = all.length;
  const responses = all.filter((r) => r.outcome === "response").length;
  const interviews = all.filter((r) => r.outcome === "interview").length;
  const offers = all.filter((r) => r.outcome === "offer").length;
  return {
    sent,
    responses,
    interviews,
    offers,
    responseRate: sent ? responses / sent : 0,
    interviewRate: sent ? interviews / sent : 0,
    offerRate: sent ? offers / sent : 0,
  };
}

export function getABTestSummary() {
  const all = readAll();
  const byGroup: Record<string, { sent: number; responses: number }> = {};
  for (const r of all) {
    const g = r.abTestGroup || "(none)";
    if (!byGroup[g]) byGroup[g] = { sent: 0, responses: 0 };
    byGroup[g].sent += 1;
    if (r.outcome === "response") byGroup[g].responses += 1;
  }
  return Object.entries(byGroup).map(([group, m]) => ({
    group,
    sent: m.sent,
    responses: m.responses,
    responseRate: m.sent ? m.responses / m.sent : 0,
  }));
}

export default {
  recordCoverLetterOutcome,
  listCoverLetterReports,
  clearAllReports,
  exportReportsJSON,
  getTemplateStats,
  getOverallStats,
  getABTestSummary,
};
