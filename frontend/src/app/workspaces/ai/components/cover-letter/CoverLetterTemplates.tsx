/**
 * COVER LETTER TEMPLATES COMPONENT - STANDALONE VERSION (DEPRECATED)
 *
 * ⚠️ DEPRECATION NOTICE:
 * This is the original standalone implementation with mock data.
 * The production version is CoverLetterTemplatesIntegrated.tsx which is used in TemplatesHub.
 *
 * This file is kept for reference but should not be used in production.
 * Use CoverLetterTemplatesIntegrated.tsx instead.
 */

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  getCoverLetterTemplateList,
  type CoverLetterTemplate,
} from "@workspaces/ai/config/coverLetterTemplates";

// ===== Industry-specific content paragraphs =====
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

const CoverLetterTemplates = () => {
  const [view, setView] = useState<"gallery" | "preview" | "edit">("gallery");
  const [selectedTemplate, setSelectedTemplate] =
    useState<CoverLetterTemplate | null>(null);
  const [industry, setIndustry] = useState("");
  const [content, setContent] = useState("");
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);

  // Analytics
  const [analytics, setAnalytics] = useState<{ [key: string]: number }>({});

  // Company research
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyInfo, setCompanyInfo] = useState<string | null>(null);
  const [isFetchingCompany, setIsFetchingCompany] = useState(false);

  // Load real templates from config + analytics
  useEffect(() => {
    const savedAnalytics = JSON.parse(
      localStorage.getItem("templateAnalytics") || "{}"
    );
    const realTemplates = getCoverLetterTemplateList(); // Gets system + custom templates
    setAnalytics(savedAnalytics);
    setTemplates(realTemplates);
  }, []);

  // Save analytics whenever updated
  useEffect(() => {
    localStorage.setItem("templateAnalytics", JSON.stringify(analytics));
  }, [analytics]);

  // Auto-load shared template from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedName = params.get("template");
    const sharedIndustry = params.get("industry");
    if (sharedName && templates.length > 0) {
      const sharedTemplate = templates.find(
        (t) => t.name.toLowerCase() === sharedName.toLowerCase()
      );
      if (sharedTemplate) {
        setSelectedTemplate(sharedTemplate);
        setView("preview");

        if (sharedIndustry && industryVariants[sharedIndustry]) {
          setIndustry(sharedIndustry);
          // Generate preview content from template structure
          const previewContent = `${sharedTemplate.structure.opening}\n\n${industryVariants[sharedIndustry]}\n\n${sharedTemplate.structure.closing}`;
          setContent(previewContent);
        }
      }
    }
  }, [templates]);

  // Handle template selection
  const handleSelect = (template: CoverLetterTemplate) => {
    setSelectedTemplate(template);
    setIndustry("");
    setView("preview");
    // Generate preview from template structure
    const previewContent = `${template.structure.opening}\n\n${template.structure.closing}`;
    setContent(previewContent);
    setAnalytics((prev) => ({
      ...prev,
      [template.name]: (prev[template.name] || 0) + 1,
    }));
  };

  // Handle industry update
  const handleIndustryChange = (e: SelectChangeEvent<string>) => {
    const chosen = e.target.value as string;
    setIndustry(chosen);
    if (!selectedTemplate) return;
    
    const industryText = industryVariants[chosen] || "";
    const updatedContent = `${selectedTemplate.structure.opening}\n\n${industryText}\n\n${selectedTemplate.structure.closing}`;
    setContent(updatedContent);
  };

  const handleUse = () => {
    if (!selectedTemplate) return;
    setAnalytics((prev) => ({
      ...prev,
      [`${selectedTemplate.name}-used`]:
        (prev[`${selectedTemplate.name}-used`] || 0) + 1,
    }));
    setView("edit");
  };

  const handleSave = () => {
    alert("Template saved successfully!");
    setView("gallery");
  };

  // Import templates (deprecated - use importCustomTemplate from config instead)
  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const valid = imported.filter(
            (t) => t.name && t.structure && t.category
          );
          const updatedTemplates = [...templates, ...valid];
          setTemplates(updatedTemplates);
          localStorage.setItem("customTemplates", JSON.stringify(valid));
          alert("Templates imported successfully!");
        } else {
          alert("Invalid format. Expected a JSON array of templates.");
        }
      } catch {
        alert("Error reading the file. Please upload valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Mock company research API (auto-incorporates result)
  const handleFetchCompanyInfo = async () => {
    if (!companyQuery) return;
    setIsFetchingCompany(true);

    const mockCompanyData = `
      ${companyQuery} is a rapidly growing tech company focused on AI-driven solutions.
      Recent achievements include raising $50M in Series B funding and launching
      a new sustainability initiative aligned with their corporate mission.
      The company values innovation, collaboration, and customer-centric design.
      Competitors include XYZ Corp and ABC Inc.
    `;

    setCompanyInfo(mockCompanyData);

    // Automatically integrate company research into the cover letter
    // setContent((prev) => {
    //   const base = prev || selectedTemplate?.sampleHtml || "";
    //   return base.replace(
    //     "</p>\n      <p>Sincerely",
    //     `</p>\n      <p>Having researched ${companyQuery}, I was particularly impressed by their recent initiatives such as raising Series B funding and their strong commitment to sustainability. These values align closely with my own passion for innovation and impact, making me excited about contributing to their mission.</p>\n      <p>Sincerely`
    //   );
    // });

    setIsFetchingCompany(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ===== GALLERY ===== */}
      {view === "gallery" && (
        <>
          <Typography variant="h4" mb={3}>
            Choose a Cover Letter Template
          </Typography>
          <Box mb={2}>
            <Button variant="outlined" component="label">
              Import Custom Templates
              <input
                type="file"
                hidden
                accept="application/json"
                onChange={handleImportTemplate}
              />
            </Button>
          </Box>
          <Stack spacing={2}>
            {templates.map((t) => (
              <Card
                key={t.id || t.name}
                onClick={() => handleSelect(t)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { boxShadow: 4, transform: "scale(1.02)" },
                  transition: "0.2s",
                }}
              >
                <CardContent>
                  <Typography variant="h6">{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.category}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Viewed: {analytics[t.name] || 0} times
                  </Typography>
                  <Typography variant="caption" display="block">
                    Used: {analytics[`${t.name}-used`] || 0} times
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {/* ===== PREVIEW ===== */}
      {view === "preview" && selectedTemplate && (
        <Box>
          <Button onClick={() => setView("gallery")}>← Back</Button>
          <Typography variant="h5" mt={2}>
            {selectedTemplate.name}
          </Typography>

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Select Industry</InputLabel>
            <Select
              value={industry}
              label="Select Industry"
              onChange={handleIndustryChange}
            >
              {Object.keys(industryVariants).map((ind) => (
                <MenuItem key={ind} value={ind}>
                  {ind}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              mt: 3,
              bgcolor: "background.paper",
              minHeight: 200,
              whiteSpace: "pre-wrap",
            }}
          >
            <Typography>{content}</Typography>
          </Box>

          {industry && (
            <Box display="flex" gap={2} mt={2}>
              <Button variant="contained" onClick={handleUse}>
                Use This Template
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const shareUrl = `${window.location.origin}${
                    window.location.pathname
                  }?template=${encodeURIComponent(
                    selectedTemplate.name
                  )}&industry=${encodeURIComponent(industry)}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert("Shareable link copied to clipboard!");
                }}
              >
                Copy Shareable Link
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ===== EDITOR ===== */}
      {view === "edit" && (
        <Box>
          <Button onClick={() => setView("preview")}>← Back</Button>
          <Typography variant="h6" mt={2}>
            Customize Your Cover Letter
          </Typography>

          {/* Company Research Section */}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Target Company"
              fullWidth
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Enter the company name..."
            />
            <Button
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={handleFetchCompanyInfo}
              disabled={isFetchingCompany}
            >
              {isFetchingCompany ? "Fetching..." : "Research This Company"}
            </Button>
          </Box>

          {/* Company Research Output */}
          {companyInfo && (
            <Card variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "#f9f9f9" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Company Research Summary
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {companyInfo}
              </Typography>
            </Card>
          )}

          <TextField
            fullWidth
            multiline
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box mt={2}>
            <Button variant="contained" onClick={handleSave}>
              Save Custom Template
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CoverLetterTemplates;
