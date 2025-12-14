import { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import JobSearchFilters, {
  type JobFilters,
} from "../../components/search/JobSearchFilters/JobSearchFilters";
import JobCard from "../../components/cards/JobCard/JobCard";
import RightDrawer from "@shared/components/common/RightDrawer";
import JobDetails from "../../components/details/JobDetails/JobDetails";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useCoreJobs } from "@shared/cache/coreHooks";

/**
 * ViewArchivedJobs
 * Shows jobs where job_status = 'archive'. Supports searching/filtering
 * via the shared JobSearchFilters component (client-side filtering).
 */
export default function ViewArchivedJobs() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const jobsQuery = useCoreJobs<Record<string, unknown>>(user?.id);

  const [allJobs, setAllJobs] = useState<Record<string, unknown>[]>([]);
  const [visible, setVisible] = useState<Record<string, unknown>[]>([]);

  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;

    const rows = Array.isArray(jobsQuery.data) ? jobsQuery.data : [];
    // keep only archived jobs
    const archived = rows.filter(
      (r) => String(r.job_status ?? "").toLowerCase() === "archive"
    );

    if (!mounted) return;
    setAllJobs(archived);
    setVisible(archived);

    return () => {
      mounted = false;
    };
  }, [user?.id, jobsQuery.data]);

  function applyFilters(filters: JobFilters) {
    const f = filters ?? ({} as JobFilters);
    const filtered = allJobs.filter((r) => {
      // query
      if (f.query) {
        const q = String(f.query).toLowerCase();
        const hay = (
          String(r.job_title ?? r.title ?? "") +
          " " +
          String(r.company_name ?? r.company ?? "") +
          " " +
          String(r.job_description ?? "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.industry) {
        if (
          !String(r.industry ?? "")
            .toLowerCase()
            .includes(String(f.industry).toLowerCase())
        )
          return false;
      }
      if (f.location) {
        const loc = String(f.location).toLowerCase();
        const combined = (
          String(r.city_name ?? r.city ?? "") +
          " " +
          String(r.state_code ?? r.state ?? "") +
          " " +
          String(r.zipcode ?? "")
        ).toLowerCase();
        if (!combined.includes(loc)) return false;
      }
      if (f.salaryMin !== undefined && f.salaryMin !== "") {
        const val = Number(r.start_salary_range ?? r.start_salary ?? 0);
        if (isNaN(val) || val < Number(f.salaryMin)) return false;
      }
      if (f.salaryMax !== undefined && f.salaryMax !== "") {
        const val = Number(r.start_salary_range ?? r.start_salary ?? 0);
        if (isNaN(val) || val > Number(f.salaryMax)) return false;
      }
      if (f.deadlineFrom) {
        const d = r.application_deadline ?? r.applicationDeadline;
        if (!d) return false;
        if (new Date(String(d)) < new Date(f.deadlineFrom)) return false;
      }
      if (f.deadlineTo) {
        const d = r.application_deadline ?? r.applicationDeadline;
        if (!d) return false;
        if (new Date(String(d)) > new Date(f.deadlineTo)) return false;
      }
      return true;
    });

    // basic sort handling
    const sorted = filtered.sort((a, b) => {
      const dir = f.sortDir === "asc" ? 1 : -1;
      switch (f.sortBy) {
        case "deadline": {
          const da = a.application_deadline
            ? new Date(String(a.application_deadline)).getTime()
            : 0;
          const db = b.application_deadline
            ? new Date(String(b.application_deadline)).getTime()
            : 0;
          return (da - db) * dir;
        }
        case "salary": {
          const sa = Number(a.start_salary_range ?? 0);
          const sb = Number(b.start_salary_range ?? 0);
          return (sa - sb) * dir;
        }
        case "company": {
          const ca = String(a.company_name ?? "").localeCompare(
            String(b.company_name ?? "")
          );
          return ca * dir;
        }
        case "date_added":
        default: {
          const ta = a.created_at
            ? new Date(String(a.created_at)).getTime()
            : 0;
          const tb = b.created_at
            ? new Date(String(b.created_at)).getTime()
            : 0;
          return (ta - tb) * dir;
        }
      }
    });

    setVisible(sorted);
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Archived Jobs
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Only apply filters when the user clicks Apply. Do not use onChange for live filtering. */}
        <JobSearchFilters onApply={(f) => applyFilters(f)} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing {visible.length} archived job(s)
        </Typography>
      </Paper>

      <Box sx={{ mb: 2 }}>
        {visible.length === 0 ? (
          <Typography color="text.secondary">
            No archived jobs found.
          </Typography>
        ) : (
          visible.map((j) => (
            <JobCard
              key={String((j as any).id)}
              job={j}
              onOpen={(id) => {
                setSelectedJobId(id);
                setOpen(true);
              }}
            />
          ))
        )}
      </Box>

      <RightDrawer
        title="Job Details"
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
