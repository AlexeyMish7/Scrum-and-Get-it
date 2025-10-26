import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

type SchoolItem = {
  id: string;
  level: string;
  school: string;
  major: string;
  start: string;
  end?: string;
  gpa?: number;
  privateGpa?: boolean;
  awards?: string;
  active?: boolean;
};

const degreeOptions = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Certificate"
];

const AddEducation = () => {
  const [schoolList, setSchoolList] = useState<SchoolItem[]>([]);
  const [formData, setFormData] = useState<SchoolItem>({
    id: "",
    level: "",
    school: "",
    major: "",
    start: "",
    end: "",
    gpa: undefined,
    privateGpa: false,
    awards: "",
    active: false
  });

  const [removeId, setRemoveId] = useState<string | null>(null);

  const updateField = (field: keyof SchoolItem, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addEntry = () => {
    if (!formData.level || !formData.school || !formData.major || !formData.start) {
      alert("Required fields missing.");
      return;
    }

    const newEntry: SchoolItem = {
      ...formData,
      id: crypto.randomUUID(),
      end: formData.active ? undefined : formData.end
    };

    setSchoolList([...schoolList, newEntry]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: "",
      level: "",
      school: "",
      major: "",
      start: "",
      end: "",
      gpa: undefined,
      privateGpa: false,
      awards: "",
      active: false
    });
  };


  const deleteEntry = () => {
    if (removeId) {
      setSchoolList(schoolList.filter((item) => item.id !== removeId));
      setRemoveId(null);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={2} textAlign="center">
        Education Manager
      </Typography>


      {/* Form Fields */}
      <Stack spacing={2} mb={3}>
        {/* Dropdown */}
        <TextField
          select
          label="Education Level"
          value={formData.level}
          onChange={(e) => updateField("level", e.target.value)}
        >
          {degreeOptions.map((degree) => (
            <MenuItem key={degree} value={degree}>
              {degree}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Institution"
          value={formData.school}
          onChange={(e) => updateField("school", e.target.value)}
        />

        <TextField
          label="Field of Study"
          value={formData.major}
          onChange={(e) => updateField("major", e.target.value)}
        />

        <TextField
          label="Start Date (YYYY-MM)"
          value={formData.start}
          onChange={(e) => updateField("start", e.target.value)}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.active}
              onChange={(e) => updateField("active", e.target.checked)}
            />
          }
          label="Currently Enrolled"
        />

        {!formData.active && (
          <TextField
            label="End Date (YYYY-MM)"
            value={formData.end}
            onChange={(e) => updateField("end", e.target.value)}
          />
        )}

        <TextField
          label="GPA (optional)"
          type="number"
          value={formData.gpa ?? ""}
          onChange={(e) =>
            updateField("gpa", e.target.value ? parseFloat(e.target.value) : undefined)
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.privateGpa ?? false}
              onChange={(e) => updateField("privateGpa", e.target.checked)}
            />
          }
          label="Hide GPA"
        />

        <TextField
          label="Achievements / Honors"
          value={formData.awards}
          onChange={(e) => updateField("awards", e.target.value)}
        />

        <Button variant="contained" onClick={addEntry}>
          Add Education
        </Button>
      </Stack>

      {/* Education Entries Display */}
      <Stack spacing={2}>
        {schoolList.map((item) => (
          <Stack key={item.id} direction="row" spacing={2} alignItems="center">
            <Typography>
              {item.level} @ {item.school} — {item.major}
            </Typography>
            <Button color="error" onClick={() => setRemoveId(item.id)}>
              Remove
            </Button>
          </Stack>
        ))}
      </Stack>

      {/* Delete Confirmation */}
      <Dialog open={!!removeId} onClose={() => setRemoveId(null)}>
        <DialogTitle>Delete entry?</DialogTitle>
        <DialogContent>Are you sure you want to remove this education entry?</DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveId(null)}>Cancel</Button>
          <Button color="error" onClick={deleteEntry}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddEducation;
