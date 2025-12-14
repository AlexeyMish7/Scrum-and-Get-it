/* eslint-disable @typescript-eslint/no-explicit-any -- legacy component relies on dynamic row shapes; keep scoped until refactor */
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Divider,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchCoreJobs,
  fetchCorePreparationActivities,
  fetchScheduledInterviews,
} from "@shared/cache/coreFetchers";

// Local storage keys for checklist (kept locally for performance)
const PREP_CHECKLIST_KEY = "sgt:interview_prep";

function titleSimilarity(a?: string, b?: string) {
  if (!a || !b) return 0;
  const ta = String(a)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const tb = String(b)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (!ta.length || !tb.length) return 0;
  const setB = new Set(tb);
  const common = ta.filter((t) => setB.has(t)).length;
  const score = (common / Math.max(ta.length, tb.length)) * 100;
  return Math.round(score);
}

function loadChecklist(interviewId: string) {
  try {
    const raw = localStorage.getItem(PREP_CHECKLIST_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const entry = map[interviewId];
    if (!entry) return null;
    return entry.items ?? null;
  } catch {
    return null;
  }
}

export default function InterviewSuccess() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, any>>({});
  const [prepActivities, setPrepActivities] = useState<any[] | null>(null);
  const [localAttempts, setLocalAttempts] = useState<any[] | null>(null);

  // Load interviews from database
  useEffect(() => {
    if (!user?.id) return;

    async function loadInterviewsFromDb() {
      try {
        const qc = getAppQueryClient();
        const rows = await qc.ensureQueryData({
          queryKey: coreKeys.scheduledInterviews(user!.id),
          queryFn: () => fetchScheduledInterviews<any>(user!.id),
          staleTime: 60 * 60 * 1000,
        });

        if (rows) {
          // Map database format to component format
          const dbInterviews = (Array.isArray(rows) ? rows : []).map(
            (iv: any) => ({
              id: iv.id,
              title: iv.title || iv.role || "Interview",
              start: iv.interview_date,
              linkedJob: iv.linked_job_id
                ? String(iv.linked_job_id)
                : undefined,
              status: iv.status || "scheduled",
            })
          );
          setInterviews(dbInterviews);
        }
      } catch {
        setInterviews([]);
      }
    }

    loadInterviewsFromDb();

    // Also refresh when interviews-updated event fires
    const onUpdate = () => {
      try {
        const qc = getAppQueryClient();
        qc.invalidateQueries({
          queryKey: coreKeys.scheduledInterviews(user!.id),
        });
      } catch {
        // ignore
      }
      loadInterviewsFromDb();
    };
    window.addEventListener("interviews-updated", onUpdate as any);
    return () =>
      window.removeEventListener("interviews-updated", onUpdate as any);
  }, [user?.id]);

  useEffect(() => {
    // load job details for linked interviews to compute role-match
    (async () => {
      if (!user) return;
      try {
        const queryClient = getAppQueryClient();
        const jobs = await queryClient.ensureQueryData({
          queryKey: coreKeys.jobs(user.id),
          queryFn: () => fetchCoreJobs<any>(user.id),
          staleTime: 60 * 60 * 1000,
        });

        const map: Record<string, any> = {};
        for (const j of Array.isArray(jobs) ? jobs : []) {
          const id = j?.id != null ? String(j.id) : null;
          if (id) map[id] = j;
        }
        setJobsMap(map);
      } catch {
        setJobsMap({});
      }
      // load preparation activities once for efficient per-interview scoring
      try {
        const queryClient = getAppQueryClient();
        const data = await queryClient.ensureQueryData({
          queryKey: coreKeys.preparationActivities(user.id),
          queryFn: () => fetchCorePreparationActivities(user.id),
          staleTime: 60 * 60 * 1000,
        });
        setPrepActivities(Array.isArray(data) ? (data as any[]) : []);
      } catch {
        // ignore
      }
      // load local attempts snapshot
      try {
        const raw = localStorage.getItem("sgt:technical_prep_attempts");
        setLocalAttempts(raw ? JSON.parse(raw) : []);
      } catch {
        setLocalAttempts([]);
      }
    })();
  }, [interviews, user]);

  const stats = useMemo(() => {
    // compute historical conversion from preparation activities if available
    return {
      historicalInterviewRate: 0.12,
      historicalOfferRate: 0.03,
    };
  }, []);

  async function computePracticeMinutesForInterview(iv: any) {
    // prefer server-side stored preparation activities (loaded into state), fallback to local technical attempts
    try {
      const now = Date.now();
      const cutoff = now - 90 * 24 * 3600 * 1000;
      const linkedId =
        iv.linkedJob && String(iv.linkedJob).match(/^\d+$/)
          ? Number(iv.linkedJob)
          : null;
      let sum = 0;

      if (prepActivities && Array.isArray(prepActivities)) {
        for (const r of prepActivities) {
          if (!r) continue;
          const dt = r.activity_date
            ? new Date(r.activity_date).getTime()
            : null;
          if (dt && Number.isNaN(dt)) continue;
          if (dt && dt < cutoff) continue;

          // direct job link
          if (linkedId && Number(r.job_id) === linkedId) {
            sum += Number(r.time_spent_minutes) || 0;
            continue;
          }

          // activity type hints include 'interview', 'mock', or 'mock_interview'
          const at = String(r.activity_type || "").toLowerCase();
          if (
            at.includes("interview") ||
            at.includes("mock") ||
            at === "mock_interview"
          ) {
            // if job not linked, try to match by text
            const desc = (
              String(r.activity_description || "") +
              " " +
              String(r.notes || "")
            ).toLowerCase();
            if (!linkedId) {
              if (iv.title && desc.includes(String(iv.title).toLowerCase())) {
                sum += Number(r.time_spent_minutes) || 0;
                continue;
              }
              const company = (() => {
                try {
                  return (
                    jobsMap[String(iv.linkedJob)]?.company_name ||
                    String(iv.linkedJob) ||
                    ""
                  );
                } catch {
                  return "";
                }
              })();
              if (company && desc.includes(company.toLowerCase())) {
                sum += Number(r.time_spent_minutes) || 0;
                continue;
              }
            } else {
              // already handled linkedId above
            }
          }
        }
      }

      // include local attempts matching this interview (best-effort text matching)
      try {
        const raw =
          localAttempts ??
          JSON.parse(
            localStorage.getItem("sgt:technical_prep_attempts") || "[]"
          );
        const arr = Array.isArray(raw) ? raw : [];
        for (const a of arr) {
          if (!a) continue;
          const txt = (
            String(a.text || a.question || "") +
            " " +
            String(a.origin || "") +
            " " +
            String(a.code || "")
          ).toLowerCase();
          const company = (
            jobsMap[String(iv.linkedJob)]?.company_name ||
            String(iv.linkedJob) ||
            ""
          ).toLowerCase();
          const title = String(iv.title || "").toLowerCase();
          if (linkedId && a.jobId && Number(a.jobId) === linkedId) {
            sum += (Number(a.elapsedMs) || 0) / 60000;
          } else if (title && txt.includes(title)) {
            sum += (Number(a.elapsedMs) || 0) / 60000;
          } else if (company && txt.includes(company)) {
            sum += (Number(a.elapsedMs) || 0) / 60000;
          }
        }
      } catch {
        // ignore
      }

      return Math.round(sum);
    } catch {
      return 0;
    }
  }

  function computeResearchCompleted(iv: any) {
    const items = loadChecklist(iv.id);
    if (!items) return false;
    const found = items.find(
      (it: any) =>
        String(it.id).endsWith("-research") ||
        String(it.text || "")
          .toLowerCase()
          .includes("research")
    );
    return Boolean(found && found.done);
  }

  async function scoreForInterview(iv: any) {
    const roleMatch = (() => {
      try {
        const linked = iv.linkedJob;
        if (linked && jobsMap[String(linked)]) {
          const job = jobsMap[String(linked)];
          return titleSimilarity(iv.title, job.job_title ?? job.title ?? "");
        }
        return titleSimilarity(iv.title, iv.linkedJob || "");
      } catch {
        return 50;
      }
    })();

    const researchDone = computeResearchCompleted(iv) ? 100 : 0;
    const practiceMin = await computePracticeMinutesForInterview(iv);
    // normalize practice minutes to 0-100 over a 300 minute schedule
    const practiceScore = Math.min(100, Math.round((practiceMin / 300) * 100));

    // count mock/interview-specific activities to boost role-specific readiness
    let mockCount = 0;
    try {
      const linkedId =
        iv.linkedJob && String(iv.linkedJob).match(/^\d+$/)
          ? Number(iv.linkedJob)
          : null;
      if (prepActivities && Array.isArray(prepActivities)) {
        for (const r of prepActivities) {
          if (!r) continue;
          const at = String(r.activity_type || "").toLowerCase();
          const desc = (
            String(r.activity_description || "") +
            " " +
            String(r.notes || "")
          ).toLowerCase();
          if (at.includes("mock") || at.includes("interview")) {
            if (linkedId && Number(r.job_id) === linkedId) mockCount++;
            else if (iv.title && desc.includes(String(iv.title).toLowerCase()))
              mockCount++;
            else if (
              jobsMap[String(iv.linkedJob)] &&
              desc.includes(
                String(
                  jobsMap[String(iv.linkedJob)].company_name || ""
                ).toLowerCase()
              )
            )
              mockCount++;
          }
        }
      }
      // include local attempts labeled as mocks
      try {
        const raw =
          localAttempts ??
          JSON.parse(
            localStorage.getItem("sgt:technical_prep_attempts") || "[]"
          );
        const arr = Array.isArray(raw) ? raw : [];
        for (const a of arr) {
          if (!a) continue;
          const origin = String(a.origin || "").toLowerCase();
          const txt = (
            String(a.text || a.question || "") +
            " " +
            String(a.code || "") +
            " " +
            origin
          ).toLowerCase();
          const title = String(iv.title || "").toLowerCase();
          const company = (
            jobsMap[String(iv.linkedJob)]?.company_name ||
            String(iv.linkedJob) ||
            ""
          ).toLowerCase();
          if (origin.includes("mock") || origin.includes("interview")) {
            if (a.jobId && linkedId && Number(a.jobId) === linkedId)
              mockCount++;
            else if (title && txt.includes(title)) mockCount++;
            else if (company && txt.includes(company)) mockCount++;
          }
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }

    // base weights (tweakable)
    const wRole = 0.3;
    const wResearch = 0.18;
    const wPractice = 0.22;
    const wMock = 0.18; // direct mock interview experience
    const wHistory = 0.12;

    // historical factor: simple transform of historical interview->offer rates
    const histFactor = Math.min(
      100,
      Math.round((stats.historicalOfferRate || 0.03) * 1000)
    );

    // mock multiplier: each mock increases readiness (diminishing returns)
    const mockBoost = Math.min(
      100,
      Math.round((1 - Math.pow(0.7, mockCount)) * 100)
    );

    const raw = Math.round(
      wRole * roleMatch +
        wResearch * researchDone +
        wPractice * practiceScore +
        wMock * mockBoost +
        wHistory * histFactor
    );

    // confidence score based on data completeness
    const completeness = [
      roleMatch > 40,
      researchDone > 0,
      practiceMin > 0,
    ].filter(Boolean).length;
    const confidence = Math.min(100, 40 + completeness * 20);

    // prioritized actions
    const actions: string[] = [];
    if (roleMatch < 50)
      actions.push(
        "Refine job-specific keywords in your resume and practice matching examples to the JD"
      );
    if (!computeResearchCompleted(iv))
      actions.push(
        "Complete company research: mission, recent news, and prepare 3 company-specific questions"
      );
    if (practiceMin < 60)
      actions.push(
        "Do at least two 30-minute mock interviews focused on the role"
      );
    if (actions.length === 0)
      actions.push(
        "You are well-prepared — focus on confidence and concise impact statements"
      );

    return {
      rawProbability: raw,
      confidence,
      roleMatch,
      practiceMinutes: practiceMin,
      actions,
    };
  }

  const [computed, setComputed] = useState<Record<string, any>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const results: Record<string, any> = {};
      for (const iv of interviews) {
        if (iv.status === "cancelled") continue;
        results[iv.id] = await scoreForInterview(iv);
      }
      if (mounted) setComputed(results);
    })();
    return () => {
      mounted = false;
    };
  }, [interviews, jobsMap]);

  return (
    <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
      <Stack spacing={1}>
        <Typography variant="h6">Interview Success Probability</Typography>
        <Typography variant="body2" color="text.secondary">
          Estimated chance of success for upcoming interviews based on
          preparation, role match, and historical patterns.
        </Typography>

        {interviews.filter((iv) => iv.status === "scheduled").length === 0 ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            No upcoming interviews scheduled.
          </Typography>
        ) : (
          interviews
            .filter((iv) => iv.status === "scheduled")
            .map((iv) => {
              const p = computed[iv.id] || {
                rawProbability: 0,
                confidence: 0,
                actions: [],
              };
              return (
                <Box
                  key={iv.id}
                  sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle1">
                        {iv.title} — {new Date(iv.start).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Role match: {p.roleMatch ?? 0}% • Practice:{" "}
                        {p.practiceMinutes ?? 0} min • Confidence:{" "}
                        {p.confidence ?? 0}%
                      </Typography>
                    </Box>
                    <Box sx={{ width: 240 }}>
                      <Typography variant="body2">
                        Success Probability: {p.rawProbability ?? 0}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(
                          0,
                          Math.min(100, p.rawProbability || 0)
                        )}
                        sx={{ height: 10, borderRadius: 1, mt: 0.5 }}
                      />
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1 }} />
                  <Stack
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Top Actions:
                      </Typography>
                      {p.actions &&
                        p.actions.slice(0, 2).map((a: string, i: number) => (
                          <Typography key={i} variant="body2">
                            • {a}
                          </Typography>
                        ))}
                    </Box>
                    {/* <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => savePrediction(iv)}>Save Prediction</Button>
                    </Stack> */}
                  </Stack>
                </Box>
              );
            })
        )}

        <Divider sx={{ my: 1 }} />
        {/* <Box>
          <Typography variant="subtitle2">Prediction Tracking</Typography>
          <Typography variant="body2" color="text.secondary">Recorded predictions: {predictions.length} • Evaluated: {accuracy.count} • Avg error: {accuracy.avgError ?? 'N/A'}</Typography>
        </Box> */}
      </Stack>
    </Paper>
  );
}
