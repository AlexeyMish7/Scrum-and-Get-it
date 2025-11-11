/**
 * VersionHistoryPanel - Resume Draft Version History
 *
 * WHAT: Displays version history with timeline and quick actions
 * WHY: Users can see all versions, compare, and restore previous versions
 *
 * Features:
 * - Timeline view of all versions
 * - Compare any two versions
 * - Restore previous version
 * - Version metadata (date, origin, number)
 * - Active version indicator
 */

import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  History as HistoryIcon,
  CompareArrows as CompareArrowsIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import {
  getVersionHistory,
  type ResumeDraftVersion,
} from "@shared/services/resumeVersionService";
import { VersionComparisonDialog } from "./VersionComparisonDialog";
import { useAuth } from "@shared/context/AuthContext";

interface VersionHistoryPanelProps {
  draftId: string;
  onVersionRestored?: (newVersionId: string) => void;
}

export function VersionHistoryPanel({
  draftId,
  onVersionRestored,
}: VersionHistoryPanelProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<ResumeDraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{
    v1: string;
    v2: string;
  } | null>(null);

  const loadVersions = async () => {
    if (!user?.id) return;

    setLoading(true);
    const result = await getVersionHistory(draftId, user.id);
    setVersions(result);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, user?.id]); // loadVersions is stable, deps are correct

  const handleCompare = (olderVersionId: string, newerVersionId: string) => {
    setCompareVersions({ v1: olderVersionId, v2: newerVersionId });
    setCompareDialogOpen(true);
  };

  const handleCompareWithPrevious = (index: number) => {
    if (index > 0) {
      handleCompare(versions[index - 1].id, versions[index].id);
    }
  };

  const handleRestore = (restoredVersionId: string) => {
    loadVersions(); // Reload version list
    if (onVersionRestored) {
      onVersionRestored(restoredVersionId);
    }
  };

  const getOriginColor = (origin: string) => {
    switch (origin) {
      case "ai_generation":
        return "primary";
      case "manual":
        return "default";
      case "restore":
        return "warning";
      case "auto_save":
        return "info";
      default:
        return "default";
    }
  };

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case "ai_generation":
        return "🤖";
      case "manual":
        return "✏️";
      case "restore":
        return "🔄";
      case "auto_save":
        return "💾";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading version history...
        </Typography>
      </Box>
    );
  }

  if (versions.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No version history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2} sx={{ p: 2 }}>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryIcon fontSize="small" />
          <Typography variant="subtitle2">
            Version History ({versions.length})
          </Typography>
        </Stack>

        <Divider />

        {/* Version Timeline */}
        <Stack spacing={2}>
          {versions.map((version, index) => {
            const isActive = version.is_active;
            const isFirst = index === 0;

            return (
              <Paper
                key={version.id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: isActive ? "action.selected" : "background.paper",
                  borderColor: isActive ? "primary.main" : "divider",
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                <Stack spacing={1}>
                  {/* Version Header */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: isActive ? 700 : 500 }}
                      >
                        v{version.version}
                      </Typography>
                      {isActive && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Active"
                          size="small"
                          color="primary"
                        />
                      )}
                      <Chip
                        label={`${getOriginIcon(version.origin_source)} ${
                          version.origin_source
                        }`}
                        size="small"
                        color={getOriginColor(version.origin_source)}
                      />
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      {!isFirst && (
                        <Tooltip title="Compare with previous">
                          <IconButton
                            size="small"
                            onClick={() => handleCompareWithPrevious(index)}
                          >
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!isActive && (
                        <Tooltip title="Restore this version">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCompare(
                                version.id,
                                versions[versions.length - 1].id
                              )
                            }
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>

                  {/* Version Details */}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(version.created_at).toLocaleString()}
                  </Typography>

                  {/* Template Info */}
                  {version.template_id && (
                    <Typography variant="caption" color="text.secondary">
                      Template: {version.template_id}
                    </Typography>
                  )}

                  {/* Quick Stats */}
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {version.content.summary && (
                      <Chip label="Summary" size="small" variant="outlined" />
                    )}
                    {version.content.skills &&
                      version.content.skills.length > 0 && (
                        <Chip
                          label={`${version.content.skills.length} Skills`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    {version.content.experience &&
                      version.content.experience.length > 0 && (
                        <Chip
                          label={`${version.content.experience.length} Experience`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    {version.content.education &&
                      version.content.education.length > 0 && (
                        <Chip
                          label={`${version.content.education.length} Education`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    {version.content.projects &&
                      version.content.projects.length > 0 && (
                        <Chip
                          label={`${version.content.projects.length} Projects`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Stack>

      {/* Comparison Dialog */}
      {compareVersions && (
        <VersionComparisonDialog
          open={compareDialogOpen}
          onClose={() => setCompareDialogOpen(false)}
          versionId1={compareVersions.v1}
          versionId2={compareVersions.v2}
          onRestore={handleRestore}
        />
      )}
    </Box>
  );
}
