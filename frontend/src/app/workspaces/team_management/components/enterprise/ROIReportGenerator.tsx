/**
 * ROIReportGenerator.tsx
 *
 * Component for generating and viewing ROI reports in enterprise career services.
 */

import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import { useEnterprise } from "../../hooks/useEnterprise";
import type { ROIReportRow } from "../../types/enterprise.types";

interface ROIReportGeneratorProps {
  teamId: string;
  cohortId?: string;
}

export const ROIReportGenerator = ({
  teamId,
  cohortId,
}: ROIReportGeneratorProps) => {
  const {
    roiReports,
    roiLoading,
    roiError,
    generateROIReport,
    refreshROIReports,
  } = useEnterprise(teamId);

  const filteredReports = cohortId
    ? roiReports.filter((r) => r.cohort_id === cohortId)
    : roiReports;
  const latestReport = filteredReports.length > 0 ? filteredReports[0] : null;

  const handleGenerateReport = async () => {
    await generateROIReport(cohortId);
    refreshROIReports();
  };

  const handleExportCSV = (report: ROIReportRow) => {
    const data = report.metrics_breakdown as Record<string, unknown>;
    const csvContent = Object.entries(data)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");
    const blob = new Blob([`Metric,Value\n${csvContent}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roi_report_${report.period_start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseReportData = (report: ROIReportRow) => {
    // Use direct fields from ROIReportRow instead of nested report_data
    return {
      totalPlacements: report.total_placements || 0,
      avgTimeToHire: report.payback_period_months || 0,
      estimatedSalaryValue: report.total_salary_value || 0,
      costPerPlacement: report.cost_per_placement || 0,
      programCost: report.total_program_cost || 0,
      roi: report.roi_percentage || 0,
    };
  };

  if (roiLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">
          <AttachMoneyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          ROI Reports
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshROIReports()}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<TrendingUpIcon />}
            onClick={handleGenerateReport}
          >
            Generate New Report
          </Button>
        </Box>
      </Box>

      {roiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {roiError}
        </Alert>
      )}

      {latestReport && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            Latest Report Summary - {latestReport.period_start} to{" "}
            {latestReport.period_end}
          </Typography>
          <Grid container spacing={3}>
            {(() => {
              const data = parseReportData(latestReport);
              return (
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <SchoolIcon color="primary" sx={{ mr: 1 }} />
                          <Typography color="text.secondary" variant="body2">
                            Total Placements
                          </Typography>
                        </Box>
                        <Typography variant="h4">
                          {data.totalPlacements}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <AccessTimeIcon color="info" sx={{ mr: 1 }} />
                          <Typography color="text.secondary" variant="body2">
                            Avg Time to Hire
                          </Typography>
                        </Box>
                        <Typography variant="h4">
                          {data.avgTimeToHire} days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                          <Typography color="text.secondary" variant="body2">
                            Salary Value Generated
                          </Typography>
                        </Box>
                        <Typography variant="h4">
                          ${data.estimatedSalaryValue.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ bgcolor: "success.light" }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <TrendingUpIcon
                            sx={{ mr: 1, color: "success.dark" }}
                          />
                          <Typography color="success.dark" variant="body2">
                            ROI
                          </Typography>
                        </Box>
                        <Typography variant="h4" color="success.dark">
                          {data.roi}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              );
            })()}
          </Grid>
        </Box>
      )}

      <Paper>
        <Box p={2}>
          <Typography variant="subtitle1">Report History</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Generated</TableCell>
                <TableCell>Placements</TableCell>
                <TableCell>ROI</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <Typography color="text.secondary" gutterBottom>
                        No ROI reports generated yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<TrendingUpIcon />}
                        onClick={handleGenerateReport}
                      >
                        Generate Your First Report
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => {
                  const data = parseReportData(report);
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {report.period_start} - {report.period_end}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{data.totalPlacements}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${data.roi}%`}
                          color={data.roi > 100 ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={
                            report.status === "published"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleExportCSV(report)}
                        >
                          Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: "info.light" }}>
        <Typography variant="subtitle1" gutterBottom>
          Understanding Your ROI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ROI is calculated based on the estimated salary value of placements
          divided by the program cost. A ROI of 100% means the program generated
          value equal to its cost.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ROIReportGenerator;
