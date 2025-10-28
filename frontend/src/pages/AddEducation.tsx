import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";
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
  DialogActions,
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

type DbEducationRow = {
  id?: string;
  institution_name?: string | null;
  degree_type?: string | null;
  field_of_study?: string | null;
  graduation_date?: string | null;
  start_date?: string | null;
  gpa?: number | null;
  honors?: string | null;
};

const degreeOptions = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Certificate",
];

const AddEducation = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
    active: false,
  });

  const [removeId, setRemoveId] = useState<string | null>(null);

  const updateField = (
    field: keyof SchoolItem,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Convert a YYYY-MM or YYYY-MM-DD string from the UI into a SQL date (YYYY-MM-DD)
  const formatToSqlDate = (v?: string | null) => {
    if (!v) return null;
    const trimmed = v.trim();
    // If user entered YYYY-MM, append -01 (first of month)
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    // If already full date, return as-is (basic validation)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // otherwise, attempt to coerce by taking first 7 chars and appending -01
    if (/^\d{4}-\d{2}/.test(trimmed)) return `${trimmed.slice(0, 7)}-01`;
    return null;
  };

  const addEntry = async () => {
    if (
      !formData.level ||
      !formData.school ||
      !formData.major ||
      !formData.start
    ) {
      alert("Required fields missing.");
      return;
    }

    // If not signed in, fall back to local behavior
    if (loading || !user) {
      const newEntry: SchoolItem = {
        ...formData,
        id: crypto.randomUUID(),
        end: formData.active ? undefined : formData.end,
      };
      setSchoolList((s) => [...s, newEntry]);
      resetForm();
      return;
    }

    try {
      const userCrud = crud.withUser(user.id);
      const payload = {
        institution_name: formData.school,
        degree_type: formData.level,
        field_of_study: formData.major,
        graduation_date: formatToSqlDate(formData.end),
        start_date: formatToSqlDate(formData.start),
        gpa: formData.gpa ?? null,
        enrollment_status: formData.active ? "enrolled" : "not_enrolled",
        education_level: undefined,
        honors: formData.awards || null,
        meta: null,
      };
      const res = await userCrud.insertRow("education", payload, "*");
      if (res.error) {
        console.error("Failed to insert education", res.error);
        alert("Failed to add education. See console for details.");
        return;
      }
      const row = res.data as DbEducationRow;
      const newEntry: SchoolItem = {
        id: row.id ?? crypto.randomUUID(),
        level: row.degree_type ?? formData.level,
        school: row.institution_name ?? formData.school,
        major: row.field_of_study ?? formData.major,
        start: row.start_date
          ? String(row.start_date).slice(0, 7)
          : String(formData.start),
        // map DB full date back to YYYY-MM for UI
        end: row.graduation_date
          ? String(row.graduation_date).slice(0, 7)
          : formData.end,
        gpa: row.gpa ?? formData.gpa,
        privateGpa: formData.privateGpa,
        awards: row.honors ?? formData.awards,
        active: formData.active,
      };
      setSchoolList((s) => [...s, newEntry]);
      // notify other parts of the app
      window.dispatchEvent(new Event("education:changed"));
      // after successful add, navigate back to the overview
      try {
        // Router defines the education overview at `/education`
        navigate("/education");
      } catch (navErr) {
        // swallow navigation errors in test/dev environments
        console.warn("Navigation failed:", navErr);
      }
      resetForm();
    } catch (err) {
      console.error("Error adding education", err);
      alert("Failed to add education. See console for details.");
    }
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
      active: false,
    });
  };

  const deleteEntry = async () => {
    if (!removeId) return;
    // If not signed in, local-only
    if (loading || !user) {
      setSchoolList((s) => s.filter((item) => item.id !== removeId));
      setRemoveId(null);
      return;
    }

    try {
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.deleteRow("education", {
        eq: { id: removeId },
      });
      if (res.error) {
        console.error("Failed to delete education", res.error);
        alert("Failed to delete education. See console for details.");
        return;
      }
      setSchoolList((s) => s.filter((item) => item.id !== removeId));
      setRemoveId(null);
      window.dispatchEvent(new Event("education:changed"));
    } catch (err) {
      console.error("Error deleting education", err);
      alert("Failed to delete education. See console for details.");
    }
  };

  // Load persisted education rows for current user
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let mounted = true;
    const load = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "education",
          "id,institution_name,degree_type,field_of_study,graduation_date,gpa,education_level,honors"
        );
        if (res.error) {
          console.error("Failed to load education rows", res.error);
          return;
        }
        const rows = Array.isArray(res.data) ? res.data : [res.data];
        const mapped: SchoolItem[] = (rows as DbEducationRow[]).map((r) => ({
          id: r.id ?? crypto.randomUUID(),
          level: r.degree_type ?? "",
          school: r.institution_name ?? "",
          major: r.field_of_study ?? "",
          start: r.start_date ? String(r.start_date).slice(0, 7) : "",
          // normalize DB date to YYYY-MM for the UI (remove day)
          end: r.graduation_date
            ? String(r.graduation_date).slice(0, 7)
            : undefined,
          gpa: r.gpa ?? undefined,
          privateGpa: false,
          awards: r.honors ?? "",
          active: !(r.graduation_date ?? null),
        }));
        if (!mounted) return;
        setSchoolList(mapped);
      } catch (err) {
        console.error("Error loading education", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, loading]);

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
          label="Degree Type"
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
            updateField(
              "gpa",
              e.target.value ? parseFloat(e.target.value) : undefined
            )
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
        <DialogContent>
          Are you sure you want to remove this education entry?
        </DialogContent>
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
