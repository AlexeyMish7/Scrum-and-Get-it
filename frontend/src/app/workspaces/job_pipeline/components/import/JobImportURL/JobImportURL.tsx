/**
 * JobImportURL Component
 *
 * AI-powered job posting URL importer.
 * Extracts job details from job posting URLs using backend AI endpoint.
 *
 * Features:
 * - URL input with validation
 * - AI extraction with loading state
 * - Confidence score display
 * - Extracted data preview
 * - Retry on failure
 * - Auto-fill parent form on success
 *
 * Flow:
 * 1. User pastes job posting URL
 * 2. Click "Import" triggers AI extraction
 * 3. Backend fetches HTML + AI extraction
 * 4. Display extracted data with confidence badge
 * 5. User reviews and clicks "Apply to Form"
 * 6. Parent form fields pre-filled
 *
 * API: POST /api/generate/job-import
 */

import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
  Stack,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { toApiUrl } from "@shared/services/apiUrl";

/**
 * Extracted job data structure (matches backend API)
 */
interface ExtractedJobData {
  job_title?: string | null;
  company_name?: string | null;
  street_address?: string | null;
  city_name?: string | null;
  state_code?: string | null;
  zipcode?: string | null;
  start_salary_range?: number | null;
  end_salary_range?: number | null;
  job_description?: string | null;
  industry?: string | null;
  job_type?: string | null;
  requirements?: string[] | null;
  qualifications?: string[] | null;
  benefits?: string[] | null;
}

/**
 * API response structure
 */
interface JobImportResponse {
  jobData: ExtractedJobData;
  meta: {
    source: "ai";
    confidence: number;
    url: string;
    latency_ms: number;
    extraction?: {
      strategy: string; // "fetch-basic" | "fetch-headers" | "puppeteer-browser"
      retries: number;
      latency_ms: number;
    };
  };
}

// Allow a flexible payload since different scrapers/sites may return varied fields
type ImportPayload = Record<string, unknown>;

type Props = {
  onImport: (data: ImportPayload) => void;
};

export default function JobImportURL({ onImport }: Props) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobImportResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Validate URL format
   */
  const isValidUrl = (urlString: string): boolean => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  /**
   * Get confidence color and icon based on score
   */
  const getConfidenceDisplay = (
    confidence: number
  ): {
    color: "success" | "warning" | "error";
    icon: JSX.Element;
    label: string;
  } => {
    if (confidence >= 70) {
      return {
        color: "success",
        icon: <CheckCircleIcon fontSize="small" />,
        label: "High confidence",
      };
    } else if (confidence >= 40) {
      return {
        color: "warning",
        icon: <WarningIcon fontSize="small" />,
        label: "Medium confidence",
      };
    } else {
      return {
        color: "error",
        icon: <ErrorIcon fontSize="small" />,
        label: "Low confidence",
      };
    }
  };

  /**
   * Call backend AI import endpoint
   */
  const handleImport = async (forceBrowser: boolean = false) => {
    // Validation
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError(
        "Please enter a valid URL (must start with http:// or https://)"
      );
      return;
    }

    if (!user?.id) {
      setError("You must be signed in to import jobs");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call backend AI endpoint
      const response = await fetch(toApiUrl("/api/generate/job-import"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id,
        },
        body: JSON.stringify({
          url: url.trim(),
          options: {
            forceStrategy: forceBrowser ? "puppeteer" : undefined,
            maxRetries: 3,
            verbose: false,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: JobImportResponse = await response.json();
      setResult(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import job posting";
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply extracted data to parent form
   */
  const handleApplyToForm = () => {
    if (!result) return;

    const { jobData } = result;

    // Transform to parent form format
    const formData: Record<string, unknown> = {
      job_title: jobData.job_title || "",
      company_name: jobData.company_name || "",
      street_address: jobData.street_address || "",
      city_name: jobData.city_name || "",
      state_code: jobData.state_code || "",
      zipcode: jobData.zipcode || "",
      start_salary_range: jobData.start_salary_range || "",
      end_salary_range: jobData.end_salary_range || "",
      job_description: jobData.job_description || "",
      industry: jobData.industry || "",
      job_type: jobData.job_type || "",
      job_link: result.meta.url || url,
    };

    onImport(formData);

    // Reset state
    setUrl("");
    setResult(null);
    setError(null);
  };

  /**
   * Retry import with same URL
   */
  const handleRetry = () => {
    setError(null);
    setResult(null);
    handleImport(false);
  };

  /**
   * Force browser mode (for sites that block basic requests)
   */
  const handleRetryWithBrowser = () => {
    setError(null);
    setResult(null);
    handleImport(true);
  };

  return (
    <Box>
      {/* URL Input Section */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="Job Posting URL"
          placeholder="https://jobs.example.com/position/123"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleImport();
            }
          }}
          InputProps={{
            startAdornment: (
              <LinkIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
          error={!!error && !result}
          helperText={
            error && !result
              ? error
              : "Paste a link to a job posting (LinkedIn, Indeed, company website, etc.)"
          }
        />
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : "Import"}
        </Button>
      </Box>

      {/* Loading State */}
      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">
              Extracting job details with AI... This may take a few seconds.
            </Typography>
          </Stack>
        </Alert>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
              {retryCount > 0 && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetryWithBrowser}
                >
                  Try Browser Mode
                </Button>
              )}
            </Stack>
          }
        >
          {error}
          {retryCount > 1 && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Having trouble? Try "Browser Mode" for sites that block automated
              requests.
            </Typography>
          )}
        </Alert>
      )}

      {/* Success: Extracted Data Preview */}
      {result && !loading && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {/* Confidence Badge */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Extracted Data
            </Typography>
            <Chip
              size="small"
              label={`${result.meta.confidence}% ${
                getConfidenceDisplay(result.meta.confidence).label
              }`}
              color={getConfidenceDisplay(result.meta.confidence).color}
              icon={getConfidenceDisplay(result.meta.confidence).icon}
            />
          </Box>

          {/* Extracted Fields */}
          <Stack spacing={1.5}>
            {result.jobData.job_title && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Job Title
                </Typography>
                <Typography variant="body2">
                  {result.jobData.job_title}
                </Typography>
              </Box>
            )}

            {result.jobData.company_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body2">
                  {result.jobData.company_name}
                </Typography>
              </Box>
            )}

            {(result.jobData.city_name || result.jobData.state_code) && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2">
                  {[result.jobData.city_name, result.jobData.state_code]
                    .filter(Boolean)
                    .join(", ")}
                </Typography>
              </Box>
            )}

            {(result.jobData.start_salary_range ||
              result.jobData.end_salary_range) && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Salary Range
                </Typography>
                <Typography variant="body2">
                  {result.jobData.start_salary_range &&
                    `$${result.jobData.start_salary_range.toLocaleString()}`}
                  {result.jobData.start_salary_range &&
                    result.jobData.end_salary_range &&
                    " - "}
                  {result.jobData.end_salary_range &&
                    `$${result.jobData.end_salary_range.toLocaleString()}`}
                </Typography>
              </Box>
            )}

            {result.jobData.job_type && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Job Type
                </Typography>
                <Typography variant="body2">
                  {result.jobData.job_type}
                </Typography>
              </Box>
            )}

            {result.jobData.industry && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Industry
                </Typography>
                <Typography variant="body2">
                  {result.jobData.industry}
                </Typography>
              </Box>
            )}

            {result.jobData.job_description && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    maxHeight: 100,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result.jobData.job_description.substring(0, 300)}
                  {result.jobData.job_description.length > 300 && "..."}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={() => {
                setUrl("");
                setResult(null);
                setError(null);
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyToForm}
              startIcon={<CheckCircleIcon />}
            >
              Apply to Form
            </Button>
          </Box>

          {/* Extraction Method Info */}
          {result.meta.extraction && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, textAlign: "right" }}
            >
              Extracted via {result.meta.extraction.strategy.replace(/-/g, " ")}
              {result.meta.extraction.retries > 0 &&
                ` (${result.meta.extraction.retries} retries)`}{" "}
              in {result.meta.latency_ms}ms
            </Typography>
          )}
        </Paper>
      )}

      {/* Low Confidence Warning */}
      {result && result.meta.confidence < 40 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Low confidence extraction.</strong> Please review the
            extracted data carefully and make manual corrections as needed.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
