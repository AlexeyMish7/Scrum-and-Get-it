import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ApiLogEntry } from "@shared/types";

const MAX_PREVIEW_LENGTH = 220;

interface ApiLogPanelProps {
  logs: ApiLogEntry[];
  onClear: () => void;
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

export function ApiLogPanel({ logs, onClear }: ApiLogPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const visibleLogs = useMemo(
    () =>
      logs.filter((log) => !(log.success && log.url.includes("/api/health"))),
    [logs]
  );

  const summary = useMemo(() => {
    if (!logs.length) return "No API calls yet";
    const latest = visibleLogs[0] ?? logs[0];
    return `${latest.method} ${getUrlLabel(latest.url)}`;
  }, [logs, visibleLogs]);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: expanded ? 460 : 200,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 1500,
        borderRadius: 2,
        pt: 1,
        pb: expanded ? 1 : 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1, pb: 0.5 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            API Log
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visibleLogs.length} entries
            {logs.length > visibleLogs.length
              ? ` (${logs.length - visibleLogs.length} hidden)`
              : ""}
            • {summary}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small"
            startIcon={<ClearAllIcon fontSize="small" />}
            onClick={onClear}
            disabled={!logs.length}
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
          <Divider />
          <Box
            sx={{
              maxHeight: "60vh",
              overflowY: "auto",
              px: 1,
              py: 1,
            }}
          >
            {!visibleLogs.length && (
              <Typography variant="body2" color="text.secondary">
                No API calls tracked yet (health checks are hidden).
              </Typography>
            )}
            <Stack spacing={1}>
              {visibleLogs.map((log) => (
                <Paper
                  key={log.id}
                  variant="outlined"
                  sx={{
                    px: 1,
                    py: 0.75,
                    backgroundColor: "background.paper",
                    borderColor: "divider",
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
                    <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
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
                        fontSize: 12,
                        mt: 0.5,
                      }}
                    >
                      Request: {truncate(log.requestBody)}
                    </Typography>
                  )}
                  {log.responseBody && (
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        fontSize: 12,
                        mt: 0.5,
                      }}
                    >
                      Response: {truncate(log.responseBody)}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Paper>
  );
}
