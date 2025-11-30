/**
 * PEER GROUPS HUB PAGE
 *
 * Main entry point for peer networking and support groups (UC-112).
 * Allows users to discover groups, view their memberships, and access
 * group features like discussions, challenges, and referrals.
 *
 * Features:
 * - Group discovery with category filtering
 * - My Groups section showing joined groups
 * - Quick access to success stories and impact metrics
 * - Privacy settings management
 */

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as InsightIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import {
  listGroups,
  getUserGroups,
  joinGroup,
  leaveGroup,
  getNetworkingImpact,
} from "../services/peerGroupsService";
import type {
  PeerGroupWithMembership,
  PeerGroupCategory,
  ImpactSummary,
} from "../types/peerGroups.types";
import { CATEGORY_INFO } from "../types/peerGroups.types";

// Tab panel helper component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`peer-groups-tabpanel-${index}`}
      aria-labelledby={`peer-groups-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

/**
 * GroupCard - Displays a single peer group with join/leave actions
 */
interface GroupCardProps {
  group: PeerGroupWithMembership;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onView: (groupId: string) => void;
  isJoining: boolean;
}

function GroupCard({
  group,
  onJoin,
  onLeave,
  onView,
  isJoining,
}: GroupCardProps) {
  const categoryInfo = CATEGORY_INFO[group.category] || {
    label: group.category,
    icon: "👥",
    color: "#666",
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Group header with icon and privacy badge */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: categoryInfo.color,
              width: 48,
              height: 48,
              fontSize: "1.5rem",
            }}
          >
            {categoryInfo.icon}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Typography variant="h6" component="h3" noWrap>
              {group.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                size="small"
                label={categoryInfo.label}
                sx={{
                  bgcolor: `${categoryInfo.color}20`,
                  color: categoryInfo.color,
                  fontSize: "0.7rem",
                }}
              />
              {group.is_public ? (
                <Tooltip title="Public group - anyone can join">
                  <PublicIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </Tooltip>
              ) : (
                <Tooltip title="Private group - requires approval">
                  <LockIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {group.description || "No description available."}
        </Typography>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {group.member_count} members
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrophyIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {group.active_challenge_count} active challenges
            </Typography>
          </Box>
        </Stack>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {group.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
            ))}
            {group.tags.length > 3 && (
              <Chip
                label={`+${group.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        {group.is_member ? (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={() => onView(group.id)}
            >
              View Group
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => onLeave(group.id)}
            >
              Leave
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            size="small"
            startIcon={
              isJoining ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            onClick={() => onJoin(group.id)}
            disabled={isJoining}
            fullWidth
          >
            {isJoining ? "Joining..." : "Join Group"}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

/**
 * ImpactWidget - Shows quick stats about user's networking impact
 */
interface ImpactWidgetProps {
  impact: ImpactSummary | null;
  loading: boolean;
}

function ImpactWidget({ impact, loading }: ImpactWidgetProps) {
  if (loading) {
    return (
      <Card sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={24} />
      </Card>
    );
  }

  if (!impact) return null;

  return (
    <Card sx={{ p: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TrendingUpIcon color="primary" />
        Your Networking Impact
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary.main">
              {impact.total_groups}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Groups Joined
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="secondary.main">
              {impact.challenges_completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Challenges Done
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {impact.referrals_shared}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Referrals Shared
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Impact Score:
        </Typography>
        <Chip
          label={impact.overall_impact_score}
          color={
            impact.trend === "up"
              ? "success"
              : impact.trend === "down"
              ? "error"
              : "default"
          }
          size="small"
          icon={impact.trend === "up" ? <TrendingUpIcon /> : undefined}
        />
      </Box>
    </Card>
  );
}

/**
 * PeerGroupsHub - Main component for peer networking feature
 */
export default function PeerGroupsHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Groups data
  const [allGroups, setAllGroups] = useState<PeerGroupWithMembership[]>([]);
  const [myGroups, setMyGroups] = useState<PeerGroupWithMembership[]>([]);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PeerGroupCategory | "">(
    ""
  );
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Dialog state for group creation
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Stable userId reference for effects
  const userId = user?.id;

  // Fetch groups and impact on mount
  useEffect(() => {
    if (!userId) return;

    // Use captured userId which is guaranteed to be defined here
    const currentUserId = userId;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all groups and user's groups in parallel
        const [allGroupsResult, myGroupsResult, impactResult] =
          await Promise.all([
            listGroups(currentUserId),
            getUserGroups(currentUserId),
            getNetworkingImpact(currentUserId),
          ]);

        if (allGroupsResult.error) {
          setError(allGroupsResult.error.message);
        } else {
          setAllGroups(allGroupsResult.data || []);
        }

        if (myGroupsResult.data) {
          setMyGroups(myGroupsResult.data);
        }

        if (impactResult.data) {
          setImpact(impactResult.data);
        }
      } catch (err) {
        setError("Failed to load peer groups. Please try again.");
        console.error("Error fetching peer groups:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // Filter groups based on search and category
  const filteredGroups = useMemo(() => {
    let filtered = allGroups;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.description?.toLowerCase().includes(search) ||
          g.tags?.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((g) => g.category === categoryFilter);
    }

    return filtered;
  }, [allGroups, searchTerm, categoryFilter]);

  // Groups user hasn't joined yet (for discovery)
  const discoverGroups = useMemo(
    () => filteredGroups.filter((g) => !g.is_member),
    [filteredGroups]
  );

  // Handle joining a group
  async function handleJoinGroup(groupId: string) {
    if (!user?.id) return;

    setJoiningGroupId(groupId);
    try {
      const result = await joinGroup(user.id, { group_id: groupId });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Update local state to reflect membership
      setAllGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, is_member: true, member_count: g.member_count + 1 }
            : g
        )
      );

      // Add to my groups
      const joinedGroup = allGroups.find((g) => g.id === groupId);
      if (joinedGroup) {
        setMyGroups((prev) => [...prev, { ...joinedGroup, is_member: true }]);
      }

      // Update impact stats
      setImpact((prev) =>
        prev ? { ...prev, total_groups: prev.total_groups + 1 } : prev
      );
    } catch (err) {
      setError("Failed to join group. Please try again.");
      console.error("Error joining group:", err);
    } finally {
      setJoiningGroupId(null);
    }
  }

  // Handle leaving a group
  async function handleLeaveGroup(groupId: string) {
    if (!user?.id) return;

    try {
      const result = await leaveGroup(user.id, groupId);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Update local state
      setAllGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, is_member: false, member_count: g.member_count - 1 }
            : g
        )
      );

      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));

      // Update impact stats
      setImpact((prev) =>
        prev
          ? { ...prev, total_groups: Math.max(0, prev.total_groups - 1) }
          : prev
      );
    } catch (err) {
      setError("Failed to leave group. Please try again.");
      console.error("Error leaving group:", err);
    }
  }

  // Handle viewing a group (navigate to group detail page)
  function handleViewGroup(groupId: string) {
    // TODO: Navigate to group detail page
    console.log("View group:", groupId);
    // Will implement navigation in router update
  }

  // Category options for filter dropdown
  const categoryOptions = Object.entries(CATEGORY_INFO).map(([key, info]) => ({
    value: key as PeerGroupCategory,
    label: info.label,
    icon: info.icon,
  }));

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <GroupsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Peer Groups & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with fellow job seekers, share insights, and support each
          other through the job search journey.
        </Typography>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Impact Widget and Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ImpactWidget impact={impact} loading={false} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                fullWidth
              >
                Create New Group
              </Button>
              <Button variant="outlined" startIcon={<InsightIcon />} fullWidth>
                Share Success Story
              </Button>
              <Button variant="outlined" startIcon={<ShareIcon />} fullWidth>
                Share a Referral
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for My Groups vs Discover */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="Peer groups tabs"
        >
          <Tab
            label={
              <Badge badgeContent={myGroups.length} color="primary">
                <Box sx={{ pr: 1 }}>My Groups</Box>
              </Badge>
            }
            id="peer-groups-tab-0"
            aria-controls="peer-groups-tabpanel-0"
          />
          <Tab
            label="Discover Groups"
            id="peer-groups-tab-1"
            aria-controls="peer-groups-tabpanel-1"
          />
          <Tab
            label="Success Stories"
            id="peer-groups-tab-2"
            aria-controls="peer-groups-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* My Groups Tab */}
      <TabPanel value={activeTab} index={0}>
        {myGroups.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <GroupsIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              You haven't joined any groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Join a group to connect with others on similar job search
              journeys.
            </Typography>
            <Button variant="contained" onClick={() => setActiveTab(1)}>
              Discover Groups
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {myGroups.map((group) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                <GroupCard
                  group={group}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                  onView={handleViewGroup}
                  isJoining={joiningGroupId === group.id}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Discover Groups Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Search and filters */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as PeerGroupCategory | "")
              }
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Groups grid */}
        {discoverGroups.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              {searchTerm || categoryFilter
                ? "No groups match your filters"
                : "No more groups to discover"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || categoryFilter
                ? "Try adjusting your search criteria."
                : "You've joined all available groups!"}
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {discoverGroups.map((group) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                <GroupCard
                  group={group}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                  onView={handleViewGroup}
                  isJoining={joiningGroupId === group.id}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Success Stories Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <TrophyIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Success Stories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Read inspiring stories from peers who landed their dream jobs, and
            share your own!
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Share Your Story
          </Button>
        </Card>
      </TabPanel>

      {/* Create Group Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Coming soon! Group creation will allow you to start your own peer
            support community.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
