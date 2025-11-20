/**
 * CompanyResearch - AI-powered company research page
 *
 * Allows users to search for companies and get AI-generated insights:
 * - Company profile (size, industry, location, mission)
 * - Recent news and announcements
 * - Company culture and values
 * - Leadership team
 * - Products and services
 *
 * Features:
 * - Shared cache across all users (reduces API costs)
 * - 7-day cache expiration with auto-regeneration
 * - Search by company name
 * - Quick-select from user's employment history
 * - Copy research to clipboard
 * - View cached timestamp
 */

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  EmojiObjects as ProductsIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { companyResearch } from "@ai_workspace/services";

interface CompanyNews {
  title: string;
  summary: string;
  date: string;
  category: string;
  url?: string;
}

interface CompanyCulture {
  type: string;
  remotePolicy: string | null;
  values: string[];
  perks: string[];
}

interface CompanyLeader {
  name: string;
  title: string;
  bio?: string;
}

interface CompanyResearchData {
  companyName: string;
  industry: string | null;
  size: string | null;
  location: string | null;
  founded: number | null;
  website: string | null;
  mission: string | null;
  description: string | null;
  news: CompanyNews[];
  culture: CompanyCulture;
  leadership: CompanyLeader[];
  products: string[];
  lastUpdated: string;
  source: string;
}

export default function CompanyResearch() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [research, setResearch] = useState<CompanyResearchData | null>(null);
  const [userCompanies, setUserCompanies] = useState<string[]>([]);
  const [loadingUserCompanies, setLoadingUserCompanies] = useState(false);

  // Load user's companies from employment history
  useEffect(() => {
    const loadUserCompanies = async () => {
      setLoadingUserCompanies(true);
      try {
        const companies = await companyResearch.getUserCompanies();
        setUserCompanies(companies);
      } catch (err) {
        console.error("Error loading user companies:", err);
        // Don't show error to user, just fail silently
      } finally {
        setLoadingUserCompanies(false);
      }
    };

    loadUserCompanies();
  }, []);

  const handleSearch = async () => {
    if (!companyName.trim()) {
      setError("Please enter a company name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await companyResearch.fetchCompanyResearch(companyName);

      if (!data) {
        setError("No research data available for this company");
        setResearch(null);
      } else {
        setResearch(data);
      }
    } catch (err) {
      console.error("Error fetching company research:", err);
      setError("Failed to fetch company research. Please try again.");
      setResearch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!research) return;

    const text = `
Company: ${research.companyName}
Industry: ${research.industry || "Unknown"}
Size: ${research.size || "Unknown"}
Location: ${research.location || "Unknown"}
Founded: ${research.founded || "Unknown"}
Website: ${research.website || "N/A"}

Mission: ${research.mission || "N/A"}

Description: ${research.description || "N/A"}

Recent News:
${research.news.map((item) => `- ${item.title}: ${item.summary}`).join("\n")}

Culture:
Type: ${research.culture.type}
Remote Policy: ${research.culture.remotePolicy || "Unknown"}
Values: ${research.culture.values.join(", ")}
Perks: ${research.culture.perks.join(", ")}

Leadership:
${research.leadership
  .map((leader) => `- ${leader.name} (${leader.title})`)
  .join("\n")}

Products/Services:
${research.products.join(", ")}

Last Updated: ${new Date(research.lastUpdated).toLocaleDateString()}
Source: ${research.source}
    `.trim();

    navigator.clipboard.writeText(text);
  };

  const getCacheAge = () => {
    if (!research) return null;
    const lastUpdate = new Date(research.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) return `${diffDays}d ${diffHours}h ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Company Research
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Get AI-powered insights about companies to create better-targeted
        applications.
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            label="Company Name"
            placeholder="e.g. Google, Microsoft, Amazon"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            disabled={loading}
          />
          <Button
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={20} /> : <SearchIcon />
            }
            onClick={handleSearch}
            disabled={loading || !companyName.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </Stack>

        {/* Quick select from user's interested jobs */}
        {userCompanies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quick select from your interested jobs:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {userCompanies.map((company) => (
                <Chip
                  key={company}
                  label={company}
                  onClick={() => {
                    setCompanyName(company);
                    setError(null);
                  }}
                  clickable
                  color={companyName === company ? "primary" : "default"}
                  disabled={loading}
                />
              ))}
            </Stack>
          </Box>
        )}

        {loadingUserCompanies && (
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Loading your companies...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Research Results */}
      {research && (
        <Box>
          {/* Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {research.companyName}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {research.industry && (
                    <Chip icon={<BusinessIcon />} label={research.industry} />
                  )}
                  {research.size && (
                    <Chip label={`${research.size} employees`} />
                  )}
                  {research.location && (
                    <Chip icon={<LocationIcon />} label={research.location} />
                  )}
                  {research.founded && (
                    <Chip
                      icon={<CalendarIcon />}
                      label={`Founded ${research.founded}`}
                    />
                  )}
                </Stack>
              </Box>
              <Tooltip title="Copy to clipboard">
                <IconButton onClick={handleCopyToClipboard}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {research.website && (
              <Button
                startIcon={<WebsiteIcon />}
                href={research.website}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 2 }}
              >
                Visit Website
              </Button>
            )}

            {/* Cache info */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">
                  Last updated: {getCacheAge()}
                </Typography>
                <Chip size="small" label={research.source} />
              </Stack>
            </Alert>
          </Paper>

          <Stack spacing={3}>
            {/* Mission & Description */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  About
                </Typography>
                {research.mission && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Mission
                    </Typography>
                    <Typography variant="body1">{research.mission}</Typography>
                  </Box>
                )}
                {research.description && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {research.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Recent News */}
            {research.news.length > 0 && (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <TrendingIcon /> Recent News
                  </Typography>
                  <List>
                    {research.news.map((item, index) => (
                      <Box key={index}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                              >
                                {item.title}
                              </Typography>
                            }
                            secondary={
                              <Box component="span">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  component="span"
                                  display="block"
                                >
                                  {item.summary}
                                </Typography>
                                <Stack
                                  component="span"
                                  direction="row"
                                  spacing={1}
                                  sx={{ mt: 1, display: "inline-flex" }}
                                >
                                  <Chip
                                    size="small"
                                    label={item.category}
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    size="small"
                                    label={new Date(
                                      item.date
                                    ).toLocaleDateString()}
                                  />
                                </Stack>
                              </Box>
                            }
                            secondaryTypographyProps={{ component: "span" }}
                          />
                        </ListItem>
                        {index < research.news.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Culture */}
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Company Culture
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Chip label={research.culture.type} />
                  </Box>
                  {research.culture.remotePolicy && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Remote Policy
                      </Typography>
                      <Chip label={research.culture.remotePolicy} />
                    </Box>
                  )}
                  {research.culture.values.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Values
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {research.culture.values.map((value, idx) => (
                          <Chip key={idx} label={value} size="small" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {research.culture.perks.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Perks
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {research.culture.perks.map((perk, idx) => (
                          <Chip
                            key={idx}
                            label={perk}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Leadership */}
            {research.leadership.length > 0 && (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PeopleIcon /> Leadership Team
                  </Typography>
                  <List>
                    {research.leadership.map((leader, index) => (
                      <Box key={index}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={leader.name}
                            secondary={
                              <Box component="span">
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  component="span"
                                  display="block"
                                >
                                  {leader.title}
                                </Typography>
                                {leader.bio && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    component="span"
                                    display="block"
                                    sx={{ mt: 0.5 }}
                                  >
                                    {leader.bio}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondaryTypographyProps={{ component: "span" }}
                          />
                        </ListItem>
                        {index < research.leadership.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {research.products.length > 0 && (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ProductsIcon /> Products & Services
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {research.products.map((product, idx) => (
                      <Chip key={idx} label={product} color="primary" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      )}
    </Container>
  );
}
