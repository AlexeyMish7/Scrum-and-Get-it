/**
 * TemplatePreview - Visual preview of template layout with realistic content
 */

import { Box, Stack, Typography, Divider, Chip } from "@mui/material";
import type { Template, SectionConfig } from "../../types/template.types";

export interface TemplatePreviewProps {
  template: Template;
  compact?: boolean;
}

// Sample data for preview
const PREVIEW_DATA = {
  header: {
    name: "John Smith",
    title: "Software Engineer",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
  },
  summary:
    "Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code and user experience.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      dates: "2021 - Present",
      bullets: [
        "Led development of core platform features",
        "Improved performance by 40%",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartUp Inc",
      dates: "2019 - 2021",
      bullets: ["Built customer-facing dashboard", "Reduced load time by 60%"],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "State University",
      year: "2019",
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "AWS",
    "Docker",
    "Git",
  ],
  projects: [
    { name: "E-commerce Platform", tech: "React, Node.js" },
    { name: "Data Analytics Tool", tech: "Python, PostgreSQL" },
  ],
  certifications: ["AWS Solutions Architect", "Google Cloud Professional"],
  publications: ["Building Scalable Web Apps", "Modern JavaScript Patterns"],
  awards: ["Employee of the Year 2022", "Hackathon Winner 2020"],
};

/**
 * Render section content based on type
 */
function renderSectionContent(
  section: SectionConfig,
  compact: boolean
): JSX.Element {
  const fontSize = compact ? 5.5 : 9;
  const titleSize = compact ? 6.5 : 11;
  const headingSize = compact ? 7.5 : 13;

  switch (section.type) {
    case "header":
      return (
        <Box sx={{ textAlign: "center", py: compact ? 0.2 : 0.4 }}>
          <Typography
            sx={{
              fontSize: compact ? 9 : 16,
              fontWeight: 700,
              color: "text.primary",
              lineHeight: 1.1,
            }}
          >
            {PREVIEW_DATA.header.name}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? 6.5 : 11,
              color: "text.secondary",
              mt: compact ? 0.1 : 0.2,
              lineHeight: 1.1,
            }}
          >
            {PREVIEW_DATA.header.title}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? 5 : 8,
              color: "text.secondary",
              mt: compact ? 0.1 : 0.2,
              lineHeight: 1.1,
            }}
          >
            {PREVIEW_DATA.header.email} • {PREVIEW_DATA.header.phone}
          </Typography>
        </Box>
      );

    case "summary":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Typography
            sx={{
              fontSize,
              color: "text.secondary",
              lineHeight: 1.3,
            }}
          >
            {compact
              ? PREVIEW_DATA.summary.slice(0, 80) + "..."
              : PREVIEW_DATA.summary}
          </Typography>
        </Box>
      );

    case "experience":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.2 : 0.4,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Stack spacing={compact ? 0.25 : 0.4}>
            {PREVIEW_DATA.experience
              .slice(0, compact ? 1 : 2)
              .map((exp, idx) => (
                <Box key={idx}>
                  <Typography
                    sx={{
                      fontSize: titleSize,
                      fontWeight: 600,
                      lineHeight: 1.1,
                    }}
                  >
                    {exp.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: fontSize - 0.5,
                      color: "text.secondary",
                      lineHeight: 1.2,
                    }}
                  >
                    {exp.company} • {exp.dates}
                  </Typography>
                  {!compact && (
                    <Stack spacing={0.1} sx={{ mt: 0.15, pl: 0.5 }}>
                      {exp.bullets.slice(0, 2).map((bullet, bidx) => (
                        <Typography
                          key={bidx}
                          sx={{
                            fontSize: fontSize - 0.5,
                            lineHeight: 1.2,
                            color: "text.secondary",
                          }}
                        >
                          • {bullet}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
          </Stack>
        </Box>
      );

    case "education":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          {PREVIEW_DATA.education.map((edu, idx) => (
            <Box key={idx}>
              <Typography
                sx={{ fontSize: titleSize, fontWeight: 600, lineHeight: 1.1 }}
              >
                {edu.degree}
              </Typography>
              <Typography
                sx={{
                  fontSize: fontSize - 0.5,
                  color: "text.secondary",
                  lineHeight: 1.2,
                }}
              >
                {edu.school} • {edu.year}
              </Typography>
            </Box>
          ))}
        </Box>
      );

    case "skills":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.2 : 0.3,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: compact ? 0.25 : 0.35,
            }}
          >
            {PREVIEW_DATA.skills.slice(0, compact ? 5 : 8).map((skill, idx) => (
              <Chip
                key={idx}
                label={skill}
                size="small"
                sx={{
                  height: compact ? 12 : 18,
                  fontSize: compact ? 5.5 : 8,
                  "& .MuiChip-label": {
                    px: compact ? 0.4 : 0.6,
                    py: 0,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      );

    case "projects":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Stack spacing={compact ? 0.2 : 0.3}>
            {PREVIEW_DATA.projects
              .slice(0, compact ? 1 : 2)
              .map((proj, idx) => (
                <Box key={idx}>
                  <Typography
                    sx={{
                      fontSize: titleSize,
                      fontWeight: 600,
                      lineHeight: 1.1,
                    }}
                  >
                    {proj.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: fontSize - 0.5,
                      color: "text.secondary",
                      lineHeight: 1.2,
                    }}
                  >
                    {proj.tech}
                  </Typography>
                </Box>
              ))}
          </Stack>
        </Box>
      );

    case "certifications":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Stack spacing={compact ? 0.1 : 0.15}>
            {PREVIEW_DATA.certifications
              .slice(0, compact ? 1 : 2)
              .map((cert, idx) => (
                <Typography key={idx} sx={{ fontSize, lineHeight: 1.2 }}>
                  • {cert}
                </Typography>
              ))}
          </Stack>
        </Box>
      );

    case "publications":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Stack spacing={compact ? 0.1 : 0.15}>
            {PREVIEW_DATA.publications
              .slice(0, compact ? 1 : 2)
              .map((pub, idx) => (
                <Typography key={idx} sx={{ fontSize, lineHeight: 1.2 }}>
                  • {pub}
                </Typography>
              ))}
          </Stack>
        </Box>
      );

    case "awards":
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              mb: compact ? 0.15 : 0.25,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
          <Stack spacing={compact ? 0.1 : 0.15}>
            {PREVIEW_DATA.awards.slice(0, compact ? 1 : 2).map((award, idx) => (
              <Typography key={idx} sx={{ fontSize, lineHeight: 1.2 }}>
                • {award}
              </Typography>
            ))}
          </Stack>
        </Box>
      );

    default:
      return (
        <Box>
          <Typography
            sx={{
              fontSize: headingSize,
              fontWeight: 600,
              color: "text.primary",
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {section.name}
          </Typography>
        </Box>
      );
  }
}

/**
 * Generate visual preview of template structure
 * Shows realistic content based on section types
 */
export function TemplatePreview({
  template,
  compact = false,
}: TemplatePreviewProps) {
  const isMultiColumn = template.layout.columns === 2;
  const sections = template.layout.sectionOrder || [];

  // Limit sections shown based on template and mode
  const maxSections = compact ? (isMultiColumn ? 6 : 5) : isMultiColumn ? 8 : 7;
  const visibleSections = sections.slice(0, maxSections);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        p: compact ? 0.5 : 1.5,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          maxWidth: compact ? 220 : 450,
          maxHeight: compact ? 280 : 600,
          bgcolor: "#ffffff",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: compact
            ? "0 1px 3px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.15)",
          p: compact ? 0.8 : 1.5,
          borderRadius: 0.5,
          overflow: "auto",
          position: "relative",
          // Custom scrollbar
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "grey.300",
            borderRadius: "4px",
          },
        }}
      >
        <Stack spacing={compact ? 0.4 : 0.8}>
          {isMultiColumn ? (
            <>
              {/* Header spans full width in 2-column layout */}
              {visibleSections[0] &&
                renderSectionContent(visibleSections[0], compact)}

              {visibleSections.length > 1 && (
                <Divider sx={{ my: compact ? 0.2 : 0.4 }} />
              )}

              {/* Two column layout */}
              <Box sx={{ display: "flex", gap: compact ? 0.6 : 1.2 }}>
                {/* Left column (sidebar) - typically skills, contact, etc. */}
                <Stack
                  spacing={compact ? 0.4 : 0.8}
                  sx={{ width: "35%", minWidth: 0 }}
                >
                  {visibleSections
                    .slice(1)
                    .filter((s, idx) => idx % 2 === 0 || (compact && idx < 2))
                    .map((section, idx) => (
                      <Box key={section.id || idx}>
                        {renderSectionContent(section, compact)}
                        {idx < 2 && (
                          <Divider sx={{ my: compact ? 0.2 : 0.4 }} />
                        )}
                      </Box>
                    ))}
                </Stack>

                {/* Divider between columns */}
                <Divider orientation="vertical" flexItem />

                {/* Right column (main content) - typically experience, education */}
                <Stack
                  spacing={compact ? 0.4 : 0.8}
                  sx={{ width: "62%", minWidth: 0 }}
                >
                  {visibleSections
                    .slice(1)
                    .filter((s, idx) => idx % 2 === 1 || (compact && idx >= 2))
                    .map((section, idx) => (
                      <Box key={section.id || idx}>
                        {renderSectionContent(section, compact)}
                        {idx < 2 && (
                          <Divider sx={{ my: compact ? 0.2 : 0.4 }} />
                        )}
                      </Box>
                    ))}
                </Stack>
              </Box>
            </>
          ) : (
            // Single column layout
            <>
              {visibleSections.map((section, idx) => (
                <Box key={section.id || idx}>
                  {renderSectionContent(section, compact)}
                  {idx < visibleSections.length - 1 && (
                    <Divider sx={{ my: compact ? 0.2 : 0.4 }} />
                  )}
                </Box>
              ))}
            </>
          )}
        </Stack>

        {/* Watermark/footer */}
        <Box
          sx={{
            position: "absolute",
            bottom: compact ? 3 : 6,
            right: compact ? 3 : 6,
            opacity: 0.2,
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              fontSize: compact ? 5 : 7,
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            {template.subtype}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
