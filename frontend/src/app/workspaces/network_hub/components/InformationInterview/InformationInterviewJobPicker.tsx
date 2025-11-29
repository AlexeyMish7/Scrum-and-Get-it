import { useEffect, useState } from "react";
import { Box, TextField, List, ListItemButton, ListItemText, Stack, Typography, Select, MenuItem } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";

type JobRow = Record<string, any>;

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
          const opts: any = {};
          if (q) opts.ilike = { job_title: `%${q}%` };
          if (company) opts.eq = { company_name: company };

          const res: Result<unknown[]> = await db.listJobs(user.id, opts as any);
          if (!res.error && res.data) setResults(Array.isArray(res.data) ? (res.data as JobRow[]) : [res.data as JobRow]);
          else setResults([]);
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
  }, [topic]);

  return (
    <Stack spacing={1}>
      <TextField fullWidth placeholder="Search job title" size="small" value={q} onChange={(e) => setQ(e.target.value)} />

      <Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField size="small" placeholder="Company" value={company ?? ""} onChange={(e) => setCompany(e.target.value || null)} />
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
              <ListItemText primary={loadingData ? "Searching..." : "No jobs found"} />
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
                <ListItemText primary={String(r.job_title ?? r.title ?? "Untitled")} secondary={String(r.company_name ?? "")} />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Stack>
  );
}
