/**
 * VersionComparisonDialog - Side-by-Side Version Comparison
 *
 * WHAT: Modal dialog for comparing two resume draft versions
 * WHY: Allows users to see what changed between versions before restoring
 *
 * Features:
 * - Side-by-side content display
 * - Highlighted differences
 * - Version metadata (version number, date, origin)
 * - Restore previous version button
 * - Responsive layout (stacks on mobile)
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Paper,
  Alert,
} from "@mui/material";
import {
  Restore as RestoreIcon,
  Close as CloseIcon,
  CompareArrows as CompareArrowsIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
  compareVersions,
  restoreVersion,
  type VersionComparison,
} from "@ai/services/resumeVersionService";
import { useAuth } from "@shared/context/AuthContext";

interface VersionComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  versionId1: string; // Older version
  versionId2: string; // Newer version
  onRestore?: (restoredVersionId: string) => void;
}

export function VersionComparisonDialog({
  open,
  onClose,
  versionId1,
  versionId2,
  onRestore,
}: VersionComparisonDialogProps) {
  const { user } = useAuth();
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadComparison = async () => {
    if (!user?.id) return;

    setLoading(true);
    const result = await compareVersions(versionId1, versionId2, user.id);
    setComparison(result);
    setLoading(false);
  };

  useEffect(() => {
    if (open && user?.id) {
      loadComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, versionId1, versionId2, user?.id]);

  const handleRestore = async () => {
    if (!user?.id || !comparison) return;

    setRestoring(true);
    const newVersionId = await restoreVersion(versionId1, user.id);
    setRestoring(false);

    if (newVersionId && onRestore) {
      onRestore(newVersionId);
      onClose();
    }
  };

  if (!comparison && !loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Version Comparison</DialogTitle>
        <DialogContent>
          <Alert severity="error">Failed to load version comparison</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <CompareArrowsIcon />
          <Typography variant="h6">Version Comparison</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Typography>Loading comparison...</Typography>
        ) : comparison ? (
          <Stack spacing={3}>
            {/* Version Headers */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Paper sx={{ flex: 1, p: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  Version {comparison.version1.version}
                </Typography>
                <Typography variant="body2">
                  {new Date(comparison.version1.created_at).toLocaleString()}
                </Typography>
                <Chip
                  label={comparison.version1.origin_source}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Paper>

              <Paper sx={{ flex: 1, p: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  Version {comparison.version2.version}
                </Typography>
                <Typography variant="body2">
                  {new Date(comparison.version2.created_at).toLocaleString()}
                </Typography>
                <Chip
                  label={comparison.version2.origin_source}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Stack>

            {/* Differences Summary */}
            {Object.keys(comparison.differences).length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {Object.keys(comparison.differences).length} section(s) changed
              </Alert>
            )}

            {/* Summary Comparison */}
            {comparison.differences.summary && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Summary
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Paper
                    variant="outlined"
                    sx={{
                      flex: 1,
                      p: 2,
                      bgcolor: "error.50",
                      borderColor: "error.main",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ fontWeight: 600 }}
                    >
                      Previous
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {comparison.differences.summary.old || "(empty)"}
                    </Typography>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      flex: 1,
                      p: 2,
                      bgcolor: "success.50",
                      borderColor: "success.main",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ fontWeight: 600 }}
                    >
                      Current
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {comparison.differences.summary.new || "(empty)"}
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* Skills Comparison */}
            {comparison.differences.skills && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Skills
                </Typography>
                <Stack spacing={1}>
                  {comparison.differences.skills.added.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AddCircleOutlineIcon fontSize="small" color="success" />
                      <Typography variant="body2">
                        Added: {comparison.differences.skills.added.join(", ")}
                      </Typography>
                    </Stack>
                  )}
                  {comparison.differences.skills.removed.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RemoveCircleOutlineIcon fontSize="small" color="error" />
                      <Typography variant="body2">
                        Removed:{" "}
                        {comparison.differences.skills.removed.join(", ")}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}

            {/* Experience Comparison */}
            {comparison.differences.experience && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Experience
                </Typography>
                <Stack direction="row" spacing={2}>
                  {comparison.differences.experience.added > 0 && (
                    <Chip
                      icon={<AddCircleOutlineIcon />}
                      label={`+${comparison.differences.experience.added}`}
                      color="success"
                      size="small"
                    />
                  )}
                  {comparison.differences.experience.removed > 0 && (
                    <Chip
                      icon={<RemoveCircleOutlineIcon />}
                      label={`-${comparison.differences.experience.removed}`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Education Comparison */}
            {comparison.differences.education && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Education
                </Typography>
                <Stack direction="row" spacing={2}>
                  {comparison.differences.education.added > 0 && (
                    <Chip
                      icon={<AddCircleOutlineIcon />}
                      label={`+${comparison.differences.education.added}`}
                      color="success"
                      size="small"
                    />
                  )}
                  {comparison.differences.education.removed > 0 && (
                    <Chip
                      icon={<RemoveCircleOutlineIcon />}
                      label={`-${comparison.differences.education.removed}`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Projects Comparison */}
            {comparison.differences.projects && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Projects
                </Typography>
                <Stack direction="row" spacing={2}>
                  {comparison.differences.projects.added > 0 && (
                    <Chip
                      icon={<AddCircleOutlineIcon />}
                      label={`+${comparison.differences.projects.added}`}
                      color="success"
                      size="small"
                    />
                  )}
                  {comparison.differences.projects.removed > 0 && (
                    <Chip
                      icon={<RemoveCircleOutlineIcon />}
                      label={`-${comparison.differences.projects.removed}`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            )}

            {Object.keys(comparison.differences).length === 0 && (
              <Alert severity="success">No differences found</Alert>
            )}
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
        {comparison && (
          <Button
            variant="contained"
            onClick={handleRestore}
            disabled={restoring}
            startIcon={<RestoreIcon />}
          >
            {restoring
              ? "Restoring..."
              : `Restore Version ${comparison.version1.version}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
