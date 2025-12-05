/**
 * JobAnalyticsDialog — AI-powered analytics for individual jobs
 *
 * Purpose: Display detailed analytics and insights for a specific job.
 * Shows match score, skills analysis, company research, and optimization suggestions.
 *
 * Contract:
 * - Inputs: jobId, open state, onClose callback
 * - Outputs: Full-screen dialog with analytics tabs
 * - Features: Match analysis, skills gaps, company insights, interview prep
 */

import { useState } from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Divider,
  Button,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  TrendingUp as MatchIcon,
  School as SkillsIcon,
  Business as CompanyIcon,
  Assignment as PrepIcon,
} from "@mui/icons-material";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useJobsPipeline } from '@job_pipeline/hooks/useJobsPipeline';
import { useJobMatch } from "@job_pipeline/hooks/useJobMatch";
import { useAuth } from "@shared/context/AuthContext";
import MatchAnalysisPanel from "@job_pipeline/components/analytics/MatchAnalysisPanel/MatchAnalysisPanel";

const SCHEDULE_KEY = "jobs:submission_schedules";
const SUBMISSION_HISTORY_KEY = "jobs:submission_history";

interface JobAnalyticsDialogProps {
  jobId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function JobAnalyticsDialog({
  jobId,
  open,
  onClose,
}: JobAnalyticsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { data: matchData, loading } = useJobMatch(user?.id, jobId);
  const { allJobs } = useJobsPipeline();

  // helper: find job row from centralized jobs list
  const jobRow = jobId ? allJobs.find((j) => Number(j.id) === Number(jobId)) : null;

  function daysInStage(row?: typeof jobRow) {
    if (!row) return null;
    const d = row.status_changed_at ?? row.updated_at ?? row.created_at;
    if (!d) return null;
    try {
      const then = new Date(String(d));
      const diff = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  }

  function daysUntilDeadline(row?: typeof jobRow) {
    if (!row) return null;
    const d = (row as any).application_deadline ?? (row as any).applicationDeadline;
    if (!d) return null;
    try {
      const then = new Date(String(d));
      const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return Number.isFinite(diff) ? diff : null;
    } catch {
      return null;
    }
  }

  function parseDate(d?: string | null) {
    if (!d) return null;
    const t = new Date(String(d));
    return isNaN(t.getTime()) ? null : t;
  }

  function historicalTimingStats(rows: typeof allJobs) {
    // Compute simple response rates by weekday (0=Sun) and hour (0-23)
    const byWeekday: Record<number, { responded: number; total: number }> = {};
    const byHour: Record<number, { responded: number; total: number }> = {};
    for (let i = 0; i < 7; i++) byWeekday[i] = { responded: 0, total: 0 };
    for (let h = 0; h < 24; h++) byHour[h] = { responded: 0, total: 0 };

    for (const j of rows) {
      const created = parseDate(j.created_at ?? (j as any).application_submitted_at ?? null);
      if (!created) continue;
      const wd = created.getDay();
      const hr = created.getHours();
      byWeekday[wd].total += 1;
      byHour[hr].total += 1;
      // consider responded if moved to phone screen/interview/offer
      const success = ((j.job_status ?? "") as string).toLowerCase();
      const isResp = ["phone screen", "interview", "offer"].includes(success);
      if (isResp) {
        byWeekday[wd].responded += 1;
        byHour[hr].responded += 1;
      }
    }

    const weekdayRate = Object.keys(byWeekday).map((k) => {
      const idx = Number(k);
      const v = byWeekday[idx];
      return { day: idx, rate: v.total ? v.responded / v.total : 0, total: v.total };
    });
    const hourRate = Object.keys(byHour).map((k) => {
      const idx = Number(k);
      const v = byHour[idx];
      return { hour: idx, rate: v.total ? v.responded / v.total : 0, total: v.total };
    });

    return { weekdayRate, hourRate };
  }

  function bestSlotFor(rows: typeof allJobs) {
    const stats = historicalTimingStats(rows);
    // Choose weekday with highest rate (tie-break by total count)
    const bestDay = stats.weekdayRate.slice().sort((a, b) => {
      if (b.rate === a.rate) return b.total - a.total;
      return b.rate - a.rate;
    })[0];
    // Choose hour with highest rate
    const bestHour = stats.hourRate.slice().sort((a, b) => {
      if (b.rate === a.rate) return b.total - a.total;
      return b.rate - a.rate;
    })[0];
    return { bestDay: bestDay?.day ?? 2, bestHour: bestHour?.hour ?? 10 };
  }

  function nextOccurrenceFor(day: number, hour: number) {
    // return a Date for the next occurrence of weekday `day` at `hour` in local timezone
    const now = new Date();
    const today = now.getDay();
    let delta = day - today;
    if (delta < 0) delta += 7;
    // if same day but hour already passed, schedule next week
    if (delta === 0 && now.getHours() >= hour) delta = 7;
    const d = new Date(now.getTime() + delta * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  function isFridayEvening(d: Date) {
    // Friday evening: Friday (5) after 5pm
    return d.getDay() === 5 && d.getHours() >= 17;
  }

  function isUSHoliday(d: Date) {
    // Basic US holiday checks: New Year's, Independence, Christmas, Thanksgiving (4th Thu of Nov)
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-12
    const day = d.getDate();

    // Fixed-date holidays
    if ((m === 1 && day === 1) || (m === 7 && day === 4) || (m === 12 && day === 25)) return true;

    // Thanksgiving: 4th Thursday of November
    if (m === 11) {
      // find 1st day of Nov
      const first = new Date(y, 10, 1);
      const firstWeekday = first.getDay();
      // day of 4th Thursday
      const fourthThu = 1 + ((11 - firstWeekday + 7) % 7) + 21; // adjust to Thursday
      if (day === fourthThu) return true;
    }

    // Simple: treat Jul 5 as observed if Jul4 is on weekend (observed holidays not exhaustively handled)
    if (m === 7 && day === 5) {
      const j4 = new Date(y, 6, 4);
      if (j4.getDay() === 0 || j4.getDay() === 6) return true;
    }

    return false;
  }

  function isEndOfFiscalQuarter(d: Date) {
    const month = d.getMonth(); // 0-11
    // quarter end months: Mar(2), Jun(5), Sep(8), Dec(11)
    const quarterEnds = [2, 5, 8, 11];
    // find quarter end for this date's quarter
    const q = Math.floor(month / 3);
    const endMonth = quarterEnds[q];
    const year = d.getFullYear();
    const lastDay = new Date(year, endMonth + 1, 0).getDate();
    const quarterEndDate = new Date(year, endMonth, lastDay);
    const diffDays = Math.ceil((quarterEndDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }

  function checkBadTimingForDate(d: Date | null) {
    if (!d) return [] as string[];
    const warns: string[] = [];
    if (isFridayEvening(d)) warns.push('Selected time is Friday after 5pm — avoid Friday evenings as recruiter activity is low.');
    if (isUSHoliday(d)) warns.push('Selected time falls on a US holiday — hiring teams may be offline or slow to respond.');
    if (isEndOfFiscalQuarter(d)) warns.push('Selected time is within the last week of a fiscal quarter — teams may be busy with close activities.');
    return warns;
  }

  // local persistence for schedules and submission history
  function saveScheduleEntry(entry: { jobId: number | string; when: string; group?: string }) {
    try {
      const raw = localStorage.getItem(SCHEDULE_KEY) || "[]";
      const arr = JSON.parse(raw);
      arr.push(entry);
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(arr));
    } catch {}
  }

  function saveSubmissionRecord(record: { jobId: number | string; submittedAt: string; responded?: boolean; respondedAt?: string; group?: string }) {
    try {
      const raw = localStorage.getItem(SUBMISSION_HISTORY_KEY) || "[]";
      const arr = JSON.parse(raw);
      arr.push(record);
      localStorage.setItem(SUBMISSION_HISTORY_KEY, JSON.stringify(arr));
    } catch {}
  }

  function loadSchedulesForJob(jobId: number | string | null) {
    try {
      if (!jobId) return setScheduledEntries([]);
      const raw = localStorage.getItem(SCHEDULE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{jobId: number | string; when: string; group?: string}>;
      const mine = arr.filter((e) => String(e.jobId) === String(jobId)).sort((a,b) => new Date(a.when).getTime() - new Date(b.when).getTime());
      setScheduledEntries(mine);
    } catch {
      setScheduledEntries([]);
    }
  }

  function deleteScheduleEntry(jobId: number | string, whenIso: string) {
    try {
      const raw = localStorage.getItem(SCHEDULE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{jobId: number | string; when: string; group?: string}>;
      const filtered = arr.filter((e) => !(String(e.jobId) === String(jobId) && e.when === whenIso));
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(filtered));
      loadSchedulesForJob(jobId);
    } catch {}
  }

  // compute correlation from local submission history for the same industry/company size
  function computeCorrelation(job: typeof jobRow | null) {
    try {
      const raw = localStorage.getItem(SUBMISSION_HISTORY_KEY) || "[]";
      const arr = JSON.parse(raw) as any[];
      if (!job) return null;
      const same = arr.filter((r) => {
        // we look for records where job meta matches industry or company name
        const recJob = allJobs.find((j) => String(j.id) === String(r.jobId));
        if (!recJob) return false;
        const sameIndustry = (recJob.industry ?? "").toString() === (job.industry ?? "").toString();
        const sameCompany = (recJob.company_name ?? "").toString() === (job.company_name ?? "").toString();
        return sameIndustry || sameCompany;
      });
      if (same.length === 0) return null;
      const groups: Record<string, { total: number; responded: number }> = {};
      for (const r of same) {
        const g = r.group || "default";
        groups[g] = groups[g] || { total: 0, responded: 0 };
        groups[g].total += 1;
        if (r.responded) groups[g].responded += 1;
      }
      return groups;
    } catch {
      return null;
    }
  }

  const [recommendedWhen, setRecommendedWhen] = useState<Date | null>(null);
  const [scheduleWhen, setScheduleWhen] = useState<string>("");
  const [abGroup, setAbGroup] = useState<string>("A");
  const [correlation, setCorrelation] = useState<any>(null);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState<string | null>(null);
  const [realtimeRecMsg, setRealtimeRecMsg] = useState<string | null>(null);
  const [scheduledEntries, setScheduledEntries] = useState<Array<{jobId: number | string; when: string; group?: string}>>([]);
  const [abTimingResults, setAbTimingResults] = useState<any | null>(null);

  useEffect(() => {
    // compute initial recommended slot based on similar jobs (industry/company)
    if (!jobRow) return;
    const similar = allJobs.filter((j) => {
      if (!jobRow) return false;
      const sameIndustry = (j.industry ?? "").toString() === (jobRow.industry ?? "").toString();
      const sameSize = (j as any).company_size === (jobRow as any).company_size;
      return sameIndustry || sameSize;
    });
    const { bestDay, bestHour } = bestSlotFor(similar.length ? similar : allJobs);
    const next = nextOccurrenceFor(bestDay, bestHour);
    setRecommendedWhen(next);
    setScheduleWhen(next.toISOString().slice(0,16)); // datetime-local format
    setCorrelation(computeCorrelation(jobRow));
    // load any existing schedules for this job so the UI shows them
    try {
      const raw = localStorage.getItem(SCHEDULE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{jobId: number | string; when: string; group?: string}>;
      const mine = arr.filter((e) => String(e.jobId) === String(jobRow.id)).sort((a,b) => new Date(a.when).getTime() - new Date(b.when).getTime());
      setScheduledEntries(mine);
    } catch {
      setScheduledEntries([]);
    }
    // compute A/B timing results for this job
    try {
      setAbTimingResults(computeAbTimingResults(jobRow));
    } catch {
      setAbTimingResults(null);
    }
  }, [jobRow, allJobs]);

  function computeAbTimingResults(job: typeof jobRow | null) {
    // Read local submission history and compute response rates by A/B group and time bucket
    try {
      const raw = localStorage.getItem(SUBMISSION_HISTORY_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<any>;
      if (!job) return null;

      // Filter records for similar jobs (industry or company) to improve sample size
      const same = arr.filter((r) => {
        const recJob = allJobs.find((j) => String(j.id) === String(r.jobId));
        if (!recJob) return false;
        const sameIndustry = (recJob.industry ?? "").toString() === (job.industry ?? "").toString();
        const sameCompany = (recJob.company_name ?? "").toString() === (job.company_name ?? "").toString();
        return sameIndustry || sameCompany;
      });

      if (same.length === 0) return null;

      // Define time buckets
      const buckets = {
        morning: { start: 8, end: 11 },
        midday: { start: 11, end: 15 },
        afternoon: { start: 15, end: 18 },
        evening: { start: 18, end: 23 },
        night: { start: 0, end: 8 },
      };

      const groups: Record<string, { total: number; responded: number; byBucket: Record<string, { total: number; responded: number }> }> = {};

      for (const r of same) {
        const g = r.group || 'default';
        groups[g] = groups[g] || { total: 0, responded: 0, byBucket: {} };
        for (const b of Object.keys(buckets)) {
          groups[g].byBucket[b] = groups[g].byBucket[b] || { total: 0, responded: 0 };
        }

        const submittedAt = r.submittedAt ? new Date(r.submittedAt) : null;
        if (!submittedAt || isNaN(submittedAt.getTime())) continue;
        const hour = submittedAt.getHours();
        let bucketName = 'midday';
        for (const [bk, range] of Object.entries(buckets)) {
          if (hour >= (range as any).start && hour < (range as any).end) {
            bucketName = bk;
            break;
          }
        }

        groups[g].total += 1;
        if (r.responded) groups[g].responded += 1;
        groups[g].byBucket[bucketName].total += 1;
        if (r.responded) groups[g].byBucket[bucketName].responded += 1;
      }

      // compute percentages
      const result: any = { buckets: Object.keys(buckets), groups: {} };
      for (const g of Object.keys(groups)) {
        const info = groups[g];
        const pct = info.total ? (info.responded / info.total) : 0;
        result.groups[g] = {
          total: info.total,
          responded: info.responded,
          pct: pct,
          byBucket: {},
        };
        for (const bk of Object.keys(info.byBucket)) {
          const b = info.byBucket[bk];
          result.groups[g].byBucket[bk] = {
            total: b.total,
            responded: b.responded,
            pct: b.total ? (b.responded / b.total) : 0,
          };
        }
      }
      return result;
    } catch {
      return null;
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          maxHeight: 800,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Job Analytics</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<MatchIcon />} label="Match Analysis" />
          <Tab icon={<SkillsIcon />} label="Skills Gaps" />
          <Tab icon={<CompanyIcon />} label="Company Insights" />
          <Tab icon={<PrepIcon />} label="Interview Prep" />
          <Tab icon={<AccessTimeIcon />} label="Job Timing Optimizer" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, overflow: "auto" }}>
        {loading && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: "center" }}
            >
              Loading AI analytics...
            </Typography>
          </Box>
        )}

        {/* Tab 0: Match Analysis */}
        {activeTab === 0 && !loading && (
          <Box>
            <MatchAnalysisPanel userId={user?.id} jobId={jobId} />
          </Box>
        )}

        {/* Tab 1: Skills Gaps */}
        {activeTab === 1 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Skills Development Plan
            </Typography>
            {!matchData ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Match analysis not yet generated. Click the "Match Analysis" tab
                to calculate your match score first.
              </Alert>
            ) : matchData?.skillsGaps && matchData.skillsGaps.length > 0 ? (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Focus on these skills to improve your match score and job
                  readiness:
                </Typography>
                <List>
                  {matchData.skillsGaps.map((skill, idx) => (
                    <ListItem key={idx} sx={{ py: 1 }}>
                      <ListItemText
                        primary={skill}
                        secondary="Recommended: Take online course or build project to demonstrate"
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Alert severity="success">
                No significant skills gaps identified! You're well-qualified for
                this position.
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 2: Company Insights */}
        {activeTab === 2 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Company Research
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI-powered company insights coming soon. This will include:
            </Typography>
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Company Culture
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis of company values, work environment, and team
                    dynamics
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent News & Updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest company announcements, funding rounds, and product
                    launches
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Competitive Landscape
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    How this company compares to others in the industry
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        {/* Tab 3: Interview Prep */}
        {activeTab === 3 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Interview Preparation
            </Typography>

            {!matchData ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Generate a match analysis first to get personalized interview
                prep recommendations.
              </Alert>
            ) : (
              <>
                {matchData?.strengths && matchData.strengths.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Highlight These Strengths:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mb: 3 }}
                    >
                      {matchData.strengths.map((strength, idx) => (
                        <Chip
                          key={idx}
                          label={strength}
                          color="success"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Recommended Focus Areas:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Research the company's recent projects and initiatives"
                      secondary="Show genuine interest and alignment with company goals"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Prepare STAR stories for your strongest experiences"
                      secondary="Situation, Task, Action, Result - quantify achievements"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Review job requirements and match to your experience"
                      secondary="Be ready to explain how your skills solve their problems"
                    />
                  </ListItem>
                  {matchData?.skillsGaps && matchData.skillsGaps.length > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="Address skills gaps proactively"
                        secondary="Show willingness to learn and grow in weak areas"
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}
          </Box>
        )}

        {/* Tab 4: Job Timing Optimizer */}
        {activeTab === 4 && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Job Timing Optimizer
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Practical timing recommendations to maximize visibility and response rates.
            </Typography>

            <Stack spacing={2}>
              

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2">Optimizer Recommendations</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {(() => {
                      // heuristics
                      if (!jobRow) return 'No job information available to generate recommendations.';
                      const d = daysUntilDeadline(jobRow);
                      const inStage = daysInStage(jobRow) ?? 0;

                      const recs: string[] = [];
                      if (d !== null) {
                        if (d <= 7) {
                          recs.push('Apply immediately and send a brief follow-up 3 business days after applying.');
                          recs.push('If you have referrals or internal contacts, reach out now to accelerate review.');
                        } else if (d <= 14) {
                          recs.push('Prepare your tailored application and submit within 3 days to be early in the review cycle.');
                          recs.push('Plan a follow-up 5 business days after applying.');
                        } else {
                          recs.push('There is time — optimize your resume and cover letter. Apply 7-10 days before your ideal start date to appear timely.');
                          recs.push('Consider applying on a Tuesday morning when hiring teams are most active.');
                        }
                      } else {
                        // no deadline
                        if (inStage <= 3) {
                          recs.push('Apply when you can submit a tailored resume and cover letter — aim for Tuesday-Wednesday mornings.');
                        } else {
                          recs.push('If already in process, focus on timely follow-ups and scheduling interviews within 3-5 business days.');
                        }
                      }

                      // generic scheduling advice
                      recs.push('Follow-up cadence: 1) After application: 3–7 business days. 2) After interview: thank-you within 24 hours, follow-up after 5 business days if no update.');

                      return recs.map((r, i) => (
                        <Typography variant="body2" key={i}>• {r}</Typography>
                      ));
                    })()}
                  </Typography>
                </CardContent>
              </Card>
              {/* New: Timing optimizer controls and scheduling */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2">Timing Analysis & Scheduler</Typography>
                  <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                    {recommendedWhen ? (
                      <>Best next slot: <strong>{recommendedWhen.toLocaleString()}</strong></>
                    ) : (
                      'Calculating recommended slot...'
                    )}
                  </Typography>
                  {(() => {
                    const warns: string[] = [];
                    if (recommendedWhen) {
                      if (isFridayEvening(recommendedWhen)) warns.push('Recommended slot is on a Friday evening — avoid Friday evenings as they have low recruiter activity. Prefer Tuesday or Wednesday morning.');
                      if (isUSHoliday(recommendedWhen)) warns.push('Recommended slot falls on a US holiday — hiring teams may be offline or slow to respond. Consider another workday.');
                      if (isEndOfFiscalQuarter(recommendedWhen)) warns.push('Recommended slot is within the end of a fiscal quarter — recruiters and finance teams may be busy with quarterly close activities. Consider avoiding the last week of the quarter.');
                    }

                    if (warns.length > 0) {
                      return (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <div>
                            {warns.map((w, i) => (
                              <Typography key={i} variant="body2">• {w}</Typography>
                            ))}
                          </div>
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Button size="small" onClick={() => {
                      // schedule at recommended time and show success feedback
                      setScheduleSavedMsg(null);
                      if (!recommendedWhen || !jobRow) {
                        setScheduleSavedMsg('No recommended time available to schedule.');
                        return;
                      }
                      const whenDate = recommendedWhen;
                      const now = new Date();
                      if (whenDate.getTime() <= now.getTime()) {
                        setScheduleSavedMsg('Recommended time is in the past and cannot be scheduled.');
                        return;
                      }
                      try {
                        saveScheduleEntry({ jobId: jobRow.id, when: whenDate.toISOString(), group: abGroup });
                        setScheduleWhen(whenDate.toISOString().slice(0,16));
                        const msg = `Scheduled for ${whenDate.toLocaleString()}`;
                        setScheduleSavedMsg(msg);
                        // refresh displayed schedules
                        loadSchedulesForJob(jobRow.id);
                        // clear after 12s
                        setTimeout(() => setScheduleSavedMsg(null), 12000);
                      } catch (e) {
                        setScheduleSavedMsg('Failed to save recommended schedule.');
                      }
                    }}>Schedule recommended time</Button>
                    <Button size="small" onClick={() => {
                      // schedule now (record a submission event locally)
                      if (!jobRow) return;
                      const now = new Date();
                      saveSubmissionRecord({ jobId: jobRow.id, submittedAt: now.toISOString(), responded: false, group: abGroup });
                      // refresh schedules and recompute A/B timing results so UI updates immediately
                      try {
                        loadSchedulesForJob(jobRow.id);
                        setAbTimingResults(computeAbTimingResults(jobRow));
                        setScheduleSavedMsg('Recorded submission for now.');
                        setTimeout(() => setScheduleSavedMsg(null), 5000);
                      } catch {}
                    }}>Record submission (now)</Button>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">A/B group:</Typography>
                    <Button size="small" onClick={() => setAbGroup('A')} variant={abGroup==='A' ? 'contained' : 'outlined'}>A</Button>
                    <Button size="small" onClick={() => setAbGroup('B')} variant={abGroup==='B' ? 'contained' : 'outlined'}>B</Button>
                  </Stack>

                    <Stack spacing={1}>
                    <Typography variant="body2">Schedule custom time</Typography>
                    <input type="datetime-local" value={scheduleWhen} onChange={(e) => setScheduleWhen(e.target.value)} />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => {
                        setScheduleSavedMsg(null);
                        if (!jobRow || !scheduleWhen) {
                          setScheduleSavedMsg('Please choose a valid date and job before saving.');
                          return;
                        }
                        const whenDate = new Date(scheduleWhen);
                        if (isNaN(whenDate.getTime())) {
                          setScheduleSavedMsg('Invalid date format. Please pick a valid date/time.');
                          return;
                        }
                        const now = new Date();
                        if (whenDate.getTime() <= now.getTime()) {
                          setScheduleSavedMsg('Cannot schedule in the past. Please pick a future time.');
                          return;
                        }
                        // persist
                        try {
                          saveScheduleEntry({ jobId: jobRow.id, when: whenDate.toISOString(), group: abGroup });
                          setScheduleSavedMsg(`Scheduled for ${whenDate.toLocaleString()}`);
                          // refresh displayed schedules
                          loadSchedulesForJob(jobRow.id);
                        } catch (e) {
                          setScheduleSavedMsg('Failed to save schedule.');
                        }
                      }}>Save schedule</Button>
                      <Button size="small" onClick={() => {
                        // quick heuristic: show now vs wait — display inline instead of alert
                        setRealtimeRecMsg(null);
                        if (!recommendedWhen) {
                          setRealtimeRecMsg('Recommendation not available yet.');
                          return;
                        }
                        const now = new Date();
                        const diffMs = recommendedWhen.getTime() - now.getTime();
                        const diffHours = Math.round(diffMs / (1000*60*60));
                        const msg = diffHours <= 2
                          ? 'Recommendation: Submit now.'
                          : `Recommendation: Wait ${diffHours} hour(s) until ${recommendedWhen.toLocaleString()}.`;
                        setRealtimeRecMsg(msg);
                        // auto-clear after 12 seconds
                        setTimeout(() => setRealtimeRecMsg(null), 12000);
                      }}>Real-time recommendation</Button>
                    </Stack>
                  </Stack>

                  {scheduleSavedMsg && (
                    <Alert severity={scheduleSavedMsg.startsWith('Scheduled') ? 'success' : 'warning'} sx={{ mt: 1 }}>{scheduleSavedMsg}</Alert>
                  )}

                  {/* Live / saved schedule warnings (e.g., Friday evening, holiday, quarter-end) */}
                  {(() => {
                    const scheduleDate = scheduleWhen ? new Date(scheduleWhen) : null;
                    const scheduleWarns = scheduleDate && !isNaN(scheduleDate.getTime()) ? checkBadTimingForDate(scheduleDate) : [];
                    return (
                      <>
                        {scheduleWarns.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            {scheduleWarns.map((w, i) => (
                              <Typography key={i} variant="body2">• {w}</Typography>
                            ))}
                          </Alert>
                        )}
                        {realtimeRecMsg && (
                          <Alert severity="info" sx={{ mt: 1 }}>{realtimeRecMsg}</Alert>
                        )}
                      </>
                    );
                  })()}

                  {/* Saved schedules for this job (local) */}
                  {scheduledEntries && scheduledEntries.length > 0 && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Upcoming Scheduled Submissions</Typography>
                      <Stack spacing={1}>
                        {scheduledEntries.map((s, idx) => {
                          const d = new Date(s.when);
                          return (
                            <Card key={idx} variant="outlined">
                              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Your application will be sent at <strong>{isNaN(d.getTime()) ? s.when : d.toLocaleString()}</strong></Typography>
                                <Stack direction="row" spacing={1}>
                                  <Button size="small" onClick={() => {
                                    // remove schedule
                                    deleteScheduleEntry(s.jobId, s.when);
                                    setScheduleSavedMsg('Cancelled scheduled submission.');
                                    setTimeout(() => setScheduleSavedMsg(null), 6000);
                                  }}>Cancel</Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2">Correlation & A/B Results</Typography>
                  {correlation ? (
                    Object.keys(correlation).map((g) => (
                      <Typography key={g} variant="body2">Group {g}: {correlation[g].responded}/{correlation[g].total} responses ({Math.round((correlation[g].responded/correlation[g].total||0)*100)}%)</Typography>
                    ))
                  ) : (
                    <Typography variant="body2">No local submission history for this industry/company size yet. Record submissions to build correlation data.</Typography>
                  )}

                  {/* A/B timing analysis */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">A/B Timing Analysis</Typography>
                    {abTimingResults ? (
                      <Box sx={{ mt: 1 }}>
                        {Object.keys(abTimingResults.groups).map((g) => (
                          <Box key={g} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Group {g}: {abTimingResults.groups[g].responded}/{abTimingResults.groups[g].total} responses ({Math.round((abTimingResults.groups[g].pct||0)*100)}%)</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                              {abTimingResults.buckets.map((bk: string) => {
                                const b = abTimingResults.groups[g].byBucket[bk];
                                return (
                                  <Chip key={bk} label={`${bk}: ${b.responded}/${b.total} (${Math.round((b.pct||0)*100)}%)`} size="small" />
                                );
                              })}
                            </Stack>
                          </Box>
                        ))}

                        {/* Quick comparison between A and B if both exist */}
                        {abTimingResults.groups['A'] && abTimingResults.groups['B'] && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>A vs B Summary</Typography>
                            {(() => {
                              const a = abTimingResults.groups['A'];
                              const b = abTimingResults.groups['B'];
                              const delta = Math.round(((b.pct||0) - (a.pct||0)) * 100);
                              return (
                                <Typography variant="body2">Overall difference: B {Math.round((b.pct||0)*100)}% vs A {Math.round((a.pct||0)*100)}% — delta {delta} percentage points (B - A).</Typography>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2">No A/B timing data available yet. Record submissions to build timing correlation.</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
