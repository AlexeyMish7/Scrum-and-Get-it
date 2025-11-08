import { Card, CardContent, Typography, Box, Chip } from "@mui/material";

type Props = {
  job: Record<string, any>;
};

/**
 * Simple JobCard used across the Jobs workspace.
 * Shows title, company, location, salary start and deadline.
 */
export default function JobCard({ job }: Props) {
  const title = String(job.job_title ?? job.title ?? "Untitled");
  const company = String(job.company_name ?? job.company ?? "Unknown");
  const location = [job.city_name ?? job.city, job.state_code ?? job.state]
    .filter(Boolean)
    .join(", ");
  const salary = job.start_salary_range ? `$${Number(job.start_salary_range).toLocaleString()}` : null;
  const deadline = job.application_deadline ? new Date(String(job.application_deadline)).toLocaleDateString() : null;

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {company} {location ? `· ${location}` : ""}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {salary && <Chip size="small" label={salary} />}
            {deadline && <Typography variant="caption">Due: {deadline}</Typography>}
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
