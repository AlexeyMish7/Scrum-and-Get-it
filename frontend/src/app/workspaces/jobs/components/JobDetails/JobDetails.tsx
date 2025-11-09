import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import {
  getJob,
  updateJob,
  listJobNotes,
  createJobNote,
  updateJobNote,
  deleteJob,
  deleteJobNote,
} from "@shared/services/dbMappers";
import ConfirmDialog from "@shared/components/common/ConfirmDialog";
import ArchiveToggle from "@workspaces/jobs/components/ArchiveToggle/ArchiveToggle";
import ApplicationTimeline from "@workspaces/jobs/components/ApplicationTimeline/ApplicationTimeline";

type Props = {
  jobId: string | number | null;
};

export default function JobDetails({ jobId }: Props) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);

  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // job notes: we load first note (one-per-job expected for now)
  const [note, setNote] = useState<Record<string, unknown> | null>(null);

  // local form state mirrors job & note fields when editing
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [noteForm, setNoteForm] = useState<Record<string, unknown>>({});

  // Helper to display a value or a dash when missing/empty
  const displayOrDash = (v: unknown) => {
    if (v === null || v === undefined) return "-";
    const s = String(v).trim();
    return s === "" ? "-" : s;
  };

  useEffect(() => {
    if (!user || !jobId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getJob(user.id, jobId);
        if (res.error) return handleError(res.error);
        if (!mounted) return;
        setJob(res.data as Record<string, unknown>);
        setForm({ ...(res.data as Record<string, unknown>) });

        // load job notes (first one)
        const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
        if (notesRes.error) return handleError(notesRes.error);
        const notes = (notesRes.data ?? []) as Record<string, unknown>[];
      const first = notes[0] ?? null;
      setNote(first);
      setNoteForm({ ...(first ?? {}) });
      } catch (err) {
        handleError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, jobId, handleError]);

  // Intercept close requests from the RightDrawer close button when editing.
  useEffect(() => {
    function handleBeforeClose(e: Event) {
      // If we're in edit mode, prevent the drawer from closing and open the
      // discard confirmation so the user can choose to cancel edits instead.
      if (editMode) {
        try {
          e.preventDefault();
        } catch {}
        setConfirmDiscardOpen(true);
      }
    }

    window.addEventListener("rightdrawer:beforeClose", handleBeforeClose as EventListener);
    return () => {
      window.removeEventListener("rightdrawer:beforeClose", handleBeforeClose as EventListener);
    };
  }, [editMode]);

  if (!jobId) return <Typography>Select a job to view details.</Typography>;

  async function handleSave() {
    if (!user || !jobId) return;
    setLoading(true);
    try {
      // update job fields (partial allowed)
      const jobPayload: Record<string, unknown> = {};
      // pick known editable fields
      [
        "job_title",
        "company_name",
        "street_address",
        "city_name",
        "zipcode",
        "state_code",
        "start_salary_range",
        "end_salary_range",
        "job_link",
        "application_deadline",
        "job_description",
        "industry",
        "job_type",
        "job_status",
      ].forEach((k) => {
        if (k in form) jobPayload[k] = form[k];
      });

      if (Object.keys(jobPayload).length > 0) {
        const res = await updateJob(user.id, jobId, jobPayload);
        if (res.error) throw res.error;
      }

      // save job note (create or update)
      const notePayload = { ...(noteForm ?? {}) };
      if (note && note.id) {
        // update existing note
        const res2 = await updateJobNote(user.id, String(note.id), notePayload);
        if (res2.error) throw res2.error;
      } else {
        // create new note with job_id
        notePayload.job_id = jobId;
        const res2 = await createJobNote(user.id, notePayload);
        if (res2.error) throw res2.error;
      }

      showSuccess("Saved");
      setEditMode(false);
      // refresh
      const fresh = await getJob(user.id, jobId);
      if (!fresh.error) setJob(fresh.data as Record<string, unknown>);
      const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
      if (!notesRes.error) {
        const notes = (notesRes.data ?? []) as Record<string, unknown>[];
      setNote(notes[0] ?? null);
      setNoteForm({ ...(notes[0] ?? {}) });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  // NOTE: Archive/unarchive behavior moved into ArchiveToggle component to
  // keep this component focused on editing and display. Use the ArchiveToggle
  // `onDone` callback to refresh details when status changes.

  // Delete job and associated notes
  async function handleDelete() {
    if (!user || !jobId) return;
    setLoading(true);
    try {
      // delete associated notes first
      const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
      if (notesRes.error) throw notesRes.error;
      const notes = (notesRes.data ?? []) as Record<string, unknown>[];
      await Promise.all(
        notes.map(async (n) => {
          if (n && n.id) {
            const del = await deleteJobNote(user.id, String(n.id));
            if (del.error) throw del.error;
          }
        })
      );

      // delete the job row
      const delJob = await deleteJob(user.id, jobId);
      if (delJob.error) throw delJob.error;

      showSuccess("Job deleted");
      setConfirmDeleteOpen(false);
      // refresh the page to update lists and close drawer
      try {
        window.location.reload();
      } catch {
        // no-op
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Box sx={{ width: 420, p: 2 }}>
        <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Job Details</Typography>
          <Stack direction="row" spacing={1}>
            {!editMode ? (
              <Button size="small" onClick={() => setEditMode(true)}>Edit</Button>
            ) : (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    // open confirm dialog to discard changes
                    setConfirmDiscardOpen(true);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="contained" disabled={loading} onClick={handleSave}>
                  Save
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        <Divider />

        {/* Job fields */}
        <Stack spacing={1}>
          {editMode ? (
            <>
              <TextField
                label="Job title"
                value={String(form.job_title ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Company"
                value={String(form.company_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Job URL"
                value={String(form.job_link ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, job_link: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Street address"
                value={String(form.street_address ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, street_address: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Location"
                value={String(form.city_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, city_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="State code"
                value={String(form.state_code ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, state_code: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Zipcode"
                value={String(form.zipcode ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, zipcode: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Salary range start"
                value={String(form.start_salary_range ?? form.start_salary ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, start_salary_range: e.target.value }))}
                fullWidth
                type="number"
              />
              <TextField
                label="Salary range end"
                value={String(form.end_salary_range ?? form.end_salary ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, end_salary_range: e.target.value }))}
                fullWidth
                type="number"
              />
              <TextField
                label="Industry"
                value={String(form.industry ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Job type"
                value={String(form.job_type ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Application deadline"
                  value={
                    form.application_deadline
                      ? // try to build a Date from stored value
                        form.application_deadline instanceof Date
                        ? (form.application_deadline as Date)
                        : new Date(String(form.application_deadline))
                      : null
                  }
                  onChange={(newValue) => {
                    // store as ISO date string (YYYY-MM-DD) or null
                    if (newValue) {
                      const iso = newValue.toISOString().split("T")[0];
                      setForm((f) => ({ ...f, application_deadline: iso }));
                    } else {
                      setForm((f) => ({ ...f, application_deadline: null }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <TextField
                label="Job description"
                value={String(form.job_description ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
                fullWidth
                multiline
                minRows={4}
              />
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 600 }}>{String(job?.job_title ?? "")}</Typography>
              <Typography color="text.secondary">{String(job?.company_name ?? "")}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Job Description: {displayOrDash(job?.job_description)}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Address: {displayOrDash(job?.street_address)}
              </Typography>
              <Typography variant="body2">
                {(() => {
                  const parts = [job?.city_name, job?.state_code, job?.zipcode]
                    .map((p) => (p === null || p === undefined ? "" : String(p).trim()))
                    .filter((s) => s && s.length > 0);
                  return `Location: ${parts.length > 0 ? parts.join(", ") : "-"}`;
                })()}
              </Typography>
              <Typography variant="body2">Salary: {job?.start_salary_range ?? job?.start_salary ? `${String(job?.start_salary_range ?? job?.start_salary)} - ${String(job?.end_salary_range ?? job?.end_salary ?? "-")}` : "-"}</Typography>
              <Typography variant="body2">Job URL: {job?.job_link ? <a href={String(job?.job_link)} target="_blank" rel="noreferrer">{String(job?.job_link)}</a> : "-"}</Typography>
              <Typography variant="body2">Application deadline: {job?.application_deadline ? String(job.application_deadline) : "-"}</Typography>
              <Typography variant="body2">Industry: {displayOrDash(job?.industry)}</Typography>
              <Typography variant="body2">Job type: {displayOrDash(job?.job_type)}</Typography>
            </>
          )}
        </Stack>

        <Divider />

        {/* Notes section */}
        <Stack spacing={1}>
          <Typography variant="subtitle1">Notes</Typography>
          {editMode ? (
            <>
              <TextField
                label="Personal notes"
                value={String(noteForm.personal_notes ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, personal_notes: e.target.value }))}
                fullWidth
                multiline
                minRows={4}
              />
              <TextField
                label="Recruiter name"
                value={String(noteForm.recruiter_name ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, recruiter_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Recruiter email"
                value={String(noteForm.recruiter_email ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, recruiter_email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Recruiter phone"
                value={String(noteForm.recruiter_phone ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, recruiter_phone: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Hiring manager"
                value={String(noteForm.hiring_manager_name ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, hiring_manager_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Hiring manager email"
                value={String(noteForm.hiring_manager_email ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, hiring_manager_email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Hiring manager phone"
                value={String(noteForm.hiring_manager_phone ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, hiring_manager_phone: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Interview notes"
                value={String(noteForm.interview_notes ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, interview_notes: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
              />
            <TextField
              label="Interview feedback"
              value={String(noteForm.interview_feedback ?? "")}
              onChange={(e) => setNoteForm((n) => ({ ...n, interview_feedback: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
              <TextField
                label="Salary negotiation notes"
                value={String(noteForm.salary_negotiation_notes ?? "")}
                onChange={(e) => setNoteForm((n) => ({ ...n, salary_negotiation_notes: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </>
          ) : (
            <>
              <Typography variant="body2">
                Personal Notes: {note?.personal_notes ? String(note.personal_notes) : "-"}
              </Typography>
              <Typography variant="body2">
                Interview Notes: {note?.interview_notes ? String(note.interview_notes) : "-"}
              </Typography>
              <Typography variant="body2">
                Interview Feedback: {note?.interview_feedback ? String(note.interview_feedback) : "-"}
              </Typography>
              <Typography variant="body2">
                Salary negotiation notes: {note?.salary_negotiation_notes ? String(note.salary_negotiation_notes) : "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recruiter: {String(note?.recruiter_name ?? "-")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recruiter Email: {String(note?.recruiter_email ?? "-")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recruiter Phone Number: {String(note?.recruiter_phone ?? "-")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hiring Manager: {String(note?.hiring_manager_name ?? "-")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hiring Manager Email: {String(note?.hiring_manager_email ?? "-")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hiring Manager Phone Number: {String(note?.hiring_manager_phone ?? "-")}
              </Typography>
            <Divider />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Application history</Typography>
            <ApplicationTimeline history={note?.application_history as any[] | null} createdAt={job?.created_at as string | null} />
            </>
          )}
        </Stack>
        </Stack>
      </Box>
    {/* Archive / Delete actions */}
    <Box sx={{ px: 2, pb: 2 }}>
      <Stack direction="row" spacing={1} justifyContent="flex-start">
        <ArchiveToggle
          jobId={jobId as string | number}
          currentStatus={String(job?.job_status ?? job?.jobStatus ?? "")}
          onDone={async () => {
            // refresh job & notes after archive/unarchive
            if (!user || !jobId) return;
            try {
              const fresh = await getJob(user.id, jobId);
              if (!fresh.error) setJob(fresh.data as Record<string, unknown>);
              const notesRes = await listJobNotes(user.id, { eq: { job_id: jobId } });
              if (!notesRes.error) {
                const notes = (notesRes.data ?? []) as Record<string, unknown>[];
                setNote(notes[0] ?? null);
                setNoteForm({ ...(notes[0] ?? {}) });
              }
            } catch (err) {
              handleError(err);
            }
          }}
        />
        <Button
          color="error"
          variant="contained"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Delete
        </Button>
      </Stack>
    </Box>
      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Discard changes?"
        description="Are you sure you want to discard your unsaved changes?"
        confirmText="Discard"
        cancelText="Keep editing"
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          // revert local form state to last saved values
          setForm({ ...(job ?? {}) });
          setNoteForm({ ...(note ?? {}) });
          setEditMode(false);
          setConfirmDiscardOpen(false);
        }}
      />
      {/* Archive handled by ArchiveToggle component above */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete job?"
        description="This will permanently delete the job and any associated notes. This action cannot be undone. Continue?"
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

