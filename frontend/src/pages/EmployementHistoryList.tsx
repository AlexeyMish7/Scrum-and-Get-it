import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";
import EditEmploymentModal from "./EditEmploymentModal";

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
  const [editingEntry, setEditingEntry] = useState<EmploymentEntry | null>(
    null
  );

  const fetchEntries = useCallback(async () => {
    if (loading) return;
    if (!user) {
      setEntries([]);
      return;
    }

    try {
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.listRows("employment", "*", {
        order: { column: "start_date", ascending: false },
      });

      if (res.error) {
        console.error("fetchEntries error:", res.error);
        setEntries([]);
      } else {
        // Map DB shape (current_position, job_description) to frontend shape (is_current, description)
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
    }
  }, [user, loading]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

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
      <h2 className="text-xl font-bold mb-4">Employment History</h2>
      {entries.length === 0 && <p>No employment entries yet.</p>}

      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">
                  {entry.job_title} @ {entry.company_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {entry.location} •{" "}
                  {entry.is_current
                    ? "Present"
                    : `${entry.start_date} – ${entry.end_date}`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEntry(entry)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>

                {/* Only show delete if more than one entry */}
                {entries.length > 1 && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {entry.description && (
              <p className="mt-2 text-gray-700">{entry.description}</p>
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
