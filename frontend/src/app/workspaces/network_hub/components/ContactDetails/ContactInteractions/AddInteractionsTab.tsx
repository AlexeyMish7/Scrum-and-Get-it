import { useState } from "react";
import { Box, Button, TextField, Stack, MenuItem } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";

export default function AddInteractionsTab({
    contactId,
    onAdded,
}: {
    contactId?: string | null;
    onAdded?: () => void;
}) {
    const { user } = useAuth();
    const [type, setType] = useState<string>("Note");
    const [notes, setNotes] = useState<string>("");
    const [occurredAt, setOccurredAt] = useState<string>("");
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!user || !contactId) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                contact_id: contactId,
                interaction_type: type,
                notes: notes || null,
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
                setType("Note");
                setNotes("");
                setOccurredAt("");
                onAdded?.();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Call">Call</MenuItem>
                    <MenuItem value="Virtual Meeting">Virtual Meeting</MenuItem>
                    <MenuItem value="In-Person Meeting">In-Person Meeting</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                </TextField>

                <TextField label="Occurred at" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} InputLabelProps={{ shrink: true }} />

                <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ flex: 1 }} />

                <Button variant="contained" onClick={submit} disabled={saving || !contactId}>{saving ? 'Saving…' : 'Add'}</Button>
            </Stack>
        </Box>
    );
}
//A button to add new interaction with the contact this will open a form to update contact_interactions table with the necessary information 
