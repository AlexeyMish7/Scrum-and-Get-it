import { useEffect, useState } from "react";
//import type { ChangeEvent } from "react";
import { Box, Typography, Button, Stack, Slider } from "@mui/material";
import AddInteractionsTab from "./AddInteractionsTab";
import InteractionsTimeline from "./InteractionsTimeline";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
//import type { Result } from "@shared/services/types";

export default function ContactInteractionsTab({ contactId, onContactUpdated }: { contactId?: string | null; onContactUpdated?: (c: any) => void }) {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentStrength, setCurrentStrength] = useState<number | null>(null);
    const [editingStrength, setEditingStrength] = useState<number | string | null>(null);
    const [savingStrength, setSavingStrength] = useState(false);

    const load = async () => {
        if (!user || !contactId) return setItems([]);
        setLoading(true);
        try {
            const [intsRes, contactRes] = await Promise.all([
                db.listContactInteractions(user.id, { eq: { contact_id: contactId }, order: { column: "occurred_at", ascending: false } }),
                db.getContact(user.id, String(contactId)),
            ]);

            if (!intsRes.error && intsRes.data) setItems(Array.isArray(intsRes.data) ? intsRes.data : [intsRes.data]);
            else setItems([]);

            if (!contactRes.error && contactRes.data) {
                const cs = (contactRes.data as any).relationship_strength;
                setCurrentStrength(cs == null ? null : Number(cs));
                setEditingStrength(cs == null ? 0 : Number(cs));
                try { onContactUpdated?.(contactRes.data); } catch (err) { /* ignore */ }
            } else {
                setCurrentStrength(null);
                setEditingStrength(0);
            }
        } catch (err) {
            console.error("Failed to load interactions", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [user, contactId]);

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <Stack direction="column" spacing={2} alignItems="stretch">
                    <AddInteractionsTab contactId={contactId} onAdded={() => load()} />

                    <Box sx={{ width: { xs: '100%', sm: 480 } }}>
                        <Typography variant="caption" display="block">Relationship Strength {currentStrength != null ? `(Current: ${currentStrength})` : '(not set)'}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ flex: 1, px: 1 }}>
                                <Slider
                                    min={0}
                                    max={10}
                                    step={1}
                                    value={typeof editingStrength === 'number' ? editingStrength : 0}
                                    onChange={(_, val) => setEditingStrength(val as number)}
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <Button variant="outlined" size="small" onClick={async () => {
                                if (!user || !contactId) return;
                                const v = editingStrength === '' ? null : Number(editingStrength);
                                setSavingStrength(true);
                                try {
                                    await db.updateContact(user.id, String(contactId), { relationship_strength: v });
                                    setCurrentStrength(v == null ? null : Number(v));
                                    // refresh interactions list as well
                                    await load();
                                } catch (err) {
                                    console.error('Failed to update strength', err);
                                } finally {
                                    setSavingStrength(false);
                                }
                            }} disabled={savingStrength}>Update</Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>

            {loading ? (
                <Typography>Loading interactions…</Typography>
            ) : items.length === 0 ? (
                <Typography color="text.secondary">No interactions yet.</Typography>
            ) : (
                <InteractionsTimeline items={items} onUpdate={async (id: string, payload: Record<string, unknown>) => {
                    if (!user) return false;
                    try {
                        await db.updateContactInteraction(user.id, String(id), payload);
                        await load();
                        return true;
                    } catch (err) {
                        console.error('Failed to update interaction', err);
                        return false;
                    }
                }} onDelete={async (id: string) => {
                    if (!user) return false;
                    try {
                        await db.deleteContactInteraction(user.id, String(id));
                        await load();
                        return true;
                    } catch (err) {
                        console.error('Failed to delete interaction', err);
                        return false;
                    }
                }} />
            )}
        </Box>
    );
}
