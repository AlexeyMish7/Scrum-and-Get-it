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
  Link as MuiLink,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import { lazy, Suspense } from "react";
import GenerationCard from "@workspaces/ai/components/resume/GenerationCard"; // kept eager (small)
import ResumeTutorial from "@workspaces/ai/components/resume/ResumeTutorial"; // tutorial quick load
import VersionsExportAside from "@workspaces/ai/components/resume/VersionsExportAside"; // moderate size
import { Packer, Document, Paragraph, TextRun } from "docx";
import DraftSelectorBar from "@workspaces/ai/components/resume/DraftSelectorBar"; // small
// Lazy heavy/optional panels (loaded only when step 3/4 or advanced open)
const ResumeVariationsPanel = lazy(
  () => import("@workspaces/ai/components/resume/ResumeVariationsPanel")
);
const ArtifactsHistoryPanel = lazy(
  () => import("@workspaces/ai/components/resume/ArtifactsHistoryPanel")
);
const VersionManagerPanel = lazy(
  () => import("@workspaces/ai/components/resume/VersionManagerPanel")
);
const ResumeValidationPanel = lazy(
  () => import("@workspaces/ai/components/resume/ResumeValidationPanel")
);
const ResumeDraftPreviewPanel = lazy(
  () => import("@workspaces/ai/components/resume/ResumeDraftPreviewPanel")
);
const AIResumePreview = lazy(
  () => import("@workspaces/ai/components/resume/AIResumePreview")
);
const SkillsAnalysisPreview = lazy(
  () => import("@workspaces/ai/components/resume/SkillsAnalysisPreview")
);
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import { useAuth } from "@shared/context/AuthContext";
import {
  aiGeneration,
  createDocumentAndLink,
} from "@workspaces/ai/services/aiGeneration";
import DiffCompareDialog from "@workspaces/ai/components/DiffCompareDialog";
import type { AIArtifactSummary, AIArtifact } from "@workspaces/ai/types/ai";
import BulletMergeDialog from "@workspaces/ai/components/resume/BulletMergeDialog";
import SectionControlsPanel from "@workspaces/ai/components/resume/SectionControlsPanel"; // lightweight
import ResumeFullPreview from "@workspaces/ai/components/ResumeFullPreview";
import {
  toPreviewModel,
  diffPreviewModels,
} from "@workspaces/ai/utils/previewModel";
// SkillsAnalysisPreview now lazy
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import type {
  FlowState,
  SegmentStatus,
} from "@workspaces/ai/hooks/useResumeGenerationFlow";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useGenerateResumeState, useGenerationEvents } from "./hooks";

/**
 * GenerateResume unified page (streamlined):
 * Primary flow (top): select draft → generate → apply AI → preview.
 * Advanced tools (collapsed): variations, versions, validation, artifacts history, template manager, skills optimization.
 * This reduces initial cognitive load while retaining power features.
 */
export default function GenerateResume() {
  const { showSuccess, handleError } = useErrorHandler();
  const { user } = useAuth();
  const {
    active,
    applyOrderedSkills,
    appendExperienceFromAI,
    applySummary,
    setLastAppliedJob,
  } = useResumeDrafts();

  // Centralized state management
  const {
    lastContent,
    setLastContent,
    lastJobId,
    setLastJobId,
    lastSegments,
    setLastSegments,
    newBullets,
    setNewBullets,
    mergeOpen,
    setMergeOpen,
    compareOpen,
    setCompareOpen,
    selectedContent,
    setSelectedContent,
    selectedArtifact,
    setSelectedArtifact,
    srMessage,
    setSrMessage,
    showAdvanced,
    setShowAdvanced,
    previewTab,
    setPreviewTab,
    prevContentRef,
    lastFocusArtifactIdRef,
    lastGenTsRef,
    generationRunTokenRef,
  } = useGenerateResumeState();

  // Generation event listeners
  useGenerationEvents({
    setLastContent,
    setLastSegments,
    setLastJobId,
    generationRunTokenRef,
    lastGenTsRef,
  });

  /** Emit telemetry about actions users take in Step 3. */
  const emitApplyEvent = useCallback((detail: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(
        new CustomEvent("sgt:resumeApplication", {
          detail: { ts: Date.now(), ...detail },
        })
      );
    } catch (err) {
      console.warn("sgt:resumeApplication dispatch failed", err);
    }
  }, []);

  // Diff tracking: whenever final merged content updates after base success, compute added bullets
  useEffect(() => {
    if (!lastContent) {
      prevContentRef.current = null;
      setNewBullets(null);
      return;
    }
    const prev = prevContentRef.current;
    if (prev) {
      const diff = diffPreviewModels(
        toPreviewModel(prev),
        toPreviewModel(lastContent)
      );
      const added = new Set<string>();
      for (const r of diff.experience) for (const b of r.added) added.add(b);
      setNewBullets(added.size ? added : null);
    }
    prevContentRef.current = lastContent;
  }, [lastContent, prevContentRef, setNewBullets]);

  // Progressive step rendering state (0 Select, 1 Generate, 2 Apply, 3 Preview)
  const [currentStep, setCurrentStep] = useState(0);

  // Hard reset on initial mount to avoid carrying over a previous session's lastContent
  // which caused auto-advancing straight to Apply/Preview.
  useEffect(() => {
    setLastContent(null);
    setLastSegments(null);
    setLastJobId(null);
    lastGenTsRef.current = 0;
    generationRunTokenRef.current = 0;
  }, [setLastContent, setLastSegments, setLastJobId, lastGenTsRef, generationRunTokenRef]);
  // Guard: auto-advance from Select to Generate when draft chosen
  useEffect(() => {
    if (active && currentStep === 0) setCurrentStep(1);
  }, [active, currentStep]);
  // Guard: auto-advance from Generate to Apply when content first appears
  useEffect(() => {
    // Only auto-advance from Generate -> Apply when content belongs to the current run
    if (
      lastContent &&
      currentStep === 1 &&
      generationRunTokenRef.current === lastGenTsRef.current
    ) {
      setCurrentStep(2);
    }
  }, [lastContent, currentStep, generationRunTokenRef, lastGenTsRef]);
  const stepIndex = currentStep; // for Stepper

  function canNext() {
    switch (currentStep) {
      case 0:
        return !!active; // need draft
      case 1:
        return !!lastContent; // need generated content
      case 2:
        return true; // apply step can proceed any time after generation
      default:
        return false;
    }
  }
  function nextStep() {
    if (currentStep < 3 && canNext()) setCurrentStep((s) => s + 1);
  }
  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  // Apply skill ordering from AI output to draft
  // Helper: build a ResumeArtifactContent snapshot from current draft after applications
  function buildContentFromDraft(): ResumeArtifactContent | null {
    if (!active) return null;
    return {
      summary: active.content.summary,
      ordered_skills: active.content.skills,
      sections: {
        experience: (active.content.experience || []).map((e) => ({
          role: e.role,
          company: e.company,
          dates: e.dates,
          bullets: e.bullets.slice(),
        })),
      },
      meta: {
        fromDraft: true,
        draftId: active.id,
        lastAppliedJobId: active.lastAppliedJobId,
      },
    };
  }

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
    // Refresh preview model to reflect draft modifications
    const updated = buildContentFromDraft();
    if (updated) setLastContent(updated);
    // Move to Preview after applying changes
    setCurrentStep(3);
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
    emitApplyEvent({
      action: "apply-skills",
      jobId: lastJobId ?? undefined,
      changed: !isSame,
    });
  }

  function applySummaryToDraft() {
    if (!active || !lastContent?.summary) return;
    const isSame = (active.content.summary || "") === lastContent.summary;
    applySummary(lastContent.summary);
    showSuccess(isSame ? "No changes to apply" : "Applied summary to draft");
    const updated = buildContentFromDraft();
    if (updated) setLastContent(updated);
    setCurrentStep(3);
    if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
    emitApplyEvent({
      action: "apply-summary",
      jobId: lastJobId ?? undefined,
      changed: !isSame,
    });
  }

  function mergeExperience() {
    if (!active) return;
    const exp = lastContent?.sections?.experience;
    if (!exp?.length) return;
    setMergeOpen(true);
    emitApplyEvent({
      action: "open-experience-merge",
      jobId: lastJobId ?? undefined,
      entries: exp.length,
    });
  }

  /** Map segment status codes into human-friendly labels for summary UI. */
  function segmentStatusLabel(status?: SegmentStatus | null) {
    switch (status) {
      case "success":
        return "success";
      case "running":
        return "in progress";
      case "error":
        return "error";
      case "skipped":
        return "skipped";
      case "idle":
      default:
        return "pending";
    }
  }

  /**
   * deriveMissingSections
   * WHAT: Determine which major resume sections are absent in the latest AI output.
   * WHY: Provide actionable guidance + links so user can add profile data that improves generation quality.
   * INPUT: lastContent (AI), active draft (optional for existing data)
   * OUTPUT: Array of objects { key, label, to } for missing items.
   */
  const missingSections = useMemo(() => {
    if (!lastContent) return [] as { key: string; label: string; to: string }[];
    const out: { key: string; label: string; to: string }[] = [];
    const summaryMissing =
      !lastContent.summary ||
      typeof lastContent.summary !== "string" ||
      !lastContent.summary.trim();
    if (summaryMissing)
      out.push({ key: "summary", label: "Summary", to: "/edit-resume" });
    const skillsMissing =
      !lastContent.ordered_skills || !lastContent.ordered_skills.length;
    if (skillsMissing)
      out.push({ key: "skills", label: "Skills", to: "/add-skills" });
    const expMissing =
      !lastContent.sections?.experience ||
      !lastContent.sections.experience.length;
    if (expMissing)
      out.push({
        key: "experience",
        label: "Experience",
        to: "/add-employment",
      });
    const eduMissing =
      !lastContent.sections?.education ||
      !lastContent.sections.education.length;
    if (eduMissing)
      out.push({
        key: "education",
        label: "Education",
        to: "/education/manage",
      });
    const projMissing =
      !lastContent.sections?.projects || !lastContent.sections.projects.length;
    if (projMissing)
      out.push({ key: "projects", label: "Projects", to: "/projects/new" });
    return out;
  }, [lastContent]);

  return (
    <Box>
      {/* Skip links for keyboard users */}
      <Box
        component="nav"
        sx={{
          position: "absolute",
          left: -9999,
          top: 0,
          "&:focus-within": {
            left: 8,
            top: 8,
            zIndex: 1200,
            backgroundColor: "background.paper",
            boxShadow: 3,
            p: 1,
            borderRadius: 1,
          },
        }}
      >
        <Stack direction="row" spacing={1}>
          <a href="#generation-controls">Skip to generation controls</a>
          <a href="#resume-preview-main">Skip to preview</a>
          <a href="#versions-export-aside">Skip to versions & export</a>
        </Stack>
      </Box>
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
      <ResumeTutorial />
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
          gridTemplateColumns:
            currentStep < 3
              ? { xs: "1fr", md: "1fr" }
              : { xs: "1fr", md: "1.1fr 1fr 0.9fr" },
          gap: 2,
          alignItems: "start",
          transition: "grid-template-columns .25s",
        }}
      >
        {/* LEFT COLUMN: Steps 1-3 */}
        <Box role="navigation" aria-label="Resume steps and apply actions">
          <Stack spacing={3}>
            {/* STEP 1 */}
            {currentStep === 0 && (
              <>
                <Typography variant="overline">
                  Step 1 — Select Draft
                </Typography>
                <DraftSelectorBar />
              </>
            )}
            {/* STEP 2 */}
            {currentStep === 1 && (
              <>
                <Typography variant="overline">
                  Step 2 — Generate Content
                </Typography>
                <Paper
                  id="generation-controls"
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Inputs: choose the target Job, adjust Tone, and optional
                    Focus. Click Generate to produce AI-tailored content.
                  </Alert>
                  <Stack spacing={2}>
                    <GenerationCard />
                  </Stack>
                </Paper>
              </>
            )}
            {/* STEP 3 */}
            {currentStep === 2 && (
              <>
                <Typography variant="overline">
                  Step 3 — Apply to Draft
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    position: { md: "sticky" },
                    top: { md: 72 },
                    maxHeight: { md: "calc(100vh - 96px)" },
                    overflow: { md: "auto" },
                    alignSelf: { md: "start" },
                    zIndex: 1,
                  }}
                >
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Outputs: ordered skills, a tailored summary, and selected
                    experience bullets. Use the buttons below to apply them.
                  </Alert>
                  {lastContent && missingSections.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Missing sections detected:&nbsp;
                      {missingSections.map((m, i) => (
                        <MuiLink
                          key={m.key}
                          component={RouterLink}
                          to={m.to}
                          underline="hover"
                          sx={{ mr: 1 }}
                        >
                          {m.label}
                          {i < missingSections.length - 1 ? "," : ""}
                        </MuiLink>
                      ))}
                      . Add data to strengthen AI tailoring.
                    </Alert>
                  )}
                  {lastContent && typeof lastContent.summary !== "string" && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      The AI response had an invalid summary format. It will be
                      ignored in preview until you regenerate.
                    </Alert>
                  )}
                  <SectionControlsPanel />
                  {lastContent && (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ flexWrap: "wrap" }}
                      >
                        <Tooltip title="Apply AI-ordered skill list to active draft">
                          <span>
                            <Button
                              variant="outlined"
                              onClick={applySkills}
                              disabled={!active}
                              sx={{ width: { xs: "100%", sm: "auto" } }}
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
                              disabled={
                                !active ||
                                typeof lastContent?.summary !== "string"
                              }
                              sx={{ width: { xs: "100%", sm: "auto" } }}
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
                              sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                              Merge Experience
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Copy ordered skills + emphasize/add lists to clipboard">
                          <span>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                if (!lastContent) return;
                                const payload = {
                                  ordered: lastContent.ordered_skills || [],
                                  emphasize: lastContent.emphasize_skills || [],
                                  add: lastContent.add_skills || [],
                                };
                                navigator.clipboard
                                  .writeText(JSON.stringify(payload, null, 2))
                                  .catch(() => {});
                                showSuccess("Copied skill sets to clipboard");
                                emitApplyEvent({
                                  action: "copy-keywords",
                                  jobId: lastJobId ?? undefined,
                                  ordered: payload.ordered.length,
                                });
                              }}
                              disabled={
                                !active || !lastContent?.ordered_skills?.length
                              }
                              sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                              Copy Keywords
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Output summary
                        </Typography>
                        <Typography variant="body2">
                          Skills ordered:{" "}
                          {lastContent?.ordered_skills?.length ?? 0}
                        </Typography>
                        <Typography variant="body2">
                          Summary: {lastContent?.summary ? "present" : "none"}
                        </Typography>
                        <Typography variant="body2">
                          Experience entries:{" "}
                          {lastContent?.sections?.experience?.length ?? 0}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Segment status
                        </Typography>
                        {lastSegments ? (
                          <>
                            <Typography variant="body2">
                              Base resume:{" "}
                              {segmentStatusLabel(lastSegments.base)}
                            </Typography>
                            <Typography variant="body2">
                              Skills optimization:{" "}
                              {segmentStatusLabel(lastSegments.skills)}
                            </Typography>
                            <Typography variant="body2">
                              Experience tailoring:{" "}
                              {segmentStatusLabel(lastSegments.experience)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No runs yet. Generate content to see segment
                            outcomes.
                          </Typography>
                        )}
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
              </>
            )}
            {/* Navigation buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              {currentStep < 3 && (
                <Button
                  variant="contained"
                  onClick={nextStep}
                  disabled={!canNext()}
                >
                  Next
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
        {/* MIDDLE COLUMN: Preview tabs */}
        {currentStep === 3 && (
          <Box
            id="resume-preview-main"
            role="main"
            aria-labelledby="resume-editor-heading"
          >
            <Typography variant="overline">Step 4 — Preview</Typography>
            {lastContent && missingSections.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                The following sections are empty in this AI version:&nbsp;
                {missingSections.map((m, i) => (
                  <MuiLink
                    key={m.key}
                    component={RouterLink}
                    to={m.to}
                    underline="hover"
                    sx={{ mr: 1 }}
                  >
                    {m.label}
                    {i < missingSections.length - 1 ? "," : ""}
                  </MuiLink>
                ))}
                . Populate them to improve relevance.
              </Alert>
            )}
            <Tabs
              value={previewTab}
              onChange={(_, v) => setPreviewTab(v)}
              aria-label="Resume preview tabs"
              sx={{
                mb: 1,
                flexWrap: "wrap",
                ".MuiTab-root": { textTransform: "none", minHeight: 36 },
              }}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab label="AI Tailored" value="ai" />
              <Tab label="Formatted" value="formatted" />
              <Tab label="Current Draft" value="draft" />
              <Tab label="Variations" value="variations" />
              <Tab label="Skills" value="skills" />
              <Tab label="Raw JSON" value="raw" />
            </Tabs>
            <Suspense
              fallback={
                <Typography variant="body2">Loading preview...</Typography>
              }
            >
              {previewTab === "ai" && <AIResumePreview content={lastContent} />}
              {previewTab === "formatted" && (
                <Box id="resume-formatted-preview">
                  <ResumeFullPreview
                    content={lastContent}
                    headerTitle="Formatted Preview"
                    loadingSkills={lastSegments?.skills === "running"}
                    loadingExperience={lastSegments?.experience === "running"}
                    newBullets={newBullets || undefined}
                    hideSections={(() => {
                      // Reflect SectionControlsPanel visibility in formatted preview
                      const visible = active?.content.visibleSections;
                      if (!visible || !visible.length) return undefined;
                      const set = new Set(visible);
                      return {
                        summary: !set.has("summary"),
                        skills: !set.has("skills"),
                        experience: !set.has("experience"),
                        education: !set.has("education"),
                        projects: !set.has("projects"),
                      };
                    })()}
                  />
                </Box>
              )}
              {previewTab === "draft" && <ResumeDraftPreviewPanel />}
              {previewTab === "variations" && <ResumeVariationsPanel />}
              {previewTab === "skills" && (
                <SkillsAnalysisPreview content={lastContent} />
              )}
              {previewTab === "raw" && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, fontSize: 12, maxHeight: 360, overflow: "auto" }}
                >
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {lastContent
                      ? JSON.stringify(lastContent, null, 2)
                      : "No content yet."}
                  </pre>
                </Paper>
              )}
            </Suspense>
          </Box>
        )}
        {/* RIGHT COLUMN: Versions & Export */}
        {currentStep === 3 && (
          <Box
            id="versions-export-aside"
            role="complementary"
            aria-label="Versions and export actions"
          >
            <VersionsExportAside
              lastContent={lastContent}
              jobId={lastJobId}
              onOpenVersions={() => setShowAdvanced(true)}
              onExportPDF={async () => {
                try {
                  // Lazy import to keep bundle lean
                  const [{ default: html2canvas }, { jsPDF }] =
                    await Promise.all([
                      import("html2canvas"),
                      import("jspdf") as unknown as Promise<{
                        jsPDF: typeof import("jspdf").jsPDF;
                      }>,
                    ]);
                  const el = document.getElementById(
                    "resume-formatted-preview"
                  );
                  if (!el) throw new Error("Formatted preview not available");
                  const canvas = await html2canvas(el, {
                    scale: Math.min(window.devicePixelRatio || 1.5, 2),
                    backgroundColor: "#ffffff",
                  });
                  const imgData = canvas.toDataURL("image/png");
                  const pdf = new jsPDF({
                    orientation: "p",
                    unit: "pt",
                    format: "a4",
                  });
                  // Fit image onto A4 with aspect ratio
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const imgWidth = pageWidth - 48; // margins
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  const y = 24;
                  if (imgHeight > pageHeight - 48) {
                    // scale down to fit height
                    const h = pageHeight - 48;
                    const w = (canvas.width * h) / canvas.height;
                    pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 24, w, h);
                  } else {
                    pdf.addImage(imgData, "PNG", 24, y, imgWidth, imgHeight);
                  }
                  const fname = `resume_${lastJobId ?? "preview"}.pdf`;
                  // Create blob for optional storage linking
                  const blob = pdf.output("blob");
                  pdf.save(fname);
                  setSrMessage("Resume exported as PDF");
                  showSuccess("Exported PDF");
                  // If user & job present, persist and link document row
                  if (user?.id && lastJobId) {
                    const linked = await createDocumentAndLink({
                      userId: user.id,
                      jobId: lastJobId,
                      file: blob,
                      filename: fname,
                      mime: "application/pdf",
                      kind: "resume",
                      linkType: "resume",
                    });
                    if (linked) {
                      showSuccess("PDF stored & linked to job materials");
                      setSrMessage("PDF stored and linked to job materials");
                    }
                  }
                } catch (e) {
                  handleError(e);
                }
              }}
              onAttachToJob={async () => {
                try {
                  if (!user?.id) throw new Error("Not signed in");
                  if (!lastJobId) throw new Error("No job selected");
                  if (!selectedArtifact || !("id" in selectedArtifact))
                    throw new Error("Select a version from the list");
                  await aiGeneration.linkJobMaterials(user.id, {
                    jobId: lastJobId,
                    resume_artifact_id: (selectedArtifact as AIArtifactSummary)
                      .id,
                  });
                  showSuccess("Attached selected version to job");
                  setSrMessage("Selected version attached to job");
                } catch (e) {
                  handleError(e);
                }
              }}
              onSelectVersion={(content, artifact) => {
                setSelectedContent(content ?? null);
                setSelectedArtifact(artifact ?? null);
                if (content) setCompareOpen(true);
                if (artifact && "id" in artifact && artifact.id) {
                  lastFocusArtifactIdRef.current = artifact.id as string;
                }
              }}
              onExportDOCX={async () => {
                try {
                  if (!lastContent) throw new Error("No content to export");
                  const doc = new Document({
                    sections: [
                      {
                        properties: {},
                        children: buildDocxFromResume(lastContent),
                      },
                    ],
                  });
                  const blob = await Packer.toBlob(doc);
                  const fname = `resume_${lastJobId ?? "preview"}.docx`;
                  // Trigger download
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = fname;
                  a.click();
                  URL.revokeObjectURL(a.href);
                  showSuccess("Exported DOCX");
                  setSrMessage("Resume exported as DOCX");
                  if (user?.id && lastJobId) {
                    const linked = await createDocumentAndLink({
                      userId: user.id,
                      jobId: lastJobId,
                      file: blob,
                      filename: fname,
                      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      kind: "resume",
                      linkType: "resume",
                    });
                    if (linked) {
                      showSuccess("DOCX stored & linked to job materials");
                      setSrMessage("DOCX stored and linked to job materials");
                    }
                  }
                } catch (e) {
                  handleError(e);
                }
              }}
            />
          </Box>
        )}
      </Box>
      {/* Advanced tools */}
      {currentStep === 3 && (
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
            <Suspense
              fallback={
                <Typography variant="body2">
                  Loading advanced tools...
                </Typography>
              }
            >
              <Stack spacing={3} sx={{ mt: 2 }}>
                <VersionManagerPanel />
                <ResumeValidationPanel />
                <ArtifactsHistoryPanel />
              </Stack>
            </Suspense>
          </Collapse>
        </Box>
      )}
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
          const updated = buildContentFromDraft();
          if (updated) setLastContent(updated);
          setCurrentStep(3);
          if (typeof lastJobId === "number") setLastAppliedJob(lastJobId);
          emitApplyEvent({
            action: "merge-experience",
            jobId: lastJobId ?? undefined,
            applied: rows.length,
          });
        }}
      />
      <DiffCompareDialog
        open={compareOpen}
        left={lastContent}
        right={selectedContent}
        onClose={() => setCompareOpen(false)}
        onChoose={async () => {
          try {
            if (selectedContent) setLastContent(selectedContent);
            if (
              user?.id &&
              lastJobId &&
              selectedArtifact &&
              "id" in selectedArtifact
            ) {
              await aiGeneration.linkJobMaterials(user.id, {
                jobId: lastJobId,
                resume_artifact_id: (selectedArtifact as AIArtifactSummary).id,
              });
              showSuccess("Selected version linked to job");
              setSrMessage("Selected version linked to job");
            }
          } catch (e) {
            handleError(e);
          } finally {
            setCompareOpen(false);
            // Restore keyboard focus to previously selected artifact list item
            if (lastFocusArtifactIdRef.current) {
              const el = document.querySelector<HTMLElement>(
                `[data-artifact-id="${lastFocusArtifactIdRef.current}"]`
              );
              el?.focus();
            }
          }
        }}
      />
      {/* Visually hidden live region for screen reader announcements */}
      <Box
        aria-live="polite"
        role="status"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          p: 0,
          m: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {srMessage}
      </Box>
    </Box>
  );
}

/**
 * buildDocxFromResume
 * WHAT: Convert ResumeArtifactContent into docx Paragraph blocks.
 * WHY: Provide basic DOCX export (simple formatting, bullet lists).
 * INPUT: ResumeArtifactContent
 * OUTPUT: Array<Paragraph>
 */
function buildDocxFromResume(content: ResumeArtifactContent) {
  const out: Paragraph[] = [];
  if (content.summary) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Summary", bold: true, size: 24 })],
        spacing: { after: 120 },
      })
    );
    out.push(new Paragraph({ text: content.summary }));
  }
  if (content.ordered_skills?.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Skills", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    out.push(
      new Paragraph({
        text: content.ordered_skills.join(", "),
      })
    );
  }
  const exp = content.sections?.experience || [];
  if (exp.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Experience", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of exp) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.role, row.company, row.dates]
                .filter(Boolean)
                .join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const b of row.bullets || []) {
        out.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      }
    }
  }
  const education = content.sections?.education || [];
  if (education.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Education", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of education) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.institution, row.degree, row.graduation_date]
                .filter(Boolean)
                .join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const d of row.details || []) {
        out.push(new Paragraph({ text: d, bullet: { level: 0 } }));
      }
    }
  }
  const projects = content.sections?.projects || [];
  if (projects.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Projects", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of projects) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.name, row.role].filter(Boolean).join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const d of row.bullets || []) {
        out.push(new Paragraph({ text: d, bullet: { level: 0 } }));
      }
    }
  }
  if (content.ats_keywords?.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "ATS Keywords", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    out.push(new Paragraph({ text: content.ats_keywords.join(", ") }));
  }
  return out;
}
