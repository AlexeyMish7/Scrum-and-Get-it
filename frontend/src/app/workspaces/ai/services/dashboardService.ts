import { supabase } from "@shared/services/supabaseClient";
import type { AiArtifactKind } from "@shared/services/types/aiArtifacts";

export interface QuickStats {
  resumes: number;
  coverLetters: number;
  avgMatchScore: number | null;
  jobsAnalyzed: number;
}

export interface RecentArtifact {
  id: string;
  kind: AiArtifactKind;
  title: string;
  createdAt: string;
  jobId: number | null;
  summary?: string | null;
}

export interface DeadlineRadarItem {
  jobId: number;
  title: string;
  company: string;
  deadline: string;
  daysRemaining: number;
  status: string;
}

export interface SkillGapItem {
  skill: string;
  suggestion?: string;
}

export interface InsightItem {
  title: string;
  summary?: string;
  company?: string;
  date?: string;
  source?: string;
  link?: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function toTrimmedStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.trim().length > 0
    )
    .map((entry) => entry.trim());
}

export interface WorkflowTask {
  id: string;
  label: string;
  hint?: string;
  route?: string;
  completed: boolean;
}

export interface AiDashboardSnapshot {
  quickStats: QuickStats;
  recentArtifacts: RecentArtifact[];
  deadlines: DeadlineRadarItem[];
  skillGaps: SkillGapItem[];
  insights: InsightItem[];
  workflow: WorkflowTask[];
  lastUpdated: string;
}

interface MatchArtifactRow {
  id: string;
  job_id: number | string | null;
  content: UnknownRecord | null;
  created_at: string | null;
  title: string | null;
}

interface CompanyResearchRow {
  content: UnknownRecord | null;
  created_at: string | null;
  title: string | null;
}

function ensureNoError(
  res: { error?: { message?: string | null } | null },
  label: string
) {
  if (res.error) {
    throw new Error(res.error.message || `Failed to load ${label}`);
  }
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function daysUntil(dateStr: string): number | null {
  const ts = Date.parse(dateStr);
  if (Number.isNaN(ts)) return null;
  const diff = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

export async function fetchAIDashboardSnapshot(
  userId: string
): Promise<AiDashboardSnapshot> {
  if (!userId) {
    throw new Error("User id is required to load AI dashboard data");
  }

  const [
    resumeCountRes,
    coverCountRes,
    matchRowsRes,
    recentArtifactsRes,
    jobsRes,
    jobArtifactRes,
    researchRes,
  ] = await Promise.all([
    supabase
      .from("ai_artifacts")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("kind", "resume"),
    supabase
      .from("ai_artifacts")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("kind", "cover_letter"),
    supabase
      .from("ai_artifacts")
      .select("id, job_id, content, created_at, title")
      .eq("user_id", userId)
      .eq("kind", "match")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("ai_artifacts")
      .select("id, kind, job_id, title, created_at, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("jobs")
      .select(
        "id, job_title, company_name, application_deadline, job_status, status_changed_at, created_at"
      )
      .eq("user_id", userId)
      .order("application_deadline", { ascending: true })
      .limit(100),
    supabase
      .from("ai_artifacts")
      .select("job_id, kind")
      .eq("user_id", userId)
      .not("job_id", "is", null)
      .limit(500),
    supabase
      .from("ai_artifacts")
      .select("content, created_at, title")
      .eq("user_id", userId)
      .eq("kind", "company_research")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  ensureNoError(resumeCountRes, "resume count");
  ensureNoError(coverCountRes, "cover letter count");
  ensureNoError(matchRowsRes, "match data");
  ensureNoError(recentArtifactsRes, "recent artifacts");
  ensureNoError(jobsRes, "jobs");
  ensureNoError(jobArtifactRes, "job artifact map");
  ensureNoError(researchRes, "company research insights");

  const resumeCount =
    typeof resumeCountRes.count === "number" ? resumeCountRes.count : 0;
  const coverLetterCount =
    typeof coverCountRes.count === "number" ? coverCountRes.count : 0;

  const matchRows = (matchRowsRes.data ?? []) as MatchArtifactRow[];

  const matchScores = matchRows
    .map((row) => {
      const content = row.content ?? {};
      const score =
        typeof content.matchScore === "number"
          ? content.matchScore
          : typeof content.overall_score === "number"
          ? content.overall_score
          : null;
      return Number.isFinite(score) ? Number(score) : null;
    })
    .filter((value): value is number => value !== null);

  const avgMatchScore =
    matchScores.length > 0
      ? Math.round(
          matchScores.reduce((sum, value) => sum + value, 0) /
            matchScores.length
        )
      : null;

  const artifactRows = (recentArtifactsRes.data ?? []) as Array<
    MatchArtifactRow & { kind: AiArtifactKind }
  >;

  const recentArtifacts: RecentArtifact[] = artifactRows.map((row) => {
    const summary = (() => {
      const c = row.content ?? {};
      const resumeSummary = c["summary"];
      if (row.kind === "resume" && typeof resumeSummary === "string") {
        return resumeSummary.slice(0, 120);
      }
      if (row.kind === "cover_letter") {
        const sections = c["sections"];
        if (isRecord(sections) && typeof sections["opening"] === "string") {
          return (sections["opening"] as string).slice(0, 120);
        }
      }
      const matchScore = c["matchScore"];
      const overallScore = c["overall_score"];
      if (row.kind === "match" && typeof matchScore === "number") {
        return `Match score: ${matchScore}%`;
      }
      if (row.kind === "match" && typeof overallScore === "number") {
        return `Match score: ${overallScore}%`;
      }
      if (row.kind === "company_research" && typeof c["name"] === "string") {
        const recentNews = Array.isArray(c["recent_news"])
          ? (c["recent_news"] as unknown[])
          : [];
        const firstHeadline = recentNews.find((newsItem) => {
          return isRecord(newsItem) && typeof newsItem["title"] === "string";
        });
        if (
          isRecord(firstHeadline) &&
          typeof firstHeadline["title"] === "string"
        ) {
          return `${c["name"]}: ${firstHeadline["title"]}`;
        }
      }
      return null;
    })();

    return {
      id: row.id,
      kind: row.kind,
      title: row.title ?? "Untitled",
      createdAt: row.created_at ?? new Date().toISOString(),
      jobId: normalizeNumber(row.job_id),
      summary,
    };
  });

  const jobRows = jobsRes.data ?? [];

  const deadlines: DeadlineRadarItem[] = jobRows
    .filter((job) => job.application_deadline)
    .map((job) => {
      const normalizedJobId = normalizeNumber(job.id);
      if (normalizedJobId === null) return null;
      const deadlineStr = job.application_deadline as string;
      const days = daysUntil(deadlineStr);
      if (days === null) return null;
      return {
        jobId: normalizedJobId,
        title: job.job_title ?? "Untitled role",
        company: job.company_name ?? "Unknown company",
        deadline: deadlineStr,
        daysRemaining: days,
        status: (job.job_status ?? "unknown").toString(),
      };
    })
    .filter((item): item is DeadlineRadarItem => Boolean(item))
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  const artifactMap = new Map<
    number,
    { hasResume: boolean; hasCover: boolean; hasMatch: boolean }
  >();
  (jobArtifactRes.data ?? []).forEach((row) => {
    const jobId = normalizeNumber(row.job_id);
    if (jobId === null) return;
    const kind = String(row.kind) as AiArtifactKind;
    if (!artifactMap.has(jobId)) {
      artifactMap.set(jobId, {
        hasResume: false,
        hasCover: false,
        hasMatch: false,
      });
    }
    const entry = artifactMap.get(jobId)!;
    if (kind === "resume") entry.hasResume = true;
    if (kind === "cover_letter") entry.hasCover = true;
    if (kind === "match") entry.hasMatch = true;
  });

  const jobsAnalyzed = artifactMap.size;

  const skillSuggestionsSource = matchRows.find((row) => {
    const candidate = row.content?.skillsSuggestions;
    return Array.isArray(candidate) && candidate.length > 0;
  });

  const rawSkills = skillSuggestionsSource?.content?.skillsSuggestions;
  const skillsSuggestions = toTrimmedStringArray(rawSkills);

  const rawExperience = skillSuggestionsSource?.content?.experienceSuggestions;
  const experienceSuggestions = toTrimmedStringArray(rawExperience);

  const skillGaps: SkillGapItem[] = skillsSuggestions
    .slice(0, 4)
    .map((skill, index) => ({
      skill,
      suggestion: experienceSuggestions[index],
    }));

  const insightRows = (researchRes.data ?? []) as CompanyResearchRow[];

  const insights: InsightItem[] = [];
  insightRows.forEach((row) => {
    const content = row.content ?? {};
    const companyName =
      typeof content.name === "string"
        ? content.name
        : typeof row.title === "string"
        ? row.title
        : "Company";
    const recentNews: UnknownRecord[] = Array.isArray(content.recent_news)
      ? content.recent_news.filter(isRecord)
      : [];
    recentNews.slice(0, 2).forEach((news) => {
      if (typeof news.title === "string") {
        insights.push({
          title: news.title,
          summary: typeof news.summary === "string" ? news.summary : undefined,
          company: companyName,
          date: typeof news.date === "string" ? news.date : undefined,
          source: typeof news.source === "string" ? news.source : undefined,
          link:
            typeof news.url === "string"
              ? news.url
              : typeof news.link === "string"
              ? news.link
              : undefined,
        });
      }
    });
  });
  const prioritizedInsights = insights.slice(0, 5);

  const interestedJobs = jobRows.filter(
    (job) =>
      String(job.job_status ?? "").toLowerCase() === "interested" &&
      (job.application_deadline ?? job.created_at)
  );

  const jobsNeedingResume = interestedJobs.filter((job) => {
    const jobId = normalizeNumber(job.id);
    if (jobId === null) return false;
    const summary = artifactMap.get(jobId);
    return !summary?.hasResume;
  });

  const appliedJobs = jobRows.filter(
    (job) => String(job.job_status ?? "").toLowerCase() === "applied"
  );

  const jobsNeedingCover = appliedJobs.filter((job) => {
    const jobId = normalizeNumber(job.id);
    if (jobId === null) return false;
    const summary = artifactMap.get(jobId);
    return !summary?.hasCover;
  });

  const jobsMissingMatch = jobRows.filter((job) => {
    const jobId = normalizeNumber(job.id);
    if (jobId === null) return false;
    const summary = artifactMap.get(jobId);
    return !summary?.hasMatch;
  });

  const workflow: WorkflowTask[] = [];

  if (jobsNeedingResume.length > 0) {
    const job = jobsNeedingResume[0];
    workflow.push({
      id: `resume-${job.id}`,
      label: `Tailor resume for ${job.job_title ?? "next job"}`,
      hint: job.company_name ? `Target: ${job.company_name}` : undefined,
      route: "/ai/resume",
      completed: false,
    });
  } else {
    workflow.push({
      id: "resume-ready",
      label: "All interested jobs have tailored resumes",
      hint: "Nice work! Keep refining as new roles appear.",
      completed: true,
    });
  }

  if (jobsNeedingCover.length > 0) {
    const job = jobsNeedingCover[0];
    workflow.push({
      id: `cover-${job.id}`,
      label: `Write cover letter for ${job.job_title ?? "active job"}`,
      hint: job.company_name ? `Company: ${job.company_name}` : undefined,
      route: "/ai/cover-letter",
      completed: false,
    });
  } else {
    workflow.push({
      id: "cover-ready",
      label: "Cover letters prepped for applied jobs",
      completed: true,
    });
  }

  if (jobsMissingMatch.length > 0) {
    const job = jobsMissingMatch[0];
    workflow.push({
      id: `match-${job.id}`,
      label: `Run match analysis for ${job.job_title ?? "a tracked job"}`,
      hint: "Identify skill gaps before applying.",
      route: "/ai/job-match",
      completed: false,
    });
  } else {
    workflow.push({
      id: "match-ready",
      label: "Job match analyses saved for tracked roles",
      completed: true,
    });
  }

  return {
    quickStats: {
      resumes: resumeCount,
      coverLetters: coverLetterCount,
      avgMatchScore,
      jobsAnalyzed,
    },
    recentArtifacts,
    deadlines,
    skillGaps,
    insights: prioritizedInsights,
    workflow,
    lastUpdated: new Date().toISOString(),
  };
}

export default {
  fetchAIDashboardSnapshot,
};
