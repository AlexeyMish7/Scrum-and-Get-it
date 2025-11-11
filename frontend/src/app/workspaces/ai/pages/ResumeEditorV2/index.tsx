/**
 * ResumeEditorV2 - Main Container Page
 *
 * WHAT: Complete resume editor with AI generation and live preview
 * WHY: Single-page workflow replacing confusing multi-step stepper
 *
 * Layout:
 * - Top: Draft selector + undo/redo controls
 * - Left (40%): GenerationPanel (job + options + generate)
 * - Middle (30%): AIResultsPanel (AI output with apply buttons)
 * - Right (30%): DraftPreviewPanel (live preview with export)
 *
 * State Flow:
 * 1. User selects job + generates → AI content appears in middle panel
 * 2. User clicks "Apply All" or individual applies → Draft updates in right panel
 * 3. User can manually edit sections → State tracked as "edited"
 * 4. Export PDF/DOCX from right panel
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
  Switch,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

import GenerationPanel from "@workspaces/ai/components/resume-v2/GenerationPanel";
import AIResultsPanel from "@workspaces/ai/components/resume-v2/AIResultsPanel";
import DraftPreviewPanel from "@workspaces/ai/components/resume-v2/DraftPreviewPanel";
import ProductTour from "@workspaces/ai/components/resume-v2/ProductTour";
import { TemplateSelector } from "@workspaces/ai/components/ResumeEditorV2/TemplateSelector";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";
import { useShouldShowTour } from "@workspaces/ai/hooks/useShouldShowTour";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { useAuth } from "@shared/context/AuthContext";
import { exportResumeToPDF } from "@workspaces/ai/utils/exportResumePDF";
import { exportResumeToDOCX } from "@workspaces/ai/utils/exportResumeDOCX";
import useUserJobs from "@shared/hooks/useUserJobs";
import ResumeVersionsPanel from "@workspaces/ai/components/resume-v2/ResumeVersionsPanel";

export default function ResumeEditorV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobs } = useUserJobs(50); // Load user jobs for linking

  // Zustand store
  const {
    drafts,
    getActiveDraft,
    createDraft,
    loadDraft,
    clearDraft,
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
    applyAll,
    editSection,
    toggleSectionVisibility,
    reorderSections,
    changeTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useResumeDraftsV2();

  const activeDraft = getActiveDraft();

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
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "html" | "txt">("pdf");
  const [exportFilename, setExportFilename] = useState<string>("");
  const [exportWatermark, setExportWatermark] = useState<boolean>(false);
  const [exportTheme, setExportTheme] = useState<string>("modern");
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
        // 1. Load from cache instantly (0ms latency)
        console.log("⚡ Loading drafts from cache...");
        loadFromCacheSync();

        // 2. Sync with database in background
        console.log("🔄 Syncing with database...");
        await syncWithDatabase();

        // 3. Get fresh state after sync
        const store = useResumeDraftsV2.getState();
        console.log(`✓ Synced ${store.drafts.length} drafts`);

        // 4. If no drafts exist, create initial draft
        if (store.drafts.length === 0) {
          console.log("📝 Creating initial draft...");
          const draftId = await createDraft("My Resume");
          console.log("✓ Created initial draft:", draftId);
        }
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
    section: "summary" | "skills" | "experience"
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

  const handleChangeTemplate = async (templateId: string) => {
    try {
      await changeTemplate(templateId);
      setSuccessMessage(`✓ Template changed successfully`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to change template";
      setErrorMessage(`❌ ${message}`);
      console.error("Change template error:", error);
    }
  };

  const handleSaveDraft = () => {
    // Note: Drafts are now auto-saved to database on every edit/apply action
    // This function kept for UI feedback only
    setSuccessMessage("✓ Draft auto-saved");
  };

  const handleExport = async (format: "pdf" | "docx") => {
    // Open export dialog to collect options instead of exporting directly
    if (!activeDraft) {
      setErrorMessage("No draft available to export");
      return;
    }

    setExportFormat(format);
    // prefill filename
    const cleanName = activeDraft.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    setExportFilename(`${cleanName}_${dateStr}`);
    setExportWatermark(false);
    setExportTheme(activeDraft.templateId || "modern");
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
          filename: exportFilename.endsWith(".pdf") ? exportFilename : `${exportFilename}.pdf`,
          watermark: exportWatermark,
          theme: exportTheme,
        });
        setSuccessMessage("✓ PDF downloaded successfully");
      } else if (exportFormat === "docx") {
        await exportResumeToDOCX(activeDraft, userProfile, {
          filename: exportFilename.endsWith(".docx") ? exportFilename : `${exportFilename}.docx`,
          watermark: exportWatermark,
          theme: exportTheme,
        });
        setSuccessMessage("✓ DOCX downloaded successfully");
      } else if (exportFormat === "html") {
        // Render a simple HTML representation and download
        const html = renderResumeHTML(activeDraft, exportTheme, exportWatermark, userProfile);
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const filename = exportFilename.endsWith(".html") ? exportFilename : `${exportFilename}.html`;
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
        const text = renderResumeText(activeDraft, userProfile, exportWatermark);
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const filename = exportFilename.endsWith(".txt") ? exportFilename : `${exportFilename}.txt`;
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
    draft: any,
    theme: string,
    watermark: boolean,
    userProfile?: { full_name?: string; email?: string; phone?: string }
  ) => {
    const header = userProfile?.full_name
      ? `<h1 style="margin:0">${userProfile.full_name}</h1><p style="margin:0;color:#666">${[userProfile.email, userProfile.phone].filter(Boolean).join(' • ')}</p><hr/>`
      : "";

    const sections = [] as string[];
    if (draft.content.summary) {
      sections.push(`<h2>Professional Summary</h2><p>${escapeHtml(draft.content.summary)}</p>`);
    }
    if (draft.content.skills && draft.content.skills.length) {
      sections.push(`<h2>Skills</h2><p>${escapeHtml(draft.content.skills.join(' • '))}</p>`);
    }
    if (draft.content.experience && draft.content.experience.length) {
      sections.push(`<h2>Experience</h2>${draft.content.experience.map(exp=>`<div><strong>${escapeHtml(exp.role||'')}</strong>${exp.company?` <em>@ ${escapeHtml(exp.company)}</em>`:''}${exp.dates?` <small>(${escapeHtml(exp.dates)})</small>`:''}<ul>${exp.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul></div>`).join('')}`);
    }
    if (draft.content.education && draft.content.education.length) {
      sections.push(`<h2>Education</h2>${draft.content.education.map(e=>`<div><strong>${escapeHtml(e.degree||'')}</strong> <div>${escapeHtml(e.institution||'')}</div>${e.graduation_date?`<small>${escapeHtml(e.graduation_date)}</small>`:''}${e.details?`<ul>${e.details.map(d=>`<li>${escapeHtml(d)}</li>`).join('')}</ul>`:''}</div>`).join('')}`);
    }

    const watermarkHtml = watermark ? `<div style="position:fixed;right:8px;bottom:8px;color:#ddd;font-size:12px;">DRAFT</div>` : "";

    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.name)}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;line-height:1.4;color:#222}h1{font-size:20px;margin-bottom:6px}h2{font-size:14px;margin-top:18px;margin-bottom:6px;color:#333}hr{border:none;border-top:1px solid #eee;margin:12px 0}</style></head><body>${watermarkHtml}<div class="resume">${header}${sections.join('')}</div></body></html>`;
  };

  const renderResumeText = (
    draft: any,
    userProfile?: { full_name?: string; email?: string; phone?: string },
    watermark?: boolean
  ) => {
    const lines: string[] = [];
    if (userProfile?.full_name) lines.push(userProfile.full_name);
    if (userProfile?.email || userProfile?.phone)
      lines.push([userProfile?.email, userProfile?.phone].filter(Boolean).join(' • '));
    lines.push('');
    if (watermark) lines.push('--- DRAFT ---', '');
    if (draft.content.summary) {
      lines.push('PROFESSIONAL SUMMARY', draft.content.summary, '');
    }
    if (draft.content.skills && draft.content.skills.length) {
      lines.push('SKILLS', draft.content.skills.join(' • '), '');
    }
    if (draft.content.experience && draft.content.experience.length) {
      lines.push('EXPERIENCE');
      draft.content.experience.forEach((exp) => {
        lines.push(`${exp.role || ''} ${exp.company ? '@ ' + exp.company : ''} ${exp.dates || ''}`.trim());
        exp.bullets.forEach((b) => lines.push(` - ${b}`));
        lines.push('');
      });
    }
    if (draft.content.education && draft.content.education.length) {
      lines.push('EDUCATION');
      draft.content.education.forEach((edu) => {
        lines.push(`${edu.degree || ''} - ${edu.institution || ''}`);
        if (edu.details) edu.details.forEach((d) => lines.push(` - ${d}`));
        lines.push('');
      });
    }
    return lines.join('\n');
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
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

  const handleClearDraft = () => {
    if (
      window.confirm(
        "Clear all content from this draft? This cannot be undone."
      )
    ) {
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

  // Show loading if no draft yet
  if (!activeDraft) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No draft available. Creating one...
          </Typography>
        </Box>
      </Container>
    );
  }

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
          px: 3,
          py: 1.5,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton size="small" onClick={() => navigate("/ai")}>
              <ArrowBackIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem />

            {/* Draft Selector */}
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                value={activeDraft.id}
                onChange={(e) => loadDraft(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: 14,
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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        📄 {draft.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Modified:{" "}
                        {new Date(draft.metadata.lastModified).toLocaleString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Undo/Redo */}
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  data-tour="undo-redo-controls"
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
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", gap: 2, p: 2 }}>
        {/* Left Panel - Generation */}
        <Box
          sx={{ width: "35%", display: "flex", flexDirection: "column" }}
          data-tour="generation-panel"
        >
          <GenerationPanel
            onGenerationStart={() => console.log("🚀 Generation started")}
            onGenerationComplete={handleGenerationComplete}
            onGenerationError={handleGenerationError}
          />
        </Box>

        {/* Middle Panel - AI Results */}
        <Box
          sx={{ width: "32.5%", display: "flex", flexDirection: "column" }}
          data-tour="ai-results-panel"
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
          sx={{ width: "32.5%", display: "flex", flexDirection: "column" }}
          data-tour="draft-preview-panel"
        >
          <DraftPreviewPanel
            draft={activeDraft}
            onEditSection={handleEditSection}
            onToggleSection={handleToggleSection}
            onReorderSections={handleReorderSections}
            onChangeTemplate={handleChangeTemplate}
            onSaveDraft={handleSaveDraft}
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
          }}
          onClick={() => setShowNewDraftDialog(false)}
        >
          <Box
            sx={{
              bgcolor: "white",
              p: 3,
              borderRadius: 1,
              minWidth: 700,
              maxWidth: 900,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Draft
            </Typography>
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
            <FormControl fullWidth size="small">
              <InputLabel id="export-format-label">Format</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportFormat}
                label="Format"
                onChange={(e) =>
                    setExportFormat(e.target.value as "pdf" | "docx" | "html" | "txt")
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

            <FormControl fullWidth size="small">
              <InputLabel id="export-theme-label">Theme</InputLabel>
              <Select
                labelId="export-theme-label"
                value={exportTheme}
                label="Theme"
                onChange={(e) => setExportTheme(e.target.value)}
              >
                <MenuItem value="modern">Modern</MenuItem>
                <MenuItem value="classic">Classic</MenuItem>
                <MenuItem value="compact">Compact</MenuItem>
              </Select>
            </FormControl>
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
      <ResumeVersionsPanel open={showVersionsOpen} onClose={() => setShowVersionsOpen(false)} />
    </Box>
  );
}
