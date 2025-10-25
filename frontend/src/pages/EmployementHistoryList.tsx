import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
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
  const [entries, setEntries] = useState<EmploymentEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EmploymentEntry | null>(null);

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("employment_history")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) console.error(error);
    else setEntries(data || []);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (entryId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("employment_history")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } else {
      alert("Employment entry deleted successfully!");
      fetchEntries(); // refresh list immediately
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
                  {entry.location} • {entry.is_current ? "Present" : `${entry.start_date} – ${entry.end_date}`}
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
