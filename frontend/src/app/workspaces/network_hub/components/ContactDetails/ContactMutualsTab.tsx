import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Stack,
  CircularProgress,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import MutualsGraph from "../Mutuals/MutualsGraph";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchContactById,
  fetchCoreContacts,
} from "@shared/cache/coreFetchers";
import { useAuth } from "@shared/context/AuthContext";
import AddMutualsButton from "./AddMutualsButton";

type ContactRow = {
  id: string | number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  company?: string | null;
  mutual_contacts?: unknown;
  mutual_contact_ids?: unknown;
  [key: string]: unknown;
};

export default function ContactMutualsTab({
  contactId,
  onSaved,
}: {
  contactId?: string | null;
  onSave?: (payload: Record<string, unknown>) => Promise<void> | void;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mutuals, setMutuals] = useState<ContactRow[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setMutuals([]);
      return;
    }

    setLoading(true);
    try {
      const qc = getAppQueryClient();
      const data = await qc.ensureQueryData({
        queryKey: coreKeys.contacts(user.id),
        queryFn: () => fetchCoreContacts<ContactRow>(user.id),
        staleTime: 60 * 60 * 1000,
      });

      const contacts = (Array.isArray(data) ? (data as ContactRow[]) : [])
        .slice()
        .sort((a, b) => {
          const af = String(a.first_name ?? "").toLowerCase();
          const bf = String(b.first_name ?? "").toLowerCase();
          if (af !== bf) return af.localeCompare(bf);
          const al = String(a.last_name ?? "").toLowerCase();
          const bl = String(b.last_name ?? "").toLowerCase();
          return al.localeCompare(bl);
        });

      if (contactId) {
        const row = await qc.ensureQueryData({
          queryKey: coreKeys.contactById(user.id, String(contactId)),
          queryFn: () =>
            fetchContactById<ContactRow>(user.id, String(contactId)),
          staleTime: 60 * 60 * 1000,
        });

        const existing = row?.mutual_contacts ?? row?.mutual_contact_ids ?? [];
        const ids = Array.isArray(existing) ? existing.map(String) : [];
        const mapped = ids
          .map((id) => contacts.find((c) => String(c.id) === String(id)))
          .filter((c): c is ContactRow => Boolean(c));
        setMutuals(mapped);
      } else {
        setMutuals([]);
      }
    } catch (err) {
      console.error("Failed to load contacts for mutuals", err);
      setMutuals([]);
    } finally {
      setLoading(false);
    }
  }, [contactId, user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1">Mutual contacts</Typography>
          <AddMutualsButton
            contactId={contactId}
            onUpdated={() => {
              load();
              onSaved?.();
            }}
          />
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
                const name =
                  `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
                  c.email ||
                  "Unnamed";
                const secondary = [c.company ?? null, c.email ?? null]
                  .filter(Boolean)
                  .join(" • ");
                return (
                  <ListItem key={id} disablePadding>
                    <ListItemAvatar>
                      <Avatar>
                        {(c.first_name ?? "").charAt(0).toUpperCase() || "C"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={name} secondary={secondary} />
                  </ListItem>
                );
              })
            )}
          </List>
        )}

        {/* Graph view of mutuals */}
        <MutualsGraph contactId={contactId} />
      </Stack>
    </Box>
  );
}
