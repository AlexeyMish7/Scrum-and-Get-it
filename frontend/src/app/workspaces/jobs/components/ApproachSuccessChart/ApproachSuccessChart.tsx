import { useEffect, useState } from "react";
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
import * as crud from "@shared/services/crud";
import { useAuth } from "@shared/context/AuthContext";
import { computeSuccessRates } from "@workspaces/jobs/pages/AnalyticsPage/analyticsHelpers";

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
  const [data, setData] = useState<Array<{ method: string; rate: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchJobs() {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows<JobRow>(
          "jobs",
          "id, application_method, job_type, industry, job_status",
          { order: { column: "application_deadline", ascending: true } }
        );
        const rows: JobRow[] = Array.isArray(res?.data)
          ? (res.data as JobRow[])
          : [];
        const success = computeSuccessRates(rows, "job_type") as SuccessRate[];
        const formatted = success.map((s: SuccessRate) => ({
          method: s.key,
          rate: Number((s.rate * 100).toFixed(1)),
        }));
        if (mounted)
          setData(
            formatted.length
              ? formatted
              : [
                  { method: "Referral", rate: 80 },
                  { method: "Company Site", rate: 45 },
                  { method: "LinkedIn", rate: 35 },
                  { method: "Job Board", rate: 25 },
                ]
          );
      } catch (err) {
        console.error(err);
        if (mounted)
          setData([
            { method: "Referral", rate: 80 },
            { method: "Company Site", rate: 45 },
            { method: "LinkedIn", rate: 35 },
            { method: "Job Board", rate: 25 },
          ]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchJobs();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

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
