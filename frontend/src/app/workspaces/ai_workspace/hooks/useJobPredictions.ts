import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@shared/context/AuthContext";
import type { JobRecord } from "../../job_pipeline/pages/AnalyticsPage/analyticsHelpers";
import aiClient from "@shared/services/ai/client";
import aiArtifacts from "@shared/services/aiArtifacts";
import { listPreparationActivities } from "@shared/services/dbMappers";

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
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    if (initialJobs && initialJobs.length) setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (jobs.length > 0) {
      runPredictions();
    }
  }, [jobs]);

  const runPredictions = useCallback(
    async (overrideJobs?: JobRecord[]) => {
      const inputJobs = overrideJobs ?? jobs;
      if (!userId) {
        setError("User not authenticated");
        return null;
      }
      if (!inputJobs || inputJobs.length === 0) {
        setError("No jobs to analyze");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setRawResponse(null);

      try {
          // Fetch user's preparation activities and local attempts to enrich job context
          let prepActivities: any[] = [];
          try {
            const pa = await listPreparationActivities(userId, { limit: 1000 });
            if (!pa.error && Array.isArray(pa.data)) prepActivities = pa.data as any[];
          } catch (e) {
            // ignore prep fetch failures — predictions still proceed
          }

          let localAttempts: any[] = [];
          try {
            const raw = localStorage.getItem("sgt:technical_prep_attempts");
            localAttempts = raw ? JSON.parse(raw) : [];
          } catch {}

          // Build compact job objects enriched with prep summaries so the AI can use them
          const compact = inputJobs.map((j) => {
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

              const desc = (String(r.activity_description || "") + " " + String(r.notes || "")).toLowerCase();
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
                  if (origin.includes("mock") || origin.includes("interview")) localMockCount++;
                  continue;
                }
                const txt = (String(a.text || a.question || "") + " " + String(a.code || "") + " " + String(a.origin || "")).toLowerCase();
                if (jobTitle && txt.includes(jobTitle)) {
                  localPracticeMin += (Number(a.elapsedMs) || 0) / 60000;
                  const origin = String(a.origin || "").toLowerCase();
                  if (origin.includes("mock") || origin.includes("interview")) localMockCount++;
                  continue;
                }
                if (company && txt.includes(company)) {
                  localPracticeMin += (Number(a.elapsedMs) || 0) / 60000;
                  const origin = String(a.origin || "").toLowerCase();
                  if (origin.includes("mock") || origin.includes("interview")) localMockCount++;
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

        // Call the frontend aiClient which posts to the server prediction endpoint
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
          setPredictions(normalized);
          setRawResponse(res.debug ?? res);
        } else {
          const fallback = simulatePredictions(inputJobs);
          setPredictions(fallback);
          setRawResponse({ simulated: true });
        }
      } catch (e: any) {
        console.warn("useJobPredictions: AI call failed, using simulation", e);
        setError(e?.message ?? String(e));
        const fallback = simulatePredictions(inputJobs);
        setPredictions(fallback);
        setRawResponse({ error: String(e) });
      } finally {
        setIsLoading(false);
      }
      return;
    },
    [jobs, userId]
  );

  const saveArtifact = useCallback(
    async (opts?: { title?: string; metadata?: Record<string, unknown> }) => {
      if (!userId) return { error: { message: "Not authenticated" } };
      try {
        const res = await aiArtifacts.insertAiArtifact(userId, {
          kind: "prediction",
          title: opts?.title ?? "Job Predictions",
          content: { predictions, raw: rawResponse },
          metadata: opts?.metadata ?? {},
        } as any);
        return res;
      } catch (e) {
        return { data: null, error: { message: String(e) } };
      }
    },
    [userId, predictions, rawResponse]
  );

  return {
    jobs,
    setJobs,
    predictions,
    isLoading,
    error,
    rawResponse,
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

  const preds: Prediction[] = [
    {
      kind: "interview_probability",
      summary:
        "Estimated probability of getting interviews based on activity and past performance",
      score: Math.round(interviewProb * 100),
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
      score: Math.round(offerProb * 100),
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
    {
      kind: "salary_negotiation_probability",
      summary: "Estimated probability of successful salary negotiation",
      score: Math.round(salaryProb * 100),
      confidence: 0.5,
      confidenceInterval: [
        Math.max(0, salaryProb - 0.1),
        Math.min(1, salaryProb + 0.1),
      ],
      recommendations: [
        "Research industry salaries",
        "Prepare counter-offers",
        "Practice negotiation conversations",
      ],
      details: { offers },
      created_at: new Date(),
    },
    {
      kind: "optimal_career_timing",
      summary: "Optimal timing for career moves and job search activities",
      score: Math.round(optimalTiming * 100),
      confidence: 0.5,
      confidenceInterval: [
        Math.max(0, optimalTiming - 0.1),
        Math.min(1, optimalTiming + 0.1),
      ],
      recommendations: [
        "Prioritize applications to high-response companies",
        "Schedule networking activities early",
      ],
      details: { interviews, total },
      created_at: new Date(),
    },
  ];

  return preds;
}

export default useJobPredictions;
