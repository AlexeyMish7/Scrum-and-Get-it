/**
 * BulletMergeDialog
 * Lets the user select which AI-generated experience bullets to merge into the active draft.
 * Duplicate bullets (exact match) are pre-unchecked and visually indicated.
 */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import type { ResumeDraftContentExperienceItem } from "@workspaces/ai/hooks/useResumeDrafts";

export type BulletMergeDialogProps = {
  open: boolean;
  onClose: () => void;
  aiContent?: ResumeArtifactContent | null;
  draftExperience?: ResumeDraftContentExperienceItem[] | undefined;
  onApply: (
    selected: Array<{
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }>
  ) => void;
};

function isDuplicateBullet(
  draft: ResumeDraftContentExperienceItem[] | undefined,
  role?: string,
  company?: string,
  bullet?: string
) {
  if (!draft || !bullet) return false;
  const r = role?.toLowerCase();
  const c = company?.toLowerCase();
  for (const item of draft) {
    const matchRole = r ? item.role.toLowerCase() === r : true;
    const matchCompany = company ? item.company?.toLowerCase() === c : true;
    if (matchRole && matchCompany) {
      if (item.bullets.some((b) => b.trim() === bullet.trim())) return true;
    }
  }
  return false;
}

export default function BulletMergeDialog({
  open,
  onClose,
  aiContent,
  draftExperience,
  onApply,
}: BulletMergeDialogProps) {
  const aiExp = useMemo(
    () => aiContent?.sections?.experience || [],
    [aiContent?.sections?.experience]
  );

  // Build selection model: for each experience item, an array of booleans for bullets
  const initialSelection = useMemo(() => {
    return aiExp.map((exp) =>
      exp.bullets.map(
        (b) => !isDuplicateBullet(draftExperience, exp.role, exp.company, b)
      )
    );
    // default: select non-duplicates
  }, [aiExp, draftExperience]);

  const [selected, setSelected] = useState<boolean[][]>(initialSelection);

  // keep selection in sync when content changes
  const selectionIsOutdated = selected.length !== initialSelection.length;
  if (selectionIsOutdated && open) {
    setSelected(initialSelection);
  }

  function toggle(i: number, j: number) {
    setSelected((prev) =>
      prev.map((row, ri) =>
        ri === i ? row.map((v, cj) => (cj === j ? !v : v)) : row
      )
    );
  }

  function toggleAllForRow(i: number, value: boolean) {
    setSelected((prev) =>
      prev.map((row, ri) => (ri === i ? row.map(() => value) : row))
    );
  }

  function apply() {
    const payload: Array<{
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }> = [];
    aiExp.forEach((exp, i) => {
      const picks = exp.bullets.filter((_, j) => selected[i]?.[j]);
      if (picks.length) {
        payload.push({
          role: exp.role,
          company: exp.company,
          dates: exp.dates,
          bullets: picks,
        });
      }
    });
    onApply(payload);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Select AI bullets to merge</DialogTitle>
      <DialogContent>
        {aiExp.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No AI experience section available.
          </Typography>
        ) : (
          <Stack spacing={2} mt={1}>
            {aiExp.map((exp, i) => {
              const duplicates = exp.bullets.reduce(
                (acc, b) =>
                  acc +
                  (isDuplicateBullet(draftExperience, exp.role, exp.company, b)
                    ? 1
                    : 0),
                0
              );
              return (
                <Box
                  key={`row-${i}`}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      {exp.role || "Experience"}{" "}
                      {exp.company ? `— ${exp.company}` : ""}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selected[i]?.every(Boolean)}
                          onChange={(e) => toggleAllForRow(i, e.target.checked)}
                        />
                      }
                      label="Select all"
                    />
                    {duplicates > 0 && (
                      <Chip
                        size="small"
                        label={`${duplicates} duplicate${
                          duplicates > 1 ? "s" : ""
                        }`}
                      />
                    )}
                  </Stack>
                  <Stack mt={1} spacing={0.5}>
                    {exp.bullets.map((b, j) => {
                      const dup = isDuplicateBullet(
                        draftExperience,
                        exp.role,
                        exp.company,
                        b
                      );
                      return (
                        <FormControlLabel
                          key={`b-${i}-${j}`}
                          control={
                            <Checkbox
                              checked={!!selected[i]?.[j]}
                              onChange={() => toggle(i, j)}
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              color={dup ? "text.secondary" : undefined}
                            >
                              • {b} {dup ? "(duplicate)" : ""}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={apply} variant="contained">
          Apply Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
}
