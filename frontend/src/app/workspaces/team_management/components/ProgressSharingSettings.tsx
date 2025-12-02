/**
 * PROGRESS SHARING SETTINGS COMPONENT (UC-111)
 *
 * Purpose:
 * - Configure privacy settings for progress sharing with team members
 * - Control what data is shared (applications, interviews, offers, goals)
 * - Set visibility levels (mentors only, team, accountability partners)
 * - Manage notification preferences
 *
 * Used by:
 * - CandidateProgressPage for inline settings management
 * - Settings page for dedicated configuration
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Public as PublicIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as progressService from "../services/progressSharingService";
import type {
  ProgressSharingSettings as SettingsType,
  SharingVisibility,
  UpdateSharingSettingsData,
} from "../services/progressSharingService";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressSharingSettingsProps {
  onSettingsChange?: (settings: SettingsType) => void;
  compact?: boolean;
}

// ============================================================================
// VISIBILITY OPTIONS
// ============================================================================

const VISIBILITY_OPTIONS: Array<{
  value: SharingVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "private",
    label: "Keep Private",
    description: "Only you can see your progress - nobody else",
    icon: <VisibilityOffIcon />,
  },
  {
    value: "mentors_only",
    label: "Share with Mentors",
    description: "Your assigned mentors can see your progress",
    icon: <PersonIcon />,
  },
  {
    value: "accountability",
    label: "Share with Partners",
    description: "Mentors and your accountability partners can see",
    icon: <PeopleIcon />,
  },
  {
    value: "team",
    label: "Share with Team",
    description: "Everyone on your team can see your progress",
    icon: <GroupsIcon />,
  },
  {
    value: "public",
    label: "Public (Coming Soon)",
    description: "Anyone in the organization can see",
    icon: <PublicIcon />,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressSharingSettings({
  onSettingsChange,
  compact = false,
}: ProgressSharingSettingsProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDataOptions, setShowDataOptions] = useState(!compact);
  const [showNotificationOptions, setShowNotificationOptions] = useState(
    !compact
  );

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!user || !currentTeam) return;

      setLoading(true);
      setError(null);

      const result = await progressService.getProgressSharingSettings(
        user.id,
        currentTeam.id
      );

      if (result.error) {
        setError(result.error.message);
      } else if (result.data) {
        setSettings(result.data);
      }

      setLoading(false);
    }

    loadSettings();
  }, [user, currentTeam]);

  // Handle visibility change
  const handleVisibilityChange = (visibility: SharingVisibility) => {
    if (!settings) return;

    const updated = { ...settings, visibility };
    setSettings(updated);
    setHasChanges(true);
  };

  // Handle toggle change
  const handleToggleChange = (field: keyof UpdateSharingSettingsData) => {
    if (!settings) return;

    const updated = {
      ...settings,
      [field]: !settings[field as keyof SettingsType],
    };
    setSettings(updated as SettingsType);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!user || !currentTeam || !settings) return;

    setSaving(true);
    setError(null);

    const updates: UpdateSharingSettingsData = {
      visibility: settings.visibility,
      shareApplications: settings.shareApplications,
      shareInterviews: settings.shareInterviews,
      shareOffers: settings.shareOffers,
      shareGoals: settings.shareGoals,
      shareActivityTimeline: settings.shareActivityTimeline,
      shareDocuments: settings.shareDocuments,
      notifyOnView: settings.notifyOnView,
      notifyOnCelebration: settings.notifyOnCelebration,
      notifyWeeklySummary: settings.notifyWeeklySummary,
      showOnTeamLeaderboard: settings.showOnTeamLeaderboard,
      allowEncouragement: settings.allowEncouragement,
    };

    const result = await progressService.updateProgressSharingSettings(
      user.id,
      currentTeam.id,
      updates
    );

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setSettings(result.data);
      setHasChanges(false);
      onSettingsChange?.(result.data);
    }

    setSaving(false);
  };

  // Refresh settings
  const handleRefresh = async () => {
    if (!user || !currentTeam) return;

    setLoading(true);
    const result = await progressService.getProgressSharingSettings(
      user.id,
      currentTeam.id
    );

    if (result.data) {
      setSettings(result.data);
      setHasChanges(false);
    }

    setLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={24} />
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon color="primary" />
            <Box>
              <Typography variant="h6">Privacy Settings</Typography>
              <Typography variant="caption" color="text.secondary">
                Control who sees your job search progress
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {hasChanges && (
              <Button
                variant="contained"
                size="small"
                startIcon={
                  saving ? <CircularProgress size={16} /> : <SaveIcon />
                }
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Visibility Level Selector */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Who can see your progress?
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="visibility-label">Visibility Level</InputLabel>
            <Select
              labelId="visibility-label"
              value={settings?.visibility || "mentors_only"}
              label="Visibility Level"
              onChange={(e) =>
                handleVisibilityChange(e.target.value as SharingVisibility)
              }
              disabled={saving}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={option.value === "public"}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {option.icon}
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Visibility chip indicator */}
          <Box sx={{ mt: 1 }}>
            <Chip
              icon={
                VISIBILITY_OPTIONS.find((o) => o.value === settings?.visibility)
                  ?.icon as React.ReactElement
              }
              label={
                VISIBILITY_OPTIONS.find((o) => o.value === settings?.visibility)
                  ?.label
              }
              color={
                settings?.visibility === "private"
                  ? "default"
                  : settings?.visibility === "team"
                  ? "primary"
                  : "info"
              }
              size="small"
            />
          </Box>
        </Box>

        <Divider />

        {/* Data Sharing Options */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setShowDataOptions(!showDataOptions)}
            sx={{ cursor: "pointer", py: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <VisibilityIcon color="action" />
              <Box>
                <Typography variant="subtitle2">What to Share</Typography>
                <Typography variant="caption" color="text.secondary">
                  Choose which parts of your progress others can see
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small">
              {showDataOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>

          <Collapse in={showDataOptions}>
            <FormGroup sx={{ mt: 2, pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareApplications ?? true}
                    onChange={() => handleToggleChange("shareApplications")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Job Applications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      How many jobs you've applied to and their statuses
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareInterviews ?? true}
                    onChange={() => handleToggleChange("shareInterviews")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Interview Progress</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your interview schedule and how many you've completed
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareOffers ?? true}
                    onChange={() => handleToggleChange("shareOffers")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Job Offers</Typography>
                    <Typography variant="caption" color="text.secondary">
                      When you receive or accept offers
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareGoals ?? true}
                    onChange={() => handleToggleChange("shareGoals")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Goals</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your job search goals and completion progress
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareDocuments ?? false}
                    onChange={() => handleToggleChange("shareDocuments")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Resumes & Cover Letters
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Let team members review your documents
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Collapse>
        </Box>

        <Divider />

        {/* Notification Options */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setShowNotificationOptions(!showNotificationOptions)}
            sx={{ cursor: "pointer", py: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsIcon color="action" />
              <Box>
                <Typography variant="subtitle2">Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Control when you get notified about progress updates
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small">
              {showNotificationOptions ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </IconButton>
          </Stack>

          <Collapse in={showNotificationOptions}>
            <FormGroup sx={{ mt: 2, pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.notifyOnCelebration ?? true}
                    onChange={() => handleToggleChange("notifyOnCelebration")}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Milestone Celebrations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get notified when you hit important milestones
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.notifyWeeklySummary ?? true}
                    onChange={() => handleToggleChange("notifyWeeklySummary")}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Weekly Summary Email
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive a weekly report of your progress
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.allowEncouragement ?? true}
                    onChange={() => handleToggleChange("allowEncouragement")}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Team Encouragement</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Let team members send you motivational messages
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Collapse>
        </Box>

        {/* Privacy Note */}
        {settings?.visibility === "private" ? (
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              Your progress is <strong>completely private</strong>. Only you can
              see your data.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="success" variant="outlined">
            <Typography variant="body2">
              Your progress is being shared with{" "}
              <strong>
                {settings?.visibility === "mentors_only"
                  ? "your mentors"
                  : settings?.visibility === "accountability"
                  ? "your mentors and partners"
                  : "your team"}
              </strong>
              . You can change this anytime.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export default ProgressSharingSettings;
