/**
 * SCHEDULED REPORTS SETTINGS COMPONENT (UC-111)
 *
 * Allows users to configure automated progress reports.
 * Settings include frequency, content, and recipients.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Alert,
  Divider,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as reportsService from "../services/scheduledReportsService";
import type {
  ReportConfig,
  ReportFrequency,
  ProgressReport,
} from "../services/scheduledReportsService";

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledReportsSettingsProps {
  onConfigChange?: (config: ReportConfig) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScheduledReportsSettings({
  onConfigChange,
}: ScheduledReportsSettingsProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [previewReport, setPreviewReport] = useState<ProgressReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      if (!user?.id || !currentTeam?.id) return;

      setLoading(true);
      try {
        const result = await reportsService.getReportConfig(
          user.id,
          currentTeam.id
        );
        if (result.data) {
          setConfig(result.data);
        }
      } catch {
        setError("Failed to load report settings");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [user?.id, currentTeam?.id]);

  // Handle config changes
  async function handleConfigChange(updates: Partial<ReportConfig>) {
    if (!user?.id || !currentTeam?.id || !config) return;

    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    setSaving(true);
    setError(null);

    try {
      const result = await reportsService.updateReportConfig(
        user.id,
        currentTeam.id,
        updates
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setSuccess("Settings saved");
      setTimeout(() => setSuccess(null), 3000);
      onConfigChange?.(result.data!);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Generate preview report
  async function handlePreview() {
    if (!user?.id || !currentTeam?.id) return;

    setShowPreview(true);
    try {
      const result = await reportsService.generateProgressReport(
        user.id,
        currentTeam.id,
        config?.frequency === "monthly" ? "monthly" : "weekly"
      );

      if (result.data) {
        setPreviewReport(result.data);
      }
    } catch {
      setError("Failed to generate preview");
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={100} />
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <ScheduleIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Scheduled Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Automatically receive progress summaries
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Enable/Disable */}
        <FormControlLabel
          control={
            <Switch
              checked={config?.isEnabled ?? false}
              onChange={(e) =>
                handleConfigChange({ isEnabled: e.target.checked })
              }
              disabled={saving}
            />
          }
          label="Enable automated progress reports"
        />

        {config?.isEnabled && (
          <>
            <Divider />

            {/* Frequency */}
            <FormControl fullWidth size="small">
              <InputLabel>Report Frequency</InputLabel>
              <Select
                value={config?.frequency || "weekly"}
                label="Report Frequency"
                onChange={(e) =>
                  handleConfigChange({
                    frequency: e.target.value as ReportFrequency,
                  })
                }
                disabled={saving}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Every 2 Weeks</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            {/* Day of Week for Weekly Reports */}
            {(config?.frequency === "weekly" ||
              config?.frequency === "biweekly") && (
              <FormControl fullWidth size="small">
                <InputLabel>Send On</InputLabel>
                <Select
                  value={config?.dayOfWeek ?? 1}
                  label="Send On"
                  onChange={(e) =>
                    handleConfigChange({ dayOfWeek: e.target.value as number })
                  }
                  disabled={saving}
                >
                  <MenuItem value={0}>Sunday</MenuItem>
                  <MenuItem value={1}>Monday</MenuItem>
                  <MenuItem value={2}>Tuesday</MenuItem>
                  <MenuItem value={3}>Wednesday</MenuItem>
                  <MenuItem value={4}>Thursday</MenuItem>
                  <MenuItem value={5}>Friday</MenuItem>
                  <MenuItem value={6}>Saturday</MenuItem>
                </Select>
              </FormControl>
            )}

            <Divider />

            {/* Content Settings */}
            <Typography variant="subtitle2" fontWeight="bold">
              Include in Report
            </Typography>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.includeApplications ?? true}
                    onChange={(e) =>
                      handleConfigChange({
                        includeApplications: e.target.checked,
                      })
                    }
                    disabled={saving}
                    size="small"
                  />
                }
                label="Application activity"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.includeInterviews ?? true}
                    onChange={(e) =>
                      handleConfigChange({
                        includeInterviews: e.target.checked,
                      })
                    }
                    disabled={saving}
                    size="small"
                  />
                }
                label="Interview progress"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.includeGoals ?? true}
                    onChange={(e) =>
                      handleConfigChange({ includeGoals: e.target.checked })
                    }
                    disabled={saving}
                    size="small"
                  />
                }
                label="Goal progress"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.includeStreak ?? true}
                    onChange={(e) =>
                      handleConfigChange({ includeStreak: e.target.checked })
                    }
                    disabled={saving}
                    size="small"
                  />
                }
                label="Activity streak"
              />
            </Stack>

            <Divider />

            {/* Next Scheduled */}
            {config?.nextScheduledAt && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmailIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    Next report:{" "}
                    <strong>
                      {new Date(config.nextScheduledAt).toLocaleDateString(
                        undefined,
                        {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </strong>
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Preview Button */}
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={saving}
            >
              Preview Report
            </Button>

            {/* Preview Card */}
            {showPreview && previewReport && (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Report Preview
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Period:{" "}
                      {new Date(previewReport.periodStart).toLocaleDateString()}{" "}
                      - {new Date(previewReport.periodEnd).toLocaleDateString()}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`${previewReport.summary.applicationsSubmitted} applications`}
                        size="small"
                        color={
                          previewReport.summary.applicationsChange > 0
                            ? "success"
                            : "default"
                        }
                      />
                      <Chip
                        label={`${previewReport.summary.interviewsScheduled} interviews`}
                        size="small"
                      />
                      {previewReport.summary.offersReceived > 0 && (
                        <Chip
                          label={`${previewReport.summary.offersReceived} offers!`}
                          size="small"
                          color="warning"
                        />
                      )}
                      <Chip
                        label={`${previewReport.summary.currentStreak} day streak`}
                        size="small"
                      />
                    </Stack>

                    {previewReport.highlights.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Highlights:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {previewReport.highlights.map((h, i) => (
                            <li key={i}>
                              <Typography variant="body2">{h}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default ScheduledReportsSettings;
