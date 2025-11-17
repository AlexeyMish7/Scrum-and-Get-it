/**
 * DocumentsView — Full-page documents management
 *
 * Purpose: Manage resumes, cover letters, and other job materials
 * in a dedicated workspace view with tabs and bulk operations.
 *
 * Contract:
 * - Inputs: None (reads from auth context and query params)
 * - Outputs: Full-page UI with tabs, grid/list toggle, bulk operations
 * - Error modes: Uses `useErrorHandler()` for feedback
 *
 * Features:
 * - Tabs: All | Resumes | Cover Letters | Other
 * - View toggle: Grid / List
 * - Bulk operations: Select, delete, download
 * - Job associations display
 * - Upload new documents
 * - Search/filter documents
 */

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  Grid,
  Toolbar,
} from "@mui/material";
import {
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { supabase } from "@shared/services/supabaseClient";
import { withUser } from "@shared/services/crud";
import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";
import type { JobRow } from "@job_pipeline/types";

// Types for documents
interface DraftDocument {
  id: string;
  title?: string;
  name?: string;
  content?: unknown;
  preview?: unknown;
  text?: unknown;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  data?: Record<string, unknown>;
  job_id?: number;
  jobId?: number;
  kind?: "resume" | "cover_letter" | "other";
}

type DocumentTab = "all" | "resumes" | "covers" | "other";
type ViewMode = "grid" | "list";

export default function DocumentsView() {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  // State
  const [activeTab, setActiveTab] = useState<DocumentTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [resumes, setResumes] = useState<DraftDocument[]>([]);
  const [covers, setCovers] = useState<DraftDocument[]>([]);
  const [otherDocs, setOtherDocs] = useState<DraftDocument[]>([]);

  const [loading, setLoading] = useState(false);

  // Load jobs for association display
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const userCrud = withUser(user.id);
        const res = await userCrud.listRows("jobs", "*", {
          order: { column: "created_at", ascending: false },
        });
        if (res.error) throw new Error(res.error.message);
        setJobs((res.data || []) as JobRow[]);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      }
    })();
  }, [user?.id]);

  // Load all documents
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      try {
        // 1) Resume drafts
        const { data: resumeRows, error: resumeErr } = await supabase
          .from("resume_drafts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (resumeErr) throw resumeErr;
        const resumesWithKind = (resumeRows || []).map((r: DraftDocument) => ({
          ...r,
          kind: "resume" as const,
        }));

        // 2) Cover letters: merge local cache with DB
        const store = useCoverLetterDrafts.getState();
        if (store.setUserId) store.setUserId(user.id);
        if (store.loadFromCacheSync) store.loadFromCacheSync();
        const cached = (store.drafts || []).map((c: DraftDocument) => ({
          ...c,
          kind: "cover_letter" as const,
        }));

        const { data: dbCovers, error: coverErr } = await supabase
          .from("cover_letter_drafts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (coverErr) throw coverErr;

        const coverMap = new Map<string, DraftDocument>();
        (dbCovers || []).forEach((c: DraftDocument) =>
          coverMap.set(String(c.id), { ...c, kind: "cover_letter" as const })
        );
        (cached || []).forEach((c: DraftDocument) => {
          if (!coverMap.has(String(c.id))) coverMap.set(String(c.id), c);
        });

        // 3) Other documents (future: from documents table)
        const otherDocsWithKind: DraftDocument[] = [];

        setResumes(resumesWithKind);
        setCovers(Array.from(coverMap.values()));
        setOtherDocs(otherDocsWithKind);
      } catch (err) {
        console.error(err);
        handleError(err, "Failed to load documents");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, handleError]);

  // Filtered documents based on tab and search
  const filteredDocuments = useMemo(() => {
    let docs: DraftDocument[] = [];

    switch (activeTab) {
      case "all":
        docs = [...resumes, ...covers, ...otherDocs];
        break;
      case "resumes":
        docs = resumes;
        break;
      case "covers":
        docs = covers;
        break;
      case "other":
        docs = otherDocs;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter((d) => {
        const title = (d.title || d.name || "").toLowerCase();
        const jobId = String(d.job_id || d.jobId || "");
        return title.includes(q) || jobId.includes(q);
      });
    }

    return docs;
  }, [activeTab, searchQuery, resumes, covers, otherDocs]);

  // Get job title for a document
  function getJobTitle(doc: DraftDocument): string | null {
    const jobId = doc.job_id ?? doc.jobId ?? doc.metadata?.jobId ?? null;
    if (!jobId) return null;
    const job = jobs.find((j) => j.id === jobId);
    return job ? `${job.job_title} — ${job.company_name}` : `Job #${jobId}`;
  }

  // Download document
  function downloadDocument(doc: DraftDocument) {
    try {
      if (doc.kind === "resume") {
        const content = doc.content ?? doc.preview ?? doc;
        const blob = new Blob([JSON.stringify(content, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.title || doc.name || "resume"}_${doc.id}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (doc.kind === "cover_letter") {
        const content = doc.content ?? doc.text ?? doc;
        let text = "";
        if (typeof content === "string") text = content;
        else if (
          content &&
          typeof content === "object" &&
          "sections" in content
        ) {
          const s = content.sections as Record<string, string>;
          text = `${s.opening || ""}\n\n${s.body || ""}\n\n${s.closing || ""}`;
        } else text = JSON.stringify(content, null, 2);
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.title || doc.name || "cover_letter"}_${doc.id}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      showSuccess("Document downloaded");
    } catch (err) {
      handleError(err, "Failed to download document");
    }
  }

  // Bulk download selected documents
  function downloadSelected() {
    const selectedDocs = filteredDocuments.filter((d) => selectedIds.has(d.id));
    selectedDocs.forEach((d) => downloadDocument(d));
    setSelectedIds(new Set());
  }

  // Bulk delete selected documents
  async function deleteSelected() {
    if (!user?.id) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} document(s)? This action cannot be undone.`
      )
    )
      return;

    try {
      const resumeIds = Array.from(selectedIds).filter((id) =>
        resumes.some((r) => r.id === id)
      );
      const coverIds = Array.from(selectedIds).filter((id) =>
        covers.some((c) => c.id === id)
      );

      if (resumeIds.length > 0) {
        const { error: resumeErr } = await supabase
          .from("resume_drafts")
          .delete()
          .in("id", resumeIds)
          .eq("user_id", user.id);
        if (resumeErr) throw resumeErr;
      }

      if (coverIds.length > 0) {
        const { error: coverErr } = await supabase
          .from("cover_letter_drafts")
          .delete()
          .in("id", coverIds)
          .eq("user_id", user.id);
        if (coverErr) throw coverErr;
      }

      // Refresh data
      setResumes((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setCovers((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      showSuccess(`Deleted ${selectedIds.size} document(s)`);
    } catch (err) {
      handleError(err, "Failed to delete documents");
    }
  }

  // Toggle selection
  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Select all / deselect all
  function toggleSelectAll() {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  }

  // Render document in grid mode
  function renderDocumentCard(doc: DraftDocument) {
    const jobTitle = getJobTitle(doc);
    const isSelected = selectedIds.has(doc.id);
    const kindLabel =
      doc.kind === "resume"
        ? "Resume"
        : doc.kind === "cover_letter"
        ? "Cover Letter"
        : "Other";

    return (
      <Card
        key={doc.id}
        sx={{
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? "primary.main" : "divider",
          position: "relative",
        }}
      >
        <Checkbox
          checked={isSelected}
          onChange={() => toggleSelection(doc.id)}
          sx={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}
        />
        <CardContent sx={{ pt: 6 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip label={kindLabel} size="small" color="primary" />
          </Stack>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {doc.title || doc.name || `Document ${doc.id}`}
          </Typography>
          {jobTitle && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <WorkIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {jobTitle}
              </Typography>
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary">
            Created:{" "}
            {doc.created_at
              ? new Date(doc.created_at).toLocaleDateString()
              : "Unknown"}
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => downloadDocument(doc)}
          >
            Download
          </Button>
        </CardActions>
      </Card>
    );
  }

  // Render document in list mode
  function renderDocumentListItem(doc: DraftDocument) {
    const jobTitle = getJobTitle(doc);
    const isSelected = selectedIds.has(doc.id);
    const kindLabel =
      doc.kind === "resume"
        ? "Resume"
        : doc.kind === "cover_letter"
        ? "Cover Letter"
        : "Other";

    return (
      <ListItem
        key={doc.id}
        disablePadding
        sx={{
          border: 1,
          borderColor: isSelected ? "primary.main" : "divider",
          borderRadius: 1,
          mb: 1,
        }}
      >
        <ListItemButton onClick={() => toggleSelection(doc.id)}>
          <ListItemIcon>
            <Checkbox checked={isSelected} edge="start" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1">
                  {doc.title || doc.name || `Document ${doc.id}`}
                </Typography>
                <Chip label={kindLabel} size="small" color="primary" />
              </Stack>
            }
            secondary={
              <Stack direction="column" spacing={0.5} sx={{ mt: 0.5 }}>
                {jobTitle && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <WorkIcon fontSize="small" />
                    <Typography variant="body2">{jobTitle}</Typography>
                  </Stack>
                )}
                <Typography variant="caption">
                  Created:{" "}
                  {doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString()
                    : "Unknown"}
                </Typography>
              </Stack>
            }
          />
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              downloadDocument(doc);
            }}
          >
            <DownloadIcon />
          </IconButton>
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5">Documents & Materials</Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              disabled
              size="small"
            >
              Upload
            </Button>
          </Stack>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v as DocumentTab)}
          sx={{ px: 2 }}
        >
          <Tab
            label={`All (${resumes.length + covers.length + otherDocs.length})`}
            value="all"
          />
          <Tab label={`Resumes (${resumes.length})`} value="resumes" />
          <Tab label={`Cover Letters (${covers.length})`} value="covers" />
          <Tab label={`Other (${otherDocs.length})`} value="other" />
        </Tabs>
      </Paper>

      {/* Toolbar */}
      <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v as ViewMode)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridViewIcon />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        {selectedIds.size > 0 && (
          <>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={downloadSelected}
            >
              Download ({selectedIds.size})
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={deleteSelected}
            >
              Delete ({selectedIds.size})
            </Button>
          </>
        )}

        <Checkbox
          checked={
            filteredDocuments.length > 0 &&
            selectedIds.size === filteredDocuments.length
          }
          indeterminate={
            selectedIds.size > 0 && selectedIds.size < filteredDocuments.length
          }
          onChange={toggleSelectAll}
        />
      </Toolbar>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <DescriptionIcon
              sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchQuery
                ? "Try adjusting your search query"
                : "Create resumes or cover letters in the AI workspace"}
            </Typography>
          </Box>
        ) : viewMode === "grid" ? (
          <Grid container spacing={2}>
            {filteredDocuments.map((doc) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                {renderDocumentCard(doc)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <List>
            {filteredDocuments.map((doc) => renderDocumentListItem(doc))}
          </List>
        )}
      </Box>
    </Box>
  );
}
