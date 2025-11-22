import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton, CircularProgress, TextField, Stack, Checkbox } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";

export default function AddMutualsButton({ contactId, onUpdated }: { contactId?: string | null; onUpdated?: () => void; }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [allContacts, setAllContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!user) return setAllContacts([]);
        setLoading(true);
        try {
            const res: Result<unknown[]> = await db.listContacts(user.id, { order: { column: 'first_name', ascending: true } });
            const rows = !res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            setAllContacts(rows as any[]);

            // load target contact's existing mutuals
            if (contactId) {
                const cres = await db.getContact(user.id, String(contactId));
                if (!cres.error && cres.data) {
                    const existing = (cres.data as any).mutual_contacts ?? (cres.data as any).mutual_contact_ids ?? [];
                    if (Array.isArray(existing)) setSelected(new Set(existing.map(String)));
                }
            }
        } catch (err) {
            console.error('Failed to load contacts for AddMutuals', err);
            setAllContacts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (open) load(); }, [open, user, contactId]);

    const toggle = (id?: string) => {
        if (!id) return;
        setSelected((s) => {
            const copy = new Set(Array.from(s));
            if (copy.has(id)) copy.delete(id);
            else copy.add(id);
            return copy;
        });
    };

    const handleSave = async () => {
        if (!user || !contactId) return;
        setSaving(true);
        try {
            const arr = Array.from(selected);

            // update primary contact A to have selected mutuals
            await db.updateContact(user.id, String(contactId), { mutual_contact_ids: arr });

            // For each contact B, ensure their mutual_contacts contain A if selected, or remove A if deselected
            const updates: Promise<any>[] = [];
            const aId = String(contactId);
            for (const c of allContacts) {
                const bId = String(c.id);
                if (bId === aId) continue;
                const current: string[] = Array.isArray(c.mutual_contacts) ? c.mutual_contacts.map(String) : (Array.isArray(c.mutual_contact_ids) ? c.mutual_contact_ids.map(String) : []);
                const shouldHaveA = selected.has(bId);
                const hasA = current.includes(aId);
                if (shouldHaveA && !hasA) {
                    const next = Array.from(new Set([...current, aId]));
                    updates.push(db.updateContact(user.id, bId, { mutual_contact_ids: next }));
                } else if (!shouldHaveA && hasA) {
                    const next = current.filter((x) => String(x) !== aId);
                    updates.push(db.updateContact(user.id, bId, { mutual_contact_ids: next }));
                }
            }

            if (updates.length) await Promise.all(updates);

            onUpdated?.();
            setOpen(false);
        } catch (err) {
            console.error('Failed to save mutuals in AddMutualsButton', err);
        } finally {
            setSaving(false);
        }
    };

    const filtered = allContacts.filter((c) => String(c.id) !== String(contactId) && (`${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase().includes(query.toLowerCase()) || (c.email ?? '').toLowerCase().includes(query.toLowerCase())));

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>Add mutuals</Button>
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add mutual contacts</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} size="small" />
                        {loading ? <CircularProgress /> : (
                            <List>
                                {filtered.map((c) => {
                                    const id = String(c.id);
                                    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || 'Unnamed';
                                    const isSelected = selected.has(id);
                                    return (
                                        <ListItem key={id} disablePadding>
                                            <ListItemButton onClick={() => toggle(id)}>
                                                <ListItemAvatar>
                                                    <Avatar>{(c.first_name ?? '').charAt(0).toUpperCase() || 'C'}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText primary={name} secondary={[c.company ?? null, c.email ?? null].filter(Boolean).join(' • ')} />
                                                <Checkbox edge="end" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => toggle(id)} />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
