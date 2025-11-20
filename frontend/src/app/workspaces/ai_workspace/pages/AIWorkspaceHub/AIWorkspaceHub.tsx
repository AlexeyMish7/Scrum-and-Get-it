/**
 * AIWorkspaceHub - Central Hub Page
 *
 * Main landing page for AI workspace. Displays quick actions,
 * recent documents, and statistics. Replaces the old dashboard.
 */

import { useState, useEffect } from "react";
import { Container, Stack, Typography, Box, Button } from "@mui/material";
import {
  QuickActions,
  RecentDocuments,
  GenerationStats,
} from "../../components/hub";
import ReportGeneratorDialog from "../../components/hub/ReportGeneratorDialog";
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";
import type { RecentDocument } from "../../types";
import type { DocumentRow } from "@shared/types/database";

interface DocumentStats {
  totalDocuments: number;
  totalVersions: number;
  weeklyDocuments: number;
  averageAtsScore: number;
  jobsApplied: number;
}

/**
 * AIWorkspaceHub Component
 *
 * Central hub for AI workspace with quick actions and overview.
 */
export default function AIWorkspaceHub() {
  const { user } = useAuth();
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    totalVersions: 0,
    weeklyDocuments: 0,
    averageAtsScore: 0,
    jobsApplied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  // Fetch real data from database
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const userCrud = withUser(user.id);

        // Fetch recent documents (last 5, ordered by last_edited_at)
        const docsResult = await userCrud.listRows<DocumentRow>(
          "documents",
          "*",
          {
            order: { column: "last_edited_at", ascending: false },
            limit: 5,
          }
        );

        if (docsResult.data) {
          const recentDocs: RecentDocument[] = docsResult.data.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: doc.type as "resume" | "cover-letter",
            lastEditedAt: doc.last_edited_at,
            versionNumber: doc.total_versions || 1,
            status: doc.status as "draft" | "final" | "archived",
          }));
          setRecentDocuments(recentDocs);
        }

        // Fetch all documents for statistics
        const allDocsResult = await userCrud.listRows<DocumentRow>(
          "documents",
          "id,created_at,total_versions,total_edits,times_exported,times_used,word_count",
          {}
        );

        // Fetch document versions for ATS score
        const versionsResult = await userCrud.listRows<{
          ats_score: number | null;
        }>("document_versions", "ats_score", {
          neq: { ats_score: null },
        });

        // Fetch jobs applied count
        const jobsResult = await userCrud.listRows<{ id: number }>(
          "jobs",
          "id",
          {
            eq: { job_status: "Applied" },
          }
        );

        // Calculate statistics
        const allDocs = allDocsResult.data || [];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyDocs = allDocs.filter(
          (doc) => new Date(doc.created_at) >= oneWeekAgo
        ).length;

        const totalVersions = allDocs.reduce(
          (sum, doc) => sum + (doc.total_versions || 0),
          0
        );

        // Calculate average ATS score
        const atsScores = (versionsResult.data || [])
          .map((v) => v.ats_score)
          .filter((score): score is number => score !== null);
        const avgAtsScore =
          atsScores.length > 0
            ? Math.round(
                atsScores.reduce((sum, score) => sum + score, 0) /
                  atsScores.length
              )
            : 0;

        setStats({
          totalDocuments: allDocs.length,
          totalVersions,
          weeklyDocuments: weeklyDocs,
          averageAtsScore: avgAtsScore,
          jobsApplied: jobsResult.data?.length || 0,
        });
      } catch (err) {
        console.error("[AIWorkspaceHub] Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            AI Document Studio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
            Create, manage, and optimize your application materials.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant="contained" onClick={() => setReportOpen(true)}>
              Generate Custom Report
            </Button>
            <ReportGeneratorDialog
              open={reportOpen}
              onClose={() => setReportOpen(false)}
            />
          </Box>
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
      </Stack>
    </Container>
  );
}
