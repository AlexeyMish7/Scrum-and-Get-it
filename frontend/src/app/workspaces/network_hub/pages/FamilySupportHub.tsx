/**
 * FAMILY SUPPORT HUB PAGE (UC-113)
 *
 * Main entry point for family and personal support integration.
 * Allows users to invite family supporters, share progress, track well-being,
 * set boundaries, and access resources.
 *
 * Features:
 * - Invite and manage family/friend supporters
 * - Generate family-friendly progress summaries (no salary/rejection details)
 * - Create and share milestones/celebrations
 * - Daily stress and well-being check-ins
 * - Set support boundaries with positive alternatives
 * - Access educational resources for supporters
 */

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
} from "@mui/material";
import {
  FamilyRestroom as FamilyIcon,
  Favorite as HeartIcon,
  EmojiEvents as MilestoneIcon,
  Psychology as WellbeingIcon,
  MenuBook as ResourceIcon,
  Block as BoundaryIcon,
  PersonAdd as InviteIcon,
  Share as ShareIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Settings as SettingsIcon,
  Celebration as CelebrationIcon,
  SentimentSatisfiedAlt as MoodIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import {
  getFamilySupportDashboard,
  getFamilySupportSettings,
  updateFamilySupportSettings,
} from "../services/familySupportService";
import type {
  FamilySupportDashboard,
  FamilySupportSettingsRow,
  FamilySupporterWithProfile,
  FamilyMilestoneRow,
  StressMetricsRow,
  SupportBoundaryRow,
} from "../types/familySupport.types";
import {
  SUPPORTER_ROLE_INFO,
  MILESTONE_TYPE_INFO,
  STRESS_LEVEL_INFO,
  MOOD_TYPE_INFO,
} from "../types/familySupport.types";

// Import dialog components
import { InviteSupporterDialog } from "../components/InviteSupporterDialog";
import { EditSupporterDialog } from "../components/EditSupporterDialog";
import { StressCheckInDialog } from "../components/StressCheckInDialog";
import { CreateMilestoneDialog } from "../components/CreateMilestoneDialog";
import { CreateBoundaryDialog } from "../components/CreateBoundaryDialog";

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
      id={`family-support-tabpanel-${index}`}
      aria-labelledby={`family-support-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

/**
 * SupporterCard - Displays a family supporter with their permissions
 */
interface SupporterCardProps {
  supporter: FamilySupporterWithProfile;
  onEdit: (supporter: FamilySupporterWithProfile) => void;
  onRemove: (supporterId: string) => void;
}

function SupporterCard({ supporter, onEdit, onRemove }: SupporterCardProps) {
  const roleInfo = SUPPORTER_ROLE_INFO[supporter.role];
  const isActive = supporter.status === "active";
  const isPending = supporter.status === "pending";

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: isActive ? 1 : 0.7,
        borderLeft: isActive ? "4px solid" : "none",
        borderColor: isActive ? "success.main" : "transparent",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: isActive ? "success.light" : "grey.300",
              width: 48,
              height: 48,
            }}
          >
            {roleInfo?.icon || "👤"}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {supporter.supporter_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {supporter.supporter_email}
            </Typography>
          </Box>
          <Box>
            {isActive ? (
              <Chip
                size="small"
                icon={<CheckIcon />}
                label="Active"
                color="success"
                variant="outlined"
              />
            ) : isPending ? (
              <Chip
                size="small"
                icon={<PendingIcon />}
                label="Pending"
                color="warning"
                variant="outlined"
              />
            ) : (
              <Chip size="small" label={supporter.status} variant="outlined" />
            )}
          </Box>
        </Box>

        <Chip
          size="small"
          label={roleInfo?.label || supporter.role}
          sx={{ mb: 2 }}
        />

        {/* Permissions summary */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Can view:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          {supporter.can_view_applications && (
            <Chip label="Applications" size="small" variant="outlined" />
          )}
          {supporter.can_view_interviews && (
            <Chip label="Interviews" size="small" variant="outlined" />
          )}
          {supporter.can_view_progress && (
            <Chip label="Progress" size="small" variant="outlined" />
          )}
          {supporter.can_view_milestones && (
            <Chip label="Milestones" size="small" variant="outlined" />
          )}
          {supporter.can_view_stress && (
            <Chip
              label="Well-being"
              size="small"
              variant="outlined"
              color="warning"
            />
          )}
        </Box>

        {/* Activity stats */}
        {isActive && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: "auto",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Views: {supporter.view_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Encouragements: {supporter.encouragements_sent}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(supporter)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onRemove(supporter.id)}
          >
            Remove
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * MilestoneCard - Displays a milestone/celebration
 */
interface MilestoneCardProps {
  milestone: FamilyMilestoneRow;
  onShare: (milestoneId: string) => void;
}

function MilestoneCard({ milestone, onShare }: MilestoneCardProps) {
  const typeInfo = MILESTONE_TYPE_INFO[milestone.milestone_type];

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: milestone.is_shared ? "success.50" : "background.paper",
      }}
    >
      <Avatar
        sx={{
          bgcolor: "primary.light",
          width: 48,
          height: 48,
          fontSize: "1.5rem",
        }}
      >
        {milestone.celebration_emoji || typeInfo?.defaultEmoji || "🎉"}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1">{milestone.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(milestone.achieved_at).toLocaleDateString()} •{" "}
          {typeInfo?.label || milestone.milestone_type}
        </Typography>
        {milestone.reactions && milestone.reactions.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {milestone.reactions.slice(0, 3).map((r, i) => (
              <Chip
                key={i}
                label={`${r.emoji} ${r.supporter_name}`}
                size="small"
                sx={{ mr: 0.5 }}
              />
            ))}
          </Box>
        )}
      </Box>
      <Tooltip title={milestone.is_shared ? "Shared with supporters" : "Share"}>
        <IconButton
          onClick={() => onShare(milestone.id)}
          color={milestone.is_shared ? "success" : "default"}
        >
          {milestone.is_shared ? <CheckIcon /> : <ShareIcon />}
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

/**
 * StressCheckInCard - Displays today's stress check-in or prompts for one
 */
interface StressCheckInCardProps {
  checkIn: StressMetricsRow | null;
  onCheckIn: () => void;
}

function StressCheckInCard({ checkIn, onCheckIn }: StressCheckInCardProps) {
  if (!checkIn) {
    return (
      <Card sx={{ p: 3, textAlign: "center", bgcolor: "warning.50" }}>
        <MoodIcon sx={{ fontSize: 48, color: "warning.main", mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          How are you feeling today?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Take a moment to check in with yourself. Tracking your well-being
          helps you stay balanced.
        </Typography>
        <Button variant="contained" onClick={onCheckIn} startIcon={<AddIcon />}>
          Daily Check-In
        </Button>
      </Card>
    );
  }

  const stressInfo = STRESS_LEVEL_INFO[checkIn.stress_level];
  const moodInfo = MOOD_TYPE_INFO[checkIn.mood];

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", gap: 1 }}>
        <MoodIcon color="primary" />
        Today's Check-In
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Stress Level
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Chip
                label={`${stressInfo?.icon} ${stressInfo?.label}`}
                sx={{ bgcolor: stressInfo?.color, color: "white" }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={checkIn.stress_score * 10}
              sx={{
                mt: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  bgcolor: stressInfo?.color,
                },
              }}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Mood
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Chip
                label={`${moodInfo?.icon} ${moodInfo?.label}`}
                sx={{ bgcolor: moodInfo?.color, color: "white" }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
      {checkIn.notes && (
        <Typography
          variant="body2"
          sx={{ mt: 2, fontStyle: "italic", color: "text.secondary" }}
        >
          "{checkIn.notes}"
        </Typography>
      )}
      <Button variant="text" size="small" sx={{ mt: 1 }} onClick={onCheckIn}>
        Update Check-In
      </Button>
    </Card>
  );
}

/**
 * BoundaryCard - Displays a support boundary
 */
interface BoundaryCardProps {
  boundary: SupportBoundaryRow;
  onEdit: (boundary: SupportBoundaryRow) => void;
}

function BoundaryCard({ boundary, onEdit }: BoundaryCardProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <BoundaryIcon color="warning" />
        <Typography variant="subtitle1">{boundary.title}</Typography>
        {boundary.show_to_supporters ? (
          <Tooltip title="Visible to supporters">
            <ViewIcon fontSize="small" color="success" />
          </Tooltip>
        ) : (
          <Tooltip title="Hidden from supporters">
            <HideIcon fontSize="small" color="disabled" />
          </Tooltip>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {boundary.description}
      </Typography>
      {boundary.positive_alternatives &&
        boundary.positive_alternatives.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="success.main">
              Instead, try:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {boundary.positive_alternatives.slice(0, 2).map((alt, i) => (
                <Chip
                  key={i}
                  label={alt}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      <Button
        size="small"
        sx={{ mt: 1 }}
        onClick={() => onEdit(boundary)}
        startIcon={<EditIcon />}
      >
        Edit
      </Button>
    </Paper>
  );
}

/**
 * FamilySupportHub - Main component for family support feature
 */
export default function FamilySupportHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data
  const [dashboard, setDashboard] = useState<FamilySupportDashboard | null>(
    null
  );
  const [settings, setSettings] = useState<FamilySupportSettingsRow | null>(
    null
  );

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stressDialogOpen, setStressDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [boundaryDialogOpen, setBoundaryDialogOpen] = useState(false);
  const [selectedSupporter, setSelectedSupporter] =
    useState<FamilySupporterWithProfile | null>(null);

  // Stable userId reference for effects
  const userId = user?.id;

  // Fetch dashboard data on mount
  useEffect(() => {
    if (!userId) return;

    const currentUserId = userId;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardResult, settingsResult] = await Promise.all([
          getFamilySupportDashboard(currentUserId),
          getFamilySupportSettings(currentUserId),
        ]);

        if (dashboardResult.error) {
          setError(dashboardResult.error.message);
        } else {
          setDashboard(dashboardResult.data);
        }

        if (settingsResult.data) {
          setSettings(settingsResult.data);
        }
      } catch (err) {
        setError("Failed to load family support data. Please try again.");
        console.error("Error fetching family support data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // Handle settings toggle
  async function handleToggleSetting(
    key: keyof FamilySupportSettingsRow,
    value: boolean
  ) {
    if (!userId || !settings) return;

    try {
      const result = await updateFamilySupportSettings(userId, {
        [key]: value,
      } as Parameters<typeof updateFamilySupportSettings>[1]);

      if (result.data) {
        setSettings(result.data);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  }

  // Action handlers (to be implemented with actual components)
  function handleInviteSupporter() {
    setInviteDialogOpen(true);
  }

  function handleEditSupporter(supporter: FamilySupporterWithProfile) {
    setSelectedSupporter(supporter);
    setEditDialogOpen(true);
  }

  function handleRemoveSupporter(supporterId: string) {
    // Removing is handled in the edit dialog
    const supporter = [
      ...(dashboard?.activeSupporters || []),
      ...(dashboard?.pendingInvitations || []),
    ].find((s) => s.id === supporterId);
    if (supporter) {
      setSelectedSupporter(supporter as FamilySupporterWithProfile);
      setEditDialogOpen(true);
    }
  }

  function handleShareMilestone(milestoneId: string) {
    // TODO: Toggle milestone sharing
    console.log("Share milestone:", milestoneId);
  }

  function handleStressCheckIn() {
    setStressDialogOpen(true);
  }

  function handleEditBoundary(boundary: SupportBoundaryRow) {
    // TODO: Open edit boundary dialog
    console.log("Edit boundary:", boundary.id);
  }

  function handleCreateMilestone() {
    setMilestoneDialogOpen(true);
  }

  function handleCreateBoundary() {
    setBoundaryDialogOpen(true);
  }

  function handleViewResources() {
    // TODO: Navigate to resources or open dialog
    console.log("View resources");
  }

  // Refresh dashboard data after dialog actions
  async function refreshDashboard() {
    if (!userId) return;
    const dashboardResult = await getFamilySupportDashboard(userId);
    if (dashboardResult.data) {
      setDashboard(dashboardResult.data);
    }
  }

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

  const activeSupporters = dashboard?.activeSupporters || [];
  const pendingInvitations = dashboard?.pendingInvitations || [];
  const recentMilestones = dashboard?.recentMilestones || [];
  const activeBoundaries = dashboard?.activeBoundaries || [];
  const todaysStress = dashboard?.todaysStress || null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <FamilyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Family & Personal Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Share your job search journey with loved ones while maintaining
          healthy boundaries.
        </Typography>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <HeartIcon sx={{ fontSize: 40, color: "error.main", mb: 1 }} />
            <Typography variant="h4">{activeSupporters.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Active Supporters
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <PendingIcon sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
            <Typography variant="h4">{pendingInvitations.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Invitations
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <CelebrationIcon
              sx={{ fontSize: 40, color: "success.main", mb: 1 }}
            />
            <Typography variant="h4">{recentMilestones.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Shared Milestones
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <BoundaryIcon sx={{ fontSize: 40, color: "info.main", mb: 1 }} />
            <Typography variant="h4">{activeBoundaries.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Active Boundaries
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="Family support tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<HeartIcon />}
            iconPosition="start"
            label="Supporters"
            id="family-support-tab-0"
            aria-controls="family-support-tabpanel-0"
          />
          <Tab
            icon={<MilestoneIcon />}
            iconPosition="start"
            label="Milestones"
            id="family-support-tab-1"
            aria-controls="family-support-tabpanel-1"
          />
          <Tab
            icon={<WellbeingIcon />}
            iconPosition="start"
            label="Well-being"
            id="family-support-tab-2"
            aria-controls="family-support-tabpanel-2"
          />
          <Tab
            icon={<BoundaryIcon />}
            iconPosition="start"
            label="Boundaries"
            id="family-support-tab-3"
            aria-controls="family-support-tabpanel-3"
          />
          <Tab
            icon={<ResourceIcon />}
            iconPosition="start"
            label="Resources"
            id="family-support-tab-4"
            aria-controls="family-support-tabpanel-4"
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label="Settings"
            id="family-support-tab-5"
            aria-controls="family-support-tabpanel-5"
          />
        </Tabs>
      </Box>

      {/* Supporters Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6">Your Supporters</Typography>
          <Button
            variant="contained"
            startIcon={<InviteIcon />}
            onClick={handleInviteSupporter}
          >
            Invite Supporter
          </Button>
        </Box>

        {activeSupporters.length === 0 && pendingInvitations.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <FamilyIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No supporters yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Invite family members or close friends to support you through your
              job search journey.
            </Typography>
            <Button
              variant="contained"
              startIcon={<InviteIcon />}
              onClick={handleInviteSupporter}
            >
              Invite Your First Supporter
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {[...activeSupporters, ...pendingInvitations].map((supporter) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={supporter.id}>
                <SupporterCard
                  supporter={supporter as FamilySupporterWithProfile}
                  onEdit={handleEditSupporter}
                  onRemove={handleRemoveSupporter}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Milestones Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6">Milestones & Celebrations</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMilestone}
          >
            Add Milestone
          </Button>
        </Box>

        {recentMilestones.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <CelebrationIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No milestones yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Celebrate your achievements and share them with your supporters!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateMilestone}
            >
              Create Your First Milestone
            </Button>
          </Card>
        ) : (
          <Stack spacing={2}>
            {recentMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onShare={handleShareMilestone}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      {/* Well-being Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Well-being Tracker
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <StressCheckInCard
              checkIn={todaysStress}
              onCheckIn={handleStressCheckIn}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Weekly Trends
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <TrendingDownIcon
                    sx={{ fontSize: 32, color: "success.main" }}
                  />
                  <Typography variant="body2">Stress</Typography>
                  <Chip label="Improving" size="small" color="success" />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: "center" }}>
                  <TrendingUpIcon
                    sx={{ fontSize: 32, color: "success.main" }}
                  />
                  <Typography variant="body2">Mood</Typography>
                  <Chip label="Stable" size="small" color="info" />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Based on your check-ins over the past 7 days.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Boundaries Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h6">Support Boundaries</Typography>
            <Typography variant="body2" color="text.secondary">
              Set healthy boundaries for how supporters can help you best.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBoundary}
          >
            Add Boundary
          </Button>
        </Box>

        {activeBoundaries.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <BoundaryIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No boundaries set
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Setting boundaries helps your supporters know how to best support
              you without adding stress.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBoundary}
            >
              Create Your First Boundary
            </Button>
          </Card>
        ) : (
          <Stack spacing={2}>
            {activeBoundaries.map((boundary) => (
              <BoundaryCard
                key={boundary.id}
                boundary={boundary}
                onEdit={handleEditBoundary}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      {/* Resources Tab */}
      <TabPanel value={activeTab} index={4}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Resources for Supporters
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Share these resources with your family and friends to help them
          understand how to support you effectively.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ p: 3, height: "100%" }}>
              <ResourceIcon
                sx={{ fontSize: 40, color: "primary.main", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Understanding the Process
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Help your supporters understand what job searching really looks
                like in today's market.
              </Typography>
              <Button variant="outlined" onClick={handleViewResources}>
                View Articles
              </Button>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ p: 3, height: "100%" }}>
              <HeartIcon sx={{ fontSize: 40, color: "error.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                What NOT to Say
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Well-meaning phrases that can actually hurt, and what to say
                instead.
              </Typography>
              <Button variant="outlined" onClick={handleViewResources}>
                Read Guide
              </Button>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ p: 3, height: "100%" }}>
              <WellbeingIcon
                sx={{ fontSize: 40, color: "success.main", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Emotional Support Tips
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Practical ways to provide meaningful support during the job
                search.
              </Typography>
              <Button variant="outlined" onClick={handleViewResources}>
                Learn More
              </Button>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={5}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Privacy & Sharing Settings
        </Typography>

        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.family_support_enabled ?? true}
                  onChange={(e) =>
                    handleToggleSetting(
                      "family_support_enabled",
                      e.target.checked
                    )
                  }
                />
              }
              label={
                <Box>
                  <Typography>Enable Family Support Feature</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Turn off to hide your profile from all supporters
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">
              Privacy Controls
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings?.hide_salary_info ?? true}
                  onChange={(e) =>
                    handleToggleSetting("hide_salary_info", e.target.checked)
                  }
                />
              }
              label="Hide salary information from summaries"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings?.hide_rejection_details ?? true}
                  onChange={(e) =>
                    handleToggleSetting(
                      "hide_rejection_details",
                      e.target.checked
                    )
                  }
                />
              }
              label="Hide rejection details from summaries"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings?.hide_company_names ?? false}
                  onChange={(e) =>
                    handleToggleSetting("hide_company_names", e.target.checked)
                  }
                />
              }
              label="Hide company names from summaries"
            />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">
              Automatic Sharing
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings?.auto_share_milestones ?? false}
                  onChange={(e) =>
                    handleToggleSetting(
                      "auto_share_milestones",
                      e.target.checked
                    )
                  }
                />
              }
              label="Automatically share milestones with all supporters"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings?.stress_tracking_enabled ?? true}
                  onChange={(e) =>
                    handleToggleSetting(
                      "stress_tracking_enabled",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable well-being tracking"
            />
          </Stack>
        </Card>
      </TabPanel>

      {/* Dialog Components */}
      <InviteSupporterDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        userId={userId || ""}
        onSuccess={refreshDashboard}
      />

      <EditSupporterDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedSupporter(null);
        }}
        userId={userId || ""}
        supporter={selectedSupporter}
        onSuccess={refreshDashboard}
      />

      <StressCheckInDialog
        open={stressDialogOpen}
        onClose={() => setStressDialogOpen(false)}
        userId={userId || ""}
        onSuccess={refreshDashboard}
      />

      <CreateMilestoneDialog
        open={milestoneDialogOpen}
        onClose={() => setMilestoneDialogOpen(false)}
        userId={userId || ""}
        onSuccess={refreshDashboard}
      />

      <CreateBoundaryDialog
        open={boundaryDialogOpen}
        onClose={() => setBoundaryDialogOpen(false)}
        userId={userId || ""}
        onSuccess={refreshDashboard}
      />
    </Container>
  );
}
