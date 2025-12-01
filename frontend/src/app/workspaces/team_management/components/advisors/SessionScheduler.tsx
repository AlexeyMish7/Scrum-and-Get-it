/**
 * UC-115: External Advisor and Coach Integration
 * Dialog for scheduling a coaching session
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
  Typography,
  Box,
  Stack,
  Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { addHours } from "date-fns";

import type {
  CreateSessionData,
  SessionType,
  LocationType,
  ExternalAdvisor,
} from "../../types/advisor.types";

interface SessionSchedulerProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (data: CreateSessionData) => Promise<boolean>;
  advisors: ExternalAdvisor[];
  preselectedAdvisorId?: string;
}

// Session type options
const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "coaching", label: "Coaching Session" },
  { value: "review", label: "Document Review" },
  { value: "planning", label: "Strategy Planning" },
  { value: "check_in", label: "Progress Check-in" },
  { value: "other", label: "Other" },
];

// Location type options
const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "video", label: "Video Call" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
];

/**
 * Dialog for scheduling coaching sessions with advisors
 */
export function SessionScheduler({
  open,
  onClose,
  onSchedule,
  advisors,
  preselectedAdvisorId,
}: SessionSchedulerProps) {
  // Default to 1 hour from now, rounded to nearest 30 min
  const getDefaultStartTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 60;
    now.setMinutes(roundedMinutes, 0, 0);
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1);
    }
    return addHours(now, 1);
  };

  // Form state
  const [formData, setFormData] = useState({
    advisor_id: preselectedAdvisorId ?? "",
    title: "",
    description: "",
    session_type: "coaching" as SessionType,
    location_type: "video" as LocationType,
    meeting_url: "",
    phone_number: "",
    physical_location: "",
  });

  const [startTime, setStartTime] = useState<Date | null>(
    getDefaultStartTime()
  );
  const [endTime, setEndTime] = useState<Date | null>(
    addHours(getDefaultStartTime(), 1)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to only active advisors
  const activeAdvisors = advisors.filter((a) => a.status === "active");

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle start time change - auto-update end time
  const handleStartTimeChange = (newValue: Date | null) => {
    setStartTime(newValue);
    if (newValue) {
      setEndTime(addHours(newValue, 1));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.advisor_id) {
      setError("Please select an advisor");
      return;
    }
    if (!formData.title.trim()) {
      setError("Please enter a session title");
      return;
    }
    if (!startTime || !endTime) {
      setError("Please select start and end times");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    // Validate location details based on type
    if (formData.location_type === "video" && !formData.meeting_url) {
      setError("Please enter a meeting URL for video calls");
      return;
    }
    if (formData.location_type === "phone" && !formData.phone_number) {
      setError("Please enter a phone number");
      return;
    }
    if (formData.location_type === "in_person" && !formData.physical_location) {
      setError("Please enter a meeting location");
      return;
    }

    setLoading(true);
    setError(null);

    const sessionData: CreateSessionData = {
      advisor_id: formData.advisor_id,
      title: formData.title,
      description: formData.description || undefined,
      session_type: formData.session_type,
      scheduled_start: startTime.toISOString(),
      scheduled_end: endTime.toISOString(),
      location_type: formData.location_type,
      meeting_url:
        formData.location_type === "video" ? formData.meeting_url : undefined,
      phone_number:
        formData.location_type === "phone" ? formData.phone_number : undefined,
      physical_location:
        formData.location_type === "in_person"
          ? formData.physical_location
          : undefined,
    };

    const success = await onSchedule(sessionData);

    setLoading(false);

    if (success) {
      // Reset form and close
      setFormData({
        advisor_id: "",
        title: "",
        description: "",
        session_type: "coaching",
        location_type: "video",
        meeting_url: "",
        phone_number: "",
        physical_location: "",
      });
      setStartTime(getDefaultStartTime());
      setEndTime(addHours(getDefaultStartTime(), 1));
      onClose();
    } else {
      setError("Failed to schedule session. Please try again.");
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
      <DialogTitle>Schedule Coaching Session</DialogTitle>

      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* No Active Advisors Warning */}
            {activeAdvisors.length === 0 && (
              <Alert severity="warning">
                You don't have any active advisors. Invite an advisor first to
                schedule sessions.
              </Alert>
            )}

            {/* Advisor Selection */}
            <FormControl
              fullWidth
              required
              disabled={loading || activeAdvisors.length === 0}
            >
              <InputLabel>Select Advisor</InputLabel>
              <Select
                value={formData.advisor_id}
                label="Select Advisor"
                onChange={(e) => handleChange("advisor_id", e.target.value)}
              >
                {activeAdvisors.map((advisor) => (
                  <MenuItem key={advisor.id} value={advisor.id}>
                    {advisor.advisor_name} (
                    {advisor.advisor_type.replace("_", " ")})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Session Title */}
            <TextField
              label="Session Title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              required
              disabled={loading}
              placeholder="e.g., Resume Review, Interview Prep"
            />

            {/* Session Type */}
            <FormControl fullWidth>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={formData.session_type}
                label="Session Type"
                onChange={(e) => handleChange("session_type", e.target.value)}
                disabled={loading}
              >
                {SESSION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date/Time Selection */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Schedule
              </Typography>
              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  disabled={loading}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
                <DateTimePicker
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  disabled={loading}
                  minDateTime={startTime ?? undefined}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Stack>
            </Box>

            {/* Location Type */}
            <FormControl fullWidth>
              <InputLabel>Meeting Type</InputLabel>
              <Select
                value={formData.location_type}
                label="Meeting Type"
                onChange={(e) => handleChange("location_type", e.target.value)}
                disabled={loading}
              >
                {LOCATION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Location Details - Conditional based on type */}
            {formData.location_type === "video" && (
              <TextField
                label="Meeting URL"
                value={formData.meeting_url}
                onChange={(e) => handleChange("meeting_url", e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="https://zoom.us/j/..."
                helperText="Zoom, Google Meet, or Teams link"
              />
            )}

            {formData.location_type === "phone" && (
              <TextField
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="+1 (555) 123-4567"
              />
            )}

            {formData.location_type === "in_person" && (
              <TextField
                label="Meeting Location"
                value={formData.physical_location}
                onChange={(e) =>
                  handleChange("physical_location", e.target.value)
                }
                fullWidth
                required
                disabled={loading}
                placeholder="Coffee shop, office address, etc."
              />
            )}

            {/* Description */}
            <TextField
              label="Notes / Agenda (Optional)"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
              placeholder="Topics to discuss, questions to ask, materials to review..."
            />
          </Stack>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || activeAdvisors.length === 0}
        >
          {loading ? "Scheduling..." : "Schedule Session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionScheduler;
