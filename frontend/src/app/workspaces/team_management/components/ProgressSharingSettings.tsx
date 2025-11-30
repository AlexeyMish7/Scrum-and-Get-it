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
  Tooltip,
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
  EmojiEvents as EmojiEventsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
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
    label: "Private",
    description: "Only you can see your progress",
    icon: <VisibilityOffIcon />,
  },
  {
    value: "mentors_only",
    label: "Mentors Only",
    description: "Only your assigned mentors can view",
    icon: <PersonIcon />,
  },
  {
    value: "accountability",
    label: "Accountability Partners",
    description: "Mentors and accountability partners can view",
    icon: <PeopleIcon />,
  },
  {
    value: "team",
    label: "Team Members",
    description: "All team members can view your progress",
    icon: <GroupsIcon />,
  },
  {
    value: "public",
    label: "Public (Coming Soon)",
    description: "Anyone in the organization can view",
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
            <Typography variant="h6">Progress Sharing Settings</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh settings">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
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
                Save Changes
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
            sx={{ cursor: "pointer" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <VisibilityIcon color="action" />
              <Typography variant="subtitle2">What data to share</Typography>
            </Stack>
            <IconButton size="small">
              {showDataOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>

          <Collapse in={showDataOptions}>
            <FormGroup sx={{ mt: 2 }}>
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
                    <Typography variant="body2">Applications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share application counts and status distribution
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
                    <Typography variant="body2">Interviews</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share interview scheduling and progress
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
                    <Typography variant="body2">Offers</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share offer counts and outcomes
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
                      Share goal progress and completion rates
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.shareActivityTimeline ?? false}
                    onChange={() => handleToggleChange("shareActivityTimeline")}
                    disabled={saving || settings?.visibility === "private"}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Activity Timeline</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share detailed activity history
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
                    <Typography variant="body2">Documents</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow access to resumes and cover letters for review
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
            sx={{ cursor: "pointer" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsIcon color="action" />
              <Typography variant="subtitle2">Notifications</Typography>
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
            <FormGroup sx={{ mt: 2 }}>
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
                      Achievement Celebrations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notify when you reach milestones
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
                    <Typography variant="body2">Weekly Summary</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive weekly progress summary emails
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.notifyOnView ?? false}
                    onChange={() => handleToggleChange("notifyOnView")}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Profile Views</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notify when someone views your progress
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Collapse>
        </Box>

        <Divider />

        {/* Team Features */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <EmojiEventsIcon color="action" />
            <Typography variant="subtitle2">Team Features</Typography>
          </Stack>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.showOnTeamLeaderboard ?? false}
                  onChange={() => handleToggleChange("showOnTeamLeaderboard")}
                  disabled={saving || settings?.visibility === "private"}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Team Leaderboard</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Appear on the team leaderboard (opt-in)
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
                  <Typography variant="body2">Receive Encouragement</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow team members to send you encouragement
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </Box>

        {/* Privacy Note */}
        {settings?.visibility !== "private" && (
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              Your progress data is shared according to these settings. You can
              change these at any time.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export default ProgressSharingSettings;
