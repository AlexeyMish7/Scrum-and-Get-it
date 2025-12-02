/**
 * CohortDetailPage.tsx
 *
 * Detail view for a specific cohort showing members, analytics, and management tools.
 * Allows administrators to manage cohort members, view progress, and update settings.
 *
 * Route: /team/enterprise/cohorts/:cohortId
 * Part of UC-114: Corporate Career Services Integration
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import { useCohortManagement } from "../hooks/useCohortManagement";
import type { CohortRow, CohortStatus } from "../types/enterprise.types";

// Simple member type for display purposes
interface SimpleMember {
  id: string;
  user_id: string;
  completion_status: string;
  enrolled_at: string;
}

// Tab panel interface for organizing content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component for tab content
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cohort-tabpanel-${index}`}
      aria-labelledby={`cohort-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Status chip colors for visual distinction
const statusColors: Record<
  CohortStatus,
  "success" | "warning" | "default" | "error"
> = {
  draft: "default",
  active: "success",
  paused: "warning",
  completed: "default",
  archived: "error",
};

/**
 * CohortDetailPage - Detailed view and management for a single cohort
 *
 * Features:
 * - View and edit cohort information
 * - Manage cohort members (add, remove, update roles)
 * - View cohort analytics and progress metrics
 * - Send communications to cohort members
 */
export const CohortDetailPage = () => {
  const navigate = useNavigate();
  const { cohortId } = useParams<{ cohortId: string }>();

  // Cohort management hooks
  const { cohorts, loading, error, updateCohort, deleteCohort } =
    useCohortManagement();

  // Local state
  const [cohort, setCohort] = useState<CohortRow | null>(null);
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [membersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<SimpleMember | null>(
    null
  );

  // Form state for editing cohort
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    max_capacity: 50,
  });

  // Form state for adding member
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  // Load cohort data when ID changes
  useEffect(() => {
    if (cohortId && cohorts.length > 0) {
      const found = cohorts.find((c) => c.id === cohortId);
      if (found) {
        setCohort(found);
        setEditForm({
          name: found.name,
          description: found.description || "",
          max_capacity: found.max_capacity || 50,
        });
        // Set mock members based on current_enrollment
        const mockMembers: SimpleMember[] = [];
        for (let i = 0; i < (found.current_enrollment || 0); i++) {
          mockMembers.push({
            id: `member-${i}`,
            user_id: `user-${i}`,
            completion_status: "in_progress",
            enrolled_at: found.created_at,
          });
        }
        setMembers(mockMembers);
      }
    }
  }, [cohortId, cohorts]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle cohort edit save
  const handleSaveEdit = async () => {
    if (!cohort) return;
    await updateCohort(cohort.id, editForm);
    setEditDialogOpen(false);
  };

  // Handle add member (placeholder)
  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    // Add member to local list
    const newMember: SimpleMember = {
      id: `member-${Date.now()}`,
      user_id: newMemberEmail,
      completion_status: "in_progress",
      enrolled_at: new Date().toISOString(),
    };
    setMembers([...members, newMember]);

    setNewMemberEmail("");
    setNewMemberRole("member");
    setAddMemberDialogOpen(false);
  };

  // Handle remove member (placeholder)
  const handleRemoveMember = () => {
    if (!selectedMember) return;

    setMembers(members.filter((m) => m.id !== selectedMember.id));
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  // Handle delete cohort
  const handleDeleteCohort = async () => {
    if (!cohort) return;
    if (
      window.confirm(
        `Are you sure you want to delete "${cohort.name}"? This action cannot be undone.`
      )
    ) {
      await deleteCohort(cohort.id);
      navigate("/team/enterprise");
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Cohort not found
  if (!cohort && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Cohort not found. It may have been deleted or you don&apos;t have
          access.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/team/enterprise")}
          sx={{ mt: 2 }}
        >
          Back to Enterprise Dashboard
        </Button>
      </Box>
    );
  }

  if (!cohort) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with navigation and actions */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => navigate("/team/enterprise")}
            sx={{ mr: 2 }}
            aria-label="Back to enterprise dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" component="h1">
                {cohort.name}
              </Typography>
              <Chip
                label={cohort.status}
                color={statusColors[cohort.status]}
                size="small"
              />
            </Box>
            {cohort.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {cohort.description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteCohort}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats cards using flexbox */}
      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        <Card sx={{ flex: "1 1 200px", minWidth: 200 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary.main">
              {members.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Members
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 200 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {cohort.max_capacity || "∞"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Capacity
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 200 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">
              {cohort.start_date
                ? new Date(cohort.start_date).toLocaleDateString()
                : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start Date
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 200 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6">
              {cohort.end_date
                ? new Date(cohort.end_date).toLocaleDateString()
                : "Ongoing"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              End Date
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<GroupIcon />} label="Members" iconPosition="start" />
          <Tab icon={<BarChartIcon />} label="Analytics" iconPosition="start" />
          <Tab icon={<SettingsIcon />} label="Settings" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Members Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">
            Cohort Members ({members.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
          >
            Add Member
          </Button>
        </Box>

        {membersLoading ? (
          <LinearProgress />
        ) : members.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" gutterBottom>
              No members in this cohort yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddMemberDialogOpen(true)}
            >
              Add Your First Member
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Enrolled</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.user_id?.charAt(0)?.toUpperCase() || "?"}
                        </Avatar>
                        <Typography variant="body2">
                          {member.user_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.completion_status}
                        size="small"
                        color={
                          member.completion_status === "completed"
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {member.enrolled_at
                        ? new Date(member.enrolled_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Send email">
                        <IconButton size="small">
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMemberMenuAnchor(e.currentTarget);
                          setSelectedMember(member);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Member actions menu */}
        <Menu
          anchorEl={memberMenuAnchor}
          open={Boolean(memberMenuAnchor)}
          onClose={() => setMemberMenuAnchor(null)}
        >
          <MenuItem onClick={() => setMemberMenuAnchor(null)}>
            View Profile
          </MenuItem>
          <MenuItem onClick={() => setMemberMenuAnchor(null)}>
            Change Status
          </MenuItem>
          <MenuItem onClick={handleRemoveMember} sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Remove from Cohort
          </MenuItem>
        </Menu>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <BarChartIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Cohort Analytics
          </Typography>
          <Typography color="text.secondary">
            Analytics for this cohort will be displayed here. Track member
            progress, application rates, interview success, and placement
            outcomes.
          </Typography>
        </Paper>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cohort Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex="1" minWidth={280}>
                <Typography variant="subtitle2" gutterBottom>
                  Program Type
                </Typography>
                <Typography color="text.secondary">
                  {cohort.program_type || "Career Services"}
                </Typography>
              </Box>
              <Box flex="1" minWidth={280}>
                <Typography variant="subtitle2" gutterBottom>
                  Auto-Assign Mentors
                </Typography>
                <Typography color="text.secondary">
                  {cohort.settings?.auto_assign_mentors
                    ? "Enabled"
                    : "Disabled"}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex="1" minWidth={280}>
                <Typography variant="subtitle2" gutterBottom>
                  Weekly Check-In Required
                </Typography>
                <Typography color="text.secondary">
                  {cohort.settings?.require_weekly_checkin
                    ? "Enabled"
                    : "Disabled"}
                </Typography>
              </Box>
              <Box flex="1" minWidth={280}>
                <Typography variant="subtitle2" gutterBottom>
                  Peer Networking
                </Typography>
                <Typography color="text.secondary">
                  {cohort.settings?.enable_peer_networking
                    ? "Enabled"
                    : "Disabled"}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </TabPanel>

      {/* Edit Cohort Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Cohort</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Cohort Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Maximum Capacity"
              type="number"
              value={editForm.max_capacity}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  max_capacity: parseInt(e.target.value) || 50,
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!editForm.name}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Member to Cohort</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Email Address"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              fullWidth
              required
              type="email"
              placeholder="member@example.com"
            />
            <TextField
              label="Role"
              select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              fullWidth
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="mentor">Mentor</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={!newMemberEmail.trim()}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CohortDetailPage;
