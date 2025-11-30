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
import aiClient from "@shared/services/ai/client";
import { useJobsPipeline } from "@job_pipeline/hooks/useJobsPipeline";
import { pipelineService } from "@job_pipeline/services";
import { useAuth } from "@shared/context/AuthContext";

type Interview = {
  id: string;
  title: string;
  interviewer?: string;
  type: "phone" | "video" | "in-person";
  start: string; // ISO
  end: string; // ISO
  reminderMinutes?: number;
  location?: string; // address or video link
  linkedJob?: string; // job id or title
  notes?: string;
  status: "scheduled" | "cancelled" | "completed";
  outcome?: string;
};

const STORAGE_KEY = "sgt:interviews";

function uid(prefix = "i") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function InterviewScheduling() {
  const [interviews, setInterviews] = useState<Interview[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Interview[]) : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [type, setType] = useState<Interview["type"]>("video");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState<number>(45);
  const [reminder, setReminder] = useState<number>(30);
  const [location, setLocation] = useState<string>("");
  const [linkedJob, setLinkedJob] = useState<string>("");
  const [linkedJobSelect, setLinkedJobSelect] = useState<string>("");
  const [linkedJobOther, setLinkedJobOther] = useState<string>("");

  const { allJobs, loading: jobsLoading, refreshJobs } = useJobsPipeline();
  const { user } = useAuth();
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

  const [thankYouDialog, setThankYouDialog] = useState<{
    open: boolean;
    text: string;
  }>({ open: false, text: "" });

  // reminders stored separately so we can trigger notifications
  const REMINDERS_KEY = "sgt:interview_reminders";

  useEffect(() => {
    // schedule any upcoming reminders for the current session
    try {
      const raw = localStorage.getItem(REMINDERS_KEY);
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      for (const r of list) {
        scheduleReminderTimeout(r);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleReminderTimeout(rem: any) {
    const when = new Date(rem.when).getTime();

  // ensure job list loaded for the linked-job dropdown
  useEffect(() => {
    try {
      refreshJobs();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    const now = Date.now();
    const ms = when - now;
    if (ms <= 0) return; // already past
    // set a timeout for the reminder (best-effort; will only fire while tab open)
    setTimeout(() => {
      tryNotify(`Upcoming interview: ${rem.title}`, rem.message || "Reminder");
    }, ms);
  }

  function tryNotify(title: string, body: string) {
    // show in-app snackbar and browser notification if permitted
    setSnack({ open: true, msg: `${title} — ${body}`, sev: "info" });
    if ((window as any).Notification) {
      try {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") new Notification(title, { body });
          });
        }
      } catch {}
    }
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  }, [interviews]);

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
                location,
                linkedJob,
              }
            : iv
        )
      );
        // notify calendar/widgets that interviews changed
        try {
          window.dispatchEvent(new CustomEvent("interviews-updated"));
        } catch {}
      setSnack({ open: true, msg: "Interview rescheduled", sev: "success" });
      setEditingId(null);
      // If edited interview now links to a job id, try to move it to Interview stage
      try {
        const linked = linkedJob || "";
        const jobIdNum = Number(linked);
        if (linked && !Number.isNaN(jobIdNum) && user) {
          (async () => {
            try {
              const res = await pipelineService.moveJob(user.id, jobIdNum, "Interview");
              if (!res.error) {
                window.dispatchEvent(new CustomEvent("jobs-updated"));
                try { refreshJobs(); } catch {}
                setSnack({ open: true, msg: "Linked job moved to Interview column", sev: "success" });
              }
            } catch (e) {
              console.error("Failed to move linked job to Interview stage", e);
            }
          })();
        }
      } catch (e) {}
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
        location,
        linkedJob,
        status: "scheduled",
      };
      setInterviews((cur) => [newIv, ...cur]);
      // notify calendar/widgets that interviews changed
      try {
        window.dispatchEvent(new CustomEvent("interviews-updated"));
      } catch {}
      setSnack({ open: true, msg: "Interview scheduled", sev: "success" });

      // schedule standard reminders: 24 hours and 2 hours before
      try {
        const remsRaw = localStorage.getItem(REMINDERS_KEY);
        const rems = remsRaw ? (JSON.parse(remsRaw) as any[]) : [];
        const add = (minsBefore: number, label: string) => {
          const when = new Date(s.getTime() - minsBefore * 60000);
          if (when.getTime() > Date.now()) {
            const r = {
              id: `${newIv.id}-rem-${minsBefore}`,
              interviewId: newIv.id,
              title: newIv.title,
              when: when.toISOString(),
              message: `${label} reminder for interview starting at ${new Date(newIv.start).toLocaleString()}`,
            };
            rems.push(r);
            scheduleReminderTimeout(r);
          }
        };
        add(24 * 60, "24 hour");
        add(2 * 60, "2 hour");
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(rems));
      } catch {}
      // auto-generate and show prep tasks
      try {
        const tasks = generatePrepTasks(newIv);
        setPrepDialog({ open: true, tasks, title: newIv.title });
      } catch {}
      // If this interview is linked to a tracked job id, move that job to Interview stage
      try {
        const jobIdNum = Number(newIv.linkedJob);
        if (newIv.linkedJob && !Number.isNaN(jobIdNum) && user) {
          (async () => {
            try {
              const res = await pipelineService.moveJob(user.id, jobIdNum, "Interview");
              if (!res.error) {
                // notify pipeline components to refresh
                window.dispatchEvent(new CustomEvent("jobs-updated"));
                try { refreshJobs(); } catch {}
                setSnack({ open: true, msg: "Linked job moved to Interview column", sev: "success" });
              }
            } catch (e) {
              console.error("Failed to move linked job to Interview stage", e);
            }
          })();
        }
      } catch (e) {}
    }

    // reset form
    setTitle("");
    setInterviewer("");
    setType("video");
    setStart("");
    setDuration(45);
    setReminder(30);
    setNotes("");
    setLocation("");
    setLinkedJob("");
    setLinkedJobSelect("");
    setLinkedJobOther("");
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
    setLocation((iv as any).location ?? "");
    const linked = (iv as any).linkedJob ?? "";
    // If linked matches a job id in allJobs, select it; otherwise use Other
    if (linked && allJobs && allJobs.find((j: any) => String(j.id) === String(linked))) {
      setLinkedJobSelect(String(linked));
      setLinkedJob(String(linked));
      setLinkedJobOther("");
    } else if (linked) {
      setLinkedJobSelect("__other__");
      setLinkedJob(String(linked));
      setLinkedJobOther(String(linked));
    } else {
      setLinkedJobSelect("");
      setLinkedJob("");
      setLinkedJobOther("");
    }
  }

  function cancelInterview(id: string) {
    setInterviews((cur) =>
      cur.map((iv) => (iv.id === id ? { ...iv, status: "cancelled" } : iv))
    );
    try { window.dispatchEvent(new CustomEvent("interviews-updated")); } catch {}
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
    try { window.dispatchEvent(new CustomEvent("interviews-updated")); } catch {}
    setOutcomeDialog({ open: false });
    setSnack({ open: true, msg: "Interview outcome recorded", sev: "success" });
    // Add a follow-up action: send thank-you note (due next day)
    try {
      const followupsRaw = localStorage.getItem("sgt:interview_followups");
      const followups = followupsRaw ? (JSON.parse(followupsRaw) as any[]) : [];
      const iv = interviews.find((x) => x.id === id);
      if (iv) {
        followups.push({
          id: `fu-${id}`,
          interviewId: id,
          title: `Send thank-you note: ${iv.title}`,
          due: new Date(new Date(iv.start).getTime() + 24 * 3600 * 1000).toISOString(),
          done: false,
        });
        localStorage.setItem("sgt:interview_followups", JSON.stringify(followups));
      }
    } catch {}
  }

  async function generateThankYou(iv: Interview) {
    // Build an immediate generic thank-you template so the user has something to send right away.
    const when = new Date(iv.start).toLocaleDateString();
    const interviewer = iv.interviewer ? `Hi ${iv.interviewer},\n\n` : "Hello,\n\n";
    const company = iv.linkedJob ? ` for the ${iv.linkedJob} role` : "";
    const localTemplate = `${interviewer}Thank you for taking the time to speak with me on ${when} about the ${iv.title}${company}. I appreciated learning more about the team and the role, and I'm excited about the possibility of contributing my skills. Please let me know if you'd like any additional information.\n\nBest regards,\n`;

    // Show the template in a dialog and copy to clipboard
    try {
      setThankYouDialog({ open: true, text: localTemplate });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(localTemplate);
        setSnack({ open: true, msg: "Thank-you note copied to clipboard", sev: "success" });
      } else {
        // fallback: prompt
        try {
          window.prompt("Copy thank-you note:", localTemplate);
          setSnack({ open: true, msg: "Thank-you note ready (copy using prompt)", sev: "info" });
        } catch {
          setSnack({ open: true, msg: "Thank-you note ready", sev: "info" });
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Optionally attempt to fetch an AI-polished note and replace the dialog text when available
    (async () => {
      try {
        const payload = await aiClient.postJson("/api/generate/cover-letter", {
          jobTitle: iv.title,
          company: iv.linkedJob || undefined,
          interviewer: iv.interviewer || undefined,
          tone: "thank-you",
        } as any);
        const aiText = (payload as any)?.text ?? (payload as any)?.content ?? null;
        if (aiText) {
          setThankYouDialog((s) => ({ ...s, text: String(aiText) }));
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(String(aiText));
              setSnack({ open: true, msg: "AI thank-you note copied to clipboard", sev: "success" });
            }
          } catch {}
        }
      } catch (e) {
        // ignore AI failure — user already has a template
        console.debug("AI thank-you generation failed", e);
      }
    })();
  }

  function removeInterview(id: string) {
    setInterviews((cur) => cur.filter((iv) => iv.id !== id));
    try { window.dispatchEvent(new CustomEvent("interviews-updated")); } catch {}
    setSnack({ open: true, msg: "Interview removed", sev: "info" });
  }

  // Download .ics calendar file
  function downloadICS(iv: Interview) {
    const dtStart =
      new Date(iv.start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd =
      new Date(iv.end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Scrum-and-Get-it//EN\nBEGIN:VEVENT\nUID:${
      iv.id
    }\nDTSTAMP:${dtStart}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${
      iv.title
    }\nDESCRIPTION:${(iv.notes || "") + (iv.linkedJob ? `\\nJob: ${iv.linkedJob}` : "")}\nLOCATION:${(iv as any).location || ""}\nEND:VEVENT\nEND:VCALENDAR`;
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
    const details = encodeURIComponent((iv.notes || "") + (iv.linkedJob ? `\nJob: ${iv.linkedJob}` : ""));
    const location = encodeURIComponent((iv as any).location || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(
      startISO
    )}/${fmt(endISO)}&details=${details}&location=${location}`;
  }

  function outlookCalendarLink(iv: Interview) {
    // Simple Outlook web compose link
    const start = new Date(iv.start).toISOString();
    const end = new Date(iv.end).toISOString();
    const subject = encodeURIComponent(iv.title);
    const body = encodeURIComponent((iv.notes || "") + (iv.linkedJob ? `\nJob: ${iv.linkedJob}` : ""));
    const location = encodeURIComponent((iv as any).location || "");
    // Outlook deep link
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}&startdt=${start}&enddt=${end}&location=${location}`;
  }

  function generatePrepTasks(iv: Interview) {
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
                onChange={(e) => setType(e.target.value as Interview["type"])}
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
            <TextField
              label="Location / Video link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{ minWidth: 240 }}
            />
            <FormControl sx={{ minWidth: 260 }} size="small">
              <InputLabel id="linked-job-select-label">Linked Job</InputLabel>
              <Select
                labelId="linked-job-select-label"
                value={linkedJobSelect}
                label="Linked Job"
                onChange={(e) => {
                  const v = e.target.value as string;
                  setLinkedJobSelect(v);
                  if (v === "__other__") {
                    setLinkedJob("");
                  } else {
                    setLinkedJob(String(v));
                    setLinkedJobOther("");
                  }
                }}
              >
                <MenuItem value="">None</MenuItem>
                {(!jobsLoading && Array.isArray(allJobs) ? allJobs : []).map((j: any) => (
                  <MenuItem key={j.id} value={String(j.id)}>
                    {`${j.job_title ?? j.title ?? "Job"} — ${j.company_name ?? ""}`}
                  </MenuItem>
                ))}
                <MenuItem value="__other__">Other (free text)</MenuItem>
              </Select>
            </FormControl>
            {linkedJobSelect === "__other__" ? (
              <TextField
                label="Linked Job (free text)"
                value={linkedJobOther}
                onChange={(e) => {
                  setLinkedJobOther(e.target.value);
                  setLinkedJob(e.target.value);
                }}
                sx={{ minWidth: 220 }}
                size="small"
              />
            ) : null}
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
                    : `${iv.interviewer || ""} • ${iv.notes ?? ""}${(iv as any).linkedJob ? ` • Job: ${(iv as any).linkedJob}` : ""}${(iv as any).location ? ` • ${((iv as any).location)}` : ""}`
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
                <IconButton
                  onClick={() => downloadICS(iv)}
                  aria-label="download ics"
                >
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
                        <Button
                          size="small"
                          onClick={() => window.open(outlookCalendarLink(iv), "_blank")}
                        >
                          Add to Outlook
                        </Button>
                        {iv.location ? (
                          <Button size="small" onClick={() => window.open(iv.location, "_blank")}>
                            Open location
                          </Button>
                        ) : null}
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
            <Button
              onClick={() => outcomeDialog.item && generateThankYou(outcomeDialog.item)}
            >
              Generate Thank-you
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
                    window.prompt("Copy tasks:", text);
                  }
                } catch {
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

        {/* Thank-you dialog */}
        <Dialog
          open={thankYouDialog.open}
          onClose={() => setThankYouDialog({ open: false, text: "" })}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Thank-you note</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={thankYouDialog.text}
              onChange={(e) => setThankYouDialog((s) => ({ ...s, text: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={async () => {
                try {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(thankYouDialog.text);
                    setSnack({ open: true, msg: "Thank-you note copied to clipboard", sev: "success" });
                  } else {
                    window.prompt("Copy thank-you note:", thankYouDialog.text);
                  }
                } catch {
                  setSnack({ open: true, msg: "Failed to copy thank-you note", sev: "error" });
                }
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setThankYouDialog({ open: false, text: "" })}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
        >
          <Alert
            severity={snack.sev ?? "info"}
            onClose={() => setSnack({ ...snack, open: false })}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
