/**
 * EXPORT SERVICE (⚠️ PLACEHOLDER - Backend Integration Needed)
 *
 * Purpose:
 * - Export documents to various formats (PDF, DOCX, HTML, TXT)
 * - Track export history in database
 * - Generate print-optimized previews
 * - Support format-specific options (page size, margins, etc.)
 *
 * Current State: ⚠️ MOCK IMPLEMENTATION
 * - Contains placeholder functions with console.log only
 * - No actual PDF/DOCX generation
 * - No backend API calls
 * - All TODOs marked for integration
 *
 * Backend Connection Needed:
 * - API: POST /api/export/pdf, /api/export/docx (backend server)
 * - Database: export_history table (via @shared/services/crud)
 * - Auth: JWT token from @shared/context/AuthContext
 * - Storage: Supabase Storage for exported files (optional)
 *
 * Required Integrations:
 * 1. exportToPDF() → Call backend PDF generation endpoint
 * 2. exportToDOCX() → Call backend DOCX generation endpoint
 * 3. exportToHTML() → Render template+theme to HTML string
 * 4. exportToTXT() → Extract plain text from document
 * 5. trackExport() → Save to export_history table
 * 6. getExportHistory() → Fetch user's export history
 *
 * Migration Path:
 * 1. Import aiClient from @workspaces/ai/services/client
 * 2. Import @shared/services/crud for export history tracking
 * 3. Implement actual export API calls replacing console.log
 * 4. Add progress tracking for large exports
 * 5. Add error handling and retry logic
 *
 * Usage:
 *   import { exportDocument, trackExport } from '@ai_workspace/services';
 *
 *   await exportDocument(document, template, theme, {
 *     format: 'pdf',
 *     filename: 'resume',
 *     includeTemplate: true,
 *     includeTheme: true
 *   });
 */

import type { Document } from "../types/document.types";
import type { Template, Theme } from "../types/template.types";
import { jsPDF } from "jspdf";

/**
 * Export format types
 */
export type ExportFormat = "pdf" | "docx" | "html" | "txt" | "json";

/**
 * Export options
 */
export interface ExportOptions {
  /** Format to export to */
  format: ExportFormat;

  /** Include template styling */
  includeTemplate: boolean;

  /** Include theme styling */
  includeTheme: boolean;

  /** Filename (without extension) */
  filename?: string;

  /** PDF-specific options */
  pdfOptions?: {
    pageSize: "A4" | "Letter";
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    orientation: "portrait" | "landscape";
  };

  /** DOCX-specific options */
  docxOptions?: {
    includeComments: boolean;
    trackChanges: boolean;
  };

  /** HTML-specific options */
  htmlOptions?: {
    standalone: boolean;
    includeCSS: boolean;
    minify: boolean;
  };
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "pdf",
  includeTemplate: true,
  includeTheme: true,
  pdfOptions: {
    pageSize: "A4",
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    orientation: "portrait",
  },
};

/**
 * Export result
 */
export interface ExportResult {
  /** Success status */
  success: boolean;

  /** Download URL (blob URL or server URL) */
  downloadUrl?: string;

  /** Filename */
  filename: string;

  /** File size in bytes */
  fileSize?: number;

  /** Error message if failed */
  error?: string;

  /** Export metadata */
  metadata?: {
    format: ExportFormat;
    timestamp: string;
    version: string;
  };
}

/**
 * Export history entry
 */
export interface ExportHistoryEntry {
  id: string;
  documentId: string;
  format: ExportFormat;
  filename: string;
  timestamp: string;
  fileSize?: number;
  downloadUrl?: string;
}

/**
 * Export a document to specified format
 *
 * @param document - Document to export
 * @param template - Template for rendering
 * @param theme - Theme for styling
 * @param options - Export options
 * @returns Export result with download URL
 */
export async function exportDocument(
  document: Document,
  template: Template,
  theme: Theme,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const filename =
      options.filename ||
      `${document.config.name}_${new Date().toISOString().split("T")[0]}`;

    // TODO: Replace with actual backend export API call
    // For now, simulate export with mock data

    switch (options.format) {
      case "pdf":
        return await exportToPDF(document, template, theme, options, filename);

      case "docx":
        return await exportToDOCX(document, template, theme, options, filename);

      case "html":
        return await exportToHTML(document, template, theme, options, filename);

      case "txt":
        return await exportToTXT(document, options, filename);

      case "json":
        return await exportToJSON(document, filename);

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    return {
      success: false,
      filename: "",
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Export document to PDF
 *
 * Uses jsPDF library for client-side PDF generation
 */
async function exportToPDF(
  document: Document,
  template: Template,
  theme: Theme,
  options: ExportOptions,
  filename: string
): Promise<ExportResult> {
  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: options.pdfOptions?.orientation || "portrait",
      unit: "mm",
      format: options.pdfOptions?.pageSize?.toLowerCase() || "a4",
    });

    const content = document.content as any;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Use template margins or fallback to options/defaults
    const margins = {
      top:
        template.layout.margins.top * 25.4 ||
        options.pdfOptions?.margins?.top ||
        15,
      right:
        template.layout.margins.right * 25.4 ||
        options.pdfOptions?.margins?.right ||
        15,
      bottom:
        template.layout.margins.bottom * 25.4 ||
        options.pdfOptions?.margins?.bottom ||
        15,
      left:
        template.layout.margins.left * 25.4 ||
        options.pdfOptions?.margins?.left ||
        15,
    };

    const maxWidth = pageWidth - margins.left - margins.right;

    let yPos = margins.top;
    const lineHeight = 5;
    const sectionSpacing = 6;

    // Helper function to convert color to RGB
    const colorToRGB = (
      color: string | undefined
    ): [number, number, number] => {
      if (!color || typeof color !== "string") {
        return [0, 0, 0]; // Default to black
      }

      // Remove # if present
      const hex = color.startsWith("#") ? color.slice(1) : color;

      // Ensure valid hex length
      if (hex.length !== 6) {
        return [0, 0, 0]; // Default to black
      }

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      // Check for NaN
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return [0, 0, 0];
      }

      return [r, g, b];
    };

    // Helper function to add text with word wrap
    const addText = (
      text: string,
      fontSize: number,
      isBold = false,
      color?: string
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");

      const [r, g, b] = colorToRGB(
        color || theme.colors?.text?.primary || theme.colors?.text
      );
      pdf.setTextColor(r, g, b);

      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPos > pdf.internal.pageSize.getHeight() - margins.bottom) {
          pdf.addPage();
          yPos = margins.top;
        }
        pdf.text(line, margins.left, yPos);
        yPos += lineHeight;
      });
    };

    const addLine = () => {
      const [r, g, b] = colorToRGB(theme.colors?.primary);
      pdf.setDrawColor(r, g, b);
      pdf.line(margins.left, yPos, pageWidth - margins.right, yPos);
      yPos += 3;
    };

    // Helper to render a section based on its type
    const renderSection = (sectionType: string, sectionData: any) => {
      if (!sectionData || sectionData.enabled === false) return;

      switch (sectionType) {
        case "header":
          if (document.type === "resume") {
            addText(
              sectionData.fullName || "",
              20,
              true,
              theme.colors?.primary
            );
            yPos += 1;
            addText(
              sectionData.title || "",
              11,
              false,
              theme.colors?.text?.secondary || theme.colors?.textSecondary
            );
            yPos += 1;
            const contactInfo = [
              sectionData.email,
              sectionData.phone,
              sectionData.location,
            ]
              .filter(Boolean)
              .join(" | ");
            if (contactInfo) {
              addText(
                contactInfo,
                9,
                false,
                theme.colors?.text?.secondary || theme.colors?.textSecondary
              );
            }
            yPos += sectionSpacing;
          } else {
            // Cover letter header
            addText(
              sectionData.fullName || "",
              14,
              true,
              theme.colors?.primary
            );
            yPos += 1;
            addText(sectionData.email || "", 9);
            addText(sectionData.phone || "", 9);
            addText(sectionData.location || "", 9);
            yPos += 1;
            addText(
              sectionData.date || new Date().toLocaleDateString(),
              9,
              false,
              theme.colors?.text?.secondary || theme.colors?.textSecondary
            );
            yPos += sectionSpacing;
          }
          break;

        case "summary":
          if (sectionData.text) {
            addText("PROFESSIONAL SUMMARY", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;
            addText(sectionData.text, 9);
            yPos += sectionSpacing;
          }
          break;

        case "experience":
          if (sectionData.items && sectionData.items.length > 0) {
            addText("WORK EXPERIENCE", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;

            sectionData.items.forEach((exp: any, index: number) => {
              if (index > 0) yPos += 3;
              addText(exp.title || "", 10, true);
              addText(
                `${exp.company || ""} • ${exp.location || ""}`,
                9,
                false,
                theme.colors?.text?.secondary || theme.colors?.textSecondary
              );
              const startDate = exp.startDate || "";
              const endDate = exp.current ? "Present" : exp.endDate || "";
              if (startDate && endDate) {
                addText(
                  `${startDate} – ${endDate}`,
                  8,
                  false,
                  theme.colors?.text?.secondary || theme.colors?.textSecondary
                );
              }
              yPos += 1;

              const bullets = exp.bullets || [];
              if (bullets.length > 0) {
                bullets.forEach((bullet: string) => {
                  if (bullet && bullet.trim()) {
                    pdf.setFontSize(9);
                    const [r, g, b] = colorToRGB(
                      theme.colors?.text?.primary || theme.colors?.text
                    );
                    pdf.setTextColor(r, g, b);
                    const lines = pdf.splitTextToSize(
                      bullet.trim(),
                      maxWidth - 8
                    );
                    lines.forEach((line: string, i: number) => {
                      if (
                        yPos >
                        pdf.internal.pageSize.getHeight() - margins.bottom
                      ) {
                        pdf.addPage();
                        yPos = margins.top;
                      }
                      pdf.text(
                        i === 0 ? "• " + line : "   " + line,
                        margins.left + 5,
                        yPos
                      );
                      yPos += lineHeight;
                    });
                  }
                });
              }
            });
            yPos += sectionSpacing;
          }
          break;

        case "education":
          if (sectionData.items && sectionData.items.length > 0) {
            addText("EDUCATION", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;

            sectionData.items.forEach((edu: any, index: number) => {
              if (index > 0) yPos += 3;
              addText(`${edu.degree || ""} in ${edu.field || ""}`, 10, true);
              addText(
                `${edu.institution || ""}${
                  edu.location ? ` - ${edu.location}` : ""
                }`,
                9,
                false,
                theme.colors?.text?.secondary || theme.colors?.textSecondary
              );
              addText(
                edu.graduationDate || "",
                8,
                false,
                theme.colors?.text?.secondary || theme.colors?.textSecondary
              );
              if (edu.gpa) {
                addText(`GPA: ${edu.gpa}`, 9);
              }
            });
            yPos += sectionSpacing;
          }
          break;

        case "skills":
          if (sectionData.categories && sectionData.categories.length > 0) {
            addText("SKILLS", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;

            sectionData.categories.forEach((category: any) => {
              addText(
                `${category.name || ""}:`,
                10,
                true,
                theme.colors?.text?.secondary || theme.colors?.textSecondary
              );
              const skillsText =
                category.skills?.map((s: any) => s.name).join(", ") || "";
              addText(skillsText, 9);
              yPos += 2;
            });
            yPos += sectionSpacing;
          }
          break;

        case "projects":
          if (sectionData.items && sectionData.items.length > 0) {
            addText("PROJECTS", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;

            sectionData.items.forEach((project: any, index: number) => {
              if (index > 0) yPos += 3;
              addText(project.name || "", 10, true);
              if (project.description) {
                addText(project.description, 9);
              }
              yPos += 1;
            });
            yPos += sectionSpacing;
          }
          break;

        case "certifications":
          if (sectionData.items && sectionData.items.length > 0) {
            addText("CERTIFICATIONS", 12, true, theme.colors?.primary);
            yPos += 0.5;
            addLine();
            yPos += 2;

            sectionData.items.forEach((cert: any) => {
              addText(cert.name || "", 10, true);
              if (cert.issuer) {
                addText(
                  cert.issuer,
                  9,
                  false,
                  theme.colors?.text?.secondary || theme.colors?.textSecondary
                );
              }
              yPos += 2;
            });
            yPos += sectionSpacing;
          }
          break;

        case "recipient":
          // Cover letter recipient
          if (sectionData.name) addText(sectionData.name, 10);
          if (sectionData.title) addText(sectionData.title, 10);
          addText(sectionData.company || "", 10, true);
          if (sectionData.address) addText(sectionData.address, 10);
          yPos += sectionSpacing;
          break;

        case "salutation":
        case "paragraph":
          // Cover letter salutation/opening
          if (typeof sectionData === "string") {
            addText(sectionData, 10);
            yPos += 1;
          }
          break;

        case "signature":
          // Cover letter signature
          addText(sectionData.closing || "Sincerely,", 10);
          yPos += 4;
          addText(sectionData.name || content.header?.fullName || "", 10, true);
          break;

        default:
          // Generic text section
          if (typeof sectionData === "string" && sectionData) {
            addText(sectionData, 10);
            yPos += 2;
          }
      }
    };

    // Use template's section order if includeTemplate is true
    if (options.includeTemplate && template.layout.sectionOrder) {
      // Render sections in the order defined by the template
      template.layout.sectionOrder.forEach((section) => {
        if (!section.defaultEnabled && !content[section.id]?.enabled) return;

        const sectionData = content[section.id];
        if (sectionData) {
          renderSection(section.type, sectionData);
        }
      });
    } else {
      // Fallback to old hardcoded order
      // Render based on document type
      if (document.type === "resume") {
        // Render in standard order
        if (content.header) renderSection("header", content.header);
        if (content.summary) renderSection("summary", content.summary);
        if (content.experience) renderSection("experience", content.experience);
        if (content.education) renderSection("education", content.education);
        if (content.skills) renderSection("skills", content.skills);
        if (content.projects) renderSection("projects", content.projects);
        if (content.certifications)
          renderSection("certifications", content.certifications);
      } else if (document.type === "cover-letter") {
        // Cover letter sections in order
        if (content.header) renderSection("header", content.header);
        if (content.recipient) renderSection("recipient", content.recipient);
        if (content.salutation) renderSection("salutation", content.salutation);
        if (content.body?.opening) addText(content.body.opening, 10);
        if (content.body?.body1) {
          yPos += 2;
          addText(content.body.body1, 10);
        }
        if (content.body?.body2) {
          yPos += 2;
          addText(content.body.body2, 10);
        }
        if (content.body?.body3) {
          yPos += 2;
          addText(content.body.body3, 10);
        }
        if (content.body?.closing) {
          yPos += 2;
          addText(content.body.closing, 10);
          yPos += sectionSpacing;
        }
        if (content.signature) renderSection("signature", content.signature);
      }
    }

    // Generate blob
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    return {
      success: true,
      downloadUrl: url,
      filename: `${filename}.pdf`,
      fileSize: pdfBlob.size,
      metadata: {
        format: "pdf",
        timestamp: new Date().toISOString(),
        version: "1.0",
      },
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      error: error instanceof Error ? error.message : "PDF generation failed",
    };
  }
}

/**
 * Export document to DOCX
 *
 * Uses backend DOCX generation service or client-side library (e.g., docx.js)
 */
async function exportToDOCX(
  _document: Document,
  _template: Template,
  _theme: Theme,
  _options: ExportOptions,
  _filename: string
): Promise<ExportResult> {
  // TODO: Integrate with backend DOCX generation endpoint
  // POST /api/export/docx with document, template, theme data
  // Or use client-side library like docx.js

  // Mock implementation - return error for now
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: false,
    filename: "",
    error:
      "DOCX export is not yet implemented. Please use HTML or TXT format for now, or contact support for assistance.",
  };
}

/**
 * Export document to HTML
 *
 * Renders document with template+theme to standalone HTML
 */
async function exportToHTML(
  document: Document,
  _template: Template,
  theme: Theme,
  options: ExportOptions,
  filename: string
): Promise<ExportResult> {
  // Render document content with theme styling
  await new Promise((resolve) => setTimeout(resolve, 500));

  const content = document.content as any;
  let bodyContent = "";

  // Render based on document type
  if (document.type === "resume") {
    // Header
    if (content.header) {
      bodyContent += `
        <div class="header">
          <h1>${content.header.fullName || ""}</h1>
          <p class="title">${content.header.title || ""}</p>
          <div class="contact">
            ${
              content.header.email ? `<span>${content.header.email}</span>` : ""
            }
            ${
              content.header.phone ? `<span>${content.header.phone}</span>` : ""
            }
            ${
              content.header.location
                ? `<span>${content.header.location}</span>`
                : ""
            }
          </div>
        </div>
      `;
    }

    // Summary
    if (content.summary?.enabled && content.summary.text) {
      bodyContent += `
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${content.summary.text}</p>
        </div>
      `;
    }

    // Experience
    if (content.experience?.enabled && content.experience.items) {
      bodyContent += `<div class="section"><h2>Work Experience</h2>`;
      content.experience.items.forEach((exp: any) => {
        const bullets = exp.bullets || [];
        const bulletList =
          bullets.length > 0
            ? bullets.map((b: string) => `<li>${b}</li>`).join("")
            : "";

        bodyContent += `
          <div class="experience-item">
            <h3>${exp.title || ""}</h3>
            <p class="company">${exp.company || ""} • ${exp.location || ""}</p>
            <p class="dates">${exp.startDate || ""} - ${
          exp.current ? "Present" : exp.endDate || ""
        }</p>
            ${bulletList ? `<ul>${bulletList}</ul>` : ""}
          </div>
        `;
      });
      bodyContent += `</div>`;
    }

    // Education
    if (content.education?.enabled && content.education.items) {
      bodyContent += `<div class="section"><h2>Education</h2>`;
      content.education.items.forEach((edu: any) => {
        bodyContent += `
          <div class="education-item">
            <h3>${edu.degree || ""} in ${edu.field || ""}</h3>
            <p class="institution">${edu.institution || ""} ${
          edu.location ? `- ${edu.location}` : ""
        }</p>
            <p class="dates">${edu.graduationDate || ""}</p>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ""}
          </div>
        `;
      });
      bodyContent += `</div>`;
    }

    // Skills
    if (content.skills?.enabled && content.skills.categories) {
      bodyContent += `<div class="section"><h2>Skills</h2>`;
      content.skills.categories.forEach((category: any) => {
        bodyContent += `
          <div class="skills-category">
            <h4>${category.name || ""}</h4>
            <p>${category.skills?.map((s: any) => s.name).join(", ") || ""}</p>
          </div>
        `;
      });
      bodyContent += `</div>`;
    }
  } else if (document.type === "cover-letter") {
    // Cover letter rendering
    bodyContent += `
      <div class="cover-letter">
        <div class="header">
          <p><strong>${content.header?.fullName || ""}</strong></p>
          <p>${content.header?.email || ""}</p>
          <p>${content.header?.phone || ""}</p>
          <p>${content.header?.location || ""}</p>
          <p>${content.header?.date || ""}</p>
        </div>
        <br>
        <div class="recipient">
          ${content.recipient?.name ? `<p>${content.recipient.name}</p>` : ""}
          ${content.recipient?.title ? `<p>${content.recipient.title}</p>` : ""}
          <p><strong>${content.recipient?.company || ""}</strong></p>
          ${
            content.recipient?.address
              ? `<p>${content.recipient.address}</p>`
              : ""
          }
        </div>
        <br>
        <div class="salutation">
          <p>${content.salutation || "Dear Hiring Manager,"}</p>
        </div>
        <br>
        <div class="body">
          ${content.body?.opening ? `<p>${content.body.opening}</p><br>` : ""}
          ${content.body?.body1 ? `<p>${content.body.body1}</p><br>` : ""}
          ${content.body?.body2 ? `<p>${content.body.body2}</p><br>` : ""}
          ${content.body?.body3 ? `<p>${content.body.body3}</p><br>` : ""}
          ${content.body?.closing ? `<p>${content.body.closing}</p>` : ""}
        </div>
        <br><br>
        <div class="signature">
          <p>${content.signature?.closing || "Sincerely,"}</p>
          <br><br>
          <p><strong>${
            content.signature?.name || content.header?.fullName || ""
          }</strong></p>
        </div>
      </div>
    `;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.config.name}</title>
  ${
    options.htmlOptions?.includeCSS
      ? `<style>
    body {
      font-family: ${theme.typography?.bodyFont || "Arial, sans-serif"};
      color: ${theme.colors?.text || "#000000"};
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    h1, h2, h3, h4 {
      font-family: ${theme.typography?.headingFont || "Arial, sans-serif"};
      color: ${theme.colors?.primary || "#1976d2"};
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid ${
      theme.colors?.primary || "#1976d2"
    }; padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    h4 { font-size: 1.1rem; margin-bottom: 0.5rem; color: ${
      theme.colors?.secondary || "#dc004e"
    }; }
    .header { text-align: center; margin-bottom: 2rem; }
    .title { font-size: 1.25rem; color: ${
      theme.colors?.secondary || "#dc004e"
    }; }
    .contact { margin-top: 0.5rem; }
    .contact span { margin: 0 1rem; }
    .section { margin-bottom: 2rem; }
    .experience-item, .education-item, .skills-category { margin-bottom: 1.5rem; }
    .company, .institution, .dates { color: ${
      theme.colors?.textSecondary || "#666666"
    }; margin: 0.25rem 0; }
    ul { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; line-height: 1.5; }
    p { margin: 0.5rem 0; }
  </style>`
      : ""
  }
</head>
<body>
  ${bodyContent}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  return {
    success: true,
    downloadUrl: url,
    filename: `${filename}.html`,
    fileSize: blob.size,
    metadata: {
      format: "html",
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  };
}

/**
 * Export document to plain text
 *
 * Strips all formatting and exports raw content
 */
async function exportToTXT(
  document: Document,
  _options: ExportOptions,
  filename: string
): Promise<ExportResult> {
  // Extract plain text from document content
  await new Promise((resolve) => setTimeout(resolve, 300));

  const content = document.content as any;
  let textContent = "";

  if (document.type === "resume") {
    // Header
    if (content.header) {
      textContent += `${content.header.fullName || ""}\n`;
      textContent += `${content.header.title || ""}\n`;
      if (
        content.header.email ||
        content.header.phone ||
        content.header.location
      ) {
        textContent += `${[
          content.header.email,
          content.header.phone,
          content.header.location,
        ]
          .filter(Boolean)
          .join(" | ")}\n`;
      }
      textContent += "\n";
    }

    // Summary
    if (content.summary?.enabled && content.summary.text) {
      textContent += "PROFESSIONAL SUMMARY\n";
      textContent += "=".repeat(50) + "\n";
      textContent += `${content.summary.text}\n\n`;
    }

    // Experience
    if (content.experience?.enabled && content.experience.items) {
      textContent += "WORK EXPERIENCE\n";
      textContent += "=".repeat(50) + "\n";
      content.experience.items.forEach((exp: any) => {
        textContent += `${exp.title || ""}\n`;
        textContent += `${exp.company || ""} • ${exp.location || ""}\n`;
        textContent += `${exp.startDate || ""} - ${
          exp.current ? "Present" : exp.endDate || ""
        }\n`;

        const bullets = exp.bullets || [];
        if (bullets.length > 0) {
          bullets.forEach((bullet: string) => {
            if (bullet && bullet.trim()) {
              textContent += `• ${bullet.trim()}\n`;
            }
          });
        }
        textContent += "\n";
      });
    }

    // Education
    if (content.education?.enabled && content.education.items) {
      textContent += "EDUCATION\n";
      textContent += "=".repeat(50) + "\n";
      content.education.items.forEach((edu: any) => {
        textContent += `${edu.degree || ""} in ${edu.field || ""}\n`;
        textContent += `${edu.institution || ""}${
          edu.location ? ` - ${edu.location}` : ""
        }\n`;
        textContent += `${edu.graduationDate || ""}\n`;
        if (edu.gpa) {
          textContent += `GPA: ${edu.gpa}\n`;
        }
        textContent += "\n";
      });
    }

    // Skills
    if (content.skills?.enabled && content.skills.categories) {
      textContent += "SKILLS\n";
      textContent += "=".repeat(50) + "\n";
      content.skills.categories.forEach((category: any) => {
        textContent += `${category.name || ""}:\n`;
        textContent += `${
          category.skills?.map((s: any) => s.name).join(", ") || ""
        }\n\n`;
      });
    }
  } else if (document.type === "cover-letter") {
    // Cover letter
    if (content.header) {
      textContent += `${content.header.fullName || ""}\n`;
      textContent += `${content.header.email || ""}\n`;
      textContent += `${content.header.phone || ""}\n`;
      textContent += `${content.header.location || ""}\n`;
      textContent += `${content.header.date || ""}\n\n`;
    }
    if (content.recipient) {
      if (content.recipient.name) textContent += `${content.recipient.name}\n`;
      if (content.recipient.title)
        textContent += `${content.recipient.title}\n`;
      textContent += `${content.recipient.company || ""}\n`;
      if (content.recipient.address)
        textContent += `${content.recipient.address}\n`;
      textContent += "\n";
    }
    if (content.salutation) {
      textContent += `${content.salutation}\n\n`;
    }
    if (content.body) {
      if (content.body.opening) textContent += `${content.body.opening}\n\n`;
      if (content.body.body1) textContent += `${content.body.body1}\n\n`;
      if (content.body.body2) textContent += `${content.body.body2}\n\n`;
      if (content.body.body3) textContent += `${content.body.body3}\n\n`;
      if (content.body.closing) textContent += `${content.body.closing}\n\n`;
    }
    if (content.signature) {
      textContent += `${content.signature.closing || "Sincerely,"}\n\n\n`;
      textContent += `${
        content.signature.name || content.header.fullName || ""
      }\n`;
    }
  }

  const blob = new Blob([textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  return {
    success: true,
    downloadUrl: url,
    filename: `${filename}.txt`,
    fileSize: blob.size,
    metadata: {
      format: "txt",
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  };
}

/**
 * Export document to JSON
 *
 * Exports raw document data structure
 */
async function exportToJSON(
  document: Document,
  filename: string
): Promise<ExportResult> {
  const jsonContent = JSON.stringify(document, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  return {
    success: true,
    downloadUrl: url,
    filename: `${filename}.json`,
    fileSize: blob.size,
    metadata: {
      format: "json",
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  };
}

/**
 * Download exported file
 *
 * Triggers browser download for the exported file
 */
export function downloadExportedFile(
  downloadUrl: string,
  filename: string
): void {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL if it's a blob
  if (downloadUrl.startsWith("blob:")) {
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
  }
}

/**
 * Get export history for a document
 *
 * @param documentId - Document ID
 * @returns Array of export history entries
 */
export async function getExportHistory(
  documentId: string
): Promise<ExportHistoryEntry[]> {
  // TODO: Fetch from backend API
  // GET /api/documents/{documentId}/export-history

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: "1",
      documentId,
      format: "pdf",
      filename: "resume_2025-11-15.pdf",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fileSize: 245760,
    },
    {
      id: "2",
      documentId,
      format: "docx",
      filename: "resume_2025-11-10.docx",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fileSize: 180224,
    },
  ];
}

/**
 * Preview document before export
 *
 * Generates a preview URL that can be displayed in iframe or new window
 */
export async function previewDocument(
  document: Document,
  template: Template,
  theme: Theme
): Promise<string> {
  function escapeHtml(str: any) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // TODO: Generate preview HTML with template+theme rendering
  // Return blob URL or server preview endpoint

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const previewHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Preview: ${escapeHtml(document.config.name)}</title>
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin: 2rem; }
    /* Theme styles */
  </style>
</head>
<body>
  <h1>${escapeHtml(document.config.name)}</h1>
  <p>Template: ${escapeHtml(template.name)}</p>
  <p>Theme: ${escapeHtml(theme.name)}</p>
  <!-- Rendered document content -->
</body>
</html>`;

  const blob = new Blob([previewHTML], { type: "text/html" });
  return URL.createObjectURL(blob);
}

/**
 * Print document
 *
 * Opens browser print dialog with document preview
 */
export async function printDocument(
  document: Document,
  template: Template,
  theme: Theme
): Promise<void> {
  const previewUrl = await previewDocument(document, template, theme);

  const printWindow = window.open(previewUrl, "_blank");
  if (printWindow) {
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  }
}

/**
 * Batch export multiple documents
 *
 * @param documents - Array of documents to export
 * @param options - Export options (same for all)
 * @returns Array of export results
 */
export async function batchExportDocuments(
  documents: Array<{ document: Document; template: Template; theme: Theme }>,
  options: ExportOptions
): Promise<ExportResult[]> {
  const results: ExportResult[] = [];

  for (const { document, template, theme } of documents) {
    const result = await exportDocument(document, template, theme, options);
    results.push(result);
  }

  return results;
}

/**
 * Get supported export formats for document type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSupportedFormats(
  _documentType: "resume" | "cover-letter"
): ExportFormat[] {
  // All document types support all formats
  return ["pdf", "docx", "html", "txt", "json"];
}

/**
 * Estimate export file size
 *
 * Provides rough estimate before actual export
 */
export function estimateExportSize(
  document: Document,
  format: ExportFormat
): number {
  // Calculate base size from document content
  const content = document.content as any;
  let baseSize = 0;

  // Estimate content size
  if (document.type === "resume") {
    baseSize += JSON.stringify(content.header || {}).length;
    baseSize += content.summary?.text?.length || 0;
    baseSize += JSON.stringify(content.experience?.items || []).length;
    baseSize += JSON.stringify(content.education?.items || []).length;
    baseSize += JSON.stringify(content.skills?.categories || []).length;
  } else if (document.type === "cover-letter") {
    baseSize += JSON.stringify(content.header || {}).length;
    baseSize += JSON.stringify(content.recipient || {}).length;
    baseSize += content.body?.text?.length || 0;
  }

  // Fallback to character count if available
  if (baseSize === 0) {
    baseSize = document.stats.charCount || 1000;
  }

  const multipliers: Record<ExportFormat, number> = {
    pdf: 3.0, // PDF has overhead for formatting, fonts, metadata
    docx: 2.5, // DOCX is compressed XML
    html: 2.0, // HTML with inline CSS
    txt: 1.0, // Plain text, minimal overhead
    json: 1.5, // JSON with formatting
  };

  return Math.round(baseSize * multipliers[format]);
}
