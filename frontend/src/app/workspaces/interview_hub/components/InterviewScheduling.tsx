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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import aiClient from "@shared/services/ai/client";
import { useJobsPipeline } from "@job_pipeline/hooks/useJobsPipeline";
import { pipelineService } from "@job_pipeline/services";
import { useAuth } from "@shared/context/AuthContext";
import { createPreparationActivity } from "@shared/services/dbMappers";

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

  const [checklistDialog, setChecklistDialog] = useState<{
    open: boolean;
    items: { id: string; text: string; done: boolean; meta?: any }[];
    interviewId?: string | null;
    title?: string;
  }>({ open: false, items: [], interviewId: null });

  const [followupDialog, setFollowupDialog] = useState<{
    open: boolean;
    templates: { id: string; title: string; subject: string; body: string; suggestedDays?: number; category?: string }[];
    interviewId?: string | null;
    title?: string;
  }>({ open: false, templates: [], interviewId: null });

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
      try {
        const checklist = generatePrepChecklist(newIv);
        saveChecklistForInterview(newIv.id, checklist);
        // asynchronously enrich checklist with AI suggestions (non-blocking)
        (async () => {
          try {
            await enrichChecklistWithAI(newIv, newIv.id, checklist);
          } catch {}
        })();
      } catch {}
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
        
        // Save prep tasks to database for pattern recognition
        if (user?.id && tasks.length > 0) {
          const linkedJobId = newIv.linkedJob ? Number(newIv.linkedJob) : null;
          const daysBeforeInterview = Math.ceil((s.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          createPreparationActivity(user.id, {
            activity_type: "interview_prep",
            job_id: linkedJobId && !isNaN(linkedJobId) ? linkedJobId : null,
            activity_description: `Interview prep for: ${newIv.title}`,
            time_spent_minutes: 0, // Will be updated when tasks completed
            completion_quality: null,
            days_before_application: daysBeforeInterview > 0 ? daysBeforeInterview : null,
            activity_date: new Date(),
            notes: `Prep tasks generated: ${tasks.join("; ")}`,
          }).catch(err => {
            console.error("Failed to save prep activity to database:", err);
          });
        }
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

  // Follow-up persistence and tracking (localStorage)
  function saveFollowupRecord(record: any) {
    try {
      const raw = localStorage.getItem("sgt:interview_followups");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      arr.push(record);
      localStorage.setItem("sgt:interview_followups", JSON.stringify(arr));
      try { window.dispatchEvent(new CustomEvent("interview-followups-updated")); } catch {}
    } catch (e) {
      console.error("Failed to save followup record", e);
    }
  }

  function updateFollowupRecord(id: string, patch: Partial<any>) {
    try {
      const raw = localStorage.getItem("sgt:interview_followups");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
        localStorage.setItem("sgt:interview_followups", JSON.stringify(arr));
        try { window.dispatchEvent(new CustomEvent("interview-followups-updated")); } catch {}
      }
    } catch (e) {
      console.error("Failed to update followup", e);
    }
  }

  function loadFollowupsForInterview(interviewId: string) {
    try {
      const raw = localStorage.getItem("sgt:interview_followups");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      return arr.filter((x) => x.interviewId === interviewId);
    } catch {
      return [];
    }
  }

  function getFollowupStats(interviewId: string) {
    const all = loadFollowupsForInterview(interviewId);
    const sent = all.filter((f) => f.sentAt).length;
    const responded = all.filter((f) => f.respondedAt).length;
    const rate = sent ? Math.round((responded / sent) * 100) : 0;
    return { total: all.length, sent, responded, responseRate: rate };
  }

  // Generate follow-up templates locally, personalized from interview
  function generateFollowupTemplates(iv: Interview) {
    const company = (() => {
      try { const match = allJobs?.find((j: any) => String(j.id) === String(iv.linkedJob)); return match?.company_name ?? (iv.linkedJob || ""); } catch { return iv.linkedJob || ""; }
    })();
    const interviewer = iv.interviewer || "";
    const when = new Date(iv.start).toLocaleDateString();
    const convo = iv.notes ? `${iv.notes}` : "our conversation";
    const baseName = interviewer ? `Hi ${interviewer},` : "Hello,";

    const templates = [] as any[];

    // Thank-you (1 day)
    templates.push({
      id: uid("fu"),
      title: "Thank-you note (prompt)",
      subject: `Thank you — ${iv.title}${company ? ` at ${company}` : ""}`,
      body: `${baseName}\n\nThank you for speaking with me on ${when} about the ${iv.title}${company ? ` at ${company}` : ""}. I enjoyed ${convo} and appreciated learning more about the team and the role. I'm excited about the opportunity to contribute and would be happy to provide any additional information.\n\nBest regards,\n`,
      suggestedDays: 1,
      category: "thank-you",
    });

    // Company summary / prep reminder (immediate)
    templates.push({
      id: uid("fu"),
      title: "Company summary & talking points",
      subject: `Company notes — ${company || iv.title}`,
      body: `Company: ${company || "(company)"}\nSuggested talking points: 1) ... 2) ... 3) ...\nUse these to reference during follow-ups or future conversations.`,
      suggestedDays: 0,
      category: "company-summary",
    });

    // Status inquiry (7 days)
    templates.push({
      id: uid("fu"),
      title: "Status inquiry (polite)",
      subject: `Checking in on ${iv.title} — ${company || ""}`,
      body: `${baseName}\n\nI hope you're well. I wanted to check in about the ${iv.title}${company ? ` role at ${company}` : ""} and see if there is any update on the hiring timeline. I remain very interested and am happy to provide additional details if helpful.\n\nBest,\n`,
      suggestedDays: 7,
      category: "status-inquiry",
    });

    // Feedback request (after completed)
    templates.push({
      id: uid("fu"),
      title: "Feedback request",
      subject: `Request for interview feedback — ${iv.title}`,
      body: `${baseName}\n\nThank you again for the opportunity to interview for the ${iv.title}${company ? ` at ${company}` : ""}. If you have a moment, I'd appreciate any feedback you can share about my interview performance so I can continue improving. Thank you for your time.\n\nSincerely,\n`,
      suggestedDays: 2,
      category: "feedback",
    });

    // Networking follow-up (rejection) template
    templates.push({
      id: uid("fu"),
      title: "Networking follow-up (after rejection)",
      subject: `Thanks for the update — staying in touch`,
      body: `${baseName}\n\nThank you for letting me know the outcome. I appreciate the chance to interview and would welcome staying in touch for future opportunities. If appropriate, could we connect on LinkedIn or I can follow the team updates?\n\nBest regards,\n`,
      suggestedDays: 1,
      category: "networking",
    });

    return templates;
  }

  // Send follow-up: copy to clipboard and open mailto (best-effort)
  async function sendFollowupTemplate(interviewId: string, tpl: any) {
    try {
      const record = {
        id: tpl.id,
        interviewId,
        title: tpl.title,
        subject: tpl.subject,
        body: tpl.body,
        createdAt: new Date().toISOString(),
        sentAt: null,
        respondedAt: null,
        category: tpl.category,
      };
      // copy body to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(tpl.body);
        }
      } catch {}
      // open Gmail compose in a new tab (falls back to mailto if blocked)
      try {
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent((tpl.to || ""))}&su=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.body)}`;
        // Try opening Gmail; if popup blocked or user prefers default mail client, fallback to mailto
        const win = window.open(gmail, "_blank");
        if (!win) {
          const mailto = `mailto:${encodeURIComponent((tpl.to || ""))}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.body)}`;
          window.open(mailto, "_blank");
        }
      } catch {
        try {
          const mailto = `mailto:${encodeURIComponent((tpl.to || ""))}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.body)}`;
          window.open(mailto, "_blank");
        } catch {}
      }

      // mark sent
      record.sentAt = new Date().toISOString();
      saveFollowupRecord(record);
      setSnack({ open: true, msg: "Follow-up prepared and copied to clipboard (use your mail client to send)", sev: "success" });
      return record;
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to prepare follow-up", sev: "error" });
    }
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

  // Generate a richer pre-interview checklist tailored to role and company
  function generatePrepChecklist(iv: Interview) {
    const idBase = iv.id;
    const items: { id: string; text: string; done: boolean; meta?: any }[] = [];

    // derive job/company details if linked to a tracked job
    let jobTitle = iv.title || "";
    let companyName = "";
    let industry = "";
    try {
      const match = allJobs?.find((j: any) => String(j.id) === String(iv.linkedJob));
      if (match) {
        jobTitle = jobTitle || match.job_title || "";
        companyName = match.company_name || "";
        industry = match.industry || "";
      } else if (iv.linkedJob && typeof iv.linkedJob === "string") {
        // if linkedJob is free-text company name, capture it
        companyName = String(iv.linkedJob);
      }
    } catch {}

    // role-specific: extract keywords and create focused tasks
    const keywords = (jobTitle || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0,4);
    items.push({ id: `${idBase}-jd`, text: `Review the job description for "${jobTitle}" and map your experience to requirements`, done: false });
    items.push({ id: `${idBase}-star`, text: "Prepare 3 STAR stories tailored to the role (focus on impact and metrics)", done: false });

    // technical / role-specific suggestions
    const titleStr = jobTitle.toLowerCase();
    if (/engineer|developer|software|backend|frontend|full-?stack/.test(titleStr)) {
      items.push({ id: `${idBase}-algos`, text: `Practice relevant algorithms/data-structures problems (focus on ${keywords[0] || 'core topics'})`, done: false });
      items.push({ id: `${idBase}-coding-setup`, text: "Set up coding environment and test screen-sharing; rehearse typing/communication while solving", done: false });
    }
    if (/designer|ux|ui|product designer/.test(titleStr)) {
      items.push({ id: `${idBase}-portfolio-design`, text: "Prepare portfolio walkthrough and examples that match the role's responsibilities", done: false });
    }
    if (/product|pm|product manager/.test(titleStr)) {
      items.push({ id: `${idBase}-product-sense`, text: "Prepare product-sense examples and prioritize metrics-driven examples", done: false });
    }

    // Company research
    if (companyName) {
      items.push({ id: `${idBase}-research`, text: `Research ${companyName}: mission, recent news, product updates and competitors`, done: false });
      items.push({ id: `${idBase}-questions`, text: "Prepare 5 thoughtful, company-specific questions to ask the interviewer", done: false });
    } else {
      items.push({ id: `${idBase}-research`, text: "Research the company & team: mission, recent news, products, and competitors", done: false });
      items.push({ id: `${idBase}-questions`, text: "Prepare 5 thoughtful questions to ask the interviewer", done: false });
    }

    // Attire suggestion based on simple heuristics
    let attire = "Business casual";
    try {
      if (industry && /finance|bank|legal|consult/i.test(String(industry))) attire = "Formal / Professional";
      else if (industry && /tech|software|startup/i.test(String(industry))) attire = "Casual / Smart casual";
      else if (companyName && /startup|early stage|venture/i.test(String(companyName).toLowerCase())) attire = "Casual / Smart casual";
    } catch {}
    items.push({ id: `${idBase}-attire`, text: `Suggested attire: ${attire}`, done: false, meta: { attire } });

    // Logistics
    items.push({ id: `${idBase}-logistics-time`, text: `Confirm date & time and time zone`, done: false });
    items.push({ id: `${idBase}-logistics-location`, text: `Verify location / video link: ${(iv as any).location || "(add link)"}`, done: false });
    items.push({ id: `${idBase}-tech-check`, text: "Test technology: camera, mic, screen sharing, internet", done: false });

    // Confidence activities
    items.push({ id: `${idBase}-confidence-1`, text: "Do a 5-minute breathing exercise before the interview", done: false });
    items.push({ id: `${idBase}-confidence-2`, text: "Run a 20-minute mock interview (record or time-box answers)", done: false });

    // Portfolio / samples
    if (/designer|product|pm|product manager/.test(titleStr)) {
      items.push({ id: `${idBase}-portfolio`, text: "Prepare portfolio or product artifacts and links (test they open)", done: false });
    } else if (/engineer|developer|software/.test(titleStr)) {
      items.push({ id: `${idBase}-portfolio`, text: "Prepare code samples, repos, and deployment links (ensure they open)", done: false });
    } else {
      items.push({ id: `${idBase}-portfolio`, text: "Prepare work samples or case examples to reference during interview", done: false });
    }

    // Post-interview follow up (checkbox triggers creating follow-up reminder)
    items.push({ id: `${idBase}-post-followup`, text: "Create post-interview follow-up task (thank-you note) — schedule for next day", done: false, meta: { postFollowup: true } });

    // include generated-from metadata as a hidden item (helps detect changes later)
    items.push({ id: `${idBase}-__meta`, text: JSON.stringify({ jobTitle, companyName, industry, generatedAt: new Date().toISOString() }), done: true, meta: { internal: true } });

    return items;
  }

  function saveChecklistForInterview(interviewId: string, items: { id: string; text: string; done: boolean; meta?: any }[]) {
    try {
      const raw = localStorage.getItem("sgt:interview_prep");
      const map = raw ? (JSON.parse(raw) as Record<string, any>) : {};
      // store object with items + meta for future compatibility
      map[interviewId] = { items, meta: { savedAt: new Date().toISOString() } };
      localStorage.setItem("sgt:interview_prep", JSON.stringify(map));
      // notify other components
      try { window.dispatchEvent(new CustomEvent("interviews-updated")); } catch {}
    } catch (e) {
      console.error("Failed to save checklist", e);
    }
  }

  function loadChecklistForInterview(interviewId: string, iv?: Interview) {
    try {
      const raw = localStorage.getItem("sgt:interview_prep");
      const map = raw ? (JSON.parse(raw) as Record<string, any>) : {};
      const entry = map[interviewId];
      if (!entry) return null;
      // backward-compat: if entry is array, return it
      if (Array.isArray(entry)) return entry;
      // entry expected to be { items, meta }
      if (entry.items && Array.isArray(entry.items)) {
        // if iv provided, check meta in the generated __meta item to see if job/title changed; if changed, regenerate
        if (iv) {
          try {
            const metaItem = entry.items.find((x: any) => String(x.id || "").endsWith("__meta"));
            if (metaItem && metaItem.text) {
              const data = JSON.parse(metaItem.text);
              const currentTitle = iv.title || "";
              const linkedJobName = (() => {
                try {
                  const match = allJobs?.find((j: any) => String(j.id) === String(iv.linkedJob));
                  return match?.company_name ?? (iv.linkedJob ? String(iv.linkedJob) : "");
                } catch { return iv.linkedJob ?? ""; }
              })();
              if (data.jobTitle !== currentTitle || (data.companyName || "") !== (linkedJobName || "")) {
                // regenerate fresh checklist to reflect role/company change
                const newChecklist = generatePrepChecklist(iv);
                saveChecklistForInterview(interviewId, newChecklist);
                return newChecklist;
              }
            }
          } catch {}
        }
        return entry.items;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Asynchronously ask the AI to enrich a generated checklist (non-blocking)
  async function enrichChecklistWithAI(iv: Interview, interviewId: string, currentItems: { id: string; text: string; done: boolean; meta?: any }[]) {
    try {
      // prepare a compact prompt payload
      const jobTitle = iv.title || "";
      const linkedJobName = (() => {
        try {
          const match = allJobs?.find((j: any) => String(j.id) === String(iv.linkedJob));
          return match?.company_name ?? (iv.linkedJob ? String(iv.linkedJob) : "");
        } catch {
          return iv.linkedJob ?? "";
        }
      })();
      const industry = (() => {
        try {
          const match = allJobs?.find((j: any) => String(j.id) === String(iv.linkedJob));
          return match?.industry ?? "";
        } catch { return ""; }
      })();

      const payload = {
        jobTitle,
        company: linkedJobName || undefined,
        industry: industry || undefined,
        interviewType: iv.type,
        roleHints: jobTitle,
        maxItems: 6,
      } as any;

      const res = await aiClient.postJson("/api/generate/checklist", payload);
      // expect either { items: string[] } or { text: string }
      let aiLines: string[] = [];
      if (!res) return;
      if (Array.isArray((res as any).items)) {
        aiLines = (res as any).items.map((s: any) => String(s).trim()).filter(Boolean);
      } else if ((res as any).text) {
        aiLines = String((res as any).text).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      } else if ((res as any).content) {
        aiLines = String((res as any).content).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      }

      if (!aiLines.length) aiLines = [];

      // prepare container to collect AI items
      const aiItems: { id: string; text: string; done: boolean }[] = [];

      // dedupe against existing visible items
      const existingSet = new Set(currentItems.map((x) => String(x.text || "").toLowerCase().trim()));
      for (let i = 0; i < aiLines.length; i++) {
        const l = aiLines[i];
        if (!existingSet.has(l.toLowerCase())) {
          aiItems.push({ id: `${interviewId}-ai-${Date.now()}-${i}`, text: l, done: false });
        }
      }

      // If we have a linked company, try to fetch a concise company research summary and add it as checklist items
      const linked = linkedJobName;
      if (linked) {
        try {
          const research = await aiClient.postJson("/api/generate/company-research", { companyName: linked } as any);
          const content = (research as any)?.content;

          // helper to safely extract text from various shapes
          const extractText = (v: any): string => {
            if (!v && v !== 0) return "";
            if (typeof v === "string") return v;
            if (Array.isArray(v)) return v.map(extractText).filter(Boolean).join(" ");
            if (typeof v === "object") {
              // prefer common text fields
              if (typeof v.text === "string") return v.text;
              if (typeof v.summary === "string") return v.summary;
              if (typeof v.description === "string") return v.description;
              // fall back to joining object values that are strings
              const vals = Object.values(v).map(extractText).filter(Boolean);
              return vals.join(" ");
            }
            return String(v);
          };

          let summaryText = "";
          if (!content) {
            summaryText = (research as any)?.preview ?? (research as any)?.text ?? "";
          } else if (typeof content === "string") {
            summaryText = content;
          } else {
            const parts: string[] = [];
            const tryFields = ["mission", "insights", "culture", "news", "summary"];
            for (const f of tryFields) {
              if (content[f]) {
                const t = extractText(content[f]);
                if (t) parts.push(t);
              }
            }
            // fallback to top-level string fields
            if (!parts.length) {
              if (content.company) parts.push(extractText(content.company));
              if (content.overview) parts.push(extractText(content.overview));
            }
            summaryText = parts.join(" — ").trim();
          }

          if (summaryText) {
            // compact to short snippet
            const compact = summaryText.replace(/\s+/g, " ").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0, 3).join(" ");
            const companyItem = `Company summary for ${linked}: ${compact}`;
            if (!existingSet.has(companyItem.toLowerCase())) {
              // place company summary near the front but after the job-description item later
              aiItems.unshift({ id: `${interviewId}-company-${Date.now()}`, text: companyItem, done: false });
            }
            // also add a suggested preparatory action referencing deeper research
            const deepItem = `Read full company research (summary above) and note 3 questions or talking points`;
            if (!existingSet.has(deepItem.toLowerCase())) {
              aiItems.splice(Math.min(1, aiItems.length), 0, { id: `${interviewId}-company-ask-${Date.now()}`, text: deepItem, done: false });
            }
          }
        } catch (e) {
          // ignore research failures; AI enrichment still proceeds
          console.debug("company research fetch failed", e);
        }
      }

      if (!aiItems.length) return;

      // insert AI items after the job-description item (second bullet) if present,
      // otherwise before __meta, otherwise append
      const copy = [...currentItems];
      const jdIdx = copy.findIndex((x) => String(x.id || "") === `${interviewId}-jd`);
      if (jdIdx >= 0) {
        copy.splice(jdIdx + 1, 0, ...aiItems);
      } else {
        const metaIdx = copy.findIndex((x) => String(x.id || "").endsWith("__meta"));
        if (metaIdx >= 0) {
          copy.splice(metaIdx, 0, ...aiItems);
        } else {
          copy.push(...aiItems);
        }
      }

      // persist and update dialog if still open for this interview
      saveChecklistForInterview(interviewId, copy);
      setChecklistDialog((s) => (s.interviewId === interviewId ? { ...s, items: copy } : s));
      setSnack({ open: true, msg: "Checklist enhanced with role/company-specific suggestions", sev: "success" });
    } catch (e) {
      // ignore failures silently, keep base checklist
      console.debug("AI checklist enrichment failed", e);
    }
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
                        {/* Prep Tasks button removed per UX request */}
                        <Button
                          size="small"
                          onClick={() => {
                            // load or generate checklist (pass iv so loader can detect job/title changes)
                            const existing = loadChecklistForInterview(iv.id, iv as Interview);
                            const items = existing ?? generatePrepChecklist(iv);
                            setChecklistDialog({ open: true, items, interviewId: iv.id, title: iv.title });
                            // enrich checklist asynchronously with AI suggestions
                            (async () => {
                              try {
                                await enrichChecklistWithAI(iv as Interview, iv.id, items);
                              } catch {}
                            })();
                          }}
                        >
                          Prep Checklist
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            const templates = generateFollowupTemplates(iv);
                            setFollowupDialog({ open: true, templates, interviewId: iv.id, title: iv.title });
                          }}
                        >
                          Follow-ups
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

        {/* Prep Checklist dialog */}
        <Dialog
          open={checklistDialog.open}
          onClose={() => setChecklistDialog({ open: false, items: [], interviewId: null })}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Preparation Checklist{checklistDialog.title ? ` — ${checklistDialog.title}` : ""}</DialogTitle>
          <DialogContent>
            <List>
              {checklistDialog.items
                .filter((it) => !(it.meta && it.meta.internal) && !String(it.id).endsWith("__meta"))
                .map((it, idx) => (
                <ListItem key={it.id} disableGutters>
                  <FormControlLabel
                    control={<Checkbox checked={!!it.done} onChange={(e) => {
                      const copy = checklistDialog.items.map((x) => x.id === it.id ? { ...x, done: e.target.checked } : x);
                      setChecklistDialog((s) => ({ ...s, items: copy }));
                      // persist
                      if (checklistDialog.interviewId) saveChecklistForInterview(checklistDialog.interviewId, copy);
                      // handle post-followup creation when checked
                      if (it.meta && it.meta.postFollowup && e.target.checked) {
                        try {
                          const followupsRaw = localStorage.getItem("sgt:interview_followups");
                          const followups = followupsRaw ? (JSON.parse(followupsRaw) as any[]) : [];
                          followups.push({
                            id: `fu-${checklistDialog.interviewId}`,
                            interviewId: checklistDialog.interviewId,
                            title: `Send thank-you note: ${checklistDialog.title ?? "Interview"}`,
                            due: new Date(new Date().getTime() + 24 * 3600 * 1000).toISOString(),
                            done: false,
                          });
                          localStorage.setItem("sgt:interview_followups", JSON.stringify(followups));
                        } catch {}
                      }
                    }} />} label={<ListItemText primary={it.text} />} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
            <DialogActions>
            <Button onClick={() => {
              // mark all visible (non-internal) items as done, preserve internal meta items
              const copy = checklistDialog.items.map((x) => (x.meta && x.meta.internal) || String(x.id).endsWith("__meta") ? x : { ...x, done: true });
              if (checklistDialog.interviewId) saveChecklistForInterview(checklistDialog.interviewId, copy);
              setChecklistDialog({ open: false, items: [], interviewId: null });
            }}>Mark all done</Button>
            <Button onClick={() => setChecklistDialog({ open: false, items: [], interviewId: null })}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Follow-ups dialog */}
        <Dialog
          open={followupDialog.open}
          onClose={() => setFollowupDialog({ open: false, templates: [], interviewId: null })}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Follow-up Templates{followupDialog.title ? ` — ${followupDialog.title}` : ""}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Templates</Typography>
            <List>
              {followupDialog.templates.map((t, i) => (
                <ListItem key={t.id} sx={{ alignItems: 'flex-start', py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle1">{t.title}</Typography>
                    <TextField
                      label="Subject"
                      fullWidth
                      size="small"
                      value={t.subject}
                      onChange={(e) => {
                        const copy = followupDialog.templates.map((x) => x.id === t.id ? { ...x, subject: e.target.value } : x);
                        setFollowupDialog((s) => ({ ...s, templates: copy }));
                      }}
                      sx={{ mb: 0 }}
                    />
                    <TextField
                      label="Body"
                      fullWidth
                      multiline
                      minRows={3}
                      value={t.body}
                      onChange={(e) => {
                        const copy = followupDialog.templates.map((x) => x.id === t.id ? { ...x, body: e.target.value } : x);
                        setFollowupDialog((s) => ({ ...s, templates: copy }));
                      }}
                      sx={{ mb: 0 }}
                    />
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" onClick={async () => {
                        if (!followupDialog.interviewId) return;
                        await sendFollowupTemplate(followupDialog.interviewId, t);
                      }}>Send</Button>
                      <Button size="small" onClick={() => {
                        if (!followupDialog.interviewId) return;
                        const rec = { id: t.id, interviewId: followupDialog.interviewId, title: t.title, subject: t.subject, body: t.body, createdAt: new Date().toISOString(), sentAt: new Date().toISOString(), respondedAt: null, category: t.category };
                        saveFollowupRecord(rec);
                        setSnack({ open: true, msg: 'Follow-up recorded as sent', sev: 'success' });
                      }}>Mark sent</Button>
                      <Button size="small" onClick={() => {
                        if (!followupDialog.interviewId) return;
                        const existing = loadFollowupsForInterview(followupDialog.interviewId).filter((x:any)=>x.title===t.title).slice(-1)[0];
                        if (existing) {
                          updateFollowupRecord(existing.id, { respondedAt: new Date().toISOString() });
                        } else {
                          // create a new follow-up record and mark it as sent+responded
                          const now = new Date().toISOString();
                          const rec = { id: `${t.id}-${Date.now()}`, interviewId: followupDialog.interviewId, title: t.title, subject: t.subject, body: t.body, createdAt: now, sentAt: now, respondedAt: now, category: t.category };
                          saveFollowupRecord(rec);
                        }
                        setSnack({ open: true, msg: 'Marked as responded', sev: 'success' });
                      }}>Mark responded</Button>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Past follow-ups & stats</Typography>
            <Box sx={{ mt: 1 }}>
              {followupDialog.interviewId ? (
                (() => {
                  const stats = getFollowupStats(followupDialog.interviewId as string);
                  const recent = loadFollowupsForInterview(followupDialog.interviewId as string).slice(-8).reverse();
                  return (
                    <>
                      <Typography variant="body2">Sent: {stats.sent} • Responded: {stats.responded} • Response Rate: {stats.responseRate}%</Typography>
                      <List>
                        {recent.map((r: any) => (
                          <ListItem key={r.id} disableGutters sx={{ py: 1, alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={`${r.title} ${r.sentAt ? `• sent ${new Date(r.sentAt).toLocaleString()}`: ''} ${r.respondedAt ? `• responded ${new Date(r.respondedAt).toLocaleString()}`: ''}`}
                              secondary={r.subject}
                              secondaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
                            />
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              {!r.respondedAt ? <Button size="small" onClick={() => updateFollowupRecord(r.id, { respondedAt: new Date().toISOString() })}>Mark responded</Button> : null}
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  );
                })()
              ) : (
                <Typography variant="body2">Open an interview to view follow-up history.</Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFollowupDialog({ open: false, templates: [], interviewId: null })}>Close</Button>
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
