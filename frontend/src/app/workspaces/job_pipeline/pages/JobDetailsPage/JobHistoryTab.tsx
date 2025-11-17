/**
 * JOB HISTORY TAB
 * Timeline of status changes and activity for this job.
 */

import { useState, useEffect } from "react";
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
import { listJobNotes } from "@shared/services/dbMappers";

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadHistory = async () => {
      setLoading(true);
      const result = await listJobNotes(user.id, { eq: { job_id: jobId } });

      if (result.error) {
        handleError(result.error);
        setLoading(false);
        return;
      }

      // Parse application_history from job_notes
      if (result.data && result.data.length > 0) {
        const note = result.data[0] as {
          application_history?: HistoryEntry[];
        };
        if (
          note.application_history &&
          Array.isArray(note.application_history)
        ) {
          setHistory(note.application_history);
        }
      }

      setLoading(false);
    };

    loadHistory();
  }, [user?.id, jobId, handleError]);

  if (loading) {
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
