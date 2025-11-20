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

import React, { useState, useCallback, useEffect, cloneElement } from "react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

  // Section order state for drag-and-drop
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "header",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
  ]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
   * Handle drag end for section reordering
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }, []);

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

    // Early return if content or header is missing
    if (!content || !content.header) {
      return (
        <Alert severity="error">
          Document content is invalid or missing. The AI generation may have
          failed. Please try generating a new document.
        </Alert>
      );
    }

    // Define function to get section component by ID
    const getSectionComponent = (sectionId: string): React.ReactNode => {
      switch (sectionId) {
        case "header":
          return (
            <SortableSection id="header" key="header">
              <EditorSection
                title="Header"
                icon={<EditIcon />}
                enabled={true}
                isEditing={editingSection === "header"}
                onToggleEdit={() =>
                  setEditingSection(
                    editingSection === "header" ? null : "header"
                  )
                }
                mode={mode}
                preview={
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight="bold">
                      {content.header.fullName || "No name"}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {content.header.title || "No title"}
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {content.header.email && (
                        <Typography variant="body2">
                          {content.header.email}
                        </Typography>
                      )}
                      {content.header.phone && (
                        <Typography variant="body2">
                          {content.header.phone}
                        </Typography>
                      )}
                      {content.header.location && (
                        <Typography variant="body2">
                          {content.header.location}
                        </Typography>
                      )}
                    </Stack>
                    {content.header.links &&
                      content.header.links.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {content.header.links.map((link, idx) => (
                            <Chip key={idx} label={link.label} size="small" />
                          ))}
                        </Stack>
                      )}
                  </Stack>
                }
              >
                <Stack spacing={2}>
                  <TextField
                    label="Full Name"
                    value={content.header.fullName || ""}
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
                    value={content.header.title || ""}
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
                      value={content.header.email || ""}
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
                      value={content.header.phone || ""}
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
                    value={content.header.location || ""}
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
            </SortableSection>
          );

        case "summary":
          if (!content.summary) return null;
          return (
            <SortableSection id="summary" key="summary">
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
                  setEditingSection(
                    editingSection === "summary" ? null : "summary"
                  )
                }
                mode={mode}
                preview={
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {content.summary?.text || "No summary provided"}
                  </Typography>
                }
              >
                <TextField
                  label="Summary"
                  value={content.summary?.text || ""}
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
            </SortableSection>
          );

        case "experience":
          if (!content.experience) return null;
          return (
            <SortableSection id="experience" key="experience">
              <EditorSection
                title="Work Experience"
                icon={<EditIcon />}
                enabled={content.experience.enabled}
                onToggleEnabled={(enabled) =>
                  handleContentChange({
                    ...content,
                    experience: { ...content.experience!, enabled },
                  })
                }
                isEditing={editingSection === "experience"}
                onToggleEdit={() =>
                  setEditingSection(
                    editingSection === "experience" ? null : "experience"
                  )
                }
                mode={mode}
                preview={
                  <Stack spacing={2}>
                    {(content.experience.items || []).length > 0 ? (
                      (content.experience.items || []).map((exp, idx) => (
                        <Box key={idx}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {exp.title || "Position"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exp.company || "Company"} •{" "}
                            {exp.location || "Location"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {exp.startDate || "Start"} -{" "}
                            {exp.current ? "Present" : exp.endDate || "End"}
                          </Typography>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul style={{ marginTop: 8, marginBottom: 0 }}>
                              {exp.bullets.map((bullet, bidx) => (
                                <li key={bidx}>
                                  <Typography variant="body2">
                                    {bullet}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        No experience entries
                      </Typography>
                    )}
                  </Stack>
                }
              >
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {(content.experience.items || []).length} experience entries
                  </Typography>
                  {(content.experience.items || []).map((exp, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <TextField
                          label="Job Title"
                          value={exp.title || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.experience.items || []),
                            ];
                            newItems[idx] = { ...exp, title: e.target.value };
                            handleContentChange({
                              ...content,
                              experience: {
                                ...content.experience,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Company"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.experience.items || []),
                            ];
                            newItems[idx] = { ...exp, company: e.target.value };
                            handleContentChange({
                              ...content,
                              experience: {
                                ...content.experience,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Location"
                          value={exp.location || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.experience.items || []),
                            ];
                            newItems[idx] = {
                              ...exp,
                              location: e.target.value,
                            };
                            handleContentChange({
                              ...content,
                              experience: {
                                ...content.experience,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Start Date"
                            value={exp.startDate || ""}
                            onChange={(e) => {
                              const newItems = [
                                ...(content.experience.items || []),
                              ];
                              newItems[idx] = {
                                ...exp,
                                startDate: e.target.value,
                              };
                              handleContentChange({
                                ...content,
                                experience: {
                                  ...content.experience,
                                  items: newItems,
                                },
                              });
                            }}
                            fullWidth
                          />
                          <TextField
                            label="End Date"
                            value={exp.endDate || ""}
                            onChange={(e) => {
                              const newItems = [
                                ...(content.experience.items || []),
                              ];
                              newItems[idx] = {
                                ...exp,
                                endDate: e.target.value,
                              };
                              handleContentChange({
                                ...content,
                                experience: {
                                  ...content.experience,
                                  items: newItems,
                                },
                              });
                            }}
                            disabled={exp.current}
                            fullWidth
                          />
                        </Stack>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={exp.current || false}
                              onChange={(e) => {
                                const newItems = [
                                  ...(content.experience.items || []),
                                ];
                                newItems[idx] = {
                                  ...exp,
                                  current: e.target.checked,
                                  endDate: e.target.checked
                                    ? null
                                    : exp.endDate,
                                };
                                handleContentChange({
                                  ...content,
                                  experience: {
                                    ...content.experience,
                                    items: newItems,
                                  },
                                });
                              }}
                            />
                          }
                          label="Currently working here"
                        />
                        <TextField
                          label="Responsibilities (one per line)"
                          value={(exp.bullets || []).join("\n")}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.experience.items || []),
                            ];
                            newItems[idx] = {
                              ...exp,
                              bullets: e.target.value.split("\n"),
                            };
                            handleContentChange({
                              ...content,
                              experience: {
                                ...content.experience,
                                items: newItems,
                              },
                            });
                          }}
                          multiline
                          rows={4}
                          fullWidth
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </EditorSection>
            </SortableSection>
          );

        case "education":
          if (!content.education) return null;
          return (
            <SortableSection id="education" key="education">
              <EditorSection
                title="Education"
                icon={<EditIcon />}
                enabled={content.education.enabled}
                onToggleEnabled={(enabled) =>
                  handleContentChange({
                    ...content,
                    education: { ...content.education!, enabled },
                  })
                }
                isEditing={editingSection === "education"}
                onToggleEdit={() =>
                  setEditingSection(
                    editingSection === "education" ? null : "education"
                  )
                }
                mode={mode}
                preview={
                  <Stack spacing={2}>
                    {(content.education.items || []).length > 0 ? (
                      (content.education.items || []).map((edu, idx) => (
                        <Box key={idx}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {edu.degree || "Degree"}{" "}
                            {edu.field ? `in ${edu.field}` : ""}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {edu.institution || "Institution"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {edu.graduationDate || "Graduation Date"}
                          </Typography>
                          {edu.gpa && (
                            <Typography variant="body2">
                              GPA: {edu.gpa}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        No education entries
                      </Typography>
                    )}
                  </Stack>
                }
              >
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {(content.education.items || []).length} education entries
                  </Typography>
                  {(content.education.items || []).map((edu, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <TextField
                          label="Degree"
                          value={edu.degree || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = { ...edu, degree: e.target.value };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Field of Study"
                          value={edu.field || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = { ...edu, field: e.target.value };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Institution"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = {
                              ...edu,
                              institution: e.target.value,
                            };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Location"
                          value={edu.location || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = {
                              ...edu,
                              location: e.target.value,
                            };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Graduation Date"
                          value={edu.graduationDate || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = {
                              ...edu,
                              graduationDate: e.target.value,
                            };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="GPA (optional)"
                          value={edu.gpa || ""}
                          onChange={(e) => {
                            const newItems = [
                              ...(content.education.items || []),
                            ];
                            newItems[idx] = {
                              ...edu,
                              gpa: parseFloat(e.target.value) || undefined,
                            };
                            handleContentChange({
                              ...content,
                              education: {
                                ...content.education,
                                items: newItems,
                              },
                            });
                          }}
                          type="number"
                          fullWidth
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </EditorSection>
            </SortableSection>
          );

        case "skills":
          if (!content.skills) return null;
          return (
            <SortableSection id="skills" key="skills">
              <EditorSection
                title="Skills"
                icon={<EditIcon />}
                enabled={content.skills.enabled}
                onToggleEnabled={(enabled) =>
                  handleContentChange({
                    ...content,
                    skills: { ...content.skills!, enabled },
                  })
                }
                isEditing={editingSection === "skills"}
                onToggleEdit={() =>
                  setEditingSection(
                    editingSection === "skills" ? null : "skills"
                  )
                }
                mode={mode}
                preview={
                  <Stack spacing={2}>
                    {(content.skills.categories || []).length > 0 ? (
                      (content.skills.categories || []).map((category, idx) => (
                        <Box key={idx}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {category.name}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {category.skills.map((skill, sidx) => (
                              <Chip
                                key={sidx}
                                label={skill.name}
                                size="small"
                                color={
                                  skill.highlighted ? "primary" : "default"
                                }
                              />
                            ))}
                          </Stack>
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">No skills</Typography>
                    )}
                  </Stack>
                }
              >
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {(content.skills.categories || []).length} skill categories
                  </Typography>
                  {(content.skills.categories || []).map((category, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <TextField
                          label="Category Name"
                          value={category.name || ""}
                          onChange={(e) => {
                            const newCategories = [
                              ...(content.skills.categories || []),
                            ];
                            newCategories[idx] = {
                              ...category,
                              name: e.target.value,
                            };
                            handleContentChange({
                              ...content,
                              skills: {
                                ...content.skills,
                                categories: newCategories,
                              },
                            });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Skills (comma-separated)"
                          value={category.skills.map((s) => s.name).join(", ")}
                          onChange={(e) => {
                            const newCategories = [
                              ...(content.skills.categories || []),
                            ];
                            const skillNames = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);
                            newCategories[idx] = {
                              ...category,
                              skills: skillNames.map((name, sidx) => ({
                                name,
                                highlighted:
                                  category.skills[sidx]?.highlighted || false,
                              })),
                            };
                            handleContentChange({
                              ...content,
                              skills: {
                                ...content.skills,
                                categories: newCategories,
                              },
                            });
                          }}
                          multiline
                          rows={2}
                          fullWidth
                          helperText="Separate skills with commas (e.g., React, TypeScript, Node.js)"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </EditorSection>
            </SortableSection>
          );

        default:
          return null;
      }
    };

    return (
      <Stack spacing={3}>
        {sectionOrder
          .map((sectionId) => getSectionComponent(sectionId))
          .filter(Boolean)}
      </Stack>
    );
  };

  /**
   * Render cover letter editor
   */
  const renderCoverLetterEditor = () => {
    const content = document.content as CoverLetterContent;

    // Ensure all sections have default values
    const header = content?.header || {};
    const recipient = content?.recipient || {};
    const salutation = content?.salutation || "";
    const body = content?.body || {};
    const signature = content?.signature || {};

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
          mode={mode}
          preview={
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight="bold">
                {header.fullName || "Your Name"}
              </Typography>
              <Typography variant="body2">
                {header.email || "email@example.com"}
              </Typography>
              <Typography variant="body2">
                {header.phone || "(555) 123-4567"}
              </Typography>
              <Typography variant="body2">
                {header.location || "City, State"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {header.date || new Date().toLocaleDateString()}
              </Typography>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={header.fullName || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  header: { ...header, fullName: e.target.value },
                })
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={header.email || ""}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...header, email: e.target.value },
                  })
                }
                fullWidth
              />
              <TextField
                label="Phone"
                value={header.phone || ""}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...header, phone: e.target.value },
                  })
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Location"
                value={header.location || ""}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...header, location: e.target.value },
                  })
                }
                fullWidth
                helperText="City, State"
              />
              <TextField
                label="Date"
                type="date"
                value={header.date || ""}
                onChange={(e) =>
                  handleContentChange({
                    ...content,
                    header: { ...header, date: e.target.value },
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
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
          mode={mode}
          preview={
            <Stack spacing={0.5}>
              {recipient.name && (
                <Typography variant="body2">{recipient.name}</Typography>
              )}
              {recipient.title && (
                <Typography variant="body2">{recipient.title}</Typography>
              )}
              <Typography variant="body2" fontWeight="medium">
                {recipient.company || "Company Name"}
              </Typography>
              {recipient.address && (
                <Typography variant="body2">{recipient.address}</Typography>
              )}
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Company Name"
              value={recipient.company || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...recipient, company: e.target.value },
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Recipient Name (Optional)"
              value={recipient.name || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...recipient, name: e.target.value },
                })
              }
              fullWidth
              placeholder="e.g., Ms. Jane Smith"
            />
            <TextField
              label="Recipient Title (Optional)"
              value={recipient.title || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...recipient, title: e.target.value },
                })
              }
              fullWidth
              placeholder="e.g., Hiring Manager"
            />
            <TextField
              label="Company Address (Optional)"
              value={recipient.address || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  recipient: { ...recipient, address: e.target.value },
                })
              }
              fullWidth
              placeholder="e.g., 123 Main St, City, State 12345"
            />
          </Stack>
        </EditorSection>

        {/* Salutation Section */}
        <EditorSection
          title="Salutation"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "salutation"}
          onToggleEdit={() =>
            setEditingSection(
              editingSection === "salutation" ? null : "salutation"
            )
          }
          mode={mode}
          preview={
            <Typography variant="body1">
              {salutation || "Dear Hiring Manager,"}
            </Typography>
          }
        >
          <TextField
            label="Salutation"
            value={salutation || ""}
            onChange={(e) =>
              handleContentChange({
                ...content,
                salutation: e.target.value,
              })
            }
            fullWidth
            placeholder="Dear Hiring Manager,"
            helperText="e.g., Dear Ms. Smith, or Dear Hiring Manager,"
          />
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
          mode={mode}
          preview={
            <Stack spacing={2}>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {body.opening || "Opening paragraph..."}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {body.body1 || "First body paragraph..."}
              </Typography>
              {body.body2 && (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {body.body2}
                </Typography>
              )}
              {body.body3 && (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {body.body3}
                </Typography>
              )}
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {body.closing || "Closing paragraph..."}
              </Typography>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Opening Paragraph"
              value={body.opening || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...body, opening: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Introduce yourself and state the position you're applying for..."
              helperText="Express your interest and mention how you learned about the position"
            />
            <TextField
              label="Body Paragraph 1 - Your Qualifications"
              value={body.body1 || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...body, body1: e.target.value },
                })
              }
              multiline
              rows={4}
              fullWidth
              placeholder="Highlight your relevant experience and skills..."
              helperText="Focus on your most relevant achievements and qualifications"
            />
            <TextField
              label="Body Paragraph 2 (Optional)"
              value={body.body2 || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...body, body2: e.target.value },
                })
              }
              multiline
              rows={4}
              fullWidth
              placeholder="Additional selling points..."
              helperText="Provide additional examples or explain why you're a good fit"
            />
            <TextField
              label="Body Paragraph 3 (Optional)"
              value={body.body3 || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...body, body3: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Further details if needed..."
            />
            <TextField
              label="Closing Paragraph"
              value={body.closing || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  body: { ...body, closing: e.target.value },
                })
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Thank them and include a call to action..."
              helperText="Express gratitude and indicate your availability for an interview"
            />
          </Stack>
        </EditorSection>

        {/* Signature Section */}
        <EditorSection
          title="Signature"
          icon={<EditIcon />}
          enabled={true}
          isEditing={editingSection === "signature"}
          onToggleEdit={() =>
            setEditingSection(
              editingSection === "signature" ? null : "signature"
            )
          }
          mode={mode}
          preview={
            <Stack spacing={1}>
              <Typography variant="body1">
                {signature.closing || "Sincerely,"}
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{ mt: 2 }}>
                {signature.name || header.fullName || "Your Name"}
              </Typography>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="Closing"
              value={signature.closing || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  signature: { ...signature, closing: e.target.value },
                })
              }
              fullWidth
              placeholder="Sincerely,"
              helperText="e.g., Sincerely, Best regards, Kind regards"
            />
            <TextField
              label="Signature Name"
              value={signature.name || header.fullName || ""}
              onChange={(e) =>
                handleContentChange({
                  ...content,
                  signature: { ...signature, name: e.target.value },
                })
              }
              fullWidth
              placeholder="Your Full Name"
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
              <IconButton
                size="small"
                onClick={() => {
                  if (onTogglePreview) {
                    onTogglePreview();
                  }
                }}
              >
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <Paper sx={{ p: 3 }}>
            {document.type === "resume"
              ? renderResumeEditor()
              : renderCoverLetterEditor()}
          </Paper>
        </SortableContext>
      </DndContext>
    </Box>
  );
};

/**
 * SortableSection Component
 *
 * Wrapper that makes sections draggable/sortable
 */
interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
}

const SortableSection: React.FC<SortableSectionProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {cloneElement(children as React.ReactElement<EditorSectionProps>, {
        dragHandleProps: { ...attributes, ...listeners },
      })}
    </div>
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
  /** Preview content to show when not editing */
  preview?: React.ReactNode;
  /** Drag handle props from SortableSection */
  dragHandleProps?: unknown;
  /** Edit mode (edit/preview) - when preview, hide all edit controls */
  mode?: "edit" | "preview";
}

const EditorSection: React.FC<EditorSectionProps> = ({
  title,
  icon,
  enabled,
  onToggleEnabled,
  isEditing,
  onToggleEdit,
  children,
  preview,
  dragHandleProps,
  mode = "edit",
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
          {mode === "edit" && (
            <IconButton
              size="small"
              sx={{ cursor: "grab" }}
              {...(dragHandleProps as Record<string, unknown>)}
            >
              <DragIcon />
            </IconButton>
          )}

          {icon}

          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>

          {mode === "edit" && onToggleEnabled && (
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

          {mode === "edit" && (
            <Button
              variant={isEditing ? "contained" : "outlined"}
              size="small"
              onClick={onToggleEdit}
            >
              {isEditing ? "Done" : "Edit"}
            </Button>
          )}
        </Stack>

        {/* Section Content - Show preview when not editing or in preview mode, editor when editing */}
        {enabled && (
          <>
            <Divider />
            {mode === "preview" || !isEditing
              ? preview || (
                  <Typography color="text.secondary">No content</Typography>
                )
              : children}
          </>
        )}
      </Stack>
    </Paper>
  );
};
