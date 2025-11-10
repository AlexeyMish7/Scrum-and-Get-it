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
  const [isInitializing, setIsInitializing] = useState(true);

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
    if (!activeDraft) {
      setErrorMessage("No draft available to export");
      return;
    }

    // Get user profile for contact info (if available)
    const userProfile = user
      ? {
          full_name: `${user.user_metadata?.first_name || ""} ${
            user.user_metadata?.last_name || ""
          }`.trim(),
          email: user.email,
          phone: user.user_metadata?.phone,
        }
      : undefined;

    if (format === "pdf") {
      try {
        exportResumeToPDF(activeDraft, userProfile);
        setSuccessMessage("✓ PDF downloaded successfully");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `PDF export failed: ${error.message}`
            : "PDF export failed"
        );
        console.error("PDF export error:", error);
      }
    } else if (format === "docx") {
      try {
        exportResumeToDOCX(activeDraft, userProfile);
        setSuccessMessage("✓ DOCX downloaded successfully");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `DOCX export failed: ${error.message}`
            : "DOCX export failed"
        );
        console.error("DOCX export error:", error);
      }
    }
  };

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

      {/* Product Tour */}
      <ProductTour run={showTour} onComplete={endTour} onSkip={endTour} />
    </Box>
  );
}
