/**
 * DocumentPreview
 *
 * Renders a preview of a document (resume or cover letter).
 * Used in the document review page to show the document being reviewed.
 */

import { Box, Typography, Stack, Divider, Chip } from "@mui/material";
import type {
  Document,
  ResumeContent,
  CoverLetterContent,
} from "../../types/document.types";

interface DocumentPreviewProps {
  document: Document;
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const isResume = document.type === "resume";
  const content = document.content;

  if (isResume) {
    return <ResumePreview content={content as ResumeContent} />;
  } else {
    return <CoverLetterPreview content={content as CoverLetterContent} />;
  }
}

// Resume preview component
function ResumePreview({ content }: { content: ResumeContent }) {
  if (!content) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="text.secondary">No content available</Typography>
      </Box>
    );
  }

  const { header, summary, experience, education, skills } = content;

  return (
    <Stack spacing={3}>
      {/* Header */}
      {header && (
        <Box textAlign="center">
          <Typography variant="h4" fontWeight="bold">
            {header.fullName}
          </Typography>
          {header.title && (
            <Typography variant="h6" color="primary">
              {header.title}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 1 }}
          >
            {header.email && (
              <Typography variant="body2">{header.email}</Typography>
            )}
            {header.phone && (
              <Typography variant="body2">{header.phone}</Typography>
            )}
            {header.location && (
              <Typography variant="body2">{header.location}</Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* Summary */}
      {summary?.enabled && summary.text && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Summary
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2">{summary.text}</Typography>
          {summary.highlights && summary.highlights.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              {summary.highlights.map((highlight, idx) => (
                <Chip key={idx} label={highlight} size="small" />
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Experience */}
      {experience?.enabled &&
        experience.items &&
        experience.items.length > 0 && (
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Experience
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={2}>
              {experience.items.map((job, idx) => (
                <Box key={idx}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.startDate} - {job.current ? "Present" : job.endDate}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="primary">
                    {job.company}
                    {job.location && ` • ${job.location}`}
                  </Typography>
                  {job.bullets && job.bullets.length > 0 && (
                    <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                      {job.bullets.map((bullet, bulletIdx) => (
                        <Typography
                          key={bulletIdx}
                          component="li"
                          variant="body2"
                          sx={{ mb: 0.5 }}
                        >
                          {bullet}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

      {/* Education */}
      {education?.enabled && education.items && education.items.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Education
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={2}>
            {education.items.map((edu, idx) => (
              <Box key={idx}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {edu.degree} in {edu.field}
                </Typography>
                <Typography variant="body2">
                  {edu.institution}
                  {edu.location && ` • ${edu.location}`}
                </Typography>
                {edu.graduationDate && (
                  <Typography variant="body2" color="text.secondary">
                    Graduated: {edu.graduationDate}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Skills */}
      {skills?.enabled && skills.categories && skills.categories.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Skills
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={1}>
            {skills.categories.map((category, idx) => (
              <Box key={idx}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {category.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mt: 0.5 }}
                >
                  {category.skills.map((skill, skillIdx) => (
                    <Chip
                      key={skillIdx}
                      label={skill.name}
                      size="small"
                      color={skill.highlighted ? "primary" : "default"}
                      variant={skill.highlighted ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

// Cover letter preview component
function CoverLetterPreview({ content }: { content: CoverLetterContent }) {
  if (!content) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="text.secondary">No content available</Typography>
      </Box>
    );
  }

  const { header, recipient, body, signature } = content;

  return (
    <Stack spacing={3}>
      {/* Header */}
      {header && (
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {header.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {header.email}
            {header.phone && ` • ${header.phone}`}
          </Typography>
          {header.date && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {new Date(header.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          )}
        </Box>
      )}

      {/* Recipient */}
      {recipient && (
        <Box>
          {recipient.name && (
            <Typography variant="body2">{recipient.name}</Typography>
          )}
          {recipient.title && (
            <Typography variant="body2">{recipient.title}</Typography>
          )}
          {recipient.company && (
            <Typography variant="body2">{recipient.company}</Typography>
          )}
          {recipient.address && (
            <Typography variant="body2">{recipient.address}</Typography>
          )}
        </Box>
      )}

      <Divider />

      {/* Body paragraphs */}
      {body && (
        <Box>
          {/* Opening */}
          {body.opening && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {body.opening}
            </Typography>
          )}

          {/* Body paragraph 1 */}
          {body.body1 && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {body.body1}
            </Typography>
          )}

          {/* Body paragraph 2 */}
          {body.body2 && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {body.body2}
            </Typography>
          )}

          {/* Body paragraph 3 */}
          {body.body3 && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {body.body3}
            </Typography>
          )}

          {/* Closing paragraph */}
          {body.closing && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {body.closing}
            </Typography>
          )}
        </Box>
      )}

      {/* Signature */}
      {signature && (
        <Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {signature.closing}
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {signature.name}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

export default DocumentPreview;
