import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SaveIcon from "@mui/icons-material/Save";
import StarIcon from "@mui/icons-material/Star";
import ArchiveIcon from "@mui/icons-material/Archive";

import useResumeVersions, {
  type ResumeVersion,
} from "@workspaces/ai/hooks/useResumeVersions";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";
import useUserJobs from "@shared/hooks/useUserJobs";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";

// Version content type for merge operations
type VersionContent = Record<string, unknown>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ResumeVersionsPanel({ open, onClose }: Props) {
  const { getActiveDraft, editSection } = useResumeDraftsV2();
  const activeDraft = getActiveDraft?.();
  const versionsApi = useResumeVersions();
  const { jobs } = useUserJobs(50);
  const { confirm } = useConfirmDialog();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newJobId, setNewJobId] = useState<number | "">("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

  const versions = useMemo(() => {
    if (!activeDraft) return [];
    return versionsApi
      .listAllIncludingArchived(activeDraft.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activeDraft, versionsApi]);

  if (!activeDraft) return null;

  const handleCreate = () => {
    const content = activeDraft.content;
    const v = versionsApi.createVersion(
      activeDraft.id,
      newName || activeDraft.name,
      content,
      {
        description: newDesc || undefined,
        jobId: newJobId === "" ? null : (newJobId as number),
        setDefault: setAsDefault,
      }
    );
    console.log("Created version:", v);
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
    setNewJobId("");
    setSetAsDefault(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Version",
      description: "Delete this version permanently?",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;
    versionsApi.deleteVersion(id);
  };

  const handleArchive = (id: string) => {
    versionsApi.archiveVersion(id);
  };

  const handleSetDefault = (id: string) => {
    versionsApi.setDefaultVersion(activeDraft.id, id);
  };

  const handleApplyVersionToDraft = async (id: string) => {
    const v = versionsApi.getVersion(id);
    if (!v) return;
    // Apply sections by calling editSection for each known section
    const content = v.content || {};
    const sections = [
      "summary",
      "skills",
      "experience",
      "education",
      "projects",
    ];
    for (const s of sections) {
      try {
        await editSection(s, content[s as keyof typeof content]);
      } catch (e) {
        console.warn("Failed to apply section", s, e);
      }
    }
    alert("Version applied to current draft");
  };

  // Merge helper: combine source and destination content objects
  // preferSource=true means fields from source override destination when present
  const mergeContents = (
    source: VersionContent,
    dest: VersionContent,
    preferSource = true
  ): VersionContent => {
    const out: VersionContent = {};
    const sections = [
      "summary",
      "skills",
      "experience",
      "education",
      "projects",
    ];
    for (const s of sections) {
      const a = source ? source[s] : undefined;
      const b = dest ? dest[s] : undefined;
      // determine emptiness: undefined/null or empty array or empty string
      const isEmpty = (v: unknown) =>
        v === undefined ||
        v === null ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === "string" && v.trim() === "");
      if (preferSource) {
        out[s] = !isEmpty(a) ? a : b;
      } else {
        out[s] = !isEmpty(b) ? b : a;
      }
    }
    return out;
  };

  const openCompare = (l?: string, r?: string) => {
    setLeftId(l || null);
    setRightId(r || null);
    setCompareOpen(true);
  };

  const renderVersionSummary = (v: ResumeVersion) => {
    const isCurrentlyUsed =
      v.content &&
      JSON.stringify(v.content) === JSON.stringify(activeDraft?.content);

    return (
      <div>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2">{v.name}</Typography>
          {v.isDefault && (
            <Chip
              size="small"
              icon={<StarIcon fontSize="small" />}
              label="Default"
              color="primary"
            />
          )}
          {isCurrentlyUsed && (
            <Chip
              size="small"
              label="Currently Viewing"
              color="success"
              variant="outlined"
            />
          )}
          {v.archived && (
            <Chip size="small" label="Archived" variant="outlined" />
          )}
        </Stack>
        {v.description && (
          <Typography variant="caption" color="text.secondary" display="block">
            {v.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block">
          Created: {new Date(v.createdAt).toLocaleString()}
        </Typography>
      </div>
    );
  };

  const leftVer = leftId ? versionsApi.getVersion(leftId) : null;
  const rightVer = rightId ? versionsApi.getVersion(rightId) : null;

  const handleMerge = async () => {
    if (!mergeSourceId) return;
    const v = versionsApi.getVersion(mergeSourceId);
    if (!v) return;
    // Merge: prefer non-empty fields from source into current draft
    const content = v.content || {};
    const sections = [
      "summary",
      "skills",
      "experience",
      "education",
      "projects",
    ];
    for (const s of sections) {
      if (content[s] !== undefined && content[s] !== null) {
        try {
          await editSection(s, content[s as keyof typeof content]);
        } catch (e) {
          console.warn("Merge apply failed for", s, e);
        }
      }
    }
    alert("Merged version into current draft");
    setMergeSourceId(null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Resume Versions</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              startIcon={<SaveIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Create Version
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </Stack>

          <Divider />

          <List>
            {versions.map((v) => (
              <ListItem
                key={v.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Compare">
                      <IconButton onClick={() => openCompare(v.id)}>
                        <CompareArrowsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Set Default">
                      <IconButton onClick={() => handleSetDefault(v.id)}>
                        <StarIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Apply to Draft">
                      <IconButton
                        onClick={() => handleApplyVersionToDraft(v.id)}
                      >
                        <SaveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archive">
                      <IconButton onClick={() => handleArchive(v.id)}>
                        <ArchiveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(v.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemText primary={renderVersionSummary(v)} />
              </ListItem>
            ))}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth>
        <DialogTitle>Create Version from current draft</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Version Name"
              fullWidth
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel id="version-job-label">
                Link to Job (optional)
              </InputLabel>
              <Select
                labelId="version-job-label"
                value={newJobId}
                label="Link to Job (optional)"
                onChange={(e) => setNewJobId(e.target.value as number | "")}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {jobs.map((j) => (
                  <MenuItem key={j.id} value={j.id}>
                    {j.title} @ {j.company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <Stack direction="row" spacing={1} alignItems="center">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                />
                <Typography variant="body2">Set as default version</Typography>
              </Stack>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Compare Versions</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ flex: 1, border: "1px solid #eee", p: 1 }}>
              <Typography variant="subtitle2">Left</Typography>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Select
                  value={leftId || ""}
                  onChange={(e) => setLeftId(e.target.value as string)}
                >
                  <MenuItem value="">
                    <em>Choose</em>
                  </MenuItem>
                  {versions.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">
                  {leftVer ? leftVer.description : "No version selected"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, border: "1px solid #eee", p: 1 }}>
              <Typography variant="subtitle2">Right</Typography>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Select
                  value={rightId || ""}
                  onChange={(e) => setRightId(e.target.value as string)}
                >
                  <MenuItem value="">
                    <em>Choose</em>
                  </MenuItem>
                  {versions.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">
                  {rightVer ? rightVer.description : "No version selected"}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>Close</Button>
          {/* Merge actions: create merged version or apply merge to current draft */}
          <Button
            disabled={!leftId || !rightId}
            onClick={async () => {
              // Merge Left into Right -> create a new version with merged content
              const left = leftId ? versionsApi.getVersion(leftId) : null;
              const right = rightId ? versionsApi.getVersion(rightId) : null;
              if (!left || !right) return;
              const merged = mergeContents(
                left.content,
                right.content,
                /*preferSource=*/ true
              );
              const name = `Merge: ${left.name} → ${right.name}`;
              const v = versionsApi.createVersion(left.draftId, name, merged, {
                description: `Merged ${left.name} into ${right.name}`,
              });
              alert(`Created merged version: ${v.name}`);
              setCompareOpen(false);
            }}
          >
            Merge Left → Right
          </Button>
          <Button
            disabled={!leftId || !rightId}
            onClick={async () => {
              // Merge Right into Left
              const left = leftId ? versionsApi.getVersion(leftId) : null;
              const right = rightId ? versionsApi.getVersion(rightId) : null;
              if (!left || !right) return;
              const merged = mergeContents(
                right.content,
                left.content,
                /*preferSource=*/ true
              );
              const name = `Merge: ${right.name} → ${left.name}`;
              const v = versionsApi.createVersion(left.draftId, name, merged, {
                description: `Merged ${right.name} into ${left.name}`,
              });
              alert(`Created merged version: ${v.name}`);
              setCompareOpen(false);
            }}
          >
            Merge Right → Left
          </Button>
          <Button
            disabled={!leftId && !rightId}
            onClick={async () => {
              // Create merged content from selected (prefer left if present)
              const left = leftId ? versionsApi.getVersion(leftId) : null;
              const right = rightId ? versionsApi.getVersion(rightId) : null;
              const src = left || right;
              if (!src) return;
              // Apply merged content to current draft
              const merged = mergeContents(
                left ? left.content : {},
                right ? right.content : {},
                /*preferSource=*/ !!left
              );
              const sections = [
                "summary",
                "skills",
                "experience",
                "education",
                "projects",
              ];
              for (const s of sections) {
                try {
                  await editSection(s, merged[s as keyof typeof merged]);
                } catch (e) {
                  console.warn("Apply merged section failed", s, e);
                }
              }
              alert("Merged content applied to current draft");
              setCompareOpen(false);
            }}
          >
            Apply Merge to Draft
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog (select a version to merge into current draft) */}
      <Dialog
        open={Boolean(mergeSourceId)}
        onClose={() => setMergeSourceId(null)}
      >
        <DialogTitle>Merge Version into Current Draft</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="merge-version-label">
                Select version to merge
              </InputLabel>
              <Select
                labelId="merge-version-label"
                value={mergeSourceId || ""}
                onChange={(e) => setMergeSourceId(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Choose</em>
                </MenuItem>
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption">
              Merging will apply non-empty fields from the selected version into
              the current draft.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeSourceId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleMerge}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
