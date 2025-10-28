import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";
import EditEmploymentModal from "./EditEmploymentModal";
import { Button, Typography, Box } from "@mui/material";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

interface EmploymentEntry {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

export default function EmploymentHistoryList() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<EmploymentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<EmploymentEntry | null>(
    null
  );
  const navigate = useNavigate(); //

  const fetchEntries = useCallback(async () => {
    if (loading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.listRows("employment", "*", {
        order: { column: "start_date", ascending: false },
      });

      if (res.error) {
        console.error("fetchEntries error:", res.error);
        setEntries([]);
      } else {
        const rows = (res.data ?? []) as Array<Record<string, unknown>>;
        const mapped = rows.map((r) => ({
          id: r.id,
          job_title: r.job_title,
          company_name: r.company_name,
          location: r.location,
          start_date: r.start_date,
          end_date: r.end_date,
          is_current: r.current_position ?? false,
          description: r.job_description ?? "",
        })) as EmploymentEntry[];
        setEntries(mapped);
      }
    } catch (e) {
      console.error("Unexpected fetchEntries error", e);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, loading]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  if (isLoading || loading) return <LoadingSpinner />;

  const handleDelete = async (entryId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (!confirmed) return;

    if (!user) {
      alert("Please sign in to delete entries.");
      return;
    }

    try {
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.deleteRow("employment", {
        eq: { id: entryId },
      });
      if (res.error) {
        console.error(res.error);
        alert("Something went wrong. Please try again.");
      } else {
        alert("Employment entry deleted successfully!");
        fetchEntries(); // refresh list immediately
      }
    } catch (e) {
      console.error("Delete failed", e);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="p-6">
      {/* ✅ Header + Add Button Row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h2" gutterBottom>
          Employment History
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/add-employment")}
        >
          Add Employment
        </Button>
      </Box>

      {entries.length === 0 && (
        <Typography variant="body1">No employment entries yet.</Typography>
      )}

      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="h5">
                  {entry.job_title} @ {entry.company_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.location} •{" "}
                  {entry.is_current
                    ? "Present"
                    : `${entry.start_date} – ${entry.end_date}`}
                </Typography>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setEditingEntry(entry)}
                >
                  Edit
                </Button>

                {/* Only show delete if more than one entry */}
                {entries.length > 1 && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {entry.description && (
              <Typography variant="body1" className="mt-2" color="text.primary">
                Job Description: {entry.description}
              </Typography>
            )}
          </li>
        ))}
      </ul>

      {editingEntry && (
        <EditEmploymentModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={() => {
            setEditingEntry(null);
            fetchEntries();
          }}
        />
      )}
    </div>
  );
}
