import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";

interface EmploymentEntry {
  jobTitle: string;
  companyName: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

const AddEmploymentForm: React.FC = () => {
  const [formData, setFormData] = useState<EmploymentEntry>({
    jobTitle: "",
    companyName: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      ...prev,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - dynamic key from form name (kept simple for this form)
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // client-side validation
    if (!formData.jobTitle || !formData.companyName || !formData.startDate) {
      setMessage("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    if (
      !formData.isCurrent &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      setMessage("Start date must be before end date.");
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        setMessage("Please sign in before adding employment history.");
        setLoading(false);
        return;
      }

      const userCrud = crud.withUser(user.id);
      const payload = {
        job_title: formData.jobTitle,
        company_name: formData.companyName,
        location: formData.location || null,
        start_date: formData.startDate,
        end_date: formData.isCurrent ? null : formData.endDate || null,
        current_position: formData.isCurrent,
        job_description: formData.description || null,
      };

      const res = await userCrud.insertRow("employment", payload, "*");

      if (res.error) {
        console.error("Insert error:", res.error);
        setMessage(`Something went wrong: ${res.error.message}`);
        setLoading(false);
        return;
      }

      setMessage("Employment entry added successfully!");
      setFormData({
        jobTitle: "",
        companyName: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("Unexpected error. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.history.back(); // simple navigation back to employment history view
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 border rounded-2xl shadow-sm space-y-4 bg-white"
    >
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Add Employment History
      </h2>

      <input
        type="text"
        name="jobTitle"
        placeholder="Job Title *"
        value={formData.jobTitle}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="text"
        name="companyName"
        placeholder="Company Name *"
        value={formData.companyName}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="text"
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Start Date *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {!formData.isCurrent && (
          <div className="flex-1">
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isCurrent"
          checked={formData.isCurrent}
          onChange={handleChange}
        />
        <label>Current Position</label>
      </div>

      <textarea
        name="description"
        placeholder="Job Description (max 1000 characters)"
        value={formData.description}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        maxLength={1000}
      />

      <div className="flex justify-between mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>

      {message && <p className="text-center mt-3">{message}</p>}
    </form>
  );
};

export default AddEmploymentForm;
