/**
 * UC-115: External Advisor and Coach Integration
 * Dialog for inviting a new external advisor
 */

import { useState } from "react";
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
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import type { InviteAdvisorData, AdvisorType } from "../../types/advisor.types";
import { ADVISOR_TYPE_LABELS } from "../../types/advisor.types";

interface AdvisorInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: InviteAdvisorData) => Promise<boolean>;
}

// List of advisor types for the dropdown
const ADVISOR_TYPES: AdvisorType[] = [
  "career_coach",
  "resume_writer",
  "interview_coach",
  "industry_mentor",
  "executive_coach",
  "recruiter",
  "counselor",
  "consultant",
  "other",
];

/**
 * Dialog component for inviting external advisors
 * Collects advisor info, permissions, and invitation message
 */
export function AdvisorInviteDialog({
  open,
  onClose,
  onInvite,
}: AdvisorInviteDialogProps) {
  // Form state
  const [formData, setFormData] = useState<InviteAdvisorData>({
    advisor_email: "",
    advisor_name: "",
    advisor_type: "career_coach",
    organization_name: "",
    advisor_title: "",
    invitation_message: "",
    can_view_profile: true,
    can_view_jobs: true,
    can_view_documents: false,
    can_view_analytics: false,
    can_view_interviews: false,
    can_add_recommendations: true,
    can_schedule_sessions: true,
    can_send_messages: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (
    field: keyof InviteAdvisorData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.advisor_email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.advisor_name.trim()) {
      setError("Name is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.advisor_email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    const success = await onInvite(formData);

    setLoading(false);

    if (success) {
      // Reset form and close dialog
      setFormData({
        advisor_email: "",
        advisor_name: "",
        advisor_type: "career_coach",
        organization_name: "",
        advisor_title: "",
        invitation_message: "",
        can_view_profile: true,
        can_view_jobs: true,
        can_view_documents: false,
        can_view_analytics: false,
        can_view_interviews: false,
        can_add_recommendations: true,
        can_schedule_sessions: true,
        can_send_messages: true,
      });
      onClose();
    } else {
      setError("Failed to send invitation. Please try again.");
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite External Advisor</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Advisor Information
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Advisor Name"
                value={formData.advisor_name}
                onChange={(e) => handleChange("advisor_name", e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="e.g., Jane Smith"
              />

              <TextField
                label="Email Address"
                type="email"
                value={formData.advisor_email}
                onChange={(e) => handleChange("advisor_email", e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="advisor@example.com"
                helperText="An invitation will be sent to this email"
              />

              <FormControl fullWidth>
                <InputLabel>Advisor Type</InputLabel>
                <Select
                  value={formData.advisor_type}
                  label="Advisor Type"
                  onChange={(e) =>
                    handleChange("advisor_type", e.target.value as AdvisorType)
                  }
                  disabled={loading}
                >
                  {ADVISOR_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {ADVISOR_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.advisor_type === "other" && (
                <TextField
                  label="Custom Type"
                  value={formData.custom_type_name ?? ""}
                  onChange={(e) =>
                    handleChange("custom_type_name", e.target.value)
                  }
                  fullWidth
                  disabled={loading}
                  placeholder="Specify advisor type"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Organization Details (Optional) */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Organization Details (Optional)
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Organization/Company"
                value={formData.organization_name ?? ""}
                onChange={(e) =>
                  handleChange("organization_name", e.target.value)
                }
                fullWidth
                disabled={loading}
                placeholder="e.g., Career Coaching Inc."
              />

              <TextField
                label="Title/Role"
                value={formData.advisor_title ?? ""}
                onChange={(e) => handleChange("advisor_title", e.target.value)}
                fullWidth
                disabled={loading}
                placeholder="e.g., Senior Career Coach"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Personal Message */}
          <TextField
            label="Personal Message (Optional)"
            value={formData.invitation_message ?? ""}
            onChange={(e) => handleChange("invitation_message", e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            placeholder="Add a personal message to include in the invitation email..."
            helperText="This message will be included in the invitation email"
          />

          {/* Permissions Accordion */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Access Permissions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose what information your advisor can access
              </Typography>

              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_view_profile ?? true}
                      onChange={(e) =>
                        handleChange("can_view_profile", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="View my profile information"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_view_jobs ?? true}
                      onChange={(e) =>
                        handleChange("can_view_jobs", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="View my job applications"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_view_documents ?? false}
                      onChange={(e) =>
                        handleChange("can_view_documents", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="View my documents (resume, cover letters)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_view_analytics ?? false}
                      onChange={(e) =>
                        handleChange("can_view_analytics", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="View my analytics and metrics"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_view_interviews ?? false}
                      onChange={(e) =>
                        handleChange("can_view_interviews", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="View my interview schedule"
                />

                <Divider sx={{ my: 1 }} />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_add_recommendations ?? true}
                      onChange={(e) =>
                        handleChange(
                          "can_add_recommendations",
                          e.target.checked
                        )
                      }
                      disabled={loading}
                    />
                  }
                  label="Add recommendations and action items"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_schedule_sessions ?? true}
                      onChange={(e) =>
                        handleChange("can_schedule_sessions", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="Schedule coaching sessions"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.can_send_messages ?? true}
                      onChange={(e) =>
                        handleChange("can_send_messages", e.target.checked)
                      }
                      disabled={loading}
                    />
                  }
                  label="Send messages"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<SendIcon />}
        >
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdvisorInviteDialog;
