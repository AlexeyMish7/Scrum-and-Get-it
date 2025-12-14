/**
 * DocumentLibrary - Document Library Page
 *
 * Displays all documents with filtering, search, and management.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import {
  Container,
  Typography,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Search,
  Description,
  Article,
  Visibility,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useTeam } from "@shared/context/useTeam";
import { ShareDocumentDialog } from "../../../ai_workspace/components/reviews";
import type { DocumentRow } from "@shared/types/database";
import { useCoreDocuments } from "@shared/cache/coreHooks";

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();
  const { currentTeam } = useTeam();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "resume" | "cover-letter"
  >("all");

  const documentsQuery = useCoreDocuments(user?.id);
  const documents = documentsQuery.data ?? [];
  const loading = documentsQuery.isLoading;

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<DocumentRow | null>(
    null
  );

  // Handle share button click
  function handleShareDocument(doc: DocumentRow) {
    setDocumentToShare(doc);
    setShareDialogOpen(true);
  }

  // Surface query errors via the shared snackbar.
  useEffect(() => {
    if (documentsQuery.error) {
      handleError(documentsQuery.error as Error);
    }
  }, [documentsQuery.error, handleError]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.target_company?.toLowerCase().includes(query) ||
          doc.target_role?.toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.type === filterType);
    }

    return filtered;
  }, [documents, searchQuery, filterType]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, pt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Document Library
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        View and manage all your resumes and cover letters in one place.
      </Typography>

      {/* Team sharing tip - only show when not in a team */}
      {!currentTeam && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Want to share documents for review?</strong> Join or create
            a team to enable collaborative review features with mentors and
            peers.{" "}
            <Button
              size="small"
              onClick={() => navigate("/team")}
              sx={{ textTransform: "none" }}
            >
              Go to Team Dashboard
            </Button>
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_, value) => value && setFilterType(value)}
          size="small"
        >
          <ToggleButton value="all">All Documents</ToggleButton>
          <ToggleButton value="resume">Resumes</ToggleButton>
          <ToggleButton value="cover-letter">Cover Letters</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Document grid */}
          {filteredDocuments.length > 0 ? (
            <Grid container spacing={3}>
              {filteredDocuments.map((doc) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        {doc.type === "resume" ? (
                          <Description color="primary" sx={{ mr: 1 }} />
                        ) : (
                          <Article color="secondary" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          {doc.name}
                        </Typography>
                      </Box>

                      {doc.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {doc.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={
                            doc.type === "resume" ? "Resume" : "Cover Letter"
                          }
                          size="small"
                          color={
                            doc.type === "resume" ? "primary" : "secondary"
                          }
                        />
                        <Chip
                          label={doc.status}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      {doc.target_company && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          For: {doc.target_company}
                          {doc.target_role && ` - ${doc.target_role}`}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        Created: {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>

                      {doc.total_versions > 1 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {doc.total_versions} versions
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/ai/document/${doc.id}`)}
                      >
                        View
                      </Button>
                      {currentTeam && (
                        <Button
                          size="small"
                          startIcon={<ShareIcon />}
                          onClick={() => handleShareDocument(doc)}
                        >
                          Share
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "text.secondary",
              }}
            >
              <Typography variant="h6" gutterBottom>
                {documents.length === 0
                  ? "No documents yet"
                  : "No documents match your filters"}
              </Typography>
              <Typography variant="body2">
                {documents.length === 0
                  ? "Generate your first resume or cover letter to get started"
                  : "Try adjusting your search query or filters"}
              </Typography>
            </Box>
          )}
        </>
      )}

      <ErrorSnackbar notification={notification} onClose={closeNotification} />

      {/* Share Document Dialog for collaborative review (UC-110) */}
      <ShareDocumentDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        documentId={documentToShare?.id || ""}
        documentName={documentToShare?.name || "Document"}
        teamId={currentTeam?.id || ""}
        onSuccess={() => {
          showSuccess("Review request sent successfully!");
          setShareDialogOpen(false);
          setDocumentToShare(null);
        }}
      />
    </Container>
  );
}
