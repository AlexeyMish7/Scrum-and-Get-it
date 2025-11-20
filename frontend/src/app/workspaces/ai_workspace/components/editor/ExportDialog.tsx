/**
 * ExportDialog Component
 *
 * Dialog for exporting documents to various formats (PDF, DOCX, HTML, TXT).
 * Provides format selection, export options, and preview functionality.
 *
 * Flow:
 * 1. Select export format
 * 2. Configure format-specific options
 * 3. Preview or export
 * 4. Download file
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Switch,
  Box,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Description as DocxIcon,
  Code as HtmlIcon,
  TextFields as TxtIcon,
  DataObject as JsonIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";

import type { Document } from "../../types/document.types";
import type { Template, Theme } from "../../types/template.types";
import type { ExportFormat, ExportOptions } from "../../services/exportService";
import {
  exportDocument,
  downloadExportedFile,
  estimateExportSize,
} from "../../services/exportService";

/**
 * ExportDialog Props
 */
export interface ExportDialogProps {
  /** Dialog open state */
  open: boolean;

  /** Close handler */
  onClose: () => void;

  /** Document to export */
  document: Document;

  /** Template for rendering */
  template: Template;

  /** Theme for styling */
  theme: Theme;

  /** Export complete handler */
  onExportComplete?: (filename: string, format: ExportFormat) => void;
}

/**
 * Format icons mapping
 */
const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  pdf: <PdfIcon />,
  docx: <DocxIcon />,
  html: <HtmlIcon />,
  txt: <TxtIcon />,
  json: <JsonIcon />,
};

/**
 * Format labels mapping
 */
const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF Document",
  docx: "Microsoft Word (.docx)",
  html: "HTML Web Page",
  txt: "Plain Text",
  json: "JSON Data",
};

/**
 * ExportDialog Component
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  document,
  template,
  theme,
  onExportComplete,
}) => {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [filename, setFilename] = useState<string>(document.config.name);
  const [includeTemplate, setIncludeTemplate] = useState(true);
  const [includeTheme, setIncludeTheme] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle export
   */
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const options: ExportOptions = {
        format,
        includeTemplate,
        includeTheme,
        filename,
      };

      const result = await exportDocument(document, template, theme, options);

      if (result.success && result.downloadUrl) {
        downloadExportedFile(result.downloadUrl, result.filename);
        onExportComplete?.(result.filename, format);
        onClose();
      } else {
        setError(result.error || "Export failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle preview
   */
  const handlePreview = async () => {
    try {
      setError(null);

      // Generate preview based on format
      let previewUrl: string;

      if (format === "html") {
        // Generate HTML and open in new window
        const result = await exportDocument(document, template, theme, {
          format: "html",
          includeTemplate,
          includeTheme,
          filename,
          htmlOptions: {
            standalone: true,
            includeCSS: true,
            minify: false,
          },
        });

        if (result.success && result.downloadUrl) {
          previewUrl = result.downloadUrl;
        } else {
          setError(result.error || "Preview generation failed");
          return;
        }
      } else if (format === "txt") {
        // Generate TXT and open in new window
        const result = await exportDocument(document, template, theme, {
          format: "txt",
          includeTemplate,
          includeTheme,
          filename,
        });

        if (result.success && result.downloadUrl) {
          previewUrl = result.downloadUrl;
        } else {
          setError(result.error || "Preview generation failed");
          return;
        }
      } else if (format === "pdf") {
        // Generate PDF and open in new window
        const result = await exportDocument(document, template, theme, {
          format: "pdf",
          includeTemplate,
          includeTheme,
          filename,
          pdfOptions: {
            pageSize: "A4",
            margins: { top: 20, right: 20, bottom: 20, left: 20 },
            orientation: "portrait",
          },
        });

        if (result.success && result.downloadUrl) {
          previewUrl = result.downloadUrl;
        } else {
          setError(result.error || "Preview generation failed");
          return;
        }
      } else if (format === "json") {
        // Generate JSON and open in new window
        const result = await exportDocument(document, template, theme, {
          format: "json",
          includeTemplate,
          includeTheme,
          filename,
        });

        if (result.success && result.downloadUrl) {
          previewUrl = result.downloadUrl;
        } else {
          setError(result.error || "Preview generation failed");
          return;
        }
      } else {
        setError(`Preview not available for ${format.toUpperCase()} format`);
        return;
      }

      // Open preview in new window
      const previewWindow = window.open(previewUrl, "_blank");
      if (!previewWindow) {
        setError("Please allow popups to view the preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  };

  /**
   * Get estimated file size
   */
  const estimatedSize = estimateExportSize(document, format);
  const formattedSize =
    estimatedSize < 1024
      ? `${estimatedSize} bytes`
      : estimatedSize < 1024 * 1024
      ? `${(estimatedSize / 1024).toFixed(1)} KB`
      : `${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Document</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Export Progress */}
          {isExporting && <LinearProgress />}

          {/* Document Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Document
            </Typography>
            <Typography variant="body1">{document.config.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={`Template: ${template.name}`} size="small" />
              <Chip label={`Theme: ${theme.name}`} size="small" />
            </Stack>
          </Box>

          {/* Format Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              {Object.entries(FORMAT_LABELS).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio />}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      {FORMAT_ICONS[key as ExportFormat]}
                      <Typography>{label}</Typography>
                    </Stack>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* Filename */}
          <TextField
            label="Filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            fullWidth
            helperText={`Will be saved as: ${filename}.${format}`}
          />

          {/* Export Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Options
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeTemplate}
                    onChange={(e) => setIncludeTemplate(e.target.checked)}
                  />
                }
                label="Include template formatting"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeTheme}
                    onChange={(e) => setIncludeTheme(e.target.checked)}
                  />
                }
                label="Include theme styling"
              />
            </Stack>
          </Box>

          {/* File Size Estimate */}
          <Alert severity="info">
            Estimated file size: <strong>{formattedSize}</strong>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handlePreview}
          startIcon={<PreviewIcon />}
          disabled={isExporting}
        >
          Preview
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={isExporting}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};
