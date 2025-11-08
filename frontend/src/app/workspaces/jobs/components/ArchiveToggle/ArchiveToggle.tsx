import { useState } from "react";
import { Button } from "@mui/material";
import ConfirmDialog from "@shared/components/common/ConfirmDialog";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { listJobNotes, updateJob } from "@shared/services/dbMappers";

type Props = {
  jobId: string | number;
  currentStatus?: string | null;
  onDone?: () => void | Promise<void>;
};

/**
 * ArchiveToggle
 * - Shows Archive button when job is not archived.
 * - Shows Unarchive button when job is archived; unarchive will attempt to
 *   restore the previous status by reading job_notes.application_history and
 *   picking the second-to-last entry's `to` value. Falls back to 'Interested'.
 */
export default function ArchiveToggle({ jobId, currentStatus, onDone }: Props) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"archive" | "unarchive">("archive");

  const isArchived = String(currentStatus ?? "").toLowerCase() === "archive";

  async function doArchive() {
    if (!user) return handleError("Not signed in");
    setLoading(true);
    try {
      const res = await updateJob(user.id, jobId, {
        job_status: "archive",
        status_changed_at: new Date().toISOString(),
      });
      if (res.error) throw res.error;
      showSuccess("Job archived");
      if (onDone) await onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  async function doUnarchive() {
    if (!user) return handleError("Not signed in");
    setLoading(true);
    try {
      // fetch notes/history and pick second-to-last `to` value
      const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
      if (notesRes.error) throw notesRes.error;
      const notes = (notesRes.data ?? []) as any[];
      const first = notes[0] ?? null;
      let target = "Interested";
      const hist = first?.application_history;
      if (Array.isArray(hist) && hist.length >= 2) {
        const prev = hist[hist.length - 2];
        target = String(prev?.to ?? prev?.new_status ?? prev?.status ?? "Interested");
      }

      const res = await updateJob(user.id, jobId, {
        job_status: target,
        status_changed_at: new Date().toISOString(),
      });
      if (res.error) throw res.error;
      showSuccess(`Restored job to ${target}`);
      if (onDone) await onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      {!isArchived ? (
        <Button
          color="warning"
          variant="outlined"
          disabled={loading}
          onClick={() => {
            setActionType("archive");
            setConfirmOpen(true);
          }}
        >
          Archive
        </Button>
      ) : (
        <Button
          color="primary"
          variant="contained"
          disabled={loading}
          onClick={() => {
            setActionType("unarchive");
            setConfirmOpen(true);
          }}
        >
          Unarchive
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={actionType === "archive" ? "Archive job?" : "Unarchive job?"}
        description={
          actionType === "archive"
            ? "This will move the job to the archive. You can restore it later by unarchiving. Continue?"
            : "This will restore the job to its previous status. Continue?"
        }
        confirmText={actionType === "archive" ? "Archive" : "Unarchive"}
        cancelText="Cancel"
        onClose={() => setConfirmOpen(false)}
        onConfirm={actionType === "archive" ? doArchive : doUnarchive}
      />
    </>
  );
}
