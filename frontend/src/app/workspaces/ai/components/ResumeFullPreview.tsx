import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Paper,
  Skeleton,
} from "@mui/material";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import { toPreviewModel } from "@workspaces/ai/utils/previewModel";

/**
 * ResumeFullPreview
 * WHAT: Comprehensive renderer for a resume artifact (AI or draft) for screen & print.
 * WHY: Centralize layout logic; future export (PDF/DOCX) can reuse this structure.
 * INPUTS: content (ResumeArtifactContent), optional dense & hideSections toggles.
 * OUTPUT: Pure visual JSX; no side effects.
 */
export interface ResumeFullPreviewProps {
  content: ResumeArtifactContent | null | undefined;
  dense?: boolean;
  hideSections?: Partial<{
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    projects: boolean;
  }>;
  headerTitle?: string; // optional heading override
  /** When true, show placeholder chips for skills while optimization runs */
  loadingSkills?: boolean;
  /** When true, show subtle updating badge on experience while tailoring runs */
  loadingExperience?: boolean;
  /** Highlight bullets newly added in the latest update */
  newBullets?: Set<string>;
}

export default function ResumeFullPreview({
  content,
  dense,
  hideSections,
  headerTitle,
  loadingSkills,
  loadingExperience,
  newBullets,
}: ResumeFullPreviewProps) {
  const model = toPreviewModel(content);
  const radius = 8;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: dense ? 1.5 : 2,
        borderRadius: (theme) => theme.shape.borderRadius ?? radius,
        fontSize: 14,
        lineHeight: 1.4,
        maxHeight: { xs: 560, md: 720 },
        overflow: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? theme.palette.background.default
            : "#ffffff",
        color: (theme) => theme.palette.text.primary,
        "@media print": {
          boxShadow: "none",
          border: "none",
          maxHeight: "unset",
          overflow: "visible",
        },
      }}
      role="document"
      aria-labelledby={headerTitle ? "resume-preview-title" : undefined}
    >
      {!content && (
        <Typography color="text.secondary">
          No resume content yet. Generate or select a version to preview.
        </Typography>
      )}
      {content && (
        <Stack spacing={dense ? 1.25 : 1.75}>
          {/* Header */}
          {headerTitle && (
            <Typography id="resume-preview-title" variant="h6" sx={{ mb: 0.5 }}>
              {headerTitle}
            </Typography>
          )}
          {/* Summary */}
          {!hideSections?.summary && model.summary && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Summary
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap" }}
                data-preview-section="summary"
              >
                {model.summary}
              </Typography>
            </Box>
          )}
          {/* Skills */}
          {!hideSections?.skills &&
            ((model.skills?.length ?? 0) > 0 || loadingSkills) && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Skills
                </Typography>
                {loadingSkills && !(model.skills && model.skills.length > 0) ? (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        variant="rounded"
                        width={80}
                        height={24}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {(model.skills || []).map((s, i) => (
                      <Chip
                        key={`${s}-${i}`}
                        label={s}
                        size="small"
                        data-preview-skill
                        color="default"
                        // Use filled variant in dark mode for better contrast, outlined otherwise
                        variant={
                          typeof window !== "undefined" &&
                          document.documentElement.classList.contains("dark")
                            ? "filled"
                            : "outlined"
                        }
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          {/* Experience */}
          {!hideSections?.experience && model.experience?.length && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Experience
                {loadingExperience && (
                  <Chip
                    size="small"
                    color="warning"
                    label="updating…"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Stack spacing={1.25} data-preview-section="experience">
                {model.experience.map((row, i) => (
                  <Box key={i} data-preview-role>
                    {(row.role || row.company || row.dates) && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {[row.role, row.company, row.dates]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    )}
                    <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                      {(row.bullets || []).map((b, j) => (
                        <Typography
                          component="li"
                          key={j}
                          variant="body2"
                          data-preview-bullet
                          sx={
                            newBullets?.has(b)
                              ? { color: "success.main", fontWeight: 600 }
                              : undefined
                          }
                        >
                          {b}
                          {newBullets?.has(b) && (
                            <Chip
                              size="small"
                              label="new"
                              color="success"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      ))}
                    </Stack>
                    {i < model.experience!.length - 1 && (
                      <Divider sx={{ mt: 1, opacity: 0.24 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {/* Education */}
          {!hideSections?.education && model.education?.length && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Education
              </Typography>
              <Stack spacing={1.25} data-preview-section="education">
                {model.education.map((row, i) => (
                  <Box key={i} data-preview-education>
                    {(row.institution || row.degree || row.graduation_date) && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {[row.institution, row.degree, row.graduation_date]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    )}
                    <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                      {(row.details || []).map((d, j) => (
                        <Typography component="li" key={j} variant="body2">
                          {d}
                        </Typography>
                      ))}
                    </Stack>
                    {i < model.education!.length - 1 && (
                      <Divider sx={{ mt: 1, opacity: 0.24 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {/* Projects */}
          {!hideSections?.projects && model.projects?.length && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Projects
              </Typography>
              <Stack spacing={1.25} data-preview-section="projects">
                {model.projects.map((row, i) => (
                  <Box key={i} data-preview-project>
                    {(row.name || row.role) && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {[row.name, row.role].filter(Boolean).join(" · ")}
                      </Typography>
                    )}
                    <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                      {(row.bullets || []).map((d, j) => (
                        <Typography component="li" key={j} variant="body2">
                          {d}
                        </Typography>
                      ))}
                    </Stack>
                    {i < model.projects!.length - 1 && (
                      <Divider sx={{ mt: 1, opacity: 0.24 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {/* ATS Keywords (if present) */}
          {model.ats_keywords?.length && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                ATS Keywords
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {model.ats_keywords.map((k, i) => (
                  <Chip
                    key={`${k}-${i}`}
                    label={k}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
