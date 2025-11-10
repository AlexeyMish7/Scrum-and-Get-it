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
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import Interview from "./Interview";

interface NewsItem {
  title: string;
  category: string;
  date: string;
  source: string;
  relevance: number;
  summary: string;
  link: string;
}

interface CompanyInfo {
  name: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  description?: string;
  mission?: string;
  news?: NewsItem[];
  rating?: number | null;
  contact?: string;
}

export default function CompanyResearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      // FUTURE: Replace with real API calls for company info and news
      // - Backend endpoint: POST /api/research/company
      // - Use external APIs: Clearbit, LinkedIn, news aggregators
      const mockData: CompanyInfo = {
        name: searchTerm,
        logo: "/placeholder-logo.png",
        industry: "Technology",
        size: "10,000+ employees",
        location: "New York, NY",
        website: "https://www.example.com",
        description:
          "A leading innovator in cloud computing and AI-driven business solutions.",
        mission:
          "To make advanced technology accessible and sustainable for everyone.",
        rating: 4.3,
        contact: "info@example.com",
        news: [
          {
            title: "Company raises $50M in Series C funding",
            category: "Funding",
            date: "2025-11-03",
            source: "TechCrunch",
            relevance: 0.95,
            summary:
              "The company secured new funding to expand its AI platform and enter new markets.",
            link: "https://techcrunch.com/example",
          },
          {
            title: "Company launches new enterprise cloud product",
            category: "Product Launch",
            date: "2025-10-20",
            source: "Business Insider",
            relevance: 0.87,
            summary:
              "The new platform offers improved scalability and advanced analytics for business users.",
            link: "https://businessinsider.com/example",
          },
          {
            title: "Company announces major hiring initiative",
            category: "Hiring",
            date: "2025-09-15",
            source: "Forbes",
            relevance: 0.79,
            summary:
              "The initiative aims to create 2,000 new jobs across its global offices by 2026.",
            link: "https://forbes.com/example",
          },
        ],
      };

      await new Promise((res) => setTimeout(res, 1000));
      setCompany(mockData);
    } catch {
      setError("Failed to fetch company information.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportNews = () => {
    if (!company?.news) return;
    const summaryText = company.news
      .map(
        (n) =>
          `${n.title} (${n.category}, ${n.date})\nSummary: ${n.summary}\nSource: ${n.source}\nRelevance: ${n.relevance}\nLink: ${n.link}\n`
      )
      .join("\n-------------------\n");

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.name}_news_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <RegionAnchor
        id="[D]"
        desc="Company profile, news feed, and interview prep panel"
      />
      <Typography variant="h4" sx={{ mb: 2 }}>
        Company Research
      </Typography>

      {/* Search Bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search Company"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Search"}
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Company Info */}
      {company && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Avatar
                src={company.logo}
                alt={company.name}
                sx={{ width: 64, height: 64 }}
              />
              <Box>
                <Typography variant="h6">{company.name}</Typography>
                <Typography color="text.secondary">
                  {company.industry}
                </Typography>
                <Typography color="text.secondary">
                  {company.location}
                </Typography>
                <Link href={company.website} target="_blank" rel="noopener">
                  {company.website}
                </Link>
              </Box>
            </Stack>

            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Company Size:</strong> {company.size}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Mission Statement:</strong> {company.mission}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Description:</strong> {company.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
              Glassdoor Rating
            </Typography>
            <Typography color="text.secondary">
              {company.rating ? `⭐ ${company.rating}/5` : "Not available"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
              Contact Information
            </Typography>
            <Typography color="text.secondary">
              {company.contact || "No contact info available"}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Company News Section */}
      {company?.news && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Recent Company News
            </Typography>
            {company.news.map((item, i) => (
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
                <Link href={item.link} target="_blank" rel="noopener">
                  Read more
                </Link>
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
      {company && <Interview company={{ name: company.name, website: company.website, industry: company.industry, size: company.size }} />}
    </Box>
  );
}
