import { useEffect, useMemo, useState } from "react";
//import type { ChangeEvent } from "react";
import { Box, Typography, Button, Stack, Slider } from "@mui/material";
import AddInteractionsTab from "./AddInteractionsTab";
import InteractionsTimeline from "./InteractionsTimeline";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import {
  useContactInteractions,
  useCoreContacts,
} from "@shared/cache/coreHooks";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { getAppQueryClient } from "@shared/cache";
//import type { Result } from "@shared/services/types";

type ContactRow = {
  id: string | number;
  relationship_strength?: number | string | null;
} & Record<string, unknown>;

type ContactInteractionRow = {
  id?: string | number;
  occurred_at?: string | null;
} & Record<string, unknown>;

export default function ContactInteractionsTab({
  contactId,
  onContactUpdated,
}: {
  contactId?: string | null;
  onContactUpdated?: (c: ContactRow) => void;
}) {
  const { user } = useAuth();
  const [currentStrength, setCurrentStrength] = useState<number | null>(null);
  const [editingStrength, setEditingStrength] = useState<
    number | string | null
  >(null);
  const [savingStrength, setSavingStrength] = useState(false);

  const stableContactId = contactId ? String(contactId) : null;
  const interactionsQuery = useContactInteractions<ContactInteractionRow>(
    user?.id,
    stableContactId,
    { staleTimeMs: 30 * 1000 }
  );
  const contactsQuery = useCoreContacts<ContactRow>(user?.id, {
    staleTimeMs: 30 * 1000,
  });
  const contact = useMemo(() => {
    if (!stableContactId) return null;
    return (
      (contactsQuery.data ?? []).find(
        (c) => String(c.id) === String(stableContactId)
      ) ?? null
    );
  }, [contactsQuery.data, stableContactId]);

  useEffect(() => {
    if (!contact) {
      setCurrentStrength(null);
      setEditingStrength(0);
      return;
    }

    const cs = contact.relationship_strength;
    const csNum = cs == null ? null : Number(cs);
    const normalized = csNum == null || Number.isNaN(csNum) ? null : csNum;

    setCurrentStrength(normalized);
    setEditingStrength(normalized ?? 0);
    try {
      onContactUpdated?.(contact);
    } catch {
      /* ignore */
    }
  }, [contact, onContactUpdated]);

  const items = interactionsQuery.data ?? [];
  const loading = interactionsQuery.isLoading;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Stack direction="column" spacing={2} alignItems="stretch">
          <AddInteractionsTab
            contactId={contactId}
            onAdded={async () => {
              await interactionsQuery.refetch();
            }}
          />

          <Box sx={{ width: { xs: "100%", sm: 480 } }}>
            <Typography variant="caption" display="block">
              Relationship Strength{" "}
              {currentStrength != null
                ? `(Current: ${currentStrength})`
                : "(not set)"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ flex: 1, px: 1 }}>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={
                    typeof editingStrength === "number" ? editingStrength : 0
                  }
                  onChange={(_, val) => setEditingStrength(val as number)}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  if (!user || !contactId) return;
                  const v =
                    editingStrength === "" ? null : Number(editingStrength);
                  setSavingStrength(true);
                  try {
                    await db.updateContact(user.id, String(contactId), {
                      relationship_strength: v,
                    });

                    const queryClient = getAppQueryClient();
                    await queryClient.invalidateQueries({
                      queryKey: coreKeys.contacts(user.id),
                    });
                    const refetchRes = await contactsQuery.refetch();
                    const next = (refetchRes.data ?? []).find(
                      (c) => String(c.id) === String(contactId)
                    );
                    if (next) {
                      try {
                        onContactUpdated?.(next);
                      } catch {
                        /* ignore */
                      }
                    }

                    setCurrentStrength(
                      v == null || Number.isNaN(v) ? null : Number(v)
                    );
                  } catch (err) {
                    console.error("Failed to update strength", err);
                  } finally {
                    setSavingStrength(false);
                  }
                }}
                disabled={savingStrength}
              >
                Update
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {loading ? (
        <Typography>Loading interactions…</Typography>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No interactions yet.</Typography>
      ) : (
        <InteractionsTimeline
          items={items}
          onUpdate={async (id: string, payload: Record<string, unknown>) => {
            if (!user) return false;
            try {
              await db.updateContactInteraction(user.id, String(id), payload);
              const queryClient = getAppQueryClient();
              if (stableContactId) {
                await queryClient.invalidateQueries({
                  queryKey: coreKeys.contactInteractions(
                    user.id,
                    stableContactId
                  ),
                });
              }
              await interactionsQuery.refetch();
              return true;
            } catch (err) {
              console.error("Failed to update interaction", err);
              return false;
            }
          }}
          onDelete={async (id: string) => {
            if (!user) return false;
            try {
              await db.deleteContactInteraction(user.id, String(id));
              const queryClient = getAppQueryClient();
              if (stableContactId) {
                await queryClient.invalidateQueries({
                  queryKey: coreKeys.contactInteractions(
                    user.id,
                    stableContactId
                  ),
                });
              }
              await interactionsQuery.refetch();
              return true;
            } catch (err) {
              console.error("Failed to delete interaction", err);
              return false;
            }
          }}
        />
      )}
    </Box>
  );
}
