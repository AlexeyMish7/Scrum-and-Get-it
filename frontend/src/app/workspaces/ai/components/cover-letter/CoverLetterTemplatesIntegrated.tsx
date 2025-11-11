/**
 * COVER LETTER TEMPLATES - FULLY INTEGRATED VERSION
 *
 * WHAT: Interactive template gallery that creates real cover letter drafts
 * WHY: Bridge between template browsing and actual cover letter editor
 *
 * INTEGRATION:
 * ✅ Uses real templates from coverLetterTemplates.ts
 * ✅ Creates actual drafts in Zustand store
 * ✅ Navigates to /ai/cover-letter with pre-populated draft
 * ✅ Analytics tracking (localStorage)
 * ✅ Industry-specific customization
 * ✅ Company research integration (mock for now - UC-057)
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCoverLetterDrafts } from "@workspaces/ai/hooks/useCoverLetterDrafts";
import { useAuth } from "@shared/context/AuthContext";
import {
  getCoverLetterTemplateList,
  type CoverLetterTemplate,
} from "@workspaces/ai/config/coverLetterTemplates";

// Industry-specific content additions
const industryVariants: Record<string, string> = {
  Technology:
    "I have hands-on experience with cloud systems, APIs, and agile development — aligning perfectly with your technical goals.",
  Finance:
    "I bring analytical precision and attention to detail, ensuring financial integrity and process efficiency in every project.",
  Healthcare:
    "My experience in health-related systems has honed my skills in data accuracy, privacy, and patient-centric solutions.",
  Education:
    "I am passionate about using technology to create meaningful learning experiences and improve accessibility.",
};

const CoverLetterTemplatesIntegrated = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createDraft } = useCoverLetterDrafts();

  const [view, setView] = useState<"gallery" | "preview" | "customize">(
    "gallery"
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<CoverLetterTemplate | null>(null);
  const [industry, setIndustry] = useState<string>("");
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, number>>({});

  // Company research (UC-057 - currently mock)
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyInfo, setCompanyInfo] = useState<string | null>(null);
  const [isFetchingCompany, setIsFetchingCompany] = useState(false);

  // Load real templates + analytics
  useEffect(() => {
    const savedAnalytics = JSON.parse(
      localStorage.getItem("sgt:template_analytics") || "{}"
    );
    const realTemplates = getCoverLetterTemplateList();
    setAnalytics(savedAnalytics);
    setTemplates(realTemplates);
  }, []);

  // Save analytics
  useEffect(() => {
    localStorage.setItem("sgt:template_analytics", JSON.stringify(analytics));
  }, [analytics]);

  // Auto-load shared template from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTemplate = params.get("template");
    const sharedIndustry = params.get("industry");

    if (sharedTemplate && templates.length > 0) {
      const template = templates.find(
        (t) => t.id.toLowerCase() === sharedTemplate.toLowerCase()
      );
      if (template) {
        setSelectedTemplate(template);
        setView("preview");
        if (sharedIndustry) {
          setIndustry(sharedIndustry);
        }
      }
    }
  }, [templates]);

  // Track template views
  const handleSelect = (template: CoverLetterTemplate) => {
    setSelectedTemplate(template);
    setIndustry("");
    setView("preview");
    setAnalytics((prev) => ({
      ...prev,
      [`${template.id}-views`]: (prev[`${template.id}-views`] || 0) + 1,
    }));
  };

  // Handle industry selection
  const handleIndustryChange = (e: SelectChangeEvent<string>) => {
    setIndustry(e.target.value);
  };

  // Create draft and navigate to editor
  const handleUseTemplate = async () => {
    if (!selectedTemplate || !user) return;

    // Track usage
    setAnalytics((prev) => ({
      ...prev,
      [`${selectedTemplate.id}-uses`]:
        (prev[`${selectedTemplate.id}-uses`] || 0) + 1,
    }));

    // Create draft with basic info (content will be populated by template)
    const draftName = `${selectedTemplate.name} - ${industry || "General"}`;
    const draftId = await createDraft(
      draftName,
      selectedTemplate.id,
      undefined, // jobId
      undefined, // jobTitle
      undefined  // companyName
    );

    if (!draftId) {
      alert("Failed to create draft");
      return;
    }

    // Navigate to cover letter editor with this draft
    navigate(`/ai/cover-letter?draft=${draftId}`);
  };

  // Mock company research (UC-057 - TODO: integrate real CompanyResearch service)
  const handleFetchCompanyInfo = async () => {
    if (!companyQuery) return;
    setIsFetchingCompany(true);

    // Mock delay
    await new Promise((res) => setTimeout(res, 1000));

    const mockData = `
      ${companyQuery} is a rapidly growing company focused on innovative solutions.
      Recent achievements include raising $50M in Series B funding and launching
      a new sustainability initiative. The company values innovation, collaboration,
      and customer-centric design.
    `;

    setCompanyInfo(mockData);
    setIsFetchingCompany(false);
  };

  // Generate shareable link
  const handleShareLink = () => {
    if (!selectedTemplate) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?template=${encodeURIComponent(
      selectedTemplate.id
    )}${industry ? `&industry=${encodeURIComponent(industry)}` : ""}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Shareable link copied to clipboard!");
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* GALLERY VIEW */}
      {view === "gallery" && (
        <>
          <Typography variant="h5" mb={3}>
            Choose a Cover Letter Template
          </Typography>

          <Stack spacing={2}>
            {templates.map((template) => (
              <Card
                key={template.id}
                onClick={() => handleSelect(template)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { boxShadow: 4, transform: "scale(1.01)" },
                  transition: "0.2s",
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box flex={1}>
                      <Typography variant="h6">{template.name}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {template.description}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={template.category} size="small" />
                        <Chip
                          label={template.isSystem ? "System" : "Custom"}
                          size="small"
                          color={template.isSystem ? "primary" : "secondary"}
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ minWidth: 120, textAlign: "right" }}>
                      <Typography variant="caption" display="block">
                        Views: {analytics[`${template.id}-views`] || 0}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Used: {analytics[`${template.id}-uses`] || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {/* PREVIEW VIEW */}
      {view === "preview" && selectedTemplate && (
        <Box>
          <Button onClick={() => setView("gallery")} sx={{ mb: 2 }}>
            ← Back to Gallery
          </Button>

          <Typography variant="h5" mb={2}>
            {selectedTemplate.name}
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Industry (Optional)</InputLabel>
            <Select
              value={industry}
              label="Select Industry (Optional)"
              onChange={handleIndustryChange}
            >
              <MenuItem value="">None</MenuItem>
              {Object.keys(industryVariants).map((ind) => (
                <MenuItem key={ind} value={ind}>
                  {ind}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Preview Box */}
          <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Template Preview
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Opening:</strong> {selectedTemplate.structure.opening}
            </Typography>
            {industry && industryVariants[industry] && (
              <Typography
                variant="body2"
                paragraph
                sx={{ bgcolor: "primary.light", p: 1, borderRadius: 1 }}
              >
                <strong>Industry Customization ({industry}):</strong>{" "}
                {industryVariants[industry]}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Closing:</strong> {selectedTemplate.structure.closing}
            </Typography>
          </Card>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleUseTemplate}
              disabled={!user}
            >
              Use This Template
            </Button>
            <Button variant="outlined" onClick={handleShareLink}>
              Copy Shareable Link
            </Button>
            <Button variant="outlined" onClick={() => setView("customize")}>
              Customize Further
            </Button>
          </Stack>
        </Box>
      )}

      {/* CUSTOMIZE VIEW (with company research) */}
      {view === "customize" && selectedTemplate && (
        <Box>
          <Button onClick={() => setView("preview")} sx={{ mb: 2 }}>
            ← Back to Preview
          </Button>

          <Typography variant="h6" mb={2}>
            Customize Your Cover Letter
          </Typography>

          {/* Company Research Section (UC-057) */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Target Company"
              fullWidth
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Enter company name for research..."
              sx={{ mb: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleFetchCompanyInfo}
              disabled={isFetchingCompany || !companyQuery}
            >
              {isFetchingCompany ? "Researching..." : "Research This Company"}
            </Button>
          </Box>

          {/* Company Info Display */}
          {companyInfo && (
            <Card
              variant="outlined"
              sx={{ p: 2, mb: 3, bgcolor: "info.lighter" }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Company Research Summary
              </Typography>
              <Typography variant="body2">{companyInfo}</Typography>
            </Card>
          )}

          {/* Create Draft Button */}
          <Button
            variant="contained"
            onClick={handleUseTemplate}
            disabled={!user}
            size="large"
          >
            Create Cover Letter Draft
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CoverLetterTemplatesIntegrated;
