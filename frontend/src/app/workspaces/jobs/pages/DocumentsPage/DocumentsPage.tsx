/**
 * Documents & Materials Page (UC-042)
 *
 * Manage resume, cover letter, and portfolio documents for job applications.
 * Track which materials were used for each application and view usage analytics.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  InsertDriveFile as FileIcon,
  Description as ResumeIcon,
  Article as CoverLetterIcon,
  Folder as PortfolioIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/common/ErrorSnackbar";
import {
  listDocuments,
  getSignedDownloadUrl,
  type DocumentRow,
  type DocumentKind,
} from "@shared/services/documents";
import { withUser } from "@shared/services/crud";
import type { JobMaterialsRow } from "@shared/services/jobMaterials";
import LinkDocumentDialog from "../../components/LinkDocumentDialog";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<DocumentKind | "all">("all");
  const [linkedJobs, setLinkedJobs] = useState<JobMaterialsRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    let filtered = documents;
    if (kindFilter !== "all") {
      filtered = filtered.filter((doc) => doc.kind === kindFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.file_name.toLowerCase().includes(query)
      );
    }
    setFilteredDocs(filtered);
  }, [documents, searchQuery, kindFilter]);

  useEffect(() => {
    if (selectedDoc && user?.id) {
      loadLinkedJobs(selectedDoc.id);
    } else {
      setLinkedJobs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoc, user?.id]);

  async function loadDocuments() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await listDocuments(user.id, {
        order: { column: "uploaded_at", ascending: false },
      });
      if (result.error) throw new Error(result.error.message);
      setDocuments(result.data || []);
    } catch (err) {
      handleError(err, "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function loadLinkedJobs(docId: string) {
    if (!user?.id) return;
    setDetailLoading(true);
    try {
      const userCrud = withUser(user.id);
      const result = await userCrud.listRows<JobMaterialsRow>(
        "job_materials",
        "*",
        {
          order: { column: "created_at", ascending: false },
        }
      );
      if (result.error) throw new Error(result.error.message);
      const filtered = (result.data || []).filter(
        (m) => m.resume_document_id === docId || m.cover_document_id === docId
      );
      setLinkedJobs(filtered);
    } catch (err) {
      handleError(err, "Failed to load linked jobs");
      setLinkedJobs([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDownload(doc: DocumentRow) {
    try {
      const result = await getSignedDownloadUrl(doc.file_path, 60, "documents");
      if (result.error || !result.data?.url) {
        throw new Error(
          result.error?.message || "Failed to generate download URL"
        );
      }
      window.open(result.data.url, "_blank");
      showSuccess(`Downloading ${doc.file_name}`);
    } catch (err) {
      handleError(err, "Failed to download document");
    }
  }

  function getKindIcon(kind: DocumentKind) {
    if (kind === "resume") return <ResumeIcon />;
    if (kind === "cover_letter") return <CoverLetterIcon />;
    if (kind === "portfolio") return <PortfolioIcon />;
    return <FileIcon />;
  }

  function getKindColor(
    kind: DocumentKind
  ): "primary" | "secondary" | "success" | "default" {
    if (kind === "resume") return "primary";
    if (kind === "cover_letter") return "secondary";
    if (kind === "portfolio") return "success";
    return "default";
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatBytes(bytes?: number | null): string {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h4">Documents & Materials</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDocuments}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button variant="contained" startIcon={<UploadIcon />} disabled>
              Upload
            </Button>
          </Stack>
        </Box>
        <Typography color="text.secondary">
          Manage resumes, cover letters, and portfolio documents. Track which
          materials were used for each application.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ maxWidth: { md: 400 } }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={kindFilter}
              label="Document Type"
              onChange={(e) =>
                setKindFilter(e.target.value as DocumentKind | "all")
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="resume">Resumes</MenuItem>
              <MenuItem value="cover_letter">Cover Letters</MenuItem>
              <MenuItem value="portfolio">Portfolio</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto" }}
          >
            {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
        {/* Documents List */}
        <Paper sx={{ width: "33%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6">Documents</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredDocs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {documents.length === 0
                    ? "No documents yet."
                    : "No documents match your filters."}
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {filteredDocs.map((doc, idx) => (
                  <Box key={doc.id}>
                    {idx > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={selectedDoc?.id === doc.id}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Box sx={{ mr: 2 }}>{getKindIcon(doc.kind)}</Box>
                        <ListItemText
                          primary={doc.file_name}
                          secondary={
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Chip
                                label={doc.kind}
                                size="small"
                                color={getKindColor(doc.kind)}
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(doc.uploaded_at)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* Detail Pane */}
        <Paper sx={{ width: "42%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6">
              {selectedDoc ? "Document Details" : "Select a Document"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {!selectedDoc ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <FileIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography color="text.secondary">
                  Select a document from the list to view details.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      File Information
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Filename
                        </Typography>
                        <Typography variant="body2">
                          {selectedDoc.file_name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Type
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={selectedDoc.kind}
                            size="small"
                            color={getKindColor(selectedDoc.kind)}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Uploaded
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(selectedDoc.uploaded_at)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Size
                        </Typography>
                        <Typography variant="body2">
                          {formatBytes(selectedDoc.bytes)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Linked Jobs
                      </Typography>
                      {detailLoading && <CircularProgress size={16} />}
                    </Box>
                    {linkedJobs.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Not yet linked to any jobs.
                      </Typography>
                    ) : (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {linkedJobs.map((material) => (
                          <Box
                            key={material.id}
                            sx={{
                              p: 1,
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              Job ID: {material.job_id}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Linked on {formatDate(material.created_at)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedDoc)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkDialogOpen(true)}
                  >
                    Link to Job
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Analytics */}
        <Paper sx={{ width: "25%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6">Analytics</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Summary
                  </Typography>
                  <Stack spacing={1}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">Total:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {documents.length}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">Resumes:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {documents.filter((d) => d.kind === "resume").length}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">Cover Letters:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {
                          documents.filter((d) => d.kind === "cover_letter")
                            .length
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info">
                Track document performance by monitoring response rates.
              </Alert>

              {selectedDoc && linkedJobs.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Usage
                    </Typography>
                    <Typography variant="body2">
                      Used in <strong>{linkedJobs.length}</strong> application
                      {linkedJobs.length !== 1 ? "s" : ""}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>

      {selectedDoc && (
        <LinkDocumentDialog
          open={linkDialogOpen}
          onClose={() => setLinkDialogOpen(false)}
          documentId={selectedDoc.id}
          documentKind={selectedDoc.kind}
          onSuccess={() => {
            showSuccess("Document linked successfully");
            loadLinkedJobs(selectedDoc.id);
          }}
          onError={(err) => handleError(err, "Failed to link document")}
        />
      )}

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
}
