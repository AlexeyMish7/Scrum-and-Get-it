import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  
} from "@mui/material";
import AddContactButton from "../AddContact/AddContactButton";
import AddContactForm from "../AddContact/AddContactForm";
import ContactsListItem from "../ContactsList/ContactsListItem";
import AddReminders from "../RelationshipMaintenance/Reminders/AddReminders";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";

export default function EventContacts({ eventId, eventName }: { eventId?: string | null; eventName?: string | null }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<{ link: any; contact: any | null }>>([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [pendingContactId, setPendingContactId] = useState<string | null>(null);
  const [openReminders, setOpenReminders] = useState(false);

  async function load() {
    if (!user || !eventId) return setRows([]);
    setLoading(true);
    try {
      const res: Result<unknown[]> = await db.listNetworkingEventContacts(user.id, { eq: { event_id: eventId } });
      const links = !res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];

      const pairs = await Promise.all(
        links.map(async (l: any) => {
          try {
            const cRes = await db.getContact(user.id, String(l.contact_id));
            return { link: l, contact: !cRes.error ? cRes.data : null };
          } catch {
            return { link: l, contact: null };
          }
        })
      );

      setRows(pairs as any[]);
    } catch (err) {
      console.error("Failed to load event contacts", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, eventId]);

  // When AddContactForm calls onCreate, we first create the contact then prompt to link to event
  const handleCreateContact = async (payload: Record<string, unknown>) => {
    if (!user || !eventId) throw new Error("Not signed in or missing event");
    const res = await db.createContact(user.id, payload);
    if (res.error) throw new Error(res.error.message || "Create failed");
    const created = res.data as any;
    // hold pending id and immediately create link; if payload requested follow-up, open reminders
    setPendingContactId(String(created.id));
    const linkPayload: Record<string, unknown> = {
      event_id: eventId,
      contact_id: String(created.id),
    };
    if (payload?.follow_up_required) {
      linkPayload.follow_up_required = Boolean(payload.follow_up_required);
      linkPayload.follow_up_notes = payload.follow_up_notes ?? null;
    }
    await db.createNetworkingEventContact(user.id, linkPayload);
    setOpenAdd(false);
    if (payload?.follow_up_required) {
      setOpenReminders(true);
    }
    await load();
  };



  const handleDeleteLinkByContact = async (contactId?: string) => {
    if (!user || !contactId) return;
    // find link
    const found = rows.find((r) => String(r.link.contact_id) === String(contactId));
    if (!found) return;
    try {
      await db.deleteNetworkingEventContact(user.id, String(found.link.id));
    } catch (err) {
      console.error("Failed to delete link", err);
    }
    await load();
  };

  const handleUpdateContact = async (id: string, payload: Record<string, unknown>) => {
    if (!user) throw new Error("Not signed in");
    const res = await db.updateContact(user.id, id, payload);
    if (res.error) throw new Error(res.error.message || "Update failed");
    setOpenEdit(false);
    setEditing(null);
    await load();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Connections</Typography>
        <AddContactButton onClick={() => { setOpenAdd(true); setEditing(null); }} />
      </Box>

      <Paper sx={{ p: 2, minHeight: 400 }}>
        {loading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary">No connections yet. Add one with the button above.</Typography>
        ) : (
          rows.map((r) => (
            <ContactsListItem
              key={String(r.contact?.id ?? r.link.id)}
              contact={r.contact ?? { id: r.link.contact_id }}
              onEdit={(c) => { setEditing(c); setOpenEdit(true); }}
              onDelete={(id) => handleDeleteLinkByContact(id)}
            />
          ))
        )}
      </Paper>

      {/* Add contact form for creating a new contact (then prompt to link/follow-up) */}
      {openAdd && (
        <AddContactForm
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          includeFollowUp={true}
          onCreate={async (payload) => {
            try {
              await handleCreateContact(payload);
            } catch (err) {
              console.error(err);
              throw err;
            }
          }}
        />
      )}

      {/* Edit existing contact */}
      {openEdit && editing && (
        <AddContactForm
          open={openEdit}
          initialData={editing}
          onClose={() => { setOpenEdit(false); setEditing(null); }}
          onUpdate={async (payload) => {
            if (!editing?.id) return;
            await handleUpdateContact(String(editing.id), payload);
          }}
        />
      )}

      {/* follow-up is collected in the add-contact form now; linking and reminders handled immediately after create */}

      {/* Reminders panel (shown after linking & user chose follow-up) */}
      <Dialog open={openReminders} onClose={() => { setOpenReminders(false); setPendingContactId(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Follow-up reminders</DialogTitle>
        <DialogContent>
            <AddReminders contactId={pendingContactId ?? undefined} onSaved={() => { setOpenReminders(false); setPendingContactId(null); }} initialType={eventName ? `Follow Up from ${eventName}` : undefined} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenReminders(false); setPendingContactId(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
//This tab will list every contact that was made at this networking event 
//It will have an add contact button at the top that opens a dialog to add a new contact
//This will update both the contacts table and the networking_event_contacts table in the database
//On this popup there will also be an option for follow up needed 
//If the option is checked then also open up an add reminder and fill the type  with "Follow up from event: [event name]"
//Use the ContactsListItem component to display each contact in the list
//Use the addcontactform component for the add contact dialog
//use the AddReminder component for the follow up reminder but fill the 