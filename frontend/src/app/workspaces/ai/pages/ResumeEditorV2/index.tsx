/**
 * ResumeEditorV2 - Main Container Page
 *
 * WHAT: Complete resume editor with AI generation and live preview
 * WHY: Single-page workflow replacing confusing multi-step stepper
 *
 * TEMPLATE vs VISUAL STYLE:
 * - TEMPLATE = AI behavior (selected when creating draft, stored in draft.templateId)
 *   Controls HOW AI writes: tone, emphasis, industry terminology
 *   Example: "Modern Tech" → AI emphasizes innovation, technical achievements
 * - VISUAL STYLE = Export appearance (selected at export time)
 *   Controls HOW resume LOOKS: fonts, colors, bullet style
 *   Defaults to template's styling but can be overridden
 *
 * Layout:
 * - Top: Draft selector + undo/redo controls
 * - Left (40%): GenerationPanel (job + options + generate using TEMPLATE)
 * - Middle (30%): AIResultsPanel (AI output with apply buttons)
 * - Right (30%): DraftPreviewPanel (live preview with export using VISUAL STYLE)
 *
 * State Flow:
 * 1. User selects job + generates → AI content appears in middle panel
 * 2. User clicks "Apply All" or individual applies → Draft updates in right panel
 * 3. User can manually edit sections → State tracked as "edited"
 * 4. Export PDF/DOCX from right panel with chosen visual style
 *
 * Integration:
 * - GenerationPanel → onGenerationComplete → setPendingAIContent
 * - AIResultsPanel → onApplySection/onApplyAll → Zustand actions
 * - DraftPreviewPanel → onEditSection → editSection action
 * - Undo/Redo → Zustand history management
 */

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  GenerationPanel,
  AIResultsPanel,
  DraftPreviewPanel,
  ProductTour,
  ResumeStarter,
  TemplateSelector,
  ResumeVersionsPanel,
} from "@workspaces/ai/components/resume-v2";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";
import { useShouldShowTour } from "@workspaces/ai/hooks/useShouldShowTour";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { useAuth } from "@shared/context/AuthContext";
import { Breadcrumbs } from "@shared/components/navigation";
import type { BreadcrumbItem } from "@shared/components/navigation";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { exportResumeToPDF } from "@workspaces/ai/utils/exportResumePDF";
import { exportResumeToDOCX } from "@workspaces/ai/utils/exportResumeDOCX";
import { getTemplate } from "@workspaces/ai/config/resumeTemplates";
import useUserJobs from "@shared/hooks/useUserJobs";

export default function ResumeEditorV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { jobs } = useUserJobs(50); // Load user jobs for linking
  const { confirm } = useConfirmDialog();

  // Zustand store
  const {
    drafts,
    getActiveDraft,
    createDraft,
    loadDraft,
    clearDraft,
    deselectDraft,
    setJobLink,
    setUserId,
    loadFromCacheSync,
    syncWithDatabase,
    pendingAIContent,
    setPendingAIContent,
    appliedSections,
    applySummary,
    applySkills,
    applyExperience,
    applyEducation,
    applyAll,
    editSection,
    toggleSectionVisibility,
    reorderSections,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useResumeDraftsV2();

  const activeDraft = getActiveDraft();

  // DEBUG: Log active draft state
  console.log(
    "🔍 ResumeEditorV2 render - activeDraft:",
    activeDraft?.id || "null"
  );

  // Product tour
  const [showTour, startTour, endTour] = useShouldShowTour();

  // Local UI state
  const [showNewDraftDialog, setShowNewDraftDialog] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");
  const [newDraftJobId, setNewDraftJobId] = useState<number | "">("");
  const [newDraftTemplateId, setNewDraftTemplateId] =
    useState<string>("modern");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "pdf" | "docx" | "html" | "txt"
  >("pdf");
  const [exportFilename, setExportFilename] = useState<string>("");
  const [exportWatermark, setExportWatermark] = useState<boolean>(false);
  // Visual style for export - controls fonts, colors, layout (defaults to template's styling)
  const [exportVisualStyle, setExportVisualStyle] = useState<string>("modern");
  const [isInitializing, setIsInitializing] = useState(true);
  const [showVersionsOpen, setShowVersionsOpen] = useState(false);

  // Set userId when user changes
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId(null);
    }
  }, [user, setUserId]);

  // Initialize: Cache-first loading strategy
  useEffect(() => {
    const initializeDrafts = async () => {
      if (!user) {
        setIsInitializing(false);
        return;
      }

      try {
        // 1. Clear active draft FIRST - force user to choose from starter
        console.log("🧹 Clearing active draft to show starter screen...");
        clearDraft();

        // 2. Load from cache instantly (0ms latency)
        console.log("⚡ Loading drafts from cache...");
        loadFromCacheSync();

        // 3. Sync with database in background
        console.log("🔄 Syncing with database...");
        await syncWithDatabase();

        // 4. Get fresh state after sync
        const store = useResumeDraftsV2.getState();
        console.log(`✓ Synced ${store.drafts.length} drafts`);
      } catch (error) {
        console.error("❌ Failed to initialize drafts:", error);
        setErrorMessage("Failed to load drafts from database");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handlers
  const handleGenerationComplete = async (
    content: ResumeArtifactContent,
    jobId: number
  ) => {
    setPendingAIContent(content);

    // Link this resume to the job
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      try {
        await setJobLink(jobId, job.title, job.company);
        setSuccessMessage(
          `✓ AI content generated for ${job.title} @ ${job.company}`
        );
      } catch (error) {
        console.error("Failed to link job:", error);
        setSuccessMessage(`✓ AI content generated for job #${jobId}`);
      }
    } else {
      setSuccessMessage(`✓ AI content generated for job #${jobId}`);
    }
  };

  const handleGenerationError = (error: Error) => {
    setErrorMessage(`Generation failed: ${error.message}`);
    console.error("❌ Generation error:", error);
  };

  const handleApplySection = async (
    section: "summary" | "skills" | "experience" | "education"
  ) => {
    try {
      switch (section) {
        case "summary":
          await applySummary();
          setSuccessMessage("✓ Summary applied to draft");
          break;
        case "skills":
          await applySkills();
          setSuccessMessage("✓ Skills applied to draft");
          break;
        case "experience":
          await applyExperience();
          setSuccessMessage("✓ Experience applied to draft");
          break;
        case "education":
          await applyEducation();
          setSuccessMessage("✓ Education applied to draft");
          break;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply section";
      setErrorMessage(`❌ ${message}`);
      console.error("Apply section error:", error);
    }
  };

  const handleApplyAll = async () => {
    try {
      await applyAll();
      setSuccessMessage("✓ All sections applied to draft");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply all sections";
      setErrorMessage(`❌ ${message}`);
      console.error("Apply all error:", error);
    }
  };

  const handleEditSection = async (section: string, content: unknown) => {
    try {
      await editSection(section, content);
      setSuccessMessage(`✓ ${section} edited`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to edit section";
      setErrorMessage(`❌ ${message}`);
      console.error("Edit section error:", error);
    }
  };

  const handleToggleSection = async (section: string, visible: boolean) => {
    try {
      await toggleSectionVisibility(section, visible);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to toggle section";
      setErrorMessage(`❌ ${message}`);
      console.error("Toggle section error:", error);
    }
  };

  const handleReorderSections = async (newOrder: string[]) => {
    try {
      await reorderSections(newOrder);
      setSuccessMessage("✓ Sections reordered");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reorder sections";
      setErrorMessage(`❌ ${message}`);
      console.error("Reorder sections error:", error);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    // Open export dialog to collect options instead of exporting directly
    if (!activeDraft) {
      setErrorMessage("No draft available to export");
      return;
    }

    setExportFormat(format);
    // prefill filename
    const cleanName = activeDraft.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    setExportFilename(`${cleanName}_${dateStr}`);
    setExportWatermark(false);
    // Default visual style to template's styling
    setExportVisualStyle(activeDraft.templateId || "modern");
    setExportDialogOpen(true);
  };

  const performExport = async () => {
    if (!activeDraft) return;

    // User profile
    const userProfile = user
      ? {
          full_name: `${user.user_metadata?.first_name || ""} ${
            user.user_metadata?.last_name || ""
          }`.trim(),
          email: user.email,
          phone: user.user_metadata?.phone,
        }
      : undefined;

    try {
      if (exportFormat === "pdf") {
        await exportResumeToPDF(activeDraft, userProfile, {
          filename: exportFilename.endsWith(".pdf")
            ? exportFilename
            : `${exportFilename}.pdf`,
          watermark: exportWatermark,
          visualStyle: exportVisualStyle, // Visual styling (fonts, colors, layout)
        });
        setSuccessMessage("✓ PDF downloaded successfully");
      } else if (exportFormat === "docx") {
        await exportResumeToDOCX(activeDraft, userProfile, {
          filename: exportFilename.endsWith(".docx")
            ? exportFilename
            : `${exportFilename}.docx`,
          watermark: exportWatermark,
          theme: exportVisualStyle,
        });
        setSuccessMessage("✓ DOCX downloaded successfully");
      } else if (exportFormat === "html") {
        // Render a simple HTML representation and download
        const html = renderResumeHTML(
          activeDraft,
          exportWatermark,
          userProfile
        );
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const filename = exportFilename.endsWith(".html")
          ? exportFilename
          : `${exportFilename}.html`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setSuccessMessage("✓ HTML downloaded successfully");
      } else if (exportFormat === "txt") {
        const text = renderResumeText(
          activeDraft,
          userProfile,
          exportWatermark
        );
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const filename = exportFilename.endsWith(".txt")
          ? exportFilename
          : `${exportFilename}.txt`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setSuccessMessage("✓ Text downloaded successfully");
      }
    } catch (err) {
      console.error("Export failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportDialogOpen(false);
    }
  };

  // Small HTML renderer used for HTML export (simple, readable layout)
  const renderResumeHTML = (
    draft: {
      name: string;
      content: {
        summary?: string;
        skills?: string[];
        experience?: Array<{
          role?: string;
          company?: string;
          dates?: string;
          bullets: string[];
        }>;
        education?: Array<{
          degree?: string;
          institution?: string;
          graduation_date?: string;
          details?: string[];
        }>;
      };
    },
    watermark: boolean,
    userProfile?: { full_name?: string; email?: string; phone?: string }
  ) => {
    const header = userProfile?.full_name
      ? `<h1 style="margin:0">${
          userProfile.full_name
        }</h1><p style="margin:0;color:#666">${[
          userProfile.email,
          userProfile.phone,
        ]
          .filter(Boolean)
          .join(" • ")}</p><hr/>`
      : "";

    const sections = [] as string[];
    if (draft.content.summary) {
      sections.push(
        `<h2>Professional Summary</h2><p>${escapeHtml(
          draft.content.summary
        )}</p>`
      );
    }
    if (draft.content.skills && draft.content.skills.length) {
      sections.push(
        `<h2>Skills</h2><p>${escapeHtml(draft.content.skills.join(" • "))}</p>`
      );
    }
    if (draft.content.experience && draft.content.experience.length) {
      sections.push(
        `<h2>Experience</h2>${draft.content.experience
          .map(
            (exp: {
              role?: string;
              company?: string;
              dates?: string;
              bullets: string[];
            }) =>
              `<div><strong>${escapeHtml(exp.role || "")}</strong>${
                exp.company ? ` <em>@ ${escapeHtml(exp.company)}</em>` : ""
              }${
                exp.dates ? ` <small>(${escapeHtml(exp.dates)})</small>` : ""
              }<ul>${exp.bullets
                .map((b: string) => `<li>${escapeHtml(b)}</li>`)
                .join("")}</ul></div>`
          )
          .join("")}`
      );
    }
    if (draft.content.education && draft.content.education.length) {
      sections.push(
        `<h2>Education</h2>${draft.content.education
          .map(
            (e: {
              degree?: string;
              institution?: string;
              graduation_date?: string;
              details?: string[];
            }) =>
              `<div><strong>${escapeHtml(
                e.degree || ""
              )}</strong> <div>${escapeHtml(e.institution || "")}</div>${
                e.graduation_date
                  ? `<small>${escapeHtml(e.graduation_date)}</small>`
                  : ""
              }${
                e.details
                  ? `<ul>${e.details
                      .map((d: string) => `<li>${escapeHtml(d)}</li>`)
                      .join("")}</ul>`
                  : ""
              }</div>`
          )
          .join("")}`
      );
    }

    const watermarkHtml = watermark
      ? `<div style="position:fixed;right:8px;bottom:8px;color:#ddd;font-size:12px;">DRAFT</div>`
      : "";

    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(
      draft.name
    )}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;line-height:1.4;color:#222}h1{font-size:20px;margin-bottom:6px}h2{font-size:14px;margin-top:18px;margin-bottom:6px;color:#333}hr{border:none;border-top:1px solid #eee;margin:12px 0}</style></head><body>${watermarkHtml}<div class="resume">${header}${sections.join(
      ""
    )}</div></body></html>`;
  };

  const renderResumeText = (
    draft: {
      name: string;
      content: {
        summary?: string;
        skills?: string[];
        experience?: Array<{
          role?: string;
          company?: string;
          dates?: string;
          bullets: string[];
        }>;
        education?: Array<{
          degree?: string;
          institution?: string;
          graduation_date?: string;
          details?: string[];
        }>;
      };
    },
    userProfile?: { full_name?: string; email?: string; phone?: string },
    watermark?: boolean
  ) => {
    const lines: string[] = [];
    if (userProfile?.full_name) lines.push(userProfile.full_name);
    if (userProfile?.email || userProfile?.phone)
      lines.push(
        [userProfile?.email, userProfile?.phone].filter(Boolean).join(" • ")
      );
    lines.push("");
    if (watermark) lines.push("--- DRAFT ---", "");
    if (draft.content.summary) {
      lines.push("PROFESSIONAL SUMMARY", draft.content.summary, "");
    }
    if (draft.content.skills && draft.content.skills.length) {
      lines.push("SKILLS", draft.content.skills.join(" • "), "");
    }
    if (draft.content.experience && draft.content.experience.length) {
      lines.push("EXPERIENCE");
      draft.content.experience.forEach(
        (exp: {
          role?: string;
          company?: string;
          dates?: string;
          bullets: string[];
        }) => {
          lines.push(
            `${exp.role || ""} ${exp.company ? "@ " + exp.company : ""} ${
              exp.dates || ""
            }`.trim()
          );
          exp.bullets.forEach((b: string) => lines.push(` - ${b}`));
          lines.push("");
        }
      );
    }
    if (draft.content.education && draft.content.education.length) {
      lines.push("EDUCATION");
      draft.content.education.forEach(
        (edu: {
          degree?: string;
          institution?: string;
          graduation_date?: string;
          details?: string[];
        }) => {
          lines.push(`${edu.degree || ""} - ${edu.institution || ""}`);
          if (edu.details)
            edu.details.forEach((d: string) => lines.push(` - ${d}`));
          lines.push("");
        }
      );
    }
    return lines.join("\n");
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const handleCreateNewDraft = async () => {
    if (newDraftName.trim()) {
      try {
        const job =
          typeof newDraftJobId === "number"
            ? jobs.find((j) => j.id === newDraftJobId)
            : null;
        const draftId = await createDraft(
          newDraftName.trim(),
          newDraftTemplateId, // Use selected template
          job?.id,
          job?.title,
          job?.company
        );
        setNewDraftName("");
        setNewDraftJobId("");
        setNewDraftTemplateId("modern"); // Reset to default
        setShowNewDraftDialog(false);
        const jobInfo = job ? ` for ${job.title} @ ${job.company}` : "";
        setSuccessMessage(
          `✓ Created new draft: ${newDraftName.trim()}${jobInfo}`
        );
        console.log("✓ Created new draft:", draftId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create draft";
        setErrorMessage(`❌ ${message}`);
        console.error("Create draft error:", error);
      }
    }
  };

  const handleClearDraft = async () => {
    const confirmed = await confirm({
      title: "Clear Draft",
      description: "Clear all content from this draft? This cannot be undone.",
      confirmText: "Clear",
      confirmColor: "error",
    });

    if (confirmed) {
      clearDraft();
      setSuccessMessage("✓ Draft cleared");
    }
  };

  const handleUndo = () => {
    undo();
    setSuccessMessage("↶ Undo");
  };

  const handleRedo = () => {
    redo();
    setSuccessMessage("↷ Redo");
  };

  const handleBackToLibrary = () => {
    // Deselect the active draft (auto-saves to cache)
    // This will show the ResumeStarter (library view)
    deselectDraft();
    console.log("↩️ Returning to resume library");
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Loading drafts from database...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Always show starter screen if no active draft (even if drafts exist)
  // This forces user to choose which resume to work on every time
  if (!activeDraft) {
    console.log("✅ Showing ResumeStarter (no active draft)");
    return (
      <ResumeStarter
        onStart={(draftId) => {
          // Draft is already loaded by the starter
          console.log("✓ Draft started:", draftId);
          // Component will re-render with activeDraft set
        }}
        onCancel={() => navigate("/ai")}
      />
    );
  }

  console.log("📝 Showing full editor for draft:", activeDraft.name);

  // Parse jobId from URL parameter
  const initialJobId = searchParams.get("jobId");
  const jobIdNumber = initialJobId ? parseInt(initialJobId, 10) : undefined;

  // Breadcrumb navigation
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "AI", path: "/ai" },
    { label: "Resume Editor" },
  ];

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: 1,
          borderColor: "divider",
          px: { xs: 1.5, sm: 3 },
          py: 1.5,
        }}
      >
        {/* Breadcrumbs */}
        <Box sx={{ mb: 1 }}>
          <Breadcrumbs items={breadcrumbItems} />
        </Box>

        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 2 }}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <IconButton size="small" onClick={handleBackToLibrary}>
              <ArrowBackIcon />
            </IconButton>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", sm: "block" } }}
            />

            {/* Draft Selector */}
            <FormControl size="small" sx={{ minWidth: { xs: 150, sm: 220 } }}>
              <Select
                value={activeDraft.id}
                onChange={(e) => loadDraft(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: { xs: 12, sm: 14 },
                  fontWeight: 500,
                  "& .MuiSelect-select": {
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                {drafts.map((draft) => (
                  <MenuItem key={draft.id} value={draft.id}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: { xs: 12, sm: 14 } }}
                      >
                        📄 {draft.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: { xs: "none", sm: "block" } }}
                      >
                        Modified:{" "}
                        {new Date(draft.metadata.lastModified).toLocaleString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* Undo/Redo */}
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleUndo}
                  disabled={!canUndo()}
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleRedo}
                  disabled={!canRedo()}
                >
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Show Tutorial */}
            <Button size="small" onClick={startTour}>
              Show Tutorial
            </Button>

            {/* Clear Draft */}
            <Button size="small" color="warning" onClick={handleClearDraft}>
              Clear Draft
            </Button>

            {/* New Draft */}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowNewDraftDialog(true)}
            >
              New Draft
            </Button>
            <Button size="small" onClick={() => setShowVersionsOpen(true)}>
              Versions
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content - Three Panel Layout */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          overflow: "hidden",
          gap: 2,
          p: 2,
          minHeight: 0,
        }}
      >
        {/* Left Panel - Generation */}
        <Box
          sx={{
            width: { xs: "100%", lg: "35%" },
            height: { xs: "auto", lg: "100%" },
            minHeight: { xs: "400px", lg: 0 },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <GenerationPanel
            initialJobId={jobIdNumber}
            onGenerationStart={() => console.log("🚀 Generation started")}
            onGenerationComplete={handleGenerationComplete}
            onGenerationError={handleGenerationError}
          />
        </Box>

        {/* Middle Panel - AI Results */}
        <Box
          sx={{
            width: { xs: "100%", lg: "32.5%" },
            height: { xs: "auto", lg: "100%" },
            minHeight: { xs: "400px", lg: 0 },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <AIResultsPanel
            content={pendingAIContent}
            appliedSections={appliedSections}
            onApplySection={handleApplySection}
            onApplyAll={handleApplyAll}
            onCopyText={() => setSuccessMessage("✓ Copied to clipboard")}
          />
        </Box>

        {/* Right Panel - Draft Preview */}
        <Box
          sx={{
            width: { xs: "100%", lg: "32.5%" },
            height: { xs: "auto", lg: "100%" },
            minHeight: { xs: "500px", lg: 0 },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <DraftPreviewPanel
            draft={activeDraft}
            onEditSection={handleEditSection}
            onToggleSection={handleToggleSection}
            onReorderSections={handleReorderSections}
            onExport={handleExport}
          />
        </Box>
      </Box>

      {/* New Draft Dialog (Inline) */}
      {showNewDraftDialog && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            p: { xs: 2, sm: 0 },
          }}
          onClick={() => setShowNewDraftDialog(false)}
        >
          <Box
            sx={{
              bgcolor: "white",
              p: { xs: 2, sm: 3 },
              borderRadius: 1,
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "auto", sm: 700 },
              maxWidth: { xs: "100%", sm: 900 },
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Draft
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                📋 Template = AI Content Style
              </Typography>
              <Typography variant="caption">
                Choose a template that matches your industry and role. The
                template controls how the AI generates content: tone, language,
                emphasis, and achievement framing. You can customize the visual
                appearance when exporting.
              </Typography>
            </Alert>

            <TextField
              autoFocus
              fullWidth
              label="Draft Name"
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateNewDraft();
              }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="new-draft-job-label">
                Link to Job (Optional)
              </InputLabel>
              <Select
                labelId="new-draft-job-label"
                value={newDraftJobId}
                onChange={(e) =>
                  setNewDraftJobId(e.target.value as number | "")
                }
                label="Link to Job (Optional)"
              >
                <MenuItem value="">
                  <em>None - General Resume</em>
                </MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job.id} value={job.id}>
                    {job.title} @ {job.company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <TemplateSelector
                selectedTemplateId={newDraftTemplateId}
                onSelectTemplate={setNewDraftTemplateId}
              />
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setShowNewDraftDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateNewDraft}
                disabled={!newDraftName.trim()}
              >
                Create
              </Button>
            </Stack>
          </Box>
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Resume</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">
                Your content was generated using the{" "}
                <strong>{getTemplate(activeDraft?.templateId).name}</strong>{" "}
                template. Below, choose the visual appearance for your export
                (fonts, colors, layout).
              </Typography>
            </Alert>

            <FormControl fullWidth size="small">
              <InputLabel id="export-format-label">Format</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportFormat}
                label="Format"
                onChange={(e) =>
                  setExportFormat(
                    e.target.value as "pdf" | "docx" | "html" | "txt"
                  )
                }
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="docx">Word (.docx)</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="txt">Plain Text</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Filename"
              size="small"
              fullWidth
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              helperText="No extension required; will be added automatically"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportWatermark}
                  onChange={(e) => setExportWatermark(e.target.checked)}
                />
              }
              label="Add DRAFT watermark"
            />

            {/* Show locked AI template */}
            <Box
              sx={{
                p: 2,
                bgcolor: "grey.50",
                borderRadius: 1,
                borderLeft: 3,
                borderColor: "info.main",
              }}
            >
              <Typography variant="caption" fontWeight="600" display="block">
                🤖 AI Template (locked)
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {activeDraft?.templateId || "modern"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This controls the AI-generated content and cannot be changed
                after creation
              </Typography>
            </Box>

            {/* Visual Style selector - can be changed */}
            <FormControl fullWidth size="small">
              <InputLabel id="export-visual-style-label">
                🎨 Visual Style (changeable)
              </InputLabel>
              <Select
                labelId="export-visual-style-label"
                value={exportVisualStyle}
                label="🎨 Visual Style (changeable)"
                onChange={(e) => setExportVisualStyle(e.target.value)}
              >
                <MenuItem value="modern">
                  <Box>
                    <Typography variant="body2">Modern</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Calibri, blue accents, arrow bullets
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="classic">
                  <Box>
                    <Typography variant="body2">Classic</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Times New Roman, black, standard bullets
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="minimal">
                  <Box>
                    <Typography variant="body2">Minimal</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Arial, clean layout, dash bullets
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="creative">
                  <Box>
                    <Typography variant="body2">Creative</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Georgia, purple accents, open bullets
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="academic">
                  <Box>
                    <Typography variant="body2">Academic</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Times New Roman, formal, standard bullets
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              💡 Visual style controls fonts, colors, and layout. Choose any
              style regardless of your AI template.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={performExport}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Tour */}
      <ProductTour run={showTour} onComplete={endTour} onSkip={endTour} />

      {/* Versions Panel */}
      <ResumeVersionsPanel
        open={showVersionsOpen}
        onClose={() => setShowVersionsOpen(false)}
      />
    </Box>
  );
}
