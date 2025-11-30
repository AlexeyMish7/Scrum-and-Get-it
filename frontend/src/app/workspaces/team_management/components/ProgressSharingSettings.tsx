/**
 * PROGRESS SHARING SETTINGS COMPONENT (UC-111)
 *
 * Purpose:
 * - Configure privacy settings for what data to share
 * - Set report generation preferences
 * - Configure notification settings
 * - Enable/disable progress sharing
 *
 * Used by:
 * - ProgressSharingPage for settings management
 * - TeamSettings for quick access
 */

import { useState, useEffect } from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Slider,
  Collapse,
  Chip,
} from "@mui/material";
import {
  Share as ShareIcon,
  VisibilityOff as PrivacyIcon,
  Description as ReportIcon,
  Notifications as NotificationIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as progressService from "../services/progressSharingService";
import type {
  ShareSettings,
  ReportSettings,
  NotificationSettings,
} from "../types/progress.types";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressSharingSettingsProps {
  onSave?: () => void;
  compact?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressSharingSettings({
  onSave,
  compact = false,
}: ProgressSharingSettingsProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Expand/collapse sections
  const [expandPrivacy, setExpandPrivacy] = useState(true);
  const [expandReports, setExpandReports] = useState(false);
  const [expandNotifications, setExpandNotifications] = useState(false);

  // Settings state
  const [isActive, setIsActive] = useState(true);
  const [shareSettings, setShareSettings] = useState<ShareSettings>(
    progressService.getDefaultShareSettings()
  );
  const [reportSettings, setReportSettings] = useState<ReportSettings>(
    progressService.getDefaultReportSettings()
  );
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(
      progressService.getDefaultNotificationSettings()
    );

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      if (!user || !currentTeam) return;

      setLoading(true);
      const result = await progressService.getShareSettings(
        user.id,
        currentTeam.id
      );

      if (result.data) {
        setIsActive(result.data.is_active);
        setShareSettings(result.data.share_settings);
        setReportSettings(result.data.report_settings);
        setNotificationSettings(result.data.notification_settings);
      }

      setLoading(false);
    }

    loadSettings();
  }, [user, currentTeam]);

  // Handle save
  const handleSave = async () => {
    if (!user || !currentTeam) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await progressService.upsertShareSettings(
      user.id,
      currentTeam.id,
      {
        is_active: isActive,
        share_settings: shareSettings,
        report_settings: reportSettings,
        notification_settings: notificationSettings,
      }
    );

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      setHasChanges(false);
      onSave?.();
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  // Handle reset to defaults
  const handleReset = () => {
    setShareSettings(progressService.getDefaultShareSettings());
    setReportSettings(progressService.getDefaultReportSettings());
    setNotificationSettings(progressService.getDefaultNotificationSettings());
    setHasChanges(true);
  };

  // Update handlers with change tracking
  const updateShareSetting = (key: keyof ShareSettings, value: boolean) => {
    setShareSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateReportSetting = (key: keyof ReportSettings, value: boolean) => {
    setReportSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNotificationSetting = (
    key: keyof NotificationSettings,
    value: boolean | number
  ) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading settings...</Typography>
        </Stack>
      </Paper>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Please select a team to configure progress sharing settings.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <ShareIcon color="primary" />
            <Box>
              <Typography variant="h6">Progress Sharing Settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Control what you share with your team and mentors
              </Typography>
            </Box>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => {
                  setIsActive(e.target.checked);
                  setHasChanges(true);
                }}
                color="primary"
              />
            }
            label={isActive ? "Sharing On" : "Sharing Off"}
          />
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success">Settings saved successfully!</Alert>
        )}

        <Collapse in={isActive}>
          <Stack spacing={3}>
            {/* Privacy Settings Section */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: "pointer", py: 1 }}
                onClick={() => setExpandPrivacy(!expandPrivacy)}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PrivacyIcon color="action" />
                  <Typography variant="subtitle1">Privacy Controls</Typography>
                  <Chip
                    size="small"
                    label={`${
                      Object.values(shareSettings).filter(Boolean).length
                    } shared`}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                {expandPrivacy ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Stack>

              <Collapse in={expandPrivacy}>
                <Box sx={{ pl: 4, pt: 1 }}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_job_stats}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_job_stats",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share job application statistics"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_application_count}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_application_count",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share total application count"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_interview_count}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_interview_count",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share interview count"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_offer_count}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_offer_count",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share offer count"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_goals}
                          onChange={(e) =>
                            updateShareSetting("share_goals", e.target.checked)
                          }
                          size="small"
                        />
                      }
                      label="Share goals and progress"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_milestones}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_milestones",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share milestones and achievements"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_activity_timeline}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_activity_timeline",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share activity timeline"
                    />

                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ pb: 1 }}
                    >
                      Sensitive Information (Off by default)
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_company_names}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_company_names",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share company names"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_salary_info}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_salary_info",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share salary information"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareSettings.share_documents}
                          onChange={(e) =>
                            updateShareSetting(
                              "share_documents",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Share resumes and cover letters"
                    />
                  </Stack>
                </Box>
              </Collapse>
            </Box>

            <Divider />

            {/* Report Settings Section */}
            {!compact && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: "pointer", py: 1 }}
                  onClick={() => setExpandReports(!expandReports)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ReportIcon color="action" />
                    <Typography variant="subtitle1">
                      Progress Reports
                    </Typography>
                  </Stack>
                  {expandReports ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Stack>

                <Collapse in={expandReports}>
                  <Box sx={{ pl: 4, pt: 1 }}>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportSettings.auto_generate_weekly}
                            onChange={(e) =>
                              updateReportSetting(
                                "auto_generate_weekly",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Auto-generate weekly progress reports"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportSettings.auto_generate_monthly}
                            onChange={(e) =>
                              updateReportSetting(
                                "auto_generate_monthly",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Auto-generate monthly progress reports"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportSettings.include_insights}
                            onChange={(e) =>
                              updateReportSetting(
                                "include_insights",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Include AI-generated insights"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportSettings.include_recommendations}
                            onChange={(e) =>
                              updateReportSetting(
                                "include_recommendations",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Include recommendations"
                      />
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            )}

            {!compact && <Divider />}

            {/* Notification Settings Section */}
            {!compact && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: "pointer", py: 1 }}
                  onClick={() => setExpandNotifications(!expandNotifications)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <NotificationIcon color="action" />
                    <Typography variant="subtitle1">Notifications</Typography>
                  </Stack>
                  {expandNotifications ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </Stack>

                <Collapse in={expandNotifications}>
                  <Box sx={{ pl: 4, pt: 1 }}>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.notify_on_milestone}
                            onChange={(e) =>
                              updateNotificationSetting(
                                "notify_on_milestone",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Notify team when I achieve milestones"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              notificationSettings.notify_on_goal_complete
                            }
                            onChange={(e) =>
                              updateNotificationSetting(
                                "notify_on_goal_complete",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Notify team when I complete goals"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              notificationSettings.notify_mentor_on_inactivity
                            }
                            onChange={(e) =>
                              updateNotificationSetting(
                                "notify_mentor_on_inactivity",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        }
                        label="Allow mentor to be notified if I'm inactive"
                      />

                      {notificationSettings.notify_mentor_on_inactivity && (
                        <Box sx={{ px: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            gutterBottom
                          >
                            Inactivity threshold:{" "}
                            {notificationSettings.inactivity_threshold_days}{" "}
                            days
                          </Typography>
                          <Slider
                            value={
                              notificationSettings.inactivity_threshold_days
                            }
                            onChange={(_, value) =>
                              updateNotificationSetting(
                                "inactivity_threshold_days",
                                value as number
                              )
                            }
                            min={3}
                            max={30}
                            marks={[
                              { value: 3, label: "3" },
                              { value: 7, label: "7" },
                              { value: 14, label: "14" },
                              { value: 30, label: "30" },
                            ]}
                            valueLabelDisplay="auto"
                            size="small"
                          />
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            )}
          </Stack>
        </Collapse>

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default ProgressSharingSettings;
