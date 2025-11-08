import {
  Box,
  Typography,
  Stack,
  Button,
  Collapse,
  Divider,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import GenerationCard from "../resume/GenerationCard";
import ArtifactsHistoryPanel from "../resume/ArtifactsHistoryPanel";
import ResumeVariationsPanel from "../resume/ResumeVariationsPanel";
import DraftSelectorBar from "../resume/DraftSelectorBar";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import BulletMergeDialog from "../resume/BulletMergeDialog";
import SectionControlsPanel from "../resume/SectionControlsPanel";
import VersionManagerPanel from "../resume/VersionManagerPanel";
import ResumeValidationPanel from "../resume/ResumeValidationPanel";
import ResumeDraftPreviewPanel from "../resume/ResumeDraftPreviewPanel";
import AIResumePreview from "../resume/AIResumePreview";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { useState, useEffect, useRef } from "react";

/**
 * GenerateResume unified page (streamlined):
 * Primary flow (top): select draft → generate → apply AI → preview.
 * Advanced tools (collapsed): variations, versions, validation, artifacts history, template manager, skills optimization.
 * This reduces initial cognitive load while retaining power features.
 */
export default function GenerateResume() {
  const { showSuccess } = useErrorHandler();
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
  // Preview tabs: ai (generated), draft (current draft), variations (quick alt generations)
  const [previewTab, setPreviewTab] = useState<"ai" | "draft" | "variations">(
    "ai"
  );

  // Track the freshest generation event to guard against out-of-order delivery
  const lastGenTsRef = useRef<number>(0);

  // Listen for generation events dispatched by ResumeGenerationPanel
  useEffect(() => {
    function onGenerated(e: Event) {
      const detail = (e as CustomEvent).detail as {
        content?: ResumeArtifactContent;
        jobId?: number;
        ts?: number;
      };
      const ts = typeof detail?.ts === "number" ? detail.ts : Date.now();
      if (ts < lastGenTsRef.current) return; // ignore stale
      lastGenTsRef.current = ts;
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

  // Derive a coarse step index for the Stepper guide (purely UX guidance)
  const stepIndex = !active ? 0 : !lastContent ? 1 : 2;

  // Apply skill ordering from AI output to draft
  function applySkills() {
    if (!active || !lastContent?.ordered_skills?.length) return;
    const existing = active.content.skills || [];
    const lowerExisting = new Map(existing.map((s) => [s.toLowerCase(), s]));
    const prospective: string[] = [];
    for (const s of lastContent.ordered_skills) {
      const match = lowerExisting.get(s.toLowerCase()) || s;
      if (!prospective.includes(match)) prospective.push(match);
    }
    for (const s of existing) if (!prospective.includes(s)) prospective.push(s);
    const isSame =
      prospective.length === existing.length &&
      prospective.every((v, i) => v === existing[i]);
    applyOrderedSkills(lastContent.ordered_skills);
    showSuccess(
      isSame ? "No changes to apply" : "Applied ordered skills to draft"
    );
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
  }

  function applySummaryToDraft() {
    if (!active || !lastContent?.summary) return;
    const isSame = (active.content.summary || "") === lastContent.summary;
    applySummary(lastContent.summary);
    showSuccess(isSame ? "No changes to apply" : "Applied summary to draft");
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
  }

  function mergeExperience() {
    if (!active) return;
    const exp = lastContent?.sections?.experience;
    if (!exp?.length) return;
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
        Follow the steps in order. Inputs are chosen in Step 2 (Job, Tone,
        optional Focus). Outputs appear as a preview and can be applied to your
        active draft in Step 3.
      </Typography>
      <Stepper activeStep={stepIndex} alternativeLabel sx={{ mb: 2 }}>
        <Step>
          <StepLabel>Select Draft</StepLabel>
        </Step>
        <Step>
          <StepLabel>Generate</StepLabel>
        </Step>
        <Step>
          <StepLabel>Apply</StepLabel>
        </Step>
        <Step>
          <StepLabel>Preview</StepLabel>
        </Step>
      </Stepper>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {/* LEFT COLUMN: Steps 1-3 */}
        <Box>
          <Stack spacing={3}>
            {/* STEP 1 */}
            <Typography variant="overline">Step 1 — Select Draft</Typography>
            <DraftSelectorBar />
            {/* STEP 2 */}
            <Typography variant="overline">
              Step 2 — Generate Content
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Inputs: choose the target Job, adjust Tone, and optional Focus.
                Click Generate to produce AI-tailored content.
              </Alert>
              <Stack spacing={2}>
                <GenerationCard />
              </Stack>
            </Paper>
            {/* STEP 3 */}
            <Typography variant="overline">Step 3 — Apply to Draft</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Outputs: ordered skills, a tailored summary, and selected
                experience bullets. Use the buttons below to apply them.
              </Alert>
              <SectionControlsPanel />
              {lastContent && (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Tooltip title="Apply AI-ordered skill list to active draft">
                      <span>
                        <Button
                          variant="outlined"
                          onClick={applySkills}
                          disabled={!active}
                        >
                          Apply Skills
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
                          Merge Experience
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Output summary
                    </Typography>
                    <Typography variant="body2">
                      Skills ordered: {lastContent?.ordered_skills?.length ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      Summary: {lastContent?.summary ? "present" : "none"}
                    </Typography>
                    <Typography variant="body2">
                      Experience entries:{" "}
                      {lastContent?.sections?.experience?.length ?? 0}
                    </Typography>
                  </Paper>
                </Stack>
              )}
              {!lastContent && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Generate content in Step 2 to enable Apply actions.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Box>
        {/* RIGHT COLUMN: Preview tabs */}
        <Box>
          <Typography variant="overline">Step 4 — Preview</Typography>
          <Tabs
            value={previewTab}
            onChange={(_, v) => setPreviewTab(v)}
            aria-label="Resume preview tabs"
            sx={{ mb: 1 }}
          >
            <Tab label="AI Tailored" value="ai" />
            <Tab label="Current Draft" value="draft" />
            <Tab label="Variations" value="variations" />
          </Tabs>
          {previewTab === "ai" && <AIResumePreview content={lastContent} />}
          {previewTab === "draft" && <ResumeDraftPreviewPanel />}
          {previewTab === "variations" && <ResumeVariationsPanel />}
        </Box>
      </Box>
      {/* Advanced tools */}
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
          Advanced: versions, validation, artifacts history.
        </Typography>
        <Collapse in={showAdvanced} unmountOnExit>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <VersionManagerPanel />
            <ResumeValidationPanel />
            <ArtifactsHistoryPanel />
          </Stack>
        </Collapse>
      </Box>
      <BulletMergeDialog
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        aiContent={lastContent}
        draftExperience={active?.content.experience}
        onApply={(rows) => {
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
