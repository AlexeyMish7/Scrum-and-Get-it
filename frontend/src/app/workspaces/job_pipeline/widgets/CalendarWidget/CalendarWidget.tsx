/**
 * CalendarWidget — Persistent calendar showing job deadlines
 *
 * Purpose: Display upcoming deadlines and monthly calendar across all views.
 * Always visible in right sidebar, collapsible with localStorage persistence.
 *
 * Contract:
 * - Inputs: None (fetches jobs internally based on authenticated user)
 * - Outputs: Calendar grid with deadline indicators, clickable jobs
 * - Interactions: Click job → open details drawer, collapse/expand widget
 */

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";
import RightDrawer from "@shared/components/common/RightDrawer";
import JobDetails from "@job_pipeline/components/details/JobDetails/JobDetails";

interface JobRow {
  id: number | string;
  job_title?: string | null;
  company_name?: string | null;
  application_deadline?: string | null;
  city_name?: string | null;
  state_code?: string | null;
  job_status?: string | null;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysUntil(date: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((+b - +a) / msPerDay);
}

function deadlineColor(days: number) {
  if (days <= 0) return "error";
  if (days <= 7) return "error";
  if (days <= 14) return "warning";
  return "success";
}

export default function CalendarWidget() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );

  // Collapsible state with localStorage persistence
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem("jobs:calendarExpanded");
      return stored !== null ? stored === "true" : true; // Default expanded
    } catch {
      return true;
    }
  });

  // Persist expansion state
  useEffect(() => {
    try {
      localStorage.setItem("jobs:calendarExpanded", String(expanded));
    } catch {
      // Ignore localStorage errors
    }
  }, [expanded]);

  // Load jobs with deadlines - refresh when drawer closes to pick up changes
  const loadJobs = async () => {
    if (!user?.id) return;
    try {
      const userCrud = withUser(user.id);
      const res = await userCrud.listRows<JobRow>(
        "jobs",
        "id, job_title, company_name, application_deadline, city_name, state_code, job_status",
        {
          order: { column: "application_deadline", ascending: true },
        }
      );

      // Include jobs with deadlines in active statuses (not archived/rejected)
      const activeStatuses = [
        "interested",
        "applied",
        "phone screen",
        "interview",
        "offer",
      ];
      const rows = (res.data ?? []).filter(
        (r) =>
          r.application_deadline &&
          activeStatuses.includes(String(r.job_status ?? "").toLowerCase())
      );
      setJobs(rows);
    } catch {
      setJobs([]);
    }
  };

  // Load interviews from localStorage (local scheduling persisted in InterviewScheduling)
  const loadInterviews = () => {
    try {
      const raw = localStorage.getItem("sgt:interviews");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      // keep only scheduled interviews (exclude cancelled)
      const scheduled = arr.filter((iv) => iv && iv.status !== "cancelled");
      setInterviews(scheduled);
    } catch {
      setInterviews([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await loadJobs();
    })();

    // Listen for job updates from other components
    const handleJobsUpdated = () => {
      if (mounted) loadJobs();
    };
    window.addEventListener("jobs-updated", handleJobsUpdated);
    // Listen for interview updates from InterviewScheduling
    const handleInterviewsUpdated = () => {
      if (mounted) loadInterviews();
    };
    window.addEventListener("interviews-updated", handleInterviewsUpdated as EventListener);

    // listen to storage events (other tabs) to keep interviews in sync
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "sgt:interviews") loadInterviews();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("jobs-updated", handleJobsUpdated);
      window.removeEventListener("interviews-updated", handleInterviewsUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  // Refresh jobs when drawer closes (job might have been updated)
  useEffect(() => {
    if (!drawerOpen) {
      loadJobs();
    }
  }, [drawerOpen]);

  // Load interviews on mount and when user changes
  useEffect(() => {
    loadInterviews();
  }, [user]);

  // Calculate current display month
  const now = new Date();
  const display = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = display.getFullYear();
  const month = display.getMonth();
  const days = daysInMonth(year, month);
  const firstDayWeekday = new Date(year, month, 1).getDay();

  // Get next 5 deadlines
  const upcomingDeadlines = useMemo(() => {
    const jobEvents = jobs
      .map((j) => ({
        type: "job",
        id: j.id,
        title: j.job_title,
        company: j.company_name,
        city: j.city_name,
        deadline: j.application_deadline ? new Date(String(j.application_deadline)) : null,
      }))
      .filter((j) => j.deadline);

    const interviewEvents = interviews
      .map((iv) => ({
        type: "interview",
        id: iv.id,
        title: iv.title,
        company: iv.linkedJob ?? null,
        deadline: iv.start ? new Date(String(iv.start)) : null,
      }))
      .filter((i) => i.deadline);

    return [...jobEvents, ...interviewEvents]
      .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime())
      .slice(0, 5);
  }, [jobs, interviews]);

  // Group events (jobs + interviews) by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    const push = (d: Date, item: any) => {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    };

    for (const j of jobs) {
      if (!j.application_deadline) continue;
      const d = new Date(String(j.application_deadline));
      push(d, { type: "job", ...j });
    }
    for (const iv of interviews) {
      if (!iv.start) continue;
      const d = new Date(String(iv.start));
      push(d, { type: "interview", ...iv });
    }
    return map;
  }, [jobs, interviews]);

  function dayKey(dayNum: number) {
    return `${year}-${month}-${dayNum}`;
  }

  function handleJobClick(jobId: string | number) {
    setSelectedJobId(jobId);
    setDrawerOpen(true);
  }

  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Paper
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      elevation={2}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarIcon color="primary" />
          <Typography variant="h6">Deadlines</Typography>
        </Stack>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Next 5 Deadlines */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Next 5 Deadlines
          </Typography>
          {upcomingDeadlines.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No upcoming deadlines
            </Typography>
          ) : (
            <List dense disablePadding sx={{ mb: 2 }}>
              {upcomingDeadlines.map((evt) => {
                const days = evt.deadline ? daysUntil(evt.deadline) : null;
                // Render differently for job deadlines vs interviews
                if (evt.type === "job") {
                  return (
                    <ListItem
                      key={`job-${String(evt.id)}`}
                      sx={{
                        py: 0.5,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => handleJobClick(evt.id)}
                    >
                      <ListItemText
                        primary={String(evt.title ?? "Untitled")}
                        secondary={`${evt.company ?? "Unknown"}${
                          evt.city ? ` · ${evt.city}` : ""
                        }`}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      {days !== null && (
                        <Chip
                          label={
                            days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d`
                          }
                          color={
                            deadlineColor(days) as "error" | "warning" | "success"
                          }
                          size="small"
                        />
                      )}
                    </ListItem>
                  );
                }

                // interview event
                const interview = evt as any;
                // try to resolve linked job/company if it's an id
                let companyLabel = "";
                if (interview.company) {
                  const matched = jobs.find((j) => String(j.id) === String(interview.company));
                  if (matched) {
                    companyLabel = `${matched.company_name ?? ""}${matched.job_title ? ` — ${matched.job_title}` : ""}`;
                  } else {
                    companyLabel = String(interview.company);
                  }
                }
                return (
                  <ListItem
                    key={`iv-${String(interview.id)}`}
                    sx={{
                      py: 0.5,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => {
                      // lightweight: show details summary for interview
                      try {
                        const when = interview.deadline ? interview.deadline.toLocaleString() : "";
                        window.alert(`${interview.title ?? "Interview"}\n${when}${companyLabel ? `\n${companyLabel}` : ""}`);
                      } catch {}
                    }}
                  >
                    <ListItemText
                      primary={String(interview.title ?? "Untitled")}
                      secondary={companyLabel}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    {days !== null && (
                      <Chip
                        label={
                          days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d`
                        }
                        color={
                          deadlineColor(days) as "error" | "warning" | "success"
                        }
                        size="small"
                      />
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Calendar Grid */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {monthName}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => setMonthOffset((m) => m - 1)}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setMonthOffset((m) => m + 1)}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.5,
              textAlign: "center",
            }}
          >
            {/* Day headers */}
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Box
                key={`header-${i}`}
                sx={{
                  fontSize: 11,
                  color: "text.secondary",
                  p: 0.5,
                  fontWeight: 600,
                }}
              >
                {d}
              </Box>
            ))}

            {/* Blank slots before month starts */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <Box key={`blank-${i}`} sx={{ minHeight: 32 }} />
            ))}

            {/* Calendar days */}
            {Array.from({ length: days }).map((_, idx) => {
              const dayNum = idx + 1;
              const key = dayKey(dayNum);
              const list = eventsByDate.get(key) ?? [];
              const dateObj = new Date(year, month, dayNum);
              const isToday = isSameDate(dateObj, new Date());

              return (
                <Box
                  key={key}
                  sx={{
                    minHeight: 32,
                    p: 0.5,
                    border: "1px solid",
                    borderColor: isToday ? "primary.main" : "divider",
                    borderRadius: 0.5,
                    bgcolor: list.length ? "action.hover" : "transparent",
                    cursor: list.length ? "pointer" : "default",
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 400,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": list.length
                      ? { bgcolor: "action.selected" }
                      : {},
                  }}
                  onClick={() => {
                    if (list.length === 1) {
                      const item = list[0];
                      if (item.type === "job") {
                        handleJobClick(item.id);
                      } else if (item.type === "interview") {
                        // For interviews, open a small summary or navigate to the Interview hub in future
                        try {
                          const t = item.title ?? "Interview";
                          const when = item.start ? new Date(item.start).toLocaleString() : "";
                          // lightweight UI: show an alert with details for now
                          // NOTE: could be replaced with a drawer or navigation to the Interview Hub
                          window.alert(`${t}\n${when}${item.linkedJob ? `\nLinked job: ${item.linkedJob}` : ""}`);
                        } catch {}
                      }
                    }
                  }}
                >
                  <Typography variant="caption" fontSize={11}>
                    {dayNum}
                  </Typography>
                  {list.length > 0 && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        mt: 0.25,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Collapse>

      {/* Job Details Drawer */}
      <RightDrawer
        title="Job Details"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedJobId(null);
        }}
      >
        <JobDetails jobId={selectedJobId} />
      </RightDrawer>
    </Paper>
  );
}
