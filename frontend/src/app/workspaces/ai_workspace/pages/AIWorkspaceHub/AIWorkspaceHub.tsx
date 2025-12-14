/**
 * AIWorkspaceHub - Central Hub Page
 *
 * Main landing page for AI workspace. Displays quick actions,
 * recent documents, and statistics. Replaces the old dashboard.
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { JobRecord } from "../../../job_pipeline/pages/AnalyticsPage/analyticsHelpers";
import { Container, Stack, Typography, Box, Button } from "@mui/material";
import {
  QuickActions,
  RecentDocuments,
  GenerationStats,
} from "../../components/hub";
import { AIPredictionsPanel } from "../../components/shared";
import ReportGeneratorDialog from "../../components/hub/ReportGeneratorDialog";
import { useAuth } from "@shared/context/AuthContext";
import type { RecentDocument } from "../../types";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import { useJobPredictions } from "../../hooks/useJobPredictions";
import { useAIGlossyStyles } from "@shared/theme";
import * as crud from "@shared/services/crud";
import { aiKeys } from "@shared/cache/aiQueryKeys";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchCoreDocuments,
  fetchCoreJobs,
  fetchDocumentVersionAtsScores,
} from "@shared/cache/coreFetchers";

interface DocumentStats {
  totalDocuments: number;
  totalVersions: number;
  weeklyDocuments: number;
  averageAtsScore: number;
  jobsApplied: number;
}

interface Prediction {
  type: string; // e.g., "Interview Success"
  value: number; // predicted probability or outcome
  confidence: number; // confidence interval (0-1)
  recommendations?: string[]; // optional recommendations
  scenarioAnalysis?: Record<string, number>; // optional scenario planning
  timestamp: Date; // for tracking model improvement over time
}

/**
 * AIWorkspaceHub Component
 *
 * Central hub for AI workspace with quick actions and overview.
 */
export default function AIWorkspaceHub() {
  const { user } = useAuth();
  const aiStyles = useAIGlossyStyles();
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();

  const defaultStats: DocumentStats = {
    totalDocuments: 0,
    totalVersions: 0,
    weeklyDocuments: 0,
    averageAtsScore: 0,
    jobsApplied: 0,
  };

  const overviewQuery = useQuery({
    queryKey: user?.id
      ? aiKeys.hubOverview(user.id)
      : aiKeys.hubOverview("anon"),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) throw new Error("Not authenticated");
      return await fetchAIHubOverview(userId, queryClient);
    },
  });

  const userName = overviewQuery.data?.userName ?? null;
  const jobs = overviewQuery.data?.jobs ?? [];
  const recentDocuments = overviewQuery.data?.recentDocuments ?? [];
  const stats = overviewQuery.data?.stats ?? defaultStats;
  const loading = overviewQuery.isLoading;

  const { predictions, isLoading, error, runPredictions } =
    useJobPredictions(jobs);

  // Track if predictions have already been fetched to prevent infinite loop
  const hasFetchedPredictions = useRef(false);

  // Trigger predictions once when we first have jobs loaded
  // Use a ref to prevent infinite loop from runPredictions changing
  useEffect(() => {
    if (jobs.length > 0 && !hasFetchedPredictions.current && !isLoading) {
      hasFetchedPredictions.current = true;
      // Pass jobs directly to ensure we use the latest value
      runPredictions(jobs);
    }
  }, [jobs, isLoading, runPredictions]);

  //   useEffect(() => {
  //   if (jobs.length > 0) {
  //     runPredictions();
  //   }
  // }, [jobs]);

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <AutoBreadcrumbs />
      <Stack spacing={6}>
        {/* Header - Purpose-driven with generous spacing */}
        <Box
          sx={{
            pt: 4,
            pb: 5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            AI Document Studio
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1.125rem",
              mb: 4,
              maxWidth: 600,
            }}
          >
            {userName ? `Welcome back, ${userName}! ` : ""}
            Build resumes and letters that pass ATS and impress humans.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setReportOpen(true)}
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1.25,
            }}
          >
            Generate Custom Report
          </Button>
          <ReportGeneratorDialog
            open={reportOpen}
            onClose={() => setReportOpen(false)}
          />
        </Box>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Documents */}
        {!loading && recentDocuments.length > 0 && (
          <RecentDocuments documents={recentDocuments} />
        )}

        {/* Statistics */}
        <GenerationStats
          totalDocuments={stats.totalDocuments}
          totalVersions={stats.totalVersions}
          weeklyDocuments={stats.weeklyDocuments}
          averageAtsScore={stats.averageAtsScore}
          jobsApplied={stats.jobsApplied}
        />

        {/* AI Predictions - Glossy AI-powered section with preset-specific styling */}
        <Box
          sx={{
            ...aiStyles.section,
            mt: 2,
          }}
        >
          {/* AI Badge - Uses glossy badge style */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Box sx={aiStyles.badge}>
              <Typography variant="caption" className="badge-text">
                ⚡ AI-Powered
              </Typography>
            </Box>
          </Stack>

          {/* Section Header - Uses glossy text style */}
          <Typography
            variant="h4"
            sx={{
              ...aiStyles.text,
              fontWeight: 800,
              mb: 3,
            }}
          >
            Predictions & Recommendations
          </Typography>

          {/* Render predictions using the shared component */}
          <AIPredictionsPanel
            predictions={predictions}
            isLoading={isLoading}
            error={error}
          />
        </Box>
      </Stack>
    </Container>
  );
}

async function fetchAIHubOverview(
  userId: string,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<{
  userName: string | null;
  jobs: JobRecord[];
  recentDocuments: RecentDocument[];
  stats: DocumentStats;
}> {
  const [profile, documents, jobs, versions] = await Promise.all([
    crud.getUserProfile(userId),
    queryClient.ensureQueryData({
      queryKey: coreKeys.documents(userId),
      queryFn: () => fetchCoreDocuments(userId),
      staleTime: 60 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: coreKeys.jobs(userId),
      queryFn: () => fetchCoreJobs<JobRecord>(userId),
      staleTime: 60 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: coreKeys.documentVersionAtsScores(userId),
      queryFn: () => fetchDocumentVersionAtsScores(userId),
      staleTime: 30 * 60 * 1000,
    }),
  ]);

  const userName = profile
    ? profile.first_name || profile.last_name
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : null
    : null;

  const recentDocsSorted = [...documents].sort((a, b) => {
    const ad = a.last_edited_at ? new Date(a.last_edited_at).getTime() : 0;
    const bd = b.last_edited_at ? new Date(b.last_edited_at).getTime() : 0;
    return bd - ad;
  });

  const recentDocuments: RecentDocument[] = recentDocsSorted
    .slice(0, 5)
    .map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type as "resume" | "cover-letter",
      lastEditedAt: doc.last_edited_at,
      versionNumber: doc.total_versions || 1,
      status: doc.status as "draft" | "final" | "archived",
    }));

  const allDocs = documents;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyDocuments = allDocs.filter(
    (doc) => new Date(doc.created_at) >= oneWeekAgo
  ).length;

  const totalVersions = allDocs.reduce((sum, doc) => {
    return sum + (doc.total_versions || 0);
  }, 0);

  const atsScores = (versions || [])
    .map((v) => v.ats_score)
    .filter((score): score is number => score !== null);
  const averageAtsScore =
    atsScores.length > 0
      ? Math.round(
          atsScores.reduce((sum, score) => sum + score, 0) / atsScores.length
        )
      : 0;

  const stats: DocumentStats = {
    totalDocuments: allDocs.length,
    totalVersions,
    weeklyDocuments,
    averageAtsScore,
    jobsApplied: jobs.filter((j) => j.job_status === "Applied").length,
  };

  return {
    userName,
    jobs: jobs || [],
    recentDocuments,
    stats,
  };
}
