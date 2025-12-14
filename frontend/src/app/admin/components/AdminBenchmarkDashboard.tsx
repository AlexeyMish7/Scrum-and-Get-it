/**
 * Admin Benchmark Dashboard
 *
 * Purpose: Allow admins to compute and monitor peer benchmarks
 * Displays benchmark coverage, sample sizes, and data quality
 * Provides button to trigger computation
 */

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { useAuth } from "@shared/context/AuthContext";
import { toApiUrl } from "@shared/services/apiUrl";

interface BenchmarkMetrics {
  applicationsPerMonth: number | null;
  responseRate: number | null;
  interviewRate: number | null;
  offerRate: number | null;
}

interface Benchmark {
  industry: string;
  experienceLevel: string;
  sampleSize: number;
  dataQuality: number;
  lastComputed: string;
  metrics: BenchmarkMetrics;
}

interface StatusResponse {
  success: boolean;
  status: {
    totalBenchmarks: number;
    totalSegments: number;
    coveragePercentage: number;
    totalSampleSize: number;
    avgSampleSize: number;
    highQualityBenchmarks: number;
    uncoveredSegments: Array<{ industry: string; experience_level: string }>;
  };
  benchmarks: Benchmark[];
}

export function AdminBenchmarkDashboard() {
  const { session } = useAuth();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Fetch benchmark status
   */
  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(toApiUrl("/api/admin/benchmark-status"), {
        method: "GET",
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data: StatusResponse = await response.json();
      setStatus(data);
    } catch (err) {
      console.error("Error fetching benchmark status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger benchmark computation
   */
  const computeBenchmarks = async () => {
    setComputing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(toApiUrl("/api/admin/compute-benchmarks"), {
        method: "POST",
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to compute: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(`Computed ${data.totalSegments} peer benchmark segments`);
        // Refresh status after computation
        await fetchStatus();
      } else {
        throw new Error(data.error || "Computation failed");
      }
    } catch (err) {
      console.error("Error computing benchmarks:", err);
      setError(
        err instanceof Error ? err.message : "Failed to compute benchmarks"
      );
    } finally {
      setComputing(false);
    }
  };

  /**
   * Get quality color based on score
   */
  const getQualityColor = (score: number): "success" | "warning" | "error" => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    return "error";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Peer Benchmark Administration
      </Typography>

      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={
            computing ? <CircularProgress size={20} /> : <RefreshIcon />
          }
          onClick={computeBenchmarks}
          disabled={computing}
        >
          {computing ? "Computing..." : "Compute Benchmarks"}
        </Button>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchStatus}
          disabled={loading}
        >
          Refresh Status
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {status && (
        <>
          {/* Overview Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Coverage
                </Typography>
                <Typography variant="h4">
                  {status.status.coveragePercentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  {status.status.totalBenchmarks} /{" "}
                  {status.status.totalSegments} segments
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={status.status.coveragePercentage}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Sample Size
                </Typography>
                <Typography variant="h4">
                  {status.status.totalSampleSize.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Avg: {status.status.avgSampleSize} users/segment
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  High Quality
                </Typography>
                <Typography variant="h4">
                  {status.status.highQualityBenchmarks}
                </Typography>
                <Typography variant="body2">
                  Benchmarks with quality ≥ 0.8
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Uncovered Segments
                </Typography>
                <Typography variant="h4">
                  {status.status.uncoveredSegments.length}
                </Typography>
                <Typography variant="body2">Need more users (min 5)</Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Benchmark Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Benchmark Details
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Industry</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell align="right">Sample Size</TableCell>
                    <TableCell align="center">Quality</TableCell>
                    <TableCell align="right">Apps/Month</TableCell>
                    <TableCell align="right">Response Rate</TableCell>
                    <TableCell align="right">Interview Rate</TableCell>
                    <TableCell align="right">Offer Rate</TableCell>
                    <TableCell>Last Computed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {status.benchmarks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No benchmarks computed yet. Click "Compute Benchmarks"
                          to start.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    status.benchmarks.map((benchmark, index) => (
                      <TableRow key={index}>
                        <TableCell>{benchmark.industry}</TableCell>
                        <TableCell>{benchmark.experienceLevel}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={benchmark.sampleSize}
                            size="small"
                            icon={
                              benchmark.sampleSize >= 20 ? (
                                <CheckCircleIcon />
                              ) : (
                                <WarningIcon />
                              )
                            }
                            color={
                              benchmark.sampleSize >= 20 ? "success" : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={benchmark.dataQuality.toFixed(2)}
                            size="small"
                            color={getQualityColor(benchmark.dataQuality)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {benchmark.metrics.applicationsPerMonth?.toFixed(1) ??
                            "—"}
                        </TableCell>
                        <TableCell align="right">
                          {benchmark.metrics.responseRate
                            ? `${(benchmark.metrics.responseRate * 100).toFixed(
                                1
                              )}%`
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {benchmark.metrics.interviewRate
                            ? `${(
                                benchmark.metrics.interviewRate * 100
                              ).toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {benchmark.metrics.offerRate
                            ? `${(benchmark.metrics.offerRate * 100).toFixed(
                                1
                              )}%`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(benchmark.lastComputed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Uncovered Segments */}
          {status.status.uncoveredSegments.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uncovered Segments (Need More Users)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {status.status.uncoveredSegments.map((segment, index) => (
                    <Chip
                      key={index}
                      label={`${segment.industry} - ${segment.experience_level}`}
                      variant="outlined"
                      icon={<WarningIcon />}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!status && !loading && (
        <Alert severity="info">
          Click "Refresh Status" to view current benchmark coverage
        </Alert>
      )}
    </Box>
  );
}
