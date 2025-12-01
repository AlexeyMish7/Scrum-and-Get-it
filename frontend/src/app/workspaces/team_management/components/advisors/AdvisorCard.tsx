/**
 * UC-115: External Advisor and Coach Integration
 * Card component displaying an individual advisor
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  PersonRemove as PersonRemoveIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useState } from "react";

import type { ExternalAdvisor } from "../../types/advisor.types";
import {
  ADVISOR_TYPE_LABELS,
  ADVISOR_STATUS_COLORS,
  ADVISOR_STATUS_LABELS,
} from "../../types/advisor.types";

interface AdvisorCardProps {
  advisor: ExternalAdvisor;
  onScheduleSession?: (advisorId: string) => void;
  onSendMessage?: (advisorId: string) => void;
  onManagePermissions?: (advisorId: string) => void;
  onResendInvitation?: (advisorId: string) => void;
  onRemoveAdvisor?: (advisorId: string) => void;
}

/**
 * Card component showing advisor details with quick actions
 */
export function AdvisorCard({
  advisor,
  onScheduleSession,
  onSendMessage,
  onManagePermissions,
  onResendInvitation,
  onRemoveAdvisor,
}: AdvisorCardProps) {
  // Menu anchor state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAction = (action: () => void) => {
    handleMenuClose();
    action();
  };

  // Determine if advisor is pending (needs invitation reminder)
  const isPending = advisor.status === "pending";
  const isActive = advisor.status === "active";

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: advisor.status === "ended" ? 0.6 : 1,
        borderColor: isPending ? "warning.main" : undefined,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Avatar and Basic Info */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: isActive ? "primary.main" : "grey.400",
                fontSize: "1.25rem",
              }}
            >
              {advisor.initials}
            </Avatar>

            <Box>
              <Typography variant="h6" component="div">
                {advisor.advisor_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {advisor.advisor_email}
              </Typography>
              {advisor.organization_name && (
                <Typography variant="body2" color="text.secondary">
                  {advisor.organization_name}
                  {advisor.advisor_title && ` • ${advisor.advisor_title}`}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Status and Menu */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={ADVISOR_TYPE_LABELS[advisor.advisor_type]}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={ADVISOR_STATUS_LABELS[advisor.status]}
                size="small"
                color={ADVISOR_STATUS_COLORS[advisor.status]}
              />
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Stack>
          </Box>
        </Box>

        {/* Stats Row */}
        {isActive && (
          <Stack direction="row" spacing={3} sx={{ mt: 2, ml: 9 }}>
            <Box>
              <Typography variant="h6" color="primary">
                {advisor.total_sessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sessions
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="primary">
                {advisor.total_recommendations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recommendations
              </Typography>
            </Box>
            {advisor.last_accessed_at && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last active:{" "}
                  {new Date(advisor.last_accessed_at).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Pending Notice */}
        {isPending && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: "warning.light",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="warning.dark">
              Invitation pending - waiting for advisor to accept
            </Typography>
            {onResendInvitation && (
              <Tooltip title="Resend Invitation">
                <IconButton
                  size="small"
                  onClick={() => onResendInvitation(advisor.id)}
                  color="warning"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardContent>

      {/* Quick Actions for Active Advisors */}
      {isActive && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          {onScheduleSession && (
            <Tooltip title="Schedule Session">
              <IconButton
                size="small"
                onClick={() => onScheduleSession(advisor.id)}
                color="primary"
              >
                <EventIcon />
              </IconButton>
            </Tooltip>
          )}
          {onSendMessage && (
            <Tooltip title="Send Message">
              <IconButton
                size="small"
                onClick={() => onSendMessage(advisor.id)}
                color="primary"
              >
                <MessageIcon />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isActive && onScheduleSession && (
          <MenuItem
            onClick={() => handleAction(() => onScheduleSession(advisor.id))}
          >
            <ListItemIcon>
              <EventIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Schedule Session</ListItemText>
          </MenuItem>
        )}
        {isActive && onSendMessage && (
          <MenuItem
            onClick={() => handleAction(() => onSendMessage(advisor.id))}
          >
            <ListItemIcon>
              <MessageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Message</ListItemText>
          </MenuItem>
        )}
        {isPending && onResendInvitation && (
          <MenuItem
            onClick={() => handleAction(() => onResendInvitation(advisor.id))}
          >
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resend Invitation</ListItemText>
          </MenuItem>
        )}
        {onManagePermissions && (
          <MenuItem
            onClick={() => handleAction(() => onManagePermissions(advisor.id))}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Permissions</ListItemText>
          </MenuItem>
        )}
        {onRemoveAdvisor && (
          <MenuItem
            onClick={() => handleAction(() => onRemoveAdvisor(advisor.id))}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove Advisor</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

export default AdvisorCard;
