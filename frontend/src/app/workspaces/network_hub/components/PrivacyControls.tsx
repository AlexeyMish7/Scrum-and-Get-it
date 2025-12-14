/**
 * PrivacyControls.tsx
 *
 * UC-112: Peer Networking and Support Groups
 *
 * NOTE: This file previously contained merge-conflict / partial edits that broke
 * the TypeScript build. This implementation restores a working settings panel.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { Info, Security, Visibility } from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserPeerSettings,
  updateUserPeerSettings,
} from "../services/peerGroupsService";
import type {
  PeerPrivacyLevel,
  UserPeerSettingsRow,
} from "../types/peerGroups.types";

const peerSettingsKey = (userId: string) => ["network", "peerSettings", userId];

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
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [defaultPrivacyLevel, setDefaultPrivacyLevel] =
    useState<PeerPrivacyLevel>("full_name");
  const [showGroupMemberships, setShowGroupMemberships] = useState(true);
  const [showChallengeProgress, setShowChallengeProgress] = useState(true);
  const [showSuccessStories, setShowSuccessStories] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [allowGroupInvites, setAllowGroupInvites] = useState(true);
  const [discoverableInGroups, setDiscoverableInGroups] = useState(true);

  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: userId ? peerSettingsKey(userId) : ["network", "peerSettings"],
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await getUserPeerSettings(userId as string);
      if (result.error) throw new Error(result.error.message);
      return result.data as UserPeerSettingsRow;
    },
  });

  const settings = settingsQuery.data ?? null;

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

  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return (
      defaultPrivacyLevel !== settings.default_privacy_level ||
      showGroupMemberships !== settings.show_group_memberships ||
      showChallengeProgress !== settings.show_challenge_progress ||
      showSuccessStories !== settings.show_success_stories ||
      emailNotifications !== settings.email_notifications ||
      pushNotifications !== settings.push_notifications ||
      allowGroupInvites !== settings.allow_group_invites ||
      discoverableInGroups !== settings.discoverable_in_groups
    );
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be signed in to save settings");
      const result = await updateUserPeerSettings(userId, {
        default_privacy_level: defaultPrivacyLevel,
        show_group_memberships: showGroupMemberships,
        show_challenge_progress: showChallengeProgress,
        show_success_stories: showSuccessStories,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        allow_group_invites: allowGroupInvites,
        discoverable_in_groups: discoverableInGroups,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data as UserPeerSettingsRow;
    },
    onSuccess: (updated) => {
      setLocalError(null);
      setSuccess(true);
      if (userId) {
        queryClient.setQueryData(peerSettingsKey(userId), updated);
      }
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setLocalError(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const displayedError =
    localError ?? (settingsQuery.error as Error | null)?.message ?? null;

  const handleReset = () => {
    if (!settings) return;
    setDefaultPrivacyLevel(settings.default_privacy_level);
    setShowGroupMemberships(settings.show_group_memberships);
    setShowChallengeProgress(settings.show_challenge_progress);
    setShowSuccessStories(settings.show_success_stories);
    setEmailNotifications(settings.email_notifications);
    setPushNotifications(settings.push_notifications);
    setAllowGroupInvites(settings.allow_group_invites);
    setDiscoverableInGroups(settings.discoverable_in_groups);
  };

  if (!userId) {
    return (
      <Alert severity="info">
        Sign in to manage peer networking privacy settings.
      </Alert>
    );
  }

  if (settingsQuery.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress size={28} />
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
        preferences.
      </Typography>

      {displayedError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setLocalError(null)}
        >
          {displayedError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Visibility />
              <Typography fontWeight="medium">Default Privacy Level</Typography>
              <Tooltip title="This setting determines how your identity appears by default in peer groups">
                <Info fontSize="small" color="action" />
              </Tooltip>
            </Stack>
          </FormLabel>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            Choose how you want to appear to other group members by default.
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
                    <Typography fontWeight="medium">{info.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {info.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography fontWeight="medium" gutterBottom>
          Visibility
        </Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={showGroupMemberships}
                onChange={(e) => setShowGroupMemberships(e.target.checked)}
              />
            }
            label="Show group memberships"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showChallengeProgress}
                onChange={(e) => setShowChallengeProgress(e.target.checked)}
              />
            }
            label="Show challenge progress"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showSuccessStories}
                onChange={(e) => setShowSuccessStories(e.target.checked)}
              />
            }
            label="Show success stories"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography fontWeight="medium" gutterBottom>
          Notifications
        </Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            }
            label="Email notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
              />
            }
            label="Push notifications"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography fontWeight="medium" gutterBottom>
          Discovery
        </Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={allowGroupInvites}
                onChange={(e) => setAllowGroupInvites(e.target.checked)}
              />
            }
            label="Allow group invites"
          />
          <FormControlLabel
            control={
              <Switch
                checked={discoverableInGroups}
                onChange={(e) => setDiscoverableInGroups(e.target.checked)}
              />
            }
            label="Discoverable in groups"
          />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          disabled={!hasChanges || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          startIcon={
            saveMutation.isPending ? <CircularProgress size={16} /> : undefined
          }
        >
          Save
        </Button>
        <Button variant="outlined" disabled={!hasChanges} onClick={handleReset}>
          Reset
        </Button>
      </Stack>
    </Box>
  );
};

export default PrivacyControls;
