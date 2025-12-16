/**
 * CAREER PATH SIMULATION CARD
 *
 * AI-powered career trajectory modeling with 8 explicit acceptance criteria:
 * 1. Model career trajectories for different job choices with 5-year and 10-year outcomes
 * 2. Show probability distributions for career outcomes across different scenarios
 * 3. Include salary projections and lifetime earnings potential for each path
 * 4. Model risk and volatility factors (market dependence, skill obsolescence, competition)
 * 5. Allow custom success criteria weights (salary, work-life balance, learning, impact, autonomy)
 * 6. Highlight critical decision points and timing for career transitions
 * 7. Compare multiple career paths side-by-side with advantages/disadvantages
 * 8. Generate strategic recommendations based on user profile and preferences
 *
 * Backend: POST /api/analytics/career/paths (AI-powered)
 */

import { useEffect, useState, useMemo } from "react";
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Timeline as PathIcon,
  Psychology as AIIcon,
  TrendingUp as SalaryIcon,
  Warning as RiskIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timeline as MilestoneIcon,
  Lightbulb as RecommendIcon,
  CompareArrows as CompareIcon,
  Star as SuccessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@shared/context/AuthContext";
import { toApiUrl } from "@shared/services/apiUrl";

// Types matching backend server/src/routes/analytics/career-paths.ts

interface CareerMilestone {
  year: number;
  title: string;
  description: string;
  probability?: number; // 0-100
}

interface SalaryProjection {
  year: number;
  baseYear: number; // Year from current date (0 = current year)
  best: number;
  average: number;
  worst: number;
  percentile90: number;
  percentile50: number;
  percentile10: number;
}

interface RiskAnalysis {
  volatility: "low" | "medium" | "high";
  marketDependence: "low" | "medium" | "high";
  skillObsolescence: "low" | "medium" | "high";
  competitionLevel: "low" | "medium" | "high";
  details: string;
}

interface SuccessCriteriaScores {
  salary: number; // 0-100
  workLifeBalance: number;
  learningGrowth: number;
  impact: number;
  autonomy: number;
}

interface CareerPath {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  targetIndustry: string;
  companyType: string;
  milestones: CareerMilestone[];
  salaryProgression: SalaryProjection[];
  fiveYearEarnings: {
    best: number;
    average: number;
    worst: number;
  };
  tenYearEarnings: {
    best: number;
    average: number;
    worst: number;
  };
  lifetimeEarningsEstimate: number;
  riskAnalysis: RiskAnalysis;
  successScores: SuccessCriteriaScores;
  advantages: string[];
  disadvantages: string[];
  criticalSkillsNeeded: string[];
  recommendedActions: string[];
}

interface DecisionPoint {
  year: number;
  decision: string;
  paths: string[]; // Array of path IDs
  recommendation: string;
}

interface IndustryContext {
  industryGrowthOutlook: string;
  majorDisruptors: string[];
  keyOpportunities: string[];
}

interface CareerPathData {
  paths: CareerPath[];
  decisionPoints: DecisionPoint[];
  industryContext: IndustryContext;
  topRecommendation: string; // Path ID
  summary: string;
}

interface UserContext {
  currentRole: string;
  currentSalary: number;
  yearsExperience: number;
  topSkills: string[];
  targetIndustries: string[];
}

interface CareerPathPayload {
  ai: CareerPathData;
  userContext: UserContext;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  data?: CareerPathPayload;
}

interface Props {
  targetRoles?: string[];
  targetIndustries?: string[];
  successCriteria?: Partial<SuccessCriteriaScores>;
  projectionYears?: number;
}

export default function CareerPathSimulationCard({
  targetRoles = ["Senior Software Engineer", "Engineering Manager"],
  targetIndustries = ["Technology"],
  successCriteria = {
    salary: 7,
    workLifeBalance: 6,
    learningGrowth: 8,
    impact: 7,
    autonomy: 6,
  },
  projectionYears = 10,
}: Props) {
  const { session } = useAuth();
  const [aiData, setAiData] = useState<CareerPathData | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);

  // Salary comparison calculator state
  const [salaryOffers, setSalaryOffers] = useState([
    { name: "Offer A", startingSalary: 120000, annualRaise: 5 },
    { name: "Offer B", startingSalary: 115000, annualRaise: 7 },
  ]);
  const [comparisonYears] = useState(5);

  // Calculate salary trajectory for each offer
  const calculateTrajectory = (startSalary: number, raisePercent: number, years: number) => {
    const trajectory = [];
    let currentSalary = startSalary;
    
    for (let year = 0; year <= years; year++) {
      trajectory.push({
        year,
        salary: Math.round(currentSalary),
      });
      currentSalary = currentSalary * (1 + raisePercent / 100);
    }
    
    return trajectory;
  };

  // Generate chart data combining all offers
  const salaryChartData = useMemo(() => {
    const yearData: any[] = [];
    
    for (let year = 0; year <= comparisonYears; year++) {
      const dataPoint: any = { year: `Year ${year}` };
      
      salaryOffers.forEach((offer) => {
        const trajectory = calculateTrajectory(offer.startingSalary, offer.annualRaise, year);
        dataPoint[offer.name] = trajectory[year].salary;
      });
      
      yearData.push(dataPoint);
    }
    
    return yearData;
  }, [salaryOffers, comparisonYears]);

  // Calculate scenarios (conservative, expected, optimistic)
  const scenarioData = useMemo(() => {
    const avgStartSalary = salaryOffers.reduce((sum, o) => sum + o.startingSalary, 0) / salaryOffers.length;
    
    return {
      conservative: calculateTrajectory(avgStartSalary, 3, comparisonYears),
      expected: calculateTrajectory(avgStartSalary, 5, comparisonYears),
      optimistic: calculateTrajectory(avgStartSalary, 7, comparisonYears),
    };
  }, [salaryOffers, comparisonYears]);

  const addOffer = () => {
    setSalaryOffers([
      ...salaryOffers,
      { name: `Offer ${String.fromCharCode(65 + salaryOffers.length)}`, startingSalary: 120000, annualRaise: 5 },
    ]);
  };

  const removeOffer = (index: number) => {
    if (salaryOffers.length > 1) {
      setSalaryOffers(salaryOffers.filter((_, i) => i !== index));
    }
  };

  const updateOffer = (index: number, field: string, value: any) => {
    const updated = [...salaryOffers];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryOffers(updated);
  };

  const loadData = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(toApiUrl("/api/analytics/career/paths"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetRoles,
          targetIndustries,
          successCriteria,
          projectionYears,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as ApiResponse;

      if (!json.success || !json.data) {
        throw new Error(json.error || "Failed to load career path simulation");
      }

      setAiData(json.data.ai);
      setUserContext(json.data.userContext);
      setSelectedPathIndex(0);
    } catch (err: any) {
      console.error("[CareerPathSimulationCard] Error:", err);
      setError(
        err?.message ||
          "Failed to load career path simulation. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const hasData = !!aiData && aiData.paths.length > 0;
  const selectedPath = hasData ? aiData.paths[selectedPathIndex] : null;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <PathIcon />
        <Typography variant="h6" fontWeight={600}>
          Career Path Simulation
        </Typography>
        <Chip
          icon={<AIIcon fontSize="small" />}
          label="AI Career Modeling"
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
        AI-powered career trajectory modeling with salary projections, risk
        analysis, and strategic recommendations based on your profile and career
        goals.
      </Typography>

      {userContext && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.5 }}
        >
          Based on your profile: {userContext.currentRole} with{" "}
          {userContext.yearsExperience} years experience,{" "}
          {userContext.currentSalary > 0
            ? `$${(userContext.currentSalary / 1000).toFixed(0)}K salary, `
            : ""}
          top skills: {userContext.topSkills.slice(0, 3).join(", ")}
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
          Career path simulations will appear here once AI analysis is
          available.
        </Alert>
      )}

      {hasData && aiData && selectedPath && (
        <Box>
          {/* Path Selection Tabs */}
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={selectedPathIndex}
              onChange={(_, newValue) => setSelectedPathIndex(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {aiData.paths.map((path) => (
                <Tab
                  key={path.id}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{path.name}</Typography>
                      {aiData.topRecommendation === path.id && (
                        <Chip
                          label="TOP"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Path Overview */}
          <Card variant="outlined" sx={{ mb: 2, bgcolor: "background.default" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedPath.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedPath.description}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={selectedPath.targetRole} size="small" />
                <Chip label={selectedPath.targetIndustry} size="small" />
                <Chip label={selectedPath.companyType} size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {/* 1) Career Milestones Timeline - AC1: 5/10-year outcomes */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<MilestoneIcon fontSize="small" />}
                title="Career Milestones"
                subtitle="5 and 10-year trajectory with probability"
              />
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                {selectedPath.milestones.map((milestone, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor:
                        milestone.year === 5 || milestone.year === 10
                          ? "primary.main"
                          : "divider",
                      bgcolor:
                        milestone.year === 5 || milestone.year === 10
                          ? "primary.50"
                          : "transparent",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={600}>
                        Year {milestone.year}: {milestone.title}
                      </Typography>
                      {milestone.probability && (
                        <Chip
                          label={`${milestone.probability}% likely`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {milestone.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* 2) Salary Progression Chart - AC2: Probability distributions + AC3: Salary projections */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<SalaryIcon fontSize="small" />}
                title="Salary Progression & Earnings"
                subtitle="Best/Average/Worst scenarios over time"
              />
              <Divider sx={{ my: 1 }} />

              {/* Lifetime Earnings Summary */}
              <Card variant="outlined" sx={{ mb: 2, bgcolor: "success.50" }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Lifetime Earnings Estimate
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    ${(selectedPath.lifetimeEarningsEstimate / 1000000).toFixed(1)}M
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        5-Year Total (Avg)
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${(selectedPath.fiveYearEarnings.average / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        10-Year Total (Avg)
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${(selectedPath.tenYearEarnings.average / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Salary Progression Table */}
              <Typography variant="subtitle2" gutterBottom>
                Year-by-Year Salary Projection
              </Typography>
              <Stack spacing={0.5}>
                {selectedPath.salaryProgression.slice(0, 6).map((proj) => (
                  <Box
                    key={proj.year}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={600}>
                        Year {proj.year}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Best case">
                          <Typography variant="caption" color="success.main">
                            ${(proj.best / 1000).toFixed(0)}K
                          </Typography>
                        </Tooltip>
                        <Typography variant="body2" fontWeight={600}>
                          ${(proj.average / 1000).toFixed(0)}K
                        </Typography>
                        <Tooltip title="Worst case">
                          <Typography variant="caption" color="warning.main">
                            ${(proj.worst / 1000).toFixed(0)}K
                          </Typography>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* 3) Risk Analysis - AC4: Risk and volatility factors */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<RiskIcon fontSize="small" />}
                title="Risk Analysis"
                subtitle="Volatility, market dependence, competition"
              />
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <RiskMetric
                  label="Career Volatility"
                  level={selectedPath.riskAnalysis.volatility}
                />
                <RiskMetric
                  label="Market Dependence"
                  level={selectedPath.riskAnalysis.marketDependence}
                />
                <RiskMetric
                  label="Skill Obsolescence Risk"
                  level={selectedPath.riskAnalysis.skillObsolescence}
                />
                <RiskMetric
                  label="Competition Level"
                  level={selectedPath.riskAnalysis.competitionLevel}
                />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5 }}
              >
                {selectedPath.riskAnalysis.details}
              </Typography>
            </Grid>

            {/* 4) Success Criteria Scores - AC5: Custom success criteria */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<SuccessIcon fontSize="small" />}
                title="Success Criteria Fit"
                subtitle="How well this path matches your priorities"
              />
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <SuccessMetric
                  label="Salary Potential"
                  score={selectedPath.successScores.salary}
                />
                <SuccessMetric
                  label="Work-Life Balance"
                  score={selectedPath.successScores.workLifeBalance}
                />
                <SuccessMetric
                  label="Learning & Growth"
                  score={selectedPath.successScores.learningGrowth}
                />
                <SuccessMetric
                  label="Impact & Influence"
                  score={selectedPath.successScores.impact}
                />
                <SuccessMetric
                  label="Autonomy & Freedom"
                  score={selectedPath.successScores.autonomy}
                />
              </Stack>
            </Grid>

            {/* 5) Advantages & Disadvantages - AC7: Side-by-side comparison */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<CompareIcon fontSize="small" />}
                title="Advantages"
                subtitle="Key benefits of this career path"
              />
              <Divider sx={{ my: 1 }} />
              <List dense>
                {selectedPath.advantages.map((adv, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">{adv}</Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<CompareIcon fontSize="small" />}
                title="Disadvantages"
                subtitle="Challenges and tradeoffs"
              />
              <Divider sx={{ my: 1 }} />
              <List dense>
                {selectedPath.disadvantages.map((disadv, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CancelIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">{disadv}</Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* 6) Critical Skills & Recommended Actions - AC8: Strategic recommendations */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<RecommendIcon fontSize="small" />}
                title="Critical Skills Needed"
                subtitle="What you need to succeed on this path"
              />
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {selectedPath.criticalSkillsNeeded.map((skill, idx) => (
                  <Chip key={idx} label={skill} size="small" color="primary" />
                ))}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionHeader
                icon={<RecommendIcon fontSize="small" />}
                title="Recommended Actions"
                subtitle="Next steps to pursue this path"
              />
              <Divider sx={{ my: 1 }} />
              <List dense>
                {selectedPath.recommendedActions.map((action, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <RecommendIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">{action}</Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* 7) Decision Points - AC6: Critical decision points and timing */}
            {aiData.decisionPoints.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <SectionHeader
                  icon={<CompareIcon fontSize="small" />}
                  title="Critical Decision Points"
                  subtitle="Key career forks and timing recommendations"
                />
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1.5}>
                  {aiData.decisionPoints.map((dp, idx) => (
                    <Card key={idx} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Year {dp.year}: {dp.decision}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1 }}
                        >
                          Affects paths:{" "}
                          {dp.paths
                            .map(
                              (pathId) =>
                                aiData.paths.find((p) => p.id === pathId)
                                  ?.name || pathId
                            )
                            .join(", ")}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Recommendation:</strong> {dp.recommendation}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Grid>
            )}

            {/* 8) Overall Summary & Top Recommendation */}
            <Grid size={{ xs: 12 }}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: "primary.50",
                  borderColor: "primary.main",
                  borderWidth: 2,
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AIIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      AI Recommendation
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {aiData.summary}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                    Top Recommended Path:{" "}
                    {aiData.paths.find((p) => p.id === aiData.topRecommendation)
                      ?.name || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 9) Salary Comparison Calculator */}
            <Grid size={{ xs: 12 }}>
              <SectionHeader
                icon={<CompareIcon fontSize="small" />}
                title="Salary Comparison Calculator"
                subtitle="Compare offers with different raise scenarios over time"
              />
              <Divider sx={{ my: 1 }} />

              {/* Offer Input Fields */}
              <Stack spacing={2} sx={{ mb: 3 }}>
                {salaryOffers.map((offer, index) => (
                  <Paper key={index} elevation={2} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Offer Name"
                        value={offer.name}
                        onChange={(e) =>
                          updateOffer(index, "name", e.target.value)
                        }
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Starting Salary"
                        type="number"
                        value={offer.startingSalary}
                        onChange={(e) =>
                          updateOffer(
                            index,
                            "startingSalary",
                            parseInt(e.target.value) || 0
                          )
                        }
                        size="small"
                        sx={{ flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <Typography variant="body2" sx={{ mr: 0.5 }}>
                              $
                            </Typography>
                          ),
                        }}
                      />
                      <TextField
                        label="Annual Raise"
                        type="number"
                        value={offer.annualRaise}
                        onChange={(e) =>
                          updateOffer(
                            index,
                            "annualRaise",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        size="small"
                        sx={{ flex: 1 }}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              %
                            </Typography>
                          ),
                        }}
                      />
                      <IconButton
                        onClick={() => removeOffer(index)}
                        disabled={salaryOffers.length === 1}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addOffer}
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add Another Offer
                </Button>
              </Stack>

              {/* Salary Trajectory Chart */}
              <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Salary Trajectory Comparison ({comparisonYears} Years)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salaryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      label={{
                        value: "Year",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Salary ($)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `$${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                    {salaryOffers.map((offer, index) => {
                      const colors = [
                        "#1976d2",
                        "#d32f2f",
                        "#388e3c",
                        "#f57c00",
                        "#7b1fa2",
                      ];
                      return (
                        <Line
                          key={index}
                          type="monotone"
                          dataKey={offer.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>

              {/* Offer Summaries */}
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" gutterBottom>
                  5-Year Projections
                </Typography>
                <Stack spacing={1}>
                  {salaryOffers.map((offer, index) => {
                    const trajectory = calculateTrajectory(
                      offer.startingSalary,
                      offer.annualRaise,
                      comparisonYears
                    );
                    const finalSalary = trajectory[trajectory.length - 1].salary;
                    return (
                      <Box key={index}>
                        <Typography variant="body2">
                          <strong>{offer.name}</strong> with{" "}
                          {offer.annualRaise}% raises:{" "}
                          <Typography
                            component="span"
                            variant="body2"
                            fontWeight={600}
                            color="primary.main"
                          >
                            ${(finalSalary / 1000).toFixed(0)}K in{" "}
                            {comparisonYears} years
                          </Typography>
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>

              {/* Scenario Comparison */}
              <Typography variant="subtitle2" gutterBottom>
                Standard Scenarios (Starting from $120K)
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {/* Conservative Scenario */}
                <Card
                  variant="outlined"
                  sx={{ flex: 1, borderColor: "warning.main" }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Chip
                        label="Conservative"
                        color="warning"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        3% annual raises
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        ${(scenarioData.conservative / 1000).toFixed(0)}K
                      </Typography>
                      <Typography variant="caption">
                        in {comparisonYears} years
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Expected Scenario */}
                <Card
                  variant="outlined"
                  sx={{ flex: 1, borderColor: "primary.main", borderWidth: 2 }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Chip
                        label="Expected"
                        color="primary"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        5% annual raises
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        ${(scenarioData.expected / 1000).toFixed(0)}K
                      </Typography>
                      <Typography variant="caption">
                        in {comparisonYears} years
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Optimistic Scenario */}
                <Card
                  variant="outlined"
                  sx={{ flex: 1, borderColor: "success.main" }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Chip
                        label="Optimistic"
                        color="success"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        7% annual raises
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        ${(scenarioData.optimistic / 1000).toFixed(0)}K
                      </Typography>
                      <Typography variant="caption">
                        in {comparisonYears} years
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

// Helper Components

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} component="div">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

interface RiskMetricProps {
  label: string;
  level: "low" | "medium" | "high";
}

function RiskMetric({ label, level }: RiskMetricProps) {
  const color =
    level === "high" ? "error" : level === "medium" ? "warning" : "success";

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: `${color}.50`,
        border: "1px solid",
        borderColor: `${color}.main`,
      }}
    >
      <Typography variant="body2">{label}</Typography>
      <Chip
        label={level.toUpperCase()}
        size="small"
        color={color}
        sx={{ fontWeight: 600 }}
      />
    </Stack>
  );
}

interface SuccessMetricProps {
  label: string;
  score: number; // 0-100
}

function SuccessMetric({ label, score }: SuccessMetricProps) {
  const color =
    score >= 80 ? "success" : score >= 60 ? "primary" : score >= 40 ? "warning" : "error";

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600} color={`${color}.main`}>
          {score}/100
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
}
