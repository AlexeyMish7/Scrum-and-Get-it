/**
 * CoverLetterPreviewPanel
 *
 * WHAT: Right panel for live cover letter preview and editing
 * WHY: User sees formatted cover letter, can edit content, and export
 *
 * Features:
 * - Live preview with template styling
 * - Editable sections (header, opening, body, closing)
 * - Word count tracking per section and total
 * - Template style preview (fonts, colors, spacing)
 * - Export button (PDF, DOCX, plain text)
 *
 * Inputs:
 * - draft: Current cover letter draft with content
 * - template: Template configuration for styling
 * - onUpdateHeader: Callback to update header section
 * - onUpdateOpening: Callback to update opening paragraph
 * - onUpdateBody: Callback to update body paragraphs
 * - onUpdateClosing: Callback to update closing paragraph
 * - onExport: Callback to export cover letter
 */

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  TextField,
  Chip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Popover,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import type { CoverLetterTemplate } from "../../config/coverLetterTemplates";
import type { CoverLetterContent } from "../../hooks/useCoverLetterDrafts";

interface PreviewPanelProps {
  content: CoverLetterContent;
  template: CoverLetterTemplate;
  onUpdateHeader: (header: CoverLetterContent["header"]) => void;
  onUpdateOpening: (opening: string) => void;
  onUpdateBody: (body: string[]) => void;
  onUpdateClosing: (closing: string) => void;
  onExport: (format: "pdf" | "docx" | "txt") => void;
  isExporting?: boolean;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Display live preview of cover letter with editing capabilities
 */
export default function CoverLetterPreviewPanel({
  content,
  template,
  onUpdateHeader,
  onUpdateOpening,
  onUpdateBody,
  onUpdateClosing,
  onExport,
  isExporting = false,
}: PreviewPanelProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Synonym / spell-check support (from EditCoverLetter)
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [synPopoverAnchor, setSynPopoverAnchor] = useState<HTMLElement | null>(
    null
  );
  const [selectionInfo, setSelectionInfo] = useState<{
    section: string;
    idx?: number;
    start: number;
    end: number;
    value: string;
  } | null>(null);

  // Calculate word counts
  const openingWords = countWords(content.opening);
  const bodyWords = content.body.reduce((sum, p) => sum + countWords(p), 0);
  const closingWords = countWords(content.closing);
  const totalWords = openingWords + bodyWords + closingWords;

  // Template styling
  const { style } = template;

  const handleAddBodyParagraph = () => {
    onUpdateBody([...content.body, ""]);
    setEditingSection(`body-${content.body.length}`);
  };

  // Fetch synonyms from Datamuse for the selected text
  const fetchSynonyms = async (word: string) => {
    if (!word) return;
    try {
      const res = await fetch(
        `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}`
      );
      const data = (await res.json()) as Array<{ word: string }>;
      setSynonyms(data.map((w) => w.word));
    } catch (err) {
      console.error("fetchSynonyms failed", err);
      setSynonyms([]);
    }
  };

  // Handle selection inside editable TextFields
  const handleSelection = (
    e: React.MouseEvent<HTMLElement>,
    section: string,
    idx?: number
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const start = (target.selectionStart ?? 0) as number;
    const end = (target.selectionEnd ?? 0) as number;
    if (!target || end <= start) {
      setSynonyms([]);
      setSynPopoverAnchor(null);
      setSelectionInfo(null);
      return;
    }

    const value = target.value ?? "";
    const selected = value.slice(start, end).trim();
    if (!selected) return;

    fetchSynonyms(selected);
    setSynPopoverAnchor(e.currentTarget as HTMLElement);
    setSelectionInfo({ section, idx, start, end, value });
  };

  // Replace currently selected text with chosen synonym and call update callbacks
  const replaceSelected = (syn: string) => {
    if (!selectionInfo) return;
    const { section, idx, start, end, value } = selectionInfo;
    const newVal = value.slice(0, start) + syn + value.slice(end);
    if (section === "opening") onUpdateOpening(newVal);
    else if (section === "closing") onUpdateClosing(newVal);
    else if (section === "header") {
      onUpdateHeader({ ...content.header, name: newVal });
    } else if (section === "body" && typeof idx === "number") {
      const newBody = [...content.body];
      newBody[idx] = newVal;
      onUpdateBody(newBody);
    }

    // Clear popover
    setSynonyms([]);
    setSynPopoverAnchor(null);
    setSelectionInfo(null);
  };

  const handleRemoveBodyParagraph = (idx: number) => {
    const newBody = content.body.filter((_, i) => i !== idx);
    onUpdateBody(newBody);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = (format?: "pdf" | "docx" | "txt") => {
    setExportMenuAnchor(null);
    if (format) {
      onExport(format);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, height: "100%", overflowY: "auto" }}>
      <Stack spacing={3}>
        {/* Header Actions */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h6">Preview & Edit</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                label={`${totalWords} words`}
                size="small"
                color="primary"
              />
              <Tooltip
                title={`Template locked at creation: ${template.description}`}
              >
                <Chip
                  label={template.name}
                  size="small"
                  variant="outlined"
                  icon={<LockIcon />}
                />
              </Tooltip>
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            disabled={isExporting}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => handleExportClose()}
          >
            <MenuItem onClick={() => handleExportClose("pdf")}>
              Export as PDF
            </MenuItem>
            <MenuItem onClick={() => handleExportClose("docx")}>
              Export as DOCX
            </MenuItem>
            <MenuItem onClick={() => handleExportClose("txt")}>
              Export as Plain Text
            </MenuItem>
          </Menu>
        </Stack>

        <Divider />

        {/* Letter Preview Container */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            bgcolor: "white",
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            color: style.colors.primary,
          }}
        >
          <Stack spacing={3}>
            {/* Header Section */}
            <Box>
              {editingSection === "header" ? (
                <Stack spacing={1.5}>
                  <TextField
                    label="Your Name"
                    value={content.header.name || ""}
                    onChange={(e) =>
                      onUpdateHeader({
                        ...content.header,
                        name: e.target.value,
                      })
                    }
                    spellCheck={true}
                    onMouseUp={(e) => handleSelection(e, "header")}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Your Email"
                    value={content.header.email || ""}
                    onChange={(e) =>
                      onUpdateHeader({
                        ...content.header,
                        email: e.target.value,
                      })
                    }
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Your Phone"
                    value={content.header.phone || ""}
                    onChange={(e) =>
                      onUpdateHeader({
                        ...content.header,
                        phone: e.target.value,
                      })
                    }
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Company Name"
                    value={content.header.companyName || ""}
                    onChange={(e) =>
                      onUpdateHeader({
                        ...content.header,
                        companyName: e.target.value,
                      })
                    }
                    fullWidth
                    size="small"
                  />
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => setEditingSection(null)}
                    size="small"
                  >
                    Save Header
                  </Button>
                </Stack>
              ) : (
                <Box sx={{ position: "relative" }}>
                  <IconButton
                    size="small"
                    onClick={() => setEditingSection("header")}
                    sx={{ position: "absolute", top: -8, right: -8 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <Typography fontWeight={600}>
                    {content.header.name || "Your Name"}
                  </Typography>
                  <Typography variant="body2">
                    {content.header.email || "email@example.com"} |{" "}
                    {content.header.phone || "(555) 123-4567"}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {content.header.date || new Date().toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                      {content.header.companyName || "Company Name"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Opening Paragraph */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Opening ({openingWords} words)
                </Typography>
                {editingSection !== "opening" && (
                  <IconButton
                    size="small"
                    onClick={() => setEditingSection("opening")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {editingSection === "opening" ? (
                <Stack spacing={1}>
                  <TextField
                    multiline
                    rows={4}
                    value={content.opening}
                    onChange={(e) => onUpdateOpening(e.target.value)}
                    spellCheck={true}
                    onMouseUp={(e) => handleSelection(e, "opening")}
                    fullWidth
                    placeholder="Opening paragraph..."
                  />
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => setEditingSection(null)}
                    size="small"
                  >
                    Save Opening
                  </Button>
                </Stack>
              ) : (
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {content.opening}
                </Typography>
              )}
            </Box>

            {/* Body Paragraphs */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Body ({bodyWords} words)
                </Typography>
                <IconButton size="small" onClick={handleAddBodyParagraph}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack spacing={2}>
                {content.body.map((paragraph, idx) => (
                  <Box key={idx}>
                    {editingSection === `body-${idx}` ? (
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            multiline
                            rows={4}
                            value={paragraph}
                            onChange={(e) => {
                              const newBody = [...content.body];
                              newBody[idx] = e.target.value;
                              onUpdateBody(newBody);
                            }}
                            spellCheck={true}
                            onMouseUp={(e) => handleSelection(e, "body", idx)}
                            fullWidth
                            placeholder={`Body paragraph ${idx + 1}...`}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveBodyParagraph(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Button
                          startIcon={<SaveIcon />}
                          onClick={() => setEditingSection(null)}
                          size="small"
                        >
                          Save Paragraph
                        </Button>
                      </Stack>
                    ) : (
                      <Box sx={{ position: "relative" }}>
                        <IconButton
                          size="small"
                          onClick={() => setEditingSection(`body-${idx}`)}
                          sx={{ position: "absolute", top: -8, right: -8 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                          {paragraph}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Closing Paragraph */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Closing ({closingWords} words)
                </Typography>
                {editingSection !== "closing" && (
                  <IconButton
                    size="small"
                    onClick={() => setEditingSection("closing")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {editingSection === "closing" ? (
                <Stack spacing={1}>
                  <TextField
                    multiline
                    rows={3}
                    value={content.closing}
                    onChange={(e) => onUpdateClosing(e.target.value)}
                    spellCheck={true}
                    onMouseUp={(e) => handleSelection(e, "closing")}
                    fullWidth
                    placeholder="Closing paragraph..."
                  />
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => setEditingSection(null)}
                    size="small"
                  >
                    Save Closing
                  </Button>
                </Stack>
              ) : (
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {content.closing}
                </Typography>
              )}
            </Box>

            {/* Signature */}
            <Box sx={{ mt: 2 }}>
              <Typography>{content.signature || "Sincerely,"}</Typography>
              <Typography fontWeight={600}>
                {content.header.name || "Your Name"}
              </Typography>
            </Box>
          </Stack>
        </Paper>
        {/* Synonym Popover (appears when user selects text in an editable field) */}
        <Popover
          open={Boolean(synPopoverAnchor) && synonyms.length > 0}
          anchorEl={synPopoverAnchor}
          onClose={() => {
            setSynonyms([]);
            setSynPopoverAnchor(null);
            setSelectionInfo(null);
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <List dense sx={{ minWidth: 160 }}>
            {synonyms.map((syn) => (
              <ListItem key={syn} disablePadding>
                <ListItemButton onClick={() => replaceSelected(syn)}>
                  {syn}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Popover>

        {/* Word Count Summary */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Typography variant="caption">Opening: {openingWords}w</Typography>
            <Typography variant="caption">Body: {bodyWords}w</Typography>
            <Typography variant="caption">Closing: {closingWords}w</Typography>
            <Typography variant="caption" fontWeight={600}>
              Total: {totalWords}w
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
