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
  MenuItem,
  Grid,
} from "@mui/material";
import { Save, Person, Phone, Email, AttachMoney } from "@mui/icons-material";
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
    // Salary tracking fields
    offered_salary: "",
    negotiated_salary: "",
    offer_received_date: "",
    negotiation_outcome: "",
    total_compensation_breakdown: {
      base_salary: "",
      signing_bonus: "",
      annual_bonus: "",
      equity_value: "",
      benefits_value: "",
      notes: "",
    },
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
          offered_salary?: number | null;
          negotiated_salary?: number | null;
          offer_received_date?: string | null;
          negotiation_outcome?: string | null;
          total_compensation_breakdown?: any;
        };
        const breakdown = note.total_compensation_breakdown || {};
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
          offered_salary: note.offered_salary?.toString() || "",
          negotiated_salary: note.negotiated_salary?.toString() || "",
          offer_received_date: note.offer_received_date || "",
          negotiation_outcome: note.negotiation_outcome || "",
          total_compensation_breakdown: {
            base_salary: breakdown.base_salary?.toString() || "",
            signing_bonus: breakdown.signing_bonus?.toString() || "",
            annual_bonus: breakdown.annual_bonus?.toString() || "",
            equity_value: breakdown.equity_value?.toString() || "",
            benefits_value: breakdown.benefits_value?.toString() || "",
            notes: breakdown.notes || "",
          },
        });
      }
      setLoading(false);
    };

    loadNotes();
  }, [user?.id, jobId, handleError]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    // Prepare payload with proper type conversions
    const payload: any = {
      ...notes,
      offered_salary: notes.offered_salary ? Number(notes.offered_salary) : null,
      negotiated_salary: notes.negotiated_salary ? Number(notes.negotiated_salary) : null,
      offer_received_date: notes.offer_received_date || null,
      negotiation_outcome: notes.negotiation_outcome || null,
      total_compensation_breakdown: {
        base_salary: notes.total_compensation_breakdown.base_salary ? Number(notes.total_compensation_breakdown.base_salary) : null,
        signing_bonus: notes.total_compensation_breakdown.signing_bonus ? Number(notes.total_compensation_breakdown.signing_bonus) : null,
        annual_bonus: notes.total_compensation_breakdown.annual_bonus ? Number(notes.total_compensation_breakdown.annual_bonus) : null,
        equity_value: notes.total_compensation_breakdown.equity_value ? Number(notes.total_compensation_breakdown.equity_value) : null,
        benefits_value: notes.total_compensation_breakdown.benefits_value ? Number(notes.total_compensation_breakdown.benefits_value) : null,
        notes: notes.total_compensation_breakdown.notes || null,
        total: 
          (notes.total_compensation_breakdown.base_salary ? Number(notes.total_compensation_breakdown.base_salary) : 0) +
          (notes.total_compensation_breakdown.signing_bonus ? Number(notes.total_compensation_breakdown.signing_bonus) : 0) +
          (notes.total_compensation_breakdown.annual_bonus ? Number(notes.total_compensation_breakdown.annual_bonus) : 0) +
          (notes.total_compensation_breakdown.equity_value ? Number(notes.total_compensation_breakdown.equity_value) : 0) +
          (notes.total_compensation_breakdown.benefits_value ? Number(notes.total_compensation_breakdown.benefits_value) : 0),
      },
    };

    // Check if notes exist
    const existingResult = await listJobNotes(user.id, {
      eq: { job_id: jobId },
    });

    let result;
    if (existingResult.data && existingResult.data.length > 0) {
      // Update existing
      const noteId = (existingResult.data[0] as { id?: string }).id;
      if (!noteId) return;
      result = await updateJobNote(user.id, noteId, payload);
    } else {
      // Create new
      result = await createJobNote(user.id, { job_id: jobId, ...payload });
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

      {/* Offer Details & Tracking */}
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <AttachMoney color="action" />
          <Typography variant="h6">Offer Details & Tracking</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track salary offers and negotiation outcomes for analytics
        </Typography>

        <Grid container spacing={2}>
          {/* Offer Date */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Offer Received Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={notes.offer_received_date}
              onChange={(e) =>
                setNotes({ ...notes, offer_received_date: e.target.value })
              }
            />
          </Grid>

          {/* Offered Salary */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Offered Base Salary"
              type="number"
              placeholder="e.g., 120000"
              value={notes.offered_salary}
              onChange={(e) =>
                setNotes({ ...notes, offered_salary: e.target.value })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>

          {/* Negotiated Salary */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Negotiated Base Salary"
              type="number"
              placeholder="e.g., 130000"
              value={notes.negotiated_salary}
              onChange={(e) =>
                setNotes({ ...notes, negotiated_salary: e.target.value })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>

          {/* Negotiation Outcome */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Negotiation Outcome"
              value={notes.negotiation_outcome}
              onChange={(e) =>
                setNotes({ ...notes, negotiation_outcome: e.target.value })
              }
            >
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
              <MenuItem value="countered">Countered</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Total Compensation Breakdown */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Total Compensation Breakdown (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Base Salary"
              type="number"
              value={notes.total_compensation_breakdown.base_salary}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    base_salary: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Signing Bonus"
              type="number"
              value={notes.total_compensation_breakdown.signing_bonus}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    signing_bonus: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Annual Bonus"
              type="number"
              value={notes.total_compensation_breakdown.annual_bonus}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    annual_bonus: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Equity Value (annual)"
              type="number"
              value={notes.total_compensation_breakdown.equity_value}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    equity_value: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Benefits Value"
              type="number"
              value={notes.total_compensation_breakdown.benefits_value}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    benefits_value: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Compensation Notes"
              multiline
              rows={2}
              value={notes.total_compensation_breakdown.notes}
              onChange={(e) =>
                setNotes({
                  ...notes,
                  total_compensation_breakdown: {
                    ...notes.total_compensation_breakdown,
                    notes: e.target.value,
                  },
                })
              }
              placeholder="e.g., Health insurance, 401k match, stock options details..."
            />
          </Grid>
        </Grid>
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
