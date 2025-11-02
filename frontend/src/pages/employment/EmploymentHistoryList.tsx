import { useEffect, useState, useCallback, useRef } from "react";
/*
  EmploymentHistoryList
  ---------------------
  Responsibilities and user-facing behavior:
  - Displays the current user's employment history as a list of entries.
  - Allows the user to add a new employment entry (navigates to the Add form).
  - Allows editing an entry via a modal (EditEmploymentModal).
  - Allows deleting an entry with a confirmation dialog.

  UX and implementation notes (non-technical):
  - We try to avoid visual "flicker" by only showing a loading spinner when
    loading lasts longer than a short delay. That keeps the page from looking
    like it reloads briefly on fast networks.
  - All CRUD success messages are shown centrally on this page via navigation
    state (so users see success messages in a consistent place after add/edit/delete).
  - The list is refreshed after edits/deletions so the UI always reflects the
    latest database state.
*/
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import employmentService from "../../services/employment";
import EditEmploymentModal from "./EditEmploymentModal";
import { Button, Typography } from "@mui/material";
import "./employment.css";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ErrorSnackbar } from "../../components/common/ErrorSnackbar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { EmploymentRow } from "../../types/employment";

export default function EmploymentHistoryList() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<EmploymentRow[] | null>(null);
  // Start false to avoid a visible flash on quick loads; we show the spinner only
  // if loading lasts longer than spinnerDelayMs.
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EmploymentRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchEntries = useCallback(async () => {
    // Fetch the user's employment rows from the backend and update state.
    // - Avoid fetching while auth is still initializing.
    // - Show a delayed spinner (small UX tweak) to prevent brief flashes.
    // - On error, surface it via centralized error handler.
    // The function is memoized so it can be safely referenced in effects.
    // If you change dependencies, double-check the useEffect that triggers it.
    // If auth is still initializing, don't trigger a fetch yet.
    if (loading) {
      // ensure a spinner appears if auth loading takes noticeable time
      setIsLoading(true);
      return;
    }
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    // Small UX tweak: avoid showing the loading spinner for very short loads
    // to prevent layout flicker. Use a delayed spinner toggle.
    const spinnerDelayMs = 120;
    const spinnerTimer = setTimeout(() => setIsLoading(true), spinnerDelayMs);
    try {
      // clear any prior early-loading flag if auth finished quickly
      // (we'll clear in finally)
      const res = await employmentService.listEmployment(user.id);

      if (res.error) {
        console.error("fetchEntries error:", res.error);
        handleError(res.error);
        setEntries([]);
      } else {
        const rows = (res.data ?? []) as EmploymentRow[];
        setEntries(rows);
      }
    } catch (e) {
      console.error("Unexpected fetchEntries error", e);
      setEntries([]);
    } finally {
      clearTimeout(spinnerTimer);
      setIsLoading(false);
    }
  }, [user, loading, handleError]);
  // Include handleError in dependencies to avoid stale reference

  // Only refetch when the authenticated user changes (or when auth finishes).
  // Track the previous user id so we don't refetch multiple times during
  // quick mount/auth transitions which can make the page feel like it reloads.
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;

    const currentUserId = user?.id ?? null;
    // If user became null, clear entries and spinner.
    if (!currentUserId) {
      prevUserIdRef.current = null;
      setEntries([]);
      setIsLoading(false);
      return;
    }

    // If the user id hasn't changed since last fetch, skip refetching.
    if (prevUserIdRef.current === currentUserId) return;
    prevUserIdRef.current = currentUserId;

    void fetchEntries();
  }, [user?.id, loading, fetchEntries]);

  // If we were navigated here with a success message in location.state, show
  // a centralized snackbar and then clear the state so it doesn't show again.
  useEffect(() => {
    const maybeState = location.state as { success?: string } | null;
    if (maybeState && maybeState.success) {
      showSuccess(maybeState.success);
      // Replace the history entry so the state is cleared
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Only run on mount/navigation changes
  }, [location, navigate, showSuccess]);

  if (isLoading || loading) return <LoadingSpinner />;

  const handleDelete = async (entryId: string) => {
    // Open confirmation dialog to confirm a destructive delete action.
    // We don't delete immediately; user must confirm in the dialog.
    setPendingDeleteId(entryId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId;
    setConfirmOpen(false);
    setPendingDeleteId(null);
    if (!id) return;
    if (!user) {
      handleError("Please sign in to delete entries.");
      return;
    }

    try {
      const res = await employmentService.deleteEmployment(user.id, id);
      if (res.error) {
        console.error(res.error);
        handleError(res.error);
      } else {
        // After a successful deletion, refresh the list so the UI reflects
        // the backend state. Then set navigation state so the list page shows
        // a centralized success snackbar (consistent notification UX).
        await fetchEntries();
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

  return (
    <div className="employment-container">
      {/* ✅ Add Employment button top-left */}
      <div className="employment-top">
        <Button
          className="glossy-btn"
          variant="contained"
          color="primary"
          onClick={() => navigate("/add-employment")}
        >
          Add Employment
        </Button>
      </div>

      <Typography variant="h2" className="employment-title glossy-title">
        Employment History
      </Typography>

      {entries !== null && entries.length === 0 && (
        <Typography variant="body1">No employment entries yet.</Typography>
      )}

      <ul className="employment-list">
        {(entries ?? []).map((entry) => (
          <li key={entry.id} className="employment-item glossy-card">
            <div className="employment-item-row">
              <div>
                <Typography variant="h5">
                  {entry.job_title} @ {entry.company_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.location} •{" "}
                  {entry.current_position
                    ? "Present"
                    : `${entry.start_date} – ${entry.end_date}`}
                </Typography>
              </div>

              <div className="employment-actions">
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setEditingEntry(entry)}
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
              </div>
            </div>

            {entry.job_description && (
              <Typography
                variant="body1"
                className="employment-description"
                color="text.primary"
              >
                Job Description: {entry.job_description}
              </Typography>
            )}
          </li>
        ))}
      </ul>

      {editingEntry && (
        <EditEmploymentModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={() => {
            // Close modal and refresh list; success message will be shown via navigation state
            setEditingEntry(null);
            fetchEntries();
          }}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete employment entry?"
        description="This will permanently delete the selected employment entry."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </div>
  );
}
