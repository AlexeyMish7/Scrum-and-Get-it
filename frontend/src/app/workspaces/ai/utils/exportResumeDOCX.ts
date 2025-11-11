/**
 * exportResumeDOCX - Word Document Resume Export
 *
 * WHAT: Generates professional .docx resume from draft data
 * WHY: Many ATS systems and employers require Word format submissions
 *
 * Inputs:
 * - draft: ResumeDraft object with all sections
 * - userProfile: optional contact info (name, email, phone)
 *
 * Output: Downloads .docx file with formatted resume
 *
 * Features:
 * - Professional formatting with proper spacing
 * - Section headers with bold styling
 * - Bullet points for experience/skills/projects
 * - Contact information header
 * - Custom filename with date stamp
 *
 * Error modes: Missing draft data handled gracefully with defaults
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import type { ResumeDraft } from "@workspaces/ai/hooks/useResumeDraftsV2";

// Type for user profile information
interface UserProfile {
  full_name?: string;
  email?: string;
  phone?: string;
}

/**
 * Export resume draft as Word document (.docx)
 *
 * Inputs:
 * - draft: Resume draft with content sections
 * - userProfile: Optional user contact information
 *
 * Output: Triggers browser download of .docx file
 *
 * Error handling: Logs errors but doesn't throw, provides user feedback
 */
export function exportResumeToDOCX(
  draft: ResumeDraft,
  userProfile?: UserProfile
): void {
  try {
    const sections: Paragraph[] = [];

    // ========================================================================
    // HEADER SECTION: Contact Information
    // ========================================================================
    if (userProfile?.full_name || userProfile?.email || userProfile?.phone) {
      // Name (centered, large, bold)
      if (userProfile.full_name) {
        sections.push(
          new Paragraph({
            text: userProfile.full_name,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }

      // Contact info (centered, smaller)
      const contactParts: string[] = [];
      if (userProfile.email) contactParts.push(userProfile.email);
      if (userProfile.phone) contactParts.push(userProfile.phone);

      if (contactParts.length > 0) {
        sections.push(
          new Paragraph({
            text: contactParts.join(" • "),
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }

      // Separator line
      sections.push(
        new Paragraph({
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 200 },
        })
      );
    }

    // ========================================================================
    // SUMMARY SECTION
    // ========================================================================
    if (draft.content.summary) {
      sections.push(
        new Paragraph({
          text: "PROFESSIONAL SUMMARY",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );

      sections.push(
        new Paragraph({
          text: draft.content.summary,
          spacing: { after: 200 },
        })
      );
    }

    // ========================================================================
    // SKILLS SECTION
    // ========================================================================
    if (draft.content.skills && draft.content.skills.length > 0) {
      sections.push(
        new Paragraph({
          text: "SKILLS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );

      sections.push(
        new Paragraph({
          text: draft.content.skills.join(" • "),
          spacing: { after: 200 },
        })
      );
    }

    // ========================================================================
    // EXPERIENCE SECTION
    // ========================================================================
    if (draft.content.experience && draft.content.experience.length > 0) {
      sections.push(
        new Paragraph({
          text: "PROFESSIONAL EXPERIENCE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );

      draft.content.experience.forEach((exp, index: number) => {
        // Job title and company (bold)
        const titleCompany = `${exp.role || "Position"} - ${
          exp.company || "Company"
        }`;
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: titleCompany,
                bold: true,
              }),
            ],
            spacing: { before: index > 0 ? 150 : 0, after: 50 },
          })
        );

        // Dates (if available)
        if (exp.dates) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.dates,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        // Bullet points
        exp.bullets.forEach((bullet: string) => {
          sections.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });

        // Add spacing after each role
        if (index < draft.content.experience!.length - 1) {
          sections.push(
            new Paragraph({
              text: "",
              spacing: { after: 100 },
            })
          );
        }
      });

      sections.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // ========================================================================
    // EDUCATION SECTION
    // ========================================================================
    if (draft.content.education && draft.content.education.length > 0) {
      sections.push(
        new Paragraph({
          text: "EDUCATION",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );

      draft.content.education.forEach((edu, index: number) => {
        // Degree and institution (bold)
        const degreeInfo = `${edu.degree} - ${edu.institution}`;
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: degreeInfo,
                bold: true,
              }),
            ],
            spacing: { before: index > 0 ? 150 : 0, after: 50 },
          })
        );

        // Graduation date (if available)
        if (edu.graduation_date) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: edu.graduation_date,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        // Details (if available)
        if (edu.details && edu.details.length > 0) {
          edu.details.forEach((detail: string) => {
            sections.push(
              new Paragraph({
                text: detail,
                bullet: { level: 0 },
                spacing: { after: 50 },
              })
            );
          });
        }
      });

      sections.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // ========================================================================
    // PROJECTS SECTION
    // ========================================================================
    if (draft.content.projects && draft.content.projects.length > 0) {
      sections.push(
        new Paragraph({
          text: "PROJECTS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );

      draft.content.projects.forEach((project, index: number) => {
        // Project name and role (bold)
        const projectInfo = project.role
          ? `${project.name} - ${project.role}`
          : project.name;

        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: projectInfo,
                bold: true,
              }),
            ],
            spacing: { before: index > 0 ? 150 : 0, after: 50 },
          })
        );

        // Bullet points (if available)
        if (project.bullets && project.bullets.length > 0) {
          project.bullets.forEach((bullet: string) => {
            sections.push(
              new Paragraph({
                text: bullet,
                bullet: { level: 0 },
                spacing: { after: 50 },
              })
            );
          });
        }
      });
    }

    // ========================================================================
    // CREATE DOCUMENT
    // ========================================================================
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
              },
            },
          },
          children: sections,
        },
      ],
    });

    // ========================================================================
    // GENERATE FILENAME AND SAVE
    // ========================================================================
    const cleanName = draft.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .substring(0, 50);
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `${cleanName}_${dateStr}.docx`;

    // Convert document to blob and trigger download
    import("docx").then((docxModule) => {
      docxModule.Packer.toBlob(doc).then((blob) => {
        saveAs(blob, filename);
        console.log(`✓ DOCX exported: ${filename}`);
      });
    });
  } catch (error) {
    console.error("Error exporting DOCX:", error);
    throw error;
  }
}
