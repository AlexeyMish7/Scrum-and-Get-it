/**
 * DEV LOG PANEL
 *
 * Development-only panel showing both API calls and Supabase database queries.
 * Features tabs to switch between API and DB views for debugging.
 *
 * Usage: Automatically rendered by ApiLogDebugProvider in dev mode.
 */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StorageIcon from "@mui/icons-material/StorageRounded";
import HttpIcon from "@mui/icons-material/Http";
import type { ApiLogEntry, SupabaseLogEntry } from "@shared/types";

const MAX_PREVIEW_LENGTH = 220;

interface DevLogPanelProps {
  apiLogs: ApiLogEntry[];
  supabaseLogs: SupabaseLogEntry[];
  onClearApi: () => void;
  onClearSupabase: () => void;
}

function truncate(text: string, limit = MAX_PREVIEW_LENGTH) {
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}

function getUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Operation color mapping for Supabase queries
function getOperationColor(
  operation: SupabaseLogEntry["operation"]
): "primary" | "success" | "warning" | "error" | "info" | "default" {
  switch (operation) {
    case "SELECT":
      return "primary";
    case "INSERT":
      return "success";
    case "UPDATE":
      return "warning";
    case "DELETE":
      return "error";
    case "RPC":
      return "info";
    case "AUTH":
      return "default";
    case "REALTIME":
      return "info";
    default:
      return "default";
  }
}

export function DevLogPanel({
  apiLogs,
  supabaseLogs,
  onClearApi,
  onClearSupabase,
}: DevLogPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"api" | "supabase">("api");

  // Filter out health checks from API logs
  const visibleApiLogs = useMemo(
    () =>
      apiLogs.filter(
        (log) => !(log.success && log.url.includes("/api/health"))
      ),
    [apiLogs]
  );

  // Filter Supabase logs (exclude realtime heartbeats in production)
  const visibleSupabaseLogs = useMemo(() => supabaseLogs, [supabaseLogs]);

  const apiSummary = useMemo(() => {
    if (!apiLogs.length) return "No API calls";
    const latest = visibleApiLogs[0] ?? apiLogs[0];
    return `${latest.method} ${getUrlLabel(latest.url).slice(0, 25)}`;
  }, [apiLogs, visibleApiLogs]);

  const supabaseSummary = useMemo(() => {
    if (!supabaseLogs.length) return "No DB queries";
    const latest = supabaseLogs[0];
    return `${latest.operation} ${latest.table}`;
  }, [supabaseLogs]);

  if (!import.meta.env.DEV) {
    return null;
  }

  const handleClear = () => {
    if (activeTab === "api") {
      onClearApi();
    } else {
      onClearSupabase();
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: expanded ? 500 : 220,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 1500,
        borderRadius: 2,
        pt: 1,
        pb: expanded ? 1 : 0,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1, pb: 0.5 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            🛠️ Dev Panel
          </Typography>
          <Typography variant="caption" color="text.secondary">
            API: {visibleApiLogs.length} • DB: {visibleSupabaseLogs.length}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small"
            startIcon={<ClearAllIcon fontSize="small" />}
            onClick={handleClear}
            disabled={
              activeTab === "api" ? !apiLogs.length : !supabaseLogs.length
            }
          >
            Clear
          </Button>
          <IconButton
            size="small"
            onClick={() => setExpanded((prev) => !prev)}
            sx={{ ml: 0.5 }}
          >
            {expanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ExpandLessIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>
      </Stack>

      {expanded && (
        <>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ minHeight: 36, px: 1 }}
          >
            <Tab
              value="api"
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <HttpIcon fontSize="small" />
                  <span>API ({visibleApiLogs.length})</span>
                </Stack>
              }
              sx={{ minHeight: 36, py: 0.5 }}
            />
            <Tab
              value="supabase"
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StorageIcon fontSize="small" />
                  <span>Supabase ({visibleSupabaseLogs.length})</span>
                </Stack>
              }
              sx={{ minHeight: 36, py: 0.5 }}
            />
          </Tabs>

          <Divider />

          {/* Content */}
          <Box
            sx={{
              maxHeight: "50vh",
              overflowY: "auto",
              px: 1,
              py: 1,
            }}
          >
            {activeTab === "api" ? (
              // API Logs Tab
              <>
                {!visibleApiLogs.length && (
                  <Typography variant="body2" color="text.secondary">
                    No API calls tracked yet (health checks hidden).
                  </Typography>
                )}
                <Stack spacing={1}>
                  {visibleApiLogs.map((log) => (
                    <Paper
                      key={log.id}
                      variant="outlined"
                      sx={{
                        px: 1,
                        py: 0.75,
                        backgroundColor: "background.paper",
                        borderColor: log.success ? "divider" : "error.main",
                        borderWidth: log.success ? 1 : 2,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: log.success ? "success.main" : "error.main",
                            fontWeight: 600,
                          }}
                        >
                          {log.status ?? (log.success ? "OK" : "ERR")}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.method} {truncate(getUrlLabel(log.url), 50)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(log.durationMs)} ms •{" "}
                        {log.requestBody ? "payload" : "no payload"}
                      </Typography>
                      {log.error && (
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          Error: {log.error}
                        </Typography>
                      )}
                      {log.requestBody && (
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontSize: 11,
                            mt: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          Req: {truncate(log.requestBody, 150)}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </>
            ) : (
              // Supabase Logs Tab
              <>
                {!visibleSupabaseLogs.length && (
                  <Typography variant="body2" color="text.secondary">
                    No Supabase queries tracked yet.
                  </Typography>
                )}
                <Stack spacing={1}>
                  {visibleSupabaseLogs.map((log) => (
                    <Paper
                      key={log.id}
                      variant="outlined"
                      sx={{
                        px: 1,
                        py: 0.75,
                        backgroundColor: "background.paper",
                        borderColor: log.success ? "divider" : "error.main",
                        borderWidth: log.success ? 1 : 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                        <Chip
                          label={log.operation}
                          size="small"
                          color={getOperationColor(log.operation)}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.table}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(log.durationMs)} ms
                        </Typography>
                        {log.rowCount !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            • {log.rowCount} row{log.rowCount !== 1 ? "s" : ""}
                          </Typography>
                        )}
                        {!log.success && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ fontWeight: 600 }}
                          >
                            • FAILED
                          </Typography>
                        )}
                      </Stack>
                      {log.queryParams && (
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontSize: 11,
                            mt: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          {truncate(log.queryParams, 200)}
                        </Typography>
                      )}
                      {log.error && (
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{ mt: 0.5, fontSize: 11 }}
                        >
                          {log.errorCode ? `[${log.errorCode}] ` : ""}
                          {log.error}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
          </Box>

          {/* Footer summary */}
          <Divider />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, py: 0.5, display: "block" }}
          >
            {activeTab === "api" ? apiSummary : supabaseSummary}
          </Typography>
        </>
      )}
    </Paper>
  );
}
