import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";

type Props = {
  onSelectJob?: (job: Record<string, unknown>) => void;
  selectedJob?: Record<string, unknown> | null;
  /** When false, do not render the selected-job preview box below the search */
  showPreview?: boolean;
};

const JobSearch: React.FC<Props> = ({
  onSelectJob,
  selectedJob,
  showPreview = true,
}) => {
  const { user, loading } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [showList, setShowList] = useState(false);

  const load = async () => {
    if (loading) return;
    if (!user) {
      setJobs([]);
      return;
    }
    setLoadingData(true);
    try {
      const qc = getAppQueryClient();
      const rows = await qc.ensureQueryData({
        queryKey: coreKeys.jobs(user.id),
        queryFn: () => fetchCoreJobs(user.id),
        staleTime: 60 * 60 * 1000,
      });
      setJobs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("JobSearch: failed to load jobs", err);
      setJobs([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Do not load jobs on mount by default. Load when the user focuses the search
  // input or explicitly clicks Refresh. This avoids fetching the full list
  // unless the user intends to search/select a job.
  useEffect(() => {
    /* no-op by design */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user, loading]);

  const filtered = jobs.filter((j) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(j.job_title ?? j.title ?? "")
        .toLowerCase()
        .includes(q) ||
      String(j.company_name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(j.job_description ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">Select Job</Typography>
      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          size="small"
          placeholder="Search jobs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setShowList(true);
            // Load jobs lazily on first focus only
            if (!loadingData && jobs.length === 0) load();
          }}
          onBlur={() => {
            // delay hiding so clicks register
            setTimeout(() => setShowList(false), 150);
          }}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" onClick={load}>
          Refresh
        </Button>
      </Box>

      {showList && (
        <PaperList
          jobs={filtered}
          loading={loadingData}
          onSelect={onSelectJob}
          selectedJob={selectedJob}
        />
      )}

      {showPreview && selectedJob && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="subtitle1">
            {String(
              (selectedJob as any).job_title ?? (selectedJob as any).title ?? ""
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {String((selectedJob as any).company_name ?? "")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {String(
              (selectedJob as any).job_description ??
                (selectedJob as any).description ??
                ""
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const PaperList: React.FC<{
  jobs: any[];
  loading: boolean;
  onSelect?: (j: any) => void;
  selectedJob?: Record<string, unknown> | null;
}> = ({ jobs, loading, onSelect, selectedJob }) => {
  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress />
      </Box>
    );
  if (!jobs.length)
    return <Typography color="text.secondary">No jobs found.</Typography>;
  return (
    <List sx={{ maxHeight: 240, overflow: "auto" }}>
      {jobs.map((j) => (
        <ListItem key={j.id} disablePadding>
          <ListItemButton
            selected={Boolean(selectedJob && selectedJob.id === j.id)}
            onClick={() => onSelect?.(j)}
          >
            <ListItemText
              primary={j.job_title || j.title}
              secondary={j.company_name}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default JobSearch;
//This will allow users to search for the job that they want to request a reference for.
