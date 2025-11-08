import {
  Box,
  Typography,
  Stack,
  Button,
  Collapse,
  Divider,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
 * GenerateResume unified page (streamlined):
 * Primary flow (top): select draft → generate → apply AI → preview.
 * Advanced tools (collapsed): variations, versions, validation, artifacts history, template manager, skills optimization.
 * This reduces initial cognitive load while retaining power features.
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
  // Controls visibility of advanced tool suite to declutter initial view.
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        {/* Primary workflow panels */}
        <DraftSelectorBar />
        <ResumeGenerationPanel />
        <ExperienceTailoringPanel />
        <SectionControlsPanel />
        {lastContent && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Tooltip title="Apply AI-ordered skill list to active draft">
              <span>
                <Button
                  variant="outlined"
                  onClick={applySkills}
                  disabled={!active}
                >
                  Apply Ordered Skills
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Replace summary with AI generated version">
              <span>
                <Button
                  variant="outlined"
                  onClick={applySummaryToDraft}
                  disabled={!active}
                >
                  Apply Summary
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Select and merge tailored experience bullets">
              <span>
                <Button
                  variant="outlined"
                  onClick={mergeExperience}
                  disabled={!active}
                >
                  Merge Experience Bullets
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
        <ResumeDraftPreviewPanel />

        {/* Advanced tool suite toggle */}
        <Box>
          <Divider sx={{ my: 2 }} />
          <Button
            startIcon={
              <ExpandMoreIcon
                sx={{
                  transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.2s",
                }}
              />
            }
            variant="text"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Hide Advanced Tools" : "Show Advanced Tools"}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            Advanced: variations, versions, validation, artifacts history,
            templates, skills optimization.
          </Typography>
          <Collapse in={showAdvanced} unmountOnExit>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <ResumeVariationsPanel />
              <VersionManagerPanel />
              <ResumeValidationPanel />
              <ArtifactsHistoryPanel />
              <TemplateManager />
              <SkillsOptimizationPanel />
            </Stack>
          </Collapse>
        </Box>
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
