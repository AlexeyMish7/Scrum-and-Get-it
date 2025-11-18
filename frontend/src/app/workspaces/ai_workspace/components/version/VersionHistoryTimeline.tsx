/**
 * VERSION HISTORY TIMELINE
 * Displays a visual timeline of document versions with filtering and search.
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  AutoAwesome as AIIcon,
  Edit as EditIcon,
  Description as TemplateIcon,
  Palette as ThemeIcon,
  Merge as MergeIcon,
  Restore as RestoreIcon,
  Upload as ImportIcon,
  MoreVert as MoreIcon,
  PushPin as PinIcon,
  Archive as ArchiveIcon,
  Visibility as ViewIcon,
  Compare as CompareIcon,
} from "@mui/icons-material";
import type { DocumentVersion, ChangeType } from "../../types/version.types";

/**
 * Change type icon mapping
 */
const CHANGE_TYPE_ICONS: Record<ChangeType, React.ReactElement> = {
  "ai-generated": <AIIcon fontSize="small" />,
  "manual-edit": <EditIcon fontSize="small" />,
  "template-change": <TemplateIcon fontSize="small" />,
  "theme-change": <ThemeIcon fontSize="small" />,
  merge: <MergeIcon fontSize="small" />,
  restore: <RestoreIcon fontSize="small" />,
  import: <ImportIcon fontSize="small" />,
};

/**
 * Change type color mapping
 */
const CHANGE_TYPE_COLORS: Record<
  ChangeType,
  "primary" | "secondary" | "success" | "warning" | "error" | "info" | "grey"
> = {
  "ai-generated": "primary",
  "manual-edit": "secondary",
  "template-change": "info",
  "theme-change": "info",
  merge: "success",
  restore: "warning",
  import: "grey",
};

/**
 * VersionHistoryTimeline Props
 */
interface VersionHistoryTimelineProps {
  /** Array of versions to display */
  versions: DocumentVersion[];

  /** Currently selected version ID */
  selectedVersionId?: string;

  /** Version selection handler */
  onSelectVersion?: (version: DocumentVersion) => void;

  /** Version action handlers */
  onViewVersion?: (version: DocumentVersion) => void;
  onCompareVersion?: (version: DocumentVersion) => void;
  onRestoreVersion?: (version: DocumentVersion) => void;
  onPinVersion?: (version: DocumentVersion) => void;
  onArchiveVersion?: (version: DocumentVersion) => void;
}

/**
 * VersionHistoryTimeline Component
 *
 * Inputs:
 * - versions: Array of DocumentVersion objects
 * - selectedVersionId: ID of currently selected version
 * - Action handlers for version operations
 *
 * Outputs:
 * - Visual timeline of versions
 * - Calls action handlers when user interacts
 */
export const VersionHistoryTimeline: React.FC<VersionHistoryTimelineProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  onViewVersion,
  onCompareVersion,
  onRestoreVersion,
  onPinVersion,
  onArchiveVersion,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuVersion, setMenuVersion] = useState<DocumentVersion | null>(null);

  /**
   * Open version action menu
   */
  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    version: DocumentVersion
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuVersion(version);
  };

  /**
   * Close version action menu
   */
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuVersion(null);
  };

  /**
   * Handle menu action
   */
  const handleMenuAction = (
    action: "view" | "compare" | "restore" | "pin" | "archive"
  ) => {
    if (!menuVersion) return;

    switch (action) {
      case "view":
        onViewVersion?.(menuVersion);
        break;
      case "compare":
        onCompareVersion?.(menuVersion);
        break;
      case "restore":
        onRestoreVersion?.(menuVersion);
        break;
      case "pin":
        onPinVersion?.(menuVersion);
        break;
      case "archive":
        onArchiveVersion?.(menuVersion);
        break;
    }

    handleCloseMenu();
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (versions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          No versions found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Timeline position="right">
        {versions.map((version, index) => {
          const isSelected = version.id === selectedVersionId;
          const isLatest = index === 0;
          const icon = CHANGE_TYPE_ICONS[version.changes.changeType];
          const color = CHANGE_TYPE_COLORS[version.changes.changeType];

          return (
            <TimelineItem key={version.id}>
              <TimelineOppositeContent
                sx={{ flex: 0.2, py: 2 }}
                color="text.secondary"
                variant="caption"
              >
                {formatRelativeTime(version.stats.createdAt)}
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot
                  color={color}
                  variant={isSelected ? "filled" : "outlined"}
                >
                  {icon}
                </TimelineDot>
                {index < versions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent sx={{ py: 1, px: 2 }}>
                <Paper
                  elevation={isSelected ? 3 : 0}
                  variant={isSelected ? "elevation" : "outlined"}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? "primary.main" : "divider",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => onSelectVersion?.(version)}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {version.metadata.name}
                        </Typography>
                        {isLatest && (
                          <Chip label="Latest" size="small" color="success" />
                        )}
                        {version.isPinned && (
                          <Tooltip title="Pinned">
                            <PinIcon fontSize="small" color="warning" />
                          </Tooltip>
                        )}
                      </Stack>

                      {version.metadata.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {version.metadata.description}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          label={version.changes.changeType}
                          size="small"
                          variant="outlined"
                          color={color === "grey" ? "default" : color}
                        />
                        {version.metadata.tags.map((tag: string) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        {version.changes.changesSummary}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, version)}
                      sx={{ ml: 1 }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  {version.lineage.branchName && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Branch: ${version.lineage.branchName}`}
                        size="small"
                        variant="filled"
                        sx={{
                          bgcolor: version.metadata.color || "primary.main",
                          color: "white",
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>

      {/* Version action menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleMenuAction("view")}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Version
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("compare")}>
          <CompareIcon fontSize="small" sx={{ mr: 1 }} />
          Compare
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("restore")}>
          <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
          Restore
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("pin")}>
          <PinIcon fontSize="small" sx={{ mr: 1 }} />
          {menuVersion?.isPinned ? "Unpin" : "Pin"}
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("archive")}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
      </Menu>
    </Box>
  );
};
