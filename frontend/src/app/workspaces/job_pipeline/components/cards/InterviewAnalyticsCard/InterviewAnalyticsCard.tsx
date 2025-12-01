/**
 * InterviewAnalyticsCard — Interview performance tracking and AI-powered prep
 *
 * Purpose: Track interview success metrics and provide actionable insights
 * Features: Conversion rates, performance by company/industry, AI interview tips
 *
 * Data: Uses existing job data and interview funnel metrics
 * AI: Generates personalized interview preparation recommendations
 *
 * Contract:
 * - Inputs: User ID (from auth context), job data from database
 * - Outputs: Interview metrics, success patterns, preparation tips
 * - Export: JSON/CSV download of interview analytics
 */

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Work as InterviewIcon,
  CheckCircle as OfferIcon,
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  Download as DownloadIcon,
  EmojiEvents as SuccessIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { listInterviews, listConfidenceLogs, listInterviewFeedback } from "@shared/services/dbMappers";

interface InterviewMetrics {
  totalInterviews: number;
  byFormat: Record<string, number>;
  byType: Record<string, number>;
  byIndustry: Record<string, number>;
  averageScore: number;
  offerRate: number;
  improvementTrend: number;
}

interface CompanyPerformance {
  company: string;
  interviews: number;
  offers: number;
  successRate: number;
  averageScore: number;
}

interface InterviewRecord {
  id: string;
  user_id: string;
  company: string | null;
  industry: string | null;
  role: string | null;
  interview_date: string;
  format: string | null;
  interview_type: string | null;
  stage: string | null;
  result: boolean | null;
  score: number | null;
  notes: string | null;
  created_at: string;
}

interface ConfidenceLog {
  id: string;
  user_id: string;
  interview_id: string | null;
  logged_at: string;
  confidence_level: number | null;
  anxiety_level: number | null;
  notes: string | null;
}

interface FeedbackRecord {
  id: string;
  interview_id: string;
  provider: string | null;
  feedback_text: string | null;
  themes: string[];
  rating: number | null;
  created_at: string;
}

export default function InterviewAnalyticsCard() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [confidenceLogs, setConfidenceLogs] = useState<ConfidenceLog[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Map<string, FeedbackRecord[]>>(new Map());
  const [practiceRecords, setPracticeRecords] = useState<{
    id: string;
    questionId: string;
    practicedAt: string;
    draftResponse?: string;
  }[]>([]);

  // Load interview data
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load interviews
        const interviewsResult = await listInterviews(user.id);
        if (interviewsResult.error) {
          throw new Error(interviewsResult.error.message);
        }
        const interviewData = (interviewsResult.data || []) as InterviewRecord[];
        setInterviews(interviewData);

        // Load confidence logs
        const confidenceResult = await listConfidenceLogs(user.id);
        if (!confidenceResult.error) {
          setConfidenceLogs((confidenceResult.data || []) as ConfidenceLog[]);
        }

        // Load feedback for each interview
        const feedbackPromises = interviewData.map(async (interview) => {
          const feedbackResult = await listInterviewFeedback(user.id, interview.id);
          if (!feedbackResult.error) {
            return { interviewId: interview.id, feedback: feedbackResult.data as FeedbackRecord[] };
          }
          return { interviewId: interview.id, feedback: [] };
        });

        const allFeedback = await Promise.all(feedbackPromises);
        const feedbackMapNew = new Map<string, FeedbackRecord[]>();
        allFeedback.forEach(({ interviewId, feedback }) => {
          feedbackMapNew.set(interviewId, feedback);
        });
        setFeedbackMap(feedbackMapNew);

      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load interview data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Load practice records from localStorage and listen for storage events
  useEffect(() => {
    function loadPractice() {
      try {
        const raw = localStorage.getItem("sgt:interview_question_practice");
        const arr = raw ? (JSON.parse(raw) as any[]) : [];
        setPracticeRecords(Array.isArray(arr) ? arr : []);
      } catch (e) {
        setPracticeRecords([]);
      }
    }

    loadPractice();
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "sgt:interview_question_practice") loadPractice();
    };
    window.addEventListener("storage", onStorage);
    // custom event from practice UI (if any)
    const handlePractice = () => loadPractice();
    window.addEventListener("practice-updated", handlePractice as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("practice-updated", handlePractice as EventListener);
    };
  }, []);

  // Compute practice metrics (last 4 weeks)
  const practiceMetrics = useMemo(() => {
    const records = practiceRecords || [];
    const totalSessions = records.length;
    const distinctQuestions = new Set(records.map((r) => r.questionId)).size;
    const lastSessionDate = records
      .map((r) => new Date(r.practicedAt))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const now = new Date();
    // compute week buckets: W-3 (oldest) ... W-0 (current)
    const weeks = [0, 0, 0, 0];
    for (const r of records) {
      const d = new Date(r.practicedAt);
      if (isNaN(d.getTime())) continue;
      // number of weeks ago (0 = this week)
      const diff = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const idx = Math.max(0, Math.min(3, 3 - diff));
      // idx mapping: diff=0 -> 3, diff=3 -> 0; we want weeks[3]=current
      // adjust differently: compute weekOffset = Math.floor((nowStart - dStart)/msWeek)
      const wStart = new Date(now);
      wStart.setHours(0, 0, 0, 0);
      wStart.setDate(now.getDate() - now.getDay()); // sunday of current week
      const weeksAgo = Math.floor((wStart.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const widx = Math.max(0, Math.min(3, weeksAgo));
      // place into weeks so index 3 = current, 0 = oldest
      weeks[3 - widx] += 1;
    }

    const recent = weeks[3];
    const previous = weeks[2] || 0;
    const trend = previous === 0 ? (recent === 0 ? 0 : 1) : (recent - previous) / previous;

    return {
      totalSessions,
      distinctQuestions,
      lastSession: lastSessionDate ? lastSessionDate.toISOString() : null,
      weeks, // [oldest,..,current]
      recent,
      previous,
      trend,
    };
  }, [practiceRecords]);

  const practiceRecommendations = useMemo(() => {
    const recs: string[] = [];
    const m = practiceMetrics;
    if (m.totalSessions === 0) {
      recs.push("Start with short mock sessions: aim for 3 sessions this week (30–45 min).");
    } else {
      if (m.trend > 0.2) recs.push("Your practice frequency is increasing — keep the momentum and add one recorded mock per week to review.");
      else if (m.trend < -0.2) recs.push("Practice frequency is falling — schedule weekly reminders and set small goals (1–2 topics per session).");
      else recs.push("Practice frequency is steady. Focus on targeted drills for weak areas (behavioral or technical).");

      if (m.distinctQuestions < Math.max(5, m.totalSessions / 2)) {
        recs.push("Diversify question types: practice behavioral, situational, and technical prompts.");
      }
    }

    recs.push("Use STAR for behavioral answers and time-box technical problems during practice.");
    recs.push("After each mock, note one improvement goal and track it across sessions.");
    return recs;
  }, [practiceMetrics]);

  // Calculate interview metrics
  const metrics: InterviewMetrics = useMemo(() => {
    const byFormat: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    let totalScore = 0;
    let scoredInterviews = 0;
    let offers = 0;

    interviews.forEach((interview) => {
      // Count by format
      const format = interview.format || 'unknown';
      byFormat[format] = (byFormat[format] || 0) + 1;

      // Count by type
      const type = interview.interview_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      // Count by industry
      const industry = interview.industry || 'unknown';
      byIndustry[industry] = (byIndustry[industry] || 0) + 1;

      // Average score
      if (interview.score !== null) {
        totalScore += interview.score;
        scoredInterviews += 1;
      }

      // Offers
      if (interview.result === true) {
        offers += 1;
      }
    });

    const averageScore = scoredInterviews > 0 ? totalScore / scoredInterviews : 0;
    const offerRate = interviews.length > 0 ? offers / interviews.length : 0;

    // Calculate improvement trend (compare last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentInterviews = interviews.filter((i) => new Date(i.interview_date) >= thirtyDaysAgo);
    const previousInterviews = interviews.filter((i) => {
      const date = new Date(i.interview_date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const recentOffers = recentInterviews.filter((i) => i.result === true).length;
    const previousOffers = previousInterviews.filter((i) => i.result === true).length;

    const recentRate = recentInterviews.length > 0 ? recentOffers / recentInterviews.length : 0;
    const previousRate = previousInterviews.length > 0 ? previousOffers / previousInterviews.length : 0;

    const improvementTrend = previousRate > 0 ? (recentRate - previousRate) / previousRate : 0;

    return {
      totalInterviews: interviews.length,
      byFormat,
      byType,
      byIndustry,
      averageScore,
      offerRate,
      improvementTrend,
    };
  }, [interviews]);

  // Performance by company
  const companyPerformance: CompanyPerformance[] = useMemo(() => {
    const companyMap = new Map<
      string,
      { interviews: number; offers: number; totalScore: number; scoredCount: number }
    >();

    interviews.forEach((interview) => {
      const company = interview.company || "Unknown";
      const data = companyMap.get(company) || { interviews: 0, offers: 0, totalScore: 0, scoredCount: 0 };
      
      data.interviews += 1;

      if (interview.result === true) {
        data.offers += 1;
      }

      if (interview.score !== null) {
        data.totalScore += interview.score;
        data.scoredCount += 1;
      }

      companyMap.set(company, data);
    });

    return Array.from(companyMap.entries())
      .map(([company, data]) => ({
        company,
        interviews: data.interviews,
        offers: data.offers,
        successRate: data.interviews > 0 ? data.offers / data.interviews : 0,
        averageScore: data.scoredCount > 0 ? data.totalScore / data.scoredCount : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);
  }, [interviews]);

  // AI-powered interview tips based on metrics
  const aiTips = useMemo(() => {
    const tips: string[] = [];

    // Offer rate analysis
    if (metrics.offerRate < 0.2 && metrics.totalInterviews >= 5) {
      tips.push(
        "📊 Your offer rate is below 20%. Focus on: (1) Thorough company research before interviews, (2) Practicing behavioral STAR responses, (3) Following up with thank-you notes, (4) Requesting feedback after rejections."
      );
    } else if (metrics.offerRate >= 0.4) {
      tips.push(
        "🌟 Excellent offer rate! Your interview skills are strong. Keep leveraging your current preparation strategy."
      );
    }

    // Improvement trend
    if (metrics.improvementTrend > 0.2) {
      tips.push(
        "📈 Your interview performance is improving! Recent success rate is 20%+ higher than before. Whatever you're doing, keep it up!"
      );
    } else if (metrics.improvementTrend < -0.2) {
      tips.push(
        "📉 Recent interviews show declining success. Consider: (1) Taking a break to reset, (2) Reviewing feedback themes, (3) Practicing with mock interviews."
      );
    }

    // Format-specific advice
    const phoneInterviews = metrics.byFormat['phone'] || 0;
    const onsiteInterviews = metrics.byFormat['onsite'] || 0;
    if (phoneInterviews > onsiteInterviews * 2) {
      tips.push(
        "📞 You're getting many phone screens but fewer onsites. Work on: (1) Conveying enthusiasm, (2) Asking strategic questions, (3) Clearly demonstrating role fit."
      );
    }

    // Confidence analysis
    if (confidenceLogs.length > 0) {
      const avgConfidence = confidenceLogs.reduce((sum, log) => sum + (log.confidence_level || 0), 0) / confidenceLogs.length;
      const avgAnxiety = confidenceLogs.reduce((sum, log) => sum + (log.anxiety_level || 0), 0) / confidenceLogs.length;

      if (avgConfidence < 5) {
        tips.push(
          "💪 Your confidence tracking shows room for improvement. Consider: (1) More mock interviews, (2) Visualization exercises, (3) Reviewing past successes."
        );
      }

      if (avgAnxiety > 7) {
        tips.push(
          "🧘 High anxiety levels detected. Try: (1) Deep breathing before interviews, (2) Arriving early to settle in, (3) Reframing nerves as excitement."
        );
      }
    }

    // Feedback themes analysis
    const allThemes = new Map<string, number>();
    feedbackMap.forEach((feedbackList) => {
      feedbackList.forEach((feedback) => {
        (feedback.themes || []).forEach((theme) => {
          allThemes.set(theme, (allThemes.get(theme) || 0) + 1);
        });
      });
    });

    const topThemes = Array.from(allThemes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    if (topThemes.length > 0) {
      tips.push(
        `🎯 Common feedback themes: ${topThemes.map(([theme]) => theme).join(", ")}. Focus improvement efforts here.`
      );
    }

    // Generic advice if no specific patterns
    if (tips.length === 0) {
      tips.push(
        "💡 Track more interviews with feedback to get personalized insights and identify patterns in your performance."
      );
      tips.push(
        "📖 Prepare STAR stories (Situation, Task, Action, Result) for common behavioral questions to improve interview performance."
      );
    }

    return tips;
  }, [metrics, confidenceLogs, feedbackMap]);

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      metrics,
      companyPerformance,
      aiTips,
      totalJobs: jobs.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview_analytics_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const rows: string[][] = [];
    rows.push(["Interview Analytics Report"]);
    rows.push(["Generated", new Date().toISOString()]);
    rows.push([]);
    rows.push(["Overall Metrics"]);
    rows.push(["Phone Screens", String(metrics.phoneScreens)]);
    rows.push(["Interviews", String(metrics.onSiteInterviews)]);
    rows.push(["Offers", String(metrics.offers)]);
    rows.push([
      "Phone → Interview",
      `${(metrics.phoneToInterview * 100).toFixed(1)}%`,
    ]);
    rows.push([
      "Interview → Offer",
      `${(metrics.interviewToOffer * 100).toFixed(1)}%`,
    ]);
    rows.push([]);
    rows.push(["Company Performance"]);
    rows.push(["Company", "Interviews", "Offers", "Success Rate"]);

    companyPerformance.forEach((perf) => {
      rows.push([
        perf.company,
        String(perf.interviews),
        String(perf.offers),
        `${(perf.successRate * 100).toFixed(1)}%`,
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview_analytics_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 4, borderRadius: 4, backgroundColor: "#fff" }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <InterviewIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Interview Performance
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your interview conversion rates and get AI-powered tips to improve
        your performance.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && metrics.totalInterviews === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No interview data available yet. Start tracking interviews by adding records in the Interview Hub.
        </Alert>
      )}

      {!loading && metrics.totalInterviews > 0 && (
        <Box>
          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InterviewIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Total Interviews
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.totalInterviews}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <OfferIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="text.secondary">
                      Offer Rate
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color={metrics.offerRate >= 0.3 ? "success.main" : "text.primary"}
                  >
                    {(metrics.offerRate * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SuccessIcon fontSize="small" color="warning" />
                    <Typography variant="caption" color="text.secondary">
                      Avg Score
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.averageScore > 0 ? metrics.averageScore.toFixed(1) : "—"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingIcon 
                      fontSize="small" 
                      color={metrics.improvementTrend > 0 ? "success" : metrics.improvementTrend < 0 ? "error" : "action"} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      30-Day Trend
                    </Typography>
                  </Stack>
                  <Typography 
                    variant="h5" 
                    fontWeight={600}
                    color={metrics.improvementTrend > 0 ? "success.main" : metrics.improvementTrend < 0 ? "error.main" : "text.primary"}
                  >
                    {metrics.improvementTrend > 0 ? "+" : ""}{(metrics.improvementTrend * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Export Buttons */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mb: 3 }}
          >
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Stack>

          {/* Performance by Format & Type */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TrendingIcon color="info" />
              <Typography variant="subtitle1" fontWeight={600}>
                Performance Breakdown
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  By Format
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(metrics.byFormat)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([format, count]) => (
                      <Box key={format}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {format}
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {count}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(count / metrics.totalInterviews) * 100}
                          sx={{ height: 4, borderRadius: 1 }}
                        />
                      </Box>
                    ))}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  By Type
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(metrics.byType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <Box key={type}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {type}
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {count}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(count / metrics.totalInterviews) * 100}
                          sx={{ height: 4, borderRadius: 1 }}
                          color="secondary"
                        />
                      </Box>
                    ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Confidence & Anxiety Tracking */}
          {confidenceLogs.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Confidence & Anxiety Management
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Average Confidence (1-10)
                    </Typography>
                    <Typography variant="h4">
                      {(confidenceLogs.reduce((sum, log) => sum + (log.confidence_level || 0), 0) / confidenceLogs.length).toFixed(1)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(confidenceLogs.reduce((sum, log) => sum + (log.confidence_level || 0), 0) / confidenceLogs.length / 10) * 100}
                      sx={{ mt: 1, height: 8, borderRadius: 1 }}
                      color="success"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Average Anxiety (1-10)
                    </Typography>
                    <Typography variant="h4">
                      {(confidenceLogs.reduce((sum, log) => sum + (log.anxiety_level || 0), 0) / confidenceLogs.length).toFixed(1)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(confidenceLogs.reduce((sum, log) => sum + (log.anxiety_level || 0), 0) / confidenceLogs.length / 10) * 100}
                      sx={{ mt: 1, height: 8, borderRadius: 1 }}
                      color="warning"
                    />
                  </Box>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Based on {confidenceLogs.length} confidence log{confidenceLogs.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}

          {/* Feedback Themes */}
          {feedbackMap.size > 0 && (() => {
            const allThemes = new Map<string, number>();
            feedbackMap.forEach((feedbackList) => {
              feedbackList.forEach((feedback) => {
                (feedback.themes || []).forEach((theme) => {
                  allThemes.set(theme, (allThemes.get(theme) || 0) + 1);
                });
              });
            });
            const sortedThemes = Array.from(allThemes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

            return sortedThemes.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Common Feedback Themes
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {sortedThemes.map(([theme, count]) => (
                    <Chip 
                      key={theme} 
                      label={`${theme} (${count})`} 
                      size="small" 
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Focus improvement efforts on frequently mentioned themes
                </Typography>
              </Box>
            ) : null;
          })()}

          <Divider sx={{ my: 3 }} />

          {/* Company Performance */}
          {companyPerformance.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Performance by Company & Industry
              </Typography>
              <Table size="small">
                <TableBody>
                  {companyPerformance.slice(0, 5).map((perf, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{perf.company}</TableCell>
                      <TableCell align="right">
                        {perf.interviews} interview
                        {perf.interviews > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell align="right">
                        {perf.offers} offer{perf.offers > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell align="right">
                        {perf.averageScore > 0 ? (
                          <Typography variant="caption">
                            Avg: {perf.averageScore.toFixed(1)}
                          </Typography>
                        ) : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(perf.successRate * 100).toFixed(0)}%`}
                          size="small"
                          color={
                            perf.successRate >= 0.5 ? "success" : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Interview Practice Analytics */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <AIIcon color="secondary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Interview Practice Analytics
              </Typography>
              <Chip label="Practice" size="small" color="secondary" />
            </Stack>

            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Box>
                <Typography variant="caption">Total sessions</Typography>
                <Typography variant="h6">{practiceMetrics.totalSessions}</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Distinct questions</Typography>
                <Typography variant="h6">{practiceMetrics.distinctQuestions}</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Last session</Typography>
                <Typography variant="body2">{practiceMetrics.lastSession ? new Date(practiceMetrics.lastSession).toLocaleString() : "—"}</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption">Sessions (last 4 weeks)</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", height: 56, mt: 1 }}>
                {practiceMetrics.weeks.map((w, i) => (
                  <Box key={i} sx={{ flex: 1, textAlign: "center" }}>
                    <Box sx={{ height: `${Math.min(100, (w || 0) * 20)}%`, bgcolor: "secondary.main", mx: 0.5, borderRadius: 0.5 }} />
                    <Typography variant="caption">{w}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Personalized recommendations</Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {practiceRecommendations.map((r, i) => (
                <li key={i}><Typography variant="body2" sx={{ mb: 1 }}>{r}</Typography></li>
              ))}
            </Box>
          </Box>

          {/* AI Interview Tips */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AIIcon color="success" />
              <Typography variant="subtitle1" fontWeight={600}>
                AI Interview Preparation Tips
              </Typography>
            </Stack>

            <List dense>
              {aiTips.map((tip, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={tip}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
