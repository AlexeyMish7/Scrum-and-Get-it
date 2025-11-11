import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import useResumeFeedback from "@workspaces/ai/hooks/useResumeFeedback";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShareDialog({ open, onClose }: Props) {
  const { createShare } = useResumeFeedback();
  const { getActiveDraft } = useResumeDraftsV2();
  const draft = getActiveDraft();

  const [permissions, setPermissions] = useState<"view"|"comment"|"edit">("comment");
  const [privacy, setPrivacy] = useState<"link"|"private">("link");
  const [expires, setExpires] = useState<string | "">("");
  const [link, setLink] = useState<string | null>(null);

  const handleCreate = () => {
    if (!draft) return;
    const s = createShare(draft.id, { permissions, privacy, expiresAt: expires || null });
    const url = `${window.location.origin}${window.location.pathname}?share=${s.token}`;
    setLink(url);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Share Resume for Feedback</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="perm-label">Permissions</InputLabel>
            <Select labelId="perm-label" value={permissions} label="Permissions" onChange={(e)=>setPermissions(e.target.value as any)}>
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="comment">Comment</MenuItem>
              <MenuItem value="edit">Edit</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="privacy-label">Privacy</InputLabel>
            <Select labelId="privacy-label" value={privacy} label="Privacy" onChange={(e)=>setPrivacy(e.target.value as any)}>
              <MenuItem value="link">Anyone with link</MenuItem>
              <MenuItem value="private">Private (invited only)</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Expires at (ISO datetime, optional)" value={expires} onChange={(e)=>setExpires(e.target.value)} fullWidth />

          {link ? (
            <Typography variant="body2">Shareable link: <a href={link}>{link}</a></Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">Create a shareable link to allow reviewers to comment on this resume (stored locally for now).</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleCreate}>Create Link</Button>
      </DialogActions>
    </Dialog>
  );
}
