import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventList from "@workspaces/network_hub/components/NetworkingEvents/EventList";
import ContactsList from "@workspaces/network_hub/components/ContactsList/ContactsList";
import InformationalInterviews from "@workspaces/network_hub/pages/InformationalInterview/InformationalInterviews";
import PeerGroupsHub from "@workspaces/network_hub/pages/PeerGroupsHub";
// Breadcrumbs removed (unused)
import { useAuth } from "@shared/context/AuthContext";
import NetworkHubNavbar from "@workspaces/network_hub/components/NetworkHubNavbar/NetworkHubNavbar";
import * as db from "@shared/services/dbMappers";

interface NetworkingAnalytics {
  summary: {
    totalContacts: number;
    totalInteractions: number;
    referralsGenerated: number;
    jobOpportunitiesCreated: number;
    avgRelationshipStrength: number;
    networkingROI: number;
  };
  insights: string[];
  recommendations: string[];
}

export default function ContactsDashboard() {
  const { user, session } = useAuth();
  const location = useLocation();
  const initialTabFromState = (location.state as any)?.selectedTab;
  const [analytics, setAnalytics] = useState<NetworkingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [selectedTab, setSelectedTab] = useState<number>(() =>
    typeof initialTabFromState === "number" ? initialTabFromState : 0
  );

  // If navigation includes a selectedTab in location.state, update the tab
  useEffect(() => {
    const s = (location.state as any)?.selectedTab;
    if (typeof s === "number" && s !== selectedTab) {
      setSelectedTab(s);
    }
    // We only want to respond to location.state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("contacts:reminder:open") === "true";
    } catch (e) {
      return false;
    }
  });

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("contacts:reminder:message");
    } catch (e) {
      return null;
    }
  });

  const [reminders, setReminders] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<boolean>(true);

  // Fetch networking analytics
  const fetchAnalytics = async () => {
    if (!user || !session) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8787/api/analytics/networking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ timeRange }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      } else {
        console.error(
          "Analytics API error:",
          response.status,
          await response.text()
        );
      }
    } catch (err) {
      console.error("Failed to fetch networking analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, timeRange]);

  // persist snackbar state so returning to the page restores it
  useEffect(() => {
    try {
      if (snackbarOpen) sessionStorage.setItem("contacts:reminder:open", "true");
      else sessionStorage.removeItem("contacts:reminder:open");
    } catch (e) {
      /* ignore */
    }
  }, [snackbarOpen]);

  useEffect(() => {
    try {
      if (snackbarMessage) sessionStorage.setItem("contacts:reminder:message", snackbarMessage);
      else sessionStorage.removeItem("contacts:reminder:message");
    } catch (e) {
      /* ignore */
    }
  }, [snackbarMessage]);

  // Fetch upcoming reminders (next 24h) and show a bottom-left collapsible panel
  useEffect(() => {
    let mounted = true;

    async function checkReminders() {
      if (!user) return;
      try {
        const res = await db.listContactReminders(user.id, {
          order: { column: "remind_at", ascending: true },
        });
        const rows = (!res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []) as any[];
        const now = new Date();
        const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcoming = rows.filter((r: any) => {
          if (!r || !r.remind_at) return false;
          if (r.completed_at) return false;
          const d = new Date(r.remind_at);
          if (Number.isNaN(d.getTime())) return false;
          return d > now && d <= cutoff;
        });

        if (upcoming.length > 0) {
          // Ensure reminders are sorted by remind_at ascending
          upcoming.sort((a: any, b: any) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime());

          // Resolve contact names when missing
          const resolved = await Promise.all(
            upcoming.map(async (r: any) => {
              let name = r.contact_name ?? (r.contact && (r.contact.full_name ?? `${r.contact.first_name ?? ""} ${r.contact.last_name ?? ""}`.trim())) ?? null;
              const cid = r.contact_id ?? (r.contact && r.contact.id) ?? null;
              if (!name && cid) {
                try {
                  const cres = await db.getContact(user.id, String(cid));
                  if (!cres.error && cres.data) {
                    const c = cres.data as any;
                    name = c.full_name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
                  }
                } catch (e) {
                  /* ignore */
                }
              }

              return { ...r, _contact_name: name ?? "Contact" };
            })
          );

          if (mounted) {
            setReminders(resolved);
            setSnackbarMessage(`${resolved.length} reminder${resolved.length === 1 ? "" : "s"} due`);
            setSnackbarOpen(true);
          }
        } else {
          if (mounted) {
            setReminders([]);
            setSnackbarOpen(false);
          }
        }
      } catch (err) {
        console.error("Failed to load reminders for snackbar", err);
      }
    }

    checkReminders();
    const iv = setInterval(checkReminders, 5 * 60 * 1000); // poll every 5 minutes
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [user]);

  return (
    <Box sx={{ width: "100%", p: 3 }}>
   

      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
        <NetworkHubNavbar
          selectedTab={selectedTab}
          onTabChange={(v) => setSelectedTab(v)}
          timeRange={timeRange}
          onTimeRangeChange={(v) => setTimeRange(v)}
        />

        {selectedTab === 0 && (
          <>
            {loading && !analytics ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : analytics || user ? (
              <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        Total Contacts
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.totalContacts ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        Total Interactions
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.totalInteractions ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        🤝 Referrals Generated
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.referralsGenerated ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        💼 Job Opportunities
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.jobOpportunitiesCreated ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        📈 Avg Relationship Strength
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.avgRelationshipStrength ?? 0}/10
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 8px)",
                      md: "1 1 calc(33.333% - 16px)",
                    },
                    minWidth: 220,
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                        variant="caption"
                      >
                        🎯 Networking ROI
                      </Typography>
                      <Typography variant="h4">
                        {analytics?.summary?.networkingROI ?? 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Jobs per interaction
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {analytics?.insights &&
                  Array.isArray(analytics.insights) &&
                  analytics.insights.length > 0 && (
                    <Box sx={{ width: "100%" }}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            💡 Insights
                          </Typography>
                          {analytics.insights.map((insight, idx) => (
                            <Typography
                              key={idx}
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              • {insight}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                {analytics?.recommendations &&
                  Array.isArray(analytics.recommendations) &&
                  analytics.recommendations.length > 0 && (
                    <Box sx={{ width: "100%" }}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            🎯 Recommendations
                          </Typography>
                          {analytics.recommendations.map((rec, idx) => (
                            <Typography
                              key={idx}
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              • {rec}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Box>
                  )}
              </Stack>
            ) : null}

            <ContactsList />
          </>
        )}

        {/* Bottom-left fixed collapsible reminders panel */}
        <Box sx={{ position: "fixed", left: 16, bottom: 16, zIndex: (theme) => theme.zIndex.tooltip }}>
          <Paper sx={{ width: 320, bgcolor: "error.main", color: "white" }} elevation={6}>
            <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5 }}>
              <Box sx={{ flex: 1, pl: 1 }}>
                <Typography variant="subtitle2" sx={{ color: "common.white" }}>
                  {snackbarMessage ?? "Reminders"}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setExpanded((s) => !s)} sx={{ color: "common.white" }}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton size="small" onClick={() => setSnackbarOpen(false)} sx={{ color: "common.white" }}>
                <Chip label="Dismiss" size="small" sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "common.white" }} />
              </IconButton>
            </Box>
            <Collapse in={expanded && snackbarOpen} timeout="auto" unmountOnExit>
              <List sx={{ maxHeight: 240, overflow: "auto", bgcolor: "transparent", color: "common.white" }}>
                {reminders.map((r, idx) => (
                  <ListItem key={r.id ?? idx} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${r.reminder_type ?? "Reminder"} — ${r._contact_name ?? "Contact"}`}
                      secondary={new Date(r.remind_at).toLocaleString()}
                      primaryTypographyProps={{ sx: { color: "common.white", fontSize: 13 } }}
                      secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.85)", fontSize: 12 } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Paper>
        </Box>

        {selectedTab === 1 && <EventList />}
        {selectedTab === 2 && <InformationalInterviews />}
        {selectedTab === 3 && <PeerGroupsHub />}
      </Box>
    </Box>
  );
}
