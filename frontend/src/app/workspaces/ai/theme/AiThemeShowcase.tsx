import React from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
// Using CSS grid via Box to avoid version-specific Grid typings
import { ThemeProvider } from "@mui/material/styles";
import aiTheme from "@workspaces/ai/theme/aiTheme";
import Icon from "@shared/components/common/Icon";

// Small helper for a glassy card
function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={className}
      sx={{
        height: "100%",
        p: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
      elevation={3}
    >
      {children}
    </Card>
  );
}

export default function AiThemeShowcase() {
  return (
    <ThemeProvider theme={aiTheme}>
      <CssBaseline />
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 1 }}
          >
            <Icon name="AutoAwesome" sx={{ fontSize: 22 }} />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI Workspace — Neon
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button color="secondary" variant="outlined">
              Secondary
            </Button>
            <Button color="primary" variant="contained">
              Primary Action
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="section"
        className="ats-flow-bg"
        sx={(theme) => ({
          position: "relative",
          borderRadius: 0,
          overflow: "hidden",
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: { xs: 8, md: 10 },
          px: { xs: 3, md: 0 },
          mb: { xs: 5, md: 6 },
        })}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 680, mx: "auto" }}>
            <Typography variant="overline" sx={{ letterSpacing: 0 }}>
              Welcome to the AI Lab
            </Typography>
            <Typography
              variant="h2"
              color="primary.light"
              sx={{
                mt: 1,
                mb: 1.5,
                fontWeight: 800,
                maxWidth: 620,
                mx: "auto",
                letterSpacing: -0.2,
                lineHeight: 1.05,
              }}
            >
              Futuristic, Glassy, and Fast
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 560, mx: "auto" }}
            >
              A darker, professional theme with deep cobalt accents, restrained
              neon, and balanced motion. Apply this toolkit across the AI
              workspace for cohesive, high-contrast surfaces.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button size="large" variant="contained" color="primary">
                Get Started
              </Button>
              <Button size="large" variant="outlined" color="secondary">
                Learn More
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Content showcase */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Box>
            <GlassCard>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Icon
                    name="Memory"
                    sx={{ fontSize: 18, color: "secondary.main" }}
                  />
                  <Typography variant="overline">Components</Typography>
                </Stack>
                <Typography variant="h4" color="primary.light" sx={{ mb: 1 }}>
                  Glass Cards + Motion
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                  Cards use glassmorphism with blur, borders, and hover lift.
                  Buttons include focus rings and animated shadows.
                </Typography>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction="row" spacing={2.5}>
                  <Button variant="contained" color="primary">
                    Primary
                  </Button>
                  <Button variant="outlined" color="secondary">
                    Secondary
                  </Button>
                  <Button variant="text">Tertiary</Button>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3 }}>
                <Chip label="glass" variant="outlined" />
              </CardActions>
            </GlassCard>
          </Box>

          <Box>
            <GlassCard>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Icon
                    name="AutoFixHigh"
                    sx={{ fontSize: 18, color: "secondary.main" }}
                  />
                  <Typography variant="overline">Forms</Typography>
                </Stack>
                <Typography variant="h4" color="primary.light" sx={{ mb: 1 }}>
                  Inputs with Focus Glow
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                  Outlined fields feature neon focus rings, subtle glass
                  backgrounds, and improved contrast for readability.
                </Typography>
                <Stack spacing={2.5}>
                  <TextField
                    label="Search companies"
                    placeholder="Type to search"
                    fullWidth
                  />
                  <TextField
                    label="Prompt"
                    placeholder="Describe your goal"
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Application deadline"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </CardContent>
            </GlassCard>
          </Box>

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <GlassCard>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Icon
                    name="AutoAwesome"
                    sx={{ fontSize: 18, color: "secondary.main" }}
                  />
                  <Typography variant="overline">
                    Glow Text (Reserved)
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Typography
                    color="primary.main"
                    variant="h6"
                    sx={{ textShadow: "0 0 12px rgba(0,229,255,.12)" }}
                  >
                    Reserve glow for active/focused states
                  </Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Apply the global <code>.ai-glow</code> class to headlines or
                  key labels to create a tasteful neon glow, keeping the UI
                  professional yet expressive.
                </Typography>
              </CardContent>
            </GlassCard>
          </Box>

          {/* Gradient hover demo card */}
          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <GlassCard>
              <CardContent>
                <Typography variant="h4" color="primary.light" sx={{ mb: 1 }}>
                  Surface Gradient Hover
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                  Hover this card to see a gentle gradient emphasis on the glass
                  surface. No sweeping shine—just a refined glow.
                </Typography>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction="row" spacing={2.5}>
                  <Button variant="contained">Primary CTA</Button>
                  <Button variant="outlined">Secondary</Button>
                  <Button variant="text">Tertiary (hover underline)</Button>
                </Stack>
              </CardContent>
            </GlassCard>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
