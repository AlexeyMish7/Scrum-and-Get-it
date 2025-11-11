/**
 * CoverLetterStarter - Initial Screen for Cover Letter Editor
 *
 * WHAT: Draft selection and template picker before entering editor
 * WHY: Better onboarding - choose to load existing or create new draft
 *
 * Flow:
 * 1. Show existing cover letter drafts (if any)
 * 2. User picks: "Load Existing" or "Create New"
 * 3. If create new → Template selection
 * 4. Then navigate to editor with draft loaded
 *
 * Props:
 * - onStart: (draftId: string) => void - Called when ready to edit
 * - onCancel?: () => void - Called when user cancels
 */

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";
import { getCoverLetterTemplateList } from "@workspaces/ai/config/coverLetterTemplates";
import useUserJobs from "@shared/hooks/useUserJobs";
import CoverLetterTemplateShowcase from "./CoverLetterTemplateShowcase";

interface CoverLetterStarterProps {
  onStart: (draftId: string) => void;
  onCancel?: () => void;
}

export default function CoverLetterStarter({
  onStart,
  onCancel,
}: CoverLetterStarterProps) {
  const { drafts, createDraft, loadDraft, isLoading } = useCoverLetterDrafts();
  const { jobs } = useUserJobs(10);

  // Get system templates as array
  const templates = getCoverLetterTemplateList().filter((t) => t.isSystem);

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showTemplateShowcase, setShowTemplateShowcase] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(
    templates[0]?.id || "formal"
  );
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  // Handle load existing draft
  const handleLoadDraft = async (draftId: string) => {
    try {
      await loadDraft(draftId);
      onStart(draftId);
    } catch {
      setError("Failed to load draft");
    }
  };

  // Handle create new draft
  const handleCreateNew = async () => {
    if (!newDraftName.trim()) {
      setError("Please enter a name for your cover letter");
      return;
    }

    try {
      const job = selectedJobId
        ? jobs.find((j) => j.id === selectedJobId)
        : null;

      const draftId = await createDraft(
        newDraftName.trim(),
        selectedTemplate,
        selectedJobId || undefined,
        job?.title,
        job?.company
      );

      if (draftId) {
        setShowNewDialog(false);
        onStart(draftId);
      } else {
        setError("Failed to create draft");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create draft"
      );
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Cover Letter Builder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Load a previous cover letter or create a new one to get started
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Existing Drafts */}
        {drafts.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Your Cover Letters
            </Typography>
            <Stack spacing={2}>
              {drafts.map((draft) => (
                <Card
                  key={draft.id}
                  variant="outlined"
                  sx={{
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleLoadDraft(draft.id)}
                    disabled={isLoading}
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon color="primary" />
                        <Typography variant="h6" fontWeight={500}>
                          {draft.name}
                        </Typography>
                      </Stack>

                      {draft.jobTitle && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {draft.jobTitle}
                          {draft.companyName && ` @ ${draft.companyName}`}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={draft.templateId}
                          size="small"
                          variant="outlined"
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 14 }} />
                          {formatDate(draft.metadata.lastModified)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Create New Button */}
        <Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setShowNewDialog(true)}
            disabled={isLoading}
            sx={{ minWidth: 200 }}
          >
            Create New Cover Letter
          </Button>
          {onCancel && (
            <Button variant="text" onClick={onCancel} sx={{ ml: 2 }}>
              Cancel
            </Button>
          )}
        </Box>

        {/* Empty State */}
        {drafts.length === 0 && !isLoading && (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: "center",
              borderStyle: "dashed",
            }}
          >
            <EmailIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No cover letters yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first AI-powered cover letter to get started
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowNewDialog(true)}
            >
              Create Your First Cover Letter
            </Button>
          </Paper>
        )}
      </Stack>

      {/* Create New Dialog */}
      <Dialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Cover Letter
          <IconButton
            onClick={() => setShowNewDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Info Alert about Template Locking */}
            <Alert severity="info" icon={<EmailIcon />}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Template Choice is Permanent
              </Typography>
              <Typography variant="caption">
                Your template selection controls how AI generates content and
                cannot be changed later. Choose carefully based on your target
                industry and company culture.
              </Typography>
            </Alert>

            {/* Info Alert about Company Research */}
            <Alert severity="success" icon={<ArrowForwardIcon />}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                AI-Powered Personalization
              </Typography>
              <Typography variant="caption">
                If you link a job, we'll automatically fetch company research to
                personalize your cover letter with company-specific insights,
                recent news, and mission alignment.
              </Typography>
            </Alert>

            {/* Cover Letter Name */}
            <TextField
              label="Cover Letter Name"
              fullWidth
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              placeholder="e.g., Software Engineer Cover Letter"
              autoFocus
            />

            {/* Template Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={500}>
                Choose Template
              </Typography>
              <Stack spacing={2}>
                {/* Selected template display */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h4">
                        {selectedTemplate === "formal"
                          ? "💼"
                          : selectedTemplate === "creative"
                          ? "🎨"
                          : "⚙️"}
                      </Typography>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={500}>
                          {templates.find((t) => t.id === selectedTemplate)
                            ?.name || "Formal Business"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {templates.find((t) => t.id === selectedTemplate)
                            ?.description ||
                            "Professional template for corporate positions"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Browse Templates button */}
                <Button
                  variant="outlined"
                  onClick={() => setShowTemplateShowcase(true)}
                  sx={{ justifyContent: "center" }}
                >
                  Browse All Templates
                </Button>
              </Stack>
            </Box>

            {/* Optional Job Link */}
            <FormControl fullWidth>
              <InputLabel>Link to Job (Optional)</InputLabel>
              <Select
                value={selectedJobId}
                onChange={(e) =>
                  setSelectedJobId(e.target.value as number | "")
                }
                label="Link to Job (Optional)"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job.id} value={job.id}>
                    {job.title} @ {job.company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowNewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateNew}
            disabled={!newDraftName.trim() || isLoading}
            endIcon={<ArrowForwardIcon />}
          >
            Create & Start Writing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Showcase Dialog */}
      <CoverLetterTemplateShowcase
        open={showTemplateShowcase}
        onClose={() => setShowTemplateShowcase(false)}
        currentTemplateId={selectedTemplate}
        onSelectTemplate={(templateId) => {
          setSelectedTemplate(templateId);
          setShowTemplateShowcase(false);
        }}
      />
    </Container>
  );
}
