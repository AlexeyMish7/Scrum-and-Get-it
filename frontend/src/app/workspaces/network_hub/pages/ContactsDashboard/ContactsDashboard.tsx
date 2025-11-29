import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import ContactsList from "@workspaces/network_hub/components/ContactsList/ContactsList";
import { Breadcrumbs } from "@shared/components/navigation";
import { useAuth } from "@shared/context/AuthContext";

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Network Hub</Typography>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Analytics Dashboard */}
        {loading && !analytics ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : analytics || user ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            {/* Insights Section */}
            {analytics?.insights &&
              Array.isArray(analytics.insights) &&
              analytics.insights.length > 0 && (
                <Grid size={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        💡 Insights
                      </Typography>
                      {analytics.insights.map((insight, idx) => (
                        <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                          • {insight}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

            {/* Recommendations Section */}
            {analytics?.recommendations &&
              Array.isArray(analytics.recommendations) &&
              analytics.recommendations.length > 0 && (
                <Grid size={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🎯 Recommendations
                      </Typography>
                      {analytics.recommendations.map((rec, idx) => (
                        <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                          • {rec}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
          </Grid>
        ) : null}

        <ContactsList />
      </Box>
    </Box>
  );
}
