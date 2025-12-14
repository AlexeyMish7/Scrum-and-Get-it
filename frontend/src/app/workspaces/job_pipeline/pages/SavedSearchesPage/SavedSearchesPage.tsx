import { Box, Typography, Paper } from "@mui/material";
import JobSearchFilters, {
  type JobFilters,
} from "../../components/search/JobSearchFilters/JobSearchFilters";
import JobCard from "../../components/cards/JobCard/JobCard";
import RightDrawer from "@shared/components/common/RightDrawer";
import JobDetails from "../../components/details/JobDetails/JobDetails";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useState, useEffect } from "react";
import { useCoreJobs } from "@shared/cache/coreHooks";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";

export default function SavedSearchesPage() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const jobsQuery = useCoreJobs<any>(user?.id);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[] | null>(null);
  const [allJobs, setAllJobs] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );

  // Load all non-archived jobs once when the page mounts so searches operate on local data
  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;

    const rows = Array.isArray(jobsQuery.data) ? jobsQuery.data : [];
    const filtered = rows.filter(
      (r) =>
        String(r.job_status ?? r.jobStatus ?? "").toLowerCase() !== "archive"
    );

    if (!mounted) return;
    setAllJobs(filtered);
    // Show all non-archived jobs by default when the page loads
    setMatchedJobs(filtered);
    setPreviewCount(filtered.length);

    return () => {
      mounted = false;
    };
  }, [user?.id, jobsQuery.data]);

  async function handleApply(filters: JobFilters) {
    if (!user) return handleError("Not signed in");
    try {
      // Prefer filtering from the cached allJobs; fallback to fetching if not loaded yet
      let rows = allJobs;
      if (!rows) {
        if (Array.isArray(jobsQuery.data)) {
          rows = jobsQuery.data;
        } else {
          const qc = getAppQueryClient();
          const cachedRows = await qc.ensureQueryData({
            queryKey: coreKeys.jobs(user.id),
            queryFn: () => fetchCoreJobs(user.id),
            staleTime: 60 * 60 * 1000,
          });
          rows = Array.isArray(cachedRows) ? (cachedRows as any[]) : [];
        }
      }
      // ensure we only search non-archived rows
      rows = rows.filter(
        (r) =>
          String(r.job_status ?? r.jobStatus ?? "").toLowerCase() !== "archive"
      );
      // simple client-side filter for preview: reuse a subset of the filtering rules
      const matched = rows.filter((r) => {
        if (filters.query) {
          const q = String(filters.query).toLowerCase();
          const hay = (
            String(r.job_title ?? r.title ?? "") +
            " " +
            String(r.company_name ?? r.company ?? "") +
            " " +
            String(r.job_description ?? "")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (
          filters.industry &&
          !String(r.industry ?? "")
            .toLowerCase()
            .includes(String(filters.industry).toLowerCase())
        )
          return false;
        if (filters.location) {
          const loc = String(filters.location).toLowerCase();
          const combined = (
            String(r.city_name ?? r.city ?? "") +
            " " +
            String(r.state_code ?? r.state ?? "") +
            " " +
            String(r.zipcode ?? "")
          ).toLowerCase();
          if (!combined.includes(loc)) return false;
        }
        return true;
      });
      setPreviewCount(matched.length);
      setMatchedJobs(matched);
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Search and Manage Jobs
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <JobSearchFilters onApply={handleApply} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {previewCount === null
            ? "Enter filters and click Apply to preview matches."
            : `${previewCount} jobs match these criteria`}
        </Typography>
      </Paper>

      <Box sx={{ mb: 2 }}>
        {matchedJobs === null ? (
          <Typography color="text.secondary">
            Enter filters and click Apply to preview matches.
          </Typography>
        ) : matchedJobs.length === 0 ? (
          <Typography color="text.secondary">
            No jobs match these criteria.
          </Typography>
        ) : (
          matchedJobs.map((j) => (
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
