import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import { useContactReminders } from "@shared/cache/coreHooks";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { getAppQueryClient } from "@shared/cache";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";

type ContactReminderRow = {
  id: string | number;
  contact_id?: string | null;
  remind_at?: string | null;
  frequency_interval?: number | string | null;
  completed_at?: string | null;
  reminder_type?: string | null;
};

export default function AddReminders({
  contactId,
  onSaved,
  initialType,
  initialRemindAt,
  confirmInterviewId,
}: {
  contactId?: string | null;
  onSaved?: () => void;
  initialType?: string | null;
  initialRemindAt?: string | null;
  confirmInterviewId?: string | null;
}) {
  const { user } = useAuth();
  const remindersQuery = useContactReminders<ContactReminderRow>(user?.id, {
    staleTimeMs: 30 * 1000,
  });
  const reminders = useMemo(() => {
    if (!contactId) return [] as ContactReminderRow[];
    return (remindersQuery.data ?? []).filter(
      (r) => String(r.contact_id ?? "") === String(contactId)
    );
  }, [remindersQuery.data, contactId]);

  const [remindAt, setRemindAt] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [reminderType, setReminderType] = useState<string>("");
  const [recurring, setRecurring] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  function toLocalDatetimeInput(d: Date) {
    // convert to local datetime-local value: YYYY-MM-DDTHH:MM
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16);
  }

  useEffect(() => {
    // If an initial reminder type is provided (e.g., from event follow-up), prefill it
    if (initialType) setReminderType(initialType);

    // If an initial remind-at ISO is provided, prefill the datetime-local input
    if (initialRemindAt) {
      try {
        const d = new Date(initialRemindAt);
        if (!Number.isNaN(d.getTime())) {
          setRemindAt(toLocalDatetimeInput(d));
        }
      } catch {
        // ignore invalid date
      }
    }
  }, [contactId, initialType, initialRemindAt]);

  if (!contactId)
    return (
      <Typography variant="body2">
        Select a contact to manage reminders.
      </Typography>
    );

  const isCreateDisabled = () => {
    if (!user) return true;
    if (recurring) {
      const n = Number(frequency);
      if (Number.isNaN(n) || n <= 0) return true;
    }
    return saving;
  };

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        contact_id: contactId,
      };
      if (remindAt) payload.remind_at = new Date(remindAt).toISOString();
      if (recurring)
        payload.frequency_interval = frequency
          ? Math.floor(Number(frequency))
          : null;
      if (reminderType) payload.reminder_type = reminderType;

      const res = await db.createContactReminder(user.id, payload);
      if (!res.error) {
        setRemindAt("");
        setFrequency("");
        setReminderType("");
        setRecurring(false);
        const queryClient = getAppQueryClient();
        await queryClient.invalidateQueries({
          queryKey: coreKeys.contactReminders(user.id),
        });
        await remindersQuery.refetch();
        // If caller provided an informational interview id, mark it confirmed
        if (confirmInterviewId) {
          try {
            await db.updateInformationalInterview(user.id, confirmInterviewId, {
              status: "confirmed",
            });
          } catch (err) {
            console.error(
              "Failed to confirm informational interview after creating reminder",
              err
            );
          }
        }
        onSaved?.();
      } else {
        console.error("Create reminder error", res.error);
      }
    } catch (err) {
      console.error("Failed to create reminder", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!user || !id) return;
    try {
      await db.deleteContactReminder(user.id, String(id));
      const queryClient = getAppQueryClient();
      await queryClient.invalidateQueries({
        queryKey: coreKeys.contactReminders(user.id),
      });
      await remindersQuery.refetch();
      onSaved?.();
    } catch (err) {
      console.error("Failed to delete reminder", err);
    }
  };

  const handleMarkCompleted = async (id?: string) => {
    if (!user || !id) return;
    try {
      await db.updateContactReminder(user.id, String(id), {
        completed_at: new Date().toISOString(),
      });
      const queryClient = getAppQueryClient();
      await queryClient.invalidateQueries({
        queryKey: coreKeys.contactReminders(user.id),
      });
      await remindersQuery.refetch();
      onSaved?.();
    } catch (err) {
      console.error("Failed to mark completed", err);
    }
  };

  // Compute next occurrence for recurring reminders
  function computeNextOccurrence(
    startIso: string | null | undefined,
    days?: number | null
  ) {
    if (!startIso) return null;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;
    if (!days || days <= 0) return start;
    const now = new Date();
    const next = new Date(start);
    let safety = 0;
    while (next <= now && safety < 10000) {
      next.setDate(next.getDate() + days);
      safety += 1;
    }
    return next;
  }

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="subtitle1">
          Manage reminders for this contact
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            label="Remind at"
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />

          <TextField
            label="Type"
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={recurring}
                onChange={(e) => {
                  const next = e.target.checked;
                  setRecurring(next);
                  // if enabling recurring and there's no remindAt, default to now (local input format)
                  if (next && !remindAt) {
                    setRemindAt(toLocalDatetimeInput(new Date()));
                  }
                }}
              />
            }
            label="Recurring"
          />

          {recurring && (
            <TextField
              label="Frequency (days)"
              type="number"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              size="small"
              sx={{ width: 150 }}
            />
          )}

          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isCreateDisabled()}
          >
            {saving ? <CircularProgress size={18} /> : "Add Reminder"}
          </Button>
        </Stack>

        <Box>
          <Typography variant="subtitle2">Existing reminders</Typography>
          {remindersQuery.isLoading ? (
            <CircularProgress />
          ) : (
            <List>
              {reminders.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No reminders" />
                </ListItem>
              ) : (
                reminders.map((r) => {
                  const id = String(r.id);
                  const remindDate = r.remind_at ? new Date(r.remind_at) : null;
                  const remindStr = remindDate
                    ? remindDate.toLocaleString()
                    : "—";
                  const completed = r.completed_at
                    ? `Completed ${new Date(r.completed_at).toLocaleString()}`
                    : null;
                  const freqNum =
                    r.frequency_interval != null
                      ? Number(r.frequency_interval)
                      : null;
                  const type = r.reminder_type ?? null;

                  const nextOcc = computeNextOccurrence(
                    r.remind_at,
                    freqNum ?? null
                  );

                  const secondaryParts = [] as string[];
                  if (freqNum) secondaryParts.push(`Every ${freqNum} day(s)`);
                  if (nextOcc)
                    secondaryParts.push(`Next: ${nextOcc.toLocaleString()}`);
                  if (completed) secondaryParts.push(completed);

                  return (
                    <ListItem
                      key={id}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          {!r.completed_at && (
                            <IconButton
                              edge="end"
                              aria-label="complete"
                              onClick={() => handleMarkCompleted(id)}
                            >
                              <DoneIcon />
                            </IconButton>
                          )}
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDelete(id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={
                          <span>
                            {type ?? "Reminder"} — {remindStr}{" "}
                            {freqNum ? (
                              <Chip
                                size="small"
                                label="Recurring"
                                sx={{ ml: 1 }}
                              />
                            ) : null}
                          </span>
                        }
                        secondary={secondaryParts.join(" • ")}
                      />
                    </ListItem>
                  );
                })
              )}
            </List>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
