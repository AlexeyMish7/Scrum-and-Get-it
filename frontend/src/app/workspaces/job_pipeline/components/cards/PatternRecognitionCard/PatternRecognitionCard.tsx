/**
 * PatternRecognitionCard Component
 *
 * Displays pattern recognition analysis showing:
 * - Patterns in successful applications, interviews, and offers
 * - Preparation activity correlations
 * - Timing patterns for optimal execution
 * - Strategy effectiveness tracking
 * - Success factors and predictive insights
 * - Historical pattern recommendations
 * - Pattern evolution tracking
 *
 * All 8 acceptance criteria in ONE collapsible card
 */

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingIcon,
  Schedule as TimingIcon,
  Build as PrepIcon,
  Lightbulb as InsightIcon,
  ShowChart as PredictiveIcon,
  Timeline as EvolutionIcon,
  EmojiEvents as SuccessIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { toApiUrl } from "@shared/services/apiUrl";

interface PatternData {
  summary: {
    totalJobs: number;
    patternsIdentified: number;
    highConfidencePatterns: number;
    topSuccessRate: number;
  };
  applicationPatterns: Array<{
    pattern_name: string;
    success_rate: number;
    confidence_score: number;
    sample_size: number;
    pattern_attributes: Record<string, any>;
    recommendations: Array<{
      action: string;
      reason: string;
      priority: string;
      expected_impact: number;
    }>;
  }>;
  interviewPatterns: Array<{
    pattern_name: string;
    success_rate: number;
    confidence_score: number;
    sample_size: number;
    recommendations: Array<{
      action: string;
      reason: string;
    }>;
  }>;
  offerPatterns: Array<{
    pattern_name: string;
    success_rate: number;
    confidence_score: number;
    pattern_attributes: Record<string, any>;
    recommendations: Array<{
      action: string;
      reason: string;
    }>;
  }>;
  preparationCorrelations: {
    correlations: Array<{
      activity: string;
      responseCorrelation: number;
      interviewCorrelation: number;
      offerCorrelation: number;
      impact: string;
      sample_size: number;
    }>;
    insights: string;
  };
  timingPatterns: Array<{
    timing_type: string;
    timing_value: string;
    response_rate: number;
    interview_rate: number;
    offer_rate: number;
    relative_performance: number;
    is_optimal: boolean;
  }>;
  strategyEffectiveness: Array<{
    strategy_name: string;
    strategy_type: string;
    success_rate: number;
    times_used: number;
    market_condition: string;
    effectiveness_trend: string;
    recommended_use_cases: string[];
  }>;
  successFactors: {
    keyFactors: Array<{
      factor: string;
      value: number;
      importance: string;
      trend: string;
    }>;
    strengthAreas: Array<{
      area: string;
      description: string;
      strength: string;
    }>;
    improvementAreas: Array<{
      area: string;
      suggestion: string;
      priority: string;
    }>;
  };
  predictiveInsights: {
    nextApplicationProbability?: number;
    estimatedTimeToOffer?: number;
    optimalApplicationTiming?: {
      dayOfWeek: string;
      timeOfDay: string;
      confidence: number;
    };
    recommendedStrategy?: string;
    confidenceLevel?: number;
    predictionBasis?: string;
  };
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: string;
    expectedImpact: string;
    actionSteps: string[];
  }>;
  patternEvolution: {
    snapshots: Array<{
      period: string;
      successRate: number;
      confidence: number;
      sampleSize: number;
      adaptations: number;
    }>;
    trends: {
      successRateTrend?: string;
      confidenceTrend?: string;
      adaptationCount?: number;
    };
    insights: string;
  };
}

export default function PatternRecognitionCard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatternData | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const fetchPatternAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          toApiUrl("/api/analytics/pattern-recognition"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch pattern analysis");
        }
      } catch (err) {
        console.error("Error fetching pattern analysis:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPatternAnalysis();
  }, [session?.access_token]);

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={24} />
            <Typography>Analyzing success patterns...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">
            <Typography variant="body2">
              Failed to load pattern analysis: {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header with Summary */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <PsychologyIcon fontSize="large" color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              Pattern Recognition Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered insights from {data.summary.totalJobs} applications
            </Typography>
          </Box>
        </Stack>

        {/* Summary Chips */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}
        >
          <Chip
            label={`${data.summary.patternsIdentified} Patterns Identified`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${data.summary.highConfidencePatterns} High Confidence`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${(data.summary.topSuccessRate * 100).toFixed(
              0
            )}% Top Success Rate`}
            color="info"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* 1. Successful Application Patterns */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SuccessIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Successful Application Patterns
              </Typography>
              <Chip
                label={data.applicationPatterns.length}
                size="small"
                color="primary"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.applicationPatterns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Need more application data to identify patterns (minimum 5
                applications)
              </Typography>
            ) : (
              <List dense>
                {data.applicationPatterns.map((pattern, idx) => (
                  <ListItem key={idx} sx={{ display: "block", mb: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {pattern.pattern_name}
                      </Typography>
                      <Chip
                        label={`${(pattern.success_rate * 100).toFixed(
                          0
                        )}% success`}
                        size="small"
                        color="success"
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Confidence: {(pattern.confidence_score * 100).toFixed(0)}%
                      • Sample: {pattern.sample_size} applications
                    </Typography>
                    {pattern.recommendations.length > 0 && (
                      <Paper sx={{ mt: 1, p: 1.5, bgcolor: "success.50" }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="success.dark"
                        >
                          💡 {pattern.recommendations[0].action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pattern.recommendations[0].reason}
                        </Typography>
                      </Paper>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 2. Interview Success Patterns */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SuccessIcon color="secondary" />
              <Typography variant="h6" fontWeight={600}>
                Interview Success Patterns
              </Typography>
              <Chip
                label={data.interviewPatterns.length}
                size="small"
                color="secondary"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.interviewPatterns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Need more interview data to identify patterns (minimum 3
                interviews)
              </Typography>
            ) : (
              <List dense>
                {data.interviewPatterns.map((pattern, idx) => (
                  <ListItem key={idx} sx={{ display: "block", mb: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {pattern.pattern_name}
                      </Typography>
                      <Chip
                        label={`${(pattern.success_rate * 100).toFixed(
                          0
                        )}% conversion`}
                        size="small"
                        color="success"
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Based on {pattern.sample_size} interviews
                    </Typography>
                    {pattern.recommendations.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        💡 {pattern.recommendations[0].reason}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 3. Offer Success Patterns */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SuccessIcon color="success" />
              <Typography variant="h6" fontWeight={600}>
                Offer Success Patterns
              </Typography>
              <Chip
                label={data.offerPatterns.length}
                size="small"
                color="success"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.offerPatterns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Need more offer data to identify patterns (minimum 2 offers)
              </Typography>
            ) : (
              <List dense>
                {data.offerPatterns.map((pattern, idx) => (
                  <ListItem key={idx} sx={{ display: "block", mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {pattern.pattern_name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Success Rate: {(pattern.success_rate * 100).toFixed(0)}%
                    </Typography>
                    {pattern.pattern_attributes.avg_salary_offered && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Average Offer: $
                        {(
                          pattern.pattern_attributes.avg_salary_offered / 1000
                        ).toFixed(0)}
                        K
                      </Typography>
                    )}
                    {pattern.recommendations.length > 0 && (
                      <Typography
                        variant="body2"
                        color="success.dark"
                        sx={{ mt: 1 }}
                      >
                        💡 {pattern.recommendations[0].action}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 4. Preparation Correlations */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PrepIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Preparation Activity Correlations
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.preparationCorrelations.insights}
            </Typography>
            {data.preparationCorrelations.correlations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Start tracking preparation activities to see what impacts your
                success
              </Typography>
            ) : (
              <List dense>
                {data.preparationCorrelations.correlations.map((corr, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={corr.activity
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                      secondary={`Sample: ${corr.sample_size} activities`}
                    />
                    <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                      <Box>
                        <Typography variant="caption">
                          Response:{" "}
                          {(corr.responseCorrelation * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={corr.responseCorrelation * 100}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption">
                          Offer: {(corr.offerCorrelation * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={corr.offerCorrelation * 100}
                          color="success"
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    </Stack>
                    <Chip
                      label={corr.impact}
                      size="small"
                      color={
                        corr.impact === "high"
                          ? "error"
                          : corr.impact === "medium"
                          ? "warning"
                          : "default"
                      }
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 5. Timing Patterns */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TimingIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Optimal Timing Patterns
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.timingPatterns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Need more application data to identify timing patterns
              </Typography>
            ) : (
              <List dense>
                {data.timingPatterns.map((timing, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={`${timing.timing_type.replace(/_/g, " ")}: ${
                        timing.timing_value
                      }`}
                      secondary={
                        <>
                          Response: {(timing.response_rate * 100).toFixed(1)}% •
                          Interview: {(timing.interview_rate * 100).toFixed(1)}%
                          • Offer: {(timing.offer_rate * 100).toFixed(1)}%
                        </>
                      }
                    />
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Chip
                        label={`${(
                          (timing.relative_performance - 1) *
                          100
                        ).toFixed(0)}% ${
                          timing.relative_performance >= 1 ? "better" : "worse"
                        }`}
                        size="small"
                        color={
                          timing.relative_performance >= 1.2
                            ? "success"
                            : timing.relative_performance >= 1
                            ? "info"
                            : "default"
                        }
                      />
                      {timing.is_optimal && (
                        <Chip label="⭐ Optimal" size="small" color="warning" />
                      )}
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 6. Strategy Effectiveness */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Strategy Effectiveness
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.strategyEffectiveness.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Apply different strategies to track their effectiveness
              </Typography>
            ) : (
              <List dense>
                {data.strategyEffectiveness.map((strategy, idx) => (
                  <ListItem key={idx} sx={{ display: "block", mb: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {strategy.strategy_name}
                      </Typography>
                      <Chip
                        label={`${(strategy.success_rate * 100).toFixed(
                          0
                        )}% success`}
                        size="small"
                        color={
                          strategy.success_rate > 0.25 ? "success" : "default"
                        }
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Used {strategy.times_used} times •{" "}
                      {strategy.effectiveness_trend} trend
                    </Typography>
                    {strategy.recommended_use_cases.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          Best for:
                        </Typography>
                        {strategy.recommended_use_cases.map((useCase, i) => (
                          <Chip
                            key={i}
                            label={useCase}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 0.5, mt: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 7. Success Factors & Predictive Insights */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PredictiveIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Success Factors & Predictions
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {/* Key Success Factors */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Key Success Factors
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {data.successFactors.keyFactors.map((factor, idx) => (
                <Grid item xs={12} sm={4} key={idx}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h4" color="primary.main">
                      {typeof factor.value === "number" && factor.value < 1
                        ? `${(factor.value * 100).toFixed(0)}%`
                        : factor.value}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {factor.factor}
                    </Typography>
                    <Chip
                      label={factor.trend}
                      size="small"
                      color={
                        factor.trend === "healthy" || factor.trend === "stable"
                          ? "success"
                          : "warning"
                      }
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Predictive Insights */}
            {data.predictiveInsights.nextApplicationProbability && (
              <>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 1, mt: 2 }}
                >
                  Predictive Insights
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Next Application Success Probability"
                      secondary={data.predictiveInsights.predictionBasis}
                    />
                    <Chip
                      label={`${(
                        data.predictiveInsights.nextApplicationProbability * 100
                      ).toFixed(0)}%`}
                      color={
                        data.predictiveInsights.nextApplicationProbability > 0.3
                          ? "success"
                          : "warning"
                      }
                    />
                  </ListItem>
                  {data.predictiveInsights.estimatedTimeToOffer && (
                    <ListItem>
                      <ListItemText primary="Estimated Time to Offer" />
                      <Typography variant="body2" fontWeight={600}>
                        {data.predictiveInsights.estimatedTimeToOffer} days
                      </Typography>
                    </ListItem>
                  )}
                  {data.predictiveInsights.optimalApplicationTiming && (
                    <ListItem>
                      <ListItemText
                        primary="Optimal Application Timing"
                        secondary={`${
                          data.predictiveInsights.optimalApplicationTiming
                            .confidence * 100
                        }% confidence`}
                      />
                      <Chip
                        label={`${data.predictiveInsights.optimalApplicationTiming.dayOfWeek} ${data.predictiveInsights.optimalApplicationTiming.timeOfDay}`}
                        color="info"
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}

            {/* Strength & Improvement Areas */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="success.main"
                  sx={{ mb: 1 }}
                >
                  ✅ Strength Areas
                </Typography>
                {data.successFactors.strengthAreas.map((strength, idx) => (
                  <Chip
                    key={idx}
                    label={strength.area}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="warning.main"
                  sx={{ mb: 1 }}
                >
                  🎯 Improvement Areas
                </Typography>
                {data.successFactors.improvementAreas.map(
                  (improvement, idx) => (
                    <Chip
                      key={idx}
                      label={improvement.area}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  )
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 8. Recommendations Based on Patterns */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InsightIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Pattern-Based Recommendations
              </Typography>
              <Chip
                label={data.recommendations.length}
                size="small"
                color="primary"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {data.recommendations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Continue your job search to generate personalized
                recommendations
              </Typography>
            ) : (
              <List dense>
                {data.recommendations.map((rec, idx) => (
                  <ListItem key={idx} sx={{ display: "block", mb: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {rec.title}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={rec.category}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={rec.priority}
                          size="small"
                          color={
                            rec.priority === "high"
                              ? "error"
                              : rec.priority === "medium"
                              ? "warning"
                              : "default"
                          }
                        />
                      </Stack>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {rec.description}
                    </Typography>
                    <Paper sx={{ mt: 1, p: 1.5, bgcolor: "info.50" }}>
                      <Typography variant="caption" fontWeight={600}>
                        Expected Impact: {rec.expectedImpact}
                      </Typography>
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ mt: 1 }}
                      >
                        Action Steps:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {rec.actionSteps.map((step, i) => (
                          <Typography variant="caption" component="li" key={i}>
                            {step}
                          </Typography>
                        ))}
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 9. Pattern Evolution Tracking */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <EvolutionIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Pattern Evolution & Adaptation
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.patternEvolution.insights}
            </Typography>

            {/* Trends Summary */}
            {data.patternEvolution.trends.successRateTrend && (
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Success Rate Trend
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {data.patternEvolution.trends.successRateTrend}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Confidence Trend
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {data.patternEvolution.trends.confidenceTrend}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Adaptations Made
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {data.patternEvolution.trends.adaptationCount || 0}
                  </Typography>
                </Paper>
              </Stack>
            )}

            {/* Historical Snapshots */}
            {data.patternEvolution.snapshots.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Historical Performance
                </Typography>
                <List dense>
                  {data.patternEvolution.snapshots.map((snapshot, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={snapshot.period}
                        secondary={`Sample: ${snapshot.sampleSize} • Adaptations: ${snapshot.adaptations}`}
                      />
                      <Stack spacing={0.5} sx={{ minWidth: 150 }}>
                        <Typography variant="caption">
                          Success: {(snapshot.successRate * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={snapshot.successRate * 100}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
