/**
 * VERSION COMPARISON VIEW
 * Side-by-side comparison of two document versions with diff highlighting.
 */

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import {
  Add as AddedIcon,
  Remove as RemovedIcon,
  Edit as ModifiedIcon,
  Check as UnchangedIcon,
} from "@mui/icons-material";
import type { VersionComparison } from "../../types/version.types";

/**
 * VersionComparisonView Props
 */
interface VersionComparisonViewProps {
  /** Comparison data */
  comparison: VersionComparison;
}

/**
 * VersionComparisonView Component
 *
 * Inputs:
 * - comparison: VersionComparison object with diff and summary
 *
 * Outputs:
 * - Side-by-side view of versions with highlighted differences
 */
export const VersionComparisonView: React.FC<VersionComparisonViewProps> = ({
  comparison,
}) => {
  const { versionA, versionB, diff, summary } = comparison;

  /**
   * Get diff type icon
   */
  const getDiffIcon = (
    type: "added" | "removed" | "modified" | "unchanged"
  ) => {
    switch (type) {
      case "added":
        return <AddedIcon fontSize="small" color="success" />;
      case "removed":
        return <RemovedIcon fontSize="small" color="error" />;
      case "modified":
        return <ModifiedIcon fontSize="small" color="warning" />;
      case "unchanged":
        return <UnchangedIcon fontSize="small" color="disabled" />;
    }
  };

  /**
   * Get diff type color
   */
  const getDiffColor = (
    type: "added" | "removed" | "modified" | "unchanged"
  ) => {
    switch (type) {
      case "added":
        return "rgba(76, 175, 80, 0.1)";
      case "removed":
        return "rgba(244, 67, 54, 0.1)";
      case "modified":
        return "rgba(255, 152, 0, 0.1)";
      case "unchanged":
        return "transparent";
    }
  };

  return (
    <Box>
      {/* Comparison Header */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Version A (Older)
            </Typography>
            <Typography variant="h6">{versionA.metadata.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(versionA.stats.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Version B (Newer)
            </Typography>
            <Typography variant="h6">{versionB.metadata.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(versionB.stats.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Summary Stats */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip
            label={`${summary.sectionsAdded} Added`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${summary.sectionsRemoved} Removed`}
            size="small"
            color="error"
            variant="outlined"
          />
          <Chip
            label={`${summary.sectionsModified} Modified`}
            size="small"
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`${summary.similarityScore}% Similar`}
            size="small"
            color="info"
            variant="outlined"
          />
          {summary.charDifference !== 0 && (
            <Chip
              label={`${summary.charDifference > 0 ? "+" : ""}${
                summary.charDifference
              } chars`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Template/Theme Changes */}
        {(diff.templateChanged || diff.themeChanged) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {diff.templateChanged && "Template changed. "}
            {diff.themeChanged && "Theme changed. "}
          </Alert>
        )}
      </Paper>

      {/* Section Comparisons */}
      <Stack spacing={2}>
        {diff.sections.map((section, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              bgcolor: getDiffColor(section.type),
              border: section.type !== "unchanged" ? 2 : 1,
              borderColor:
                section.type === "added"
                  ? "success.main"
                  : section.type === "removed"
                  ? "error.main"
                  : section.type === "modified"
                  ? "warning.main"
                  : "divider",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                {getDiffIcon(section.type)}
                <Typography variant="subtitle2" fontWeight={600}>
                  {section.name}
                </Typography>
                <Chip label={section.type} size="small" variant="outlined" />
              </Stack>

              {section.type !== "unchanged" && (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  {/* Version A Content */}
                  {section.contentA !== undefined && (
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          gutterBottom
                        >
                          Version A
                        </Typography>
                        <Typography variant="body2">
                          {JSON.stringify(section.contentA, null, 2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Version B Content */}
                  {section.contentB !== undefined && (
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          gutterBottom
                        >
                          Version B
                        </Typography>
                        <Typography variant="body2">
                          {JSON.stringify(section.contentB, null, 2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Empty state */}
      {diff.sections.length === 0 && (
        <Alert severity="info">
          No section differences found between these versions.
        </Alert>
      )}
    </Box>
  );
};
