import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { Breadcrumbs } from "@shared/components/navigation";
import EmptyState from "@shared/components/feedback/EmptyState";
import { School as SchoolIcon, Edit as EditIcon } from "@mui/icons-material";
import type { EducationEntry } from "../../types/education";
import { AddEducationDialog } from "../../components/dialogs/AddEducationDialog";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { Add } from "@mui/icons-material";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { parseMonthToMs } from "@shared/utils/dateUtils";
import { useEducationList } from "@profile/cache";

/*
  EducationOverview
  - Shows the user's education timeline as a vertical, alternating list.
  - Uses React Query via useEducationList hook for cached data fetching.
  - Uses centralized error handling and theme button variants for consistency.
  - Contains small dialogs for editing and confirming deletes.
*/

const EducationOverview: React.FC = () => {
  const { loading: authLoading } = useAuth();

  // Use React Query hook for cached education data
  const {
    data: educationData,
    isLoading: queryLoading,
    isError,
    refetch,
  } = useEducationList();

  // Centralized error handling
  const { notification, closeNotification, handleError } = useErrorHandler();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedEntry, setSelectedEntry] = useState<
    EducationEntry | undefined
  >();

  // Use shared date utility to convert YYYY-MM strings to milliseconds
  const dateToMs = (s?: string | undefined) => parseMonthToMs(s ?? undefined);

  // Sort education entries by start date (most recent first)
  const education = useMemo(() => {
    const entries = educationData ?? [];
    return [...entries].sort(
      (a, b) => dateToMs(b.startDate) - dateToMs(a.startDate)
    );
  }, [educationData]);

  // Show error notification when query fails
  useEffect(() => {
    if (isError) {
      handleError("Failed to load education data. Please try again.");
    }
  }, [isError, handleError]);

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setSelectedEntry(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (entry: EducationEntry) => {
    setDialogMode("edit");
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEntry(undefined);
  };

  const handleDialogSuccess = () => {
    // Refetch education data after successful add/edit
    refetch();
  };

  if (queryLoading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Breadcrumbs
        items={[{ label: "Profile", path: "/profile" }, { label: "Education" }]}
      />
      {/* Header Section
      - Title and short description on the left
      - Primary action (Add Education) on the right
      The header is intentionally compact so it visually connects to the timeline below.
    */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Education Timeline
          </Typography>
          <Typography variant="body1">
            Track your academic journey and achievements
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleOpenAddDialog}
            size="medium"
          >
            Add Education
          </Button>
        </Box>
      </Box>

      {/* Content Section
      - Centered timeline area. Each entry is a card placed on alternating sides.
      - We render a friendly empty state when there are no entries.
    */}
      <Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Timeline position="alternate">
            {education.length === 0 ? (
              <TimelineItem>
                <TimelineOppositeContent />
                <TimelineSeparator>
                  <TimelineDot color="grey" />
                </TimelineSeparator>
                <TimelineContent>
                  <EmptyState
                    icon={<SchoolIcon />}
                    title="No education entries yet"
                    description="Click 'Add Education' to get started building your academic profile"
                  />
                </TimelineContent>
              </TimelineItem>
            ) : (
              education.map((edu, index) => {
                const ongoing = edu.active || !edu.endDate;
                const startYear = edu.startDate?.substring(0, 4) || "";
                const endYear = ongoing
                  ? "Present"
                  : edu.endDate?.substring(0, 4) || "";

                // Each timeline item shows dates on the side, a dot/connector,
                // and a white card with the education details and action buttons.
                return (
                  <TimelineItem key={edu.id}>
                    <TimelineOppositeContent>
                      <Typography variant="body2">
                        {startYear}
                        {endYear && ` - ${endYear}`}
                      </Typography>
                      {ongoing && (
                        <Typography variant="caption">Current</Typography>
                      )}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      {/* Dot for each entry */}
                      <TimelineDot color={ongoing ? "primary" : "secondary"} />
                      {index < education.length - 1 && (
                        /* Connector between timeline dots; shown for all but last item */
                        <TimelineConnector />
                      )}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        {/* Honors chip */}
                        {edu.honors && (
                          <Chip
                            label={edu.honors}
                            size="small"
                            avatar={
                              <Avatar
                                sx={{
                                  width: 18,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              >
                                🏆
                              </Avatar>
                            }
                          />
                        )}

                        {/* Main content with improved hierarchy */}
                        <Typography variant="h6">{edu.degree}</Typography>

                        <Typography variant="subtitle1">
                          {edu.institution}
                        </Typography>

                        <Typography variant="body2">
                          {edu.fieldOfStudy}
                        </Typography>

                        {/* GPA with better styling */}
                        {edu.gpa !== undefined && !edu.gpaPrivate && (
                          <Typography variant="body2">
                            GPA: {edu.gpa}
                          </Typography>
                        )}

                        {/* Action buttons: Edit opens the dialog */}
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(edu)}
                            sx={{ ml: "auto" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                );
              })
            )}
          </Timeline>
        </Paper>
      </Box>

      {/* Error Handling: shared snackbar used across pages */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />

      {/* Add/Edit Dialog */}
      <AddEducationDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleDialogSuccess}
        mode={dialogMode}
        existingEntry={selectedEntry}
      />
    </Box>
  );
};

export default EducationOverview;
