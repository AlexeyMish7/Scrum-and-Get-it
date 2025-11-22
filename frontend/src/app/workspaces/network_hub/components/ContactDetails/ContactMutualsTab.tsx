import { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText, Stack, CircularProgress, ListItemAvatar, Avatar } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";
import AddMutualsButton from "./AddMutualsButton";

export default function ContactMutualsTab({ contactId, onSave: _onSave, onSaved }: { contactId?: string | null; onSave?: (payload: Record<string, unknown>) => Promise<void> | void; onSaved?: () => void; }) {
    const { user } = useAuth();
    const [allContacts, setAllContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [mutuals, setMutuals] = useState<any[]>([]);

    const load = async () => {
        if (!user) return setAllContacts([]);
        setLoading(true);
        try {
            const res: Result<unknown[]> = await db.listContacts(user.id, { order: { column: 'first_name', ascending: true } });
            const rows = !res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            const contacts = rows as any[];
            setAllContacts(contacts);

            if (contactId) {
                const cres = await db.getContact(user.id, String(contactId));
                if (!cres.error && cres.data) {
                    const existing = (cres.data as any).mutual_contacts ?? (cres.data as any).mutual_contact_ids ?? [];
                    const ids = Array.isArray(existing) ? existing.map(String) : [];
                    const mapped = ids.map((id) => contacts.find((c) => String(c.id) === String(id))).filter(Boolean);
                    setMutuals(mapped as any[]);
                } else {
                    setMutuals([]);
                }
            }
        } catch (err) {
            console.error('Failed to load contacts for mutuals', err);
            setAllContacts([]);
            setMutuals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [user, contactId]);

    return (
        <Box>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">Mutual contacts</Typography>
                    <AddMutualsButton contactId={contactId} onUpdated={() => { load(); onSaved?.(); }} />
                </Stack>

                {loading ? (
                    <CircularProgress />
                ) : (
                    <List>
                        {mutuals.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No mutual contacts saved" />
                            </ListItem>
                        ) : (
                            mutuals.map((c) => {
                                const id = String(c.id);
                                const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || 'Unnamed';
                                const secondary = [c.company ?? null, c.email ?? null].filter(Boolean).join(' • ');
                                return (
                                    <ListItem key={id} disablePadding>
                                        <ListItemAvatar>
                                            <Avatar>{(c.first_name ?? '').charAt(0).toUpperCase() || 'C'}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={name} secondary={secondary} />
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                )}
            </Stack>
        </Box>
    );
}
