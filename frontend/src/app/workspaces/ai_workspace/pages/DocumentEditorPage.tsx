/**
 * DocumentEditorPage
 *
 * Main page for editing documents with export functionality.
 * Combines DocumentEditor and ExportDialog for a complete editing experience.
 *
 * Flow:
 * 1. Load document by ID from route params
 * 2. Fetch template and theme
 * 3. Render editor with preview toggle
 * 4. Handle save and export actions
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import {
  Container,
  Stack,
  Typography,
  Button,
  Paper,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  FileDownload as ExportIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

import { DocumentEditor } from "../components/editor/DocumentEditor";
import { ExportDialog } from "../components/editor/ExportDialog";
import { VersionManager } from "../components/versions/VersionManager";
import { getAllTemplates } from "../services/templateService";
import { getAllThemes } from "../services/themeService";
import { withUser } from "@shared/services/crud";
import { useAuth } from "@shared/context/AuthContext";
import type {
  Document,
  DocumentType,
  DocumentStatus,
  ResumeContent,
  CoverLetterContent,
} from "../types/document.types";
import type { Template, Theme } from "../types/template.types";

// Mock data for demo
const MOCK_DOCUMENT: Document = {
  id: "1",
  userId: "user-1",
  type: "resume",
  status: "draft",
  config: {
    name: "Software Engineer Resume",
    description: "Tailored for senior engineering positions",
    templateId: "modern",
    themeId: "professional-blue",
  },
  content: {
    header: {
      fullName: "John Doe",
      title: "Senior Software Engineer",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
      links: [
        { type: "linkedin", url: "linkedin.com/in/johndoe", label: "LinkedIn" },
        { type: "github", url: "github.com/johndoe", label: "GitHub" },
      ],
    },
    summary: {
      enabled: true,
      text: "Experienced software engineer with 8+ years building scalable web applications...",
      highlights: [
        "Full-stack development",
        "Team leadership",
        "System architecture",
      ],
    },
    experience: {
      enabled: true,
      items: [
        {
          title: "Senior Software Engineer",
          company: "Tech Corp",
          location: "San Francisco, CA",
          startDate: "2020-01",
          endDate: null,
          current: true,
          bullets: [
            "Led development of microservices architecture serving 10M+ users",
            "Mentored team of 5 junior engineers",
            "Reduced API response time by 40% through optimization",
          ],
          technologies: ["React", "Node.js", "PostgreSQL", "AWS"],
        },
      ],
    },
    education: {
      enabled: true,
      items: [
        {
          degree: "Bachelor of Science",
          field: "Computer Science",
          institution: "University of California",
          location: "Berkeley, CA",
          graduationDate: "2016-05",
          gpa: 3.8,
        },
      ],
    },
    skills: {
      enabled: true,
      categories: [
        {
          name: "Programming Languages",
          skills: [
            {
              name: "JavaScript/TypeScript",
              level: "expert",
              highlighted: true,
            },
            { name: "Python", level: "advanced", highlighted: true },
            { name: "Java", level: "intermediate", highlighted: false },
          ],
        },
        {
          name: "Frameworks & Tools",
          skills: [
            { name: "React", level: "expert", highlighted: true },
            { name: "Node.js", level: "expert", highlighted: true },
            { name: "Docker", level: "advanced", highlighted: true },
          ],
        },
      ],
    },
  } as ResumeContent,
  currentVersionId: "v1",
  context: {
    targetRole: "Senior Software Engineer",
    targetIndustry: "Technology",
  },
  metadata: {
    tags: ["engineering", "senior", "full-stack"],
    folder: "Active Applications",
    rating: 5,
  },
  stats: {
    totalVersions: 3,
    totalEdits: 12,
    timesExported: 5,
    timesUsedInApplications: 8,
    successRate: 0.625,
    averageAtsScore: 85,
    wordCount: 450,
    charCount: 2800,
    fileSize: 245760,
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  lastEditedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  lastGeneratedAt: new Date(
    Date.now() - 10 * 24 * 60 * 60 * 1000
  ).toISOString(),
  isDefault: false,
  isPinned: true,
  isArchived: false,
};

const MOCK_TEMPLATE: Template = {
  id: "modern",
  name: "Modern Professional",
  category: "resume",
  subtype: "chronological",
  layout: {
    columns: 1,
    pageSize: "letter",
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    sectionOrder: [],
  },
  schema: {
    sections: {},
    requiredSections: [],
    optionalSections: [],
    customSections: [],
  },
  features: {
    atsOptimized: true,
    supportsPhoto: true,
  },
  metadata: {
    description: "Clean, modern design with bold headers",
    tags: ["modern", "professional", "ats"],
  },
  version: 1,
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
  author: "system",
  isDefault: false,
} as unknown as Template;

const MOCK_THEME: Theme = {
  id: "professional-blue",
  name: "Professional Blue",
  category: "professional",
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#3b82f6",
    background: {
      paper: "#ffffff",
      section: "#f8fafc",
      subtle: "#f1f5f9",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#94a3b8",
    },
    border: "#e2e8f0",
  },
  typography: {
    headingFont: {
      family: "Inter",
      variants: ["400", "600", "700"],
      source: "google",
    },
    bodyFont: {
      family: "Inter",
      variants: ["400", "600"],
      source: "google",
    },
    sizes: {
      h1: 24,
      h2: 18,
      h3: 16,
      body: 11,
      small: 10,
    },
    weights: {
      normal: 400,
      medium: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  spacing: {
    section: 16,
    subsection: 12,
    item: 8,
  },
  elements: {},
  metadata: {
    description: "Classic blue and gray color scheme",
    tags: ["professional", "blue", "corporate"],
  },
  version: 1,
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
  author: "system",
  isDefault: false,
} as unknown as Theme;

/**
 * DocumentEditorPage Component
 */
export const DocumentEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [versionManagerOpen, setVersionManagerOpen] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load document data from database
   */
  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId || !user?.id) {
        setError("Missing document ID or user not authenticated");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userCrud = withUser(user.id);

        // Fetch document
        const docResult = await userCrud.listRows<{
          id: string;
          type: string;
          name: string;
          user_id: string;
          template_id: string;
          theme_id: string;
          current_version_id: string;
          job_id: number | null;
          created_at: string;
          last_edited_at: string;
          is_pinned: boolean;
          is_archived: boolean;
          total_versions: number;
          total_edits: number;
        }>("documents", "*", { eq: { id: documentId } });

        if (docResult.error || !docResult.data || docResult.data.length === 0) {
          setError("Document not found");
          setLoading(false);
          return;
        }

        const docRow = docResult.data[0];

        // Fetch current version to get content
        const versionResult = await userCrud.listRows<{
          id: string;
          content: ResumeContent | CoverLetterContent;
          template_id: string;
          theme_id: string;
        }>("document_versions", "id,content,template_id,theme_id", {
          eq: { id: docRow.current_version_id },
        });

        if (
          versionResult.error ||
          !versionResult.data ||
          versionResult.data.length === 0
        ) {
          setError("Document version not found");
          setLoading(false);
          return;
        }

        const versionRow = versionResult.data[0];

        // Fetch template and theme
        const [templateResult, themeResult] = await Promise.all([
          getAllTemplates(),
          getAllThemes(),
        ]);

        const foundTemplate = templateResult.find(
          (t) => t.id === versionRow.template_id
        );
        const foundTheme = themeResult.find(
          (t) => t.id === versionRow.theme_id
        );

        if (!foundTemplate || !foundTheme) {
          setError("Template or theme not found");
          setLoading(false);
          return;
        }

        // Build Document object matching the Document type
        const loadedDocument: Document = {
          id: docRow.id,
          userId: docRow.user_id,
          type: docRow.type as DocumentType,
          status: "draft" as DocumentStatus,
          config: {
            name: docRow.name,
            description: undefined,
            templateId: versionRow.template_id,
            themeId: versionRow.theme_id,
          },
          content: versionRow.content,
          currentVersionId: docRow.current_version_id,
          context: {
            jobId: docRow.job_id || undefined,
            targetRole: undefined,
            targetCompany: undefined,
          },
          metadata: {
            tags: [],
            folder: undefined,
            color: undefined,
          },
          stats: {
            totalVersions: docRow.total_versions,
            totalEdits: docRow.total_edits,
            timesExported: 0,
            timesUsed: 0,
            wordCount: 0,
          },
          createdAt: docRow.created_at,
          lastEditedAt: docRow.last_edited_at,
          isDefault: false,
          isPinned: docRow.is_pinned,
          isArchived: docRow.is_archived,
        };

        setDocument(loadedDocument);
        setTemplate(foundTemplate);
        setTheme(foundTheme);
        setCurrentVersionId(versionRow.id);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load document:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, user?.id]);

  /**
   * Handle document save
   */
  const handleSave = async (updatedDocument: Document) => {
    if (!user?.id) return;

    try {
      const userCrud = withUser(user.id);

      // Get the current max version number for this document
      const { data: existingVersions, error: versionQueryError } =
        await userCrud.listRows("document_versions", "version_number", {
          eq: { document_id: updatedDocument.id },
          order: { column: "version_number", ascending: false },
          limit: 1,
        });

      if (versionQueryError) {
        throw new Error("Failed to query existing versions");
      }

      const maxVersionNumber =
        existingVersions && existingVersions.length > 0
          ? existingVersions[0].version_number
          : 0;
      const newVersionNumber = maxVersionNumber + 1;

      // Create new version
      const versionResult = await userCrud.insertRow<{ id: string }>(
        "document_versions",
        {
          document_id: updatedDocument.id,
          user_id: user.id,
          version_number: newVersionNumber,
          content: updatedDocument.content,
          template_id: updatedDocument.config.templateId,
          theme_id: updatedDocument.config.themeId,
          template_overrides:
            updatedDocument.config.customOverrides?.templateOverrides || {},
          theme_overrides:
            updatedDocument.config.customOverrides?.themeOverrides || {},
          job_id: updatedDocument.context.jobId || null,
          name: `Version ${newVersionNumber}`,
          description: "Manual edit",
          tags: [],
          change_type: "manual-edit",
          changed_sections: [],
          status: "active",
          word_count: 0,
          character_count: 0,
          created_by: user.id,
        }
      );

      if (versionResult.error || !versionResult.data) {
        throw new Error("Failed to save version");
      }

      const newVersion = versionResult.data;

      // Update document with new current_version_id
      await userCrud.updateRow(
        "documents",
        {
          current_version_id: newVersion.id,
          last_edited_at: new Date().toISOString(),
        },
        { eq: { id: updatedDocument.id } }
      );

      // Update local state with incremented version count
      setDocument({
        ...updatedDocument,
        stats: {
          ...updatedDocument.stats,
          totalVersions: updatedDocument.stats.totalVersions + 1,
        },
      });
    } catch (err) {
      console.error("Failed to save document:", err);
      throw err;
    }
  };

  /**
   * Handle document change
   */
  const handleChange = (updatedDocument: Document) => {
    setDocument(updatedDocument);
  };

  /**
   * Handle version selection from version manager
   */
  const handleVersionSelect = async (version: any) => {
    try {
      // Load the version content into the editor
      const versionDocument: Document = {
        ...document!,
        content: version.content,
        config: {
          ...document!.config,
          templateId: version.template_id,
          themeId: version.theme_id,
        },
      };

      setDocument(versionDocument);
      setCurrentVersionId(version.id);

      // Reload template and theme if they changed
      if (version.template_id !== template?.id) {
        const templates = await getAllTemplates();
        const newTemplate = templates.find((t) => t.id === version.template_id);
        if (newTemplate) setTemplate(newTemplate);
      }

      if (version.theme_id !== theme?.id) {
        const themes = await getAllThemes();
        const newTheme = themes.find((t) => t.id === version.theme_id);
        if (newTheme) setTheme(newTheme);
      }
    } catch (err) {
      console.error("Failed to load version:", err);
    }
  };

  /**
   * Handle version restore (creates new version from old one)
   */
  const handleVersionRestore = async (version: any) => {
    if (!user?.id || !documentId) return;

    try {
      const userCrud = withUser(user.id);

      // Get the current max version number
      const existingVersions = await userCrud.listRows(
        "document_versions",
        "version_number",
        {
          eq: { document_id: documentId },
          order: { column: "version_number", ascending: false },
          limit: 1,
        }
      );

      const maxVersionNumber = existingVersions.data?.[0]?.version_number || 0;
      const newVersionNumber = maxVersionNumber + 1;

      // Create new version from the restored content
      await userCrud.insertRow("document_versions", {
        document_id: documentId,
        user_id: user.id,
        version_number: newVersionNumber,
        content: version.content,
        template_id: version.template_id,
        theme_id: version.theme_id,
        name: `Restored from Version ${version.version_number}`,
        change_type: "restore",
        change_summary: `Restored from version ${version.version_number}`,
        parent_version_id: version.id,
      });

      // Load the restored version
      await handleVersionSelect(version);

      alert(`Version ${version.version_number} restored successfully!`);
    } catch (err) {
      console.error("Failed to restore version:", err);
      alert("Failed to restore version. Please try again.");
    }
  };

  /**
   * Toggle preview mode
   */
  const handleTogglePreview = () => {
    setMode(mode === "edit" ? "preview" : "edit");
  };

  /**
   * Handle export complete
   */
  const handleExportComplete = (filename: string, format: string) => {
    // Export completed successfully
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, pt: 2 }}>
        <AutoBreadcrumbs />
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    );
  }

  if (error || !document || !template || !theme) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, pt: 2 }}>
        <AutoBreadcrumbs />
        <Alert severity="error">{error || "Failed to load document"}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pt: 2 }}>
      <AutoBreadcrumbs />
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <Breadcrumbs>
          <Link href="/ai" underline="hover" color="inherit">
            AI Workspace
          </Link>
          <Link href="/ai/library" underline="hover" color="inherit">
            Documents
          </Link>
          <Typography color="text.primary">{document.config.name}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate("/ai/library")}
              sx={{ mr: "auto" }}
            >
              Back to Documents
            </Button>

            <Typography variant="h4" sx={{ flex: 1 }}>
              {document.config.name}
            </Typography>

            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setVersionManagerOpen(true)}
            >
              Versions
            </Button>

            <Button
              variant="outlined"
              startIcon={mode === "edit" ? <PreviewIcon /> : <EditIcon />}
              onClick={handleTogglePreview}
            >
              {mode === "edit" ? "Preview" : "Edit"}
            </Button>

            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
          </Stack>
        </Paper>

        {/* Editor */}
        <DocumentEditor
          document={document}
          mode={mode}
          onSave={handleSave}
          onChange={handleChange}
          onTogglePreview={handleTogglePreview}
        />

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          document={document}
          template={template}
          theme={theme}
          onExportComplete={handleExportComplete}
        />

        {/* Version Manager Dialog */}
        <VersionManager
          open={versionManagerOpen}
          onClose={() => setVersionManagerOpen(false)}
          documentId={documentId!}
          currentVersionId={currentVersionId}
          onVersionSelect={handleVersionSelect}
          onVersionRestore={handleVersionRestore}
        />
      </Stack>
    </Container>
  );
};
