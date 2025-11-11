/**
 * JobMatching Page - UC-065, UC-066
 *
 * WHAT: AI-powered job matching with skills gap analysis
 * WHY: Help users prioritize applications and identify skill development needs
 *
 * Features (UC-065: Job Matching Algorithm):
 * - Calculate match score based on skills, experience, and requirements
 * - Break down match score by categories (skills, experience, education)
 * - Highlight strengths and gaps for each job
 * - Suggest profile improvements to increase match scores
 * - Compare match scores across multiple jobs
 *
 * Features (UC-066: Skills Gap Analysis):
 * - Compare user skills against job requirements
 * - Identify missing or weak skills
 * - Suggest learning resources for skill development
 * - Prioritize skills by importance and impact
 * - Personalized learning path recommendations
 *
 * Layout:
 * - Top: Search and filters
 * - Left (40%): Job list with match scores
 * - Right (60%): Detailed match analysis + skills gap breakdown
 */

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import CodeIcon from "@mui/icons-material/Code";
import { useNavigate } from "react-router-dom";

/**
 * Mock job data with requirements
 * FUTURE: Replace with actual jobs from database
 * - Query jobs table with required_skills/preferred_skills JSONB fields
 * - Filter by user_id with withUser()
 */
interface Job {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  salary_range?: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_required: number; // years
  education_required: string;
  job_description: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: 1,
    job_title: "Senior Full Stack Engineer",
    company_name: "TechCorp",
    location: "San Francisco, CA",
    salary_range: "$150k - $200k",
    required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
    preferred_skills: ["GraphQL", "Docker", "Kubernetes", "CI/CD"],
    experience_required: 5,
    education_required: "Bachelor's in Computer Science",
    job_description: "Build scalable web applications...",
  },
  {
    id: 2,
    job_title: "Frontend Developer",
    company_name: "StartupXYZ",
    location: "Remote",
    salary_range: "$100k - $140k",
    required_skills: ["React", "JavaScript", "CSS", "HTML"],
    preferred_skills: ["TypeScript", "Tailwind", "Next.js"],
    experience_required: 3,
    education_required: "Bachelor's degree or equivalent",
    job_description: "Create beautiful user interfaces...",
  },
  {
    id: 3,
    job_title: "Backend Engineer",
    company_name: "BigTech Inc",
    location: "New York, NY",
    salary_range: "$130k - $180k",
    required_skills: ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
    preferred_skills: ["Kafka", "Microservices", "AWS", "Terraform"],
    experience_required: 4,
    education_required: "Bachelor's in Computer Science",
    job_description: "Design and implement backend services...",
  },
];

/**
 * Mock User Profile
 * FUTURE: Fetch from user's actual profile
 * - Query profiles table for basic info
 * - Join with skills table for user's skills + proficiency
 * - Join with employment table for experience_years calculation
 * - Join with education table for degree info
 */
interface UserProfile {
  skills: Array<{ name: string; proficiency: string }>;
  experience_years: number;
  education: string;
}

const MOCK_USER_PROFILE: UserProfile = {
  skills: [
    { name: "React", proficiency: "advanced" },
    { name: "TypeScript", proficiency: "advanced" },
    { name: "JavaScript", proficiency: "expert" },
    { name: "Node.js", proficiency: "intermediate" },
    { name: "CSS", proficiency: "advanced" },
    { name: "HTML", proficiency: "expert" },
    { name: "PostgreSQL", proficiency: "intermediate" },
    { name: "Git", proficiency: "advanced" },
  ],
  experience_years: 4,
  education: "Bachelor's in Computer Science",
};

interface MatchScore {
  overall: number; // 0-100
  skills: number; // 0-100
  experience: number; // 0-100
  education: number; // 0-100
}

interface SkillGap {
  skill: string;
  status: "has" | "missing" | "weak";
  userProficiency?: string;
  importance: "required" | "preferred";
}

export default function JobMatching() {
  const navigate = useNavigate();

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "salary" | "recent">("match");

  // Calculate match scores for all jobs
  const jobsWithScores = MOCK_JOBS.map((job) => ({
    job,
    matchScore: calculateMatchScore(job, MOCK_USER_PROFILE),
    skillsGap: analyzeSkillsGap(job, MOCK_USER_PROFILE),
  }));

  // Filter and sort jobs
  const filteredJobs = jobsWithScores
    .filter(
      (item) =>
        item.job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.job.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "match")
        return b.matchScore.overall - a.matchScore.overall;
      if (sortBy === "salary") return 0; // FUTURE: Implement salary sorting when salary data available
      return 0; // recent
    });

  const selectedJob = filteredJobs.find(
    (item) => item.job.id === selectedJobId
  );

  useEffect(() => {
    // Auto-select first job if none selected
    if (!selectedJobId && filteredJobs.length > 0) {
      setSelectedJobId(filteredJobs[0].job.id);
    }
  }, [filteredJobs, selectedJobId]);

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/ai")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Job Matching & Skills Analysis</Typography>
      </Stack>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <MenuItem value="match">Best Match</MenuItem>
              <MenuItem value="salary">Salary</MenuItem>
              <MenuItem value="recent">Most Recent</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Main Content: Two-Panel Layout */}
      <Box sx={{ display: "flex", gap: 3, minHeight: "70vh" }}>
        {/* Left Panel: Job List (40%) */}
        <Box sx={{ flex: "0 0 40%" }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Jobs ({filteredJobs.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {filteredJobs.map(({ job, matchScore }) => (
                <Card
                  key={job.id}
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    border: selectedJobId === job.id ? 2 : 1,
                    borderColor:
                      selectedJobId === job.id ? "primary.main" : "divider",
                    "&:hover": { borderColor: "primary.light" },
                  }}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {job.job_title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {job.company_name} • {job.location}
                      </Typography>

                      {/* Match Score */}
                      <Box sx={{ mt: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Match Score
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color={getScoreColor(matchScore.overall)}
                          >
                            {matchScore.overall}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={matchScore.overall}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: getScoreColor(matchScore.overall),
                            },
                          }}
                        />
                      </Box>

                      {/* Salary */}
                      {job.salary_range && (
                        <Typography variant="caption" color="primary.main">
                          {job.salary_range}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {filteredJobs.length === 0 && (
                <Alert severity="info">No jobs match your search</Alert>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Right Panel: Detailed Analysis (60%) */}
        <Box sx={{ flex: "0 0 60%" }}>
          {selectedJob ? (
            <Stack spacing={3}>
              {/* Job Details */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedJob.job.job_title}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {selectedJob.job.company_name} • {selectedJob.job.location}
                </Typography>
                {selectedJob.job.salary_range && (
                  <Chip
                    label={selectedJob.job.salary_range}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>

              {/* Match Score Breakdown */}
              <MatchScoreBreakdown matchScore={selectedJob.matchScore} />

              {/* Skills Gap Analysis */}
              <SkillsGapAnalysis
                skillsGap={selectedJob.skillsGap}
                job={selectedJob.job}
              />
            </Stack>
          ) : (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Alert severity="info">
                Select a job to see detailed analysis
              </Alert>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
}

/**
 * Component: Match Score Breakdown
 */
function MatchScoreBreakdown({ matchScore }: { matchScore: MatchScore }) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6">Match Score Breakdown</Typography>
      </Stack>

      <Stack spacing={3}>
        {/* Overall Score */}
        <Box
          sx={{
            textAlign: "center",
            p: 3,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Typography variant="h2" fontWeight={600} color="primary.main">
            {matchScore.overall}%
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overall Match
          </Typography>
        </Box>

        {/* Category Scores */}
        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <ScoreCard
              icon={<CodeIcon />}
              label="Skills"
              score={matchScore.skills}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ScoreCard
              icon={<WorkIcon />}
              label="Experience"
              score={matchScore.experience}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ScoreCard
              icon={<SchoolIcon />}
              label="Education"
              score={matchScore.education}
            />
          </Box>
        </Stack>
      </Stack>

      {/* Recommendations */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Recommendations to improve your match:
        </Typography>
        <List dense>
          {matchScore.skills < 80 && (
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Learn missing skills to increase your match score"
                secondary="Focus on required skills first"
              />
            </ListItem>
          )}
          {matchScore.experience < 80 && (
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Highlight relevant projects and achievements"
                secondary="Emphasize transferable experience"
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Paper>
  );
}

/**
 * Component: Score Card
 */
function ScoreCard({
  icon,
  label,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
      <Box sx={{ color: getScoreColor(score), mb: 1 }}>{icon}</Box>
      <Typography variant="h4" fontWeight={600} color={getScoreColor(score)}>
        {score}%
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

/**
 * Component: Skills Gap Analysis
 */
function SkillsGapAnalysis({ skillsGap }: { skillsGap: SkillGap[]; job: Job }) {
  const hasSkills = skillsGap.filter((s) => s.status === "has");
  const missingSkills = skillsGap.filter((s) => s.status === "missing");
  const weakSkills = skillsGap.filter((s) => s.status === "weak");

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6">Skills Gap Analysis</Typography>
      </Stack>

      {/* Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            flex: 1,
            textAlign: "center",
            p: 2,
            bgcolor: "success.50",
            borderRadius: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="success.main">
            {hasSkills.length}
          </Typography>
          <Typography variant="caption">Skills You Have</Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            textAlign: "center",
            p: 2,
            bgcolor: "warning.50",
            borderRadius: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="warning.main">
            {weakSkills.length}
          </Typography>
          <Typography variant="caption">Skills to Improve</Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            textAlign: "center",
            p: 2,
            bgcolor: "error.50",
            borderRadius: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="error.main">
            {missingSkills.length}
          </Typography>
          <Typography variant="caption">Missing Skills</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Skills You Have */}
      {hasSkills.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="success.main">
            ✓ Skills You Have ({hasSkills.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {hasSkills.map((skill) => (
              <Chip
                key={skill.skill}
                label={`${skill.skill} (${skill.userProficiency})`}
                size="small"
                color="success"
                icon={<CheckCircleIcon />}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Skills to Improve */}
      {weakSkills.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="warning.main">
            ⚠ Skills to Improve ({weakSkills.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {weakSkills.map((skill) => (
              <Tooltip
                key={skill.skill}
                title={`Your proficiency: ${skill.userProficiency}`}
              >
                <Chip
                  label={skill.skill}
                  size="small"
                  color="warning"
                  icon={<WarningIcon />}
                />
              </Tooltip>
            ))}
          </Stack>
        </Box>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="error.main">
            ✗ Missing Skills ({missingSkills.length})
          </Typography>
          <Stack spacing={1}>
            {missingSkills.map((skill) => (
              <Paper key={skill.skill} variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {skill.skill}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {skill.importance === "required"
                        ? "Required"
                        : "Preferred"}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SchoolIcon />}
                    onClick={() => {
                      // FUTURE: Open learning resources modal/page
                      console.log("Learn", skill.skill);
                    }}
                  >
                    Learn
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* Learning Path */}
      {missingSkills.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Recommended Learning Path:
          </Typography>
          <Typography variant="caption">
            Start with required skills:{" "}
            {missingSkills
              .filter((s) => s.importance === "required")
              .map((s) => s.skill)
              .join(", ")}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}

/**
 * Helper: Calculate match score for a job
 */
function calculateMatchScore(
  job: Job,
  userProfile: typeof MOCK_USER_PROFILE
): MatchScore {
  // Skills match
  const requiredSkillsCount = job.required_skills.length;
  const preferredSkillsCount = job.preferred_skills.length;

  const userSkillNames = userProfile.skills.map((s) => s.name.toLowerCase());
  const requiredMatch = job.required_skills.filter((s) =>
    userSkillNames.includes(s.toLowerCase())
  ).length;
  const preferredMatch = job.preferred_skills.filter((s) =>
    userSkillNames.includes(s.toLowerCase())
  ).length;

  // Weight required skills more heavily
  const skillsScore =
    requiredSkillsCount + preferredSkillsCount > 0
      ? Math.round(
          ((requiredMatch * 1.5 + preferredMatch * 0.5) /
            (requiredSkillsCount * 1.5 + preferredSkillsCount * 0.5)) *
            100
        )
      : 100;

  // Experience match
  const experienceScore =
    userProfile.experience_years >= job.experience_required
      ? 100
      : Math.round(
          (userProfile.experience_years / job.experience_required) * 100
        );

  // Education match (simplified)
  const educationScore = userProfile.education
    .toLowerCase()
    .includes("bachelor")
    ? 100
    : 80;

  // Overall score (weighted average)
  const overall = Math.round(
    skillsScore * 0.6 + experienceScore * 0.3 + educationScore * 0.1
  );

  return {
    overall,
    skills: skillsScore,
    experience: experienceScore,
    education: educationScore,
  };
}

/**
 * Helper: Analyze skills gap
 */
function analyzeSkillsGap(
  job: Job,
  userProfile: typeof MOCK_USER_PROFILE
): SkillGap[] {
  const userSkillsMap = new Map(
    userProfile.skills.map((s) => [s.name.toLowerCase(), s.proficiency])
  );

  const gaps: SkillGap[] = [];

  // Check required skills
  job.required_skills.forEach((skill) => {
    const proficiency = userSkillsMap.get(skill.toLowerCase());
    if (!proficiency) {
      gaps.push({ skill, status: "missing", importance: "required" });
    } else if (proficiency === "beginner") {
      gaps.push({
        skill,
        status: "weak",
        userProficiency: proficiency,
        importance: "required",
      });
    } else {
      gaps.push({
        skill,
        status: "has",
        userProficiency: proficiency,
        importance: "required",
      });
    }
  });

  // Check preferred skills
  job.preferred_skills.forEach((skill) => {
    const proficiency = userSkillsMap.get(skill.toLowerCase());
    if (!proficiency) {
      gaps.push({ skill, status: "missing", importance: "preferred" });
    } else if (proficiency === "beginner") {
      gaps.push({
        skill,
        status: "weak",
        userProficiency: proficiency,
        importance: "preferred",
      });
    } else {
      gaps.push({
        skill,
        status: "has",
        userProficiency: proficiency,
        importance: "preferred",
      });
    }
  });

  return gaps;
}

/**
 * Helper: Get color based on score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "success.main";
  if (score >= 60) return "warning.main";
  return "error.main";
}
