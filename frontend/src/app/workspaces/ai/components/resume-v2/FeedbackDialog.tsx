import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  TextField,
  Divider,
} from "@mui/material";
import useResumeFeedback, {
  type ResumeShare,
} from "@workspaces/ai/hooks/useResumeFeedback";
import FeedbackPanel from "@workspaces/ai/components/resume-v2/FeedbackPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  draftId: string;
}

export default function FeedbackDialog({ open, onClose, draftId }: Props) {
  const fb = useResumeFeedback();
  const [shares, setShares] = useState<ResumeShare[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  const reload = () => {
    setShares(fb.listSharesByDraft(draftId));
  };

  useEffect(() => {
    if (!open) return;
    reload();
    setSelectedToken(null);
    setManualToken("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftId]);

  const handleCreate = () => {
    const s = fb.createShare(draftId, {
      permissions: "comment",
      privacy: "link",
    });
    reload();
    setSelectedToken(s.token);
  };

  const handleSelect = (token: string) => {
    setSelectedToken(token);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Feedback & Shares</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
          <Stack sx={{ width: 320 }} spacing={1}>
            <Button variant="contained" onClick={handleCreate}>
              Create new share
            </Button>
            <Divider />
            <Typography variant="caption">
              Existing shares for this draft
            </Typography>
            <List dense sx={{ maxHeight: 260, overflow: "auto" }}>
              {shares.map((s) => (
                <ListItem
                  key={s.token}
                  button
                  selected={selectedToken === s.token}
                  onClick={() => handleSelect(s.token)}
                >
                  <ListItemText
                    primary={s.token}
                    secondary={`${s.permissions} • ${
                      s.privacy
                    } • created ${new Date(s.createdAt).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>

            <TextField
              label="Open by token"
              size="small"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
            />
            <Button
              onClick={() => setSelectedToken(manualToken)}
              disabled={!manualToken}
            >
              Open Token
            </Button>
          </Stack>

          <Divider orientation="vertical" flexItem />

          <div style={{ flex: 1 }}>
            {selectedToken ? (
              <FeedbackPanel token={selectedToken} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a share on the left or create a new share to view
                comments and manage feedback.
              </Typography>
            )}
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
