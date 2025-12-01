/**
 * TemplateManager - Template & Theme Manager Page
 *
 * Browse and select templates and themes for documents
 */

import { useState } from "react";
import { Container, Typography, Box, Tabs, Tab, Divider } from "@mui/material";
import type { Template, Theme, TemplateCategory } from "../../types";
import { TemplateGallery } from "@ai_workspace/components/templates";
import { ThemeGallery } from "@ai_workspace/components/themes";

type ViewMode = "templates" | "themes";

export default function TemplateManager() {
  const [viewMode, setViewMode] = useState<ViewMode>("templates");
  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("resume");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleSelectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Templates & Themes
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Browse templates (structure) and themes (visual styling) - mix and match
        any combination
      </Typography>

      {/* View mode tabs */}
      <Tabs
        value={viewMode}
        onChange={(_, value) => setViewMode(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Templates" value="templates" />
        <Tab label="Themes" value="themes" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {viewMode === "templates" ? (
          <>
            {/* Template category tabs */}
            <Tabs
              value={templateCategory}
              onChange={(_, value) => setTemplateCategory(value)}
              sx={{ mb: 3 }}
            >
              <Tab label="Resume Templates" value="resume" />
              <Tab label="Cover Letter Templates" value="cover-letter" />
            </Tabs>

            <Divider sx={{ mb: 3 }} />

            {/* Template gallery */}
            <TemplateGallery
              category={templateCategory}
              selectedTemplateId={selectedTemplate?.id}
            />
          </>
        ) : (
          <>
            {/* Theme gallery */}
            <ThemeGallery
              onSelectTheme={handleSelectTheme}
              selectedThemeId={selectedTheme?.id}
            />
          </>
        )}
      </Box>

      {/* Selection summary */}
      {(selectedTemplate || selectedTheme) && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 2,
            boxShadow: 4,
            minWidth: 300,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Current Selection
          </Typography>
          {selectedTemplate && (
            <Typography variant="body2" color="text.secondary">
              Template: {selectedTemplate.name}
            </Typography>
          )}
          {selectedTheme && (
            <Typography variant="body2" color="text.secondary">
              Theme: {selectedTheme.name}
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
}
