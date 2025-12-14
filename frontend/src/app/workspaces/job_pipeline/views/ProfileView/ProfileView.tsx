/**
 * ProfileView — Job-focused profile summary
 *
 * Purpose: Display user profile in the context of job applications.
 * Shows skills, experience, education, and profile completion to help
 * users understand their job readiness and identify gaps.
 *
 * Contract:
 * - Inputs: None (reads from auth context)
 * - Outputs: Profile summary with completion %, quick stats, and edit actions
 * - Error modes: Uses `useErrorHandler()` for feedback
 *
 * Features:
 * - Profile completion percentage and progress bar
 * - Summary cards: Employment, Skills, Education, Projects
 * - Quick stats: Total years experience, skill count, education level
 * - Recent activity timeline
 * - Quick edit buttons to navigate to profile workspace
 * - Job readiness indicators
 */

import { useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Work as WorkIcon,
  School as SchoolIcon,
  Star as SkillIcon,
  FolderSpecial as ProjectIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useNavigate } from "react-router-dom";
import { useUnifiedProfile, type UnifiedProfileData } from "@profile/cache";

import type { EmploymentRow } from "@profile/types/employment";
import type { SkillItem } from "@profile/types/skill";
import type { EducationEntry } from "@profile/types/education";
import type { Project } from "@profile/types/project";
import type { ProfileData } from "@profile/types/profile";

const EMPTY_EMPLOYMENT: EmploymentRow[] = [];
const EMPTY_SKILLS: SkillItem[] = [];
const EMPTY_EDUCATION: EducationEntry[] = [];
const EMPTY_PROJECTS: Project[] = [];

function getSkillLevelNumber(skillLevel: SkillItem["level"]) {
  if (typeof skillLevel === "number") return skillLevel;

  const normalized = String(skillLevel).trim().toLowerCase();
  if (normalized === "expert") return 4;
  if (normalized === "advanced") return 3;
  if (normalized === "intermediate") return 2;
  if (normalized === "beginner") return 1;

  // Some UI flows store labels like "Expert"; fall back to substring checks.
  if (normalized.includes("expert")) return 4;
  if (normalized.includes("advanced")) return 3;
  if (normalized.includes("intermediate")) return 2;
  if (normalized.includes("beginner")) return 1;

  return 0;
}

// Profile completion requirements
const REQUIRED_COUNTS = {
  employment: 2,
  skills: 5,
  education: 1,
  projects: 2,
};

export default function ProfileView() {
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();

  const unifiedProfileQuery = useUnifiedProfile();

  const unifiedData: UnifiedProfileData | undefined = unifiedProfileQuery.data;
  const profile: ProfileData | null = unifiedData?.profile ?? null;
  const employment: EmploymentRow[] =
    unifiedData?.employment ?? EMPTY_EMPLOYMENT;
  const skills: SkillItem[] = unifiedData?.skills ?? EMPTY_SKILLS;
  const education: EducationEntry[] = unifiedData?.education ?? EMPTY_EDUCATION;
  const projects: Project[] = unifiedData?.projects ?? EMPTY_PROJECTS;

  useEffect(() => {
    if (!unifiedProfileQuery.isError) return;
    handleError(unifiedProfileQuery.error, "Failed to load profile data");
  }, [unifiedProfileQuery.isError, unifiedProfileQuery.error, handleError]);

  // Calculate completion percentage
  const completion = useMemo(() => {
    const empComplete = Math.min(
      employment.length / REQUIRED_COUNTS.employment,
      1
    );
    const skillsComplete = Math.min(skills.length / REQUIRED_COUNTS.skills, 1);
    const eduComplete = Math.min(
      education.length / REQUIRED_COUNTS.education,
      1
    );
    const projComplete = Math.min(
      projects.length / REQUIRED_COUNTS.projects,
      1
    );

    const percentage =
      ((empComplete + skillsComplete + eduComplete + projComplete) / 4) * 100;

    const suggestions: string[] = [];
    if (empComplete < 1)
      suggestions.push(
        `Add ${REQUIRED_COUNTS.employment - employment.length} more job${
          employment.length === REQUIRED_COUNTS.employment - 1 ? "" : "s"
        }`
      );
    if (skillsComplete < 1)
      suggestions.push(
        `Add ${REQUIRED_COUNTS.skills - skills.length} more skill${
          skills.length === REQUIRED_COUNTS.skills - 1 ? "" : "s"
        }`
      );
    if (eduComplete < 1)
      suggestions.push(
        `Add ${REQUIRED_COUNTS.education - education.length} education entr${
          education.length === REQUIRED_COUNTS.education - 1 ? "y" : "ies"
        }`
      );
    if (projComplete < 1)
      suggestions.push(
        `Add ${REQUIRED_COUNTS.projects - projects.length} more project${
          projects.length === REQUIRED_COUNTS.projects - 1 ? "" : "s"
        }`
      );

    return { percentage, suggestions };
  }, [employment, skills, education, projects]);

  // Calculate total years of experience
  const totalYearsExperience = useMemo(() => {
    let totalMonths = 0;
    employment.forEach((job) => {
      const start = new Date(job.start_date);
      const end = job.end_date ? new Date(job.end_date) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += months;
    });
    return (totalMonths / 12).toFixed(1);
  }, [employment]);

  // Get highest education level
  const highestEducation = useMemo(() => {
    if (education.length === 0) return "None";
    const degrees = education.map((e) => e.degree || "");
    if (degrees.includes("PhD")) return "PhD";
    if (degrees.includes("Master's")) return "Master's";
    if (degrees.includes("Bachelor's")) return "Bachelor's";
    if (degrees.includes("Associate")) return "Associate";
    return education[0].degree || "Other";
  }, [education]);

  // Top skills by proficiency
  const topSkills = useMemo(() => {
    return [...skills]
      .sort((a, b) => {
        const aLevel = getSkillLevelNumber(a.level);
        const bLevel = getSkillLevelNumber(b.level);
        return bLevel - aLevel;
      })
      .slice(0, 10);
  }, [skills]);

  if (unifiedProfileQuery.isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {profile?.fullName || "Your Profile"}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {profile?.headline || "Professional"}
            </Typography>
            {profile?.city && profile?.state && (
              <Typography variant="body2" color="text.secondary">
                {profile.city}, {profile.state}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate("/profile")}
          >
            Edit Full Profile
          </Button>
        </Stack>
      </Paper>

      {/* Profile Completion */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">
              Profile Completion: {completion.percentage.toFixed(0)}%
            </Typography>
            {completion.percentage >= 100 ? (
              <Chip
                icon={<CheckIcon />}
                label="Complete"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<WarningIcon />}
                label="Incomplete"
                color="warning"
                size="small"
              />
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completion.percentage}
            sx={{ height: 8, borderRadius: 1, mb: 2 }}
          />
          {completion.suggestions.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                To complete your profile:
              </Typography>
              <List dense>
                {completion.suggestions.map((suggestion, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TrendingUpIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <WorkIcon />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {totalYearsExperience}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Years Experience
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "success.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <SkillIcon />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {skills.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skills
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "warning.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <SchoolIcon />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {highestEducation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest Degree
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "info.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <ProjectIcon />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {projects.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Projects
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Two-column layout for details */}
      <Grid container spacing={3}>
        {/* Left column: Recent Experience & Top Skills */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Recent Experience */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Recent Experience</Typography>
                <Tooltip title="View all employment">
                  <IconButton
                    size="small"
                    onClick={() => navigate("/profile/employment")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {employment.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No employment history added yet
                </Typography>
              ) : (
                <List>
                  {employment.slice(0, 3).map((job) => (
                    <ListItem key={job.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <WorkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={job.job_title}
                        secondary={
                          <>
                            {job.company_name}
                            <br />
                            {new Date(job.start_date).getFullYear()} -{" "}
                            {job.current_position
                              ? "Present"
                              : job.end_date
                              ? new Date(job.end_date).getFullYear()
                              : "Unknown"}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {employment.length > 3 && (
                <Button
                  size="small"
                  onClick={() => navigate("/profile/employment")}
                  sx={{ mt: 1 }}
                >
                  View all {employment.length} jobs
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Top Skills</Typography>
                <Tooltip title="Manage skills">
                  <IconButton
                    size="small"
                    onClick={() => navigate("/profile/skills")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {topSkills.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No skills added yet
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {topSkills.map((skill) => (
                    <Chip
                      key={skill.id ?? skill.name}
                      label={skill.name}
                      size="small"
                      color={
                        getSkillLevelNumber(skill.level) >= 4
                          ? "success"
                          : getSkillLevelNumber(skill.level) >= 3
                          ? "primary"
                          : "default"
                      }
                    />
                  ))}
                </Box>
              )}
              {skills.length > 10 && (
                <Button
                  size="small"
                  onClick={() => navigate("/profile/skills")}
                  sx={{ mt: 2 }}
                >
                  View all {skills.length} skills
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Education & Projects */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Education */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Education</Typography>
                <Tooltip title="Manage education">
                  <IconButton
                    size="small"
                    onClick={() => navigate("/profile/education")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {education.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No education added yet
                </Typography>
              ) : (
                <List>
                  {education.slice(0, 3).map((edu) => (
                    <ListItem key={edu.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <SchoolIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={edu.degree || "Degree"}
                        secondary={
                          <>
                            {edu.fieldOfStudy && `${edu.fieldOfStudy} • `}
                            {edu.institution}
                            {edu.endDate && (
                              <>
                                <br />
                                Graduated: {new Date(edu.endDate).getFullYear()}
                              </>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {education.length > 3 && (
                <Button
                  size="small"
                  onClick={() => navigate("/profile/education")}
                  sx={{ mt: 1 }}
                >
                  View all education
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Projects</Typography>
                <Tooltip title="Manage projects">
                  <IconButton
                    size="small"
                    onClick={() => navigate("/profile/projects")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {projects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No projects added yet
                </Typography>
              ) : (
                <List>
                  {projects.slice(0, 3).map((proj) => (
                    <ListItem key={proj.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ProjectIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={proj.projectName}
                        secondary={`${new Date(proj.startDate).getFullYear()}${
                          proj.endDate
                            ? ` - ${new Date(proj.endDate).getFullYear()}`
                            : " - Ongoing"
                        }`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {projects.length > 3 && (
                <Button
                  size="small"
                  onClick={() => navigate("/profile/projects")}
                  sx={{ mt: 1 }}
                >
                  View all {projects.length} projects
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
