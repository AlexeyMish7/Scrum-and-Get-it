/**
 * JOB HISTORY TAB
 * Timeline of status changes and activity for this job.
 */

import { useMemo, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { FiberManualRecord, History } from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { EmptyState, LoadingSpinner } from "@shared/components/feedback";
import { useJobNotesByJobId } from "@shared/cache/coreHooks";

interface JobHistoryTabProps {
  jobId: number;
}

interface HistoryEntry {
  timestamp: string;
  status: string;
  action: string;
}

export default function JobHistoryTab({ jobId }: JobHistoryTabProps) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const notesQuery = useJobNotesByJobId<Record<string, unknown>>(
    user?.id,
    jobId
  );

  const history = useMemo<HistoryEntry[]>(() => {
    const notes = notesQuery.data;
    const first = (Array.isArray(notes) ? notes[0] : null) as Record<
      string,
      unknown
    > | null;
    const raw = first?.["application_history"] ?? null;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry) => {
        const e = entry as Record<string, unknown>;
        const timestamp = String(e["timestamp"] ?? e["changed_at"] ?? "");
        const status = String(e["status"] ?? e["to"] ?? "");
        const action = String(e["action"] ?? e["note"] ?? e["reason"] ?? "");
        if (!timestamp || !status) return null;
        return { timestamp, status, action } as HistoryEntry;
      })
      .filter((x): x is HistoryEntry => Boolean(x));
  }, [notesQuery.data]);

  useEffect(() => {
    if (notesQuery.error) handleError(notesQuery.error);
  }, [notesQuery.error, handleError]);

  if (notesQuery.isLoading) {
    return <LoadingSpinner message="Loading activity history..." />;
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title="No Activity Yet"
        description="Status changes and updates for this job will appear here as you move it through your application pipeline."
      />
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Application Timeline
      </Typography>

      <List>
        {history.map((entry, index) => (
          <Box key={index}>
            <ListItem sx={{ alignItems: "flex-start" }}>
              <Box sx={{ mr: 2, minWidth: 120 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {new Date(entry.timestamp).toLocaleDateString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", mr: 2, mt: 0.5 }}
              >
                <FiberManualRecord
                  sx={{ fontSize: 12, color: "primary.main" }}
                />
              </Box>

              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={entry.status}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                }
                secondary={entry.action}
              />
            </ListItem>
            {index < history.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
    </Paper>
  );
}
