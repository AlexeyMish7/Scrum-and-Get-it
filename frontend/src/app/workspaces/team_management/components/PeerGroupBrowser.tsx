/**
 * PEER GROUP BROWSER COMPONENT
 *
 * Purpose:
 * - Browse and search for peer support groups
 * - Filter by type, industry, or search term
 * - Join public groups
 * - View group details and member count
 *
 * Usage:
 *   <PeerGroupBrowser onGroupSelect={(group) => navigate(`/team/groups/${group.id}`)} />
 */

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  InputAdornment,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Group as GroupIcon,
  Star as StarIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import * as peerNetworkingService from "../services/peerNetworkingService";
import type {
  PeerGroupSearchResult,
  UserPeerGroupInfo,
  PeerGroupType,
} from "../types";

interface PeerGroupBrowserProps {
  onGroupSelect?: (group: PeerGroupSearchResult) => void;
  onCreateGroup?: () => void;
}

const GROUP_TYPE_LABELS: Record<PeerGroupType, string> = {
  industry: "Industry",
  role: "Role",
  location: "Location",
  experience: "Experience Level",
  general: "General",
};

const GROUP_TYPE_COLORS: Record<PeerGroupType, string> = {
  industry: "primary",
  role: "secondary",
  location: "info",
  experience: "warning",
  general: "default",
};

export function PeerGroupBrowser({
  onGroupSelect,
  onCreateGroup,
}: PeerGroupBrowserProps) {
  const { user } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [searchResults, setSearchResults] = useState<PeerGroupSearchResult[]>(
    []
  );
  const [myGroups, setMyGroups] = useState<UserPeerGroupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user's groups on mount
  useEffect(() => {
    async function loadMyGroups() {
      if (!user) return;

      const result = await peerNetworkingService.getUserPeerGroups(user.id);
      if (result.data) {
        setMyGroups(result.data);
      }
    }

    loadMyGroups();
  }, [user]);

  // Search groups when filters change
  useEffect(() => {
    async function searchGroups() {
      setLoading(true);
      setError(null);

      const result = await peerNetworkingService.searchPeerGroups(
        searchTerm || undefined,
        groupTypeFilter || undefined,
        industryFilter || undefined
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        setSearchResults(result.data || []);
      }

      setLoading(false);
    }

    // Debounce search
    const timer = setTimeout(searchGroups, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, groupTypeFilter, industryFilter]);

  // Check if user is already a member of a group
  const isMember = (groupId: string) => {
    return myGroups.some((g) => g.group_id === groupId);
  };

  // Handle joining a group
  const handleJoinGroup = async (group: PeerGroupSearchResult) => {
    if (!user) return;

    setJoining(group.id);

    const result = await peerNetworkingService.joinPeerGroup(user.id, {
      group_id: group.id,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // Add to my groups
      setMyGroups((prev) => [
        ...prev,
        {
          group_id: group.id,
          group_name: group.name,
          group_type: group.group_type,
          member_count: group.member_count + 1,
          is_moderator: false,
          joined_at: new Date().toISOString(),
        },
      ]);
    }

    setJoining(null);
  };

  return (
    <Box>
      {/* Search and Filters */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search peer groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group Type</InputLabel>
            <Select
              value={groupTypeFilter}
              label="Group Type"
              onChange={(e) => setGroupTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Industry</InputLabel>
            <Select
              value={industryFilter}
              label="Industry"
              onChange={(e) => setIndustryFilter(e.target.value)}
            >
              <MenuItem value="">All Industries</MenuItem>
              <MenuItem value="Technology">Technology</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {onCreateGroup && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateGroup}
              sx={{ ml: "auto" }}
            >
              Create Group
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Results Grid */}
      {!loading && (
        <Grid container spacing={2}>
          {searchResults.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": { boxShadow: 4 },
                  transition: "box-shadow 0.2s",
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    spacing={1}
                    mb={1}
                  >
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <GroupIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                      >
                        <Typography variant="h6" component="div" noWrap>
                          {group.name}
                        </Typography>
                        {group.is_featured && (
                          <StarIcon
                            sx={{ color: "warning.main", fontSize: 18 }}
                          />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        <Chip
                          label={
                            GROUP_TYPE_LABELS[
                              group.group_type as PeerGroupType
                            ] || group.group_type
                          }
                          size="small"
                          color={
                            GROUP_TYPE_COLORS[
                              group.group_type as PeerGroupType
                            ] as
                              | "primary"
                              | "secondary"
                              | "info"
                              | "warning"
                              | "default"
                          }
                          variant="outlined"
                        />
                        {group.industry && (
                          <Chip
                            label={group.industry}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: 40,
                    }}
                  >
                    {group.description || "No description available"}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip
                      icon={<GroupIcon />}
                      label={`${group.member_count} members`}
                      size="small"
                    />
                    {group.role_focus && (
                      <Chip
                        label={group.role_focus}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
                  {isMember(group.id) ? (
                    <Chip label="Joined" color="success" size="small" />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleJoinGroup(group)}
                      disabled={joining === group.id}
                      startIcon={
                        joining === group.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <AddIcon />
                        )
                      }
                    >
                      Join
                    </Button>
                  )}
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onGroupSelect?.(group)}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {/* Empty State */}
          {searchResults.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={6}>
                <GroupIcon
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No groups found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Try adjusting your search or filters, or create a new group!
                </Typography>
                {onCreateGroup && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateGroup}
                  >
                    Create a Group
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
