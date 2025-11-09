/**
 * Export Handlers for Resume Generation
 *
 * WHAT: Provides PDF and DOCX export functionality for resume content.
 * WHY: Separates export logic from main component, enables reusability and testing.
 *
 * Export Flow:
 *  1. PDF: Capture DOM preview → html2canvas → jsPDF → download + optional storage
 *  2. DOCX: Transform content → docx library → download + optional storage
 *
 * Storage Integration:
 *  - Both exports optionally create a document row and link to job materials
 *  - Requires user authentication and job context
 *  - Falls back gracefully if storage fails (download still succeeds)
 */

import { Document, Packer, Paragraph, TextRun } from "docx";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { createDocumentAndLink } from "@workspaces/ai/services/aiGeneration";

interface ExportContext {
  userId?: string;
  jobId?: number | null;
  lastContent: ResumeArtifactContent | null;
  showSuccess: (message: string) => void;
  handleError: (error: unknown) => void;
  setSrMessage: (message: string) => void;
}

/**
 * buildDocxFromResume
 * WHAT: Convert ResumeArtifactContent into docx Paragraph blocks.
 * WHY: Provide basic DOCX export with simple formatting and bullet lists.
 * INPUT: ResumeArtifactContent with sections (summary, skills, experience, etc.)
 * OUTPUT: Array<Paragraph> suitable for docx Document
 *
 * Structure:
 *  - Summary section (if present)
 *  - Skills section (comma-separated)
 *  - Experience entries (role/company/dates + bullets)
 *  - Education entries (institution/degree/date + details)
 *  - Projects (name/role + bullets)
 *  - ATS Keywords (if present)
 */
export function buildDocxFromResume(
  content: ResumeArtifactContent
): Paragraph[] {
  const out: Paragraph[] = [];

  // Summary section
  if (content.summary) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Summary", bold: true, size: 24 })],
        spacing: { after: 120 },
      })
    );
    out.push(new Paragraph({ text: content.summary }));
  }

  // Skills section
  if (content.ordered_skills?.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Skills", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    out.push(
      new Paragraph({
        text: content.ordered_skills.join(", "),
      })
    );
  }

  // Experience section
  const exp = content.sections?.experience || [];
  if (exp.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Experience", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of exp) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.role, row.company, row.dates]
                .filter(Boolean)
                .join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const b of row.bullets || []) {
        out.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      }
    }
  }

  // Education section
  const education = content.sections?.education || [];
  if (education.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Education", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of education) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.institution, row.degree, row.graduation_date]
                .filter(Boolean)
                .join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const d of row.details || []) {
        out.push(new Paragraph({ text: d, bullet: { level: 0 } }));
      }
    }
  }

  // Projects section
  const projects = content.sections?.projects || [];
  if (projects.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "Projects", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const row of projects) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [row.name, row.role].filter(Boolean).join(" - "),
              bold: true,
            }),
          ],
          spacing: { after: 60 },
        })
      );
      for (const d of row.bullets || []) {
        out.push(new Paragraph({ text: d, bullet: { level: 0 } }));
      }
    }
  }

  // ATS Keywords section
  if (content.ats_keywords?.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "ATS Keywords", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    out.push(new Paragraph({ text: content.ats_keywords.join(", ") }));
  }

  return out;
}

/**
 * handlePdfExport
 * WHAT: Export resume preview as PDF using html2canvas + jsPDF.
 * WHY: Provide downloadable PDF for job applications.
 *
 * FLOW:
 *  1. Lazy-load html2canvas and jsPDF libraries
 *  2. Capture DOM element "resume-formatted-preview" as canvas
 *  3. Convert canvas to PDF with A4 formatting
 *  4. Trigger browser download
 *  5. Optionally store in database and link to job materials
 *
 * INPUT: ExportContext with user, job, content, and feedback handlers
 * OUTPUT: Promise<void> - resolves after download/storage complete
 *
 * ERROR MODES:
 *  - Preview element not found → throws Error
 *  - Canvas conversion fails → throws from html2canvas
 *  - Storage fails → logs error but download still succeeds
 */
export async function handlePdfExport(ctx: ExportContext): Promise<void> {
  const { userId, jobId, showSuccess, handleError, setSrMessage } = ctx;

  try {
    // Lazy import to keep bundle lean (only loaded when exporting)
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf") as unknown as Promise<{
        jsPDF: typeof import("jspdf").jsPDF;
      }>,
    ]);

    // Capture formatted preview DOM element
    const el = document.getElementById("resume-formatted-preview");
    if (!el) throw new Error("Formatted preview not available");

    const canvas = await html2canvas(el, {
      scale: Math.min(window.devicePixelRatio || 1.5, 2),
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    });

    // Fit image onto A4 with aspect ratio preservation
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 48; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const y = 24;

    if (imgHeight > pageHeight - 48) {
      // Scale down to fit height if too tall
      const h = pageHeight - 48;
      const w = (canvas.width * h) / canvas.height;
      pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 24, w, h);
    } else {
      pdf.addImage(imgData, "PNG", 24, y, imgWidth, imgHeight);
    }

    const fname = `resume_${jobId ?? "preview"}.pdf`;

    // Create blob for optional storage linking
    const blob = pdf.output("blob");
    pdf.save(fname);
    setSrMessage("Resume exported as PDF");
    showSuccess("Exported PDF");

    // If user & job present, persist and link document row
    if (userId && jobId) {
      const linked = await createDocumentAndLink({
        userId,
        jobId,
        file: blob,
        filename: fname,
        mime: "application/pdf",
        kind: "resume",
        linkType: "resume",
      });
      if (linked) {
        showSuccess("PDF stored & linked to job materials");
        setSrMessage("PDF stored and linked to job materials");
      }
    }
  } catch (e) {
    handleError(e);
  }
}

/**
 * handleDocxExport
 * WHAT: Export resume content as DOCX using docx library.
 * WHY: Provide editable Word document for job applications.
 *
 * FLOW:
 *  1. Transform ResumeArtifactContent to docx Paragraph structure
 *  2. Build Document with formatted sections
 *  3. Generate blob and trigger browser download
 *  4. Optionally store in database and link to job materials
 *
 * INPUT: ExportContext with user, job, content, and feedback handlers
 * OUTPUT: Promise<void> - resolves after download/storage complete
 *
 * ERROR MODES:
 *  - No content available → throws Error
 *  - Document generation fails → throws from docx library
 *  - Storage fails → logs error but download still succeeds
 */
export async function handleDocxExport(ctx: ExportContext): Promise<void> {
  const { userId, jobId, lastContent, showSuccess, handleError, setSrMessage } =
    ctx;

  try {
    if (!lastContent) throw new Error("No content to export");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: buildDocxFromResume(lastContent),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fname = `resume_${jobId ?? "preview"}.docx`;

    // Trigger download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);

    showSuccess("Exported DOCX");
    setSrMessage("Resume exported as DOCX");

    // If user & job present, persist and link document row
    if (userId && jobId) {
      const linked = await createDocumentAndLink({
        userId,
        jobId,
        file: blob,
        filename: fname,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        kind: "resume",
        linkType: "resume",
      });
      if (linked) {
        showSuccess("DOCX stored & linked to job materials");
        setSrMessage("DOCX stored and linked to job materials");
      }
    }
  } catch (e) {
    handleError(e);
  }
}
