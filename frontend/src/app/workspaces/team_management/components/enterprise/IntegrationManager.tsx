/**
 * IntegrationManager.tsx
 *
 * Component for managing external integrations in enterprise career services.
 */

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import LinkIcon from "@mui/icons-material/Link";
import CloudIcon from "@mui/icons-material/Cloud";
import { useEnterprise } from "../../hooks/useEnterprise";
import type {
  ExternalIntegrationRow,
  IntegrationFormData,
  IntegrationTypeEnum,
  CreateIntegrationData,
} from "../../types/enterprise.types";

interface IntegrationManagerProps {
  teamId: string;
}

const integrationTypeInfo: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  job_board: { label: "Job Board", icon: <CloudIcon /> },
  hris: { label: "HRIS System", icon: <SettingsIcon /> },
  ats: { label: "ATS", icon: <SyncIcon /> },
  lms: { label: "LMS", icon: <LinkIcon /> },
  sso: { label: "SSO Provider", icon: <LinkIcon /> },
  crm: { label: "CRM", icon: <SettingsIcon /> },
  calendar: { label: "Calendar", icon: <CloudIcon /> },
  analytics: { label: "Analytics", icon: <SyncIcon /> },
  custom_webhook: { label: "Custom Webhook", icon: <LinkIcon /> },
  sis: { label: "Student Info System", icon: <SettingsIcon /> },
};

export const IntegrationManager = ({ teamId }: IntegrationManagerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<ExternalIntegrationRow | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: "",
    integration_type: "job_board",
    api_endpoint: "",
    api_key: "",
    is_active: true,
    sync_frequency: "daily",
    settings: {},
  });

  // Use the correct properties from useEnterprise
  const {
    integrations,
    loadingIntegrations,
    error,
    createIntegration,
    deleteIntegration,
    testIntegration,
    refreshIntegrations,
  } = useEnterprise(teamId);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      integration_type: "job_board",
      api_endpoint: "",
      api_key: "",
      is_active: true,
      sync_frequency: "daily",
      settings: {},
    });
    setEditingIntegration(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (integration: ExternalIntegrationRow) => {
    setFormData({
      name: integration.name,
      integration_type: integration.integration_type,
      api_endpoint: integration.api_endpoint || "",
      api_key: "",
      is_active: integration.is_active,
      sync_frequency: integration.sync_frequency || "daily",
      settings:
        (integration.sync_settings as unknown as Record<string, unknown>) || {},
    });
    setEditingIntegration(integration);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Convert form data to create integration data format
    const integrationData: CreateIntegrationData = {
      name: formData.name,
      integration_type: formData.integration_type,
      api_endpoint: formData.api_endpoint || undefined,
      auth_type: "api_key",
      sync_frequency: formData.sync_frequency as
        | "realtime"
        | "hourly"
        | "daily"
        | "weekly"
        | "manual",
      credentials: formData.api_key ? { api_key: formData.api_key } : undefined,
    };

    await createIntegration(integrationData);
    setDialogOpen(false);
    setEditingIntegration(null);
    // Refresh integrations list after creating
    await refreshIntegrations();
  };

  const handleDelete = async (integration: ExternalIntegrationRow) => {
    if (
      window.confirm(`Are you sure you want to delete "${integration.name}"?`)
    ) {
      await deleteIntegration(integration.id);
    }
  };

  const handleTest = async (integration: ExternalIntegrationRow) => {
    setTesting(integration.id);
    try {
      await testIntegration(integration.id);
    } finally {
      setTesting(null);
    }
  };

  if (loadingIntegrations) {
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
          <LinkIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          External Integrations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Add Integration
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {integrations.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <CloudIcon
                sx={{ fontSize: 64, color: "action.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Integrations Configured
              </Typography>
              <Typography color="text.secondary" paragraph>
                Connect external career services platforms, job boards, or HRIS
                systems.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Add Your First Integration
              </Button>
            </Paper>
          </Grid>
        ) : (
          integrations.map((integration) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={integration.id}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {integrationTypeInfo[integration.integration_type]?.icon}
                      <Typography variant="h6">{integration.name}</Typography>
                    </Box>
                    <Switch
                      checked={integration.is_active}
                      size="small"
                      disabled
                    />
                  </Box>
                  <Box mt={2}>
                    <Chip
                      label={
                        integrationTypeInfo[integration.integration_type]
                          ?.label || integration.integration_type
                      }
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      icon={
                        integration.is_active ? <CheckIcon /> : <ErrorIcon />
                      }
                      label={integration.is_active ? "Active" : "Inactive"}
                      color={integration.is_active ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Sync: {integration.sync_frequency || "Manual"}
                  </Typography>
                  {integration.last_sync_at && (
                    <Typography variant="body2" color="text.secondary">
                      Last sync:{" "}
                      {new Date(integration.last_sync_at).toLocaleString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={
                      testing === integration.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SyncIcon />
                      )
                    }
                    onClick={() => handleTest(integration)}
                    disabled={testing === integration.id}
                  >
                    Test
                  </Button>
                  <Button
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => handleOpenEdit(integration)}
                  >
                    Configure
                  </Button>
                  <Box flex={1} />
                  <Tooltip title="Delete integration">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(integration)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIntegration ? "Configure Integration" : "Add New Integration"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Integration Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
              placeholder="e.g., LinkedIn Jobs"
            />
            <FormControl fullWidth>
              <InputLabel>Integration Type</InputLabel>
              <Select
                value={formData.integration_type}
                label="Integration Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    integration_type: e.target.value as IntegrationTypeEnum,
                  })
                }
              >
                <MenuItem value="job_board">Job Board</MenuItem>
                <MenuItem value="hris">HRIS System</MenuItem>
                <MenuItem value="ats">Applicant Tracking System</MenuItem>
                <MenuItem value="lms">Learning Management System</MenuItem>
                <MenuItem value="sso">SSO Provider</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="API Endpoint"
              value={formData.api_endpoint}
              onChange={(e) =>
                setFormData({ ...formData, api_endpoint: e.target.value })
              }
              fullWidth
              placeholder="https://api.example.com/v1"
            />
            <TextField
              label="API Key"
              value={formData.api_key}
              onChange={(e) =>
                setFormData({ ...formData, api_key: e.target.value })
              }
              fullWidth
              type="password"
              placeholder={
                editingIntegration
                  ? "Leave blank to keep existing key"
                  : "Enter API key"
              }
            />
            <FormControl fullWidth>
              <InputLabel>Sync Frequency</InputLabel>
              <Select
                value={formData.sync_frequency}
                label="Sync Frequency"
                onChange={(e) =>
                  setFormData({ ...formData, sync_frequency: e.target.value })
                }
              >
                <MenuItem value="realtime">Real-time</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="manual">Manual Only</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
              }
              label="Enable Integration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name}
          >
            {editingIntegration ? "Save Changes" : "Add Integration"}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 3, mt: 3, bgcolor: "info.light" }}>
        <Typography variant="subtitle1" gutterBottom>
          Supported Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your career services platform with popular job boards, HRIS
          systems, ATS, and learning management systems.
        </Typography>
      </Paper>
    </Box>
  );
};

export default IntegrationManager;
