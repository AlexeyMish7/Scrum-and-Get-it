import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
  MenuItem,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { jobsService } from "@job_pipeline/services";
import {
  listJobNotes,
  createJobNote,
  updateJobNote,
  deleteJobNote,
} from "@shared/services/dbMappers";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import ArchiveToggle from "@job_pipeline/components/search/ArchiveToggle/ArchiveToggle";
import ApplicationTimeline from "@job_pipeline/components/timeline/ApplicationTimeline/ApplicationTimeline";

type Props = {
  jobId: string | number | null;
};

export default function JobDetails({ jobId }: Props) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const { confirm } = useConfirmDialog();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);

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
        const res = await jobsService.getJob(user.id, Number(jobId));
        if (res.error) return handleError(res.error);
        if (!mounted) return;
        if (res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          setJob(d);
          setForm({ ...d });
        } else {
          setJob(null);
          setForm({});
        }

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

  // Reuse the same options as NewJobPage so editors get the same choices
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Other",
  ];
  const jobTypes = [
    { label: "Full-time", value: "full-time" },
    { label: "Part-time", value: "part-time" },
    { label: "Internship", value: "internship" },
    { label: "Contract", value: "contract" },
    { label: "Freelance", value: "freelance" },
  ];

  function prettyJobType(raw: unknown) {
    if (!raw) return "-";
    const s = String(raw).toLowerCase();
    const found = jobTypes.find((t) => t.value === s);
    return found ? found.label : String(raw);
  }

  // Intercept close requests from the RightDrawer close button when editing.
  useEffect(() => {
    function handleBeforeClose(e: Event) {
      // If we're in edit mode, prevent the drawer from closing and open the
      // discard confirmation so the user can choose to cancel edits instead.
      if (editMode) {
        try {
          e.preventDefault();
        } catch {}
        // Instead of opening a separate confirm dialog, use the confirm hook
        (async () => {
          const shouldDiscard = await confirm({
            title: "Discard changes?",
            message:
              "You have unsaved changes. Are you sure you want to discard them?",
            confirmText: "Discard",
            confirmColor: "error",
          });
          if (shouldDiscard) {
            setEditMode(false);
            setForm({ ...job });
            setNoteForm({ ...note });
          }
        })();
      }
    }

    window.addEventListener(
      "rightdrawer:beforeClose",
      handleBeforeClose as EventListener
    );
    return () => {
      window.removeEventListener(
        "rightdrawer:beforeClose",
        handleBeforeClose as EventListener
      );
    };
  }, [editMode]);

  if (!jobId) return <Typography>Select a job to view details.</Typography>;

  async function handleSave() {
    if (!user || !jobId) return;
    setLoading(true);
    try {
      console.log("[JobDetails] handleSave called", {
        userId: user.id,
        jobId,
        form,
        noteForm,
      });

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

      const hasJobChanges = Object.keys(jobPayload).length > 0;

      // prepare note payload and clean it
      const notePayload = { ...(noteForm ?? {}) };
      const excludeFields = ["id", "user_id", "created_at", "updated_at"];
      excludeFields.forEach((field) => delete notePayload[field]);
      
      // Convert salary fields from string to number
      if (notePayload.offered_salary) {
        notePayload.offered_salary = Number(notePayload.offered_salary);
      }
      if (notePayload.negotiated_salary) {
        notePayload.negotiated_salary = Number(notePayload.negotiated_salary);
      }
      
      Object.keys(notePayload).forEach((key) => {
        if (
          notePayload[key] === undefined ||
          notePayload[key] === null ||
          notePayload[key] === ""
        ) {
          delete notePayload[key];
        }
      });
      const hasNoteChanges = Object.keys(notePayload).length > 0;

      // If nothing changed, inform the user and bail out
      if (!hasJobChanges && !hasNoteChanges) {
        console.log("[JobDetails] No changes detected; nothing to save");
        showSuccess("No changes to save");
        return;
      }

      if (hasJobChanges) {
        const res = await jobsService.updateJob(
          user.id,
          Number(jobId),
          jobPayload
        );
        if (res.error) throw res.error;
      }

      // Save job note only when there's something to save
      if (hasNoteChanges) {
        if (note && note.id) {
          // update existing note
          const res2 = await updateJobNote(user.id, String(note.id), notePayload);
          if (res2.error) {
            console.error("[JobDetails] Error updating note:", res2.error);
            throw res2.error;
          }
        } else {
          // create new note with job_id (ensure it's a number)
          notePayload.job_id = Number(jobId);
          const res2 = await createJobNote(user.id, notePayload);
          if (res2.error) {
            console.error("[JobDetails] Error creating note:", res2.error);
            throw res2.error;
          }
          console.log("[JobDetails] Note created successfully:", res2.data);
        }
      }

      showSuccess("Saved");
      setEditMode(false);

      // Notify other components that jobs changed
      window.dispatchEvent(new CustomEvent("jobs-updated"));

      // refresh
      const fresh = await jobsService.getJob(user.id, Number(jobId));
      if (!fresh.error) setJob(fresh.data as unknown as Record<string, unknown>);
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
      const delJob = await jobsService.deleteJob(user.id, Number(jobId));
      if (delJob.error) throw delJob.error;

      showSuccess("Job deleted");
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
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ pr: 3 }}
          >
            <Typography variant="h6">Job Details</Typography>
            <Stack direction="row" spacing={1}>
              {!editMode ? (
                <Button size="small" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    size="small"
                    onClick={async () => {
                      // open confirm dialog to discard changes
                      const shouldDiscard = await confirm({
                        title: "Discard changes?",
                        message:
                          "You have unsaved changes. Are you sure you want to discard them?",
                        confirmText: "Discard",
                        confirmColor: "error",
                      });
                      if (shouldDiscard) {
                        setEditMode(false);
                        setForm({ ...job });
                        setNoteForm({ ...note });
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleSave}
                  >
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_title: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Company"
                  value={String(form.company_name ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company_name: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Job URL"
                  value={String(form.job_link ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_link: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Street address"
                  value={String(form.street_address ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, street_address: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Location"
                  value={String(form.city_name ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city_name: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="State code"
                  value={String(form.state_code ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state_code: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Zipcode"
                  value={String(form.zipcode ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zipcode: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Salary range start"
                  value={String(
                    form.start_salary_range ?? form.start_salary ?? ""
                  )}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      start_salary_range: e.target.value,
                    }))
                  }
                  fullWidth
                  type="number"
                />
                <TextField
                  label="Salary range end"
                  value={String(form.end_salary_range ?? form.end_salary ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_salary_range: e.target.value }))
                  }
                  fullWidth
                  type="number"
                />
                <TextField
                  select
                  label="Industry"
                  value={String(form.industry ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, industry: e.target.value }))
                  }
                  fullWidth
                >
                  {industries.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Job type"
                  value={String(form.job_type ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_type: e.target.value }))
                  }
                  fullWidth
                >
                  {jobTypes.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_description: e.target.value }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                />
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 600 }}>
                  {String(job?.job_title ?? "")}
                </Typography>
                <Typography color="text.secondary">
                  {String(job?.company_name ?? "")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Job Description: {displayOrDash(job?.job_description)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Address: {displayOrDash(job?.street_address)}
                </Typography>
                <Typography variant="body2">
                  {(() => {
                    const parts = [
                      job?.city_name,
                      job?.state_code,
                      job?.zipcode,
                    ]
                      .map((p) =>
                        p === null || p === undefined ? "" : String(p).trim()
                      )
                      .filter((s) => s && s.length > 0);
                    return `Location: ${
                      parts.length > 0 ? parts.join(", ") : "-"
                    }`;
                  })()}
                </Typography>
                <Typography variant="body2">
                  Salary:{" "}
                  {job?.start_salary_range ?? job?.start_salary
                    ? `${String(
                        job?.start_salary_range ?? job?.start_salary
                      )} - ${String(
                        job?.end_salary_range ?? job?.end_salary ?? "-"
                      )}`
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Job URL:{" "}
                  {job?.job_link ? (
                    <a
                      href={String(job?.job_link)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {String(job?.job_link)}
                    </a>
                  ) : (
                    "-"
                  )}
                </Typography>
                <Typography variant="body2">
                  Application deadline:{" "}
                  {job?.application_deadline
                    ? String(job.application_deadline)
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Industry: {displayOrDash(job?.industry)}
                </Typography>
                <Typography variant="body2">
                  Job type: {displayOrDash(prettyJobType(job?.job_type))}
                </Typography>
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
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      personal_notes: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                />
                <TextField
                  label="Recruiter name"
                  value={String(noteForm.recruiter_name ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      recruiter_name: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Recruiter email"
                  value={String(noteForm.recruiter_email ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      recruiter_email: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Recruiter phone"
                  value={String(noteForm.recruiter_phone ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      recruiter_phone: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Hiring manager"
                  value={String(noteForm.hiring_manager_name ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      hiring_manager_name: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Hiring manager email"
                  value={String(noteForm.hiring_manager_email ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      hiring_manager_email: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Hiring manager phone"
                  value={String(noteForm.hiring_manager_phone ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      hiring_manager_phone: e.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Interview notes"
                  value={String(noteForm.interview_notes ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      interview_notes: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  label="Interview feedback"
                  value={String(noteForm.interview_feedback ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      interview_feedback: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Salary negotiation notes"
                  value={String(noteForm.salary_negotiation_notes ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      salary_negotiation_notes: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                />
                
                {/* Offer Details & Tracking */}
                <Divider sx={{ mt: 2 }} />
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Offer Details & Tracking
                </Typography>
                <TextField
                  label="Offer Received Date"
                  type="date"
                  value={String(noteForm.offer_received_date ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      offer_received_date: e.target.value,
                    }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Offered Base Salary"
                  type="number"
                  value={String(noteForm.offered_salary ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      offered_salary: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="e.g., 120000"
                />
                <TextField
                  label="Negotiated Base Salary"
                  type="number"
                  value={String(noteForm.negotiated_salary ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      negotiated_salary: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="e.g., 130000"
                />
                <TextField
                  select
                  label="Negotiation Outcome"
                  value={String(noteForm.negotiation_outcome ?? "")}
                  onChange={(e) =>
                    setNoteForm((n) => ({
                      ...n,
                      negotiation_outcome: e.target.value,
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                  <MenuItem value="countered">Countered</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </TextField>
              </>
            ) : (
              <>
                <Typography variant="body2">
                  Personal Notes:{" "}
                  {note?.personal_notes ? String(note.personal_notes) : "-"}
                </Typography>
                <Typography variant="body2">
                  Interview Notes:{" "}
                  {note?.interview_notes ? String(note.interview_notes) : "-"}
                </Typography>
                <Typography variant="body2">
                  Interview Feedback:{" "}
                  {note?.interview_feedback
                    ? String(note.interview_feedback)
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Salary negotiation notes:{" "}
                  {note?.salary_negotiation_notes
                    ? String(note.salary_negotiation_notes)
                    : "-"}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Offer Details & Tracking
                </Typography>
                <Typography variant="body2">
                  Offer Received:{" "}
                  {note?.offer_received_date
                    ? String(note.offer_received_date)
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Offered Salary:{" "}
                  {note?.offered_salary
                    ? `$${String(note.offered_salary)}`
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Negotiated Salary:{" "}
                  {note?.negotiated_salary
                    ? `$${String(note.negotiated_salary)}`
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Outcome:{" "}
                  {note?.negotiation_outcome
                    ? String(note.negotiation_outcome)
                    : "-"}
                </Typography>
                <Divider sx={{ my: 1 }} />
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
                  Hiring Manager Email:{" "}
                  {String(note?.hiring_manager_email ?? "-")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hiring Manager Phone Number:{" "}
                  {String(note?.hiring_manager_phone ?? "-")}
                </Typography>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Application history
                </Typography>
                <ApplicationTimeline
                  history={note?.application_history as any[] | null}
                  createdAt={job?.created_at as string | null}
                />
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
                const fresh = await jobsService.getJob(user.id, Number(jobId));
                if (!fresh.error)
                  setJob(fresh.data as unknown as Record<string, unknown>);
                const notesRes = await listJobNotes(user.id, {
                  eq: { job_id: jobId },
                });
                if (!notesRes.error) {
                  const notes = (notesRes.data ?? []) as Record<
                    string,
                    unknown
                  >[];
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
            onClick={async () => {
              const confirmed = await confirm({
                title: "Delete job?",
                message:
                  "This will permanently delete the job and any associated notes. This action cannot be undone. Continue?",
                confirmText: "Delete",
                confirmColor: "error",
              });
              if (confirmed) {
                handleDelete();
              }
            }}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </>
  );
}
