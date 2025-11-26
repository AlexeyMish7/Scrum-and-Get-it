import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { createReference } from "@shared/services";

type Job = {
    id?: string;
    title?: string | null;
    company?: string | null;
};

export default function AddReferenceHistory({
    open,
    contactId,
    selectedJob,
    onClose,
    onSaved,
}: {
    open: boolean;
    contactId: string | undefined | null;
    selectedJob?: Job | null;
    onClose?: () => void;
    onSaved?: () => void;
}) {
    const { user, loading: authLoading } = useAuth();
    const [notes, setNotes] = useState("");
    const [targetDate, setTargetDate] = useState<string | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedJob) {
            setJob(null);
            return;
        }
        const sj: any = selectedJob as any;
        setJob({
            id: sj.id != null ? String(sj.id) : undefined,
            title: sj.job_title ?? sj.title ?? null,
            company: sj.company_name ?? sj.company ?? null,
        });
    }, [selectedJob]);

    useEffect(() => {
        if (!open) {
            setNotes("");
            setTargetDate(null);
            setMessage(null);
        }
    }, [open]);

    async function handleSubmit() {
        if (!contactId) {
            setMessage("Missing contact ID.");
            return;
        }
        if (!job?.id) {
            setMessage("Please select a job before submitting.");
            return;
        }

        if (authLoading) {
            setMessage("Authentication loading — try again.");
            return;
        }
        if (!user) {
            setMessage("You must be signed in to create a reference.");
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const payload = {
                contact_id: contactId,
                job_id: job.id,
                notes: notes || null,
                target_date: targetDate || null,
                status: "Requested",
                request_date: new Date().toISOString(),
            };

            const res = await createReference(user.id, payload as Record<string, unknown>);
            if (res.error) throw new Error(res.error.message || "create failed");
            setMessage("Reference request created.");
            onSaved?.();
            // small delay so user sees confirmation, then close
            setTimeout(() => {
                onClose?.();
            }, 400);
        } catch (err: any) {
            setMessage(err?.message ?? "Failed to create reference request.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Request Reference</DialogTitle>
            <DialogContent dividers>
                {job ? (
                    <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {job.title ?? "Job"} {job.company ? `- ${job.company}` : ""}
                        </Typography>
                    </>
                ) : (
                    <Typography color="textSecondary">No job selected. Use the job search to choose a job.</Typography>
                )}

                <TextField
                    label="Notes to reference"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{ mt: 2 }}
                />

                <TextField
                    label="Target Date"
                    type="date"
                    value={targetDate ?? ""}
                    onChange={(e) => setTargetDate(e.target.value || null)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                />

                {message && (
                    <Typography sx={{ mt: 2 }} color={message.includes("created") ? "primary" : "error"}>
                        {message}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading} variant="contained">
                    Submit Request
                </Button>
            </DialogActions>
        </Dialog>
    );
}
//When a job is selected from the JobSearch component keep track of the id from it, it will become job_id in the references_list table because it is foreign key
//Then when someone clicks the Add Reference button it will open a popup dialog
//The top of the popup dialog will show the job name and company name from the job_id
//Then it will have a text area for notes to the reference contact
//Then it will have a calendar select button for target date
//Then it will have a submit button to send the request to the server
//When submitted it will create a new entry in the references_list table with status "Requested" and the current date as date_requested