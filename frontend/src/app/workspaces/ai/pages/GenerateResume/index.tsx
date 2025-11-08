import { Box, Typography, Stack, Button } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import TemplateManager from "../resume/TemplateManager";
import ResumeGenerationPanel from "../resume/ResumeGenerationPanel";
import SkillsOptimizationPanel from "../resume/SkillsOptimizationPanel";
import ExperienceTailoringPanel from "../resume/ExperienceTailoringPanel";
import ArtifactsHistoryPanel from "../resume/ArtifactsHistoryPanel";
import ResumeVariationsPanel from "../resume/ResumeVariationsPanel";
import DraftSelectorBar from "../resume/DraftSelectorBar";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import BulletMergeDialog from "../resume/BulletMergeDialog";
import SectionControlsPanel from "../resume/SectionControlsPanel";
import VersionManagerPanel from "../resume/VersionManagerPanel";
import ResumeValidationPanel from "../resume/ResumeValidationPanel";
import ResumeDraftPreviewPanel from "../resume/ResumeDraftPreviewPanel";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { useState, useEffect } from "react";

/**
 * GenerateResume unified page:
 * - Select active draft
 * - Generate resume artifacts
 * - Apply ordered skills / summary / experience bullets to the draft
 * - Manage templates & run skills optimization
 */
export default function GenerateResume() {
  const { handleError, showSuccess } = useErrorHandler();
  const {
    active,
    applyOrderedSkills,
    appendExperienceFromAI,
    applySummary,
    setLastAppliedJob,
  } = useResumeDrafts();
  const [lastContent, setLastContent] = useState<ResumeArtifactContent | null>(
    null
  );
  const [lastJobId, setLastJobId] = useState<number | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);

  // Listen for generation events dispatched by ResumeGenerationPanel
  useEffect(() => {
    function onGenerated(e: Event) {
      const detail = (e as CustomEvent).detail as {
        content?: ResumeArtifactContent;
        jobId?: number;
      };
      if (detail?.content) setLastContent(detail.content);
      if (typeof detail?.jobId === "number") setLastJobId(detail.jobId);
    }
    window.addEventListener(
      "sgt:resumeGenerated",
      onGenerated as EventListener
    );
    return () =>
      window.removeEventListener(
        "sgt:resumeGenerated",
        onGenerated as EventListener
      );
  }, []);

  function applySkills() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!lastContent?.ordered_skills?.length)
      return handleError?.(new Error("No ordered skills available"));
    applyOrderedSkills(lastContent.ordered_skills);
    showSuccess("Applied ordered skills to draft");
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
  }

  function applySummaryToDraft() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    if (!lastContent?.summary)
      return handleError?.(new Error("No summary available"));
    applySummary(lastContent.summary);
    showSuccess("Applied summary to draft");
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
  }

  function mergeExperience() {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    const exp = lastContent?.sections?.experience;
    if (!exp?.length)
      return handleError?.(new Error("No experience section available"));
    setMergeOpen(true);
  }

  return (
    <Box>
      <RegionAnchor
        id="[F]"
        desc="Resume editor, templates, and ATS-optimization tools"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Resume Editor
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Manage templates, generate tailored resume content, and apply AI
        optimization.
      </Typography>

      <Stack spacing={3}>
        <DraftSelectorBar />
        <ResumeGenerationPanel />
        <ExperienceTailoringPanel />
        <ResumeVariationsPanel />
        <SectionControlsPanel />
        <ResumeDraftPreviewPanel />
        <VersionManagerPanel />
        <ResumeValidationPanel />
        <ArtifactsHistoryPanel />
        {lastContent && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={applySkills} disabled={!active}>
              Apply Ordered Skills
            </Button>
            <Button
              variant="outlined"
              onClick={applySummaryToDraft}
              disabled={!active}
            >
              Apply Summary
            </Button>
            <Button
              variant="outlined"
              onClick={mergeExperience}
              disabled={!active}
            >
              Merge Experience Bullets
            </Button>
          </Stack>
        )}
        <TemplateManager />
        <SkillsOptimizationPanel />
      </Stack>
      <BulletMergeDialog
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        aiContent={lastContent}
        draftExperience={active?.content.experience}
        onApply={(rows) => {
          // Adapt selected rows to the shape expected by appendExperienceFromAI
          appendExperienceFromAI(
            rows.map((r) => ({
              role: r.role || "Experience",
              company: r.company,
              dates: r.dates,
              bullets: r.bullets,
            })) as {
              role: string;
              company?: string;
              dates?: string;
              bullets: string[];
            }[]
          );
          showSuccess("Selected bullets merged");
          if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
        }}
      />
    </Box>
  );
}
