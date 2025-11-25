/**
 * CompanyResearchCard — AI-powered company research and insights
 *
 * Purpose: Research companies for job applications with AI-generated insights
 * Features: Company culture, mission/values, recent news, interview tips
 *
 * Backend: POST /api/generate/company-research
 * Cache: Uses analytics_cache with 30-day TTL for company research
 *
 * Contract:
 * - Inputs: Company name (required), optional job ID for context
 * - Outputs: AI-generated company intelligence and culture insights
 * - Export: JSON/CSV download of research data
 */

import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Alert,
  Divider,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";
import {
  Business as CompanyIcon,
  TrendingUp as TrendingIcon,
  Group as CultureIcon,
  Lightbulb as InsightIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";

interface CompanyResearchResult {
  overview?: string;
  mission?: string;
  values?: string[];
  culture?: string;
  recentNews?: string[];
  interviewInsights?: string[];
  competitors?: string[];
  insights?: string;
}

export default function CompanyResearchCard() {
  const { session } = useAuth();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [jobId, setJobId] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyResearchResult | null>(null);

  // Call backend to generate company research
  const handleResearch = async () => {
    if (!companyName.trim()) {
      setError("Please enter a company name");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_AI_BASE_URL}/api/generate/company-research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : { "x-user-id": "demo-user" }), // Dev fallback
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            ...(jobId ? { jobId: Number(jobId) } : {}),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch company research");
      }

      // Extract content from response
      const content = data.content ?? data.artifact?.content ?? data;
      setResult(content);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while researching company"
      );
    } finally {
      setLoading(false);
    }
  };

  // Export research as JSON
  const handleExportJSON = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company_research_${companyName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export research as CSV
  const handleExportCSV = () => {
    if (!result) return;

    const rows: string[][] = [];
    rows.push(["Company Research Report"]);
    rows.push(["Company", companyName]);
    rows.push([]);

    if (result.mission) {
      rows.push(["Mission"]);
      rows.push([`"${result.mission}"`]);
      rows.push([]);
    }

    if (result.values && Array.isArray(result.values)) {
      rows.push(["Core Values"]);
      result.values.forEach((value: string) => {
        rows.push([`"${value}"`]);
      });
      rows.push([]);
    }

    if (result.culture) {
      rows.push(["Culture"]);
      rows.push([`"${result.culture}"`]);
      rows.push([]);
    }

    if (result.recentNews && Array.isArray(result.recentNews)) {
      rows.push(["Recent News"]);
      result.recentNews.forEach((news: string) => {
        rows.push([`"${news}"`]);
      });
      rows.push([]);
    }

    if (result.interviewInsights && Array.isArray(result.interviewInsights)) {
      rows.push(["Interview Insights"]);
      result.interviewInsights.forEach((insight: string) => {
        rows.push([`"${insight}"`]);
      });
    }

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company_research_${companyName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 4, borderRadius: 4, backgroundColor: "#fff" }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CompanyIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Company Research
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get AI-generated insights about any company including culture, values,
        recent news, and interview preparation tips.
      </Typography>

      {/* Research Form */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            size="small"
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google, Microsoft, Amazon"
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Job ID (Optional)"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="For context"
            type="number"
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            onClick={handleResearch}
            disabled={loading || !companyName.trim()}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Researching...
              </>
            ) : (
              "Research Company"
            )}
          </Button>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />

          {/* Export Buttons */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mb: 3 }}
          >
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Stack>

          {/* Company Overview */}
          {result.overview && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CompanyIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Overview
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {result.overview}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Mission Statement */}
          {result.mission && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Mission
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "text.secondary" }}
                >
                  "{result.mission}"
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Core Values */}
          {result.values &&
            Array.isArray(result.values) &&
            result.values.length > 0 && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Core Values
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {result.values.map((value: string, idx: number) => (
                      <Chip key={idx} label={value} size="small" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

          {/* Company Culture */}
          {result.culture && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CultureIcon color="secondary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Culture & Work Environment
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {result.culture}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Recent News */}
          {result.recentNews &&
            Array.isArray(result.recentNews) &&
            result.recentNews.length > 0 && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingIcon color="info" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Recent News & Updates
                    </Typography>
                  </Stack>
                  <List dense>
                    {result.recentNews.map((news: string, idx: number) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={news}
                          primaryTypographyProps={{
                            variant: "body2",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

          {/* Interview Insights */}
          {result.interviewInsights &&
            Array.isArray(result.interviewInsights) &&
            result.interviewInsights.length > 0 && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InsightIcon color="success" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Interview Preparation Tips
                    </Typography>
                  </Stack>
                  <List dense>
                    {result.interviewInsights.map(
                      (insight: string, idx: number) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={insight}
                            primaryTypographyProps={{
                              variant: "body2",
                            }}
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                </CardContent>
              </Card>
            )}

          {/* Competitive Landscape */}
          {result.competitors &&
            Array.isArray(result.competitors) &&
            result.competitors.length > 0 && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Competitive Landscape
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {result.competitors.map(
                      (competitor: string, idx: number) => (
                        <Chip
                          key={idx}
                          label={competitor}
                          size="small"
                          variant="outlined"
                        />
                      )
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

          {/* Additional Insights */}
          {result.insights && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                AI Insights
              </Typography>
              <Typography variant="body2">{result.insights}</Typography>
            </Alert>
          )}
        </Box>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Enter a company name above to get AI-powered research and insights for
          your job applications.
        </Alert>
      )}
    </Paper>
  );
}
