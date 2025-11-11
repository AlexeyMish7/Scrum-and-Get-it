/**
 * Resume PDF Export Utility
 *
 * WHAT: Generates professional PDF from resume draft content
 * WHY: Users need to download and submit resumes in PDF format
 *
 * Features:
 * - Professional single-column layout
 * - Proper typography and spacing
 * - Section headers with visual hierarchy
 * - Bullet point formatting
 * - Page break handling
 * - Custom filename generation
 *
 * Inputs: ResumeDraft object
 * Output: Downloads PDF file to user's browser
 */

import jsPDF from "jspdf";

interface ResumeDraft {
  id: string;
  name: string;
  content: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      graduation_date?: string;
      details?: string[];
    }>;
    projects?: Array<{
      name: string;
      role?: string;
      bullets?: string[];
    }>;
  };
  metadata: {
    lastModified: Date;
    sections: Array<{
      type: "summary" | "skills" | "experience" | "education" | "projects";
      visible: boolean;
    }>;
  };
}

// PDF layout constants (in mm for jsPDF)
const PAGE_WIDTH = 210; // A4 width
const PAGE_HEIGHT = 297; // A4 height
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_SPACING = 8;
const BULLET_INDENT = 5;

/**
 * Export options for resume PDF generation
 */
interface ExportOptions {
  filename?: string;
  watermark?: boolean;
  visualStyle?: string; // Visual styling (fonts, colors, layout) - defaults to template's style
}

/**
 * Visual style configuration for resume exports
 * Controls fonts, colors, bullet styles, etc.
 */
interface VisualStyleConfig {
  bodyFont: "helvetica" | "times" | "courier";
  headerFont: "helvetica" | "times" | "courier";
  accentColor: [number, number, number]; // RGB
  bulletStyle: string;
  sectionUnderline: boolean;
}

/**
 * Get visual style configuration based on selected style
 */
function getVisualStyleConfig(style?: string): VisualStyleConfig {
  const normalizedStyle = (style || "modern").toLowerCase();

  switch (normalizedStyle) {
    case "classic":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [0, 0, 0], // Black
        bulletStyle: "•",
        sectionUnderline: true,
      };

    case "minimal":
      return {
        bodyFont: "helvetica",
        headerFont: "helvetica",
        accentColor: [100, 100, 100], // Gray
        bulletStyle: "–",
        sectionUnderline: false,
      };

    case "creative":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [128, 0, 128], // Purple
        bulletStyle: "◦",
        sectionUnderline: true,
      };

    case "academic":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [0, 0, 0], // Black
        bulletStyle: "•",
        sectionUnderline: true,
      };

    case "modern":
    default:
      return {
        bodyFont: "helvetica",
        headerFont: "helvetica",
        accentColor: [0, 102, 204], // Blue
        bulletStyle: "▸",
        sectionUnderline: true,
      };
  }
}

export function exportResumeToPDF(
  draft: ResumeDraft,
  userProfile?: { full_name?: string; email?: string; phone?: string },
  options?: ExportOptions
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Get visual style configuration
  const visualConfig = getVisualStyleConfig(options?.visualStyle);

  let currentY = MARGIN;

  // Helper: Add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 10
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont(visualConfig.bodyFont, "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * LINE_HEIGHT;
  };

  // Helper: Add section header
  const addSectionHeader = (title: string, y: number): number => {
    doc.setFontSize(12);
    doc.setFont(visualConfig.headerFont, "bold");
    doc.setTextColor(...visualConfig.accentColor);
    doc.text(title.toUpperCase(), MARGIN, y);

    // Underline (if style uses it)
    if (visualConfig.sectionUnderline) {
      doc.setDrawColor(...visualConfig.accentColor);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
    }

    // Reset to body font and color
    doc.setFont(visualConfig.bodyFont, "normal");
    doc.setTextColor(0, 0, 0);
    return y + SECTION_SPACING;
  };

  // Helper: Check if we need a new page
  const checkPageBreak = (neededSpace: number): number => {
    if (currentY + neededSpace > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      return MARGIN;
    }
    return currentY;
  };

  // === HEADER: Contact Information ===
  if (userProfile?.full_name) {
    doc.setFontSize(18);
    doc.setFont(visualConfig.headerFont, "bold");
    doc.setTextColor(...visualConfig.accentColor);
    doc.text(userProfile.full_name, MARGIN, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont(visualConfig.bodyFont, "normal");
    doc.setTextColor(0, 0, 0);
    const contactInfo = [userProfile.email, userProfile.phone]
      .filter(Boolean)
      .join(" • ");

    if (contactInfo) {
      doc.text(contactInfo, MARGIN, currentY);
      currentY += LINE_HEIGHT + 4;
    }
  }

  // === PROFESSIONAL SUMMARY ===
  if (draft.content.summary) {
    currentY = checkPageBreak(30);
    currentY = addSectionHeader("Professional Summary", currentY);
    currentY = addText(
      draft.content.summary,
      MARGIN,
      currentY,
      CONTENT_WIDTH,
      10
    );
    currentY += SECTION_SPACING;
  }

  // === TECHNICAL SKILLS ===
  if (draft.content.skills && draft.content.skills.length > 0) {
    currentY = checkPageBreak(20);
    currentY = addSectionHeader("Technical Skills", currentY);
    const skillsText = draft.content.skills.join(" • ");
    currentY = addText(skillsText, MARGIN, currentY, CONTENT_WIDTH, 10);
    currentY += SECTION_SPACING;
  }

  // === PROFESSIONAL EXPERIENCE ===
  if (draft.content.experience && draft.content.experience.length > 0) {
    currentY = checkPageBreak(40);
    currentY = addSectionHeader("Professional Experience", currentY);

    draft.content.experience.forEach((exp, idx) => {
      // Check space for job header + at least 2 bullets
      currentY = checkPageBreak(25);

      // Job title and company
      doc.setFontSize(11);
      doc.setFont(visualConfig.headerFont, "bold");
      const jobTitle = exp.role || "Position";
      doc.text(jobTitle, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      doc.setFont(visualConfig.bodyFont, "normal");
      const companyLine = [exp.company, exp.dates].filter(Boolean).join(" | ");
      if (companyLine) {
        doc.text(companyLine, MARGIN, currentY);
        currentY += LINE_HEIGHT;
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFontSize(10);
        doc.setFont(visualConfig.bodyFont, "normal");
        exp.bullets.forEach((bullet) => {
          currentY = checkPageBreak(12);

          // Bullet point symbol (using visual style)
          doc.text(visualConfig.bulletStyle, MARGIN + BULLET_INDENT, currentY);

          // Bullet text with wrap
          const bulletLines = doc.splitTextToSize(
            bullet,
            CONTENT_WIDTH - BULLET_INDENT - 3
          );
          doc.text(bulletLines, MARGIN + BULLET_INDENT + 3, currentY);
          currentY += bulletLines.length * LINE_HEIGHT;
        });
      }

      // Spacing between jobs
      if (idx < (draft.content.experience?.length ?? 0) - 1) {
        currentY += 4;
      }
    });

    currentY += SECTION_SPACING;
  }

  // === EDUCATION ===
  if (draft.content.education && draft.content.education.length > 0) {
    currentY = checkPageBreak(30);
    currentY = addSectionHeader("Education", currentY);

    draft.content.education.forEach((edu, idx) => {
      currentY = checkPageBreak(15);

      doc.setFontSize(11);
      doc.setFont(visualConfig.headerFont, "bold");
      doc.text(edu.degree, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      doc.setFont(visualConfig.bodyFont, "normal");
      const schoolLine = [edu.institution, edu.graduation_date]
        .filter(Boolean)
        .join(" | ");
      if (schoolLine) {
        doc.text(schoolLine, MARGIN, currentY);
        currentY += LINE_HEIGHT;
      }

      // Education details
      if (edu.details && edu.details.length > 0) {
        doc.setFontSize(10);
        edu.details.forEach((detail) => {
          currentY = checkPageBreak(10);
          doc.text(visualConfig.bulletStyle, MARGIN + BULLET_INDENT, currentY);
          const detailLines = doc.splitTextToSize(
            detail,
            CONTENT_WIDTH - BULLET_INDENT - 3
          );
          doc.text(detailLines, MARGIN + BULLET_INDENT + 3, currentY);
          currentY += detailLines.length * LINE_HEIGHT;
        });
      }

      if (idx < (draft.content.education?.length ?? 0) - 1) {
        currentY += 4;
      }
    });

    currentY += SECTION_SPACING;
  }

  // === PROJECTS ===
  if (draft.content.projects && draft.content.projects.length > 0) {
    currentY = checkPageBreak(30);
    currentY = addSectionHeader("Projects", currentY);

    draft.content.projects.forEach((project, idx) => {
      currentY = checkPageBreak(15);

      doc.setFontSize(11);
      doc.setFont(visualConfig.headerFont, "bold");
      const projectTitle = project.role
        ? `${project.name} — ${project.role}`
        : project.name;
      doc.text(projectTitle, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      if (project.bullets && project.bullets.length > 0) {
        doc.setFontSize(10);
        doc.setFont(visualConfig.bodyFont, "normal");
        project.bullets.forEach((bullet) => {
          currentY = checkPageBreak(10);
          doc.text(visualConfig.bulletStyle, MARGIN + BULLET_INDENT, currentY);
          const bulletLines = doc.splitTextToSize(
            bullet,
            CONTENT_WIDTH - BULLET_INDENT - 3
          );
          doc.text(bulletLines, MARGIN + BULLET_INDENT + 3, currentY);
          currentY += bulletLines.length * LINE_HEIGHT;
        });
      }

      if (idx < (draft.content.projects?.length ?? 0) - 1) {
        currentY += 4;
      }
    });
  }

  // Generate filename (allow override from options)
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const cleanName = draft.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const filename =
    options?.filename && options.filename.trim()
      ? options.filename.trim()
      : `${cleanName}_${timestamp}.pdf`;

  // Optional watermark - simple text at bottom of each page
  if (options?.watermark) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text("DRAFT", PAGE_WIDTH / 2, PAGE_HEIGHT - 12, {
        align: "center",
      });
    }
  }

  // Save/download PDF
  doc.save(filename);
}
