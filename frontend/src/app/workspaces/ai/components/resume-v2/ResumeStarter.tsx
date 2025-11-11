/**
 * ResumeStarter - Initial Screen for Resume Editor
 *
 * WHAT: Draft selection and template picker before entering editor
 * WHY: Better onboarding - choose to load existing or create new draft
 *
 * Flow:
 * 1. Show existing drafts (if any)
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
  Description as DescriptionIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";
import useUserJobs from "@shared/hooks/useUserJobs";
import { TemplateSelector } from "../ResumeEditorV2/TemplateSelector";

interface ResumeStarterProps {
  onStart: (draftId: string) => void;
  onCancel?: () => void;
}

export default function ResumeStarter({
  onStart,
  onCancel,
}: ResumeStarterProps) {
  const { drafts, createDraft, loadDraft, deleteDraft, isLoading } =
    useResumeDraftsV2();
  const { jobs } = useUserJobs(10);

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern"); // AI behavior template
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

  // Handle delete draft
  const handleDeleteDraft = async (
    draftId: string,
    draftName: string,
    event: React.MouseEvent
  ) => {
    // Prevent card click from triggering
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${draftName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDraft(draftId);
      // Success - the draft list will auto-update via Zustand
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete draft"
      );
    }
  };

  // Handle create new draft
  const handleCreateNew = async () => {
    if (!newDraftName.trim()) {
      setError("Please enter a name for your resume");
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
            Resume Builder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Load a previous resume or create a new one to get started
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
              Your Resumes ({drafts.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select a resume to edit or create a new one
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
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
                  <Stack direction="row">
                    {/* Main Content - Clickable */}
                    <CardActionArea
                      onClick={() => handleLoadDraft(draft.id)}
                      disabled={isLoading}
                      sx={{ flex: 1, p: 2.5 }}
                    >
                      <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DescriptionIcon color="primary" fontSize="large" />
                          <Typography variant="h6" fontWeight={500}>
                            {draft.name}
                          </Typography>
                        </Stack>

                        {draft.metadata.jobTitle && (
                          <Typography variant="body2" color="text.secondary">
                            📌 {draft.metadata.jobTitle}
                            {draft.metadata.jobCompany &&
                              ` @ ${draft.metadata.jobCompany}`}
                          </Typography>
                        )}

                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Chip
                            label={draft.templateId}
                            size="small"
                            variant="outlined"
                            color="primary"
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
                            Modified {formatDate(draft.metadata.lastModified)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardActionArea>

                    {/* Action Buttons - Right Side */}
                    <Stack
                      sx={{
                        p: 2,
                        borderLeft: 1,
                        borderColor: "divider",
                        minWidth: 100,
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<EditIcon />}
                        onClick={() => handleLoadDraft(draft.id)}
                        disabled={isLoading}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={(e) =>
                          handleDeleteDraft(draft.id, draft.name, e)
                        }
                        disabled={isLoading}
                        fullWidth
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
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
            Create New Resume
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
            <DescriptionIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No resumes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first AI-powered resume to get started
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowNewDialog(true)}
            >
              Create Your First Resume
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
          Create New Resume
          <IconButton
            onClick={() => setShowNewDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Resume Name */}
            <TextField
              label="Resume Name"
              fullWidth
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              placeholder="e.g., Software Engineer Resume"
              autoFocus
            />

            {/* Template Selection - AI Behavior Only */}
            <Box>
              <TemplateSelector
                selectedTemplateId={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
              <Typography
                variant="caption"
                color="info.main"
                sx={{
                  display: "block",
                  mt: 2,
                  p: 1.5,
                  bgcolor: "info.50",
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: "info.main",
                }}
              >
                ℹ️ You'll choose visual styling (fonts, colors, layout) later
                when you export your resume.
              </Typography>
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
            Create & Start Editing
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
