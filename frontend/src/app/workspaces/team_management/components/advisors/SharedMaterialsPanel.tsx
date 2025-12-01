/**
 * UC-115: External Advisor and Coach Integration
 * Component for sharing documents and job materials with advisors
 */

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  Work as WorkIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import type {
  AdvisorSharedMaterial,
  ShareMaterialData,
} from "../../types/advisor.types";

interface SharedMaterialsPanelProps {
  advisorId: string;
  advisorName: string;
  materials: AdvisorSharedMaterial[];
  onShare?: (data: ShareMaterialData) => Promise<boolean>;
  onRevoke?: (materialId: string) => Promise<boolean>;
  loading?: boolean;
}

interface ShareDialogState {
  open: boolean;
  materialType: "document" | "job" | "profile_section" | "progress_report";
  message: string;
}

/**
 * Panel for managing materials shared with an advisor
 * Allows sharing documents, cover letters, and job listings
 */
export function SharedMaterialsPanel({
  advisorId,
  advisorName,
  materials,
  onShare,
  onRevoke,
  loading = false,
}: SharedMaterialsPanelProps) {
  // Menu state for material actions
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Share dialog state
  const [shareDialog, setShareDialog] = useState<ShareDialogState>({
    open: false,
    materialType: "document",
    message: "",
  });

  // Handle opening action menu for a material
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    materialId: string
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMaterial(materialId);
  };

  // Handle closing action menu
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMaterial(null);
  };

  // Handle revoking material access
  const handleRevoke = async () => {
    if (selectedMaterial && onRevoke) {
      await onRevoke(selectedMaterial);
    }
    handleMenuClose();
  };

  // Handle opening share dialog
  const handleOpenShareDialog = () => {
    setShareDialog({
      open: true,
      materialType: "document",
      message: "",
    });
  };

  // Handle closing share dialog
  const handleCloseShareDialog = () => {
    setShareDialog({
      open: false,
      materialType: "document",
      message: "",
    });
  };

  // Handle sharing a material
  const handleShare = async () => {
    if (onShare) {
      const shareData: ShareMaterialData = {
        advisor_id: advisorId,
        material_type: shareDialog.materialType,
        share_message: shareDialog.message || undefined,
      };
      const success = await onShare(shareData);
      if (success) {
        handleCloseShareDialog();
      }
    }
  };

  // Get icon for material type
  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "job":
        return <WorkIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Get color for material type
  const getMaterialColor = (
    type: string
  ): "primary" | "secondary" | "success" | "info" => {
    switch (type) {
      case "document":
        return "primary";
      case "profile_section":
        return "secondary";
      case "job":
        return "success";
      default:
        return "info";
    }
  };

  // Get label for material type
  const getMaterialLabel = (type: string): string => {
    switch (type) {
      case "document":
        return "Document";
      case "job":
        return "Job Listing";
      case "profile_section":
        return "Profile Section";
      case "progress_report":
        return "Progress Report";
      default:
        return type;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6">Shared Materials</Typography>
            <Typography variant="body2" color="text.secondary">
              Documents and jobs shared with {advisorName}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenShareDialog}
            size="small"
          >
            Share
          </Button>
        </Box>

        {/* Materials List */}
        {materials.length === 0 ? (
          <Box textAlign="center" py={3}>
            <ShareIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              No materials shared yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share resumes, cover letters, or job listings for review
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {materials.map((material, index) => (
              <Box key={material.id}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, material.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton disabled={loading}>
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor: `${getMaterialColor(
                          material.material_type
                        )}.light`,
                      }}
                    >
                      {getMaterialIcon(material.material_type)}
                    </Avatar>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {getMaterialLabel(material.material_type)}
                      </Typography>
                      {material.share_message && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {material.share_message}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Shared {formatDate(material.shared_at)}
                        </Typography>
                        {material.is_active && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRevoke}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Revoke Access</ListItemText>
        </MenuItem>
      </Menu>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog.open}
        onClose={handleCloseShareDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Material with {advisorName}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Select a material type to share. You can add a message to provide
              context.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={shareDialog.materialType}
                label="Material Type"
                onChange={(e) =>
                  setShareDialog((prev) => ({
                    ...prev,
                    materialType: e.target
                      .value as ShareDialogState["materialType"],
                  }))
                }
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="job">Job Listing</MenuItem>
                <MenuItem value="profile_section">Profile Section</MenuItem>
                <MenuItem value="progress_report">Progress Report</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Message (optional)"
              multiline
              rows={3}
              value={shareDialog.message}
              onChange={(e) =>
                setShareDialog((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
              placeholder="Add a note about what you'd like feedback on..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleShare}
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default SharedMaterialsPanel;
