/**
 * BrandingEditor.tsx
 *
 * Component for managing white-label branding in enterprise career services.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import PaletteIcon from "@mui/icons-material/Palette";
import ImageIcon from "@mui/icons-material/Image";
import { useEnterprise } from "../../hooks/useEnterprise";
import type { BrandingFormData } from "../../types/enterprise.types";

interface BrandingEditorProps {
  teamId: string;
}

export const BrandingEditor = ({ teamId }: BrandingEditorProps) => {
  // Use loadingBranding and error from useEnterprise
  const { branding, loadingBranding, error, updateBranding, refreshBranding } =
    useEnterprise(teamId);

  const [formData, setFormData] = useState<BrandingFormData>({
    logo_url: "",
    primary_color: "#1976d2",
    secondary_color: "#dc004e",
    custom_css: "",
    welcome_message: "",
    footer_text: "",
    is_active: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData({
        logo_url: branding.logo_url || "",
        primary_color: branding.primary_color || "#1976d2",
        secondary_color: branding.secondary_color || "#dc004e",
        custom_css: branding.custom_css || "",
        welcome_message: branding.login_welcome_text || "",
        footer_text: branding.email_footer_text || "",
        is_active: !!branding.organization_name,
      });
    }
  }, [branding]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateBranding(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save branding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (
    field: "primary_color" | "secondary_color",
    value: string
  ) => {
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
      setFormData({ ...formData, [field]: value });
    }
  };

  if (loadingBranding) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">
          <PaletteIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Branding Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshBranding()}
            sx={{ mr: 1 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Branding settings saved successfully!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
              }
              label="Enable Custom Branding"
            />
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              <ImageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Logo
            </Typography>
            <TextField
              label="Logo URL"
              value={formData.logo_url}
              onChange={(e) =>
                setFormData({ ...formData, logo_url: e.target.value })
              }
              fullWidth
              placeholder="https://example.com/logo.png"
              helperText="Enter the URL of your institution's logo"
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle1" gutterBottom>
              <PaletteIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Colors
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Primary Color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      handleColorChange("primary_color", e.target.value)
                    }
                    fullWidth
                  />
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: formData.primary_color || "#ccc",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Secondary Color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      handleColorChange("secondary_color", e.target.value)
                    }
                    fullWidth
                  />
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: formData.secondary_color || "#ccc",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
            <Typography variant="subtitle1" gutterBottom>
              Custom Text
            </Typography>
            <TextField
              label="Welcome Message"
              value={formData.welcome_message}
              onChange={(e) =>
                setFormData({ ...formData, welcome_message: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              placeholder="Welcome to our career services platform!"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Footer Text"
              value={formData.footer_text}
              onChange={(e) =>
                setFormData({ ...formData, footer_text: e.target.value })
              }
              fullWidth
              placeholder="© 2025 Your Institution. All rights reserved."
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle1" gutterBottom>
              Custom CSS (Advanced)
            </Typography>
            <TextField
              label="Custom CSS"
              value={formData.custom_css}
              onChange={(e) =>
                setFormData({ ...formData, custom_css: e.target.value })
              }
              fullWidth
              multiline
              rows={4}
              placeholder=".header { background: #your-color; }"
              helperText="Advanced: Add custom CSS to further customize the appearance"
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {formData.logo_url && (
                <Box mb={2}>
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    style={{ maxWidth: "100%", maxHeight: 60 }}
                  />
                </Box>
              )}
              <Box display="flex" gap={1} mb={2}>
                <Box
                  sx={{
                    flex: 1,
                    height: 40,
                    backgroundColor: formData.primary_color || "#1976d2",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#fff" }}>
                    Primary
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    height: 40,
                    backgroundColor: formData.secondary_color || "#dc004e",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#fff" }}>
                    Secondary
                  </Typography>
                </Box>
              </Box>
              {formData.welcome_message && (
                <Box mb={2} p={2} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    Welcome Message:
                  </Typography>
                  <Typography variant="body1">
                    {formData.welcome_message}
                  </Typography>
                </Box>
              )}
              <Box mt={2} textAlign="center">
                <Typography
                  variant="body2"
                  color={formData.is_active ? "success.main" : "text.secondary"}
                >
                  {formData.is_active
                    ? "✓ Branding Active"
                    : "Branding Disabled"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BrandingEditor;
