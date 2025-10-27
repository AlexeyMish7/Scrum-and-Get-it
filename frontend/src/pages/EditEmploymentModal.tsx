import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";
import {
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";

type EmploymentFormData = {
  id?: string;
  job_title?: string | null;
  company_name?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
};

interface Props {
  entry: EmploymentFormData;
  onClose: () => void;
  onSave: () => void;
}

export default function EditEmploymentModal({ entry, onClose, onSave }: Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EmploymentFormData>(entry);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const name =
      (target as HTMLInputElement).name || (target as HTMLTextAreaElement).name;
    const value =
      (target as HTMLInputElement).value ??
      (target as HTMLTextAreaElement).value;
    const type = (target as HTMLInputElement).type ?? "text";
    const checked = (target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...(prev as EmploymentFormData),
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!user) {
        setMessage("Please sign in to save changes.");
        setLoading(false);
        return;
      }

      const userCrud = crud.withUser(user.id);
      const payload = {
        job_title: formData.job_title,
        company_name: formData.company_name,
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date,
        current_position: formData.is_current,
        job_description: formData.description,
      };

      if (!entry.id) {
        setMessage("Missing entry id. Cannot save changes.");
        setLoading(false);
        return;
      }

      const res = await userCrud.updateRow("employment", payload, {
        eq: { id: entry.id },
      });
      setLoading(false);

      if (res.error) {
        console.error(res.error);
        setMessage("Something went wrong. Please try again.");
      } else {
        setMessage("Changes saved successfully!");
        onSave();
      }
    } catch (e) {
      console.error(e);
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <Box className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <Typography variant="h5" gutterBottom>
          Edit Employment
        </Typography>

        <TextField
          name="job_title"
          label="Job Title"
          value={formData.job_title ?? ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          name="company_name"
          label="Company Name"
          value={formData.company_name ?? ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          name="location"
          label="Location"
          value={formData.location ?? ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Start Date:
        </Typography>
        <TextField
          type="date"
          name="start_date"
          value={formData.start_date ?? ""}
          onChange={handleChange}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
        />

        {!formData.is_current && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              End Date:
            </Typography>
            <TextField
              type="date"
              name="end_date"
              value={formData.end_date ?? ""}
              onChange={handleChange}
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}

        <FormControlLabel
          control={
            <Checkbox
              name="is_current"
              checked={Boolean(formData.is_current)}
              onChange={handleChange}
              color="primary"
            />
          }
          label="Current Position"
          sx={{ mt: 1 }}
        />

        <TextField
          name="description"
          label="Job Description"
          value={(formData.description as string) ?? ""}
          onChange={handleChange}
          multiline
          rows={3}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 1000 }}
        />

        {message && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}

        <Box className="flex justify-end gap-2 mt-3">
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </div>
  );
}
