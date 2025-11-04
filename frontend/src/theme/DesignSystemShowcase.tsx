// Component Showcase - Examples of the new design system in action
import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

export const DesignSystemShowcase: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Typography
        variant="h1"
        className="techy-gradient"
        sx={{ mb: 2, textAlign: "center" }}
      >
        Design System Showcase
      </Typography>

      <Typography
        variant="h5"
        sx={{ mb: 4, textAlign: "center", color: "text.secondary" }}
      >
        Experience the sleek, techy aesthetic of our new design system
      </Typography>

      {/* Navigation Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 4 }}
      >
        <Tab label="Buttons & Actions" />
        <Tab label="Forms & Inputs" />
        <Tab label="Cards & Layout" />
        <Tab label="Feedback & Status" />
      </Tabs>

      {/* Tab Panel 1: Buttons */}
      {tabValue === 0 && (
        <Box className="floating-container">
          <Typography variant="h4" sx={{ mb: 3 }}>
            Button Variants
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Button variant="primary" size="large">
              Primary Action
            </Button>
            <Button variant="secondary" size="large">
              Secondary Action
            </Button>
            <Button variant="tertiary" size="large">
              Tertiary Action
            </Button>
            <Button variant="glass" size="large">
              Glass Effect
            </Button>
            <Button variant="glow" size="large">
              Glow Effect
            </Button>
            <Button variant="destructive" size="large">
              Destructive
            </Button>
          </Box>

          <Typography variant="h5" sx={{ mb: 2 }}>
            Loading Buttons
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <LoadingButton variant="primary" loading>
              Processing...
            </LoadingButton>
            <LoadingButton variant="glass">Glass Loading</LoadingButton>
            <LoadingButton variant="glow">Glow Loading</LoadingButton>
          </Box>

          <Typography variant="h5" sx={{ mb: 2 }}>
            Button Sizes
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button variant="primary" size="small">
              Small
            </Button>
            <Button variant="primary" size="medium">
              Medium
            </Button>
            <Button variant="primary" size="large">
              Large
            </Button>
          </Box>
        </Box>
      )}

      {/* Tab Panel 2: Forms */}
      {tabValue === 1 && (
        <Box className="floating-container">
          <Typography variant="h4" sx={{ mb: 3 }}>
            Form Elements
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <TextField
              label="Full Name"
              variant="outlined"
              fullWidth
              placeholder="Enter your full name"
            />

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              placeholder="your.email@example.com"
            />

            <TextField
              label="Date of Birth"
              type="date"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select label="Experience Level" defaultValue="">
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
                <MenuItem value="executive">Executive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Bio"
              multiline
              rows={4}
              variant="outlined"
              fullWidth
              placeholder="Tell us about yourself..."
              sx={{ gridColumn: { md: "1 / -1" } }}
            />
          </Box>

          <Box
            sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button variant="tertiary">Cancel</Button>
            <Button variant="primary">Save Profile</Button>
          </Box>
        </Box>
      )}

      {/* Tab Panel 3: Cards */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Cards & Layout Components
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
          >
            {/* Standard Glass Card */}
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Standard Card
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  This is a standard glass morphism card with subtle blur
                  effects.
                </Typography>
                <Button variant="glass" size="small">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Tech Border Card */}
            <Card elevation={2} className="tech-border">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Tech Border Card
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Enhanced with a gradient border for a more techy appearance.
                </Typography>
                <Button variant="glow" size="small">
                  Explore
                </Button>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <span className="status-indicator online"></span>
                  <Typography variant="h6">System Status</Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  All systems operational and running smoothly.
                </Typography>
                <Chip label="Online" color="primary" size="small" />
              </CardContent>
            </Card>
          </Box>

          {/* Paper Examples */}
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Paper Variations
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            <Paper elevation={0} sx={{ p: 2 }}>
              <Typography variant="body2">Elevation 0 (No shadow)</Typography>
            </Paper>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="body2">Elevation 1 (Subtle)</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2">Elevation 2 (Medium)</Typography>
            </Paper>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="body2">Elevation 3 (Floating)</Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tab Panel 4: Feedback */}
      {tabValue === 3 && (
        <Box className="floating-container">
          <Typography variant="h4" sx={{ mb: 3 }}>
            Feedback & Status Components
          </Typography>

          {/* Alerts */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Alert Messages
          </Typography>
          <Box sx={{ display: "grid", gap: 2, mb: 4 }}>
            <Alert severity="success">Profile updated successfully!</Alert>
            <Alert severity="info">
              New features are available in the dashboard.
            </Alert>
            <Alert severity="warning">Please verify your email address.</Alert>
            <Alert severity="error">
              Failed to save changes. Please try again.
            </Alert>
          </Box>

          {/* Chips */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Status Chips
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap" }}>
            <Chip label="Active" color="primary" />
            <Chip label="Pending" color="secondary" />
            <Chip label="Approved" variant="outlined" />
            <Chip label="In Review" />
            <Chip label="Completed" color="primary" onDelete={() => {}} />
          </Box>

          {/* Status Indicators */}
          <Typography variant="h5" sx={{ mb: 2 }}>
            Status Indicators
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <span className="status-indicator online"></span>
              <Typography>System Online</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <span className="status-indicator busy"></span>
              <Typography>Processing</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <span className="status-indicator offline"></span>
              <Typography>Offline</Typography>
            </Box>
          </Box>

          {/* Dialog Example */}
          <Button variant="glow" onClick={() => setDialogOpen(true)}>
            Open Dialog Example
          </Button>

          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Confirmation Required</DialogTitle>
            <DialogContent>
              <Typography>
                This dialog demonstrates the glass morphism styling applied to
                modal components. The backdrop blur creates a beautiful layering
                effect.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button variant="tertiary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialogOpen(false)}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Typography Showcase */}
      <Box className="floating-container" sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Typography Hierarchy
        </Typography>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Heading 1 - Hero Title
        </Typography>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Heading 2 - Section Title
        </Typography>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Heading 3 - Subsection
        </Typography>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Heading 4 - Component Title
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Heading 5 - Card Title
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Heading 6 - Small Title
        </Typography>

        <Typography variant="body1" sx={{ mb: 1 }}>
          Body 1 - Main content text with optimal readability and line height
          for comfortable reading.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Body 2 - Secondary content text, slightly smaller for supporting
          information.
        </Typography>
        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
          Caption - Small utility text for labels and metadata
        </Typography>

        <Typography className="glow-text" sx={{ mt: 2 }}>
          Special glow text effect for status and highlights
        </Typography>
      </Box>
    </Box>
  );
};

export default DesignSystemShowcase;
