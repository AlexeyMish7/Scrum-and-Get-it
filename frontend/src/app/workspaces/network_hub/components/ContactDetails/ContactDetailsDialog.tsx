import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box } from "@mui/material";
import ContactEditTab from "./ContactEditTab";
import ContactInteractionsTab from "./ContactInteractions/ContactInteractionsTab";
import ContactMutualsTab from "./ContactMutualsTab";

type ContactRow = {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    role?: string | null;
    company?: string | null;
    industry?: string | null;
    relationship_strength?: number | null;
    email?: string | null;
    phone?: string | null;
};

export default function ContactDetailsDialog({
    open,
    contact,
    onClose,
    onUpdate,
    onDelete,
    onRefresh,
}: {
    open: boolean;
    contact?: ContactRow | null;
    onClose?: () => void;
    onUpdate?: (payload: Record<string, unknown>) => Promise<void> | void;
    onDelete?: (id?: string) => Promise<void> | void;
    onRefresh?: () => void;
}) {
    const [tab, setTab] = useState(0);
    const [contactData, setContactData] = useState<ContactRow | undefined>(contact ?? undefined);

    useEffect(() => {
        if (!open) setTab(0);
    }, [open]);

    useEffect(() => {
        setContactData(contact ?? undefined);
    }, [contact]);

    if (!contactData) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{`${contactData.first_name ?? ''} ${contactData.last_name ?? ''}`.trim() || 'Contact'}</DialogTitle>
            <DialogContent dividers>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Edit" />
                    <Tab label="Interactions" />
                    <Tab label="Mutuals" />
                    <Tab label="Manage Reminders" />
                </Tabs>

                    <Box sx={{ mt: 2 }}>
                        {tab === 0 && (
                            <ContactEditTab initialData={contactData} onSave={onUpdate} />
                        )}
                        {tab === 1 && (
                            <ContactInteractionsTab contactId={contactData.id} onContactUpdated={(c: any) => { setContactData(c); onRefresh?.(); }} />
                        )}
                        {tab === 2 && (
                            <Box>
                                <ContactMutualsTab contactId={contactData.id} onSave={async (payload: Record<string, unknown>) => {
                                    // delegate to parent update handler
                                    await onUpdate?.(payload);
                                    // refresh details
                                    onRefresh?.();
                                }} onSaved={() => { onRefresh?.(); }} />
                            </Box>
                        )}
                    </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button color="error" onClick={async () => {
                    // Parent (`ContactsList`) is responsible for confirmation; just call through
                    await onDelete?.(contactData.id);
                }}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
}
