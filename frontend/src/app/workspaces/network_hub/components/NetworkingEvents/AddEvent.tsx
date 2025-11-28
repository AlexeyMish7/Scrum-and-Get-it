import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import {
  createNetworkingEvent,
  updateNetworkingEvent,
} from "@shared/services/dbMappers";

interface Props {
  onSaved?: () => void;
  initial?: Record<string, unknown> | null;
  editId?: string | null;
  children?: React.ReactNode;
}

export default function AddEvent({ onSaved, initial = null, editId = null, children }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Record<string, unknown>>({
    name: "",
    industry: "",
    location: "",
    url: "",
    start_time: "",
    end_time: "",
    goals: "",
    research_notes: "",
    preparation_notes: "",
    attended: false,
  });

  useEffect(() => {
    if (initial) {
      const mapped = { ...(initial as Record<string, unknown>) };

      const toLocalInput = (val: unknown) => {
        if (!val) return "";
        const d = new Date(String(val));
        if (Number.isNaN(d.getTime())) return String(val ?? "");
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      if (mapped.start_time) mapped.start_time = toLocalInput(mapped.start_time);
      if (mapped.end_time) mapped.end_time = toLocalInput(mapped.end_time);

      setForm((f) => ({ ...f, ...mapped }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function openDialog() {
    setOpen(true);
  }
  function closeDialog() {
    setOpen(false);
  }

  function handleChange(key: string, value: unknown) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      if (editId) {
        await updateNetworkingEvent(user.id, editId, form);
      } else {
        await createNetworkingEvent(user.id, form);
      }
      onSaved?.();
      closeDialog();
    } catch (err) {
      // swallow - callers can surface errors later
      // console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <span onClick={openDialog}>{children ?? <Button variant="contained">Add Event</Button>}</span>

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Event" : "Add Networking Event"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={(form.name as string) ?? ""}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
            />
            <TextField
              label="Industry"
              value={(form.industry as string) ?? ""}
              onChange={(e) => handleChange("industry", e.target.value)}
              fullWidth
            />
            <TextField
              label="Location"
              value={(form.location as string) ?? ""}
              onChange={(e) => handleChange("location", e.target.value)}
              fullWidth
            />
            <TextField
              label="URL"
              value={(form.url as string) ?? ""}
              onChange={(e) => handleChange("url", e.target.value)}
              fullWidth
            />

            <TextField
              label="Start"
              type="datetime-local"
              value={(form.start_time as string) ?? ""}
              onChange={(e) => handleChange("start_time", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="End"
              type="datetime-local"
              value={(form.end_time as string) ?? ""}
              onChange={(e) => handleChange("end_time", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Goals"
              value={(form.goals as string) ?? ""}
              onChange={(e) => handleChange("goals", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Research Notes"
              value={(form.research_notes as string) ?? ""}
              onChange={(e) => handleChange("research_notes", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Preparation Notes"
              value={(form.preparation_notes as string) ?? ""}
              onChange={(e) => handleChange("preparation_notes", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.attended)}
                  onChange={(e) => handleChange("attended", e.target.checked)}
                />
              }
              label="Attended"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="contained">
            {editId ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
//This should be a button that opens up a pop up dialog where a user can enter information about the networking event
//All of this information should be saved in the network_events tables in the database
//Users will be able to add the name, industry, start date (date and time)calendar display, end date (date and time)calendar dislplay, 
//location, research_notes, preparation_notes, and goals for the event 
