import React, { useState } from "react";
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
};

const initialEducation: EducationEntry[] = [
  {
    id: "1",
    degree: "Master of Science",
    institution: "MIT",
    fieldOfStudy: "Computer Science",
    startDate: "09/2022",
    endDate: "06/2024",
    gpa: 3.9,
    gpaPrivate: false,
    honors: "Dean's List",
  },
  {
    id: "2",
    degree: "Bachelor of Science",
    institution: "UC Berkeley",
    fieldOfStudy: "Software Engineering",
    startDate: "09/2018",
    endDate: "06/2022",
    gpa: 3.8,
    gpaPrivate: true,
  },
  {
    id: "3",
    degree: "Certificate in AI",
    institution: "Coursera",
    fieldOfStudy: "Machine Learning",
    startDate: "01/2023",
  },
];

const EducationOverview: React.FC = () => {
  const [education, setEducation] = useState<EducationEntry[]>(
    initialEducation.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
  );

  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = (entry: EducationEntry) => {
    setEducation((prev) =>
      prev.map((e) => (e.id === entry.id ? entry : e)).sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
    );
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    setEducation((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Education Timeline
      </Typography>

      <Timeline position="alternate">
        {education.map((edu, index) => {
          const ongoing = !edu.endDate;
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
                  <Typography variant="body2">Field: {edu.fieldOfStudy}</Typography>
                  {edu.gpa !== undefined && !edu.gpaPrivate && (
                    <Typography variant="body2">GPA: {edu.gpa}</Typography>
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
                label="Degree"
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
              />
              <TextField
                label="GPA"
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
                label="Honors/Achievements"
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

      {/* Delete Confirmation Dialog */}
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