/**
 * DocumentEditor Component
 *
 * Unified document editor for resumes and cover letters.
 * Provides rich text editing per section with live preview,
 * auto-save, version creation, and section reordering.
 *
 * Flow:
 * 1. Load document with current content
 * 2. Edit sections in rich text editors
 * 3. Auto-save creates new versions
 * 4. Preview shows rendered template+theme
 *
 * Inputs: documentId, initialDocument
 * Outputs: onSave, onChange callbacks
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
  Alert,
} from "@mui/material";
import {
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Visibility as PreviewIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import type {
  Document,
  ResumeContent,
  CoverLetterContent,
} from "../../types/document.types";

/**
 * DocumentEditor Props
 */
export interface DocumentEditorProps {
  /** Document to edit */
  document: Document;

  /** Edit mode (edit/preview) */
  mode?: "edit" | "preview";

  /** Auto-save enabled */
  autoSave?: boolean;

  /** Auto-save interval (ms) */
  autoSaveInterval?: number;

  /** Save handler */
  onSave?: (document: Document) => void;

  /** Change handler */
  onChange?: (document: Document) => void;

  /** Preview toggle handler */
  onTogglePreview?: () => void;
}

/**
 * DocumentEditor Component
 *
 * Main document editing interface with section-by-section editing,
 * live preview, and auto-save functionality.
 */
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: initialDocument,
  mode = "edit",
  autoSave = true,
  autoSaveInterval = 30000,
  onSave,
  onChange,
  onTogglePreview,
}) => {
  const [document, setDocument] = useState<Document>(initialDocument);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  /**
   * Handle document content change
   */
  const handleContentChange = useCallback(
    (newContent: ResumeContent | CoverLetterContent) => {
      const updatedDocument: Document = {
        ...document,
        content: newContent,
        lastEditedAt: new Date().toISOString(),
        stats: {
          ...document.stats,
          totalEdits: document.stats.totalEdits + 1,
        },
      };

      setDocument(updatedDocument);
      setHasChanges(true);
      onChange?.(updatedDocument);
    },
    [document, onChange]
  );

  /**
   * Save document
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // TODO: Call backend API to save document
      // Also create new version entry
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSave?.(document);
      setHasChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [document, onSave]);

  /**
   * Auto-save effect
   */
  useEffect(() => {
    if (!autoSave || !hasChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, hasChanges, autoSaveInterval, handleSave]);

  /**
   * Render resume editor
   */
  const renderResumeEditor = () => {
    const content = document.content as ResumeContent;

    return (
      <Stack spacing={3}>
        {/* Header Section */}
        <EditorSection
          title="Header"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "header"}
          onToggleEdit={() =>
            setEditingSection(editingSection === "header" ? null : "header")
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={content.header.fullName}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...content.header, fullName: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Professional Title"
              value={content.header.title}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...content.header, title: e.target.value },
                })
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={content.header.email}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...content.header, email: e.target.value },
                  })
                }
                fullWidth
              />
              <TextField
                label="Phone"
                type="tel"
                value={content.header.phone}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...content.header, phone: e.target.value },
                  })
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Location"
              value={content.header.location}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...content.header, location: e.target.value },
                })
              }
              fullWidth
            />
          </Stack>
        </EditorSection>

        {/* Summary Section */}
        {content.summary && (
          <EditorSection
            title="Professional Summary"
            icon={<EditIcon />}
            enabled={content.summary.enabled}
            onToggleEnabled={(enabled) =>
              handleContentChange({
                ...content,
                summary: content.summary
                  ? { ...content.summary, enabled }
                  : undefined,
              })
            }
            isEditing={editingSection === "summary"}
            onToggleEdit={() =>
              setEditingSection(editingSection === "summary" ? null : "summary")
            }
          >
            <TextField
              label="Summary"
              value={content.summary.text}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  summary: content.summary
                    ? { ...content.summary, text: e.target.value }
                    : undefined,
                })
              }
              multiline
              rows={4}
              fullWidth
            />
          </EditorSection>
        )}

        {/* Experience Section */}
        <EditorSection
          title="Work Experience"
          icon={<EditIcon />}
          enabled={content.experience.enabled}
          onToggleEnabled={(enabled) =>
            handleContentChange({
              ...content,
              experience: { ...content.experience, enabled },
            })
          }
          isEditing={editingSection === "experience"}
          onToggleEdit={() =>
            setEditingSection(
              editingSection === "experience" ? null : "experience"
            )
          }
        >
          <Typography variant="body2" color="text.secondary">
            {content.experience.items.length} experience entries
          </Typography>
          {/* TODO: Add experience item editing */}
        </EditorSection>

        {/* Education Section */}
        <EditorSection
          title="Education"
          icon={<EditIcon />}
          enabled={content.education.enabled}
          onToggleEnabled={(enabled) =>
            handleContentChange({
              ...content,
              education: { ...content.education, enabled },
            })
          }
          isEditing={editingSection === "education"}
          onToggleEdit={() =>
            setEditingSection(
              editingSection === "education" ? null : "education"
            )
          }
        >
          <Typography variant="body2" color="text.secondary">
            {content.education.items.length} education entries
          </Typography>
          {/* TODO: Add education item editing */}
        </EditorSection>

        {/* Skills Section */}
        <EditorSection
          title="Skills"
          icon={<EditIcon />}
          enabled={content.skills.enabled}
          onToggleEnabled={(enabled) =>
            handleContentChange({
              ...content,
              skills: { ...content.skills, enabled },
            })
          }
          isEditing={editingSection === "skills"}
          onToggleEdit={() =>
            setEditingSection(editingSection === "skills" ? null : "skills")
          }
        >
          <Typography variant="body2" color="text.secondary">
            {content.skills.categories.length} skill categories
          </Typography>
          {/* TODO: Add skills editing */}
        </EditorSection>
      </Stack>
    );
  };

  /**
   * Render cover letter editor
   */
  const renderCoverLetterEditor = () => {
    const content = document.content as CoverLetterContent;

    return (
      <Stack spacing={3}>
        {/* Header Section */}
        <EditorSection
          title="Header"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "header"}
          onToggleEdit={() =>
            setEditingSection(editingSection === "header" ? null : "header")
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={content.header.fullName}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...content.header, fullName: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={content.header.email}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...content.header, email: e.target.value },
                })
              }
              fullWidth
            />
          </Stack>
        </EditorSection>

        {/* Recipient Section */}
        <EditorSection
          title="Recipient"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "recipient"}
          onToggleEdit={() =>
            setEditingSection(
              editingSection === "recipient" ? null : "recipient"
            )
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Company Name"
              value={content.recipient.company}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...content.recipient, company: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Recipient Name (Optional)"
              value={content.recipient.name || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...content.recipient, name: e.target.value },
                })
              }
              fullWidth
            />
          </Stack>
        </EditorSection>

        {/* Body Section */}
        <EditorSection
          title="Letter Body"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "body"}
          onToggleEdit={() =>
            setEditingSection(editingSection === "body" ? null : "body")
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Opening Paragraph"
              value={content.body.opening}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...content.body, opening: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Body Paragraph 1"
              value={content.body.body1}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...content.body, body1: e.target.value },
                })
              }
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="Closing Paragraph"
              value={content.body.closing}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...content.body, closing: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </EditorSection>
      </Stack>
    );
  };

  return (
    <Box>
      {/* Editor Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Save Status */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flex: 1 }}
          >
            {hasChanges ? (
              <Chip
                icon={<WarningIcon />}
                label="Unsaved changes"
                color="warning"
                size="small"
              />
            ) : lastSaved ? (
              <Chip
                icon={<CheckIcon />}
                label={`Saved ${lastSaved.toLocaleTimeString()}`}
                color="success"
                size="small"
              />
            ) : null}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Undo">
              <IconButton size="small" disabled>
                <UndoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Redo">
              <IconButton size="small" disabled>
                <RedoIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title={mode === "edit" ? "Preview" : "Edit"}>
              <IconButton size="small" onClick={onTogglePreview}>
                <PreviewIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Stack>

        {/* Auto-save indicator */}
        {autoSave && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Auto-save enabled - changes will be saved every{" "}
            {autoSaveInterval / 1000} seconds
          </Alert>
        )}
      </Paper>

      {/* Editor Content */}
      <Paper sx={{ p: 3 }}>
        {document.type === "resume"
          ? renderResumeEditor()
          : renderCoverLetterEditor()}
      </Paper>
    </Box>
  );
};

/**
 * EditorSection Component
 *
 * Reusable section wrapper with toggle, drag handle, and edit state
 */
interface EditorSectionProps {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  children: React.ReactNode;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  title,
  icon,
  enabled,
  onToggleEnabled,
  isEditing,
  onToggleEdit,
  children,
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        opacity: enabled ? 1 : 0.6,
        transition: "opacity 0.2s",
      }}
    >
      <Stack spacing={2}>
        {/* Section Header */}
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" sx={{ cursor: "grab" }}>
            <DragIcon />
          </IconButton>

          {icon}

          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>

          {onToggleEnabled && (
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => onToggleEnabled(e.target.checked)}
                  size="small"
                />
              }
              label="Enabled"
            />
          )}

          <Button
            variant={isEditing ? "contained" : "outlined"}
            size="small"
            onClick={onToggleEdit}
          >
            {isEditing ? "Collapse" : "Edit"}
          </Button>
        </Stack>

        {/* Section Content */}
        {isEditing && enabled && (
          <>
            <Divider />
            {children}
          </>
        )}
      </Stack>
    </Paper>
  );
};
