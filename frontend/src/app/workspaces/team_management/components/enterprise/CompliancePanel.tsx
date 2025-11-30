/**
 * CompliancePanel.tsx
 *
 * Component for viewing and managing compliance logs in enterprise career services.
 * Displays compliance summary and recent events from the team.
 */

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEnterprise } from "../../hooks/useEnterprise";
import type { ComplianceEventType } from "../../types/enterprise.types";

interface CompliancePanelProps {
  teamId: string;
}

// Color map for different compliance event types
const eventTypeColors: Record<
  ComplianceEventType,
  "info" | "warning" | "error" | "success" | "default"
> = {
  user_data_access: "info",
  user_data_export: "info",
  user_data_delete: "error",
  settings_change: "default",
  role_change: "warning",
  bulk_operation: "warning",
  integration_access: "info",
  report_generated: "success",
  login_attempt: "default",
  permission_change: "warning",
};

export const CompliancePanel = ({ teamId }: CompliancePanelProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<ComplianceEventType | "all">(
    "all"
  );

  // Use complianceSummary instead of complianceLogs - this is what the hook provides
  const { complianceSummary, loadingCompliance, error, refreshCompliance } =
    useEnterprise(teamId);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    if (!complianceSummary) return;
    const csvContent = Object.entries(complianceSummary.events_by_type)
      .map(([type, count]) => `${type},${count}`)
      .join("\n");
    const blob = new Blob([`Event Type,Count\n${csvContent}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance_summary_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingCompliance) {
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

  // Format the event type breakdown for display
  const eventBreakdown = complianceSummary?.events_by_type
    ? Object.entries(complianceSummary.events_by_type)
    : [];

  // Filter based on search and event type
  const filteredEvents = eventBreakdown.filter(([type]) => {
    const matchesSearch =
      searchQuery === "" ||
      type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = eventFilter === "all" || type === eventFilter;
    return matchesSearch && matchesFilter;
  });

  const paginatedEvents = filteredEvents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">
          <SecurityIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Compliance & Audit Summary
        </Typography>
        <Box>
          <Tooltip title="Refresh compliance data">
            <IconButton onClick={() => refreshCompliance()} sx={{ mr: 1 }}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export summary as CSV">
            <IconButton onClick={handleExport} disabled={!complianceSummary}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Events
              </Typography>
              <Typography variant="h4">
                {complianceSummary?.total_events ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Data Access Events
              </Typography>
              <Typography variant="h4">
                {complianceSummary?.data_access_events ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Settings Changes
              </Typography>
              <Typography variant="h4">
                {complianceSummary?.settings_changes ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Export Events
              </Typography>
              <Typography variant="h4">
                {complianceSummary?.export_events ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search event types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventFilter}
              label="Event Type"
              onChange={(e) =>
                setEventFilter(e.target.value as ComplianceEventType | "all")
              }
            >
              <MenuItem value="all">All Event Types</MenuItem>
              <MenuItem value="user_data_access">User Data Access</MenuItem>
              <MenuItem value="user_data_export">User Data Export</MenuItem>
              <MenuItem value="user_data_delete">User Data Delete</MenuItem>
              <MenuItem value="settings_change">Settings Change</MenuItem>
              <MenuItem value="role_change">Role Change</MenuItem>
              <MenuItem value="bulk_operation">Bulk Operation</MenuItem>
              <MenuItem value="integration_access">Integration Access</MenuItem>
              <MenuItem value="report_generated">Report Generated</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Box py={4}>
                    <Typography color="text.secondary">
                      {searchQuery || eventFilter !== "all"
                        ? "No events match your filters"
                        : "No compliance events recorded in this period"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEvents.map(([eventType, count]) => (
                <TableRow key={eventType} hover>
                  <TableCell>
                    <Chip
                      label={eventType.replace(/_/g, " ")}
                      color={
                        eventTypeColors[eventType as ComplianceEventType] ||
                        "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {count}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {complianceSummary && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: "info.light" }}>
          <Typography variant="subtitle1" gutterBottom>
            Report Period
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This summary covers the period from{" "}
            {new Date(complianceSummary.period_start).toLocaleDateString()} to{" "}
            {new Date(complianceSummary.period_end).toLocaleDateString()}.
            Compliance logs are retained for 7 years in accordance with
            regulatory requirements.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CompliancePanel;
