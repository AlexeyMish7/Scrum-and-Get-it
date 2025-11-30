/**
 * MENTEE DOCUMENTS VIEWER COMPONENT (UC-109)
 *
 * Purpose:
 * - Display mentee's resumes and cover letters
 * - Allow mentors to view document list and metadata
 * - Provide feedback on specific documents
 * - Show job association for cover letters
 *
 * Used by:
 * - MentorDashboard for document review
 * - Mentee detail views for comprehensive document access
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Description as ResumeIcon,
  Article as CoverLetterIcon,
  Comment as FeedbackIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import type {
  MenteeDocument,
  CreateFeedbackData,
} from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface MenteeDocumentsViewerProps {
  candidateId: string;
  candidateName: string;
  teamId: string;
  documents: MenteeDocument[];
  onProvideFeedback?: (data: CreateFeedbackData) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOCUMENT_TYPES = {
  resume: {
    label: "Resume",
    icon: <ResumeIcon />,
    color: "primary" as const,
  },
  cover_letter: {
    label: "Cover Letter",
    icon: <CoverLetterIcon />,
    color: "secondary" as const,
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`documents-tabpanel-${index}`}
      aria-labelledby={`documents-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MenteeDocumentsViewer({
  candidateId,
  candidateName,
  teamId,
  documents,
  onProvideFeedback,
  onRefresh,
  loading = false,
}: MenteeDocumentsViewerProps) {
  // State
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] =
    useState<MenteeDocument | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Separate documents by type
  const resumes = documents.filter((doc) => doc.documentType === "resume");
  const coverLetters = documents.filter(
    (doc) => doc.documentType === "cover_letter"
  );

  // Auto-select first document on load
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0]);
    }
  }, [documents, selectedDocument]);

  // Handle feedback submission - using the correct feedbackType from CreateFeedbackData
  const handleSubmitFeedback = async () => {
    if (!selectedDocument || !feedbackContent.trim() || !onProvideFeedback)
      return;

    // Determine feedback type based on document type
    const feedbackType =
      selectedDocument.documentType === "resume" ? "resume" : "cover_letter";

    setSubmitting(true);
    try {
      await onProvideFeedback({
        candidateId,
        teamId,
        feedbackType,
        feedbackText: `Feedback on "${selectedDocument.title}": ${feedbackContent}`,
        relatedDocumentId: selectedDocument.id,
      });
      setShowFeedbackDialog(false);
      setFeedbackContent("");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get relative time helper
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Render document list item
  const renderDocumentItem = (doc: MenteeDocument) => {
    const typeConfig = DOCUMENT_TYPES[doc.documentType] || {
      label: "Document",
      icon: <ResumeIcon />,
      color: "default" as const,
    };
    const isSelected = selectedDocument?.id === doc.id;

    return (
      <ListItem key={doc.id} disablePadding>
        <ListItemButton
          selected={isSelected}
          onClick={() => setSelectedDocument(doc)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon
            sx={{ color: isSelected ? `${typeConfig.color}.main` : undefined }}
          >
            {typeConfig.icon}
          </ListItemIcon>
          <ListItemText
            primary={doc.title}
            secondary={
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                component="span"
              >
                <Typography variant="caption" component="span">
                  {getRelativeTime(doc.updatedAt)}
                </Typography>
                {doc.version > 1 && (
                  <Chip
                    size="small"
                    label={`v${doc.version}`}
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.65rem" }}
                  />
                )}
              </Stack>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  // Render document preview section
  const renderDocumentPreview = () => {
    if (!selectedDocument) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            py: 6,
          }}
        >
          <ResumeIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary">
            Select a document to preview
          </Typography>
        </Box>
      );
    }

    const typeConfig = DOCUMENT_TYPES[selectedDocument.documentType] || {
      label: "Document",
      icon: <ResumeIcon />,
      color: "primary" as const,
    };

    return (
      <Box>
        {/* Document Header */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="h6">{selectedDocument.title}</Typography>
              <Chip
                label={typeConfig.label}
                size="small"
                color={typeConfig.color}
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Last updated: {formatDate(selectedDocument.updatedAt)}
              {selectedDocument.version > 1 &&
                ` • Version ${selectedDocument.version}`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {onProvideFeedback && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<FeedbackIcon />}
                onClick={() => setShowFeedbackDialog(true)}
              >
                Give Feedback
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Document Info */}
        <Stack spacing={2}>
          {/* Job association for cover letters */}
          {selectedDocument.jobId && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <WorkIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Associated Job</Typography>
              </Stack>
              <Typography variant="body2">
                {selectedDocument.jobTitle || "Unknown Position"}
                {selectedDocument.companyName &&
                  ` at ${selectedDocument.companyName}`}
              </Typography>
            </Paper>
          )}

          {/* Version History info */}
          {selectedDocument.version > 1 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Version History</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                This document has been revised {selectedDocument.version - 1}{" "}
                time
                {selectedDocument.version > 2 ? "s" : ""}.
              </Typography>
            </Paper>
          )}

          {/* Document metadata */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedDocument.createdAt)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Last Modified
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedDocument.updatedAt)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Current Version
                </Typography>
                <Typography variant="body2">
                  v{selectedDocument.version}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Alert severity="info">
            To view the full document content, ask {candidateName} to share it
            directly or navigate to the document editor in the AI Workspace.
          </Alert>
        </Stack>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <ResumeIcon color="primary" />
          <Box>
            <Typography variant="h6">Documents for {candidateName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {resumes.length} resume{resumes.length !== 1 ? "s" : ""},{" "}
              {coverLetters.length} cover letter
              {coverLetters.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Stack>
        {onRefresh && (
          <Tooltip title="Refresh documents">
            <IconButton onClick={onRefresh} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Main Content */}
      {documents.length === 0 ? (
        <Box textAlign="center" py={4}>
          <ResumeIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">No documents yet</Typography>
          <Typography variant="body2" color="text.secondary">
            {candidateName} hasn&apos;t created any resumes or cover letters
            yet.
          </Typography>
        </Box>
      ) : (
        <Stack direction="row" spacing={3}>
          {/* Document List (Left Panel) */}
          <Box sx={{ width: 280, flexShrink: 0 }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="fullWidth"
              sx={{ mb: 1 }}
            >
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <span>Resumes</span>
                    <Chip size="small" label={resumes.length} />
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <span>Letters</span>
                    <Chip size="small" label={coverLetters.length} />
                  </Stack>
                }
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {resumes.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  No resumes yet
                </Typography>
              ) : (
                <List dense>{resumes.map(renderDocumentItem)}</List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {coverLetters.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  No cover letters yet
                </Typography>
              ) : (
                <List dense>{coverLetters.map(renderDocumentItem)}</List>
              )}
            </TabPanel>
          </Box>

          {/* Document Preview (Right Panel) */}
          <Box sx={{ flex: 1, minHeight: 300 }}>{renderDocumentPreview()}</Box>
        </Stack>
      )}

      {/* Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Provide Feedback on {selectedDocument?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Your feedback will be shared with {candidateName} to help them
              improve their document.
            </Alert>
            <TextField
              label="Feedback"
              multiline
              rows={4}
              fullWidth
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="Share specific suggestions for improvement, what works well, and any areas that need attention..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={!feedbackContent.trim() || submitting}
            startIcon={<FeedbackIcon />}
          >
            {submitting ? "Sending..." : "Send Feedback"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MenteeDocumentsViewer;
