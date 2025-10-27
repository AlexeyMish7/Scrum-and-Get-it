import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";

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
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <h3 className="text-lg font-semibold mb-3">Edit Employment</h3>

        <input
          name="job_title"
          value={formData.job_title ?? ""}
          onChange={handleChange}
          placeholder="Job Title"
          className="border p-2 w-full mb-2"
        />

        <input
          name="company_name"
          value={formData.company_name ?? ""}
          onChange={handleChange}
          placeholder="Company Name"
          className="border p-2 w-full mb-2"
        />

        <input
          name="location"
          value={formData.location ?? ""}
          onChange={handleChange}
          placeholder="Location"
          className="border p-2 w-full mb-2"
        />

        <label className="block mb-1">Start Date:</label>
        <input
          type="date"
          name="start_date"
          value={formData.start_date ?? ""}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
        />

        {!formData.is_current && (
          <>
            <label className="block mb-1">End Date:</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date ?? ""}
              onChange={handleChange}
              className="border p-2 w-full mb-2"
            />
          </>
        )}

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            name="is_current"
            checked={Boolean(formData.is_current)}
            onChange={handleChange}
          />
          Current Position
        </label>

        <textarea
          name="description"
          value={(formData.description as string) ?? ""}
          onChange={handleChange}
          placeholder="Job description (max 1000 chars)"
          maxLength={1000}
          className="border p-2 w-full mb-3"
        />

        {message && <p className="text-sm text-green-600 mb-2">{message}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
