import { Box, Chip, Stack, Typography } from "@mui/material";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";

/**
 * SkillsAnalysisPreview
 * Shows ordered skills plus emphasize/add suggestions from unified content.
 * Inputs: content (ResumeArtifactContent | null)
 * Output: visual chips grouped by category, with ordering numbers.
 */
export default function SkillsAnalysisPreview({
  content,
}: {
  content: ResumeArtifactContent | null | undefined;
}) {
  if (!content?.ordered_skills?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No skills data yet. Generate with skills optimization enabled.
      </Typography>
    );
  }
  const emphasize = content.emphasize_skills || [];
  const add = content.add_skills || [];
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Ordered Skills
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {content.ordered_skills.map((s, i) => (
            <Chip key={s} label={`${i + 1}. ${s}`} size="small" />
          ))}
        </Stack>
      </Box>
      {emphasize.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Emphasize
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {emphasize.map((s) => (
              <Chip key={s} label={s} color="success" size="small" />
            ))}
          </Stack>
        </Box>
      )}
      {add.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Suggested Adds
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {add.map((s) => (
              <Chip key={s} label={s} color="warning" size="small" />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
