/**
 * Cover Letter Export Utilities
 *
 * WHAT: Export cover letters to multiple formats (PDF, DOCX, plain text)
 * WHY: Users need to submit cover letters in various formats
 *
 * Formats:
 * - PDF: Professional, print-ready format
 * - DOCX: Editable Microsoft Word format
 * - TXT: Plain text for online applications
 *
 * Flow:
 * 1. Format content according to template
 * 2. Generate file in requested format
 * 3. Trigger browser download
 * 4. Optional: Upload to documents table for tracking
 */

import type { CoverLetterContent } from "../hooks/useCoverLetterDrafts";
import type { CoverLetterTemplate } from "../config/coverLetterTemplates";

/**
 * Export cover letter as plain text
 */
export function exportAsPlainText(
  content: CoverLetterContent,
  filename: string
): void {
  const text = [
    // Header
    content.header.name || "",
    content.header.email || "",
    content.header.phone || "",
    content.header.address || "",
    "",
    // Date
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "",
    // Recipient (if available)
    ...(content.header.hiringManager ? [content.header.hiringManager] : []),
    ...(content.header.companyName ? [content.header.companyName] : []),
    ...(content.header.companyAddress ? [content.header.companyAddress] : []),
    "",
    // Opening
    content.opening,
    "",
    // Body paragraphs
    ...content.body.map((paragraph) => `${paragraph}\n`),
    // Closing
    content.closing,
    "",
    // Signature
    content.signature || "Sincerely,",
    content.header.name || "",
  ]
    .filter(Boolean)
    .join("\n");

  downloadTextFile(text, filename);
}

/**
 * Export cover letter as HTML (for PDF conversion or email)
 */
export function exportAsHTML(
  content: CoverLetterContent,
  template: CoverLetterTemplate
): string {
  const style = template.style;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      color: ${style.colors.primary};
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
    }
    .header {
      margin-bottom: 2em;
    }
    .header-name {
      font-size: 1.5em;
      font-weight: 600;
      color: ${style.colors.accent};
      margin-bottom: 0.5em;
    }
    .header-info {
      color: ${style.colors.text};
      margin-bottom: 0.25em;
    }
    .date {
      margin-bottom: 2em;
    }
    .recipient {
      margin-bottom: 2em;
    }
    .paragraph {
      margin-bottom: 1.5em;
      text-align: justify;
    }
    .signature {
      margin-top: 2em;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-name">${escapeHtml(content.header.name || "")}</div>
    <div class="header-info">${escapeHtml(
      content.header.email || ""
    )} | ${escapeHtml(content.header.phone || "")}</div>
    ${
      content.header.address
        ? `<div class="header-info">${escapeHtml(content.header.address)}</div>`
        : ""
    }
  </div>

  <div class="date">
    ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
  </div>

  ${
    content.header.hiringManager || content.header.companyName
      ? `
  <div class="recipient">
    ${
      content.header.hiringManager
        ? `<div>${escapeHtml(content.header.hiringManager)}</div>`
        : ""
    }
    ${
      content.header.companyName
        ? `<div>${escapeHtml(content.header.companyName)}</div>`
        : ""
    }
    ${
      content.header.companyAddress
        ? `<div>${escapeHtml(content.header.companyAddress)}</div>`
        : ""
    }
  </div>
  `
      : ""
  }

  <div class="paragraph">${escapeHtml(content.opening).replace(
    /\n/g,
    "<br>"
  )}</div>

  ${content.body
    .map(
      (paragraph) =>
        `<div class="paragraph">${escapeHtml(paragraph).replace(
          /\n/g,
          "<br>"
        )}</div>`
    )
    .join("\n  ")}

  <div class="paragraph">${escapeHtml(content.closing).replace(
    /\n/g,
    "<br>"
  )}</div>

  <div class="signature">
    <div>${escapeHtml(content.signature || "Sincerely,")}</div>
    <div style="font-weight: 600; margin-top: 0.5em;">${escapeHtml(
      content.header.name || ""
    )}</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Export cover letter as PDF (using browser print API)
 * Note: Filename is not used for print dialog, but kept for API consistency
 */
export async function exportAsPDF(
  content: CoverLetterContent,
  template: CoverLetterTemplate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filename: string
): Promise<void> {
  const html = exportAsHTML(content, template);

  // Create a temporary iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to create print document");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Trigger print dialog
  iframe.contentWindow?.print();

  // Clean up after print dialog closes
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}

/**
 * Export cover letter as DOCX (using docx library)
 * Note: For now, this creates a simple HTML file that can be opened in Word
 * TODO: Integrate proper DOCX library (docx.js) for native Word format
 */
export function exportAsDOCX(
  content: CoverLetterContent,
  template: CoverLetterTemplate,
  filename: string
): void {
  const html = exportAsHTML(content, template);

  // Create DOCX-compatible HTML
  const docxHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Cover Letter</title>
</head>
${html.replace("<html>", "").replace("</html>", "")}
</html>
  `.trim();

  const blob = new Blob([docxHtml], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadBlob(blob, filename);
}

/**
 * Helper: Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper: Download text file
 */
function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  downloadBlob(blob, filename);
}

/**
 * Helper: Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export based on draft info
 */
export function generateFilename(
  draftName: string,
  format: "pdf" | "docx" | "txt"
): string {
  const sanitized = draftName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `cover-letter-${sanitized}-${timestamp}.${format}`;
}
