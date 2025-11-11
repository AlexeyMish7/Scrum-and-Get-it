import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import type {
  ResumeArtifactContent,
  ResumePreviewModel,
} from "@workspaces/ai/types/ai";
import {
  toPreviewModel,
  diffPreviewModels,
} from "@workspaces/ai/utils/previewModel";

/**
 * DiffCompareDialog
 * WHAT: Side-by-side comparison dialog for two resume versions (current vs selected).
 * WHY: Help users visually spot changes (added/removed/moved bullets, skills).
 * INPUTS:
 *  - open: whether dialog is visible
 *  - left: current resume artifact content (baseline)
 *  - right: selected version content to compare
 *  - onClose: close handler
 *  - onChoose: optional callback when user chooses the right version as current
 * OUTPUT: Renders bullet-level diffs + aggregate skill changes.
 * ERROR MODES: None; purely visual. Null content results in simple fallback message.
 */
export function DiffCompareDialog({
  open,
  left,
  right,
  onClose,
  onChoose,
}: {
  open: boolean;
  left?: ResumeArtifactContent | null;
  right?: ResumeArtifactContent | null;
  onClose: () => void;
  onChoose?: () => void;
}) {
  const leftModel: ResumePreviewModel = toPreviewModel(left);
  const rightModel: ResumePreviewModel = toPreviewModel(right);
  const diff = diffPreviewModels(leftModel, rightModel);
  // Focus trap refs
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = React.useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (open) {
      // Focus first actionable button (Use Selected or Close)
      const target = firstFocusableRef.current || dialogRef.current;
      target?.focus();
    }
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      const focusable: HTMLElement[] = [];
      if (firstFocusableRef.current) focusable.push(firstFocusableRef.current);
      if (
        lastFocusableRef.current &&
        lastFocusableRef.current !== firstFocusableRef.current
      )
        focusable.push(lastFocusableRef.current);
      // Fallback to native behaviour if we somehow failed to collect both
      if (focusable.length < 2) return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="resume-diff-title"
      // MUI sets role=dialog; we supplement with aria-modal
      aria-modal="true"
      ref={dialogRef}
      onKeyDown={onKeyDown}
    >
      <DialogTitle id="resume-diff-title">Compare Versions</DialogTitle>
      <DialogContent dividers>
        {!left && !right && (
          <Typography variant="body2" color="text.secondary">
            Nothing to compare yet.
          </Typography>
        )}
        {(left || right) && (
          <Box>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="flex-start"
            >
              <VersionColumn label="Current" model={leftModel} />
              <VersionColumn label="Selected" model={rightModel} />
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Changes Summary
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Skills</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mt: 1 }}
                >
                  {diff.skills.added.map((s) => (
                    <Chip
                      key={s}
                      label={`+ ${s}`}
                      color="success"
                      size="small"
                    />
                  ))}
                  {diff.skills.removed.map((s) => (
                    <Chip key={s} label={`- ${s}`} color="error" size="small" />
                  ))}
                  {diff.skills.added.length === 0 &&
                    diff.skills.removed.length === 0 && (
                      <Chip label="No skill changes" size="small" />
                    )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Experience Bullet Changes
                </Typography>
                {diff.experience.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No experience entries to compare.
                  </Typography>
                )}
                <Stack spacing={2}>
                  {diff.experience.map((row, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {row.role || "Role"} @ {row.company || "Company"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        sx={{ mb: 1 }}
                      >
                        {row.added.map((b, bi) => (
                          <Chip
                            key={`a-${bi}`}
                            label={"+ " + truncate(b)}
                            color="success"
                            size="small"
                          />
                        ))}
                        {row.removed.map((b, bi) => (
                          <Chip
                            key={`r-${bi}`}
                            label={"- " + truncate(b)}
                            color="error"
                            size="small"
                          />
                        ))}
                        {row.added.length === 0 &&
                          row.removed.length === 0 &&
                          row.modifiedPositions.length === 0 && (
                            <Chip label="No changes" size="small" />
                          )}
                      </Stack>
                      {row.modifiedPositions.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Position changes:{" "}
                          {row.modifiedPositions
                            .map(
                              (m) =>
                                `${truncate(m.bullet)} (${m.leftIndex}→${
                                  m.rightIndex
                                })`
                            )
                            .join(", ")}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button ref={firstFocusableRef} onClick={onClose}>
          Close
        </Button>
        {onChoose && (
          <Button
            variant="contained"
            onClick={onChoose}
            disabled={!right}
            ref={lastFocusableRef}
          >
            Use Selected Version
          </Button>
        )}
        {!onChoose && <span ref={lastFocusableRef} />}
      </DialogActions>
    </Dialog>
  );
}

/** Simple truncation helper for chips */
function truncate(s: string, max = 48) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/** Column component for the raw version overview */
function VersionColumn({
  label,
  model,
}: {
  label: string;
  model: ResumePreviewModel;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack spacing={1}>
        {model.summary && (
          <Box>
            <Typography variant="subtitle2">Summary</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {model.summary}
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="subtitle2">Skills</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {(model.skills || []).map((s) => (
              <Chip key={s} label={s} size="small" />
            ))}
            {(model.skills || []).length === 0 && (
              <Typography variant="caption" color="text.secondary">
                None
              </Typography>
            )}
          </Stack>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Experience
          </Typography>
          <Stack spacing={1}>
            {(model.experience || []).map((row, i) => (
              <Box
                key={i}
                sx={{
                  p: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {row.role || "Role"} @ {row.company || "Company"}
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {row.bullets.map((b, bi) => (
                    <li key={bi} style={{ fontSize: "0.8rem" }}>
                      {b}
                    </li>
                  ))}
                  {row.bullets.length === 0 && (
                    <li style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                      No bullets
                    </li>
                  )}
                </ul>
              </Box>
            ))}
            {(model.experience || []).length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No experience entries
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export default DiffCompareDialog;
