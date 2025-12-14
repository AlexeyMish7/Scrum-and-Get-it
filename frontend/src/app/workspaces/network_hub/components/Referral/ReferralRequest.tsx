/* eslint-disable @typescript-eslint/no-explicit-any -- legacy component relies on dynamic shapes; keep scoped until refactor */
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type TextFieldProps,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import JobSearch from "../References/JobSearch";
import {
  listReferralRequests,
  getJob,
  createReferralRequest,
  updateReferralRequest,
} from "@shared/services";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchContactById } from "@shared/cache/coreFetchers";
import {
  updateContact,
  createContactInteraction,
  listContactReminders,
  updateContactReminder,
} from "@shared/services/dbMappers";
import { aiClient } from "@shared/services/ai/client";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LoadingButton from "@mui/lab/LoadingButton";

type Job = { id?: string; title?: string | null; company?: string | null };

type ReferralRow = {
  id?: string;
  contact_id?: string;
  job_id?: number | null;
  referral_message?: string | null;
  referral_notes?: string | null;
  request_date?: string | null;
  created_at?: string | null;
  responded_at?: string | null;
  completed_at?: string | null;
  status?: string | null;
  job?: Job | null;
};

export default function ReferralRequest({
  contactId,
  initialSelectedJob,
}: {
  contactId?: string | null;
  initialSelectedJob?: Record<string, any> | null;
}) {
  const { user, loading: authLoading } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ message: string; tone?: string; rationale?: string }>
  >([]);
  const [items, setItems] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();
  const [editing, setEditing] = useState<ReferralRow | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [editRespondedAt, setEditRespondedAt] = useState<Date | null>(null);
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    if (!contactId) {
      setItems([]);
      return;
    }
    if (!user || authLoading) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, user, authLoading]);

  // If a parent supplied an initial job (e.g. opened from a job card), prefill the job selector
  useEffect(() => {
    if (!initialSelectedJob || selectedJob) return;
    const j = initialSelectedJob as any;
    const maybeId = j.id ?? j.job_id ?? j.jobId;
    // If we have an id but not a title/company, try fetching the full job record
    if (maybeId && user) {
      (async () => {
        try {
          const jr = await getJob(user.id, Number(maybeId));
          if (!jr.error && jr.data) {
            const jd: any = jr.data;
            setSelectedJob({
              id: jd.id != null ? String(jd.id) : String(maybeId),
              title: jd.job_title ?? jd.title ?? null,
              company: jd.company_name ?? jd.company ?? null,
            });
            return;
          }
        } catch {
          // ignore
        }
        // fallback to using whatever was provided
        setSelectedJob({
          id: maybeId != null ? String(maybeId) : undefined,
          title: j.job_title ?? j.title ?? null,
          company: j.company_name ?? j.company ?? null,
        });
      })();
    } else {
      setSelectedJob({
        id: maybeId != null ? String(maybeId) : undefined,
        title: j.job_title ?? j.title ?? null,
        company: j.company_name ?? j.company ?? null,
      });
    }
  }, [initialSelectedJob, selectedJob, user]);

  // (no external trigger behavior)

  async function fetchItems() {
    if (!contactId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listReferralRequests(user.id, {
        eq: { contact_id: contactId },
        order: { column: "created_at", ascending: false },
      });
      if (res.error)
        throw new Error(res.error.message || "Failed to load referrals");
      const data = Array.isArray(res.data) ? (res.data as ReferralRow[]) : [];

      // fetch job details for rows missing expanded job
      const missingJobIds = Array.from(
        new Set(
          data.filter((d) => !d.job && d.job_id).map((d) => String(d.job_id))
        )
      );
      const jobMap: Record<string, Job> = {};
      if (missingJobIds.length && user) {
        await Promise.all(
          missingJobIds.map(async (jid) => {
            try {
              const jr = await getJob(user.id, Number(jid));
              if (!jr.error && jr.data) {
                const jd: any = jr.data;
                jobMap[jid] = {
                  id: jd.id != null ? String(jd.id) : String(jid),
                  title: jd.job_title ?? jd.title ?? null,
                  company: jd.company_name ?? jd.company ?? null,
                };
              }
            } catch {
              // ignore
            }
          })
        );
      }

      const withJobs = data.map((d) => ({
        ...d,
        job: d.job ?? (d.job_id ? jobMap[String(d.job_id)] ?? null : null),
      }));
      setItems(withJobs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load referral requests");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d?: string | null) {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  }

  async function markCompleted(item: ReferralRow) {
    if (!user || !item.id) return;
    try {
      setLoading(true);
      const payload: Record<string, unknown> = {
        status: "Completed",
        completed_at: new Date().toISOString(),
      };
      const res = await updateReferralRequest(
        user.id,
        String(item.id),
        payload
      );
      if (res.error) throw new Error(res.error.message || "Failed to update");

      // Create a contact interaction for this completed referral and mark related reminders completed
      try {
        if (item.contact_id) {
          const occurred = payload.completed_at as string;
          await createContactInteraction(user.id, {
            contact_id: String(item.contact_id),
            interaction_type: "Referral",
            occurred_at: occurred,
            referral_generated: true,
            notes: `Referral ${item.id} completed`,
          });

          // Mark any outstanding reminders for this contact that look like referral reminders as completed
          try {
            const rr = await listContactReminders(user.id, {
              eq: { contact_id: String(item.contact_id) },
            });
            const rows =
              !rr.error && rr.data
                ? Array.isArray(rr.data)
                  ? rr.data
                  : [rr.data]
                : [];
            const completedAt = occurred;
            for (const r of rows as any[]) {
              if (!r || r.completed_at) continue;
              const type = (r.reminder_type ?? "").toLowerCase();
              if (
                type === "referral" ||
                type.includes("referral") ||
                type === ""
              ) {
                try {
                  await updateContactReminder(user.id, String(r.id), {
                    completed_at: completedAt,
                  });
                } catch {
                  /* non-fatal */
                }
              }
            }
          } catch {
            /* non-fatal */
          }
        }
      } catch (e) {
        console.error(
          "Failed to create interaction or update reminders after completing referral",
          e
        );
      }

      // If this referral relates to a contact, bump their relationship_strength by 2 up to a ceiling of 10
      if (item.contact_id) {
        try {
          const qc = getAppQueryClient();
          const contact = await qc.ensureQueryData({
            queryKey: coreKeys.contactById(user.id, String(item.contact_id)),
            queryFn: () =>
              fetchContactById<any>(user.id, String(item.contact_id)),
            staleTime: 60 * 60 * 1000,
          });
          if (contact) {
            const existing = (contact as any).relationship_strength;
            const current = existing == null ? 0 : Number(existing) || 0;
            if (current < 10) {
              const next = Math.min(10, current + 2);
              const upd = await updateContact(
                user.id,
                String(item.contact_id),
                { relationship_strength: next }
              );
              if (upd.error) {
                handleError(
                  upd.error,
                  "Failed to update relationship strength",
                  "warning"
                );
              } else {
                try {
                  await qc.invalidateQueries({
                    queryKey: coreKeys.contacts(user.id),
                  });
                  await qc.invalidateQueries({
                    queryKey: coreKeys.contactById(
                      user.id,
                      String(item.contact_id)
                    ),
                  });
                } catch {
                  // ignore
                }

                try {
                  await confirm({
                    title: "Congrats",
                    message: `Congrats! Your relationship strength increased by 2! It is now ${next}`,
                    confirmText: "Close",
                  });
                } catch {
                  // ignore
                }
              }
            } else {
              try {
                await confirm({
                  title: "Info",
                  message:
                    "Relationship strength is already at the maximum value",
                  confirmText: "Close",
                });
              } catch {
                // ignore
              }
            }
          }
        } catch (e: any) {
          // Non-fatal; surface via centralized handler
          handleError(e, "Failed to update relationship strength", "warning");
        }
      }

      // Refresh list after attempting contact update
      await fetchItems();
    } catch (e: any) {
      setError(e?.message ?? "Failed to mark completed");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item: ReferralRow) {
    setEditing(item);
    setEditMessage(item.referral_notes ?? item.referral_message ?? "");
    setEditStatus(item.status ?? "Requested");
    setEditRespondedAt(item.responded_at ? new Date(item.responded_at) : null);
  }

  async function saveEdit() {
    if (!user || !editing || !editing.id) return;
    try {
      setLoading(true);
      const payload: Record<string, unknown> = {
        status: editStatus ?? editing.status,
        referral_notes: editMessage ?? null,
      };
      // allow setting/clearing a responded_at date
      if (editRespondedAt) payload.responded_at = editRespondedAt.toISOString();
      else payload.responded_at = null;
      if ((editStatus ?? editing.status) === "Completed")
        payload.completed_at = new Date().toISOString();
      else payload.completed_at = null;

      const res = await updateReferralRequest(
        user.id,
        String(editing.id),
        payload
      );
      if (res.error)
        throw new Error(res.error.message || "Failed to update referral");

      // If we set completed_at, create a contact interaction and mark related reminders completed
      try {
        if (payload.completed_at && editing.contact_id) {
          const occurred = payload.completed_at as string;
          await createContactInteraction(user.id, {
            contact_id: String(editing.contact_id),
            interaction_type: "Referral",
            occurred_at: occurred,
            referral_generated: true,
            notes: `Referral ${editing.id} completed`,
          });

          try {
            const rr = await listContactReminders(user.id, {
              eq: { contact_id: String(editing.contact_id) },
            });
            const rows =
              !rr.error && rr.data
                ? Array.isArray(rr.data)
                  ? rr.data
                  : [rr.data]
                : [];
            for (const r of rows as any[]) {
              if (!r || r.completed_at) continue;
              const type = (r.reminder_type ?? "").toLowerCase();
              if (
                type === "referral" ||
                type.includes("referral") ||
                type === ""
              ) {
                try {
                  await updateContactReminder(user.id, String(r.id), {
                    completed_at: occurred,
                  });
                } catch {
                  /* non-fatal */
                }
              }
            }
          } catch {
            /* non-fatal */
          }
        }
      } catch (e) {
        console.error(
          "Failed to create interaction or update reminders after editing referral",
          e
        );
      }

      setEditing(null);
      await fetchItems();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save changes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">Referral Requests</Typography>

          <JobSearch
            onSelectJob={(job) => setSelectedJob(job)}
            selectedJob={selectedJob}
            showPreview={false}
          />

          {/* Show selected job + company under the search (prefill from initialSelectedJob when present) */}
          {(selectedJob || (initialSelectedJob as any)) && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {(selectedJob as any)?.job_title ??
                selectedJob?.title ??
                (initialSelectedJob as any)?.job_title ??
                (initialSelectedJob as any)?.title ??
                ""}
              {(selectedJob as any)?.company ??
              (selectedJob as any)?.company_name ??
              (initialSelectedJob as any)?.company ??
              (initialSelectedJob as any)?.company_name
                ? ` - ${
                    (selectedJob as any)?.company ??
                    (selectedJob as any)?.company_name ??
                    (initialSelectedJob as any)?.company ??
                    (initialSelectedJob as any)?.company_name
                  }`
                : ""}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setEditMessage("");
                setOpenAdd(true);
              }}
              disabled={!selectedJob}
            >
              Add Referral Request
            </Button>
            <LoadingButton
              variant="outlined"
              loading={loading}
              onClick={async () => {
                // Generate suggestions via backend AI endpoint
                if (!selectedJob) {
                  setError("Select a job first");
                  return;
                }
                if (!user) {
                  setError("Sign in required");
                  return;
                }
                setError(null);
                setLoading(true);
                try {
                  // Normalize job title/company regardless of JobSearch shape
                  const jobTitle =
                    (selectedJob as any).job_title ??
                    (selectedJob as any).title ??
                    null;
                  const jobCompany =
                    (selectedJob as any).company_name ??
                    (selectedJob as any).company ??
                    null;
                  const payload: Record<string, unknown> = {
                    contact_id: contactId,
                    job_title: jobTitle,
                    job_company: jobCompany,
                  };
                  const resp = await aiClient.postJson<{
                    suggestions?: Array<{
                      message: string;
                      tone?: string;
                      rationale?: string;
                    }>;
                  }>("/api/generate/referral-request", payload, user.id);
                  const s = (resp && resp.suggestions) || [];
                  // Ensure each suggestion has a message string
                  const normalized = s.map((it: any) => ({
                    message: String(it.message ?? it ?? ""),
                    tone: it.tone,
                    rationale: it.rationale,
                  }));
                  setSuggestions(normalized);
                  setSuggestionsOpen(true);
                } catch (e: any) {
                  setError(e?.message ?? "Failed to generate suggestions");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!selectedJob}
            >
              Generate Message & Preview
            </LoadingButton>
          </Box>

          {error && <Typography color="error">{error}</Typography>}

          <List>
            {items.length === 0 && !loading && (
              <Typography color="textSecondary">
                No referral requests found.
              </Typography>
            )}

            {items.map((item) => (
              <React.Fragment key={item.id ?? Math.random()}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={`${item.job?.title ?? "(Job)"} ${
                      item.job?.company ? `- ${item.job.company}` : ""
                    }`}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                          sx={{ fontWeight: 600 }}
                        >
                          {item.status ?? "Requested"}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="caption"
                          color="textSecondary"
                        >
                          Requested:{" "}
                          {formatDate(item.created_at ?? item.request_date)} •
                          Completed: {formatDate(item.completed_at)}
                        </Typography>
                        {item.referral_notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {item.referral_notes}
                          </Typography>
                        )}
                      </>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Tooltip
                      title={
                        item.status === "Completed"
                          ? "Already completed"
                          : "Mark completed"
                      }
                    >
                      <span>
                        <IconButton
                          edge="end"
                          aria-label="complete"
                          onClick={() => markCompleted(item)}
                          disabled={loading || item.status === "Completed"}
                        >
                          <CheckCircleOutlineIcon
                            color={
                              item.status === "Completed"
                                ? "success"
                                : "inherit"
                            }
                          />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Edit referral">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => openEdit(item)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Add Referral Dialog */}
        <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Create Referral Request</DialogTitle>
          <DialogContent dividers>
            {selectedJob ? (
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedJob.title ?? "Job"}{" "}
                {selectedJob.company ? `- ${selectedJob.company}` : ""}
              </Typography>
            ) : (
              <Typography color="textSecondary">No job selected.</Typography>
            )}

            <TextField
              label="Message to contact"
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 2 }}
              value={editMessage ?? ""}
              onChange={(e) => setEditMessage(e.target.value)}
            />

            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ mt: 1, display: "block" }}
            >
              Use "Generate & Preview" to get AI suggestions, then click "Use"
              to load one here. When ready, click "Add Referral Request" to
              save.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!contactId) {
                  setError("Missing contact id");
                  return;
                }
                if (!selectedJob?.id) {
                  setError("Select a job first");
                  return;
                }
                if (!user) {
                  setError("Sign in required");
                  return;
                }
                setLoading(true);
                try {
                  const payload: Record<string, unknown> = {
                    contact_id: contactId,
                    job_id: selectedJob.id,
                    referral_message: editMessage ?? null,
                    status: "Requested",
                    // DB column is `created_at` (used as request date)
                    created_at: new Date().toISOString(),
                  };
                  const res = await createReferralRequest(user.id, payload);
                  if (res.error)
                    throw new Error(res.error.message || "Create failed");
                  setOpenAdd(false);
                  setEditMessage(null);
                  await fetchItems();
                } catch (e: any) {
                  setError(e?.message ?? "Failed to create referral");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Add Referral Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Suggestions Dialog */}
        <Dialog
          open={suggestionsOpen}
          onClose={() => setSuggestionsOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>AI Suggestions</DialogTitle>
          <DialogContent dividers>
            {suggestions.length === 0 && (
              <Typography color="textSecondary">
                No suggestions returned.
              </Typography>
            )}
            <List>
              {suggestions.map((s, idx) => (
                <ListItem
                  key={idx}
                  alignItems="flex-start"
                  sx={{ alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={`Suggestion ${idx + 1}`}
                    secondary={
                      <>
                        <Typography variant="body2">{s.message}</Typography>
                        {(s.tone || s.rationale) && (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: "block", mt: 1 }}
                          >
                            {s.tone ? `Tone: ${s.tone}` : ""}
                            {s.tone && s.rationale ? " • " : ""}
                            {s.rationale ?? ""}
                          </Typography>
                        )}
                      </>
                    }
                    sx={{ pr: 10 }}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEditMessage(s.message);
                        setSuggestionsOpen(false);
                        setOpenAdd(true);
                      }}
                    >
                      Use
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSuggestionsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Referral</DialogTitle>
          <DialogContent dividers>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="ref-status-label">Status</InputLabel>
              <Select
                labelId="ref-status-label"
                value={editStatus ?? "Requested"}
                label="Status"
                onChange={(e) => setEditStatus(String(e.target.value))}
              >
                <MenuItem value="Requested">Requested</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Ignored">Ignored</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Responded"
                value={editRespondedAt}
                onChange={(d: Date | null) => setEditRespondedAt(d)}
                renderInput={(params: TextFieldProps) => (
                  <TextField {...params} fullWidth sx={{ mt: 2 }} />
                )}
              />
            </LocalizationProvider>

            <TextField
              sx={{ mt: 2 }}
              label="Notes"
              fullWidth
              multiline
              minRows={3}
              value={editMessage ?? ""}
              onChange={(e) => setEditMessage(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" onClick={saveEdit} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
