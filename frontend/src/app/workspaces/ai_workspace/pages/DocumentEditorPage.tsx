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
import { useParams } from "react-router";
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
} from "@mui/icons-material";

import { DocumentEditor } from "../components/editor/DocumentEditor";
import { ExportDialog } from "../components/editor/ExportDialog";
import type { Document, ResumeContent } from "../types/document.types";
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
  const [document, setDocument] = useState<Document | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load document data
   */
  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API calls
        // const doc = await fetchDocument(documentId);
        // const tmpl = await fetchTemplate(doc.config.templateId);
        // const thm = await fetchTheme(doc.config.themeId);

        await new Promise((resolve) => setTimeout(resolve, 800));

        setDocument(MOCK_DOCUMENT);
        setTemplate(MOCK_TEMPLATE);
        setTheme(MOCK_THEME);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  /**
   * Handle document save
   */
  const handleSave = (updatedDocument: Document) => {
    console.log("Saving document:", updatedDocument);
    // TODO: Call backend API to save document
    setDocument(updatedDocument);
  };

  /**
   * Handle document change
   */
  const handleChange = (updatedDocument: Document) => {
    setDocument(updatedDocument);
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
    console.log(`Exported ${filename} as ${format}`);
    // TODO: Track export in analytics
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    );
  }

  if (error || !document || !template || !theme) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Failed to load document"}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <Breadcrumbs>
          <Link href="/ai-new" underline="hover" color="inherit">
            AI Workspace
          </Link>
          <Link href="/ai-new/documents" underline="hover" color="inherit">
            Documents
          </Link>
          <Typography color="text.primary">{document.config.name}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<BackIcon />}
              href="/ai-new/documents"
              sx={{ mr: "auto" }}
            >
              Back to Documents
            </Button>

            <Typography variant="h4" sx={{ flex: 1 }}>
              {document.config.name}
            </Typography>

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
      </Stack>
    </Container>
  );
};
