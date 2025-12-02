/**
 * ShareDocumentDialog (UC-110: Collaborative Document Review)
 *
 * Dialog for sharing a document with reviewers.
 * Allows selecting reviewers from team members or by email.
 *
 * Features:
 * - Select review type (feedback, approval, peer, mentor)
 * - Choose access level (view, comment, suggest, approve)
 * - Set due date for review
 * - Add request message
 * - Select from team members or invite by email
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Avatar,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import {
  Share as ShareIcon,
  Person as PersonIcon,
  Group as TeamIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { addDays } from "date-fns";

import * as reviewService from "../../services/reviewService";
import type {
  ReviewType,
  AccessLevel,
  CreateReviewData,
} from "../../services/reviewService";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

interface Reviewer {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  versionId?: string;
  teamId?: string;
  onSuccess?: () => void;
}

// Review type options with descriptions
const REVIEW_TYPE_OPTIONS: Array<{
  value: ReviewType;
  label: string;
  description: string;
}> = [
  {
    value: "feedback",
    label: "General Feedback",
    description: "Request comments and suggestions on your document",
  },
  {
    value: "approval",
    label: "Approval Required",
    description: "Document needs formal approval before use",
  },
  {
    value: "peer_review",
    label: "Peer Review",
    description: "Get input from a colleague at similar level",
  },
  {
    value: "mentor_review",
    label: "Mentor Review",
    description: "Request review from your mentor or supervisor",
  },
];

// Access level options
const ACCESS_LEVEL_OPTIONS: Array<{
  value: AccessLevel;
  label: string;
  description: string;
}> = [
  {
    value: "view",
    label: "View Only",
    description: "Reviewer can only view the document",
  },
  {
    value: "comment",
    label: "Comment",
    description: "Reviewer can add comments",
  },
  {
    value: "suggest",
    label: "Suggest Edits",
    description: "Reviewer can suggest specific changes",
  },
  {
    value: "approve",
    label: "Can Approve",
    description: "Reviewer can approve or request changes",
  },
];

export function ShareDocumentDialog({
  open,
  onClose,
  documentId,
  documentName,
  versionId,
  teamId,
  onSuccess,
}: ShareDocumentDialogProps) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  // Form state
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(
    null
  );
  const [reviewType, setReviewType] = useState<ReviewType>("feedback");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("comment");
  const [dueDate, setDueDate] = useState<Date | null>(addDays(new Date(), 7));
  const [message, setMessage] = useState("");

  // UI state
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load available reviewers function
  const loadReviewers = useCallback(async () => {
    if (!user) return;

    console.log(
      "[ShareDocumentDialog] Loading reviewers for teamId:",
      teamId,
      "userId:",
      user.id
    );
    setLoadingReviewers(true);
    try {
      const result = await reviewService.getAvailableReviewers(user.id, teamId);
      console.log(
        "[ShareDocumentDialog] getAvailableReviewers result:",
        result
      );
      if (result.data) {
        setAvailableReviewers(result.data);
      } else if (result.error) {
        console.error(
          "[ShareDocumentDialog] Error loading reviewers:",
          result.error
        );
      }
    } catch (err) {
      console.error("[ShareDocumentDialog] Exception loading reviewers:", err);
      handleError(err);
    } finally {
      setLoadingReviewers(false);
    }
  }, [user, teamId, handleError]);

  // Load available reviewers when dialog opens
  useEffect(() => {
    if (open && user) {
      loadReviewers();
    }
  }, [open, user, loadReviewers]);

  // Auto-set access level based on review type
  useEffect(() => {
    if (reviewType === "approval" || reviewType === "mentor_review") {
      setAccessLevel("approve");
    } else if (reviewType === "feedback") {
      setAccessLevel("comment");
    }
  }, [reviewType]);

  const handleSubmit = async () => {
    if (!user || !selectedReviewer) return;

    setSubmitting(true);
    try {
      const data: CreateReviewData = {
        documentId,
        versionId,
        reviewerId: selectedReviewer.id,
        teamId,
        reviewType,
        accessLevel,
        dueDate: dueDate?.toISOString(),
        requestMessage: message.trim() || undefined,
      };

      const result = await reviewService.createReview(user.id, data);

      if (result.error) {
        handleError(new Error(result.error.message));
        return;
      }

      showSuccess(`Review request sent to ${selectedReviewer.full_name}`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedReviewer(null);
    setReviewType("feedback");
    setAccessLevel("comment");
    setDueDate(addDays(new Date(), 7));
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ShareIcon color="primary" />
        Share for Review
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Document info */}
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              Sharing: <strong>{documentName}</strong>
            </Typography>
          </Alert>

          {/* Reviewer selection */}
          <Autocomplete
            options={availableReviewers}
            getOptionLabel={(option) => `${option.full_name} (${option.email})`}
            value={selectedReviewer}
            onChange={(_, value) => setSelectedReviewer(value)}
            loading={loadingReviewers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Reviewer"
                required
                placeholder="Search team members..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      {teamId ? (
                        <TeamIcon sx={{ mr: 1 }} />
                      ) : (
                        <PersonIcon sx={{ mr: 1 }} />
                      )}
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loadingReviewers ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {option.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {option.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                        {option.role && ` · ${option.role}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            }}
          />

          {availableReviewers.length === 0 && !loadingReviewers && (
            <Alert severity="warning">
              No team members available. Join a team to share documents with
              others.
            </Alert>
          )}

          {/* Review type */}
          <FormControl fullWidth>
            <InputLabel>Review Type</InputLabel>
            <Select
              value={reviewType}
              label="Review Type"
              onChange={(e) => setReviewType(e.target.value as ReviewType)}
            >
              {REVIEW_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Stack>
                    <Typography>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Access level */}
          <FormControl fullWidth>
            <InputLabel>Reviewer Permissions</InputLabel>
            <Select
              value={accessLevel}
              label="Reviewer Permissions"
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
            >
              {ACCESS_LEVEL_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Stack>
                    <Typography>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Due date */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Review Due Date"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: "When do you need the review completed?",
                },
              }}
            />
          </LocalizationProvider>

          {/* Message */}
          <TextField
            label="Message to Reviewer (optional)"
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add context about what feedback you're looking for..."
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedReviewer || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <ShareIcon />
          }
        >
          {submitting ? "Sending..." : "Send Review Request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShareDocumentDialog;
