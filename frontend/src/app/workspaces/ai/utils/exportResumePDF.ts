/**
 * Resume PDF Export Utility - UPDATED WITH SECTION ORDERING
 *
 * WHAT: Generates professional PDF from resume draft content respecting user's section order
 * WHY: Users need exports that match their preview layout
 *
 * Key Update: Now renders sections in the order defined by metadata.sections
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

// PDF layout constants
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_SPACING = 8;
const BULLET_INDENT = 5;

interface ExportOptions {
  filename?: string;
  watermark?: boolean;
  visualStyle?: string;
}

interface VisualStyleConfig {
  bodyFont: "helvetica" | "times" | "courier";
  headerFont: "helvetica" | "times" | "courier";
  accentColor: [number, number, number];
  bulletStyle: string;
  sectionUnderline: boolean;
}

function getVisualStyleConfig(style?: string): VisualStyleConfig {
  const normalizedStyle = (style || "modern").toLowerCase();

  switch (normalizedStyle) {
    case "classic":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [0, 0, 0],
        bulletStyle: "•",
        sectionUnderline: true,
      };
    case "minimal":
      return {
        bodyFont: "helvetica",
        headerFont: "helvetica",
        accentColor: [100, 100, 100],
        bulletStyle: "-",
        sectionUnderline: false,
      };
    case "creative":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [128, 0, 128],
        bulletStyle: "*",
        sectionUnderline: true,
      };
    case "academic":
      return {
        bodyFont: "times",
        headerFont: "times",
        accentColor: [0, 0, 0],
        bulletStyle: "•",
        sectionUnderline: true,
      };
    case "modern":
    default:
      return {
        bodyFont: "helvetica",
        headerFont: "helvetica",
        accentColor: [0, 102, 204],
        bulletStyle: "•",
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

  const visualConfig = getVisualStyleConfig(options?.visualStyle);
  let currentY = MARGIN;

  // Helper: Add wrapped text
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number
  ): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * LINE_HEIGHT;
  };

  // Helper: Add section header
  const addSectionHeader = (title: string, y: number): number => {
    doc.setFontSize(12);
    doc.setFont(visualConfig.headerFont, "bold");
    doc.setTextColor(...visualConfig.accentColor);
    doc.text(title, MARGIN, y);

    if (visualConfig.sectionUnderline) {
      doc.setDrawColor(...visualConfig.accentColor);
      doc.line(MARGIN, y + 1, MARGIN + CONTENT_WIDTH, y + 1);
    }

    doc.setFont(visualConfig.bodyFont, "normal");
    doc.setTextColor(0, 0, 0);
    return y + SECTION_SPACING;
  };

  // Helper: Check page break
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

  // === RENDER SECTIONS IN USER-DEFINED ORDER ===
  const visibleSections = draft.metadata.sections
    ?.filter((s) => s.visible)
    .map((s) => s.type) || [
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
  ];

  visibleSections.forEach((sectionType) => {
    switch (sectionType) {
      case "summary":
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
        break;

      case "skills":
        if (draft.content.skills && draft.content.skills.length > 0) {
          currentY = checkPageBreak(20);
          currentY = addSectionHeader("Technical Skills", currentY);
          const skillsText = draft.content.skills.join(" • ");
          currentY = addText(skillsText, MARGIN, currentY, CONTENT_WIDTH, 10);
          currentY += SECTION_SPACING;
        }
        break;

      case "experience":
        if (draft.content.experience && draft.content.experience.length > 0) {
          currentY = checkPageBreak(40);
          currentY = addSectionHeader("Professional Experience", currentY);

          draft.content.experience.forEach((exp, idx) => {
            currentY = checkPageBreak(25);

            doc.setFontSize(11);
            doc.setFont(visualConfig.headerFont, "bold");
            const jobTitle = exp.role || "Position";
            doc.text(jobTitle, MARGIN, currentY);
            currentY += LINE_HEIGHT;

            doc.setFont(visualConfig.bodyFont, "normal");
            const companyLine = [exp.company, exp.dates]
              .filter(Boolean)
              .join(" | ");
            if (companyLine) {
              doc.text(companyLine, MARGIN, currentY);
              currentY += LINE_HEIGHT;
            }

            if (exp.bullets && exp.bullets.length > 0) {
              doc.setFontSize(10);
              exp.bullets.forEach((bullet) => {
                currentY = checkPageBreak(12);
                doc.text(
                  visualConfig.bulletStyle,
                  MARGIN + BULLET_INDENT,
                  currentY
                );
                const bulletLines = doc.splitTextToSize(
                  bullet,
                  CONTENT_WIDTH - BULLET_INDENT - 3
                );
                doc.text(bulletLines, MARGIN + BULLET_INDENT + 3, currentY);
                currentY += bulletLines.length * LINE_HEIGHT;
              });
            }

            if (idx < (draft.content.experience?.length || 0) - 1) {
              currentY += 4;
            }
          });

          currentY += SECTION_SPACING;
        }
        break;

      case "education":
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

            if (edu.details && edu.details.length > 0) {
              doc.setFontSize(10);
              edu.details.forEach((detail) => {
                currentY = checkPageBreak(10);
                doc.text(
                  visualConfig.bulletStyle,
                  MARGIN + BULLET_INDENT,
                  currentY
                );
                const detailLines = doc.splitTextToSize(
                  detail,
                  CONTENT_WIDTH - BULLET_INDENT - 3
                );
                doc.text(detailLines, MARGIN + BULLET_INDENT + 3, currentY);
                currentY += detailLines.length * LINE_HEIGHT;
              });
            }

            if (idx < (draft.content.education?.length || 0) - 1) {
              currentY += 4;
            }
          });

          currentY += SECTION_SPACING;
        }
        break;

      case "projects":
        if (draft.content.projects && draft.content.projects.length > 0) {
          currentY = checkPageBreak(30);
          currentY = addSectionHeader("Projects", currentY);

          draft.content.projects.forEach((proj, idx) => {
            currentY = checkPageBreak(15);

            doc.setFontSize(11);
            doc.setFont(visualConfig.headerFont, "bold");
            doc.text(proj.name, MARGIN, currentY);
            currentY += LINE_HEIGHT;

            if (proj.role) {
              doc.setFont(visualConfig.bodyFont, "normal");
              doc.text(proj.role, MARGIN, currentY);
              currentY += LINE_HEIGHT;
            }

            if (proj.bullets && proj.bullets.length > 0) {
              doc.setFontSize(10);
              proj.bullets.forEach((bullet) => {
                currentY = checkPageBreak(10);
                doc.text(
                  visualConfig.bulletStyle,
                  MARGIN + BULLET_INDENT,
                  currentY
                );
                const bulletLines = doc.splitTextToSize(
                  bullet,
                  CONTENT_WIDTH - BULLET_INDENT - 3
                );
                doc.text(bulletLines, MARGIN + BULLET_INDENT + 3, currentY);
                currentY += bulletLines.length * LINE_HEIGHT;
              });
            }

            if (idx < (draft.content.projects?.length || 0) - 1) {
              currentY += 4;
            }
          });

          currentY += SECTION_SPACING;
        }
        break;
    }
  });

  // Save PDF
  const filename =
    options?.filename || `${draft.name.replace(/\s+/g, "_")}_Resume.pdf`;
  doc.save(filename);
}
