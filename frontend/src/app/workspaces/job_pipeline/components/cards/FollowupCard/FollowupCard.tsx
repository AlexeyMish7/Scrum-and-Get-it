import { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface JobRecord {
  id?: number | string;
  job_title?: string;
  company_name?: string;
  job_status?: string;
  created_at?: string;
  status_changed_at?: string;
}

type FollowupState = "pending" | "snoozed" | "dismissed" | "completed";

interface FollowupItem {
  id: string;
  jobId: number;
  jobTitle?: string;
  company?: string;
  scheduledAt: string; // ISO
  stage: string; // e.g., Applied, Interview
  status: FollowupState;
  attempts: number;
  aiTemplate?: string;
  responseReceived?: boolean;
  lastSentAt?: string;
}

const LIB_KEY = "jobs:followups";

function genId(prefix = "f") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateTemplate(stage: string, job: JobRecord) {
  const title = job.job_title || "the role";
  const company = job.company_name || "the company";
  if (String(stage).toLowerCase() === "applied") {
    return `Hi ${company},\n\nI recently applied for ${title} and wanted to follow up on my application. I'm very interested and would love to hear about next steps.\n\nBest regards,\n[Your Name]`;
  }
  if (String(stage).toLowerCase() === "interview") {
    return `Hi ${company},\n\nThank you for speaking with me about ${title}. I enjoyed our conversation and wanted to follow up on next steps. Please let me know if you need any additional information.\n\nBest,\n[Your Name]`;
  }
  return `Hi ${company},\n\nJust checking in on ${title}. Looking forward to hearing from you.\n\nThanks,\n[Your Name]`;
}

export default function FollowupCard({ jobs }: { jobs: JobRecord[] }) {
  const [items, setItems] = useState<FollowupItem[]>(() => {
    try {
      const raw = localStorage.getItem(LIB_KEY);
      return raw ? (JSON.parse(raw) as FollowupItem[]) : [];
    } catch {
      return [];
    }
  });

  const [openTemplate, setOpenTemplate] = useState<FollowupItem | null>(null);
  const [editBody, setEditBody] = useState("");

  // Helper: persist
  const persist = (next: FollowupItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(next));
    } catch {}
  };

  // Open Gmail compose with prefilled subject/body
  function openGmailCompose(to: string | null, subject: string, body: string) {
    const q = new URLSearchParams();
    if (to) q.set("to", to);
    q.set("su", subject || "");
    q.set("body", body || "");
    const url = `https://mail.google.com/mail/?view=cm&fs=1&${q.toString()}`;
    window.open(url, "_blank");
  }

  // Auto-schedule followups for jobs that are missing one
  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    const next = [...items];
    let changed = false;

    const existingJobIds = new Set(next.map((it) => Number(it.jobId)));

    for (const j of jobs) {
      const jobId = Number((j as any).id ?? (j as any).job_id ?? NaN);
      if (!Number.isFinite(jobId) || jobId === 0) continue;

      const statusRaw = (j as any).job_status ?? (j as any).status ?? "";
      const status = String(statusRaw).toLowerCase();
      if (status === "rejected") {
        // remove any pending followups for rejected jobs
        const filtered = next.filter((it) => Number(it.jobId) !== jobId);
        if (filtered.length !== next.length) {
          changed = true;
          next.length = 0;
          next.push(...filtered);
        }
        continue;
      }

      if (existingJobIds.has(jobId)) continue;

      // determine stage and base date
      const stage = (j as any).job_status ?? (j as any).status ?? "Applied";
      const createdRaw = (j as any).created_at ?? (j as any).createdAt ?? new Date().toISOString();
      const statusChanged = (j as any).status_changed_at ?? (j as any).statusChangedAt;
      let baseDate = new Date(createdRaw);
      if (String(stage).toLowerCase() === "interview" && statusChanged) baseDate = new Date(statusChanged);

      const deltaDays = String(stage).toLowerCase() === "applied" ? 7 : String(stage).toLowerCase() === "interview" ? 3 : 10;
      const scheduled = new Date(baseDate);
      scheduled.setDate(scheduled.getDate() + deltaDays);

      const item: FollowupItem = {
        id: genId(),
        jobId,
        jobTitle: (j as any).job_title ?? (j as any).title ?? "",
        company: (j as any).company_name ?? (j as any).company ?? "",
        scheduledAt: scheduled.toISOString(),
        stage: String(stage),
        status: "pending",
        attempts: 0,
        aiTemplate: generateTemplate(String(stage), j as any),
        responseReceived: false,
      };

      next.push(item);
      existingJobIds.add(jobId);
      changed = true;
    }

    if (changed) persist(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const due = useMemo(() => {
    const now = new Date();
    return items.filter((it) => (new Date(it.scheduledAt) <= now) && (it.status === "pending" || it.status === "snoozed"));
  }, [items]);

  function updateItem(updated: FollowupItem) {
    const next = items.map((it) => (it.id === updated.id ? updated : it));
    persist(next);
  }

  function dismiss(item: FollowupItem) {
    updateItem({ ...item, status: "dismissed" });
  }

  function markComplete(item: FollowupItem) {
    updateItem({ ...item, status: "completed" });
  }

  function snooze(item: FollowupItem, days = 3) {
    const nextDate = new Date(item.scheduledAt);
    nextDate.setDate(nextDate.getDate() + days);
    updateItem({ ...item, scheduledAt: nextDate.toISOString(), status: "snoozed" });
  }

  function markSent(item: FollowupItem) {
    const now = new Date().toISOString();
    const nextAttempts = (item.attempts || 0) + 1;
    // After sending, schedule next reminder in 7 days if not completed
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    updateItem({ ...item, attempts: nextAttempts, lastSentAt: now, scheduledAt: nextDate.toISOString(), status: "snoozed" });
  }

  function markResponded(item: FollowupItem) {
    updateItem({ ...item, responseReceived: true, status: "completed" });
  }

  function openTemplateFor(item: FollowupItem) {
    setOpenTemplate(item);
    setEditBody(item.aiTemplate || "");
  }

  function saveTemplateEdits() {
    if (!openTemplate) return;
    const updated = { ...openTemplate, aiTemplate: editBody } as FollowupItem;
    updateItem(updated);
    setOpenTemplate(null);
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Follow-ups</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${due.length} due`} color={due.length ? "error" : "default"} size="small" />
            <IconButton size="small" onClick={() => { setItems([]); localStorage.removeItem(LIB_KEY); }} title="Clear local followups">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <List>
          {items.map((it) => {
            const secondaryParts = [
              `Due: ${new Date(it.scheduledAt).toLocaleString()}`,
              `Stage: ${it.stage}`,
              `Status: ${it.status}`,
            ];
            if (it.lastSentAt) secondaryParts.push(`Sent: ${new Date(it.lastSentAt).toLocaleString()}`);
            if (it.responseReceived) secondaryParts.push(`Responded`);
            const secondaryText = secondaryParts.join(" • ");

            return (
              <ListItem key={it.id} divider>
                <ListItemText primary={`${it.jobTitle || "(role)"} - ${it.company || "(company)"}`} secondary={secondaryText} />
                <ListItemSecondaryAction>
                  <Button size="small" onClick={() => openTemplateFor(it)}>Template</Button>
                  <Button
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => {
                      const subject = `Follow-up on ${it.jobTitle || "your application"}`;
                      const body = it.aiTemplate || generateTemplate(it.stage, { id: it.jobId, job_title: it.jobTitle, company_name: it.company });
                      openGmailCompose(null, subject, body);
                    }}
                  >
                    Send
                  </Button>
                  <Button size="small" sx={{ ml: 1 }} onClick={() => markSent(it)}>Sent</Button>
                  <Button size="small" color="success" sx={{ ml: 1 }} onClick={() => markResponded(it)}>Responded</Button>
                  <Button size="small" onClick={() => snooze(it, 3)} sx={{ ml: 1 }}>Snooze</Button>
                  <Button size="small" color="success" onClick={() => markComplete(it)} sx={{ ml: 1 }}>Done</Button>
                  <IconButton size="small" color="error" onClick={() => dismiss(it)} sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        <Typography variant="caption" color="text.secondary">Etiquette tip: Keep follow-ups brief, reference the role, and offer next steps or availability.</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          How due dates work: follow-ups are auto-scheduled from the job record - for new applications we schedule the first follow-up after 7 days; if the job moves to an interview stage we schedule sooner (typically 3 days after the stage change). Sending a follow-up records the send time and snoozes the next reminder by 7 days.
        </Typography>
      </Stack>

      <Dialog open={!!openTemplate} onClose={() => setOpenTemplate(null)} fullWidth maxWidth="sm">
        <DialogTitle>Follow-up Template</DialogTitle>
        <DialogContent>
          <TextField label="Email body" multiline minRows={8} fullWidth value={editBody} onChange={(e) => setEditBody(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplate(null)}>Cancel</Button>
          <Button onClick={() => {
            if (!openTemplate) return;
            const subject = `Follow-up on ${openTemplate.jobTitle || 'your application'}`;
            openGmailCompose(null, subject, editBody);
          }}>Send</Button>
          <Button variant="contained" onClick={saveTemplateEdits}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
