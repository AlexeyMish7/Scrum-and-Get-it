// import { Box, Typography } from "@mui/material";
// import RegionAnchor from "@shared/components/common/RegionAnchor";

// export default function CompanyResearch() {
//   return (
//     <Box>
//       <RegionAnchor
//         id="[D]"
//         desc="Company profile, news feed, and interview prep panel"
//       />
//       <Typography variant="h4" sx={{ mb: 1 }}>
//         Company Research
//       </Typography>
//       <Typography color="text.secondary">
//         TODO: Company profiles, news feed, competitive landscape, and interview
//         prep (UC-063, UC-064, UC-068).
//       </Typography>
//     </Box>
//   );
// }

import React, { useState } from "react";
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
} from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

interface CompanyInfo {
  name: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  description?: string;
  mission?: string;
  news?: string[];
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
      // TODO: Replace with real API call
      // Example placeholder data for now
      const mockData: CompanyInfo = {
        name: searchTerm,
        logo: "/placeholder-logo.png",
        industry: "Technology",
        size: "10,000+ employees",
        location: "San Francisco, CA",
        website: "https://www.example.com",
        description:
          "A leading company in technology innovation, focused on AI and sustainable development.",
        mission:
          "To empower businesses and individuals through intelligent technology solutions.",
        news: [
          "Company launches new AI-powered analytics platform.",
          "CEO announces major sustainability initiative.",
        ],
        rating: 4.2,
        contact: "contact@example.com",
      };

      // Simulate API delay
      await new Promise((res) => setTimeout(res, 1000));
      setCompany(mockData);
    } catch (err) {
      setError("Failed to fetch company information.");
    } finally {
      setLoading(false);
    }
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
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Search"}
        </Button>
      </Stack>

      {/* Error or No Results */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Company Info */}
      {company && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
              Recent News & Updates
            </Typography>
            {company.news && company.news.length > 0 ? (
              company.news.map((item, i) => (
                <Typography key={i} color="text.secondary">
                  • {item}
                </Typography>
              ))
            ) : (
              <Typography color="text.secondary">No recent news available.</Typography>
            )}

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
    </Box>
  );
}