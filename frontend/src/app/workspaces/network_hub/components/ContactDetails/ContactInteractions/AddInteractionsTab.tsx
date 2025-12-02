import { useState, useEffect } from "react";
import { Box, Button, TextField, Stack, MenuItem, Checkbox, FormControlLabel, Typography, Divider } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";

export default function AddInteractionsTab({
    contactId,
    onAdded,
    initialType,
    initialOccurredAt,
}: {
    contactId?: string | null;
    onAdded?: () => void;
    initialType?: string | null;
    initialOccurredAt?: string | null; // ISO timestamp
}) {
    const { user } = useAuth();
    const [type, setType] = useState<string>("Note");
    const [notes, setNotes] = useState<string>("");
    const [occurredAt, setOccurredAt] = useState<string>("");
    const [saving, setSaving] = useState(false);
    
    // Analytics tracking fields
    const [referralGenerated, setReferralGenerated] = useState(false);
    const [jobOpportunityCreated, setJobOpportunityCreated] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventOutcome, setEventOutcome] = useState("");
    const [valueProvided, setValueProvided] = useState("");
    const [valueReceived, setValueReceived] = useState("");
    const [followUpScheduled, setFollowUpScheduled] = useState(false);
    const [interactionQuality, setInteractionQuality] = useState<number | string>("");

    const submit = async () => {
        if (!user || !contactId) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                contact_id: contactId,
                interaction_type: type,
                notes: notes || null,
                referral_generated: referralGenerated,
                job_opportunity_created: jobOpportunityCreated,
                event_name: eventName || null,
                event_outcome: eventOutcome || null,
                value_provided: valueProvided || null,
                value_received: valueReceived || null,
                follow_up_scheduled: followUpScheduled,
                interaction_quality: interactionQuality === "" ? null : Number(interactionQuality),
            };
            if (occurredAt) {
                // convert datetime-local value to ISO
                const d = new Date(occurredAt);
                if (!Number.isNaN(d.getTime())) payload.occurred_at = d.toISOString();
            }

            const res = await db.createContactInteraction(user.id, payload);
            if (res.error) {
                console.error("Create interaction failed", res.error);
            } else {
                // Reset all fields
                setType("Note");
                setNotes("");
                setOccurredAt("");
                setReferralGenerated(false);
                setJobOpportunityCreated(false);
                setEventName("");
                setEventOutcome("");
                setValueProvided("");
                setValueReceived("");
                setFollowUpScheduled(false);
                setInteractionQuality("");
                onAdded?.();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // If initial values were provided (e.g., opened from an informational interview), prefill them
    // Convert ISO timestamp to datetime-local value (YYYY-MM-DDTHH:MM)
    function toDatetimeLocal(iso?: string | null) {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    useEffect(() => {
        if (initialType && type === "Note") {
            setType(initialType);
        }
        if (initialOccurredAt && !occurredAt) {
            const v = toDatetimeLocal(initialOccurredAt);
            if (v) setOccurredAt(v);
        }
        // We only want to run this when initial props change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialType, initialOccurredAt]);

    return (
        <Box>
            <Stack spacing={2}>
                {/* Basic Interaction Fields */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 160 }}>
                        <MenuItem value="Email">Email</MenuItem>
                        <MenuItem value="Call">Call</MenuItem>
                        <MenuItem value="Virtual Meeting">Virtual Meeting</MenuItem>
                        <MenuItem value="In-Person Meeting">In-Person Meeting</MenuItem>
                        <MenuItem value="Networking Event">Networking Event</MenuItem>
                        <MenuItem value="Informational Interview">Informational Interview</MenuItem>
                        <MenuItem value="Referral">Referral</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </TextField>

                    <TextField label="Occurred at" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} InputLabelProps={{ shrink: true }} />

                    <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ flex: 1 }} multiline />
                </Stack>

                {/* Analytics Tracking Section */}
                <Divider />
                <Typography variant="caption" color="text.secondary">📊 Analytics Tracking (Optional)</Typography>
                
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <FormControlLabel
                        control={<Checkbox checked={referralGenerated} onChange={(e) => setReferralGenerated(e.target.checked)} />}
                        label="Referral Generated"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={jobOpportunityCreated} onChange={(e) => setJobOpportunityCreated(e.target.checked)} />}
                        label="Job Opportunity"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={followUpScheduled} onChange={(e) => setFollowUpScheduled(e.target.checked)} />}
                        label="Follow-up Scheduled"
                    />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField 
                        label="Event Name" 
                        value={eventName} 
                        onChange={(e) => setEventName(e.target.value)} 
                        placeholder="e.g., Tech Meetup 2025"
                        sx={{ flex: 1 }}
                    />
                    <TextField 
                        select 
                        label="Event Outcome" 
                        value={eventOutcome} 
                        onChange={(e) => setEventOutcome(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="positive">Positive</MenuItem>
                        <MenuItem value="neutral">Neutral</MenuItem>
                        <MenuItem value="negative">Negative</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                    </TextField>
                    <TextField 
                        select 
                        label="Quality (1-5)" 
                        value={interactionQuality} 
                        onChange={(e) => setInteractionQuality(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">Not rated</MenuItem>
                        <MenuItem value="1">1 - Poor</MenuItem>
                        <MenuItem value="2">2 - Fair</MenuItem>
                        <MenuItem value="3">3 - Good</MenuItem>
                        <MenuItem value="4">4 - Great</MenuItem>
                        <MenuItem value="5">5 - Excellent</MenuItem>
                    </TextField>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField 
                        label="Value Provided" 
                        value={valueProvided} 
                        onChange={(e) => setValueProvided(e.target.value)} 
                        placeholder="e.g., Intro to hiring manager"
                        sx={{ flex: 1 }}
                        multiline
                    />
                    <TextField 
                        label="Value Received" 
                        value={valueReceived} 
                        onChange={(e) => setValueReceived(e.target.value)} 
                        placeholder="e.g., Job referral"
                        sx={{ flex: 1 }}
                        multiline
                    />
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={submit} disabled={saving || !contactId}>
                        {saving ? 'Saving…' : 'Add Interaction'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
}
//A button to add new interaction with the contact this will open a form to update contact_interactions table with the necessary information 
