/**
 * CompetitivePositioningCard — Comprehensive market positioning analysis
 *
 * Purpose: Display user's competitive standing against anonymized peers and
 * industry standards with actionable insights for improvement.
 *
 * Features (8 Acceptance Criteria):
 * 1. Peer Benchmark Comparison - Application/interview/offer rates vs peers
 * 2. Competitive Positioning Assessment - Percentile rankings and scores
 * 3. Industry Standard Monitoring - Deviations from market averages
 * 4. Career Progression Pattern Tracking - Typical timelines and paths
 * 5. Skill Gap Analysis - Missing skills vs top performers
 * 6. Competitive Advantage Recommendations - Strategic improvements
 * 7. Differentiation Strategy Insights - Unique strengths to leverage
 * 8. Market Position Optimization - Visibility and targeting actions
 *
 * Backend: POST /api/analytics/competitive/position
 * Database: user_competitive_position, peer_benchmarks, industry_standards,
 *           career_progression_patterns
 */

import { useEffect, useState } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  TipsAndUpdates as IdeaIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  InfoOutlined as InfoIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";

interface CompetitiveData {
  segment: {
    industry: string;
    experienceLevel: string;
    titleCategory: string;
  };
  userMetrics: {
    applicationsPerMonth: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    avgTimeToInterview: number;
    avgTimeToOffer: number;
    totalSkills: number;
  };
  percentileRankings: {
    applicationVolume: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    skillsDepth: number;
  };
  peerComparison: {
    benchmark: {
      applicationsPerMonth: number;
      responseRate: number;
      interviewRate: number;
      offerRate: number;
      sampleSize: number;
    };
    yourPerformance: {
      applicationsPerMonth: number;
      responseRate: number;
      interviewRate: number;
      offerRate: number;
    };
    comparison: {
      applicationsPerMonth: number;
      responseRate: number;
      interviewRate: number;
      offerRate: number;
    };
  };
  industryStandards: {
    applicationsPerMonth: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    timeToHire: number;
    salaryRange: {min: number; max: number; median: number} | null;
    requiredSkills: string[];
  };
  careerProgression: {
    currentTitle: string;
    possiblePaths: Array<{
      nextTitle: string;
      avgMonths: number;
      skillsNeeded: string[];
      successFactors: string[];
      successRate: number;
    }>;
  };
  skillGapAnalysis: {
    missingSkills: string[];
    matchedSkills: string[];
    skillMatchPercentage: number;
    skillsDepth: {
      user: number;
      peerAverage: number;
      industryRequired: number;
    };
    topMissingAcrossPeers: Array<{skill: string; frequency: number}>;
    recommendations: Array<{
      skill: string;
      priority: string;
      reason: string;
      resources: string[];
    }>;
  };
  competitiveAdvantages: Array<{
    type: string;
    advantage: string;
    action: string;
    impact: string;
  }>;
  differentiationStrategies: Array<{
    strategy: string;
    rationale: string;
    actions: string[];
  }>;
  marketOptimization: {
    visibility: string[];
    targeting: string[];
    timing: string[];
    quality: string[];
  };
}

export default function CompetitivePositioningCard() {
  const { user, session } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompetitiveData | null>(null);

  // Load competitive positioning data
  const loadData = async () => {
    if (!user?.id || !session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:8787/api/analytics/competitive/position",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load competitive data");
      }

      setData(result.data);
    } catch (err) {
      console.error("[CompetitivePositioningCard] Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load competitive positioning"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Export as JSON
  const handleExportJSON = () => {
    if (!data) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      ...data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `competitive_positioning_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format percentile for display
  const formatPercentile = (percentile: number): string => {
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Above Average";
    if (percentile >= 25) return "Below Average";
    return "Bottom 25%";
  };

  // Get percentile color
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 75) return "success.main";
    if (percentile >= 50) return "primary.main";
    if (percentile >= 25) return "warning.main";
    return "error.main";
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 4, borderRadius: 4, backgroundColor: "#fff" }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <TrophyIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={700}>
          Competitive Market Positioning
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive analysis comparing your job search performance against
        anonymized peer data and industry standards, with actionable insights
        for strategic improvement.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !data && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No competitive data available. Click "Refresh Analysis" to generate
          your positioning report.
        </Alert>
      )}

      {/* Action Buttons */}
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
          disabled={!data}
        >
          Export Report
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AIIcon />}
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </Stack>

      {data && (
        <Box>
          {/* 1. Segment Information */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Your Market Segment
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip label={data.segment.industry} color="primary" />
                <Chip label={data.segment.experienceLevel} variant="outlined" />
                <Chip label={data.segment.titleCategory} variant="outlined" />
              </Stack>
              {data.peerComparison.benchmark.sampleSize > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Compared against {data.peerComparison.benchmark.sampleSize}{" "}
                  anonymized professionals
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 2. Percentile Rankings (Competitive Positioning Assessment) */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Percentile Rankings
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {Object.entries(data.percentileRankings).map(([key, value]) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textTransform="capitalize"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{ color: getPercentileColor(value) }}
                        >
                          {value}
                          <Typography
                            component="span"
                            variant="h6"
                            color="text.secondary"
                          >
                            %ile
                          </Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatPercentile(value)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 3. Peer Comparison */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Peer Benchmark Comparison
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Response Rate
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        You: {(data.userMetrics.responseRate * 100).toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={data.userMetrics.responseRate * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Chip
                      label={`${data.peerComparison.comparison.responseRate >= 0 ? "+" : ""}${data.peerComparison.comparison.responseRate.toFixed(0)}%`}
                      size="small"
                      color={
                        data.peerComparison.comparison.responseRate >= 0
                          ? "success"
                          : "error"
                      }
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Peer avg:{" "}
                    {(data.peerComparison.benchmark.responseRate * 100).toFixed(
                      1
                    )}
                    %
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Interview Rate
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        You:{" "}
                        {(data.userMetrics.interviewRate * 100).toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={data.userMetrics.interviewRate * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Chip
                      label={`${data.peerComparison.comparison.interviewRate >= 0 ? "+" : ""}${data.peerComparison.comparison.interviewRate.toFixed(0)}%`}
                      size="small"
                      color={
                        data.peerComparison.comparison.interviewRate >= 0
                          ? "success"
                          : "error"
                      }
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Peer avg:{" "}
                    {(
                      data.peerComparison.benchmark.interviewRate * 100
                    ).toFixed(1)}
                    %
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Offer Rate
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        You: {(data.userMetrics.offerRate * 100).toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={data.userMetrics.offerRate * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                        color="success"
                      />
                    </Box>
                    <Chip
                      label={`${data.peerComparison.comparison.offerRate >= 0 ? "+" : ""}${data.peerComparison.comparison.offerRate.toFixed(0)}%`}
                      size="small"
                      color={
                        data.peerComparison.comparison.offerRate >= 0
                          ? "success"
                          : "error"
                      }
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Peer avg:{" "}
                    {(data.peerComparison.benchmark.offerRate * 100).toFixed(1)}
                    %
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Applications/Month
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        You: {data.userMetrics.applicationsPerMonth.toFixed(1)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          (data.userMetrics.applicationsPerMonth /
                            Math.max(
                              1,
                              data.peerComparison.benchmark.applicationsPerMonth
                            )) *
                            100
                        )}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Chip
                      label={`${data.peerComparison.comparison.applicationsPerMonth >= 0 ? "+" : ""}${data.peerComparison.comparison.applicationsPerMonth.toFixed(0)}%`}
                      size="small"
                      color={
                        data.peerComparison.comparison.applicationsPerMonth >= 0
                          ? "success"
                          : "warning"
                      }
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Peer avg:{" "}
                    {data.peerComparison.benchmark.applicationsPerMonth.toFixed(
                      1
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 4. Industry Standards Monitoring */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Industry Standards
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Market averages for {data.segment.industry} industry:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Standard Application Volume"
                    secondary={`${data.industryStandards.applicationsPerMonth.toFixed(1)} applications/month`}
                  />
                  <Chip
                    label={
                      data.userMetrics.applicationsPerMonth >=
                      data.industryStandards.applicationsPerMonth
                        ? "Above Standard"
                        : "Below Standard"
                    }
                    size="small"
                    color={
                      data.userMetrics.applicationsPerMonth >=
                      data.industryStandards.applicationsPerMonth
                        ? "success"
                        : "warning"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Standard Response Rate"
                    secondary={`${(data.industryStandards.responseRate * 100).toFixed(1)}%`}
                  />
                  <Chip
                    label={
                      data.userMetrics.responseRate >=
                      data.industryStandards.responseRate
                        ? "Above Standard"
                        : "Below Standard"
                    }
                    size="small"
                    color={
                      data.userMetrics.responseRate >=
                      data.industryStandards.responseRate
                        ? "success"
                        : "warning"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Standard Interview Rate"
                    secondary={`${(data.industryStandards.interviewRate * 100).toFixed(1)}%`}
                  />
                  <Chip
                    label={
                      data.userMetrics.interviewRate >=
                      data.industryStandards.interviewRate
                        ? "Above Standard"
                        : "Below Standard"
                    }
                    size="small"
                    color={
                      data.userMetrics.interviewRate >=
                      data.industryStandards.interviewRate
                        ? "success"
                        : "warning"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Standard Offer Rate"
                    secondary={`${(data.industryStandards.offerRate * 100).toFixed(1)}%`}
                  />
                  <Chip
                    label={
                      data.userMetrics.offerRate >=
                      data.industryStandards.offerRate
                        ? "Above Standard"
                        : "Below Standard"
                    }
                    size="small"
                    color={
                      data.userMetrics.offerRate >=
                      data.industryStandards.offerRate
                        ? "success"
                        : "warning"
                    }
                  />
                </ListItem>
                {data.industryStandards.salaryRange && (
                  <ListItem>
                    <ListItemText
                      primary="Salary Range"
                      secondary={`$${(data.industryStandards.salaryRange.min / 1000).toFixed(0)}K - $${(data.industryStandards.salaryRange.max / 1000).toFixed(0)}K (Median: $${(data.industryStandards.salaryRange.median / 1000).toFixed(0)}K)`}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* 5. Career Progression Patterns */}
          {data.careerProgression.possiblePaths.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TimelineIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Career Progression Paths
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Typical progression paths from {data.careerProgression.currentTitle}:
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {data.careerProgression.possiblePaths.map((path, idx) => (
                    <Card key={idx} variant="outlined">
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {path.nextTitle}
                          </Typography>
                          <Chip
                            label={`${(path.successRate * 100).toFixed(0)}% success rate`}
                            size="small"
                            color="primary"
                          />
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          Avg timeline: {path.avgMonths} months
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          display="block"
                        >
                          Skills to acquire:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {path.skillsNeeded.slice(0, 5).map((skill, i) => (
                            <Chip key={i} label={skill} size="small" variant="outlined" />
                          ))}
                        </Stack>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          Success factors:
                        </Typography>
                        <List dense sx={{ pt: 0 }}>
                          {path.successFactors.slice(0, 3).map((factor, i) => (
                            <ListItem key={i} sx={{ py: 0 }}>
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                <CheckIcon fontSize="small" color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={factor}
                                primaryTypographyProps={{
                                  variant: "caption",
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 6. Skill Gap Analysis */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  Skill Gap Analysis
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Skill Match Score
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color={
                        data.skillGapAnalysis.skillMatchPercentage >= 80
                          ? "success.main"
                          : data.skillGapAnalysis.skillMatchPercentage >= 60
                          ? "primary.main"
                          : "warning.main"
                      }
                    >
                      {data.skillGapAnalysis.skillMatchPercentage.toFixed(0)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {data.skillGapAnalysis.matchedSkills.length} of{" "}
                    {data.skillGapAnalysis.skillsDepth.industryRequired} required skills
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Skills Depth
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Your Skills"
                        secondary={data.skillGapAnalysis.skillsDepth.user}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Peer Average"
                        secondary={data.skillGapAnalysis.skillsDepth.peerAverage.toFixed(0)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Industry Required"
                        secondary={data.skillGapAnalysis.skillsDepth.industryRequired}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {data.skillGapAnalysis.missingSkills.length > 0 && (
                  <Grid size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Missing High-Priority Skills
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {data.skillGapAnalysis.missingSkills.slice(0, 10).map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" color="warning" />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 7. Competitive Advantage Recommendations */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrophyIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Competitive Advantages
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {data.competitiveAdvantages.map((advantage, idx) => (
                  <ListItem key={idx} alignItems="flex-start">
                    <ListItemIcon>
                      {advantage.type === "strength" || advantage.type === "performance" ? (
                        <CheckIcon color="success" />
                      ) : advantage.type === "gap" || advantage.type === "improvement" ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <InfoIcon color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{advantage.advantage}</Typography>
                          <Chip
                            label={advantage.impact}
                            size="small"
                            color={
                              advantage.impact === "high"
                                ? "error"
                                : advantage.impact === "medium"
                                ? "warning"
                                : "default"
                            }
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          <strong>Action:</strong> {advantage.action}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* 8. Differentiation Strategies */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IdeaIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Differentiation Strategies
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {data.differentiationStrategies.map((strategy, idx) => (
                  <Card key={idx} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {strategy.strategy}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {strategy.rationale}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" fontWeight={600} display="block">
                        Recommended actions:
                      </Typography>
                      <List dense>
                        {strategy.actions.map((action, i) => (
                          <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <CheckIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={action}
                              primaryTypographyProps={{ variant: "caption" }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* 9. Market Position Optimization */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <VisibilityIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Market Position Optimization
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Visibility Enhancement
                  </Typography>
                  <List dense>
                    {data.marketOptimization.visibility.slice(0, 4).map((tip, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <VisibilityIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tip}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Targeting Strategy
                  </Typography>
                  <List dense>
                    {data.marketOptimization.targeting.slice(0, 4).map((tip, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <TrendingIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tip}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timing Optimization
                  </Typography>
                  <List dense>
                    {data.marketOptimization.timing.slice(0, 4).map((tip, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <TimelineIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tip}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Application Quality
                  </Typography>
                  <List dense>
                    {data.marketOptimization.quality.slice(0, 4).map((tip, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <TrophyIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tip}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Paper>
  );
}
