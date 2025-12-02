import { useState, useRef, useEffect } from "react";

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
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { format } from "date-fns";
import AddEvent from "./AddEvent";
import EventContacts from "./EventContacts";
import { useAuth } from "@shared/context/AuthContext";
import {
  updateNetworkingEvent,
  getNetworkingEvent,
  deleteNetworkingEvent,
} from "@shared/services/dbMappers";
import { createContact } from "@shared/services/dbMappers";
import { aiClient } from "@shared/services/ai/client";
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface Props {
  event: Record<string, any>;
  onChanged?: () => void;
}

export default function EventCard({ event, onChanged }: Props) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [fetched, setFetched] = useState<Record<string, any> | null>(null);
  const [suggestions, setSuggestions] = useState<Array<Record<string, any>>>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const savedResultsRef = useRef<Array<Record<string, any>> | null>(null);

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
    // Clear persisted suggestions when the dialog fully closes
    try {
      const key = `event_suggestions:${event?.id ?? 'unknown'}`;
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
    savedResultsRef.current = null;
    setSuggestions([]);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadEventSuggestions() {
    setSuggestionError(null);
    setSuggestionLoading(true);
    try {
      const payload = {
        event_name: source?.name ?? event?.name ?? null,
        url: source?.url ?? event?.url ?? null,
        description: source?.description ?? event?.description ?? null,
      };

      const raw = await aiClient.postJson<unknown>("/api/generate/event-contacts", payload).catch((e) => {
        console.error("event contacts ai error", e);
        return null;
      });

      if (!mountedRef.current) return;

      const resp = raw as { suggestions?: Array<any> } | null | undefined;
      if (resp?.suggestions && Array.isArray(resp.suggestions)) {
        const mapped = resp.suggestions as any[];
        // keep in-memory while dialog is open
        savedResultsRef.current = mapped;
        setSuggestions(mapped);
        try {
          const key = `event_suggestions:${event?.id ?? 'unknown'}`;
          sessionStorage.setItem(key, JSON.stringify(mapped));
        } catch {
          // ignore storage errors
        }
      } else {
        setSuggestions([]);
      }
    } catch (err: any) {
      if (mountedRef.current) setSuggestionError(err?.message ?? String(err));
    } finally {
      if (mountedRef.current) setSuggestionLoading(false);
    }
  }

  async function createContactFromSuggestion(s: Record<string, any>) {
    if (!user) {
      window.alert("Please sign in to create contacts");
      return;
    }
    try {
      setSuggestionLoading(true);
      // If AI returned a full name, split into first/last for the contact create.
      const full = String(s.name ?? "").trim();
      const parts = full.split(/\s+/);
      const first = parts.length > 0 ? parts.shift() ?? null : null;
      const last = parts.length > 0 ? parts.join(" ") : null;
      const payload: Record<string, unknown> = {
        first_name: first || null,
        last_name: last || null,
        role: s.title ?? null,
        company: s.org ?? source?.name ?? event?.name ?? null,
        notes: [s.reason, s.referenceUrl].filter(Boolean).join("\n") || null,
      };
      const res = await createContact(user.id, payload as any);
      if (res?.error) {
        window.alert(res.error?.message ?? "Failed to create contact");
      } else {
        onChanged?.();
        window.alert("Contact created");
      }
    } catch (e: any) {
      console.error("create contact failed", e);
      window.alert(String(e?.message ?? e));
    } finally {
      if (mountedRef.current) setSuggestionLoading(false);
    }
  }

  // Load persisted suggestions from sessionStorage when dialog opens
  useEffect(() => {
    if (!open) return;
    try {
      const key = `event_suggestions:${event?.id ?? 'unknown'}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          savedResultsRef.current = parsed;
          setSuggestions(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [open, event?.id]);

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
            <Tab label="Suggested Connections" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {tab === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1, pr: 2 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Name</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.name ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Industry</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.industry ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.location ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">URL</Typography>
                        {source?.url ? (
                          <Typography
                            component="a"
                            href={String(source.url)}
                            target="_blank"
                            rel="noreferrer"
                            variant="body2"
                            sx={{ display: 'inline-block', overflowWrap: 'anywhere', wordBreak: 'break-all', whiteSpace: 'normal' }}
                          >
                            {String(source.url)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>-</Typography>
                        )}
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Start</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{formatRangeForSource().split(' — ')[0] || "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">End</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{formatRangeForSource().includes(' — ') ? formatRangeForSource().split(' — ')[1] : (source?.end_time ? formatRangeForSource() : "-")}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Goals</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.goals ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Research Notes</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.research_notes ?? "-"}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Preparation Notes</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{source?.preparation_notes ?? "-"}</Typography>
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
            {tab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    AI-suggested speakers and leaders for this event.
                  </Typography>
                  <Button size="small" variant="contained" onClick={() => loadEventSuggestions()} disabled={suggestionLoading}>
                    {suggestionLoading ? <CircularProgress size={16} color="inherit" /> : 'Generate Suggestions'}
                  </Button>
                </Box>

                {suggestionError && (
                  <Typography color="error" sx={{ mb: 1 }}>{suggestionError}</Typography>
                )}

                {!suggestionLoading && suggestions.length === 0 && !suggestionError && (
                  <Typography color="text.secondary">No suggestions yet.</Typography>
                )}

                {suggestions.length > 0 && (
                  <List>
                    {suggestions.map((s, i) => (
                      <ListItem key={`ev-sugg-${i}`} divider>
                        <ListItemText
                          primary={
                            <>
                              <Box component="span" sx={{ fontWeight: 600 }}>{s.name}</Box>
                              {s.title ? <Box component="span">{` — ${s.title}`}</Box> : null}
                              {s.org ? <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{s.org}</Box> : null}
                            </>
                          }
                          secondary={s.reason}
                          sx={{ mr: 12, overflowWrap: 'anywhere' }}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 0.5 }}>
                            {s.referenceUrl ? (
                              <Tooltip key="ref" title="Open reference">
                                <IconButton size="small" onClick={() => window.open(String(s.referenceUrl), '_blank')}>
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}

                            {s.searchQuery ? (
                              <Tooltip key="search" title="Open search">
                                <IconButton size="small" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(s.searchQuery ?? '')}`, '_blank')}>
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}

                            <Tooltip key="copy" title="Copy">
                              <IconButton size="small" onClick={() => navigator.clipboard?.writeText(`${s.name}${s.title ? ` — ${s.title}` : ''}${s.referenceUrl ? ` \n${s.referenceUrl}` : ''}`)}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip key="add" title="Add to contacts">
                              <IconButton size="small" onClick={() => createContactFromSuggestion(s)}>
                                <PersonAddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
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