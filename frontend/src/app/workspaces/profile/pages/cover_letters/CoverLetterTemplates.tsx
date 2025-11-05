import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

// ===== Default templates =====
const defaultTemplates = [
  {
    id: 1,
    name: "Formal Template",
    category: "Corporate",
    sampleHtml: `
      <p>Dear Hiring Manager,</p>
      <p>I am writing to apply for the [Position] role at [Company]. 
      With my experience in [Field], I am confident in my ability to contribute effectively.</p>
      <p>Sincerely,<br/>[Your Name]</p>
    `,
  },
  {
    id: 2,
    name: "Creative Template",
    category: "Design",
    sampleHtml: `
      <p>Hello [Company] Team,</p>
      <p>As a creative professional passionate about innovation and visual storytelling, 
      I’m thrilled by the opportunity to bring my ideas to your team.</p>
      <p>Warm regards,<br/>[Your Name]</p>
    `,
  },
  {
    id: 3,
    name: "Technical Template",
    category: "Engineering",
    sampleHtml: `
      <p>Dear [Hiring Manager's Name],</p>
      <p>As a software engineer with expertise in [Tech Stack], 
      I’m eager to help [Company] build scalable, high-performing solutions.</p>
      <p>Best regards,<br/>[Your Name]</p>
    `,
  },
];

// ===== Industry variants =====
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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [industry, setIndustry] = useState("");
  const [content, setContent] = useState("");
  const [templates, setTemplates] = useState(defaultTemplates);

  // 🔹 Analytics
  const [analytics, setAnalytics] = useState<{ [key: string]: number }>({});

  // 🔹 Load analytics and imported templates
  useEffect(() => {
    const savedAnalytics = JSON.parse(
      localStorage.getItem("templateAnalytics") || "{}"
    );
    const savedCustom = JSON.parse(localStorage.getItem("customTemplates") || "[]");
    setAnalytics(savedAnalytics);
    setTemplates([...defaultTemplates, ...savedCustom]);
  }, []);

  // 🔹 Save analytics whenever updated
  useEffect(() => {
    localStorage.setItem("templateAnalytics", JSON.stringify(analytics));
  }, [analytics]);

  // 🔹 Auto-load shared template from URL (if any)
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
          const base = sharedTemplate.sampleHtml;
          const industryText = industryVariants[sharedIndustry] || "";
          const updated = base.replace(
            "</p>\n      <p>Sincerely",
            `</p>\n      <p>${industryText}</p>\n      <p>Sincerely`
          );
          setContent(updated);
        }
      }
    }
  }, [templates]);

  // 🔹 Handle template selection
  const handleSelect = (template: any) => {
    setSelectedTemplate(template);
    setIndustry("");
    setView("preview");

    // Log analytics
    setAnalytics((prev) => ({
      ...prev,
      [template.name]: (prev[template.name] || 0) + 1,
    }));
  };

  // 🔹 Handle industry update
  const handleIndustryChange = (e: any) => {
    const chosen = e.target.value;
    setIndustry(chosen);
    const base = selectedTemplate.sampleHtml;
    const industryText = industryVariants[chosen] || "";
    const updated = base.replace(
      "</p>\n      <p>Sincerely",
      `</p>\n      <p>${industryText}</p>\n      <p>Sincerely`
    );
    setContent(updated);
  };

  const handleUse = () => {
    setAnalytics((prev) => ({
      ...prev,
      [`${selectedTemplate.name}-used`]:
        (prev[`${selectedTemplate.name}-used`] || 0) + 1,
    }));
    setView("edit");
  };

  const handleSave = () => {
    console.log("Saved custom content:", content);
    alert("Template saved successfully!");
    setView("gallery");
  };

  // 🔹 IMPORT CUSTOM TEMPLATE FEATURE
  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const valid = imported.filter((t) => t.name && t.sampleHtml && t.category);
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

  return (
    <Box sx={{ p: 4 }}>
      {/* ===== GALLERY ===== */}
      {view === "gallery" && (
        <>
          <Typography variant="h4" mb={3}>
            Choose a Cover Letter Template
          </Typography>

          {/* 🔹 Import button */}
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

          <Grid container spacing={2}>
            {templates.map((t) => (
              <Grid size={12} key={t.id || t.name}>
                <Card
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
              </Grid>
            ))}
          </Grid>
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
              border: "1px solid #ccc",
              borderRadius: 2,
              p: 2,
              mt: 3,
              bgcolor: "#fafafa",
              minHeight: 200,
            }}
            dangerouslySetInnerHTML={{
              __html: industry ? content : selectedTemplate.sampleHtml,
            }}
          />

          {industry && (
            <Box display="flex" gap={2} mt={2}>
              <Button variant="contained" onClick={handleUse}>
                Use This Template
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?template=${encodeURIComponent(
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