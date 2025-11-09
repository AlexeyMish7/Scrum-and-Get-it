import { useState } from "react";
import { TextField, Button, CircularProgress, Box } from "@mui/material";
import axios from "axios";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

type ImportPayload = {
  job_title?: string;
  company_name?: string;
  job_description?: string;
};

type Props = {
  onImport: (data: ImportPayload) => void;
};

export default function JobImportURL({ onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleError, showSuccess } = useErrorHandler();

  async function validateUrl(v: string) {
    try {
      // eslint-disable-next-line no-new
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }

  const handleImport = async () => {
    if (!url) return handleError("Please enter a job posting URL");
    const ok = await validateUrl(url);
    if (!ok) return handleError("Please enter a valid URL");

    setLoading(true);
    try {
      // Call the Supabase Edge Function which will proxy to ZenRows and return parsed JSON
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");

      const fnUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/import-job`;
      const resp = await axios.post(
        fnUrl,
        { url },
        {
          headers: {
            "Content-Type": "application/json",
            ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
          },
          timeout: 20000,
        }
      );

      // Expecting { data: { job_title?, company_name?, job_description? } }
      const parsed = resp?.data?.data ?? resp?.data ?? {};
      const jobTitle = String(parsed.job_title ?? parsed.title ?? "").trim();
      const company = String(parsed.company_name ?? parsed.company ?? "").trim();
      const description = String(parsed.job_description ?? parsed.description ?? "").trim();

      if (!jobTitle && !company && !description) {
        handleError("Could not extract job data from this URL (function returned empty).");
      } else {
        onImport({ job_title: jobTitle, company_name: company, job_description: description });
        showSuccess("Imported job data");
      }
    } catch (err: any) {
      console.error("JobImportURL error", err);
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to fetch job. Make sure the URL is correct.";
      handleError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
      <TextField
        label="Job Posting URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
      />
      <Button
        variant="contained"
        onClick={handleImport}
        disabled={loading}
        sx={{ minWidth: 120 }}
      >
        {loading ? <CircularProgress size={20} /> : "Import"}
      </Button>
    </Box>
  );
}
