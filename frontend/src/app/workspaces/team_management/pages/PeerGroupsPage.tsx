/**
 * PEER GROUPS PAGE
 *
 * Purpose:
 * - Main hub for peer networking and support groups
 * - Browse and search public groups
 * - View and interact with joined groups
 * - Create new groups
 *
 * Route: /team/groups
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Button,
  Paper,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from "@mui/material";
import {
  Group as GroupIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Forum as ForumIcon,
  EmojiEvents as TrophyIcon,
  Share as ShareIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import {
  PeerGroupBrowser,
  GroupDiscussions,
  GroupChallenges,
} from "../components";
import * as peerNetworkingService from "../services/peerNetworkingService";
import type {
  UserPeerGroupInfo,
  PeerGroupWithCreator,
  PeerGroupMemberWithProfile,
  CreatePeerGroupData,
  PeerGroupType,
  PeerGroupVisibility,
} from "../types";

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`peer-group-tabpanel-${index}`}
      aria-labelledby={`peer-group-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function PeerGroupsPage() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId?: string }>();
  const { user } = useAuth();

  // State
  const [myGroups, setMyGroups] = useState<UserPeerGroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state (for browsing vs my groups)
  const [mainTab, setMainTab] = useState(0);

  // Create group dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePeerGroupData>>({
    group_type: "general",
    visibility: "public",
  });

  // Selected group state
  const [selectedGroup, setSelectedGroup] =
    useState<PeerGroupWithCreator | null>(null);
  const [selectedGroupTab, setSelectedGroupTab] = useState(0);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [groupMembers, setGroupMembers] = useState<PeerGroupMemberWithProfile[]>([]);
  const [isModerator, setIsModerator] = useState(false);

  // Load user's groups
  useEffect(() => {
    async function loadMyGroups() {
      if (!user) return;

      setLoading(true);
      const result = await peerNetworkingService.getUserPeerGroups(user.id);

      if (result.error) {
        setError(result.error.message);
      } else {
        setMyGroups(result.data || []);
      }
      setLoading(false);
    }

    loadMyGroups();
  }, [user]);

  // Load selected group if groupId in URL
  useEffect(() => {
    async function loadGroup() {
      if (!user || !groupId) {
        setSelectedGroup(null);
        return;
      }

      setLoadingGroup(true);
      const result = await peerNetworkingService.getPeerGroup(user.id, groupId);

      if (result.error) {
        setError(result.error.message);
        setSelectedGroup(null);
      } else {
        setSelectedGroup(result.data);

        // Load members
        const membersResult = await peerNetworkingService.getGroupMembers(
          user.id,
          groupId
        );
        if (membersResult.data) {
          setGroupMembers(membersResult.data);
          // Check if current user is moderator
          const myMembership = membersResult.data.find(
            (m) => m.user_id === user.id
          );
          setIsModerator(myMembership?.is_moderator || false);
        }
      }
      setLoadingGroup(false);
    }

    loadGroup();
  }, [user, groupId]);

  // Handle creating a group
  const handleCreateGroup = async () => {
    if (!user || !formData.name) return;

    setCreating(true);
    setError(null);

    const result = await peerNetworkingService.createPeerGroup(user.id, {
      name: formData.name,
      description: formData.description,
      group_type: formData.group_type || "general",
      visibility: formData.visibility || "public",
      industry: formData.industry,
      role_focus: formData.role_focus,
    });

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      // Add to my groups
      setMyGroups((prev) => [
        {
          group_id: result.data!.id,
          group_name: result.data!.name,
          group_type: result.data!.group_type,
          member_count: 1,
          is_moderator: true,
          joined_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowCreateDialog(false);
      setFormData({ group_type: "general", visibility: "public" });

      // Navigate to the new group
      navigate(`/team/groups/${result.data.id}`);
    }

    setCreating(false);
  };

  // Handle group selection
  const handleSelectGroup = (groupId: string) => {
    navigate(`/team/groups/${groupId}`);
  };

  // Handle back to groups list
  const handleBack = () => {
    navigate("/team/groups");
    setSelectedGroup(null);
  };

  // Render group detail view
  const renderGroupDetail = () => {
    if (!selectedGroup) return null;

    return (
      <Box>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ minWidth: "auto" }}
            >
              Back
            </Button>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
              <GroupIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box flex={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h4">{selectedGroup.name}</Typography>
                {selectedGroup.is_featured && (
                  <StarIcon sx={{ color: "warning.main" }} />
                )}
              </Stack>
              <Stack direction="row" spacing={1} mt={1}>
                <Chip
                  label={selectedGroup.group_type}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={selectedGroup.visibility}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<GroupIcon />}
                  label={`${selectedGroup.member_count} members`}
                  size="small"
                />
              </Stack>
              {selectedGroup.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {selectedGroup.description}
                </Typography>
              )}
            </Box>
            {isModerator && (
              <Chip label="Moderator" color="primary" variant="outlined" />
            )}
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedGroupTab}
            onChange={(_, v) => setSelectedGroupTab(v)}
            aria-label="group tabs"
          >
            <Tab icon={<ForumIcon />} label="Discussions" />
            <Tab icon={<TrophyIcon />} label="Challenges" />
            <Tab icon={<GroupIcon />} label="Members" />
            <Tab icon={<ShareIcon />} label="Referrals" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={selectedGroupTab} index={0}>
          <GroupDiscussions groupId={selectedGroup.id} />
        </TabPanel>

        <TabPanel value={selectedGroupTab} index={1}>
          <GroupChallenges groupId={selectedGroup.id} isModerator={isModerator} />
        </TabPanel>

        <TabPanel value={selectedGroupTab} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Group Members ({groupMembers.length})
            </Typography>
            <List>
              {groupMembers.map((member, index) => (
                <div key={member.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {(member.profile?.full_name || "A")[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <span>
                            {member.is_anonymous
                              ? member.display_name || "Anonymous"
                              : member.profile?.full_name || "Unknown"}
                          </span>
                          {member.is_moderator && (
                            <Chip label="Moderator" size="small" color="primary" />
                          )}
                          {member.is_anonymous && (
                            <Chip
                              label="Anonymous"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        member.is_anonymous
                          ? `Joined ${new Date(
                              member.joined_at
                            ).toLocaleDateString()}`
                          : `${
                              member.profile?.professional_title || ""
                            } • Joined ${new Date(
                              member.joined_at
                            ).toLocaleDateString()}`
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`${member.posts_count} posts`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${member.challenges_completed} challenges`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </ListItem>
                </div>
              ))}
            </List>
          </Paper>
        </TabPanel>

        <TabPanel value={selectedGroupTab} index={3}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <ShareIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Referral Sharing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share job referrals with group members. Coming soon!
            </Typography>
          </Paper>
        </TabPanel>
      </Box>
    );
  };

  // Render main groups list view
  const renderGroupsList = () => (
    <Box>
      {/* Tabs: Browse vs My Groups */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          aria-label="peer groups tabs"
        >
          <Tab icon={<SearchIcon />} label="Browse Groups" />
          <Tab
            icon={<GroupIcon />}
            label={`My Groups (${myGroups.length})`}
          />
        </Tabs>
      </Paper>

      {/* Browse Groups Tab */}
      <TabPanel value={mainTab} index={0}>
        <PeerGroupBrowser
          onGroupSelect={(group) => handleSelectGroup(group.id)}
          onCreateGroup={() => setShowCreateDialog(true)}
        />
      </TabPanel>

      {/* My Groups Tab */}
      <TabPanel value={mainTab} index={1}>
        {myGroups.length === 0 ? (
          <Box textAlign="center" py={6}>
            <GroupIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You haven't joined any groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Browse public groups or create your own to start networking!
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setMainTab(0)}
              >
                Browse Groups
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
              >
                Create a Group
              </Button>
            </Stack>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {myGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.group_id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    "&:hover": { boxShadow: 4 },
                    transition: "box-shadow 0.2s",
                  }}
                  onClick={() => handleSelectGroup(group.group_id)}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="flex-start"
                    >
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <GroupIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" noWrap>
                          {group.group_name}
                        </Typography>
                        <Stack direction="row" spacing={1} mt={0.5}>
                          <Chip
                            label={group.group_type}
                            size="small"
                            variant="outlined"
                          />
                          {group.is_moderator && (
                            <Chip
                              label="Moderator"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={1}
                        >
                          {group.member_count} members
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  cursor: "pointer",
                  border: "2px dashed",
                  borderColor: "divider",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  transition: "all 0.2s",
                }}
                onClick={() => setShowCreateDialog(true)}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 120,
                  }}
                >
                  <AddIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                  <Typography color="text.secondary" mt={1}>
                    Create New Group
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>
    </Box>
  );

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading groups...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      {!selectedGroup && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Peer Support Groups
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect with job seekers, share experiences, and support each other
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Group
          </Button>
        </Stack>
      )}

      {/* Main Content */}
      {loadingGroup ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : selectedGroup ? (
        renderGroupDetail()
      ) : (
        renderGroupsList()
      )}

      {/* Create Group Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Peer Group</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Tech Job Seekers NYC"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="What is this group about?"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Group Type</InputLabel>
                  <Select
                    value={formData.group_type || "general"}
                    label="Group Type"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        group_type: e.target.value as PeerGroupType,
                      }))
                    }
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="industry">Industry</MenuItem>
                    <MenuItem value="role">Role</MenuItem>
                    <MenuItem value="location">Location</MenuItem>
                    <MenuItem value="experience">Experience Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Visibility</InputLabel>
                  <Select
                    value={formData.visibility || "public"}
                    label="Visibility"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        visibility: e.target.value as PeerGroupVisibility,
                      }))
                    }
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="hidden">Hidden</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {formData.group_type === "industry" && (
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    industry: e.target.value,
                  }))
                }
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            )}
            {formData.group_type === "role" && (
              <TextField
                fullWidth
                label="Role Focus"
                value={formData.role_focus || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role_focus: e.target.value,
                  }))
                }
                placeholder="e.g., Software Engineer, Product Manager"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!formData.name || creating}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
