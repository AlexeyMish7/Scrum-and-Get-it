/**
 * CoverLetterEditor - Main Container Page
 *
 * WHAT: Complete cover letter editor with AI generation and live preview
 * WHY: Unified workflow for creating tailored, professional cover letters
 *
 * Layout:
 * - Top: Draft selector + new draft button
 * - Three-panel layout:
 *   - Left (35%): Generation Panel (job + company + tone/length/culture + generate)
 *   - Middle (35%): AI Results Panel (AI output with apply/regenerate/dismiss)
 *   - Right (30%): Draft Preview Panel (live preview with editing + export)
 *
 * State Flow:
 * 1. User selects job + generates → AI content appears in middle panel
 * 2. User clicks "Apply Content" → Draft updates in right panel
 * 3. User can manually edit sections → State tracked in store
 * 4. Export PDF/DOCX/plain text from right panel
 *
 * Integration:
 * - GenerationPanel → onGenerate → calls AI API → setPendingAIContent
 * - AIResultsPanel → onApply → applyPendingContent (merges into draft)
 * - PreviewPanel → onUpdate* → updateOpening/updateBody/updateClosing
 * - Company research integration for UC-057
 */

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
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
  FormControlLabel,
  Switch,
  Chip,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { useNavigate } from "react-router-dom";

import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";
import { useAuth } from "@shared/context/AuthContext";
import { COVER_LETTER_TEMPLATES } from "../../config/coverLetterTemplates";
import type {
  Tone,
  Length,
  CompanyCulture,
} from "../../config/coverLetterTemplates";
import CoverLetterGenerationPanel from "../../components/cover-letter/CoverLetterGenerationPanel";
import CoverLetterAIResultsPanel from "../../components/cover-letter/CoverLetterAIResultsPanel";
import CoverLetterPreviewPanel from "../../components/cover-letter/CoverLetterPreviewPanel";
import {
  exportAsPlainText,
  exportAsPDF,
  exportAsDOCX,
  generateFilename,
} from "../../utils/coverLetterExport";
import { linkCoverLetterToJob } from "../../services/jobMaterialsService";

/**
 * Mock job data for development
 * FUTURE: Replace with actual jobs from jobs table via CRUD service
 * - Use listRows("jobs", "*", { filters: [...] })
 * - Scope with withUser(user.id)
 */
interface Job {
  id: number;
  job_title: string;
  company_name: string;
  job_description?: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: 1,
    job_title: "Senior Software Engineer",
    company_name: "TechCorp",
    job_description: "Build scalable web applications...",
  },
  {
    id: 2,
    job_title: "Frontend Developer",
    company_name: "StartupXYZ",
    job_description: "Create beautiful user interfaces...",
  },
  {
    id: 3,
    job_title: "Full Stack Engineer",
    company_name: "BigTech Inc",
    job_description: "Develop end-to-end features...",
  },
];

export default function CoverLetterEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Zustand store
  const {
    drafts,
    getActiveDraft,
    createDraft,
    loadDraft,
    setUserId,
    loadFromCacheSync,
    syncWithDatabase,
    error,
    clearError,
    updateOpening,
    updateBody,
    updateClosing,
    updateHeader,
    changeTone,
    changeLength,
    changeCulture,
    pendingAIContent,
    setPendingAIContent,
    applyPendingContent,
  } = useCoverLetterDrafts();

  const activeDraft = getActiveDraft();

  // UI state
  const [showNewDraftDialog, setShowNewDraftDialog] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("formal");

  // Generation state
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [autoRegenerate, setAutoRegenerate] = useState(false);

  // Industry language options
  const [industryLanguage, setIndustryLanguage] = useState({
    useTechnicalJargon: true,
    emphasizeKeywords: true,
    includeRoleSpecific: true,
  });

  // Link to job dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingJobId, setLinkingJobId] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Initialize store
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      loadFromCacheSync(); // Instant load from cache
      syncWithDatabase(); // Background sync
    }
  }, [user?.id, setUserId, loadFromCacheSync, syncWithDatabase]);

  // Error handling
  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: "error" });
      clearError();
    }
  }, [error, clearError]);

  // Handlers
  const handleCreateDraft = async () => {
    if (!newDraftName.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a draft name",
        severity: "error",
      });
      return;
    }

    const draftId = await createDraft(newDraftName, selectedTemplate);
    if (draftId) {
      setSnackbar({
        open: true,
        message: `Created draft: ${newDraftName}`,
        severity: "success",
      });
      setShowNewDraftDialog(false);
      setNewDraftName("");
    }
  };

  const handleLoadDraft = async (draftId: string) => {
    await loadDraft(draftId);
  };

  // Auto-fetch company research when job is selected
  useEffect(() => {
    const fetchResearch = async () => {
      if (!selectedJobId || !activeDraft) return;

      const selectedJob = MOCK_JOBS.find((j) => j.id === selectedJobId);
      if (!selectedJob?.company_name) return;

      try {
        // Fetch company research from backend
        const response = await fetch(
          `/api/company/research?name=${encodeURIComponent(
            selectedJob.company_name
          )}&industry=${encodeURIComponent(selectedJob.job_description || "")}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            // Store company research in draft
            await updateHeader({
              ...activeDraft.content.header,
              companyName: selectedJob.company_name,
            });

            // Update company research in store
            // Note: fetchCompanyResearch method in store should handle this
            // For now, we're just ensuring the data is available
            setSnackbar({
              open: true,
              message: `Company research loaded for ${selectedJob.company_name}`,
              severity: "success",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch company research:", err);
        // Don't show error to user - this is a nice-to-have feature
      }
    };

    fetchResearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, activeDraft?.id]);

  // Auto-regenerate when tone/length/culture changes (if enabled and content exists)
  useEffect(() => {
    if (!autoRegenerate || !pendingAIContent || !selectedJobId || isGenerating)
      return;

    const timer = setTimeout(() => {
      setIsRegenerating(true);
      handleGenerate().finally(() => setIsRegenerating(false));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeDraft?.metadata.tone,
    activeDraft?.metadata.length,
    activeDraft?.metadata.culture,
    industryLanguage.useTechnicalJargon,
    industryLanguage.emphasizeKeywords,
    industryLanguage.includeRoleSpecific,
  ]);

  const handleGenerate = async () => {
    if (!selectedJobId || !activeDraft) {
      setSnackbar({
        open: true,
        message: "Please select a job first",
        severity: "error",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // FUTURE: Call backend AI generation endpoint (POST /api/generate/cover-letter)
      // For now, mock the AI content with industry language preferences
      const selectedJob = MOCK_JOBS.find((j) => j.id === selectedJobId);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Customize content based on industry language preferences
      const technicalEmphasis = industryLanguage.useTechnicalJargon
        ? "utilizing modern tech stacks including React, TypeScript, and cloud-native architectures"
        : "working with modern frameworks and technologies";

      const keywordEmphasis = industryLanguage.emphasizeKeywords
        ? "scalable architecture, microservices, CI/CD pipelines, and user-centric design"
        : "scalable architecture and user-centric design";

      const roleSpecificTerms = industryLanguage.includeRoleSpecific
        ? "agile methodologies, sprint planning, and cross-functional collaboration"
        : "collaborative development";

      const mockContent = {
        opening: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${selectedJob?.job_title} position at ${selectedJob?.company_name}. With my background in software development and passion for building innovative solutions, I am excited about the opportunity to contribute to your team.`,
        body: [
          `Throughout my career, I have developed a strong foundation in full-stack development, ${technicalEmphasis}. My experience aligns well with the requirements outlined in your job posting, particularly in areas of ${keywordEmphasis}.`,
          `I am particularly drawn to ${selectedJob?.company_name} because of your commitment to innovation and excellence in the technology sector. I believe my skills in problem-solving and ${roleSpecificTerms} would make me a valuable addition to your team.`,
        ],
        closing: `Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills can contribute to ${selectedJob?.company_name}'s continued success. I am available for an interview at your earliest convenience.`,
        tone: activeDraft.metadata.tone,
      };

      setPendingAIContent(mockContent);
      setSnackbar({
        open: true,
        message: "Cover letter generated successfully",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to generate cover letter",
        severity: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await handleGenerate();
    setIsRegenerating(false);
  };

  const handleApplyContent = async () => {
    if (!pendingAIContent || !activeDraft) return;

    try {
      await applyPendingContent();
      setSnackbar({
        open: true,
        message: "AI content applied to draft",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to apply content",
        severity: "error",
      });
    }
  };

  const handleDismissContent = () => {
    setPendingAIContent(null);
  };

  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    if (!activeDraft) return;

    setIsExporting(true);
    try {
      const filename = generateFilename(activeDraft.name, format);
      const template = COVER_LETTER_TEMPLATES[activeDraft.templateId];

      switch (format) {
        case "pdf":
          await exportAsPDF(activeDraft.content, template, filename);
          break;
        case "docx":
          exportAsDOCX(activeDraft.content, template, filename);
          break;
        case "txt":
          exportAsPlainText(activeDraft.content, filename);
          break;
      }

      setSnackbar({
        open: true,
        message: `Exported as ${format.toUpperCase()}`,
        severity: "success",
      });

      // Prompt to link to job if a job is selected
      if (selectedJobId) {
        setLinkingJobId(selectedJobId);
        setShowLinkDialog(true);
      }
    } catch (error) {
      console.error("Export failed:", error);
      setSnackbar({ open: true, message: "Export failed", severity: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLinkToJob = async () => {
    if (!user?.id || !activeDraft || !linkingJobId) return;

    setIsLinking(true);
    try {
      // For now, we'll link using the draft ID as a reference in metadata
      // In future, we could create an AI artifact entry first
      await linkCoverLetterToJob({
        userId: user.id,
        jobId: linkingJobId,
        metadata: {
          draftId: activeDraft.id,
          draftName: activeDraft.name,
          templateId: activeDraft.templateId,
          linkedAt: new Date().toISOString(),
        },
      });

      setSnackbar({
        open: true,
        message: "Cover letter linked to job successfully",
        severity: "success",
      });
      setShowLinkDialog(false);
      setLinkingJobId(null);
    } catch (error) {
      console.error("Failed to link cover letter to job:", error);
      setSnackbar({
        open: true,
        message: "Failed to link cover letter to job",
        severity: "error",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/ai")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Cover Letter Editor</Typography>
        <Box sx={{ flexGrow: 1 }} />

        {/* Auto-regenerate toggle */}
        {pendingAIContent && (
          <Tooltip title="Automatically regenerate when changing tone, length, or culture">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRegenerate}
                  onChange={(e) => setAutoRegenerate(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <AutorenewIcon fontSize="small" />
                  <Typography variant="body2">Auto-regenerate</Typography>
                </Stack>
              }
            />
          </Tooltip>
        )}

        {isRegenerating && (
          <Chip
            label="Regenerating..."
            color="primary"
            size="small"
            icon={<AutorenewIcon />}
          />
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowNewDraftDialog(true)}
        >
          New Cover Letter
        </Button>
      </Stack>

      {/* Draft Selector */}
      {drafts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Draft</InputLabel>
            <Select
              value={activeDraft?.id || ""}
              label="Select Draft"
              onChange={(e) => handleLoadDraft(e.target.value)}
            >
              {drafts.map((draft) => (
                <MenuItem key={draft.id} value={draft.id}>
                  {draft.name}
                  {draft.jobTitle && ` - ${draft.jobTitle}`}
                  {draft.companyName && ` at ${draft.companyName}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Main Content: Three-Panel Editor Layout */}
      {activeDraft ? (
        <Box sx={{ display: "flex", gap: 3, minHeight: "70vh" }}>
          {/* Left Panel: Generation Controls (35%) */}
          <Box sx={{ flex: "0 0 35%" }}>
            <CoverLetterGenerationPanel
              jobs={MOCK_JOBS}
              selectedJobId={selectedJobId}
              onJobSelect={(jobId) => setSelectedJobId(jobId)}
              tone={activeDraft.metadata.tone}
              onToneChange={(tone: Tone) => changeTone(tone)}
              length={activeDraft.metadata.length}
              onLengthChange={(length: Length) => changeLength(length)}
              culture={activeDraft.metadata.culture}
              onCultureChange={(culture: CompanyCulture) =>
                changeCulture(culture)
              }
              industryLanguage={industryLanguage}
              onIndustryLanguageChange={setIndustryLanguage}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              companyResearch={activeDraft.companyResearch}
            />
          </Box>

          {/* Middle Panel: AI Results (35%) */}
          <Box sx={{ flex: "0 0 35%" }}>
            <CoverLetterAIResultsPanel
              pendingContent={pendingAIContent}
              onApply={handleApplyContent}
              onRegenerate={handleRegenerate}
              onDismiss={handleDismissContent}
              isRegenerating={isRegenerating}
            />
          </Box>

          {/* Right Panel: Live Preview (30%) */}
          <Box sx={{ flex: "0 0 30%" }}>
            <CoverLetterPreviewPanel
              content={activeDraft.content}
              template={COVER_LETTER_TEMPLATES[activeDraft.templateId]}
              onUpdateHeader={(header) => updateHeader(header)}
              onUpdateOpening={(opening) => updateOpening(opening)}
              onUpdateBody={(body) => updateBody(body)}
              onUpdateClosing={(closing) => updateClosing(closing)}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </Box>
        </Box>
      ) : (
        <Alert severity="info">
          <Typography variant="body1">
            No draft selected. Click "New Cover Letter" to get started.
          </Typography>
        </Alert>
      )}

      {/* New Draft Dialog */}
      <Dialog
        open={showNewDraftDialog}
        onClose={() => setShowNewDraftDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Cover Letter</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Draft Name"
              fullWidth
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              placeholder="e.g., Software Engineer - Google"
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Template"
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <MenuItem value="formal">Formal Corporate</MenuItem>
                <MenuItem value="creative">Creative Design</MenuItem>
                <MenuItem value="technical">Technical Professional</MenuItem>
                <MenuItem value="modern">Modern Startup</MenuItem>
                <MenuItem value="minimal">Minimal Clean</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewDraftDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateDraft}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link to Job Dialog */}
      <Dialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link to Job Application</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Link this cover letter to your job application for tracking and
              analytics.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Job:{" "}
              {MOCK_JOBS.find((j) => j.id === linkingJobId)?.job_title || ""} at{" "}
              {MOCK_JOBS.find((j) => j.id === linkingJobId)?.company_name || ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will create a record in your job materials for reference and
              performance tracking.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLinkDialog(false)}>Skip</Button>
          <Button
            variant="contained"
            onClick={handleLinkToJob}
            disabled={isLinking}
          >
            {isLinking ? "Linking..." : "Link to Job"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
