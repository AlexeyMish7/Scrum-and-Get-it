import { useEffect, useState } from "react";

// EmploymentHistoryList — high-level overview
// - Shows the signed-in user's employment entries using React Query cache.
// - Supports add (dialog), edit (dialog), and delete (confirm then remove).
// - Uses useEmploymentList hook for cached data fetching.
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import { profileKeys } from "@profile/cache";
import employmentService from "../../services/employment";
import { AddEmploymentDialog } from "../../components/dialogs/AddEmploymentDialog";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { Breadcrumbs } from "@shared/components/navigation";
import EmptyState from "@shared/components/feedback/EmptyState";
import { Work as WorkIcon } from "@mui/icons-material";
import type { EmploymentRow } from "../../types/employment";
import { useEmploymentList } from "@profile/cache";

export default function EmploymentHistoryList() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query hook for cached employment data
  const {
    data: entries,
    isLoading: queryLoading,
    isError,
  } = useEmploymentList();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedEntry, setSelectedEntry] = useState<
    EmploymentRow | undefined
  >();

  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();
  const { markProfileChanged } = useProfileChange();
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const location = useLocation();

  // Show error notification when query fails
  useEffect(() => {
    if (isError) {
      handleError("Failed to load employment data. Please try again.");
    }
  }, [isError, handleError]);

  // If we were navigated here with a success message in location.state, show
  // a centralized snackbar and then clear the state so it doesn't show again.
  useEffect(() => {
    const maybeState = location.state as { success?: string } | null;
    if (maybeState && maybeState.success) {
      showSuccess(maybeState.success);
      // Replace the history entry so the state is cleared
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, showSuccess]);

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setSelectedEntry(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (entry: EmploymentRow) => {
    setDialogMode("edit");
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEntry(undefined);
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  const handleDelete = async (entryId: string) => {
    // Confirm deletion with user using hook-based dialog
    const confirmed = await confirm({
      title: "Delete employment entry?",
      message: "This will permanently delete the selected employment entry.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;

    if (!user) {
      handleError("Please sign in to delete entries.");
      return;
    }

    try {
      const res = await employmentService.deleteEmployment(user.id, entryId);
      if (res.error) {
        console.error(res.error);
        handleError(res.error);
      } else {
        // Invalidate React Query cache so all components get fresh data
        await queryClient.invalidateQueries({
          queryKey: profileKeys.employment(user.id),
        });
        markProfileChanged(); // Invalidate analytics cache
        navigate(location.pathname, {
          replace: true,
          state: { success: "Employment entry deleted successfully!" },
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
      handleError(e);
    }
  };

  if (queryLoading || authLoading) return <LoadingSpinner />;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Breadcrumbs
        items={[
          { label: "Profile", path: "/profile" },
          { label: "Employment" },
        ]}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Employment History</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenAddDialog}
        >
          Add Employment
        </Button>
      </Box>

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon={<WorkIcon />}
          title="No employment entries yet"
          description="Click 'Add Employment' to start building your work history"
          action={
            <Button variant="contained" onClick={handleOpenAddDialog}>
              Add Employment
            </Button>
          }
        />
      )}

      <Stack spacing={2} mt={2}>
        {(entries ?? []).map((entry) => (
          <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6">
                  {entry.job_title} @ {entry.company_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.location} •{" "}
                  {entry.current_position
                    ? "Present"
                    : `${entry.start_date} – ${entry.end_date}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => handleOpenEditDialog(entry)}
                >
                  Edit
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleDelete(entry.id)}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            {entry.job_description && (
              <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                Job Description: {entry.job_description}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Add/Edit Dialog */}
      <AddEmploymentDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleDialogSuccess}
        mode={dialogMode}
        existingEntry={selectedEntry}
      />

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
}
