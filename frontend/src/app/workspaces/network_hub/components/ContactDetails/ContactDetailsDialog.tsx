import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box } from "@mui/material";
import ContactEditTab from "./ContactEditTab";
import ContactInteractionsTab from "./ContactInteractions/ContactInteractionsTab";
import ContactMutualsTab from "./ContactMutualsTab";
import AddReminders from "../RelationshipMaintenance/Reminders/AddReminders";
import RelationshipActionsTab from "../RelationshipMaintenance/Actions/RelationshipActionsTab";
import JobSearch from "../References/JobSearch";
import GenerateReferenceGuide from "../References/GenerateReferenceGuide";
import AddReferenceHistory from "../References/AddReferenceHistory";
import ReferenceHistory from "../References/ReferenceHistory";

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
    personal_notes?: string | null;
    professional_notes?: string | null;
    is_professional_reference?: boolean | null;
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
    const [selectedJob, setSelectedJob] = useState<Record<string, any> | null>(null);
    const [addRefOpen, setAddRefOpen] = useState(false);

    useEffect(() => {
        if (!open) setTab(0);
    }, [open]);

    const tabsDef = [
        { key: "edit", label: "Edit" },
        { key: "interactions", label: "Interactions" },
        { key: "mutuals", label: "Mutuals" },
        { key: "reminders", label: "Reminders" },
        { key: "relationship", label: "Relationship Actions" },
    ];
    if (contactData?.is_professional_reference) {
        tabsDef.push({ key: "request", label: "Reference Requests" });
    }

    // Ensure current tab index remains valid if tabs change (e.g. request tab appears/disappears)
    useEffect(() => {
        if (tab >= tabsDef.length) setTab(0);
    }, [tab, tabsDef.length]);

    useEffect(() => {
        setContactData(contact ?? undefined);
    }, [contact]);

    if (!contactData) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{`${contactData.first_name ?? ''} ${contactData.last_name ?? ''}`.trim() || 'Contact'}</DialogTitle>
            <DialogContent dividers>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    {tabsDef.map((t) => (
                        <Tab key={t.key} label={t.label} />
                    ))}
                </Tabs>

                    <Box sx={{ mt: 2 }}>
                        {tabsDef[tab]?.key === "edit" && (
                            <ContactEditTab initialData={contactData} onSave={onUpdate} />
                        )}
                        {tabsDef[tab]?.key === "interactions" && (
                            <ContactInteractionsTab contactId={contactData.id} onContactUpdated={(c: any) => { setContactData(c); onRefresh?.(); }} />
                        )}
                        {tabsDef[tab]?.key === "mutuals" && (
                            <Box>
                                <ContactMutualsTab contactId={contactData.id} onSave={async (payload: Record<string, unknown>) => {
                                    // delegate to parent update handler
                                    await onUpdate?.(payload);
                                    // refresh details
                                    onRefresh?.();
                                }} onSaved={() => { onRefresh?.(); }} />
                            </Box>
                        )}
                        {tabsDef[tab]?.key === "reminders" && (
                            <AddReminders contactId={contactData.id} onSaved={() => { onRefresh?.(); }} />
                        )}
                        {tabsDef[tab]?.key === "relationship" && (
                            <RelationshipActionsTab contact={contactData} onRefresh={() => { onRefresh?.(); }} />
                        )}
                        {tabsDef[tab]?.key === "request" && (
                            <Box>
                                <JobSearch onSelectJob={(job) => setSelectedJob(job)} selectedJob={selectedJob} />
                                <GenerateReferenceGuide contact={contactData} job={selectedJob} />

                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button variant="contained" onClick={() => setAddRefOpen(true)} disabled={!selectedJob}>
                                        Add Reference Request
                                    </Button>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <ReferenceHistory contactId={contactData.id} />
                                </Box>

                                <AddReferenceHistory
                                    open={addRefOpen}
                                    contactId={contactData.id}
                                    selectedJob={selectedJob}
                                    onClose={() => setAddRefOpen(false)}
                                    onSaved={() => {
                                        setAddRefOpen(false);
                                        onRefresh?.();
                                    }}
                                />
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
