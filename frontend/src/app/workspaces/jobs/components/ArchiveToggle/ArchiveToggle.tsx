import { useState } from "react";
import { Button } from "@mui/material";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { listJobNotes } from "@shared/services/dbMappers";
import { jobsService } from "@jobs/services";

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
  const { confirm } = useConfirmDialog();

  const [loading, setLoading] = useState(false);

  const isArchived = String(currentStatus ?? "").toLowerCase() === "archive";

  async function doArchive() {
    if (!user) return handleError("Not signed in");
    setLoading(true);
    let succeeded = false;
    try {
      const res = await jobsService.updateJob(user.id, Number(jobId), {
        job_status: "archive",
      });
      if (res.error) throw res.error;
      showSuccess("Job archived");
      if (onDone) await onDone();
      succeeded = true;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      // If archive succeeded, reload the page so the archived job is removed from current view
      if (succeeded) {
        // full reload to ensure lists/pipeline reflect the archive
        window.location.reload();
      }
    }
  }

  async function doUnarchive() {
    if (!user) return handleError("Not signed in");
    setLoading(true);
    let succeeded = false;
    try {
      // fetch notes/history and pick the most-recent previous non-archive status
      const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
      if (notesRes.error) throw notesRes.error;
      const notes = (notesRes.data ?? []) as Array<{
        application_history?: unknown[];
      }>;
      const first = notes[0] ?? null;
      let target = "Interested";
      const hist = first?.application_history;

      if (Array.isArray(hist) && hist.length > 0) {
        // Walk backwards through history and pick the last status that is not 'archive'.
        // This is resilient to different shapes (to/new_status/status) and ordering.
        for (let i = hist.length - 1; i >= 0; i--) {
          const entry = hist[i];
          const v = String(
            entry?.to ?? entry?.new_status ?? entry?.status ?? ""
          ).trim();
          if (!v) continue;
          if (v.toLowerCase() !== "archive") {
            target = v;
            break;
          }
        }

        // As a defensive fallback, if we still ended up with 'archive', try the second-to-last entry
        if (String(target).toLowerCase() === "archive" && hist.length >= 2) {
          const prev = hist[hist.length - 2];
          target = String(
            prev?.to ?? prev?.new_status ?? prev?.status ?? "Interested"
          );
        }
      }

      const res = await jobsService.updateJob(user.id, Number(jobId), {
        job_status: target,
      });
      if (res.error) throw res.error;
      showSuccess(`Restored job to ${target}`);
      if (onDone) await onDone();
      succeeded = true;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      // Reload the page so the job lists / pipeline reflect the unarchive change immediately.
      if (succeeded) {
        window.location.reload();
      }
    }
  }

  return (
    <>
      {!isArchived ? (
        <Button
          color="warning"
          variant="outlined"
          disabled={loading}
          onClick={async () => {
            const confirmed = await confirm({
              title: "Archive job?",
              message:
                "This will move the job to the archive. You can restore it later by unarchiving. Continue?",
              confirmText: "Archive",
            });
            if (confirmed) {
              doArchive();
            }
          }}
        >
          Archive
        </Button>
      ) : (
        <Button
          color="primary"
          variant="contained"
          disabled={loading}
          onClick={async () => {
            const confirmed = await confirm({
              title: "Unarchive job?",
              message:
                "This will restore the job to its previous status. Continue?",
              confirmText: "Unarchive",
            });
            if (confirmed) {
              doUnarchive();
            }
          }}
        >
          Unarchive
        </Button>
      )}
    </>
  );
}
