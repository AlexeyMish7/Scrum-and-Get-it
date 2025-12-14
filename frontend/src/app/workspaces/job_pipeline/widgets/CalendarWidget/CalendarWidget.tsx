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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { coreKeys, useCoreJobs } from "@shared/cache";
import { getUserStorage } from "@shared/utils/userStorage";
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

type InterviewItem = {
  id: string | number;
  title?: string | null;
  start?: string | null;
  status?: string | null;
  // In some flows this may be a job id or a freeform label.
  linkedJob?: string | null;
  [key: string]: unknown;
};

type DeadlineEvent = {
  type: "job" | "interview";
  id: string | number;
  title?: string | null;
  company?: string | null;
  city?: string | null;
  deadline: Date;
};

type CalendarEvent =
  | ({ type: "job" } & JobRow)
  | ({ type: "interview" } & InterviewItem);

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
  const queryClient = useQueryClient();

  const coreJobsQuery = useCoreJobs<JobRow>(user?.id, {
    enabled: !!user?.id,
    staleTimeMs: 5 * 60 * 1000,
  });

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
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
    } catch (e) {
      void e;
      return true;
    }
  });

  // Persist expansion state
  useEffect(() => {
    try {
      localStorage.setItem("jobs:calendarExpanded", String(expanded));
    } catch (e) {
      // Ignore localStorage errors
      void e;
    }
  }, [expanded]);

  const jobs = useMemo(() => {
    const rows = coreJobsQuery.data ?? [];

    // Include jobs with deadlines in active statuses (not archived/rejected)
    const activeStatuses = new Set([
      "interested",
      "applied",
      "phone screen",
      "interview",
      "offer",
    ]);

    return rows.filter(
      (r) =>
        r.application_deadline &&
        activeStatuses.has(String(r.job_status ?? "").toLowerCase())
    );
  }, [coreJobsQuery.data]);

  // Load interviews from user-scoped localStorage
  const loadInterviews = useCallback(() => {
    try {
      const storage = getUserStorage(user?.id);
      const arr = storage.get<InterviewItem[]>("interviews", []);
      // keep only scheduled interviews (exclude cancelled)
      const scheduled = arr.filter((iv) => iv && iv.status !== "cancelled");
      setInterviews(scheduled);
    } catch (e) {
      void e;
      setInterviews([]);
    }
  }, [user?.id]);

  useEffect(() => {
    // Listen for interview updates from InterviewScheduling
    const handleInterviewsUpdated = () => {
      loadInterviews();
    };
    window.addEventListener(
      "interviews-updated",
      handleInterviewsUpdated as EventListener
    );

    // listen to storage events (other tabs) to keep interviews in sync
    const storage = getUserStorage(user?.id);
    const interviewsKey = storage.getFullKey("interviews");
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === interviewsKey) loadInterviews();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        "interviews-updated",
        handleInterviewsUpdated as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, [user?.id, queryClient, loadInterviews]);

  // Refresh jobs when drawer closes (job might have been updated)
  useEffect(() => {
    if (!drawerOpen) {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: coreKeys.jobs(user.id) });
    }
  }, [drawerOpen, user?.id, queryClient]);

  // Load interviews on mount and when user changes
  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  // Calculate current display month
  const now = new Date();
  const display = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = display.getFullYear();
  const month = display.getMonth();
  const days = daysInMonth(year, month);
  const firstDayWeekday = new Date(year, month, 1).getDay();

  // Get next 5 deadlines
  const upcomingDeadlines = useMemo(() => {
    const events: DeadlineEvent[] = [];

    for (const j of jobs) {
      if (!j.application_deadline) continue;
      const d = new Date(String(j.application_deadline));
      if (Number.isNaN(d.getTime())) continue;
      events.push({
        type: "job",
        id: j.id,
        title: j.job_title ?? null,
        company: j.company_name ?? null,
        city: j.city_name ?? null,
        deadline: d,
      });
    }

    for (const iv of interviews) {
      if (!iv.start) continue;
      const d = new Date(String(iv.start));
      if (Number.isNaN(d.getTime())) continue;
      events.push({
        type: "interview",
        id: iv.id,
        title: iv.title ?? null,
        company: iv.linkedJob ?? null,
        deadline: d,
      });
    }

    return events
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5);
  }, [jobs, interviews]);

  // Group events (jobs + interviews) by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const push = (d: Date, item: CalendarEvent) => {
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
                            deadlineColor(days) as
                              | "error"
                              | "warning"
                              | "success"
                          }
                          size="small"
                        />
                      )}
                    </ListItem>
                  );
                }

                // interview event: try to resolve linked job/company if it's an id
                let companyLabel = "";
                if (evt.company) {
                  const matched = jobs.find(
                    (j) => String(j.id) === String(evt.company)
                  );
                  if (matched) {
                    companyLabel = `${matched.company_name ?? ""}${
                      matched.job_title ? ` — ${matched.job_title}` : ""
                    }`;
                  } else {
                    companyLabel = String(evt.company);
                  }
                }
                return (
                  <ListItem
                    key={`iv-${String(evt.id)}`}
                    sx={{
                      py: 0.5,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => {
                      // lightweight: show details summary for interview
                      try {
                        const when = evt.deadline.toLocaleString();
                        window.alert(
                          `${evt.title ?? "Interview"}\n${when}${
                            companyLabel ? `\n${companyLabel}` : ""
                          }`
                        );
                      } catch (e) {
                        void e;
                      }
                    }}
                  >
                    <ListItemText
                      primary={String(evt.title ?? "Untitled")}
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
                          const when = item.start
                            ? new Date(item.start).toLocaleString()
                            : "";
                          // lightweight UI: show an alert with details for now
                          // NOTE: could be replaced with a drawer or navigation to the Interview Hub
                          window.alert(
                            `${t}\n${when}${
                              item.linkedJob
                                ? `\nLinked job: ${item.linkedJob}`
                                : ""
                            }`
                          );
                        } catch (e) {
                          void e;
                        }
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
