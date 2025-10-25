import React, { useState } from "react";
import { supabase } from "../supabaseClient"; 

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

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
  if (!formData.isCurrent && formData.endDate && formData.startDate > formData.endDate) {
    setMessage("Start date must be before end date.");
    setLoading(false);
    return;
  }

  try {
    // DEBUG: show env (only for local debugging — don't commit this)
    console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("SUPABASE_ANON_KEY set?:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    // Get current user (v2)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) console.warn("getUser error:", userErr);
    const user = userData?.user ?? null;
    console.log("current user:", user);

    // If your table uses user_id in RLS, require login
    if (!user) {
      setMessage("Please sign in before adding employment history.");
      setLoading(false);
      return;
    }

    const payload: any = {
      job_title: formData.jobTitle,
      company_name: formData.companyName,
      location: formData.location || null,
      start_date: formData.startDate,
      end_date: formData.isCurrent ? null : (formData.endDate || null),
      is_current: formData.isCurrent,
      description: formData.description || null,
      user_id: user.id, // include user_id if RLS requires it
    };

    console.log("Attempting insert payload:", payload);

    const { data, error } = await supabase
      .from("employment_history")
      .insert([payload])
      .select(); // return inserted row for debugging

    if (error) {
      console.error("Supabase insert error:", error);
      setMessage(`Something went wrong: ${error.message}`);
      setLoading(false);
      return;
    }

    console.log("Insert response data:", data);
    setMessage(" Employment entry added successfully!");
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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 border rounded-2xl shadow-sm space-y-4 bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-center">Add Employment History</h2>

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
