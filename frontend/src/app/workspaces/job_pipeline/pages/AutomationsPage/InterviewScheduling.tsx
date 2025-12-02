import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "@shared/context/AuthContext";
import { getUserStorage } from "@shared/utils/userStorage";
// CheckIcon not used yet

type Interview = {
  id: string;
  title: string;
  interviewer?: string;
  type: "phone" | "video" | "in-person";
  start: string; // ISO
  end: string; // ISO
  reminderMinutes?: number;
  notes?: string;
  status: "scheduled" | "cancelled" | "completed";
  outcome?: string;
};

const STORAGE_KEY = "interviews";

function uid(prefix = "i") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function InterviewScheduling() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [type, setType] = useState<Interview["type"]>("video");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState<number>(45);
  const [reminder, setReminder] = useState<number>(30);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev?: "success" | "info" | "error";
  }>({ open: false, msg: "" });
  const [outcomeDialog, setOutcomeDialog] = useState<{
    open: boolean;
    item?: Interview;
  }>({ open: false });
  const [prepDialog, setPrepDialog] = useState<{
    open: boolean;
    tasks: string[];
    title?: string;
  }>({ open: false, tasks: [] });

  // Load interviews from user-scoped storage when user becomes available
  useEffect(() => {
    if (!user?.id) return;
    const storage = getUserStorage(user.id);
    const stored = storage.get<Interview[]>(STORAGE_KEY, []);
    setInterviews(stored);
    setStorageLoaded(true);
  }, [user?.id]);

  // Persist interviews to user-scoped storage
  useEffect(() => {
    if (!user?.id || !storageLoaded) return;
    const storage = getUserStorage(user.id);
    storage.set(STORAGE_KEY, interviews);
    // Dispatch event so CalendarWidget can refresh
    window.dispatchEvent(new CustomEvent("interviews-updated"));
  }, [interviews, user?.id, storageLoaded]);

  function detectConflict(
    newStartISO: string,
    newEndISO: string,
    ignoreId?: string
  ) {
    const ns = new Date(newStartISO).getTime();
    const ne = new Date(newEndISO).getTime();
    return interviews.some((iv) => {
      if (ignoreId && iv.id === ignoreId) return false;
      if (iv.status === "cancelled") return false;
      const s = new Date(iv.start).getTime();
      const e = new Date(iv.end).getTime();
      return ns < e && ne > s; // overlap
    });
  }

  function scheduleInterview() {
    const trimmedTitle = title?.toString()?.trim?.() ?? "";
    const trimmedStart = start?.toString?.() ?? "";
    if (!trimmedTitle) {
      setSnack({
        open: true,
        msg: "Please provide a title for the interview.",
        sev: "info",
      });
      return;
    }
    if (!trimmedStart) {
      setSnack({
        open: true,
        msg: "Please provide a start date/time (use the picker).",
        sev: "info",
      });
      return;
    }
    const s = new Date(start);
    if (Number.isNaN(s.getTime())) {
      setSnack({
        open: true,
        msg: "Start date/time is invalid. Ensure you selected a date and time.",
        sev: "error",
      });
      return;
    }
    const e = new Date(s.getTime() + duration * 60000);
    const conflict = detectConflict(
      s.toISOString(),
      e.toISOString(),
      editingId ?? undefined
    );
    if (conflict) {
      setSnack({
        open: true,
        msg: "Conflict detected with another interview",
        sev: "error",
      });
      return;
    }

    if (editingId) {
      setInterviews((cur) =>
        cur.map((iv) =>
          iv.id === editingId
            ? {
                ...iv,
                title,
                interviewer,
                type,
                start: s.toISOString(),
                end: e.toISOString(),
                reminderMinutes: reminder,
                notes,
              }
            : iv
        )
      );
      setSnack({ open: true, msg: "Interview rescheduled", sev: "success" });
      setEditingId(null);
    } else {
      const newIv: Interview = {
        id: uid(),
        title,
        interviewer,
        type,
        start: s.toISOString(),
        end: e.toISOString(),
        reminderMinutes: reminder,
        notes,
        status: "scheduled",
      };
      setInterviews((cur) => [newIv, ...cur]);
      setSnack({ open: true, msg: "Interview scheduled", sev: "success" });
    }

    // reset form
    setTitle("");
    setInterviewer("");
    setType("video");
    setStart("");
    setDuration(45);
    setReminder(30);
    setNotes("");
  }

  function editInterview(id: string) {
    const iv = interviews.find((x) => x.id === id);
    if (!iv) return;
    setEditingId(iv.id);
    setTitle(iv.title);
    setInterviewer(iv.interviewer ?? "");
    setType(iv.type);
    setStart(new Date(iv.start).toISOString().slice(0, 16));
    setDuration(
      Math.round(
        (new Date(iv.end).getTime() - new Date(iv.start).getTime()) / 60000
      )
    );
    setReminder(iv.reminderMinutes ?? 30);
    setNotes(iv.notes ?? "");
  }

  function cancelInterview(id: string) {
    setInterviews((cur) =>
      cur.map((iv) => (iv.id === id ? { ...iv, status: "cancelled" } : iv))
    );
    setSnack({ open: true, msg: "Interview cancelled", sev: "info" });
  }

  function markCompleted(id: string) {
    const iv = interviews.find((x) => x.id === id);
    if (!iv) return;
    setOutcomeDialog({ open: true, item: iv });
  }

  function saveOutcome(outcomeText: string) {
    const id = outcomeDialog.item?.id;
    if (!id) return;
    setInterviews((cur) =>
      cur.map((iv) =>
        iv.id === id ? { ...iv, status: "completed", outcome: outcomeText } : iv
      )
    );
    setOutcomeDialog({ open: false });
    setSnack({ open: true, msg: "Interview outcome recorded", sev: "success" });
  }

  function removeInterview(id: string) {
    setInterviews((cur) => cur.filter((iv) => iv.id !== id));
    setSnack({ open: true, msg: "Interview removed", sev: "info" });
  }

  // simple ICS export (download)
  function downloadICS(iv: Interview) {
    const dtStart =
      new Date(iv.start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd =
      new Date(iv.end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Scrum-and-Get-it//EN\nBEGIN:VEVENT\nUID:${
      iv.id
    }\nDTSTAMP:${dtStart}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${
      iv.title
    }\nDESCRIPTION:${iv.notes || ""}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${iv.title.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function googleCalendarLink(iv: Interview) {
    const startISO = new Date(iv.start).toISOString();
    const endISO = new Date(iv.end).toISOString();
    const fmt = (d: string) => encodeURIComponent(d.replace(/-|:|\.\d+/g, ""));
    const text = encodeURIComponent(iv.title);
    const details = encodeURIComponent(iv.notes || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(
      startISO
    )}/${fmt(endISO)}&details=${details}`;
  }

  function generatePrepTasks(iv: Interview) {
    // create lightweight tasks based on interview type
    const tasks = [] as string[];
    tasks.push("Review job description and map experiences to requirements");
    tasks.push("Prepare 3 STAR stories relevant to the role");
    if (iv.type === "video" || iv.type === "phone") {
      tasks.push("Test your audio/video setup and environment");
    }
    if (iv.type === "video") {
      tasks.push("Practice a short coding demo or screen-share walkthrough");
    }
    if (iv.type === "in-person")
      tasks.push("Plan travel and arrive 10-15 minutes early");
    return tasks;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Interview Scheduling</Typography>
        </Stack>

        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Interviewer (name or email)"
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            fullWidth
          />

          <Stack
            direction="row"
            spacing={2}
            sx={{ flexWrap: "wrap", alignItems: "center" }}
          >
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value as any)}
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="in-person">In-person</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              sx={{ minWidth: 220 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Duration (min)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              sx={{ width: 140 }}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Reminder (minutes before)"
              type="number"
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              sx={{ width: 200 }}
            />
            <Button variant="contained" onClick={scheduleInterview}>
              {editingId ? "Reschedule" : "Schedule Interview"}
            </Button>
            {editingId && (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setStart("");
                }}
              >
                Cancel Edit
              </Button>
            )}
          </Stack>

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Scheduled Interviews
        </Typography>
        <List>
          {interviews.map((iv) => (
            <ListItem key={iv.id} sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={`${iv.title} — ${iv.type} — ${new Date(
                  iv.start
                ).toLocaleString()}`}
                secondary={
                  iv.status === "cancelled"
                    ? "Cancelled"
                    : iv.status === "completed"
                    ? `Completed: ${iv.outcome ?? ""}`
                    : `${iv.interviewer || ""} • ${iv.notes ?? ""}`
                }
              />

              <Box
                sx={{
                  ml: "auto",
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={() => editInterview(iv.id)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => downloadICS(iv)} aria-label="ics">
                  <EventAvailableIcon />
                </IconButton>
                <IconButton
                  onClick={() => removeInterview(iv.id)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>

                {iv.status === "scheduled" && (
                  <>
                    <Button size="small" onClick={() => markCompleted(iv.id)}>
                      Mark Completed
                    </Button>
                    <Button size="small" onClick={() => cancelInterview(iv.id)}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      onClick={() =>
                        window.open(googleCalendarLink(iv), "_blank")
                      }
                    >
                      Add to Google Calendar
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        const tasks = generatePrepTasks(iv);
                        setPrepDialog({ open: true, tasks, title: iv.title });
                      }}
                    >
                      Prep Tasks
                    </Button>
                  </>
                )}
              </Box>
            </ListItem>
          ))}
        </List>

        <Dialog
          open={outcomeDialog.open}
          onClose={() => setOutcomeDialog({ open: false })}
        >
          <DialogTitle>Record Interview Outcome</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Outcome notes"
              multiline
              minRows={3}
              onChange={(e) =>
                setOutcomeDialog((s) => ({
                  ...s,
                  item: s.item ? { ...s.item, notes: e.target.value } : s.item,
                }))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOutcomeDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                saveOutcome(
                  (outcomeDialog.item?.notes as unknown as string) ||
                    "Completed"
                )
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Prep tasks dialog */}
        <Dialog
          open={prepDialog.open}
          onClose={() => setPrepDialog({ open: false, tasks: [] })}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Preparation Tasks{prepDialog.title ? ` — ${prepDialog.title}` : ""}
          </DialogTitle>
          <DialogContent>
            <List>
              {prepDialog.tasks.map((t, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText primary={`• ${t}`} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={async () => {
                try {
                  const text = prepDialog.tasks.join("\n- ");
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    setSnack({
                      open: true,
                      msg: "Copied tasks to clipboard",
                      sev: "success",
                    });
                  } else {
                    // fallback: select and copy via prompt
                    window.prompt("Copy tasks:", text);
                  }
                } catch (e) {
                  setSnack({
                    open: true,
                    msg: "Failed to copy tasks",
                    sev: "error",
                  });
                }
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setPrepDialog({ open: false, tasks: [] })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
        >
          <Alert
            severity={(snack.sev as any) ?? "info"}
            onClose={() => setSnack({ ...snack, open: false })}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
