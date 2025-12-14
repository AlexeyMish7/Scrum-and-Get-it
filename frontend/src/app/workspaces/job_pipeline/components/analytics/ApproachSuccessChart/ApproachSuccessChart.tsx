import { useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@shared/context/AuthContext";
import { computeSuccessRates } from "@job_pipeline/pages/AnalyticsPage/analyticsHelpers";
import { useCoreJobs } from "@shared/cache/coreHooks";

type JobRow = {
  id?: string | number;
  job_type?: string | null;
  industry?: string | null;
  job_status?: string | null;
  application_method?: string | null;
};

type SuccessRate = {
  key: string;
  rate: number;
  offers: number;
  total: number;
};

export default function ApproachSuccessChart() {
  const { user } = useAuth();

  const jobsQuery = useCoreJobs<JobRow>(user?.id);
  const loading = jobsQuery.isFetching;

  const data = useMemo(() => {
    const rows: JobRow[] = jobsQuery.data ?? [];
    const success = computeSuccessRates(rows, "job_type") as SuccessRate[];
    const formatted = success.map((s: SuccessRate) => ({
      method: s.key,
      rate: Number((s.rate * 100).toFixed(1)),
    }));

    return formatted.length
      ? formatted
      : [
          { method: "Referral", rate: 80 },
          { method: "Company Site", rate: 45 },
          { method: "LinkedIn", rate: 35 },
          { method: "Job Board", rate: 25 },
        ];
  }, [jobsQuery.data]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Success Rate by Application Approach
      </Typography>
      {loading ? (
        <Box textAlign="center" sx={{ mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v: number | string) => `${v}%`} />
            <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
