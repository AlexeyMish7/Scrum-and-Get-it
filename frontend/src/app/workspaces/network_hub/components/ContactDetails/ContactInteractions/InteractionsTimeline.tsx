import React, { useState } from "react";
import { List, ListItem, ListItemText, Divider, Typography, IconButton, ListItemSecondaryAction, TextField, MenuItem, Button, CircularProgress, Stack, Box } from "@mui/material";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function formatDate(iso?: string | null) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

export default function InteractionsTimeline({ items, onUpdate, onDelete }: { items: any[]; onUpdate?: (id: string, payload: Record<string, unknown>) => Promise<boolean>; onDelete?: (id: string) => Promise<boolean>; }) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editType, setEditType] = useState<string>('Note');
    const [editNotes, setEditNotes] = useState<string>('');
    const [editOccurredAt, setEditOccurredAt] = useState<string>('');
    const [saving, setSaving] = useState(false);

    function toLocalDatetimeInput(iso?: string | null) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            // iso string like 2025-11-21T12:34 -> slice to minutes
            return d.toISOString().slice(0, 16);
        } catch {
            return iso;
        }
    }

    const startEdit = (it: any) => {
        setEditingId(String(it.id));
        setEditType(it.interaction_type ?? 'Note');
        setEditNotes(it.notes ?? '');
        setEditOccurredAt(toLocalDatetimeInput(it.occurred_at));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSaving(false);
    };

    const saveEdit = async (id: string) => {
        if (!onUpdate) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = { interaction_type: editType, notes: editNotes || null };
            if (editOccurredAt) {
                const d = new Date(editOccurredAt);
                if (!Number.isNaN(d.getTime())) payload.occurred_at = d.toISOString();
            } else {
                payload.occurred_at = null;
            }
            const ok = await onUpdate(id, payload);
            if (ok) cancelEdit();
        } catch (err) {
            console.error('Failed saving interaction edit', err);
        } finally {
            setSaving(false);
        }
    };

    const { confirm } = useConfirmDialog();

    const doDelete = async (id: string) => {
        if (!onDelete) return;
        try {
            const ok = await confirm({
                title: 'Delete interaction?',
                message: 'This will permanently remove the interaction. Are you sure?',
                confirmText: 'Delete',
                confirmColor: 'error',
              });

            if (!ok) return;

            await onDelete(id);
        } catch (err) {
            console.error('Failed to delete interaction', err);
        }
    };

    return (
        <List>
            {items.map((it, idx) => (
                <React.Fragment key={it.id ?? idx}>
                    <ListItem alignItems="flex-start">
                        {editingId === String(it.id) ? (
                            <Box sx={{ width: '100%' }}>
                                <Stack spacing={1}>
                                    <TextField select label="Type" value={editType} onChange={(e) => setEditType(e.target.value)} size="small">
                                        <MenuItem value="Email">Email</MenuItem>
                                        <MenuItem value="Call">Call</MenuItem>
                                        <MenuItem value="Virtual Meeting">Virtual Meeting</MenuItem>
                                        <MenuItem value="In-Person Meeting">In-Person Meeting</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </TextField>

                                    <TextField label="Occurred at" type="datetime-local" value={editOccurredAt} onChange={(e) => setEditOccurredAt(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />

                                    <TextField label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} multiline size="small" />

                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" onClick={() => saveEdit(String(it.id))} disabled={saving}>{saving ? <CircularProgress size={16} /> : 'Save'}</Button>
                                        <Button variant="outlined" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        ) : (
                            <ListItemText
                                primary={it.interaction_type ?? 'Interaction'}
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2" color="text.primary">{formatDate(it.occurred_at)}</Typography>
                                        {it.notes ? ` — ${it.notes}` : ''}
                                    </>
                                }
                            />
                        )}

                        <ListItemSecondaryAction>
                            {editingId === String(it.id) ? null : (
                                <>
                                    <IconButton edge="end" aria-label="edit" onClick={() => startEdit(it)} size="large">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => doDelete(String(it.id))} size="large">
                                        <DeleteIcon />
                                    </IconButton>
                                </>
                            )}
                        </ListItemSecondaryAction>
                    </ListItem>
                    {idx < items.length - 1 && <Divider component="li" />}
                </React.Fragment>
            ))}
        </List>
    );
}
//This will create a timeline showing the interaction history with the contact
