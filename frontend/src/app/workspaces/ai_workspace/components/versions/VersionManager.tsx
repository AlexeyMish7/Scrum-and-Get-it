/**
 * VersionManager Component
 *
 * Manages document versions with selection, comparison, and merge capabilities.
 */

import { useState, useEffect, Fragment, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Typography,
  Box,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Compare as CompareIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  name: string;
  description?: string;
  content: unknown;
  template_id: string;
  theme_id: string;
  change_type: string;
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  tags?: string[];
  parent_version_id?: string;
}

interface VersionManagerProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  currentVersionId?: string;
  onVersionSelect: (version: DocumentVersion) => void;
  onVersionRestore?: (version: DocumentVersion) => void;
}

export const VersionManager: React.FC<VersionManagerProps> = ({
  open,
  onClose,
  documentId,
  currentVersionId,
  onVersionSelect,
  onVersionRestore,
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userCrud = withUser(user!.id);
      const result = await userCrud.listRows<DocumentVersion>(
        "document_versions",
        "*",
        {
          eq: { document_id: documentId },
          order: { column: "version_number", ascending: false },
        }
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      setVersions(result.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [documentId, user]);

  // Load versions when dialog opens
  useEffect(() => {
    if (open && documentId && user?.id) {
      loadVersions();
    }
  }, [open, documentId, user?.id, loadVersions]);

  const handleVersionClick = (versionId: string) => {
    if (compareMode) {
      // Toggle version in compare selection
      setCompareVersions((prev) => {
        if (prev.includes(versionId)) {
          return prev.filter((id) => id !== versionId);
        } else if (prev.length < 2) {
          return [...prev, versionId];
        }
        return prev;
      });
    } else {
      setSelectedVersion(versionId);
    }
  };

  const handleLoadVersion = () => {
    const version = versions.find((v) => v.id === selectedVersion);
    if (version) {
      onVersionSelect(version);
      onClose();
    }
  };

  const handleRestoreVersion = () => {
    const version = versions.find((v) => v.id === selectedVersion);
    if (version && onVersionRestore) {
      onVersionRestore(version);
      onClose();
    }
  };

  const handleCompare = () => {
    if (compareVersions.length === 2) {
      // Open comparison view
      const version1 = versions.find((v) => v.id === compareVersions[0]);
      const version2 = versions.find((v) => v.id === compareVersions[1]);

      if (version1 && version2) {
        // TODO: Implement comparison dialog
      }
    }
  };

  const handleToggleStar = async (versionId: string) => {
    try {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;

      const userCrud = withUser(user!.id);
      await userCrud.updateRow(
        "document_versions",
        { is_starred: !version.is_starred },
        { eq: { id: versionId } }
      );

      // Update local state
      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionId ? { ...v, is_starred: !v.is_starred } : v
        )
      );
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to delete this version?")) {
      return;
    }

    try {
      const userCrud = withUser(user!.id);
      await userCrud.updateRow(
        "document_versions",
        { status: "deleted" },
        { eq: { id: versionId } }
      );

      // Remove from local state
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    } catch (err) {
      console.error("Failed to delete version:", err);
    }
  };

  const getChangeTypeColor = (
    changeType: string
  ): "primary" | "secondary" | "info" | "warning" | "success" | "default" => {
    switch (changeType) {
      case "ai-generated":
        return "primary";
      case "manual-edit":
        return "secondary";
      case "template-change":
        return "info";
      case "theme-change":
        return "warning";
      case "merge":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon />
            <Typography variant="h6">Version History</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Compare Mode Toggle */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant={compareMode ? "contained" : "outlined"}
            startIcon={<CompareIcon />}
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([]);
            }}
            size="small"
          >
            {compareMode ? "Exit Compare Mode" : "Compare Versions"}
          </Button>

          {compareMode && compareVersions.length === 2 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompare}
              size="small"
            >
              Compare Selected
            </Button>
          )}
        </Stack>

        {compareMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select 2 versions to compare ({compareVersions.length}/2 selected)
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {versions.map((version) => {
              const isSelected = compareMode
                ? compareVersions.includes(version.id)
                : selectedVersion === version.id;
              const isCurrent = version.id === currentVersionId;

              return (
                <Fragment key={version.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          onClick={() => handleToggleStar(version.id)}
                          size="small"
                        >
                          {version.is_starred ? (
                            <StarIcon color="warning" />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                        {!isCurrent && (
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteVersion(version.id)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Stack>
                    }
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => handleVersionClick(version.id)}
                    >
                      <ListItemText
                        primaryTypographyProps={{ component: "div" }}
                        secondaryTypographyProps={{ component: "div" }}
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="subtitle1">
                              {version.name}
                            </Typography>
                            {isCurrent && (
                              <Chip
                                label="Current"
                                size="small"
                                color="success"
                              />
                            )}
                            <Chip
                              label={version.change_type}
                              size="small"
                              color={getChangeTypeColor(version.change_type)}
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            {version.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {version.description}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Version {version.version_number} •{" "}
                              {new Date(version.created_at).toLocaleString()}
                            </Typography>
                            {version.tags && version.tags.length > 0 && (
                              <Stack direction="row" spacing={0.5}>
                                {version.tags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            )}
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </Fragment>
              );
            })}
          </List>
        )}

        {!loading && versions.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">No versions found</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {!compareMode && selectedVersion && (
          <>
            {onVersionRestore && selectedVersion !== currentVersionId && (
              <Button
                startIcon={<RestoreIcon />}
                onClick={handleRestoreVersion}
                color="warning"
              >
                Restore
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleLoadVersion}
            >
              Load Version
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
