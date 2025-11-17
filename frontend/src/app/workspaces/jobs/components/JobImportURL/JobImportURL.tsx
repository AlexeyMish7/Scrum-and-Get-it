import { useState } from "react";
import { TextField, Button, CircularProgress, Box } from "@mui/material";
import axios from "axios";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

// Allow a flexible payload since different scrapers/sites may return varied fields
type ImportPayload = Record<string, unknown>;

type Props = {
  onImport: (data: ImportPayload) => void;
};

export default function JobImportURL({ onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<null | {
    status: "success" | "partial" | "failed";
    fields: { title: boolean; company: boolean; description: boolean };
    message?: string;
  }>(null);
  const { handleError, showSuccess } = useErrorHandler();

  async function validateUrl(v: string) {
    try {
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
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
        | string
        | undefined;
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

      // Expecting { data: { job_title?, company_name?, job_description?, ... } }
      const parsed = (resp?.data?.data ?? resp?.data ?? {}) as Record<
        string,
        unknown
      >;
      // raw parsed object received from the Edge Function

      const jobTitle = String(
        parsed.job_title ?? parsed.title ?? parsed.position ?? ""
      ).trim();
      const company = String(
        parsed.company_name ?? parsed.company ?? parsed.employer ?? ""
      ).trim();
      const rawDescription = String(
        parsed.job_description ?? parsed.description ?? ""
      ).trim();
      const truncated = rawDescription.length > 2000;
      const description = rawDescription.slice(0, 2000);

      // Helper: parse salary string like "$80,000 - $120,000" or "80k-120k" into numbers
      const parseSalary = (s: string | undefined) => {
        if (!s || typeof s !== "string") return null;
        // find numbers with optional $ and commas/decimals
        const re =
          /[$£€]?\s*([0-9]{1,3}(?:[,0-9]{0,})?(?:\.\d+)?)(?:\s*(k|K))?/g;
        const nums: number[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(s))) {
          const n = m[1];
          const scale = m[2];
          let val = parseFloat(n.replace(/,/g, ""));
          if (!Number.isFinite(val)) continue;
          if (scale && /k/i.test(scale)) val = val * 1000;
          nums.push(val);
        }
        if (nums.length === 0) return null;
        if (nums.length === 1) return { min: nums[0], max: nums[0] };
        return { min: Math.min(...nums), max: Math.max(...nums) };
      };

      // Helper: try to extract a date-like substring and return ISO date string or null
      const parseDeadline = (s: string | undefined) => {
        if (!s || typeof s !== "string") return null;
        // quick attempt: if Date.parse works, use it
        const tryDate = (txt: string) => {
          const d = Date.parse(txt);
          if (!Number.isNaN(d)) return new Date(d).toISOString();
          return null;
        };
        const direct = tryDate(s);
        if (direct) return direct;
        // look for common formats: Month dd, yyyy or dd Month yyyy or mm/dd/yyyy
        const monthNameRe =
          /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b[^\n,]{0,30}\d{1,2},?\s*\d{4}/i;
        const numericRe = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/;
        const m1 = s.match(monthNameRe);
        if (m1) {
          const d = tryDate(m1[0]);
          if (d) return d;
        }
        const m2 = s.match(numericRe);
        if (m2) {
          const d = tryDate(m2[0]);
          if (d) return d;
        }
        // fallback: look for words like "Apply by" and take following chunk
        const applyBy = /apply by[:\s]*([^\n]+)/i.exec(s);
        if (applyBy && applyBy[1]) {
          const d = tryDate(applyBy[1].trim());
          if (d) return d;
        }
        return null;
      };

      // Normalize location into city & state when possible
      let locationCity: string | undefined = undefined;
      let locationState: string | undefined = undefined;
      if (parsed.location && typeof parsed.location === "string") {
        const parts = parsed.location
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (parts.length >= 2) {
          locationCity = parts.slice(0, parts.length - 1).join(", ");
          locationState = parts[parts.length - 1];
        } else if (parts.length === 1) {
          locationCity = parts[0];
        }
      } else if (parsed.location && typeof parsed.location === "object") {
        locationCity =
          parsed.location.city ?? parsed.location_city ?? locationCity;
        locationState =
          parsed.location.state ?? parsed.location_state ?? locationState;
      }

      // Build final normalized payload to pass to parent onImport.
      const finalData: Record<string, unknown> = { ...(parsed || {}) };
      finalData.job_title = jobTitle || finalData.job_title;
      finalData.company_name = company || finalData.company_name;
      // Ensure the description is the truncated version we want the form to receive
      finalData.job_description = description || finalData.job_description;
      // Normalize salary: if we got a salary string, try to extract numeric min/max
      try {
        const sal = String(finalData.salary ?? parsed.salary ?? "").trim();
        const parsedSalary = parseSalary(sal);
        if (parsedSalary) {
          finalData.salary = { min: parsedSalary.min, max: parsedSalary.max };
          finalData.salary_start = finalData.salary_start ?? parsedSalary.min;
          finalData.salary_end = finalData.salary_end ?? parsedSalary.max;
        }
      } catch (_e) {
        // ignore salary parse failures
      }

      // Normalize deadline: try to parse to ISO string and expose as `deadline`
      try {
        const rawDeadline = String(
          finalData.deadline ?? parsed.deadline ?? ""
        ).trim();
        const iso = parseDeadline(rawDeadline) || null;
        if (iso) {
          finalData.deadline = iso;
          finalData.application_deadline = iso;
        }
      } catch (_e) {
        // ignore
      }
      // Populate both the generic keys (location_city/location_state) and the exact
      // form keys used by NewJobPage (city_name/state_code) to avoid any mismatch.
      if (locationCity) {
        finalData.location_city = locationCity;
        finalData.city_name = finalData.city_name ?? locationCity;
      }
      if (locationState) {
        finalData.location_state = locationState;
        finalData.state_code = finalData.state_code ?? locationState;
      }
      // also expose a location object for convenience
      finalData.location = finalData.location ?? {
        city: finalData.location_city,
        state: finalData.location_state,
      };
      // Ensure job_link is present so the form shows the source URL
      finalData.job_link = finalData.job_link ?? url;
      // Expose whether the description was truncated so callers can display a hint
      finalData.job_description_truncated = truncated;

      // normalized final data ready for the form

      const returnedKeys = Object.keys(finalData).filter(
        (k) =>
          finalData[k] !== undefined &&
          finalData[k] !== null &&
          String(finalData[k]).toString().trim() !== ""
      );

      const hasTitle = Boolean(
        finalData.job_title && String(finalData.job_title).trim()
      );
      const hasCompany = Boolean(
        finalData.company_name && String(finalData.company_name).trim()
      );
      const hasDescription = Boolean(
        finalData.job_description && String(finalData.job_description).trim()
      );

      if (!hasTitle && !hasCompany && !hasDescription) {
        const msg =
          "Could not extract job data from this URL (function returned empty).";
        setImportResult({
          status: "failed",
          fields: { title: false, company: false, description: false },
          message: msg,
        });
        handleError(msg);
      } else {
        onImport(finalData);
        const all = hasTitle && hasCompany && hasDescription;
        const status = all ? "success" : "partial";
        setImportResult({
          status: status as "success" | "partial",
          fields: {
            title: hasTitle,
            company: hasCompany,
            description: hasDescription,
          },
        });

        let msg = "Imported job data";
        if (returnedKeys.length > 0)
          msg += ` (fields: ${returnedKeys.join(", ")})`;
        if (truncated) msg += ". Description truncated to 2000 chars.";
        showSuccess(msg);
      }
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        response?: { data?: { error?: string } };
      };
      setImportResult({
        status: "failed",
        fields: { title: false, company: false, description: false },
        message: String(error?.message ?? "Import failed"),
      });
      console.error("JobImportURL error", err);
      const msg =
        error?.response?.data?.error ??
        error?.message ??
        "Failed to fetch job. Make sure the URL is correct.";
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
        onChange={(e) => {
          setUrl(e.target.value);
          // clear previous import status when the user edits the URL
          setImportResult(null);
        }}
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

      {/* Import status summary: show which fields were found */}
      {importResult && (
        <Box
          sx={{ ml: 2, display: "flex", gap: 2, alignItems: "center" }}
          aria-live="polite"
        >
          <Box
            sx={{
              fontSize: 13,
              color:
                importResult.status === "failed"
                  ? "error.main"
                  : importResult.status === "success"
                  ? "success.main"
                  : "text.primary",
            }}
          >
            {importResult.status === "success"
              ? "Import: success"
              : importResult.status === "partial"
              ? "Import: partial"
              : "Import: failed"}
          </Box>
          <Box
            sx={{
              fontSize: 13,
              color: importResult.fields.title
                ? "success.main"
                : "text.secondary",
            }}
          >
            Title {importResult.fields.title ? "✓" : "✕"}
          </Box>
          <Box
            sx={{
              fontSize: 13,
              color: importResult.fields.company
                ? "success.main"
                : "text.secondary",
            }}
          >
            Company {importResult.fields.company ? "✓" : "✕"}
          </Box>
          <Box
            sx={{
              fontSize: 13,
              color: importResult.fields.description
                ? "success.main"
                : "text.secondary",
            }}
          >
            Description {importResult.fields.description ? "✓" : "✕"}
          </Box>
        </Box>
      )}
    </Box>
  );
}
