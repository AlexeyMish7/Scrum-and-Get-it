import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import type { JobRecord } from "../../job_pipeline/pages/AnalyticsPage/analyticsHelpers";
import aiClient from "@shared/services/ai/client";
import aiArtifacts from "@shared/services/aiArtifacts";
import { aiKeys } from "@shared/cache/aiQueryKeys";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCorePreparationActivities } from "@shared/cache/coreFetchers";

export type Prediction = {
  id?: string | number;
  kind: string;
  summary?: string;
  score?: number | Record<string, number>;
  confidence?: number;
  confidenceInterval?: [number, number];
  recommendations?: string[];
  scenarioAnalysis?: Record<string, number>;
  accuracyHistory?: number[];
  details?: Record<string, unknown> | string;
  created_at?: string | Date;
};

type JobSearchPredictionsResult = {
  predictions: Prediction[];
  rawResponse: any;
  simulated: boolean;
};

/**
 * useJobPredictions
 * - Accepts optional jobs list
 * - Generates predictions for job search outcomes
 * - Supports confidence intervals, scenario planning, and recommendations
 */
export function useJobPredictions(initialJobs?: JobRecord[]) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [jobs, setJobs] = useState<JobRecord[]>(initialJobs ?? []);

  const queryClient = useQueryClient();
  const [fingerprint, setFingerprint] = useState<string>(() =>
    computeJobsFingerprint(initialJobs ?? [])
  );

  // Sync internal jobs state when initialJobs changes
  useEffect(() => {
    if (initialJobs) {
      setJobs(initialJobs);
      setFingerprint(computeJobsFingerprint(initialJobs));
    }
  }, [initialJobs]);

  // Note: We don't auto-run predictions on job changes anymore to avoid duplicate calls.
  // The parent component (AIWorkspaceHub) explicitly calls runPredictions() when ready.

  const queryKey = aiKeys.jobSearchPredictions(
    userId ?? "anonymous",
    fingerprint || "no-jobs"
  );

  const predictionsQuery = useQuery<JobSearchPredictionsResult>({
    queryKey,
    // We only fetch when explicitly triggered (runPredictions), but we still want
    // to subscribe to cached data for this key.
    enabled: false,
    staleTime: 30 * 60 * 1000, // avoid repeated AI calls within a session
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      if (!jobs.length) throw new Error("No jobs to analyze");
      return await fetchJobSearchPredictions({ userId, jobs });
    },
  });

  const runMutation = useMutation({
    mutationFn: async (params: { userId: string; jobs: JobRecord[] }) => {
      const prepActivities = await queryClient
        .ensureQueryData({
          queryKey: coreKeys.preparationActivities(params.userId),
          queryFn: () => fetchCorePreparationActivities(params.userId),
          staleTime: 60 * 60 * 1000,
        })
        .catch(() => []);

      return await fetchJobSearchPredictions({
        ...params,
        prepActivities: Array.isArray(prepActivities) ? prepActivities : [],
      });
    },
  });

  // runPredictions can accept an override job list. We store the result in the
  // React Query cache keyed by (userId + jobs fingerprint) so we dedupe calls.
  const runPredictions = useCallback(
    async (overrideJobs?: JobRecord[]) => {
      if (!userId) return null;

      const jobsToUse = overrideJobs ?? jobs;
      if (!jobsToUse.length) return null;

      const nextFingerprint = computeJobsFingerprint(jobsToUse);
      setFingerprint(nextFingerprint);
      if (overrideJobs) setJobs(overrideJobs);

      const key = aiKeys.jobSearchPredictions(userId, nextFingerprint);
      const cached = queryClient.getQueryData<JobSearchPredictionsResult>(key);
      if (cached) return cached;

      const result = await runMutation.mutateAsync({ userId, jobs: jobsToUse });
      queryClient.setQueryData(key, result);
      return result;
    },
    [jobs, queryClient, runMutation, userId]
  );

  const saveArtifact = useCallback(
    async (opts?: { title?: string; metadata?: Record<string, unknown> }) => {
      if (!userId) return { error: { message: "Not authenticated" } };
      try {
        const res = await aiArtifacts.insertAiArtifact(userId, {
          kind: "prediction",
          title: opts?.title ?? "Job Predictions",
          content: {
            predictions: predictionsQuery.data?.predictions ?? [],
            raw: predictionsQuery.data?.rawResponse ?? null,
          },
          metadata: opts?.metadata ?? {},
        } as any);
        return res;
      } catch (e) {
        return { data: null, error: { message: String(e) } };
      }
    },
    [
      predictionsQuery.data?.predictions,
      predictionsQuery.data?.rawResponse,
      userId,
    ]
  );

  return {
    jobs,
    setJobs,
    predictions: predictionsQuery.data?.predictions ?? [],
    isLoading: predictionsQuery.isFetching || runMutation.isPending,
    error:
      (predictionsQuery.error as any)?.message ??
      (runMutation.error as any)?.message ??
      null,
    rawResponse: predictionsQuery.data?.rawResponse ?? null,
    runPredictions,
    saveArtifact,
  };
}

/**
 * Simulate predictions locally if backend fails
 */
function simulatePredictions(jobs: JobRecord[]): Prediction[] {
  const total = jobs.length;
  const offers = jobs.filter((j) =>
    (j.job_status ?? "").toLowerCase().includes("offer")
  ).length;
  const interviews = jobs.filter((j) => {
    const s = (j.job_status ?? "").toLowerCase();
    return s.includes("interview") || s.includes("phone");
  }).length;

  // Interview success probability
  const interviewProb = Math.min(
    0.95,
    Math.max(0.05, 0.15 + (interviews / Math.max(1, total)) * 0.6)
  );
  // Offer probability
  const offerProb = Math.min(
    0.9,
    Math.max(0.01, 0.03 + (offers / Math.max(1, total)) * 0.7)
  );
  // Job search timeline (weeks)
  const timelineWeeks = Math.max(4, Math.round(12 - interviews));
  // Salary negotiation probability (simulated)
  const salaryProb = Math.min(
    0.85,
    Math.max(0.05, 0.3 + (offers / Math.max(1, total)) * 0.4)
  );
  // Optimal timing score (0-1)
  const optimalTiming = Math.min(
    1,
    Math.max(0, 0.5 + (interviews / Math.max(1, total)) * 0.3)
  );

  // Keep this aligned with the server contract: exactly 3 predictions.
  const preds: Prediction[] = [
    {
      kind: "interview_probability",
      summary:
        "Estimated probability of getting interviews based on activity and past performance",
      // IMPORTANT: score is a probability in [0,1]. UI multiplies by 100.
      score: interviewProb,
      confidence: 0.6,
      confidenceInterval: [
        Math.max(0, interviewProb - 0.1),
        Math.min(1, interviewProb + 0.1),
      ],
      recommendations: [
        "Practice behavioral questions",
        "Schedule mock interviews",
        "Tailor resume for target roles",
      ],
      scenarioAnalysis: {
        "Apply to 5 jobs/week": Math.min(1, interviewProb + 0.05),
        "Apply to 10 jobs/week": Math.min(1, interviewProb + 0.12),
      },
      accuracyHistory: [],
      details: { interviews, total },
      created_at: new Date(),
    },
    {
      kind: "offer_probability",
      summary: "Estimated probability of receiving an offer",
      // IMPORTANT: score is a probability in [0,1]. UI multiplies by 100.
      score: offerProb,
      confidence: 0.55,
      confidenceInterval: [
        Math.max(0, offerProb - 0.1),
        Math.min(1, offerProb + 0.1),
      ],
      recommendations: [
        "Target high-fit roles",
        "Prepare post-interview follow-ups",
      ],
      scenarioAnalysis: {
        "Apply to 5 jobs/week": Math.min(1, offerProb + 0.05),
        "Apply to 10 jobs/week": Math.min(1, offerProb + 0.1),
      },
      accuracyHistory: [],
      details: { offers, total },
      created_at: new Date(),
    },
    {
      kind: "timeline_weeks",
      summary: "Estimated weeks to secure an offer",
      score: timelineWeeks,
      confidence: 0.5,
      confidenceInterval: [Math.max(1, timelineWeeks - 2), timelineWeeks + 2],
      recommendations: [
        "Increase weekly application volume to shorten timeline",
      ],
      details: { timelineWeeks },
      created_at: new Date(),
    },
  ];

  return preds;
}

function computeJobsFingerprint(jobs: JobRecord[]): string {
  if (!jobs.length) return "no-jobs";

  // Stable, order-independent fingerprint so React Query caches predictably.
  // Include fields that change when a job progresses through the pipeline.
  const parts = jobs
    .map((j) => {
      const id = String(j.id ?? "");
      const status = String(j.job_status ?? "");
      const statusChanged = String(j.status_changed_at ?? "");
      const created = String(j.created_at ?? "");
      return `${id}|${status}|${statusChanged}|${created}`;
    })
    .sort();

  // Non-crypto hash to keep keys short.
  let hash = 5381;
  const joined = parts.join(";");
  for (let i = 0; i < joined.length; i++) {
    hash = (hash * 33) ^ joined.charCodeAt(i);
  }
  return `v1_${(hash >>> 0).toString(16)}`;
}

async function fetchJobSearchPredictions(params: {
  userId: string;
  jobs: JobRecord[];
  prepActivities?: any[];
}): Promise<JobSearchPredictionsResult> {
  const { userId, jobs, prepActivities: prepActivitiesOverride } = params;

  // Fetch user's preparation activities and local attempts to enrich job context
  const prepActivities: any[] = Array.isArray(prepActivitiesOverride)
    ? prepActivitiesOverride
    : [];

  let localAttempts: any[] = [];
  try {
    const raw = localStorage.getItem("sgt:technical_prep_attempts");
    localAttempts = raw ? JSON.parse(raw) : [];
  } catch {
    // ignore local cache read failures
  }

  // Build compact job objects enriched with prep summaries so the AI can use them
  const compact = jobs.map((j) => {
    const jobTitle = String(j.job_title || "").toLowerCase();
    const company = String(j.company_name || "").toLowerCase();

    // aggregate prep activities related to this job
    let prepMinutes = 0;
    let mockCount = 0;
    for (const r of prepActivities) {
      try {
        const dt = r.activity_date ? new Date(r.activity_date) : null;
        // consider recent activities only (90 days)
        if (dt && Date.now() - dt.getTime() > 90 * 24 * 3600 * 1000) continue;
      } catch {}

      if (r.job_id && String(r.job_id) === String(j.id)) {
        prepMinutes += Number(r.time_spent_minutes) || 0;
        const at = String(r.activity_type || "").toLowerCase();
        if (at.includes("mock") || at.includes("interview")) mockCount++;
        continue;
      }

      const desc = (
        String(r.activity_description || "") +
        " " +
        String(r.notes || "")
      ).toLowerCase();
      if (jobTitle && desc.includes(jobTitle)) {
        prepMinutes += Number(r.time_spent_minutes) || 0;
        const at = String(r.activity_type || "").toLowerCase();
        if (at.includes("mock") || at.includes("interview")) mockCount++;
        continue;
      }
      if (company && desc.includes(company)) {
        prepMinutes += Number(r.time_spent_minutes) || 0;
        const at = String(r.activity_type || "").toLowerCase();
        if (at.includes("mock") || at.includes("interview")) mockCount++;
        continue;
      }
    }

    // include local attempts
    let localPracticeMin = 0;
    let localMockCount = 0;
    for (const a of localAttempts) {
      try {
        if (a.jobId && String(a.jobId) === String(j.id)) {
          localPracticeMin += (Number(a.elapsedMs) || 0) / 60000;
          const origin = String(a.origin || "").toLowerCase();
          if (origin.includes("mock") || origin.includes("interview"))
            localMockCount++;
          continue;
        }
        const txt = (
          String(a.text || a.question || "") +
          " " +
          String(a.code || "") +
          " " +
          String(a.origin || "")
        ).toLowerCase();
        if (jobTitle && txt.includes(jobTitle)) {
          localPracticeMin += (Number(a.elapsedMs) || 0) / 60000;
          const origin = String(a.origin || "").toLowerCase();
          if (origin.includes("mock") || origin.includes("interview"))
            localMockCount++;
          continue;
        }
        if (company && txt.includes(company)) {
          localPracticeMin += (Number(a.elapsedMs) || 0) / 60000;
          const origin = String(a.origin || "").toLowerCase();
          if (origin.includes("mock") || origin.includes("interview"))
            localMockCount++;
          continue;
        }
      } catch {}
    }

    return {
      id: j.id,
      title: j.job_title,
      company: j.company_name,
      industry: j.industry,
      created_at: j.created_at,
      status_changed_at: j.status_changed_at,
      job_status: j.job_status,
      prep_summary: {
        prepMinutes: Math.round(prepMinutes),
        mockCount,
        localPracticeMin: Math.round(localPracticeMin),
        localMockCount,
      },
    };
  });

  const payload = { jobs: compact };

  // Call the frontend aiClient which posts to the server prediction endpoint.
  try {
    const res = await aiClient.postJson<{
      predictions?: Prediction[];
      debug?: any;
    }>("/api/predict/job-search", payload, userId);

    if (res && Array.isArray(res.predictions) && res.predictions.length) {
      const normalized = res.predictions.map((p, i) => ({
        id: p.id ?? `pred_${i}`,
        ...p,
        created_at: p.created_at ? new Date(p.created_at) : new Date(),
      }));
      return {
        predictions: normalized,
        rawResponse: res.debug ?? res,
        simulated: false,
      };
    }
  } catch (e) {
    // fall through to local simulation
    console.warn("useJobPredictions: AI call failed, using simulation", e);
  }

  return {
    predictions: simulatePredictions(jobs),
    rawResponse: { simulated: true },
    simulated: true,
  };
}

export default useJobPredictions;
