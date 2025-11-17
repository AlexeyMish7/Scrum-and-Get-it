/**
 * JOB NOTES TAB
 * Personal notes, contacts, and interview feedback for this job.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { Save, Person, Phone, Email } from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { LoadingSpinner } from "@shared/components/feedback";
import {
  listJobNotes,
  createJobNote,
  updateJobNote,
} from "@shared/services/dbMappers";

interface JobNotesTabProps {
  jobId: number;
}

export default function JobNotesTab({ jobId }: JobNotesTabProps) {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState({
    personal_notes: "",
    recruiter_name: "",
    recruiter_email: "",
    recruiter_phone: "",
    hiring_manager_name: "",
    hiring_manager_email: "",
    hiring_manager_phone: "",
    interview_notes: "",
    salary_negotiation_notes: "",
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadNotes = async () => {
      setLoading(true);
      const result = await listJobNotes(user.id, { eq: { job_id: jobId } });

      if (result.error) {
        handleError(result.error);
        setLoading(false);
        return;
      }

      if (result.data && result.data.length > 0) {
        const note = result.data[0] as {
          personal_notes?: string | null;
          recruiter_name?: string | null;
          recruiter_email?: string | null;
          recruiter_phone?: string | null;
          hiring_manager_name?: string | null;
          hiring_manager_email?: string | null;
          hiring_manager_phone?: string | null;
          interview_notes?: string | null;
          salary_negotiation_notes?: string | null;
        };
        setNotes({
          personal_notes: note.personal_notes || "",
          recruiter_name: note.recruiter_name || "",
          recruiter_email: note.recruiter_email || "",
          recruiter_phone: note.recruiter_phone || "",
          hiring_manager_name: note.hiring_manager_name || "",
          hiring_manager_email: note.hiring_manager_email || "",
          hiring_manager_phone: note.hiring_manager_phone || "",
          interview_notes: note.interview_notes || "",
          salary_negotiation_notes: note.salary_negotiation_notes || "",
        });
      }
      setLoading(false);
    };

    loadNotes();
  }, [user?.id, jobId, handleError]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    // Check if notes exist
    const existingResult = await listJobNotes(user.id, {
      eq: { job_id: jobId },
    });

    let result;
    if (existingResult.data && existingResult.data.length > 0) {
      // Update existing
      const noteId = (existingResult.data[0] as { id?: string }).id;
      if (!noteId) return;
      result = await updateJobNote(user.id, noteId, notes);
    } else {
      // Create new
      result = await createJobNote(user.id, { job_id: jobId, ...notes });
    }

    setSaving(false);

    if (result.error) {
      handleError(result.error);
      return;
    }

    showSuccess("Notes saved");
  };

  if (loading) {
    return <LoadingSpinner message="Loading notes..." />;
  }

  return (
    <Stack spacing={3}>
      {/* Personal Notes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Personal Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={notes.personal_notes}
          onChange={(e) =>
            setNotes({ ...notes, personal_notes: e.target.value })
          }
          placeholder="Add your thoughts about this position, company culture observations, or any other notes..."
        />
      </Paper>

      {/* Contacts */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contacts
        </Typography>

        <Stack spacing={3}>
          {/* Recruiter */}
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Person color="action" />
              <Typography variant="subtitle1">Recruiter</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={notes.recruiter_name}
                onChange={(e) =>
                  setNotes({ ...notes, recruiter_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                InputProps={{
                  startAdornment: (
                    <Email
                      fontSize="small"
                      sx={{ mr: 1, color: "action.active" }}
                    />
                  ),
                }}
                value={notes.recruiter_email}
                onChange={(e) =>
                  setNotes({ ...notes, recruiter_email: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Phone"
                type="tel"
                InputProps={{
                  startAdornment: (
                    <Phone
                      fontSize="small"
                      sx={{ mr: 1, color: "action.active" }}
                    />
                  ),
                }}
                value={notes.recruiter_phone}
                onChange={(e) =>
                  setNotes({ ...notes, recruiter_phone: e.target.value })
                }
              />
            </Stack>
          </Box>

          <Divider />

          {/* Hiring Manager */}
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Person color="action" />
              <Typography variant="subtitle1">Hiring Manager</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={notes.hiring_manager_name}
                onChange={(e) =>
                  setNotes({ ...notes, hiring_manager_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                InputProps={{
                  startAdornment: (
                    <Email
                      fontSize="small"
                      sx={{ mr: 1, color: "action.active" }}
                    />
                  ),
                }}
                value={notes.hiring_manager_email}
                onChange={(e) =>
                  setNotes({ ...notes, hiring_manager_email: e.target.value })
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Phone"
                type="tel"
                InputProps={{
                  startAdornment: (
                    <Phone
                      fontSize="small"
                      sx={{ mr: 1, color: "action.active" }}
                    />
                  ),
                }}
                value={notes.hiring_manager_phone}
                onChange={(e) =>
                  setNotes({ ...notes, hiring_manager_phone: e.target.value })
                }
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Interview Notes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Interview Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={notes.interview_notes}
          onChange={(e) =>
            setNotes({ ...notes, interview_notes: e.target.value })
          }
          placeholder="Questions asked, interviewer names, key points discussed..."
        />
      </Paper>

      {/* Salary Negotiation */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Salary Negotiation Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={notes.salary_negotiation_notes}
          onChange={(e) =>
            setNotes({ ...notes, salary_negotiation_notes: e.target.value })
          }
          placeholder="Initial offer, counter-offers, benefits discussion..."
        />
      </Paper>

      {/* Save Button */}
      <Box>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Notes"}
        </Button>
      </Box>
    </Stack>
  );
}
