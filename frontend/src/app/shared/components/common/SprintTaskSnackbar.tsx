import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// A single Sprint task entry derived from Sprint2 PRD use cases.
export interface SprintTaskItem {
  uc: string; // e.g. "UC-037"
  title?: string; // short title (optional)
  desc: string; // brief description
  owner?: string; // optional owner name
  scope?: "frontend" | "backend" | "both"; // implementation surface
}

interface SprintTaskSnackbarProps {
  items: SprintTaskItem[];
  open?: boolean; // externally control visibility
  autoHideMs?: number; // optional auto hide duration when collapsed
  onClose?: () => void; // callback when closed
  anchor?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  };
  initiallyExpanded?: boolean; // whether list starts expanded
}

/**
 * SprintTaskSnackbar
 * Displays the Sprint2 PRD tasks (UC numbers + brief descriptions) relevant to the current page.
 * Minimal footprint when collapsed; expandable to show all tasks. Non-blocking.
 */
const SprintTaskSnackbar: React.FC<SprintTaskSnackbarProps> = ({
  items,
  open = true,
  autoHideMs,
  onClose,
  anchor = { vertical: "bottom", horizontal: "right" },
  initiallyExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [visible, setVisible] = useState(open);

  // Sync external open changes.
  useEffect(() => setVisible(open), [open]);

  // Auto hide when collapsed (optional) to reduce noise.
  useEffect(() => {
    if (!autoHideMs || expanded || !visible) return;
    const t = setTimeout(() => setVisible(false), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, expanded, visible]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!items || items.length === 0) return null;

  // First line summary text
  const summary = `${items.length} Sprint task${items.length === 1 ? "" : "s"}`;

  return (
    <Snackbar
      open={visible}
      onClose={handleClose}
      anchorOrigin={anchor}
      sx={{
        maxWidth: 360,
        "& .MuiPaper-root": { width: "100%" },
      }}
    >
      <Paper
        elevation={6}
        sx={{ p: 1.5, width: "100%", bgcolor: "background.paper" }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: expanded ? 1 : 0 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentTurnedInIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              {summary}
            </Typography>
          </Box>
          <Box>
            <Tooltip title={expanded ? "Collapse" : "Expand"}>
              <IconButton
                size="small"
                onClick={() => setExpanded((e) => !e)}
                aria-label={
                  expanded ? "collapse sprint tasks" : "expand sprint tasks"
                }
              >
                {expanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={handleClose}
                aria-label="close sprint tasks"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Collapse in={expanded} unmountOnExit>
          <List dense sx={{ pt: 0 }}>
            {items.map((it) => (
              <ListItem
                key={it.uc}
                disableGutters
                sx={{ alignItems: "flex-start" }}
              >
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {it.uc}
                      {it.title ? `: ${it.title}` : ""}
                      {it.owner ? ` — Owner: ${it.owner}` : ""}
                      {it.scope
                        ? ` — [${
                            it.scope === "both"
                              ? "Both"
                              : it.scope === "frontend"
                              ? "Frontend"
                              : "Backend"
                          }]`
                        : ""}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25 }}
                    >
                      {it.desc}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
        {!expanded && (
          <Alert
            severity="info"
            variant="outlined"
            icon={false}
            sx={{ p: 0.5, mt: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Expand to view details.
            </Typography>
          </Alert>
        )}
      </Paper>
    </Snackbar>
  );
};

export default SprintTaskSnackbar;
