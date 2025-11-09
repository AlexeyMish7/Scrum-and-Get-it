/**
 * VersionManagerPanel
 * UC-052: Manage resume versions (duplicate, select, diff, merge).
 * Uses useResumeDrafts extended API for duplication, diffing, merging.
 * Simplified UI: left list of versions, right diff view comparing active draft vs selected.
 */
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import type {
  ResumeDraftDiff,
  MergeOptions,
} from "@workspaces/ai/hooks/useResumeDrafts";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

export default function VersionManagerPanel() {
  const {
    resumes,
    active,
    duplicateActive,
    diffDrafts,
    mergeDraftSections,
    setActive,
    deleteDraft,
    restoreDraft,
  } = useResumeDrafts();
  const { handleError, showSuccess } = useErrorHandler();

  const [compareId, setCompareId] = React.useState<string | null>(null);
  const [diff, setDiff] = React.useState<ResumeDraftDiff | null>(null);
  const [lastDeleted, setLastDeleted] = React.useState<
    null | import("@workspaces/ai/hooks/useResumeDrafts").ResumeDraftRecord
  >(null);
  const undoTimer = React.useRef<number | null>(null);

  // Merge selection toggles
  const [applySummary, setApplySummary] = React.useState(true);
  const [applySkillsAdded, setApplySkillsAdded] = React.useState(true);
  const [removeSkillsNotInSource, setRemoveSkillsNotInSource] =
    React.useState(false);
  const [mergeExperienceBullets, setMergeExperienceBullets] =
    React.useState(true);
  const [addMissingExperienceEntries, setAddMissingExperienceEntries] =
    React.useState(true);

  React.useEffect(() => {
    if (compareId && active?.id) {
      setDiff(diffDrafts(active.id, compareId));
    } else {
      setDiff(null);
    }
  }, [compareId, active?.id, diffDrafts]);

  function duplicateVersion() {
    const newId = duplicateActive();
    if (!newId) return handleError?.(new Error("No active draft to duplicate"));
    showSuccess("Draft duplicated");
  }

  function performMerge() {
    if (!active?.id || !compareId)
      return handleError?.(new Error("Select a version to compare"));
    const opts: MergeOptions = {
      applySummary: applySummary && !!diff?.summaryChanged,
      applySkillsAdded: applySkillsAdded,
      removeSkillsNotInSource,
      mergeExperienceBullets,
      addMissingExperienceEntries,
    };
    mergeDraftSections(compareId, active.id, opts);
    showSuccess("Merged selected changes into active draft");
  }

  function onDeleteDraft(id: string) {
    const target = resumes.find((r) => r.id === id) || null;
    if (!target) return;
    if (
      !window.confirm(
        `Delete draft "${target.name}"? This can be undone briefly.`
      )
    )
      return;
    deleteDraft(id);
    setLastDeleted(target);
    showSuccess("Draft deleted");
    // Start undo window (10s)
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setLastDeleted(null);
      undoTimer.current = null;
    }, 10000);
    // Clear compare if it was the deleted one
    if (compareId === id) setCompareId(null);
  }

  function onUndoDelete() {
    if (!lastDeleted) return;
    restoreDraft(lastDeleted);
    setLastDeleted(null);
    if (undoTimer.current) {
      window.clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    showSuccess("Draft restored");
  }

  // Filter out active from list for clarity
  const otherVersions = resumes.filter((r) => r.id !== active?.id);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Version Management</Typography>
          {!active && (
            <Typography color="text.secondary">
              Select or create a draft to enable versioning.
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={duplicateVersion}
              disabled={!active}
            >
              Duplicate Active
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (!compareId)
                  return handleError?.(new Error("Pick a version to compare"));
                setActive(compareId);
                setCompareId(null);
                showSuccess("Switched to selected version");
              }}
              disabled={!compareId}
            >
              Switch To Selected
            </Button>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Versions</Typography>
          {lastDeleted && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              sx={{ mb: 1 }}
            >
              <Chip color="warning" label={`Deleted: ${lastDeleted.name}`} />
              <Button size="small" variant="outlined" onClick={onUndoDelete}>
                Undo
              </Button>
            </Stack>
          )}
          <List
            dense
            sx={{
              maxHeight: 240,
              overflow: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            {otherVersions.length === 0 && (
              <Typography variant="body2" sx={{ p: 1 }} color="text.secondary">
                No other versions yet.
              </Typography>
            )}
            {otherVersions.map((v) => (
              <ListItemButton
                key={v.id}
                selected={v.id === compareId}
                onClick={() => setCompareId(v.id === compareId ? null : v.id)}
              >
                <ListItemText
                  primary={v.name}
                  secondary={
                    <>
                      <Typography variant="caption" component="span">
                        {new Date(v.createdAt).toLocaleString()}{" "}
                        {v.sourceVersionId
                          ? ` • from ${v.sourceVersionId.slice(-5)}`
                          : ""}
                      </Typography>
                    </>
                  }
                />
                {v.lastAppliedJobId && (
                  <Chip size="small" label={`Job ${v.lastAppliedJobId}`} />
                )}
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDraft(v.id);
                  }}
                  sx={{ ml: 1 }}
                >
                  Delete
                </Button>
              </ListItemButton>
            ))}
          </List>

          {diff && compareId && active && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Diff vs Active
              </Typography>
              {diff.summaryChanged && (
                <Chip
                  label="Summary differs"
                  color="primary"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              <Chip
                label={`Skills +${diff.skillsAdded.length} / -${diff.skillsRemoved.length}`}
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip
                label={`Exp +${diff.experienceAdded.length} / -${diff.experienceRemoved.length}`}
                sx={{ mr: 1, mb: 1 }}
              />
              {diff.experienceModified.length > 0 && (
                <Chip
                  label={`Exp modified ${diff.experienceModified.length}`}
                  sx={{ mr: 1, mb: 1 }}
                />
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Merge Options</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applySummary}
                        onChange={(e) => setApplySummary(e.target.checked)}
                      />
                    }
                    label="Apply summary from source"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applySkillsAdded}
                        onChange={(e) => setApplySkillsAdded(e.target.checked)}
                      />
                    }
                    label="Add skills present in source"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={removeSkillsNotInSource}
                        onChange={(e) =>
                          setRemoveSkillsNotInSource(e.target.checked)
                        }
                      />
                    }
                    label="Remove skills not in source"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={mergeExperienceBullets}
                        onChange={(e) =>
                          setMergeExperienceBullets(e.target.checked)
                        }
                      />
                    }
                    label="Merge experience bullets"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={addMissingExperienceEntries}
                        onChange={(e) =>
                          setAddMissingExperienceEntries(e.target.checked)
                        }
                      />
                    }
                    label="Add missing experience entries"
                  />
                </Stack>
                <Button
                  variant="contained"
                  sx={{ mt: 1 }}
                  onClick={performMerge}
                >
                  Merge Selected Changes
                </Button>
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
