import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";

import useResumeFeedback from "@workspaces/ai/hooks/useResumeFeedback";
import { useAuth } from "@shared/context/AuthContext";
import { useLocation } from "react-router-dom";

interface Props {
  token?: string | null; // share token provided via URL or dialog
}

export default function FeedbackPanel({ token }: Props) {
  const { user } = useAuth();
  const feedback = useResumeFeedback();
  const location = useLocation();

  const urlToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("share");
  }, [location.search]);

  const effectiveToken = token || urlToken || null;

  const [shareInfo, setShareInfo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!effectiveToken) return;
    const s = feedback.getShare(effectiveToken);
    setShareInfo(s);
    setComments(s ? s.comments : []);
  }, [effectiveToken]);

  if (!effectiveToken) return null;
  if (!shareInfo) return (
    <Card variant="outlined" sx={{ p:1 }}>
      <CardContent>
        <Typography variant="body2">Invalid or expired share link.</Typography>
      </CardContent>
    </Card>
  );

  const canComment = shareInfo.permissions === "comment" || shareInfo.permissions === "edit";

  const send = () => {
    if (!message.trim()) return;
    feedback.addComment(effectiveToken!, message.trim(), user?.email || "Guest");
    const updated = feedback.listComments(effectiveToken!);
    setComments(updated);
    setMessage("");
  };

  const toggleResolve = (id: string, resolved: boolean) => {
    feedback.resolveComment(effectiveToken!, id, resolved);
    setComments(feedback.listComments(effectiveToken!));
  };

  const downloadFeedback = () => {
    const data = feedback.exportFeedback(effectiveToken!);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_${effectiveToken}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Feedback</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Permissions: ${shareInfo.permissions}`} size="small" />
              <IconButton size="small" onClick={downloadFeedback}><DownloadIcon fontSize="small"/></IconButton>
            </Stack>
          </Stack>

          <Divider />

          <Box sx={{ maxHeight: 300, overflow: "auto" }}>
            {comments.length === 0 && <Typography variant="caption" color="text.secondary">No feedback yet.</Typography>}
            {comments.map((c:any)=> (
              <Box key={c.id} sx={{ p:1, borderBottom: '1px dashed #eee' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight:600 }}>{c.author || 'Guest'}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(c.createdAt).toLocaleString()}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt:0.5 }}>{c.message}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt:1 }}>
                  <Button size="small" startIcon={<CheckIcon />} onClick={()=>toggleResolve(c.id, !c.resolved)}>
                    {c.resolved ? 'Reopen' : 'Resolve'}
                  </Button>
                </Stack>
              </Box>
            ))}
          </Box>

          {canComment ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField fullWidth size="small" placeholder="Add feedback…" value={message} onChange={(e)=>setMessage(e.target.value)} />
              <Button variant="contained" endIcon={<SendIcon />} onClick={send}>Send</Button>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">You don't have permission to comment on this resume.</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
