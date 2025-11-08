import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type Props = {
  job: Record<string, any>;
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
  const deadlineRaw = job.application_deadline ? new Date(String(job.application_deadline)) : null;
  //const deadline = deadlineRaw ? deadlineRaw.toLocaleDateString() : null;

  const theme = useTheme();

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
      onClick={() => onOpen && onOpen(job.id)}
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
            <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {company} {location ? `· ${location}` : ""}
            </Typography>
          </Box>
        </Box>
        {job.job_description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
            {String(job.job_description)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
