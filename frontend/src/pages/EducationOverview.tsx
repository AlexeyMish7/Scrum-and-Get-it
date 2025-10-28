import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

type EducationEntry = {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string; // undefined means ongoing
  gpa?: number;
  gpaPrivate?: boolean;
  honors?: string;
  active?: boolean;
};

// Matches Supabase columns
type DbEducationRow = {
  id?: string;
  degree_type?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  graduation_date?: string | null;
  start_date?: string | null;
  gpa?: number | null;
  honors?: string | null;
  enrollment_status?: string | null;
  meta?: { privateGpa?: boolean } | null;
};

const EducationOverview: React.FC = () => {
  const { user, loading } = useAuth();
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSave = async (entry: EducationEntry) => {
    if (!loading && user) {
      try {
        const userCrud = crud.withUser(user.id);
        const payload = {
          degree_type: entry.degree,
          institution_name: entry.institution,
          field_of_study: entry.fieldOfStudy,
          graduation_date: entry.endDate ? `${entry.endDate}-01` : null,
          start_date: entry.startDate ? `${entry.startDate}-01` : null,
          gpa: entry.gpa ?? null,
          honors: entry.honors ?? null,
          enrollment_status: entry.active ? "enrolled" : "not_enrolled",
          meta: { privateGpa: entry.gpaPrivate ?? false },
        };
        const res = await userCrud.updateRow(
          "education",
          payload,
          { eq: { id: entry.id } },
          "*"
        );
        if (res.error) {
          console.error("Failed to update education", res.error);
          alert("Failed to save education. See console for details.");
          return;
        }
        const updated = {
          ...entry,
          id: (res.data as DbEducationRow)?.id ?? entry.id,
        };
        setEducation((prev) =>
          prev
            .map((e) => (e.id === updated.id ? updated : e))
            .sort(
              (a, b) =>
                new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime()
            )
        );
        window.dispatchEvent(new Event("education:changed"));
      } catch (err) {
        console.error("Error saving education", err);
        alert("Failed to save education. See console for details.");
      }
    } else {
      setEducation((prev) =>
        prev
          .map((e) => (e.id === entry.id ? entry : e))
          .sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
      );
    }
    setEditingEntry(null);
  };

  const handleDelete = async (id: string) => {
    if (!loading && user) {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.deleteRow("education", { eq: { id } });
        if (res.error) {
          console.error("Failed to delete education", res.error);
          alert("Failed to delete education. See console for details.");
          return;
        }
        setEducation((prev) => prev.filter((e) => e.id !== id));
        setConfirmDeleteId(null);
        window.dispatchEvent(new Event("education:changed"));
      } catch (err) {
        console.error("Error deleting education", err);
        alert("Failed to delete education. See console for details.");
      }
    } else {
      setEducation((prev) => prev.filter((e) => e.id !== id));
      setConfirmDeleteId(null);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "education",
          // ✅ Now includes meta + enrollment_status for GPA and current status
          "id,degree_type,institution_name,field_of_study,graduation_date,start_date,gpa,honors,enrollment_status,meta",
          { order: { column: "graduation_date", ascending: false } }
        );
        if (res.error) {
          console.error("Failed to load education rows", res.error);
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];

        const dbDateToYYYYMM = (d?: string | null): string | undefined => {
          if (!d) return undefined;
          try {
            return new Date(d).toISOString().slice(0, 7);
          } catch {
            return undefined;
          }
        };

        const mapped: EducationEntry[] = (rows as DbEducationRow[]).map((r) => ({
          id: r.id ?? crypto.randomUUID(),
          degree: r.degree_type ?? "",
          institution: r.institution_name ?? "",
          fieldOfStudy: r.field_of_study ?? "",
          startDate: dbDateToYYYYMM(r.start_date) ?? "",
          endDate: dbDateToYYYYMM(r.graduation_date) ?? undefined,
          gpa: r.gpa ?? undefined,
          gpaPrivate: r.meta?.privateGpa ?? false,
          honors: r.honors ?? undefined,
          active: r.enrollment_status === "enrolled",
        }));

        if (!mounted) return;
        setEducation(
          mapped.sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        );
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading education", err);
      }
    };

    load();

    const handler = () => void load();
    window.addEventListener("education:changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("education:changed", handler);
    };
  }, [user, loading]);

  if (isLoading || loading) return <LoadingSpinner />;

  return (
    <Box p={3}>
      <Button
        variant="contained"
        sx={{ mb: 3 }}
        onClick={() => navigate("/education/manage")}
      >
        Add Education
      </Button>

      <Typography variant="h2" mb={3}>
        Education Timeline
      </Typography>

      <Timeline position="alternate">
        {education.map((edu, index) => {
          const ongoing = edu.active || !edu.endDate;
          return (
            <TimelineItem key={edu.id}>
              <TimelineOppositeContent sx={{ m: "auto 0" }}>
                <Typography variant="body2" color="text.secondary">
                  {edu.startDate} - {edu.endDate ?? "Ongoing"}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={ongoing ? "primary" : "success"} />
                {index < education.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: ongoing ? "action.hover" : "background.paper",
                    boxShadow: 3,
                    position: "relative",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    {edu.honors && (
                      <Chip
                        label={edu.honors}
                        color="secondary"
                        size="small"
                        avatar={<Avatar>🏆</Avatar>}
                      />
                    )}
                  </Stack>
                  <Typography variant="h6">{edu.degree}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {edu.institution}
                  </Typography>
                  <Typography variant="body2">
                    Field: {edu.fieldOfStudy}
                  </Typography>
                  {edu.gpa !== undefined && (
                    <Typography variant="body2">
                      {edu.gpaPrivate ? "(GPA hidden)" : `GPA: ${edu.gpa}`}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button size="small" onClick={() => setEditingEntry(edu)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirmDeleteId(edu.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>

      {/* Edit Dialog */}
      {editingEntry && (
  <Dialog open={true} onClose={() => setEditingEntry(null)} fullWidth>
    <DialogTitle>Edit Education</DialogTitle>
    <DialogContent>
      <Stack spacing={2} mt={1}>
        <TextField
          label="Degree Type"
          fullWidth
          value={editingEntry.degree}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, degree: e.target.value })
          }
        />
        <TextField
          label="Institution"
          fullWidth
          value={editingEntry.institution}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, institution: e.target.value })
          }
        />
        <TextField
          label="Field of Study"
          fullWidth
          value={editingEntry.fieldOfStudy}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, fieldOfStudy: e.target.value })
          }
        />
        <TextField
          label="Start Date (YYYY-MM)"
          fullWidth
          value={editingEntry.startDate}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, startDate: e.target.value })
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={!editingEntry.endDate}
              onChange={(e) =>
                setEditingEntry({
                  ...editingEntry,
                  endDate: e.target.checked ? undefined : editingEntry.endDate ?? "",
                })
              }
            />
          }
          label="Currently Enrolled"
        />
        <TextField
          label="End Date (YYYY-MM)"
          fullWidth
          value={editingEntry.endDate ?? ""}
          onChange={(e) =>
            setEditingEntry({
              ...editingEntry,
              endDate: e.target.value || undefined,
            })
          }
          disabled={!editingEntry.endDate && !editingEntry.startDate}
        />
        <TextField
          label="GPA (optional)"
          type="number"
          fullWidth
          value={editingEntry.gpa ?? ""}
          onChange={(e) =>
            setEditingEntry({
              ...editingEntry,
              gpa: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={editingEntry.gpaPrivate ?? false}
              onChange={(e) =>
                setEditingEntry({ ...editingEntry, gpaPrivate: e.target.checked })
              }
            />
          }
          label="Hide GPA"
        />
        <TextField
          label="Achievements / Honors"
          fullWidth
          value={editingEntry.honors ?? ""}
          onChange={(e) =>
            setEditingEntry({ ...editingEntry, honors: e.target.value })
          }
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setEditingEntry(null)}>Cancel</Button>
      <Button onClick={() => editingEntry && handleSave(editingEntry)}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
)}


      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <Dialog open={true} onClose={() => setConfirmDeleteId(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this education entry?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button color="error" onClick={() => handleDelete(confirmDeleteId)}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EducationOverview;
