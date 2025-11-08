import { Box, Typography, Chip, Divider, Stack, Paper } from "@mui/material";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";

/**
 * AIResumePreview
 * Renders a lightweight, readable preview of AI-generated resume content.
 * Inputs: content (ResumeArtifactContent | null)
 * Output: visual preview only; no side effects.
 */
export default function AIResumePreview({
  content,
  dense,
}: {
  content: ResumeArtifactContent | null | undefined;
  dense?: boolean;
}) {
  if (!content) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No AI output yet. Generate to preview here.
        </Typography>
      </Paper>
    );
  }

  const exp = content.sections?.experience ?? [];
  const skills = content.ordered_skills ?? [];
  const summary = content.summary ?? "";

  return (
    <Paper
      variant="outlined"
      sx={{ p: dense ? 1.5 : 2, overflow: "auto", maxHeight: 640 }}
    >
      {/* Summary */}
      {summary && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6">Summary</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {summary}
          </Typography>
        </Box>
      )}
      {/* Skills */}
      {!!skills.length && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6">Skills</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            {skills.map((s, i) => (
              <Chip key={`${s}-${i}`} label={s} size="small" />
            ))}
          </Stack>
        </Box>
      )}
      {/* Experience */}
      {!!exp.length && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6">Experience</Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            {exp.map((row, i) => (
              <Box key={i}>
                {(row.role || row.company || row.dates) && (
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {[row.role, row.company, row.dates]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                )}
                <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                  {(row.bullets ?? []).map((b, j) => (
                    <Typography component="li" key={j} variant="body2">
                      {b}
                    </Typography>
                  ))}
                </Stack>
                {i < exp.length - 1 && <Divider sx={{ mt: 1, opacity: 0.6 }} />}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
