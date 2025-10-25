
// src/pages/ProfilePage.tsx
import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  useTheme,
  Divider,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import SummaryCards from "../components/ProfileDashboard/SummaryCards";
import RecentActivityTimeline from "../components/ProfileDashboard/RecentActivityTimeline";
import ProfileCompletion from "../components/ProfileDashboard/ProfileCompletion";
import SkillsDistributionChart from "../components/ProfileDashboard/SkillsDistributionChart";
import CareerTimeline from "../components/ProfileDashboard/CareerTimeline";
import ExportProfileButton from "../components/ProfileDashboard/ExportProfileButton";
import ProfileStrengthTips from "../components/ProfileDashboard/ProfileStrengthTips";

// --- Dummy Data (replace with API or Supabase later)
const dummyActivities = [
  {
    id: "1",
    date: "2025-10-22T10:00:00Z",
    description: "Applied for Frontend Developer position at Acme Corp",
  },
  {
    id: "2",
    date: "2025-10-21T14:30:00Z",
    description: "Added new skill: TypeScript",
  },
  {
    id: "3",
    date: "2025-10-20T09:00:00Z",
    description: "Updated project portfolio",
  },
];

const dummyProfile = {
  employmentCount: 1,
  skillsCount: 3,
  educationCount: 1,
  projectsCount: 2,
};

const dummySkills = [
  { name: "Technical", value: 5 },
  { name: "Soft skills", value: 3 },
  { name: "Language", value: 2 },
  { name: "Other", value: 4 },
];

const dummyCareerEvents = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "Acme Corp",
    startDate: "Jan 2023",
    endDate: "Present",
    description:
      "Building React-based dashboards and improving user interfaces.",
  },
  {
    id: "2",
    title: "Software Engineer Intern",
    company: "TechNova",
    startDate: "May 2022",
    endDate: "Aug 2022",
    description: "Developed internal tools and automated testing pipelines.",
  },
  {
    id: "3",
    title: "CS Student",
    company: "State University",
    startDate: "Sep 2019",
    endDate: "May 2023",
    description:
      "Studied software engineering, algorithms, and full-stack development.",
  },
];

const profileStrength = 85;
const profileRecommendations = [
  "Add more details to your recent job description",
  "Include a professional summary section",
  "List at least 3 soft skills",
];

const ProfilePage: React.FC = () => {
  const theme = useTheme();

  // Quick Add Handlers
  const handleAddEmployment = () => console.log("➕ Add Employment clicked");
  const handleAddSkill = () => console.log("➕ Add Skill clicked");
  const handleAddEducation = () => console.log("➕ Add Education clicked");
  const handleAddProject = () => console.log("➕ Add Project clicked");

  // Export Handler
  const handleExport = () => {
    const data = {
      profile: dummyProfile,
      activities: dummyActivities,
      skills: dummySkills,
      career: dummyCareerEvents,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile-summary.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.palette.grey[50],
      }}
    >
      {/* --- DASHBOARD HEADER --- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          p: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>J</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              john.doe@example.com
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Export Profile
        </Button>
      </Box>

      {/* --- DASHBOARD CONTENT --- */}
      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
        <Typography variant="h4" mb={3} fontWeight="bold">
          Profile Overview
        </Typography>

        {/* Summary cards */}
        <SummaryCards
          counts={dummyProfile}
          onAddEmployment={handleAddEmployment}
          onAddSkill={handleAddSkill}
          onAddEducation={handleAddEducation}
          onAddProject={handleAddProject}
        />

        {/* Profile completion + Strength */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mt: 4,
          }}
        >
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileCompletion profile={dummyProfile} />
          </Box>
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileStrengthTips
              strengthScore={profileStrength}
              recommendations={profileRecommendations}
            />
          </Box>
        </Box>

        {/* Skills + Activity */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mt: 2,
          }}
        >
          <Box sx={{ flex: "1 1 400px" }}>
            <SkillsDistributionChart skills={dummySkills} />
          </Box>
          <Box sx={{ flex: "1 1 400px" }}>
            <RecentActivityTimeline activities={dummyActivities} />
          </Box>
        </Box>

        {/* Career Timeline */}
        <Box mt={4}>
          <Divider sx={{ mb: 3 }} />
          <CareerTimeline events={dummyCareerEvents} />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;