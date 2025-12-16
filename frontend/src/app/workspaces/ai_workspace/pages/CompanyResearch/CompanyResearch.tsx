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
import { useLocation } from "react-router-dom";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
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
  Print as PrintIcon,
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
  potentialInterviewers?: Array<{ role: string; name?: string | null }>;
  competitors?: Array<{ name: string; note?: string }>;
  marketPositioning?: string | null;
  talkingPoints?: string[];
  interviewQuestions?: string[];
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

  const handleSearch = async (overrideName?: string) => {
    // Ensure nameToUse is always a string, even if called with an event object
    const nameToUse =
      typeof overrideName === "string" ? overrideName : companyName ?? "";
    if (!nameToUse.trim()) {
      setError("Please enter a company name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await companyResearch.fetchCompanyResearch(nameToUse);

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

  // Auto-start search if we have a `name` query param (e.g., navigated from InterviewScheduling)
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const q = params.get("name") || params.get("company") || "";
      if (q && q.trim()) {
        setCompanyName(q);
        // start search immediately
        (async () => {
          try {
            await handleSearch(q);
          } catch (e) {
            console.error("Auto search failed", e);
          }
        })();
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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

  const handleExportMarkdown = () => {
    if (!research) return;
    const mdLines: string[] = [];
    mdLines.push(`# ${research.companyName}\n`);
    mdLines.push(`**Industry:** ${research.industry || "Unknown"}`);
    mdLines.push(`**Size:** ${research.size || "Unknown"}`);
    mdLines.push(`**Location:** ${research.location || "Unknown"}`);
    mdLines.push(`**Founded:** ${research.founded || "Unknown"}`);
    if (research.website) mdLines.push(`**Website:** ${research.website}`);
    mdLines.push("\n## Mission\n");
    mdLines.push(research.mission || "N/A");
    mdLines.push("\n## Description\n");
    mdLines.push(research.description || "N/A");
    mdLines.push("\n## Recent News\n");
    research.news.forEach((n) =>
      mdLines.push(
        `- **${n.title}** (${new Date(n.date).toLocaleDateString()}): ${
          n.summary
        }`
      )
    );
    mdLines.push("\n## Culture\n");
    mdLines.push(`- Type: ${research.culture.type}`);
    mdLines.push(`- Remote: ${research.culture.remotePolicy || "Unknown"}`);
    if (research.culture.values.length)
      mdLines.push(`- Values: ${research.culture.values.join(", ")}`);
    if (research.culture.perks.length)
      mdLines.push(`- Perks: ${research.culture.perks.join(", ")}`);
    mdLines.push("\n## Leadership\n");
    research.leadership.forEach((l) =>
      mdLines.push(`- ${l.name} — ${l.title}${l.bio ? ` — ${l.bio}` : ""}`)
    );
    if (
      research.potentialInterviewers &&
      research.potentialInterviewers.length
    ) {
      mdLines.push("\n## Potential Interviewers\n");
      research.potentialInterviewers.forEach((p) =>
        mdLines.push(`- ${p.role}${p.name ? ` — ${p.name}` : ""}`)
      );
    }
    if (research.competitors && research.competitors.length) {
      mdLines.push("\n## Competitors & Market Positioning\n");
      research.competitors.forEach((c) =>
        mdLines.push(`- ${c.name}${c.note ? ` — ${c.note}` : ""}`)
      );
      if (research.marketPositioning)
        mdLines.push(`\n**Market positioning:** ${research.marketPositioning}`);
    }
    if (research.talkingPoints && research.talkingPoints.length) {
      mdLines.push("\n## Talking Points\n");
      research.talkingPoints.forEach((t) => mdLines.push(`- ${t}`));
    }
    if (research.interviewQuestions && research.interviewQuestions.length) {
      mdLines.push("\n## Interview Questions\n");
      research.interviewQuestions.forEach((q) => mdLines.push(`- ${q}`));
    }

    const blob = new Blob([mdLines.join("\n\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${research.companyName.replace(/\s+/g, "_")}_research.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!research) return;

    function escapeHtml(str: any) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function safeHttpUrl(raw: any): string | null {
      if (!raw) return null;
      try {
        const u = new URL(String(raw));
        if (u.protocol !== "http:" && u.protocol !== "https:") return null;
        return u.toString();
      } catch {
        return null;
      }
    }

    // Build simple HTML from the markdown-like content for printing
    const parts: string[] = [];
    parts.push(`<h1>${escapeHtml(research.companyName)}</h1>`);
    parts.push(
      `<p><strong>Industry:</strong> ${escapeHtml(
        research.industry || "Unknown"
      )}</p>`
    );
    parts.push(
      `<p><strong>Size:</strong> ${escapeHtml(research.size || "Unknown")}</p>`
    );
    parts.push(
      `<p><strong>Location:</strong> ${escapeHtml(
        research.location || "Unknown"
      )}</p>`
    );
    parts.push(
      `<p><strong>Founded:</strong> ${escapeHtml(
        research.founded || "Unknown"
      )}</p>`
    );
    if (research.website) {
      const safe = safeHttpUrl(research.website);
      if (safe) {
        parts.push(
          `<p><strong>Website:</strong> <a href="${escapeHtml(
            safe
          )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            safe
          )}</a></p>`
        );
      } else {
        parts.push(
          `<p><strong>Website:</strong> ${escapeHtml(research.website)}</p>`
        );
      }
    }
    parts.push(
      `<h2>Mission</h2><p>${escapeHtml(research.mission || "N/A")}</p>`
    );
    parts.push(
      `<h2>Description</h2><p>${escapeHtml(research.description || "N/A")}</p>`
    );
    parts.push(`<h2>Recent News</h2>`);
    parts.push(
      `<ul>${research.news
        .map(
          (n) =>
            `<li><strong>${escapeHtml(n.title)}</strong> (${new Date(
              n.date
            ).toLocaleDateString()}): ${escapeHtml(n.summary)}</li>`
        )
        .join("")}</ul>`
    );
    parts.push(
      `<h2>Culture</h2><p>Type: ${escapeHtml(
        research.culture.type
      )}</p><p>Remote: ${escapeHtml(
        research.culture.remotePolicy || "Unknown"
      )}</p>`
    );
    if (research.culture.values.length)
      parts.push(
        `<p>Values: ${escapeHtml(research.culture.values.join(", "))}</p>`
      );
    if (research.culture.perks.length)
      parts.push(
        `<p>Perks: ${escapeHtml(research.culture.perks.join(", "))}</p>`
      );
    parts.push(
      `<h2>Leadership</h2><ul>${research.leadership
        .map(
          (l) =>
            `<li>${escapeHtml(l.name)} — ${escapeHtml(l.title)}${
              l.bio ? ` — ${escapeHtml(l.bio)}` : ""
            }</li>`
        )
        .join("")}</ul>`
    );

    if (
      research.potentialInterviewers &&
      research.potentialInterviewers.length
    ) {
      parts.push(
        `<h2>Potential Interviewers</h2><ul>${research.potentialInterviewers
          .map(
            (p) =>
              `<li>${escapeHtml(p.role)}${
                p.name ? ` — ${escapeHtml(p.name)}` : ""
              }</li>`
          )
          .join("")}</ul>`
      );
    }

    if (research.competitors && research.competitors.length) {
      parts.push(
        `<h2>Competitors</h2><ul>${research.competitors
          .map(
            (c) =>
              `<li>${escapeHtml(c.name)}${
                c.note ? ` — ${escapeHtml(c.note)}` : ""
              }</li>`
          )
          .join("")}</ul>`
      );
    }
    if (research.marketPositioning)
      parts.push(
        `<p><strong>Market positioning:</strong> ${escapeHtml(
          research.marketPositioning
        )}</p>`
      );

    if (research.talkingPoints && research.talkingPoints.length) {
      parts.push(
        `<h2>Talking Points</h2><ul>${research.talkingPoints
          .map((t) => `<li>${escapeHtml(t)}</li>`)
          .join("")}</ul>`
      );
    }
    if (research.interviewQuestions && research.interviewQuestions.length) {
      parts.push(
        `<h2>Interview Questions</h2><ul>${research.interviewQuestions
          .map((q) => `<li>${escapeHtml(q)}</li>`)
          .join("")}</ul>`
      );
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
      research.companyName
    )} Research</title><style>body{font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding: 24px; color:#111} h1{font-size:22px} h2{font-size:16px; margin-top:18px}</style></head><body>${parts.join(
      ""
    )}</body></html>`;

    const w: any = window.open("", "_blank");
    if (!w) {
      alert(
        "Unable to open new window for PDF export. Please allow popups for this site."
      );
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Give browser a moment to render then open print dialog (user can Save as PDF)
    setTimeout(() => {
      try {
        w.print();
      } catch (e) {
        console.error("Print failed", e);
      }
    }, 500);
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
    <Container maxWidth="xl" sx={{ py: 4, pt: 2 }}>
      <AutoBreadcrumbs />
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
            onClick={() => handleSearch()}
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
              <Tooltip title="Export as Markdown">
                <IconButton onClick={handleExportMarkdown}>
                  <Typography variant="button" sx={{ fontSize: 12 }}>
                    MD
                  </Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="Export as PDF">
                <IconButton onClick={handleExportPDF}>
                  <PrintIcon />
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

            {/* Potential Interviewers */}
            {research.potentialInterviewers &&
              research.potentialInterviewers.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Potential Interviewers
                    </Typography>
                    <List>
                      {research.potentialInterviewers.map((p, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText
                            primary={`${p.role}${p.name ? ` — ${p.name}` : ""}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

            {/* Competitors & Market Positioning */}
            {(research.competitors && research.competitors.length > 0) ||
            research.marketPositioning ? (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Competitors & Market Positioning
                  </Typography>
                  {research.competitors && research.competitors.length > 0 && (
                    <List>
                      {research.competitors.map((c, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={c.name} secondary={c.note} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {research.marketPositioning && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {research.marketPositioning}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Talking Points */}
            {research.talkingPoints && research.talkingPoints.length > 0 && (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Talking Points
                  </Typography>
                  <List>
                    {research.talkingPoints.map((t, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText primary={t} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Interview Questions */}
            {research.interviewQuestions &&
              research.interviewQuestions.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Smart Interview Questions
                    </Typography>
                    <List>
                      {research.interviewQuestions.map((q, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={q} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
          </Stack>
        </Box>
      )}
    </Container>
  );
}
