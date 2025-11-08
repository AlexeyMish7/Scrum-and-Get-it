import { Box, Typography, Paper } from "@mui/material";
import JobSearchFilters, { type JobFilters } from "../../components/JobSearchFilters/JobSearchFilters";
import JobCard from "../../components/JobCard/JobCard";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { listJobs } from "@shared/services/dbMappers";
import { useState } from "react";

export default function SavedSearchesPage() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[] | null>(null);

  async function handleApply(filters: JobFilters) {
    if (!user) return handleError("Not signed in");
    try {
      const res = await listJobs(user.id);
      if (res.error) return handleError(res.error);
      const rows = (res.data ?? []) as any[];
      // simple client-side filter for preview: reuse a subset of the filtering rules
  const matched = rows.filter((r) => {
        if (filters.query) {
          const q = String(filters.query).toLowerCase();
          const hay = (
            String(r.job_title ?? r.title ?? "") + " " +
            String(r.company_name ?? r.company ?? "") + " " +
            String(r.job_description ?? "")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filters.industry && !String(r.industry ?? "").toLowerCase().includes(String(filters.industry).toLowerCase())) return false;
        if (filters.location) {
          const loc = String(filters.location).toLowerCase();
          const combined = (
            String(r.city_name ?? r.city ?? "") + " " + String(r.state_code ?? r.state ?? "") + " " + String(r.zipcode ?? "")
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
        Saved Searches
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <JobSearchFilters onApply={handleApply} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {previewCount === null ? "Enter filters and click Apply to preview matches." : `${previewCount} jobs match these criteria`}
        </Typography>
      </Paper>

      <Box sx={{ mb: 2 }}>
        {matchedJobs === null ? (
          <Typography color="text.secondary">Enter filters and click Apply to preview matches.</Typography>
        ) : matchedJobs.length === 0 ? (
          <Typography color="text.secondary">No jobs match these criteria.</Typography>
        ) : (
          matchedJobs.map((j) => <JobCard key={String((j as any).id)} job={j} />)
        )}
      </Box>

      <Typography color="text.secondary">TODO: List and manage saved job searches.</Typography>
    </Box>
  );
}
