import { useState } from "react";

import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Checkbox,
  Stack,
  Box,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  DialogActions,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";
import AddEvent from "./AddEvent";
import EventContacts from "./EventContacts";
import { useAuth } from "@shared/context/AuthContext";
import {
  updateNetworkingEvent,
  getNetworkingEvent,
  deleteNetworkingEvent,
} from "@shared/services/dbMappers";

interface Props {
  event: Record<string, any>;
  onChanged?: () => void;
}

export default function EventCard({ event, onChanged }: Props) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [fetched, setFetched] = useState<Record<string, any> | null>(null);

  const start = event.start_time ? new Date(String(event.start_time)) : null;
  const end = event.end_time ? new Date(String(event.end_time)) : null;

  function formatRange() {
    if (!start) return "";
    try {
      if (end) {
        return `${format(start, "Pp")} — ${format(end, "Pp")}`;
      }
      return format(start, "Pp");
    } catch {
      return String(event.start_time ?? "");
    }
  }

  const source = fetched ?? event;
  const startSrc = source?.start_time ? new Date(String(source.start_time)) : null;
  const endSrc = source?.end_time ? new Date(String(source.end_time)) : null;
  function formatRangeForSource() {
    if (!startSrc) return "";
    try {
      if (endSrc) return `${format(startSrc, "Pp")} — ${format(endSrc, "Pp")}`;
      return format(startSrc, "Pp");
    } catch {
      return String(source?.start_time ?? "");
    }
  }

  async function toggleAttended(next: boolean) {
    if (!user) return;
    try {
      await updateNetworkingEvent(user.id, event.id, { attended: next });
      onChanged?.();
      if (fetched) setFetched({ ...fetched, attended: next });
    } catch {
      // ignore
    }
  }

  async function loadEvent() {
    if (!user) return;
    if (!event?.id) return;
    try {
      const res = await getNetworkingEvent(user.id, String(event.id));
      if (!res.error) setFetched(res.data as Record<string, any> | null);
      else setFetched(event);
    } catch {
      setFetched(event);
    } finally {
    }
  }

  async function handleDelete() {
    if (!user) return;
    const ok = window.confirm("Delete this event? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteNetworkingEvent(user.id, event.id);
      onChanged?.();
      setOpen(false);
    } catch {
      // ignore
    }
  }

  function openDetails() {
    setOpen(true);
    loadEvent();
  }

  function closeDetails() {
    setOpen(false);
  }

  return (
    <>
      <Card onClick={openDetails} sx={{ cursor: "pointer" }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "background.paper", color: "text.primary" }}>
                <CalendarTodayIcon />
              </Avatar>

              <Box>
                <Typography variant="subtitle1">{event.name ?? "Untitled"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatRange()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.location ?? ""}
                </Typography>
              </Box>
            </Box>

            <Box>
              <FormCheckbox checked={Boolean(event.attended)} onChange={(v) => toggleAttended(v)} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>{source?.name ?? "Event Details"}</Box>
          <IconButton size="small" onClick={closeDetails}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
            <Tab label="Info" />
            <Tab label="Connections" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {tab === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1, pr: 2 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Name</Typography>
                        <Typography variant="body2">{source?.name ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Industry</Typography>
                        <Typography variant="body2">{source?.industry ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2">{source?.location ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">URL</Typography>
                        <Typography variant="body2">
                          {source?.url ? (
                            <a href={String(source.url)} target="_blank" rel="noreferrer">{String(source.url)}</a>
                          ) : (
                            "-"
                          )}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Start</Typography>
                        <Typography variant="body2">{formatRangeForSource().split(' — ')[0] || "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">End</Typography>
                        <Typography variant="body2">{formatRangeForSource().includes(' — ') ? formatRangeForSource().split(' — ')[1] : (source?.end_time ? formatRangeForSource() : "-")}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Goals</Typography>
                        <Typography variant="body2">{source?.goals ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Research Notes</Typography>
                        <Typography variant="body2">{source?.research_notes ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Preparation Notes</Typography>
                        <Typography variant="body2">{source?.preparation_notes ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Attended</Typography>
                        <Typography variant="body2">{source?.attended ? "Yes" : "No"}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  </Box>

                {/* Controls placed under the info list */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>

                  <Box>
                    <AddEvent
                      initial={fetched ?? event}
                      editId={String(event.id)}
                      onSaved={async () => {
                        await loadEvent();
                        onChanged?.();
                      }}
                    >
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label="edit">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </AddEvent>

                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label="delete" onClick={handleDelete}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

              </Box>
            )}

            {tab === 1 && (
              <Box>
                <EventContacts eventId={source?.id} eventName={source?.name} />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Box sx={{ flex: 1 }} />
        </DialogActions>
      </Dialog>
    </>
  );
}

function FormCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
      />
      <Typography variant="subtitle2">Attended</Typography>
    </Stack>
  );
}
//This is a card component that will display information about a networking event
//It should show the event name, date, location, and a brief description
//It should also have buttons to edit or delete the event, edit will open the dialog to update the event (all fields)
//Delete will remove the event after opening a confirmation dialog 
//There should also be a checkbox to mark if the user attended the event or not (this will update attended in the network_events tables)