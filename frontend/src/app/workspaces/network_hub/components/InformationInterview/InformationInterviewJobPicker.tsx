import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";

type JobRow = {
  id: string | number;
  job_title?: string | null;
  title?: string | null;
  company_name?: string | null;
  [key: string]: unknown;
};

export default function InformationInterviewJobPicker({
  onSelectJob,
  onChangeTopic,
  initialQuery,
  initialTopic,
}: {
  onSelectJob: (row: JobRow | null) => void;
  onChangeTopic: (topic: string) => void;
  initialQuery?: string;
  initialTopic?: string;
}) {
  const { user, loading } = useAuth();
  const [q, setQ] = useState(initialQuery ?? "");
  const [company, setCompany] = useState<string | null>(null);
  const [results, setResults] = useState<JobRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [topic, setTopic] = useState<string>(initialTopic ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        if (loading) return;
        if (!user) {
          setResults([]);
          return;
        }
        setLoadingData(true);
        try {
          // Use cached core jobs list and filter client-side.
          // This prevents rerunning a Supabase query on every keystroke.
          const qc = getAppQueryClient();
          const jobs = await qc.ensureQueryData({
            queryKey: coreKeys.jobs(user.id),
            queryFn: () => fetchCoreJobs<JobRow>(user.id),
            staleTime: 60 * 60 * 1000,
          });

          const all = Array.isArray(jobs) ? jobs : [];
          const qLower = q ? q.toLowerCase() : "";

          const filtered = all.filter((j) => {
            try {
              if (company && String(j.company_name ?? "") !== String(company))
                return false;
              if (qLower) {
                const title = String(
                  j.job_title ?? j.title ?? ""
                ).toLowerCase();
                return title.includes(qLower);
              }
              return true;
            } catch {
              return false;
            }
          });

          setResults(filtered);
        } catch (err) {
          console.error("Job search failed", err);
          setResults([]);
        } finally {
          setLoadingData(false);
        }
      })();
    }, 300);

    return () => clearTimeout(t);
  }, [q, company, user, loading]);

  useEffect(() => {
    onChangeTopic(topic);
  }, [topic, onChangeTopic]);

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        placeholder="Search job title"
        size="small"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            placeholder="Company"
            value={company ?? ""}
            onChange={(e) => setCompany(e.target.value || null)}
          />
          <Select
            size="small"
            displayEmpty
            value={topic}
            onChange={(e) => setTopic(String(e.target.value))}
            sx={{ minWidth: 200 }}
            inputProps={{ "aria-label": "topic" }}
          >
            <MenuItem value="">
              <em>Topic</em>
            </MenuItem>
            <MenuItem value="career_advice">Career advice</MenuItem>
            <MenuItem value="industry_insights">Industry insights</MenuItem>
            <MenuItem value="resume_review">Resume review</MenuItem>
            <MenuItem value="networking">Networking</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </Stack>
      </Box>

      <Box>
        <List dense>
          {results.length === 0 ? (
            <ListItemButton disabled>
              <ListItemText
                primary={loadingData ? "Searching..." : "No jobs found"}
              />
            </ListItemButton>
          ) : (
            results.map((r) => (
              <ListItemButton
                key={String(r.id)}
                selected={String(r.id) === selectedId}
                onClick={() => {
                  setSelectedId(String(r.id));
                  onSelectJob(r);
                }}
              >
                <ListItemText
                  primary={String(r.job_title ?? r.title ?? "Untitled")}
                  secondary={String(r.company_name ?? "")}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Stack>
  );
}
