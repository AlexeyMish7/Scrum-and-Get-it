/**
 * CohortManager.tsx
 *
 * Component for managing cohorts of job seekers in enterprise career services.
 * Provides CRUD operations for cohorts and member management.
 * Used by career services administrators to organize and track groups of users.
 */

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArchiveIcon from "@mui/icons-material/Archive";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useCohortManagement } from "../../hooks/useCohortManagement";
import type {
  CohortRow,
  CohortFormData,
  CohortStatus,
} from "../../types/enterprise.types";

// Props for the CohortManager component
interface CohortManagerProps {
  teamId: string;
  onCohortSelect?: (cohort: CohortRow) => void;
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
 * CohortManager - Manages cohorts of job seekers
 *
 * Features:
 * - Create, edit, and delete cohorts
 * - View cohort members and statistics
 * - Change cohort status (active, paused, completed, archived)
 * - Quick actions menu for common operations
 */
export const CohortManager = ({ onCohortSelect }: CohortManagerProps) => {
  // State for dialog management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<CohortRow | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCohort, setSelectedCohort] = useState<CohortRow | null>(null);

  // Form state for creating/editing cohorts
  const [formData, setFormData] = useState<CohortFormData>({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    max_capacity: 50,
    settings: {},
  });

  // Use the cohort management hook for data operations
  const { cohorts, loading, error, createCohort, updateCohort, deleteCohort } =
    useCohortManagement();

  // Handle opening the create dialog
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      max_capacity: 50,
      settings: {},
    });
    setEditingCohort(null);
    setCreateDialogOpen(true);
  };

  // Handle opening the edit dialog with existing cohort data
  const handleOpenEdit = (cohort: CohortRow) => {
    setFormData({
      name: cohort.name,
      description: cohort.description || "",
      start_date: cohort.start_date || new Date().toISOString().split("T")[0],
      end_date: cohort.end_date || "",
      max_capacity: cohort.max_capacity || 50,
      settings: cohort.settings || {},
    });
    setEditingCohort(cohort);
    setCreateDialogOpen(true);
    handleCloseMenu();
  };

  // Handle form submission for create/edit
  const handleSubmit = async () => {
    if (editingCohort) {
      await updateCohort(editingCohort.id, formData);
    } else {
      await createCohort(formData);
    }
    setCreateDialogOpen(false);
    setEditingCohort(null);
  };

  // Handle cohort deletion with confirmation
  const handleDelete = async (cohort: CohortRow) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${cohort.name}"? This action cannot be undone.`
      )
    ) {
      await deleteCohort(cohort.id);
    }
    handleCloseMenu();
  };

  // Menu handlers for quick actions
  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    cohort: CohortRow
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCohort(cohort);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedCohort(null);
  };

  // Handle status changes from the menu
  const handleStatusChange = async (newStatus: CohortStatus) => {
    if (selectedCohort) {
      await updateCohort(selectedCohort.id, { status: newStatus });
    }
    handleCloseMenu();
  };

  // Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with title and create button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" component="h2">
          <GroupIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Cohort Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Create Cohort
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Cohorts table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <Typography color="text.secondary" gutterBottom>
                      No cohorts created yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreate}
                    >
                      Create Your First Cohort
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              cohorts.map((cohort) => (
                <TableRow
                  key={cohort.id}
                  hover
                  onClick={() => onCohortSelect?.(cohort)}
                  sx={{ cursor: onCohortSelect ? "pointer" : "default" }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {cohort.name}
                      </Typography>
                      {cohort.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {cohort.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cohort.status}
                      color={statusColors[cohort.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AvatarGroup
                        max={3}
                        sx={{
                          "& .MuiAvatar-root": {
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                          },
                        }}
                      >
                        <Avatar sx={{ width: 24, height: 24 }}>A</Avatar>
                        <Avatar sx={{ width: 24, height: 24 }}>B</Avatar>
                      </AvatarGroup>
                      <Typography variant="body2" color="text.secondary">
                        {cohort.member_count || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {cohort.start_date
                      ? new Date(cohort.start_date).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {cohort.end_date
                      ? new Date(cohort.end_date).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {cohort.member_count || 0} / {cohort.max_capacity || "∞"}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(cohort);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMenu(e, cohort);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Quick actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleStatusChange("active")}>
          <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
          Set Active
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange("paused")}>
          <PauseIcon fontSize="small" sx={{ mr: 1 }} />
          Pause Cohort
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange("completed")}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Mark Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange("archived")}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem divider />
        <MenuItem
          onClick={() => selectedCohort && onCohortSelect?.(selectedCohort)}
        >
          <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
          Manage Members
        </MenuItem>
        <MenuItem
          onClick={() => selectedCohort && handleDelete(selectedCohort)}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Cohort
        </MenuItem>
      </Menu>

      {/* Create/Edit dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCohort ? "Edit Cohort" : "Create New Cohort"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Cohort Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
              placeholder="e.g., Spring 2025 Graduates"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the purpose and goals of this cohort..."
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Maximum Capacity"
              type="number"
              value={formData.max_capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_capacity: parseInt(e.target.value) || 50,
                })
              }
              fullWidth
              inputProps={{ min: 1, max: 1000 }}
              helperText="Maximum number of members allowed in this cohort"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.start_date}
          >
            {editingCohort ? "Save Changes" : "Create Cohort"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CohortManager;
