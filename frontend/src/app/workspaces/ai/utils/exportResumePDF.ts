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
 * Generate and download resume as PDF
 *
 * @param draft - Resume draft to export
 * @param userProfile - Optional user profile for contact info header
 */
export function exportResumeToPDF(
  draft: ResumeDraft,
  userProfile?: { full_name?: string; email?: string; phone?: string }
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

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
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * LINE_HEIGHT;
  };

  // Helper: Add section header
  const addSectionHeader = (title: string, y: number): number => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), MARGIN, y);

    // Underline
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);

    doc.setFont("helvetica", "normal");
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
    doc.setFont("helvetica", "bold");
    doc.text(userProfile.full_name, MARGIN, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
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
      doc.setFont("helvetica", "bold");
      const jobTitle = exp.role || "Position";
      doc.text(jobTitle, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      doc.setFont("helvetica", "normal");
      const companyLine = [exp.company, exp.dates].filter(Boolean).join(" | ");
      if (companyLine) {
        doc.text(companyLine, MARGIN, currentY);
        currentY += LINE_HEIGHT;
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFontSize(10);
        exp.bullets.forEach((bullet) => {
          currentY = checkPageBreak(12);

          // Bullet point symbol
          doc.text("•", MARGIN + BULLET_INDENT, currentY);

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
      doc.setFont("helvetica", "bold");
      doc.text(edu.degree, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      doc.setFont("helvetica", "normal");
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
          doc.text("•", MARGIN + BULLET_INDENT, currentY);
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
      doc.setFont("helvetica", "bold");
      const projectTitle = project.role
        ? `${project.name} — ${project.role}`
        : project.name;
      doc.text(projectTitle, MARGIN, currentY);
      currentY += LINE_HEIGHT;

      if (project.bullets && project.bullets.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        project.bullets.forEach((bullet) => {
          currentY = checkPageBreak(10);
          doc.text("•", MARGIN + BULLET_INDENT, currentY);
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

  // Generate filename
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const cleanName = draft.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const filename = `${cleanName}_${timestamp}.pdf`;

  // Save/download PDF
  doc.save(filename);
}
