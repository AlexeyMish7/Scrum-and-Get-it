/**
 * SkillsGapCard — Overall skills gap analysis across all jobs
 *
 * Purpose: Analyze skill gaps across user's job applications and profile
 * Features: Aggregate missing skills, learning recommendations, skill trends
 *
 * Backend: Uses analytics_cache and match scores from jobs
 * Cache: Aggregates data from individual job match analyses
 *
 * Contract:
 * - Inputs: User ID (from auth context)
 * - Outputs: Top missing skills, learning paths, skill demand trends
 * - Export: JSON/CSV download of skills gap analysis
 */

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  School as SkillsIcon,
  TrendingUp as TrendingIcon,
  Download as DownloadIcon,
  Psychology as AIIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import crud from "@shared/services/crud";

interface SkillGap {
  skill: string;
  frequency: number; // How many jobs require it
  priority: "high" | "medium" | "low";
}

interface LearningResource {
  skill: string;
  resources: string[];
}

interface JobRecord {
  id: number;
  job_title?: string;
  company_name?: string;
  job_status?: string;
  created_at?: string;
}

interface AnalyticsCache {
  job_id: number;
  analytics_type: string;
  data: Record<string, unknown>;
  match_score?: number;
  created_at: string;
}

export default function SkillsGapCard() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [analyticsCache, setAnalyticsCache] = useState<AnalyticsCache[]>([]);

  // Load jobs and analytics cache
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userCrud = crud.withUser(user.id);

        // Load jobs
        const jobsResult = await userCrud.listRows<JobRecord>(
          "jobs",
          "id, job_title, company_name, job_status, created_at"
        );

        if (jobsResult.error) {
          throw new Error(jobsResult.error.message);
        }

        setJobs(jobsResult.data || []);

        // Load analytics cache to get match data with skills gaps
        const cacheResult = await userCrud.listRows<AnalyticsCache>(
          "analytics_cache",
          "job_id, analytics_type, data, match_score, created_at",
          {
            eq: { analytics_type: "document-match-score" },
          }
        );

        if (cacheResult.error) {
          console.warn("Could not load analytics cache:", cacheResult.error);
          setAnalyticsCache([]);
        } else {
          setAnalyticsCache(cacheResult.data || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load skills gap data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Aggregate skills gaps from analytics cache
  const skillsGapAnalysis = useMemo(() => {
    const skillsMap = new Map<string, number>();

    // Extract missing skills from cached match analyses
    analyticsCache.forEach((cache) => {
      const data = cache.data;
      const skillsGaps = (data?.skillsGaps ||
        data?.missingSkills ||
        []) as string[];

      skillsGaps.forEach((skill: string) => {
        const count = skillsMap.get(skill) || 0;
        skillsMap.set(skill, count + 1);
      });
    });

    // Convert to array and sort by frequency
    const gaps: SkillGap[] = Array.from(skillsMap.entries())
      .map(([skill, frequency]) => ({
        skill,
        frequency,
        priority:
          frequency >= 5
            ? ("high" as const)
            : frequency >= 3
            ? ("medium" as const)
            : ("low" as const),
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return gaps;
  }, [analyticsCache]);

  // Generate learning recommendations based on top gaps
  const learningRecommendations: LearningResource[] = useMemo(() => {
    const topGaps = skillsGapAnalysis.slice(0, 5);

    return topGaps.map((gap) => {
      // Generate generic learning resources for each skill
      const skill = gap.skill;
      return {
        skill,
        resources: [
          `Online course: Search "${skill} tutorial" on Coursera/Udemy`,
          `Practice: Build a project demonstrating ${skill}`,
          `Certification: Look for ${skill} certifications`,
          `Reading: Find technical articles about ${skill}`,
        ],
      };
    });
  }, [skillsGapAnalysis]);

  // Average match score across all jobs with analytics
  const avgMatchScore = useMemo(() => {
    if (analyticsCache.length === 0) return 0;
    const total = analyticsCache.reduce(
      (sum, cache) => sum + (cache.match_score || 0),
      0
    );
    return Math.round(total / analyticsCache.length);
  }, [analyticsCache]);

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalJobs: jobs.length,
        analyzedJobs: analyticsCache.length,
        avgMatchScore,
        totalSkillsGaps: skillsGapAnalysis.length,
      },
      skillsGaps: skillsGapAnalysis,
      learningRecommendations,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skills_gap_analysis_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const rows: string[][] = [];
    rows.push(["Skills Gap Analysis Report"]);
    rows.push(["Generated", new Date().toISOString()]);
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Jobs", String(jobs.length)]);
    rows.push(["Analyzed Jobs", String(analyticsCache.length)]);
    rows.push(["Avg Match Score", `${avgMatchScore}%`]);
    rows.push([]);
    rows.push(["Skill", "Frequency", "Priority"]);

    skillsGapAnalysis.forEach((gap) => {
      rows.push([gap.skill, String(gap.frequency), gap.priority]);
    });

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skills_gap_analysis_${new Date()
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
        <SkillsIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Skills Gap Analysis
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Identify the most in-demand skills you're missing across all your job
        applications. Focus your learning on high-impact areas.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && analyticsCache.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No skills gap data available yet. Apply to jobs and generate match
          scores to see your skills gaps.
        </Alert>
      )}

      {!loading && analyticsCache.length > 0 && (
        <Box>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Analyzed Jobs
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {analyticsCache.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Avg Match Score
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {avgMatchScore}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Unique Gaps
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {skillsGapAnalysis.length}
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

          {/* Top Skills Gaps */}
          {skillsGapAnalysis.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <TrendingIcon color="warning" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Top Missing Skills
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {skillsGapAnalysis.slice(0, 10).map((gap, idx) => (
                  <Box key={idx}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {gap.skill}
                      </Typography>
                      <Chip
                        label={gap.priority.toUpperCase()}
                        size="small"
                        color={
                          gap.priority === "high"
                            ? "error"
                            : gap.priority === "medium"
                            ? "warning"
                            : "default"
                        }
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 0.5 }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={
                          (gap.frequency /
                            Math.max(
                              ...skillsGapAnalysis.map((g) => g.frequency)
                            )) *
                          100
                        }
                        sx={{ flex: 1, height: 6, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {gap.frequency} job{gap.frequency > 1 ? "s" : ""}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Learning Recommendations */}
          {learningRecommendations.length > 0 && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <AIIcon color="success" />
                <Typography variant="subtitle1" fontWeight={600}>
                  AI Learning Recommendations
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Focus on these high-impact skills to improve your match scores:
              </Typography>

              <Stack spacing={2}>
                {learningRecommendations.map((rec, idx) => (
                  <Card key={idx} variant="outlined">
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        {rec.skill}
                      </Typography>
                      <Stack spacing={0.5}>
                        {rec.resources.map((resource, resIdx) => (
                          <Typography
                            key={resIdx}
                            variant="body2"
                            color="text.secondary"
                          >
                            • {resource}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
