import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, Stack } from "@mui/material";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import ContactFilters from "../ContactFilters";
import ContactsListItem from "./ContactsListItem";
import AddContactButton from "../AddContact/AddContactButton";
import AddContactForm from "../AddContact/AddContactForm";
import ContactDetailsDialog from "../ContactDetails/ContactDetailsDialog";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreContacts } from "@shared/cache/coreFetchers";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";

const ContactsList: React.FC = () => {
  const { user, loading } = useAuth();
  const { confirm } = useConfirmDialog();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown> | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const invalidateContactsCache = async () => {
    if (!user) return;
    try {
      const qc = getAppQueryClient();
      await qc.invalidateQueries({ queryKey: coreKeys.contacts(user.id) });
    } catch {
      // ignore
    }
  };

  const load = async () => {
    if (loading) return;
    if (!user) {
      setContacts([]);
      return;
    }
    setLoadingData(true);
    try {
      const qc = getAppQueryClient();
      const all = await qc.ensureQueryData({
        queryKey: coreKeys.contacts(user.id),
        queryFn: () => fetchCoreContacts<any>(user.id),
        staleTime: 60 * 60 * 1000,
      });

      const allContacts = Array.isArray(all) ? (all as any[]) : [];

      // Build simple eq/ilike filters from `filters` state
      let q: string | null = null;
      let industry: string | null = null;
      let company: string | null = null;
      let role: string | null = null;
      let relationship_type: string | null = null;
      let is_professional_reference: unknown = undefined;
      if (filters) {
        ({
          q,
          industry,
          company,
          role,
          relationship_type,
          is_professional_reference,
        } = filters as any);
      }

      const qLower = q ? String(q).toLowerCase() : null;
      const filtered = allContacts
        .filter((c) => {
          try {
            if (industry && String(c.industry ?? "") !== String(industry))
              return false;
            if (company && String(c.company ?? "") !== String(company))
              return false;
            if (role && String(c.role ?? "") !== String(role)) return false;
            if (
              relationship_type &&
              String(c.relationship_type ?? "") !== String(relationship_type)
            )
              return false;

            if (typeof is_professional_reference !== "undefined") {
              if (
                Boolean(c.is_professional_reference) !==
                Boolean(is_professional_reference)
              )
                return false;
            }

            if (qLower) {
              // Preserve old behavior: free-text search was `ilike` on first_name.
              const first = String(c.first_name ?? "").toLowerCase();
              return first.includes(qLower);
            }
            return true;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const af = String(a.first_name ?? "").toLowerCase();
          const bf = String(b.first_name ?? "").toLowerCase();
          if (af !== bf) return af.localeCompare(bf);
          const al = String(a.last_name ?? "").toLowerCase();
          const bl = String(b.last_name ?? "").toLowerCase();
          return al.localeCompare(bl);
        });

      setContacts(filtered);
    } catch (err) {
      console.error("Failed to load contacts", err);
      setContacts([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, filters]);

  const handleCreate = async (payload: Record<string, unknown>) => {
    if (!user) throw new Error("Not signed in");
    const res = await db.createContact(user.id, payload);
    if (res.error) throw new Error(res.error.message || "Create failed");
    await invalidateContactsCache();
    // reload list
    await load();
    setOpenForm(false);
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    if (!user) throw new Error("Not signed in");
    const res = await db.updateContact(user.id, id, payload);
    if (res.error) throw new Error(res.error.message || "Update failed");
    await invalidateContactsCache();
    await load();
    setEditing(null);
    setOpenForm(false);
  };

  const handleDelete = async (id?: string) => {
    if (!user || !id) return;
    const ok = await confirm({
      title: "Delete contact?",
      message:
        "This will permanently delete the contact and its interactions. Continue?",
      confirmText: "Delete",
      confirmColor: "error",
    });
    if (!ok) return;
    try {
      await db.deleteContact(user.id, id);
    } catch (err) {
      console.error("Delete contact failed", err);
    }
    await invalidateContactsCache();
    await load();
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Contacts</Typography>
        <AddContactButton
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        />
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <ContactFilters
          onChange={(f) => setFilters(f ?? null)}
          onClear={() => setFilters(null)}
        />
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loadingData ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : contacts.length === 0 ? (
          <Typography color="text.secondary">
            No contacts yet. Add one with the button above.
          </Typography>
        ) : (
          contacts.map((c) => (
            <ContactsListItem
              key={c.id}
              contact={c}
              onEdit={(row) => {
                setEditing(row);
                setOpenForm(true);
              }}
              onDelete={(id) => handleDelete(id)}
            />
          ))
        )}
      </Paper>

      {openForm && !editing && (
        <AddContactForm
          open={openForm}
          initialData={undefined}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onCreate={handleCreate}
        />
      )}

      {openForm && editing && (
        <ContactDetailsDialog
          open={Boolean(openForm && editing)}
          contact={editing as any}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onUpdate={async (payload: Record<string, unknown>) => {
            if (!editing?.id) return;
            await handleUpdate(String(editing.id), payload);
          }}
          onDelete={async (id?: string) => {
            await handleDelete(id);
            setOpenForm(false);
            setEditing(null);
          }}
          onRefresh={load}
        />
      )}
    </Box>
  );
};

export default ContactsList;
