/**
 * PrivacyControls.tsx
 *
 * UC-112: Peer Networking and Support Groups
 *
 * Component for managing user privacy settings for peer networking features.
 * Allows users to control their visibility, notification preferences, and
 * default privacy levels across peer groups.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Save,
  Visibility,
  VisibilityOff,
  Notifications,
  Group,
  Security,
  Info,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserPeerSettings,
  updateUserPeerSettings,
} from "../services/peerGroupsService";
import type {
  UserPeerSettingsRow,
  PeerPrivacyLevel,
} from "../types/peerGroups.types";

// Privacy level descriptions for user understanding
const PRIVACY_LEVEL_INFO: Record<
  PeerPrivacyLevel,
  { label: string; description: string }
> = {
  full_name: {
    label: "Full Name",
    description:
      "Other members will see your complete name as shown in your profile",
  },
  initials_only: {
    label: "Initials Only",
    description: "Only your initials will be shown (e.g., 'J.D.' for John Doe)",
  },
  anonymous: {
    label: "Anonymous",
    description: "You will appear as 'Anonymous Member' in group interactions",
  },
};

export const PrivacyControls: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<UserPeerSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for form controls
  const [defaultPrivacyLevel, setDefaultPrivacyLevel] =
    useState<PeerPrivacyLevel>("full_name");
  const [showGroupMemberships, setShowGroupMemberships] = useState(true);
  const [showChallengeProgress, setShowChallengeProgress] = useState(true);
  const [showSuccessStories, setShowSuccessStories] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [allowGroupInvites, setAllowGroupInvites] = useState(true);
  const [discoverableInGroups, setDiscoverableInGroups] = useState(true);

  // Load user settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
  const settingsQuery = useQuery({
    queryKey: networkKeys.peerSettings(userId ?? "anon"),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await getUserPeerSettings(userId as string);
      if (result.error) throw new Error(result.error.message);
      return result.data as UserPeerSettingsRow;
    },
  });

  const settings = settingsQuery.data ?? null;

  // Populate form when settings load/change
  useEffect(() => {
    if (!settings) return;
    setDefaultPrivacyLevel(settings.default_privacy_level);
    setShowGroupMemberships(settings.show_group_memberships);
    setShowChallengeProgress(settings.show_challenge_progress);
    setShowSuccessStories(settings.show_success_stories);
    setEmailNotifications(settings.email_notifications);
    setPushNotifications(settings.push_notifications);
    setAllowGroupInvites(settings.allow_group_invites);
    setDiscoverableInGroups(settings.discoverable_in_groups);
  }, [settings]);
        showSuccessStories !== settings.show_success_stories ||
        emailNotifications !== settings.email_notifications ||
        pushNotifications !== settings.push_notifications ||
        allowGroupInvites !== settings.allow_group_invites ||
        discoverableInGroups !== settings.discoverable_in_groups;
      setHasChanges(changed);
    }
  }, [
    settings,
    defaultPrivacyLevel,
    showGroupMemberships,
    showChallengeProgress,
    showSuccessStories,
    emailNotifications,
    pushNotifications,
    allowGroupInvites,
    discoverableInGroups,
  ]);

  // Save settings
  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateUserPeerSettings(userId, {
        default_privacy_level: defaultPrivacyLevel,
        show_group_memberships: showGroupMemberships,
        show_challenge_progress: showChallengeProgress,
        show_success_stories: showSuccessStories,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        allow_group_invites: allowGroupInvites,
      const result = await updateUserPeerSettings(userId, {
      });

      if (result.data) {
        setSettings(result.data);
        setSuccess(true);
        setHasChanges(false);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else if (result.error) {
        setError(result.error.message);
      }
        queryClient.setQueryData(networkKeys.peerSettings(userId), result.data);
      console.error("Error saving peer settings:", err);
      setError("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to saved settings
  const handleReset = () => {
    if (settings) {
      setDefaultPrivacyLevel(settings.default_privacy_level);
      setShowGroupMemberships(settings.show_group_memberships);
      setShowChallengeProgress(settings.show_challenge_progress);
      setShowSuccessStories(settings.show_success_stories);
      setEmailNotifications(settings.email_notifications);
      setPushNotifications(settings.push_notifications);
      setAllowGroupInvites(settings.allow_group_invites);
      setDiscoverableInGroups(settings.discoverable_in_groups);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
  if (settingsQuery.isLoading) {
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        <Security sx={{ verticalAlign: "middle", mr: 1 }} />
        Privacy &amp; Notification Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Control how you appear in peer groups and manage your notification
  const queryError = (settingsQuery.error as Error | null)?.message ?? null;
  const displayedError = error ?? queryError;
        preferences.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
      {displayedError && (
      )}
          {displayedError}
      {/* Default Privacy Level */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Visibility />
              <Typography fontWeight="medium">Default Privacy Level</Typography>
              <Tooltip title="This setting determines how your identity appears by default when joining new groups or making posts">
                <Info fontSize="small" color="action" />
              </Tooltip>
            </Stack>
          </FormLabel>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            Choose how you want to appear to other group members by default
          </Typography>
          <RadioGroup
            value={defaultPrivacyLevel}
            onChange={(e) =>
              setDefaultPrivacyLevel(e.target.value as PeerPrivacyLevel)
            }
          >
            {Object.entries(PRIVACY_LEVEL_INFO).map(([value, info]) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography>{info.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {info.description}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Visibility Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <VisibilityOff sx={{ verticalAlign: "middle", mr: 1 }} />
          Visibility Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control what information other members can see about you
        </Typography>

        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={showGroupMemberships}
                onChange={(e) => setShowGroupMemberships(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Show Group Memberships</Typography>
                <Typography variant="caption" color="text.secondary">
                  Allow other members to see which groups you belong to
                </Typography>
              </Box>
            }
          />
          <Divider />
          <FormControlLabel
            control={
              <Switch
                checked={showChallengeProgress}
                onChange={(e) => setShowChallengeProgress(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Show Challenge Progress</Typography>
                <Typography variant="caption" color="text.secondary">
                  Display your progress in group challenges on leaderboards
                </Typography>
              </Box>
            }
          />
          <Divider />
          <FormControlLabel
            control={
              <Switch
                checked={showSuccessStories}
                onChange={(e) => setShowSuccessStories(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Show Success Stories</Typography>
                <Typography variant="caption" color="text.secondary">
                  Allow your success stories to be visible to other members
                </Typography>
              </Box>
            }
          />
          <Divider />
          <FormControlLabel
            control={
              <Switch
                checked={discoverableInGroups}
                onChange={(e) => setDiscoverableInGroups(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Discoverable in Groups</Typography>
                <Typography variant="caption" color="text.secondary">
                  Appear in member directories and be findable by other members
                </Typography>
              </Box>
            }
          />
        </Stack>
      </Paper>

      {/* Group Preferences */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Group sx={{ verticalAlign: "middle", mr: 1 }} />
          Group Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control how others can interact with you in groups
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={allowGroupInvites}
              onChange={(e) => setAllowGroupInvites(e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography>Allow Group Invites</Typography>
              <Typography variant="caption" color="text.secondary">
                Let other members invite you to join their groups
              </Typography>
            </Box>
          }
        />
      </Paper>

      {/* Notification Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Notifications sx={{ verticalAlign: "middle", mr: 1 }} />
          Notification Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how you want to be notified about group activity
        </Typography>

        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Email Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive email updates about group activity, replies, and
                  mentions
                </Typography>
              </Box>
            }
          />
          <Divider />
          <FormControlLabel
            control={
              <Switch
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography>Push Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive browser notifications for real-time updates
                </Typography>
              </Box>
            }
          />
        </Stack>
      </Paper>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={!hasChanges || saving}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={
            saving ? <CircularProgress size={20} color="inherit" /> : <Save />
          }
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </Stack>
    </Box>
  );
};

export default PrivacyControls;
