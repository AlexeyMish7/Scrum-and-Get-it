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
import { useNavigate } from "react-router-dom";
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
  RateReview as ReviewIcon,
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
  const navigate = useNavigate();

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
            <Button
              size="small"
              variant="contained"
              startIcon={<ReviewIcon />}
              onClick={() => navigate("/ai/reviews")}
            >
              View Reviews
            </Button>
            {onProvideFeedback && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<FeedbackIcon />}
                onClick={() => setShowFeedbackDialog(true)}
              >
                Quick Feedback
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

          {/* Visual Document Placeholder Preview */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: "grey.50",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Document Preview
            </Typography>

            {/* Stylized document preview showing structure without content */}
            <Box
              sx={{
                bgcolor: "white",
                border: 1,
                borderColor: "grey.300",
                borderRadius: 1,
                p: 2,
                minHeight: 200,
              }}
            >
              {selectedDocument.documentType === "resume" ? (
                // Resume placeholder structure
                <Stack spacing={1.5}>
                  {/* Header placeholder */}
                  <Box sx={{ textAlign: "center", mb: 1 }}>
                    <Box
                      sx={{
                        height: 16,
                        bgcolor: "grey.300",
                        borderRadius: 0.5,
                        width: "50%",
                        mx: "auto",
                        mb: 0.5,
                      }}
                    />
                    <Box
                      sx={{
                        height: 10,
                        bgcolor: "grey.200",
                        borderRadius: 0.5,
                        width: "35%",
                        mx: "auto",
                      }}
                    />
                  </Box>
                  <Divider />

                  {/* Section placeholders */}
                  {["Experience", "Education", "Skills"].map((section) => (
                    <Box key={section}>
                      <Box
                        sx={{
                          height: 12,
                          bgcolor: "primary.light",
                          borderRadius: 0.5,
                          width: "25%",
                          mb: 1,
                          opacity: 0.6,
                        }}
                      />
                      <Stack spacing={0.5}>
                        {[1, 2].map((line) => (
                          <Box
                            key={line}
                            sx={{
                              height: 8,
                              bgcolor: "grey.200",
                              borderRadius: 0.5,
                              width: `${Math.random() * 30 + 60}%`,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                // Cover letter placeholder structure
                <Stack spacing={1.5}>
                  {/* Header */}
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        height: 12,
                        bgcolor: "grey.300",
                        borderRadius: 0.5,
                        width: "40%",
                        mb: 0.5,
                      }}
                    />
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: "grey.200",
                        borderRadius: 0.5,
                        width: "30%",
                      }}
                    />
                  </Box>
                  <Divider />

                  {/* Paragraphs */}
                  {[1, 2, 3].map((para) => (
                    <Stack key={para} spacing={0.5}>
                      {[1, 2, 3, 4].map((line) => (
                        <Box
                          key={line}
                          sx={{
                            height: 8,
                            bgcolor: "grey.200",
                            borderRadius: 0.5,
                            width: line === 4 ? "60%" : "100%",
                          }}
                        />
                      ))}
                    </Stack>
                  ))}

                  {/* Signature */}
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: "grey.200",
                        borderRadius: 0.5,
                        width: "20%",
                        mb: 0.5,
                      }}
                    />
                    <Box
                      sx={{
                        height: 10,
                        bgcolor: "grey.300",
                        borderRadius: 0.5,
                        width: "30%",
                      }}
                    />
                  </Box>
                </Stack>
              )}

              {/* Privacy overlay */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Chip
                  label="Content hidden for privacy"
                  size="small"
                  sx={{ bgcolor: "white" }}
                />
              </Box>
            </Box>
          </Paper>

          <Alert severity="info" icon={<ReviewIcon />}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>How to review full document content:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              1. Ask {candidateName} to share this document with you via the{" "}
              <strong>Share for Review</strong> feature in their Documents view
              <br />
              2. Once shared, you'll find it in your{" "}
              <Button
                size="small"
                onClick={() => navigate("/ai/reviews")}
                sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
              >
                Reviews inbox
              </Button>{" "}
              where you can view, comment, and approve
            </Typography>
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
