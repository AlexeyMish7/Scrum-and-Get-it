import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import EventList from "@workspaces/network_hub/components/NetworkingEvents/EventList";
import ContactsList from "@workspaces/network_hub/components/ContactsList/ContactsList";
import InformationalInterviews from "@workspaces/network_hub/pages/InformationalInterview/InformationalInterviews";
import PeerGroupsHub from "@workspaces/network_hub/pages/PeerGroupsHub";
import { Breadcrumbs } from "@shared/components/navigation";
import { useAuth } from "@shared/context/AuthContext";
import NetworkHubNavbar from "@workspaces/network_hub/components/NetworkHubNavbar/NetworkHubNavbar";

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
  const [analytics, setAnalytics] = useState<NetworkingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [selectedTab, setSelectedTab] = useState<number>(0);

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

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Breadcrumbs items={[{ label: "Network" }, { label: "Contacts" }]} />
      </Box>

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

        {selectedTab === 1 && <EventList />}
        {selectedTab === 2 && <InformationalInterviews />}
        {selectedTab === 3 && <PeerGroupsHub />}
      </Box>
    </Box>
  );
}
