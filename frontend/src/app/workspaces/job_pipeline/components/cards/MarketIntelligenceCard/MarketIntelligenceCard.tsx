/**
 * MARKET INTELLIGENCE CARD
 *
 * AI-powered market intelligence and industry trends with 8 explicit acceptance criteria:
 * 1. Monitor job market trends in target industries and locations
 * 2. Track skill demand evolution and emerging technology requirements
 * 3. Analyze salary trends and compensation evolution patterns
 * 4. Monitor company growth patterns and hiring activity
 * 5. Include industry disruption insights and future outlook
 * 6. Generate recommendations for skill development and career positioning
 * 7. Track market opportunity identification and timing optimization
 * 8. Provide competitive landscape analysis for career planning
 *
 * Backend: POST /api/analytics/market/intelligence (AI-powered)
 */

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Grid,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Public as MarketIcon,
  Psychology as AIIcon,
  Work as WorkIcon,
  Place as PlaceIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingIcon,
  Business as CompanyIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { toApiUrl } from "@shared/services/apiUrl";

type DemandLevel = "hot" | "growing" | "stable" | "cool";
type Timing = "now" | "soon" | "later";
type Priority = "high" | "medium" | "low";

interface JobMarketTrend {
  industry: string;
  location: string;
  demandLevel: DemandLevel;
  trendLabel: string;
  summary: string;
}

interface SkillTrend {
  name: string;
  category: "core" | "emerging" | "declining";
  trend: "rising" | "stable" | "declining";
  commentary: string;
}

interface SalaryTrendSegment {
  role: string;
  location: string;
  median: number;
  range: string;
  trend: "rising" | "flat" | "declining";
  commentary: string;
}

interface CompanyTrend {
  name: string;
  industry: string;
  hiringOutlook: "aggressive" | "selective" | "slowing";
  commentary: string;
}

interface OpportunityWindow {
  label: string;
  timing: Timing;
  priority: Priority;
  description: string;
}

interface MarketIntelligenceData {
  jobMarketTrends: JobMarketTrend[];
  skillDemand: {
    coreSkills: SkillTrend[];
    emergingSkills: SkillTrend[];
    decliningSkills: SkillTrend[];
  };
  salaryTrends: SalaryTrendSegment[];
  companyGrowthPatterns: CompanyTrend[];
  industryDisruptionInsights: string[];
  recommendations: string[];
  opportunityWindows: OpportunityWindow[];
  competitiveLandscapeSummary: string;
}

interface UserIndustryStats {
  industry: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface UserLocationStats {
  location: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface UserContextSummary {
  targetRole: string;
  targetIndustries: string[];
  targetLocations: string[];
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  byIndustry: UserIndustryStats[];
  byLocation: UserLocationStats[];
}

interface MarketIntelligencePayload {
  ai: MarketIntelligenceData;
  userContext: UserContextSummary;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  data?: MarketIntelligencePayload;
}

interface Props {
  defaultTargetRole?: string;
  defaultIndustries?: string[];
  defaultLocations?: string[];
  defaultExperienceLevel?: string;
}

export default function MarketIntelligenceCard({
  defaultTargetRole = "software engineer",
  defaultIndustries = ["Technology"],
  defaultLocations = ["United States"],
  defaultExperienceLevel = "mid",
}: Props) {
  const { session } = useAuth();
  const [aiData, setAiData] = useState<MarketIntelligenceData | null>(null);
  const [userContext, setUserContext] = useState<UserContextSummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        toApiUrl("/api/analytics/market/intelligence"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            targetRole: defaultTargetRole,
            targetIndustries: defaultIndustries,
            targetLocations: defaultLocations,
            experienceLevel: defaultExperienceLevel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as ApiResponse;

      if (!json.success || !json.data) {
        throw new Error(json.error || "Failed to load market intelligence");
      }

      setAiData(json.data.ai);
      setUserContext(json.data.userContext);
    } catch (err: any) {
      console.error("[MarketIntelligenceCard] Error:", err);
      setError(
        err?.message ||
          "Failed to load market intelligence. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const hasData = !!aiData;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <MarketIcon />
        <Typography variant="h6" fontWeight={600}>
          Market Intelligence & Industry Trends
        </Typography>
        <Chip
          icon={<AIIcon fontSize="small" />}
          label="AI Market Intelligence"
          size="small"
          color="primary"
          variant="outlined"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" onClick={loadData} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        AI-driven market analysis tailored using your tracked applications and
        target industries/locations. Trends combine broader labor-market
        intelligence with your own job search data.
      </Typography>

      {userContext && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.5 }}
        >
          Based on {userContext.totalApplications} tracked applications,{" "}
          {userContext.totalInterviews} interviews, and{" "}
          {userContext.totalOffers} offers in{" "}
          {userContext.targetIndustries.join(", ")} across{" "}
          {userContext.targetLocations.join(", ")}.
        </Typography>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && !hasData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Market intelligence will appear here once AI analysis is available.
        </Alert>
      )}

      {hasData && aiData && (
        <Box>
          <Grid container spacing={2}>
            {/* 1) Monitor job market trends in target industries & locations */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<WorkIcon fontSize="small" />}
                title="1. Job Market Trends"
                subtitle="Target industries & locations (AI + your pipeline)"
              />
              <Divider sx={{ my: 1 }} />

              {userContext && userContext.byIndustry.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Your strongest activity by industry:{" "}
                  {userContext.byIndustry
                    .slice(0, 3)
                    .map((i) => i.industry)
                    .join(", ")}
                  .
                </Typography>
              )}

              {aiData.jobMarketTrends.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No market trend data returned by AI.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {aiData.jobMarketTrends.slice(0, 5).map((t, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlaceIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={600}>
                          {t.industry} — {t.location}
                        </Typography>
                        <Chip
                          size="small"
                          label={t.demandLevel.toUpperCase()}
                          color={
                            t.demandLevel === "hot"
                              ? "success"
                              : t.demandLevel === "growing"
                              ? "primary"
                              : t.demandLevel === "stable"
                              ? "default"
                              : "warning"
                          }
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {t.trendLabel}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {t.summary}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* 2) Track skill demand evolution & emerging tech */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TrendingIcon fontSize="small" />}
                title="2. Skill Demand & Emerging Tech"
                subtitle="Core, emerging, and declining skills"
              />
              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2">Core skills in demand</Typography>
              <SkillChipRow skills={aiData.skillDemand.coreSkills} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Emerging skills / technologies
              </Typography>
              <SkillChipRow
                skills={aiData.skillDemand.emergingSkills}
                emphasize
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Skills losing prominence
              </Typography>
              <SkillChipRow skills={aiData.skillDemand.decliningSkills} muted />
            </Grid>

            {/* 3) Analyze salary trends & compensation evolution */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<InsightsIcon fontSize="small" />}
                title="3. Salary Trends & Compensation"
                subtitle="Median, ranges, and direction"
              />
              <Divider sx={{ my: 1 }} />

              {aiData.salaryTrends.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  AI did not return salary trend data.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {aiData.salaryTrends.slice(0, 5).map((s, idx) => (
                    <Box key={idx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="baseline"
                        justifyContent="space-between"
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {s.role} — {s.location}
                        </Typography>
                        <Chip
                          size="small"
                          label={s.trend.toUpperCase()}
                          color={
                            s.trend === "rising"
                              ? "success"
                              : s.trend === "flat"
                              ? "default"
                              : "warning"
                          }
                        />
                      </Stack>
                      <Typography variant="body2">
                        Median: ${Math.round(s.median).toLocaleString()} (
                        {s.range})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.commentary}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* 4) Monitor company growth patterns & hiring activity */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<CompanyIcon fontSize="small" />}
                title="4. Company Growth & Hiring Activity"
                subtitle="Where hiring is heating up or slowing down"
              />
              <Divider sx={{ my: 1 }} />

              {aiData.companyGrowthPatterns.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  AI did not return company-level patterns.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {aiData.companyGrowthPatterns.slice(0, 5).map((c, idx) => (
                    <Box key={idx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {c.name} — {c.industry}
                        </Typography>
                        <Chip
                          size="small"
                          label={c.hiringOutlook.toUpperCase()}
                          color={
                            c.hiringOutlook === "aggressive"
                              ? "success"
                              : c.hiringOutlook === "selective"
                              ? "primary"
                              : "warning"
                          }
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {c.commentary}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* 5) Industry disruption insights & future outlook */}
            <Grid size={12}>
              <SectionHeader
                icon={<InsightsIcon fontSize="small" />}
                title="5. Industry Disruption & Future Outlook"
                subtitle="Where the market is shifting next"
              />
              <Divider sx={{ my: 1 }} />
              {aiData.industryDisruptionInsights.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No disruption insights returned by AI.
                </Typography>
              ) : (
                <Box component="ul" sx={{ pl: 3 }}>
                  {aiData.industryDisruptionInsights.map((line, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{line}</Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Grid>

            {/* 6) Recommendations for skill development & career positioning */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<AIIcon fontSize="small" />}
                title="6. Skill & Positioning Recommendations"
                subtitle="How to align yourself with the market"
              />
              <Divider sx={{ my: 1 }} />
              {aiData.recommendations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  AI did not return recommendations.
                </Typography>
              ) : (
                <Box component="ul" sx={{ pl: 3 }}>
                  {aiData.recommendations.map((r, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{r}</Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Grid>

            {/* 7) Market opportunity identification & timing optimization */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<TrendingIcon fontSize="small" />}
                title="7. Market Opportunity Windows"
                subtitle="Where & when to focus your efforts"
              />
              <Divider sx={{ my: 1 }} />

              {aiData.opportunityWindows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No opportunity windows returned by AI.
                </Typography>
              ) : (
                <Box component="ul" sx={{ pl: 3 }}>
                  {aiData.opportunityWindows.map((o, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">
                        <strong>{o.label}</strong>{" "}
                        <Chip
                          size="small"
                          label={`${o.timing.toUpperCase()} · ${o.priority.toUpperCase()}`}
                          sx={{ ml: 0.5 }}
                          color={
                            o.priority === "high"
                              ? "success"
                              : o.priority === "medium"
                              ? "primary"
                              : "default"
                          }
                        />{" "}
                        — {o.description}
                      </Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Grid>

            {/* 8) Competitive landscape analysis for career planning */}
            <Grid size={12}>
              <SectionHeader
                icon={<MarketIcon fontSize="small" />}
                title="8. Competitive Landscape for Career Planning"
                subtitle="How crowded your space is and how to stand out"
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                {aiData.competitiveLandscapeSummary}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                For deeper peer benchmarks, see the Competitive Market
                Positioning panel.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

/* ---------- Small helper components ---------- */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      {icon}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} component="div">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" component="div">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function SkillChipRow({
  skills,
  emphasize = false,
  muted = false,
}: {
  skills: SkillTrend[];
  emphasize?: boolean;
  muted?: boolean;
}) {
  if (!skills || skills.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        No data returned by AI for this category.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
      {skills.slice(0, 12).map((s) => (
        <Tooltip key={s.name} title={s.commentary}>
          <Chip
            size="small"
            label={s.name}
            variant={emphasize ? "filled" : "outlined"}
            color={emphasize ? "primary" : muted ? "default" : "primary"}
          />
        </Tooltip>
      ))}
    </Box>
  );
}
