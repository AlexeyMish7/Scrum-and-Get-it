import React, { useEffect, useState } from "react";
import {
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Divider,
    Button,
    IconButton,
    ListItemSecondaryAction,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { listReferences, getJob, updateReference, listJobNotes } from "@shared/services";
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

    type ReferenceRow = {
    id?: string;
    contact_id?: string;
    job_id?: string;
    notes?: string | null;
    target_date?: string | null;
    request_date?: string | null;
    completed_date?: string | null;
    status?: string | null;
    // some APIs may return expanded job object
    job?: { id?: string; title?: string | null; company?: string | null; status?: string | null } | null;
    // computed flag when an interview for the linked job occurred after reference completion
    successFromReference?: boolean;
};

export default function ReferenceHistory({ contactId }: { contactId?: string | null }) {
    const [items, setItems] = useState<ReferenceRow[]>([]);
    const [editingItem, setEditingItem] = useState<ReferenceRow | null>(null);
    const [editNotes, setEditNotes] = useState<string | null>(null);
    const [editTargetDate, setEditTargetDate] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!contactId) {
            setItems([]);
            return;
        }
        if (authLoading) return;
        if (!user) return;
        fetchReferences(contactId, user.id);
    }, [contactId, user, authLoading]);
    async function fetchReferences(contactId: string, userId: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await listReferences(userId, { eq: { contact_id: contactId }, order: { column: "request_date", ascending: false } });
            if (res.error) throw new Error(res.error.message || "Failed to load references");
            const data = Array.isArray(res.data) ? (res.data as ReferenceRow[]) : [];

            // fetch job details for any rows missing an expanded job and job_notes application_history
            const missingJobIds = Array.from(new Set(data.filter(d => !d.job && d.job_id).map(d => String(d.job_id))));
            const jobMap: Record<string, { id?: string; title?: string | null; company?: string | null; status?: string | null; interviewDates?: string[] }> = {};
            if (missingJobIds.length) {
                await Promise.all(missingJobIds.map(async (jid) => {
                    try {
                        const jr = await getJob(userId, Number(jid));
                        if (!jr.error && jr.data) {
                            const jd: any = jr.data;
                            // collect interview dates from job_notes.application_history
                            const interviewDates: string[] = [];
                            try {
                                const notesRes = await listJobNotes(userId, { eq: { job_id: Number(jid) } });
                                if (!notesRes.error && Array.isArray(notesRes.data)) {
                                    for (const note of notesRes.data as any[]) {
                                        const appHist = note.application_history ?? note.applicationHistory ?? note.application_history_json ?? null;
                                        if (Array.isArray(appHist)) {
                                            for (const entry of appHist) {
                                                // Support multiple application_history shapes.
                                                // Primary: explicit interview date fields
                                                let dateCandidate: string | null =
                                                    entry.interview_date ?? entry.occurred_at ?? entry.date ?? entry.when ?? null;

                                                // Secondary: some histories log stage changes with `to`/`from` and `changed_at`
                                                if (!dateCandidate) {
                                                    const toVal = entry.to ?? entry.to_stage ?? null;
                                                    const fromVal = entry.from ?? entry.from_stage ?? null;
                                                    const looksLikeInterview =
                                                        (typeof toVal === 'string' && toVal.toLowerCase() === 'interview') ||
                                                        (typeof fromVal === 'string' && fromVal.toLowerCase() === 'interview');
                                                    if (looksLikeInterview) {
                                                        dateCandidate = entry.changed_at ?? entry.changedAt ?? null;
                                                    }
                                                }

                                                if (dateCandidate) {
                                                    const d = new Date(String(dateCandidate));
                                                    if (!Number.isNaN(d.getTime())) interviewDates.push(d.toISOString());
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                // ignore job_notes errors
                            }

                            jobMap[jid] = {
                                id: jd.id != null ? String(jd.id) : String(jid),
                                title: jd.job_title ?? jd.title ?? null,
                                company: jd.company_name ?? jd.company ?? null,
                                status: jd.job_status ?? jd.status ?? null,
                                interviewDates,
                            };
                        }
                    } catch (e) {
                        // ignore
                    }
                }));
            }

            const withJobs = data.map(d => {
                const job = d.job ?? (d.job_id ? jobMap[String(d.job_id)] ?? null : null);
                // compute if any interview date is after the reference completed_date
                let successFromReference = false;
                if (job && Array.isArray((job as any).interviewDates) && d.completed_date) {
                    try {
                        const refDate = new Date(String(d.completed_date));
                        if (!Number.isNaN(refDate.getTime())) {
                            for (const idate of (job as any).interviewDates ?? []) {
                                const iv = new Date(idate);
                                if (!Number.isNaN(iv.getTime()) && iv.getTime() > refDate.getTime()) {
                                    successFromReference = true;
                                    break;
                                }
                            }
                        }
                    } catch {
                        // ignore parse errors
                    }
                }
                return { ...d, job: job ? { ...(job as any) } : job, successFromReference };
            });
            setItems(withJobs);
        } catch (err: any) {
            setError(err?.message ?? "Failed to load reference history");
        } finally {
            setLoading(false);
        }
    }

    async function markCompleted(item: ReferenceRow) {
        if (!user || !item.id) return;
        try {
            setLoading(true);
            const payload: Record<string, unknown> = {
                status: "Completed",
                completed_date: new Date().toISOString(),
            };
            const res = await updateReference(user.id, String(item.id), payload);
            if (res.error) throw new Error(res.error.message || "Failed to update");
            await fetchReferences(contactId!, user.id);
        } catch (e: any) {
            setError(e?.message ?? "Failed to mark completed");
        } finally {
            setLoading(false);
        }
    }

    function openEdit(item: ReferenceRow) {
        setEditingItem(item);
        setEditNotes(item.notes ?? "");
        setEditTargetDate(item.target_date ?? null);
        setEditStatus(item.status ?? "Requested");
    }

    async function saveEdit() {
        if (!user || !editingItem || !editingItem.id) return;
        try {
            setLoading(true);
            const payload: Record<string, unknown> = {
                status: editStatus ?? editingItem.status,
                target_date: editTargetDate ?? null,
                notes: editNotes ?? null,
            };
            // if user marked completed in edit, set completed_date
            if ((editStatus ?? editingItem.status) === "Completed") {
                payload.completed_date = new Date().toISOString();
            } else {
                payload.completed_date = null;
            }
            const res = await updateReference(user.id, String(editingItem.id), payload);
            if (res.error) throw new Error(res.error.message || "Failed to update reference");
            setEditingItem(null);
            await fetchReferences(contactId!, user.id);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save changes");
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

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6">Reference Requests</Typography>
                <Button size="small" onClick={() => (contactId && user) && fetchReferences(contactId, user.id)} disabled={loading}>Refresh</Button>
            </Box>

            {error && (
                <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
            )}

            <List>
                {items.length === 0 && !loading && (
                    <Typography color="textSecondary">No reference requests found.</Typography>
                )}

                {items.map(item => (
                    <React.Fragment key={item.id ?? Math.random()}>
                        {item.successFromReference && (
                            <Box sx={{ bgcolor: (theme) => theme.palette.success.light, p: 1, mb: 1, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Success Interview Received After Reference</Typography>
                            </Box>
                        )}
                        <ListItem alignItems="flex-start">
                            <ListItemText
                                primary={`${item.job?.title ?? "(Job)"} ${item.job?.company ? `- ${item.job.company}` : ""}`}
                                secondary={(
                                    <>
                                        <Typography component="span" variant="body2" color="textPrimary" sx={{ fontWeight: 600 }}>
                                            {item.status ?? "Unknown"}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="caption" color="textSecondary">
                                            Requested: {formatDate(item.request_date)} • Target: {formatDate(item.target_date)} • Completed: {formatDate(item.completed_date)}
                                            {item.job?.status ? ` • Job Status: ${item.job.status}` : null}
                                        </Typography>
                                        {item.notes && (
                                            <Typography variant="body2" sx={{ mt: 1 }}>{item.notes}</Typography>
                                        )}
                                    </>
                                )}
                            />

                            <ListItemSecondaryAction>
                                <Tooltip title={item.status === "Completed" ? "Already completed" : "Mark completed"}>
                                    <span>
                                        <IconButton edge="end" aria-label="complete" onClick={() => markCompleted(item)} disabled={loading || item.status === "Completed"}>
                                            <CheckCircleOutlineIcon color={item.status === "Completed" ? "success" : "inherit"} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Edit reference">
                                    <IconButton edge="end" aria-label="edit" onClick={() => openEdit(item)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider component="li" />
                    </React.Fragment>
                ))}
            </List>

            <Dialog open={Boolean(editingItem)} onClose={() => setEditingItem(null)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Reference</DialogTitle>
                <DialogContent dividers>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select labelId="status-label" value={editStatus ?? "Requested"} label="Status" onChange={(e) => setEditStatus(String(e.target.value))}>
                            <MenuItem value="Requested">Requested</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Ignored">Ignored</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField sx={{ mt: 2 }} label="Target Date" type="date" fullWidth value={editTargetDate ?? ""} InputLabelProps={{ shrink: true }} onChange={(e) => setEditTargetDate(e.target.value || null)} />

                    <TextField sx={{ mt: 2 }} label="Notes" fullWidth multiline minRows={3} value={editNotes ?? ""} onChange={(e) => setEditNotes(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingItem(null)} disabled={loading}>Cancel</Button>
                    <Button onClick={saveEdit} variant="contained" disabled={loading}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
//This page will load in all the past reference requests 
//It will show the Job Title - Company Name - Status
//Then underneath it will show the date requested, the target date, and the completed date if applicable 
//Status can be either Requested, Completed, Ignored, or Cancelled