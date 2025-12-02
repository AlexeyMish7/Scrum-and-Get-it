/**
 * ApplicationAnalyticsCard
 *
 * Analyzes application success across multiple dimensions:
 * - Success rates by industry, company size, role type
 * - Performance across application methods and sources
 * - Patterns in successful vs rejected applications
 * - Correlation between application materials and response rates
 * - Impact of resume/cover letter customization
 * - Timing patterns for optimal submission
 * - Statistical significance testing
 * - Recommendations for improvement
 */

import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Grid,
  Tooltip,
  LinearProgress,
  Stack,
  Button,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  InfoOutlined as InfoIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import type { JobRecord } from "../../../pages/AnalyticsPage/analyticsHelpers";
import {
  computeSuccessByCompanySize,
  computeSuccessByRoleType,
  computeSuccessByApplicationMethod,
  computeApplicationMaterialImpact,
  computeTimingPatterns,
  computeCustomizationImpact,
  computePatternAnalysis,
  computeStatisticalSignificance,
  generateApplicationRecommendations,
  type ApplicationAnalysis,
  type SuccessPattern,
  type StatisticalTest,
} from "../../../pages/AnalyticsPage/applicationAnalyticsHelpers";

interface ApplicationAnalyticsCardProps {
  jobs: JobRecord[];
}

export default function ApplicationAnalyticsCard({
  jobs,
}: ApplicationAnalyticsCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "overview"
  );

  // Compute all analyses
  const byCompanySize = useMemo(
    () => computeSuccessByCompanySize(jobs),
    [jobs]
  );
  const byRoleType = useMemo(() => computeSuccessByRoleType(jobs), [jobs]);
  const byMethod = useMemo(
    () => computeSuccessByApplicationMethod(jobs),
    [jobs]
  );
  const materialImpact = useMemo(
    () => computeApplicationMaterialImpact(jobs),
    [jobs]
  );
  const timingPatterns = useMemo(() => computeTimingPatterns(jobs), [jobs]);
  const customizationImpact = useMemo(
    () => computeCustomizationImpact(jobs),
    [jobs]
  );
  const patterns = useMemo(() => computePatternAnalysis(jobs), [jobs]);
  const significance = useMemo(
    () => computeStatisticalSignificance(jobs),
    [jobs]
  );
  const recommendations = useMemo(
    () => generateApplicationRecommendations(jobs, patterns),
    [jobs, patterns]
  );

  // Helper: get color for success rate
  const getSuccessColor = (rate: number) => {
    if (rate >= 0.15) return "success.main";
    if (rate >= 0.1) return "warning.main";
    return "error.main";
  };

  // Helper: get significance indicator
  const getSignificanceChip = (pValue: number) => {
    if (pValue < 0.01) return { label: "Highly Significant (p<0.01)", color: "success" as const };
    if (pValue < 0.05) return { label: "Significant (p<0.05)", color: "info" as const };
    return { label: "Not Significant (p≥0.05)", color: "default" as const };
  };

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <BarChartIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          Application Success Analytics
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Overview Cards */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "background.default",
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {patterns.successfulApplications.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Successful Applications
              </Typography>
            </Box>
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "background.default",
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Typography variant="h6" color="error.main" fontWeight={700}>
                {patterns.rejectedApplications.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rejected Applications
              </Typography>
            </Box>
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "background.default",
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                color={getSuccessColor(patterns.overallSuccessRate)}
                fontWeight={700}
              >
                {(patterns.overallSuccessRate * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Success Rate
              </Typography>
            </Box>
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "background.default",
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Typography variant="h6" color="info.main" fontWeight={700}>
                {patterns.pendingApplications.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending Applications
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Success by Industry */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(
              expandedSection === "industry" ? null : "industry"
            )
          }
        >
          ✓ Success Rates by Industry
        </Typography>
        {expandedSection === "industry" && (
          <Table size="small">
            <TableBody>
              {byCompanySize.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>{item.key}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={`${item.offers} of ${item.total} succeeded`}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, item.rate * 100 * 5)}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 50 }}>
                          {(item.rate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {byCompanySize.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: "center" }}>
                    No data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Success by Role Type */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "roles" ? null : "roles")
          }
        >
          ✓ Success Rates by Role Type
        </Typography>
        {expandedSection === "roles" && (
          <Table size="small">
            <TableBody>
              {byRoleType.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>{item.key}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={`${item.offers} of ${item.total} succeeded`}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, item.rate * 100 * 5)}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 50 }}>
                          {(item.rate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {byRoleType.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: "center" }}>
                    No data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Application Method Performance */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "method" ? null : "method")
          }
        >
          ✓ Performance by Application Method
        </Typography>
        {expandedSection === "method" && (
          <Table size="small">
            <TableBody>
              {byMethod.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>{item.key}</TableCell>
                  <TableCell align="right">
                    {(item.responseRate * 100).toFixed(1)}% response rate
                  </TableCell>
                  <TableCell align="right">
                    {(item.successRate * 100).toFixed(1)}% success rate
                  </TableCell>
                </TableRow>
              ))}
              {byMethod.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center" }}>
                    No data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Material Impact Analysis */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "materials" ? null : "materials")
          }
        >
          ✓ Application Materials Impact
        </Typography>
        {expandedSection === "materials" && (
          <Stack spacing={1}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  With Cover Letter:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {(materialImpact.withCoverLetter * 100).toFixed(1)}%
                  </span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {
                    jobs.filter(
                      (j) =>
                        (j.job_status ?? "").toLowerCase() !== "interested"
                    ).length
                  }{" "}
                  applied
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, materialImpact.withCoverLetter * 100 * 5)}
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  Without Cover Letter:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {(materialImpact.withoutCoverLetter * 100).toFixed(1)}%
                  </span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  baseline
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, materialImpact.withoutCoverLetter * 100 * 5)}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Impact: {((materialImpact.withCoverLetter - materialImpact.withoutCoverLetter) * 100).toFixed(1)}% improvement
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Customization Impact */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "custom" ? null : "custom")
          }
        >
          ✓ Customization Impact
        </Typography>
        {expandedSection === "custom" && (
          <Stack spacing={1}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  Highly Customized:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {(customizationImpact.highlyCustomized * 100).toFixed(1)}%
                  </span>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, customizationImpact.highlyCustomized * 100 * 5)}
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  Partially Customized:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {(customizationImpact.partiallyCustomized * 100).toFixed(1)}%
                  </span>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, customizationImpact.partiallyCustomized * 100 * 5)}
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  Generic Applications:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {(customizationImpact.generic * 100).toFixed(1)}%
                  </span>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, customizationImpact.generic * 100 * 5)}
              />
            </Box>
          </Stack>
        )}
      </Box>

      {/* Timing Patterns */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "timing" ? null : "timing")
          }
        >
          ✓ Optimal Submission Timing
        </Typography>
        {expandedSection === "timing" && (
          <Table size="small">
            <TableBody>
              {timingPatterns.map((item) => (
                <TableRow key={item.dayOfWeek}>
                  <TableCell>{item.dayOfWeek}</TableCell>
                  <TableCell align="right">
                    {(item.successRate * 100).toFixed(1)}% success rate
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {item.count} applications
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Statistical Significance Tests */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "stats" ? null : "stats")
          }
        >
          📊 Statistical Significance
        </Typography>
        {expandedSection === "stats" && (
          <Stack spacing={1}>
            {significance.map((test) => (
              <Box
                key={test.name}
                sx={{
                  p: 1.5,
                  bgcolor: "background.default",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {test.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={getSignificanceChip(test.pValue).label}
                    color={getSignificanceChip(test.pValue).color}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  p-value: {test.pValue.toFixed(4)}
                </Typography>
                {test.effectSize !== undefined && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Effect size: {test.effectSize.toFixed(2)}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Pattern Identification */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "patterns" ? null : "patterns")
          }
        >
          🔍 Identified Patterns
        </Typography>
        {expandedSection === "patterns" && (
          <Stack spacing={1}>
            {patterns.identifiedPatterns.map((pattern, i) => (
              <Box
                key={i}
                sx={{
                  p: 1,
                  bgcolor: pattern.impact === "positive" ? "success.50" : "warning.50",
                  borderLeft: `3px solid ${
                    pattern.impact === "positive" ? "#2e7d32" : "#f57c00"
                  }`,
                  borderRadius: 0.5,
                }}
              >
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                  {pattern.impact === "positive" ? (
                    <CheckCircleIcon fontSize="small" sx={{ color: "success.main", mt: 0.5 }} />
                  ) : (
                    <InfoIcon fontSize="small" sx={{ color: "warning.main", mt: 0.5 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {pattern.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pattern.description}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Recommendations */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() =>
            setExpandedSection(expandedSection === "recommendations" ? null : "recommendations")
          }
        >
          💡 Recommendations
        </Typography>
        {expandedSection === "recommendations" && (
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {recommendations.map((rec, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {rec}
                </Typography>
              </li>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
