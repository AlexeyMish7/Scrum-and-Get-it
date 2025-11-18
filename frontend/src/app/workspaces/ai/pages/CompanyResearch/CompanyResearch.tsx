import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Link,
  Divider,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import Interview from "./Interview";
import useCompanyResearch from "@workspaces/ai/hooks/useCompanyResearch";
import useUserJobs from "@shared/hooks/useUserJobs";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { Breadcrumbs } from "@shared/components/navigation";
import type { BreadcrumbItem } from "@shared/components/navigation";

export default function CompanyResearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const cr = useCompanyResearch();
  const { jobs, loading: jobsLoading } = useUserJobs(50);
  const { notification, closeNotification, showSuccess } = useErrorHandler();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showSuccess("Please enter a company name");
      return;
    }
    await cr.runResearch(
      searchTerm,
      selectedJobId ? Number(selectedJobId) : undefined
    );
  };

  const handleSave = async () => {
    if (!cr.researchData) return;
    const res = await cr.saveArtifact({
      title: `Research: ${cr.researchData.name}`,
      jobId: selectedJobId ? Number(selectedJobId) : undefined,
    });
    if (res.error) {
      showSuccess("Failed to save: " + res.error.message);
    } else {
      showSuccess("Company research saved successfully!");
    }
  };

  const handleExportNews = () => {
    if (!cr.researchData?.recentNews) return;
    const summaryText = cr.researchData.recentNews
      .map(
        (n) =>
          `${n.title} (${n.category}, ${n.date})\nSummary: ${
            n.summary
          }\nSource: ${n.source}\nRelevance: ${n.relevance}\n${
            n.link ? `Link: ${n.link}` : ""
          }\n`
      )
      .join("\n-------------------\n");

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cr.researchData.name}_news_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Breadcrumb navigation
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "AI", path: "/ai" },
    { label: "Company Research" },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs items={breadcrumbItems} />

      <Typography variant="h4" sx={{ mb: 2 }}>
        Company Research
      </Typography>

      {/* Search Bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Company Name"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && searchTerm.trim()) {
              handleSearch();
            }
          }}
          placeholder="e.g., Google, Microsoft, Tesla"
        />
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Link to Job (Optional)</InputLabel>
          <Select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value as number)}
            label="Link to Job (Optional)"
            disabled={jobsLoading}
          >
            <MenuItem value="">None</MenuItem>
            {jobs.map((j) => (
              <MenuItem key={j.id} value={j.id}>
                {j.title} — {j.company}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={cr.isLoading || !searchTerm.trim()}
          startIcon={cr.researchData ? <RefreshIcon /> : <BusinessIcon />}
          sx={{ minWidth: 140 }}
        >
          {cr.isLoading ? (
            <CircularProgress size={24} />
          ) : cr.researchData ? (
            "Re-research"
          ) : (
            "Research"
          )}
        </Button>
        {cr.researchData && (
          <Button
            variant="outlined"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            Save
          </Button>
        )}
      </Stack>

      {cr.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {cr.error}
        </Alert>
      )}

      {/* Company Info */}
      {cr.researchData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h6">{cr.researchData.name}</Typography>
                {cr.researchData.industry && (
                  <Typography color="text.secondary">
                    {cr.researchData.industry}
                  </Typography>
                )}
                {cr.researchData.location && (
                  <Typography color="text.secondary">
                    {cr.researchData.location}
                  </Typography>
                )}
                {cr.researchData.website && (
                  <Link
                    href={cr.researchData.website}
                    target="_blank"
                    rel="noopener"
                  >
                    {cr.researchData.website}
                  </Link>
                )}
              </Box>
            </Stack>

            {cr.researchData.size && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Company Size:</strong> {cr.researchData.size}
              </Typography>
            )}

            {cr.researchData.mission && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Mission Statement:</strong> {cr.researchData.mission}
              </Typography>
            )}

            {cr.researchData.description && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> {cr.researchData.description}
              </Typography>
            )}

            {cr.researchData.products &&
              cr.researchData.products.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Products & Services
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {cr.researchData.products.map((product, idx) => (
                      <Chip key={idx} label={product} />
                    ))}
                  </Stack>
                </>
              )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
              Glassdoor Rating
            </Typography>
            <Typography color="text.secondary">
              {cr.researchData.rating ? (
                typeof cr.researchData.rating === "number" ? (
                  `⭐ ${cr.researchData.rating}/5`
                ) : (
                  <>
                    ⭐ {cr.researchData.rating.glassdoor ?? "N/A"}/5
                    {cr.researchData.rating.reviewCount && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ ml: 0.5 }}
                      >
                        ({cr.researchData.rating.reviewCount.toLocaleString()}{" "}
                        reviews)
                        {cr.researchData.rating.source &&
                          ` • ${cr.researchData.rating.source}`}
                      </Typography>
                    )}
                  </>
                )
              ) : (
                "Not available"
              )}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Company News Section */}
      {cr.researchData?.recentNews && cr.researchData.recentNews.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Recent Company News
            </Typography>
            {cr.researchData.recentNews.map((item, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip label={item.category} size="small" />
                  <Typography color="text.secondary" variant="body2">
                    {item.date} • {item.source}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ ml: "auto" }}
                  >
                    Relevance: {Math.round(item.relevance * 100)}%
                  </Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {item.summary}
                </Typography>
                {item.link && (
                  <Link href={item.link} target="_blank" rel="noopener">
                    Read more
                  </Link>
                )}
                <Divider sx={{ my: 2 }} />
              </Box>
            ))}

            {/* Export & Alerts Section */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleExportNews}>
                Export News Summaries
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Interview insights & preparation (UC-068) */}
      {cr.researchData && (
        <Interview
          company={{
            name: cr.researchData.name,
            website: cr.researchData.website,
            industry: cr.researchData.industry,
            size: cr.researchData.size,
          }}
        />
      )}

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Container>
  );
}
