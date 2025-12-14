import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useCoreJobs } from "@shared/cache";
import RightDrawer from "@shared/components/common/RightDrawer";
import JobDetails from "../JobDetails/JobDetails";

type JobRow = {
  id: number | string;
  job_title?: string | null;
  company_name?: string | null;
  application_deadline?: string | null;
  city_name?: string | null;
  state_code?: string | null;
  job_status?: string | null;
};

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

export default function NextDeadlinesWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );

  const coreJobsQuery = useCoreJobs<JobRow>(user?.id, {
    enabled: !!user?.id,
    staleTimeMs: 5 * 60 * 1000,
  });

  const jobs = useMemo(() => {
    const rows = coreJobsQuery.data ?? [];

    // Only include jobs that are still 'Interested' (we care about deadlines only before applying)
    return rows
      .filter(
        (r) =>
          r.application_deadline &&
          String(r.job_status ?? "").toLowerCase() === "interested"
      )
      .slice()
      .sort((a, b) => {
        const da = a.application_deadline
          ? new Date(String(a.application_deadline)).getTime()
          : Infinity;
        const db = b.application_deadline
          ? new Date(String(b.application_deadline)).getTime()
          : Infinity;
        return da - db;
      })
      .slice(0, 5);
  }, [coreJobsQuery.data]);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Next 5 Deadlines
      </Typography>
      <Divider sx={{ mb: 1 }} />
      {coreJobsQuery.isLoading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : jobs.length === 0 ? (
        <Typography color="text.secondary">No upcoming deadlines</Typography>
      ) : (
        <List dense disablePadding>
          {jobs.map((j) => {
            const title = String(j.job_title ?? "Untitled");
            const company = String(j.company_name ?? "Unknown");
            const dl = j.application_deadline
              ? new Date(String(j.application_deadline))
              : null;
            const days = dl ? daysUntil(dl) : null;
            return (
              <ListItem
                key={String(j.id)}
                sx={{ py: 0.5, cursor: "pointer" }}
                onClick={() => {
                  setSelectedJobId(j.id);
                  setOpen(true);
                }}
              >
                <ListItemText
                  primary={title}
                  secondary={`${company}${
                    j.city_name ? ` · ${j.city_name}` : ""
                  }`}
                />
                {days !== null && (
                  <Chip
                    label={days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d`}
                    color={
                      deadlineColor(days) as "success" | "warning" | "error"
                    }
                    size="small"
                  />
                )}
              </ListItem>
            );
          })}
        </List>
      )}
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
