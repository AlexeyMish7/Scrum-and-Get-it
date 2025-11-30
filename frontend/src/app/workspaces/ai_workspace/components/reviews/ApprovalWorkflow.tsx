/**
 * ApprovalWorkflow (UC-110: Collaborative Document Review)
 *
 * Component for the approve/request changes workflow.
 * Displayed when reviewer has "approve" access level.
 *
 * Features:
 * - Approve document with optional note
 * - Request changes with required note
 * - Visual confirmation before action
 */

import { useState } from "react";
import {
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import type { DocumentReview } from "../../services/reviewService";

interface ApprovalWorkflowProps {
  review: DocumentReview;
  onApprove: (note: string) => Promise<void>;
  onRequestChanges: (note: string) => Promise<void>;
}

export function ApprovalWorkflow({
  review,
  onApprove,
  onRequestChanges,
}: ApprovalWorkflowProps) {
  const [dialogType, setDialogType] = useState<"approve" | "changes" | null>(
    null
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (dialogType === "approve") {
        await onApprove(note);
      } else if (dialogType === "changes") {
        await onRequestChanges(note);
      }
      setDialogType(null);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show if review is already completed
  if (review.status === "completed" || review.status === "cancelled") {
    return null;
  }

  return (
    <>
      <Paper sx={{ p: 2, bgcolor: "primary.50" }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            Review Decision
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Review type: <strong>{review.review_type.replace("_", " ")}</strong>
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => setDialogType("approve")}
              fullWidth
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => setDialogType("changes")}
              fullWidth
            >
              Request Changes
            </Button>
          </Stack>

          {review.unresolved_comments > 0 && (
            <Alert severity="warning" sx={{ py: 0 }}>
              There are {review.unresolved_comments} unresolved comments
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Approval Dialog */}
      <Dialog
        open={dialogType === "approve"}
        onClose={() => setDialogType(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ApproveIcon color="success" />
          Approve Document
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              You are about to approve this document. This will mark the review
              as complete.
            </Typography>
            <TextField
              label="Approval Note (optional)"
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any final comments or praise..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogType(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Approving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog
        open={dialogType === "changes"}
        onClose={() => setDialogType(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RejectIcon color="error" />
          Request Changes
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Please provide feedback on what changes are needed.
            </Typography>
            <TextField
              label="Required Changes"
              multiline
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the changes that need to be made..."
              fullWidth
              required
              error={!note.trim()}
              helperText={
                !note.trim() ? "Please describe the required changes" : ""
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogType(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={!note.trim() || submitting}
          >
            {submitting ? "Submitting..." : "Request Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ApprovalWorkflow;
