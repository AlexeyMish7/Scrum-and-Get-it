import { useEffect, useState } from "react";
import { Box, Typography, Chip, IconButton, Stack } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";
import RightDrawer from "@shared/components/common/RightDrawer";
import JobDetails from "../JobDetails/JobDetails";

type JobRow = { id: number | string; job_title?: string; application_deadline?: string; job_status?: string };

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysUntil(date: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((+b - +a) / msPerDay);
}

function deadlineColor(days: number | null) {
  if (days === null) return "default";
  if (days <= 0) return "error";
  if (days <= 7) return "error";
  if (days <= 14) return "warning";
  return "success";
}

export default function DeadlineCalendar() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id) return;
      try {
        const userCrud = withUser(user.id);
  const res = await userCrud.listRows<JobRow>("jobs", "id, job_title, application_deadline, job_status");
  if (!mounted) return;
  // Only care about deadlines for jobs we're still "Interested" in (not applied/archived)
  const rows = (res.data ?? []).filter((r) => r.application_deadline && String(r.job_status ?? "").toLowerCase() === "interested");
        setJobs(rows);
      } catch (e) {
        setJobs([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const now = new Date();
  const display = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = display.getFullYear();
  const month = display.getMonth();
  const days = daysInMonth(year, month);
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  // Group jobs by date string YYYY-MM-DD
  const jobsByDate = new Map<string, JobRow[]>();
  for (const j of jobs) {
    if (!j.application_deadline) continue;
    const d = new Date(String(j.application_deadline));
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = jobsByDate.get(key) ?? [];
    arr.push(j);
    jobsByDate.set(key, arr);
  }

  function dayKey(dayNum: number) {
    return `${year}-${month}-${dayNum}`;
  }

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">Deadlines Calendar</Typography>
        <Box>
          <IconButton size="small" onClick={() => setMonthOffset((m) => m - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setMonthOffset((m) => m + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'left' }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <Box key={d} sx={{ fontSize: 12, color: 'text.secondary', p: 0.5 }}>{d}</Box>
        ))}

        {/* blank slots for days before month starts */}
        {Array.from({ length: firstDayWeekday }).map((_, i) => (
          <Box key={`blank-${i}`} sx={{ minHeight: 64, p: 0.5, border: '1px dashed transparent' }} />
        ))}

        {Array.from({ length: days }).map((_, idx) => {
          const dayNum = idx + 1;
          const key = dayKey(dayNum);
          const list = jobsByDate.get(key) ?? [];
          const dateObj = new Date(year, month, dayNum);
          const isToday = isSameDate(dateObj, new Date());

          return (
            <Box
              key={key}
              sx={{
                minHeight: 64,
                p: 0.5,
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'divider',
                borderRadius: 0.5,
                position: 'relative',
                bgcolor: list.length ? 'action.hover' : 'transparent'
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{dayNum}</Typography>

              {list.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {list.map((j) => {
                    const dl = j.application_deadline ? new Date(String(j.application_deadline)) : null;
                    const days = dl ? daysUntil(dl) : null;
                    return (
                      <Chip
                        key={String(j.id)}
                        label={String(j.job_title ?? 'Untitled')}
                        size="small"
                        onClick={() => {
                          setSelectedJobId(j.id);
                          setOpen(true);
                        }}
                        color={deadlineColor(days) as any}
                        sx={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>
      <RightDrawer
        title="Job details"
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedJobId(null);
        }}
      >
        <JobDetails jobId={selectedJobId} />
      </RightDrawer>
    </Box>
  );
}
