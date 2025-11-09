import React from "react";
import { Box, Typography } from "@mui/material";
import NextDeadlinesWidget from "@workspaces/jobs/components/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@workspaces/jobs/components/DeadlineCalendar/DeadlineCalendar";
import BenchmarkCard from "./BenchmarkCard"; // ✅ added import

// --- Optional safe fallbacks ---
let useAuth: any;
try {
  useAuth = require("@/context/AuthContext").useAuth;
} catch (e1) {
  try {
    useAuth = require("../../../../context/AuthContext").useAuth;
  } catch (e2) {
    console.warn("⚠️ AuthContext not found — using offline fallback mode.");
    useAuth = () => ({ user: { id: "local-test-user" } });
  }
}

let crud: any;
try {
  crud = require("@/utils/crudClient").crud;
} catch {
  crud = {
    withUser: () => ({
      listRows: async () => ({
        data: [],
        error: null,
      }),
    }),
  };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadJobs() {
      try {
        const userCrud = crud.withUser(user?.id || "local-test");
        const res = await userCrud.listRows(
          "jobs",
          "id, job_title, company_name, industry, job_type, created_at, job_status, status_changed_at, application_deadline"
        );
        if (!res.error && Array.isArray(res.data)) {
          setJobs(res.data);
        }
      } catch (err) {
        console.error("Job fetch failed:", err);
      }
    }
    loadJobs();
  }, [user?.id]);

  // --- Local fallback data for offline view ---
  const sampleJobs =
    jobs.length > 0
      ? jobs
      : [
          {
            job_title: "Intern",
            company_name: "Google",
            job_status: "Offer",
            industry: "Software",
            created_at: new Date().toISOString(),
            status_changed_at: new Date().toISOString(),
            application_deadline: new Date(Date.now() + 9 * 86400000).toISOString(),
          },
          {
            job_title: "Data Analyst",
            company_name: "JP Morgan",
            job_status: "Applied",
            industry: "Finance",
            created_at: new Date().toISOString(),
            status_changed_at: new Date().toISOString(),
            application_deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
          },
        ];

  // --- ✅ Your existing layout preserved ---
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Jobs Analytics
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box sx={{ width: { xs: "100%", md: "33%" } }}>
          <NextDeadlinesWidget jobs={sampleJobs} />
        </Box>

        <Box sx={{ width: { xs: "100%", md: "67%" } }}>
          <DeadlineCalendar jobs={sampleJobs} />
        </Box>
      </Box>

      {/* ✅ Add back Success Rate section */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        Success Rate by Application Approach
      </Typography>
      <Box sx={{ mb: 4 }}>
        <BenchmarkCard jobs={sampleJobs} />
      </Box>

      <Typography color="text.secondary">
        TODO: Charts and metrics about applications will appear here.
      </Typography>
    </Box>
  );
}
