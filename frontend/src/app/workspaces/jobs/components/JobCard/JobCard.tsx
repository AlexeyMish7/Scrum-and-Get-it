import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface JobCardData {
  id?: string | number;
  job_title?: string;
  title?: string;
  company_name?: string;
  company?: string;
  city_name?: string;
  city?: string;
  state_code?: string;
  state?: string;
  job_status?: string;
  jobStatus?: string;
  application_deadline?: string;
  job_description?: string;
  [key: string]: unknown;
}

type Props = {
  job: JobCardData;
  onOpen?: (id: string | number) => void;
};

/**
 * Simple JobCard used across the Jobs workspace.
 * Shows title, company, location, salary start and deadline.
 */
export default function JobCard({ job, onOpen }: Props) {
  const title = String(job.job_title ?? job.title ?? "Untitled");
  const company = String(job.company_name ?? job.company ?? "Unknown");
  const location = [job.city_name ?? job.city, job.state_code ?? job.state]
    .filter(Boolean)
    .join(", ");
  const rawStatus = String(job.job_status ?? job.jobStatus ?? "").trim();
  const statusLabel = (s: string) => {
    if (!s) return "Unknown";
    if (s.toLowerCase() === "archive" || s.toLowerCase() === "archived") return "Archived";
    // capitalize each word
    return s
      .toLowerCase()
      .split(/[_\s-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };
  const deadlineRaw = job.application_deadline ? new Date(String(job.application_deadline)) : null;
  //const deadline = deadlineRaw ? deadlineRaw.toLocaleDateString() : null;

  const theme = useTheme();
  // Status badge will use a neutral grey background to avoid per-status coloring.

  // Calculate days left to deadline (whole days, relative to local date)
  function daysUntil(date: Date) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const today = new Date();
    // Zero out time portions so we compare by date only
    const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.ceil((+b - +a) / msPerDay);
  }

  const daysLeft = deadlineRaw ? daysUntil(deadlineRaw) : null;

  // Color coding for urgency: overdue or within 7d = urgent (error), <=14d = semi (warning), else fine (success)
  function deadlineColor(days: number | null) {
    if (days === null) return theme.palette.text.secondary;
    if (days <= 7) return theme.palette.error.main;
    if (days <= 14) return theme.palette.warning.main;
    return theme.palette.success.main;
  }

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1, position: "relative", cursor: onOpen ? "pointer" : undefined }}
      onClick={() => onOpen && job.id !== undefined && onOpen(job.id)}
    >
      <CardContent sx={{ p: 1 }}>
        {/* Top-right days-left indicator */}
        {daysLeft !== null && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: deadlineColor(daysLeft),
              color: theme.palette.getContrastText(deadlineColor(daysLeft) as string),
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: 1,
            }}
            aria-hidden
          >
            {daysLeft < 0 ? `Overdue` : `Due: ${daysLeft}d`}
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
              {rawStatus ? (
                <Box
                  sx={{
                    bgcolor: (theme) => theme.palette.grey?.[300] ?? "#e0e0e0",
                    color: (theme) => theme.palette.getContrastText(theme.palette.grey?.[300] ?? "#e0e0e0"),
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {statusLabel(rawStatus)}
                </Box>
              ) : null}
            </Box>

            <Typography variant="caption" color="text.secondary">
              {company} {location ? `· ${location}` : ""}
            </Typography>
          </Box>
        </Box>
        {job.job_description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          >
            {String(job.job_description)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
