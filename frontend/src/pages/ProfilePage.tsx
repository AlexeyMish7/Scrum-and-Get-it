// src/pages/ProfilePage.tsx
import { useEffect, useState, type FC } from "react";
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
// import ExportProfileButton from "../components/ProfileDashboard/ExportProfileButton";
import ProfileStrengthTips from "../components/ProfileDashboard/ProfileStrengthTips";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

// We'll compute counts and charts from live data below; fallbacks kept minimal
const profileStrength = 85;
const profileRecommendations = [
  "Add more details to your recent job description",
  "Include a professional summary section",
  "List at least 3 soft skills",
];

const ProfilePage: FC = () => {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState<string>("Your Name");
  const [displayEmail, setDisplayEmail] = useState<string>("");
  // Live UI state
  const [activities, setActivities] = useState<
    Array<{ id: string; date: string; description: string }>
  >([]);
  const [counts, setCounts] = useState({
    employmentCount: 0,
    skillsCount: 0,
    educationCount: 0,
    projectsCount: 0,
  });
  const [skills, setSkills] = useState<Array<{ name: string; value: number }>>(
    []
  );
  // Career event shape used by CareerTimeline component
  interface CareerEvent {
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }

  const [careerEvents, setCareerEvents] = useState<CareerEvent[]>([]);

  // Quick Add Handlers
  const handleAddEmployment = () => console.log("➕ Add Employment clicked");
  const handleAddSkill = () => console.log("➕ Add Skill clicked");
  const handleAddEducation = () => console.log("➕ Add Education clicked");
  const handleAddProject = () => console.log("➕ Add Project clicked");

  // Export Handler
  const handleExport = () => {
    const data = {
      profile: counts,
      activities,
      skills,
      career: careerEvents,
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

  useEffect(() => {
    let mounted = true;
    if (loading) return;
    if (!user) {
      setDisplayName("Guest");
      setDisplayEmail("");
      return;
    }

    const loadHeader = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, email")
          .eq("id", user.id)
          .single();
        if (!mounted) return;
        if (error || !data) {
          const meta = user.user_metadata as unknown as
            | Record<string, unknown>
            | undefined;
          const first =
            meta && typeof meta["first_name"] === "string"
              ? (meta["first_name"] as string)
              : "";
          const last =
            meta && typeof meta["last_name"] === "string"
              ? (meta["last_name"] as string)
              : "";
          setDisplayName(
            first || last ? `${first} ${last}`.trim() : "Your Name"
          );
          setDisplayEmail(user.email ?? "");
        } else {
          const full = data.full_name ?? "";
          const first = data.first_name ?? "";
          const last = data.last_name ?? "";
          setDisplayName(full || `${first} ${last}`.trim() || "Your Name");
          setDisplayEmail(data.email ?? user.email ?? "");
        }
      } catch (err) {
        console.error("Failed to load profile header", err);
      }
    };

    loadHeader();
    return () => {
      mounted = false;
    };
  }, [user, loading]);

  // Load documents and other simple profile-related data
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let mounted = true;
    const loadExtras = async () => {
      try {
        // Documents (resumes, cover letters, etc.)
        const { data: docs } = await supabase
          .from("documents")
          .select("id, file_name, uploaded_at, kind")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: false });

        if (!mounted) return;

        const docsList = docs ?? [];
        // Build activities from recent documents
        const docActivities = docsList.map((d: Record<string, unknown>) => ({
          id: (d.id as string) ?? Math.random().toString(36).slice(2),
          date: (d.uploaded_at as string) ?? new Date().toISOString(),
          description: `Uploaded ${(d.file_name as string) ?? "file"}`,
        }));

        setActivities(docActivities);
        setCounts((c) => ({ ...c, projectsCount: docsList.length }));

        // For Sprint 1 we don't yet have skills/employment tables wired; keep defaults
        setSkills([]);
        setCareerEvents([]);
      } catch (err) {
        console.error("Failed to load profile extras", err);
      }
    };

    loadExtras();
    return () => {
      mounted = false;
    };
  }, [user, loading]);

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
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {displayName ? displayName.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayEmail}
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
          counts={counts}
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
            <ProfileCompletion profile={counts} />
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
            <SkillsDistributionChart skills={skills} />
          </Box>
          <Box sx={{ flex: "1 1 400px" }}>
            <RecentActivityTimeline activities={activities} />
          </Box>
        </Box>

        {/* Career Timeline */}
        <Box mt={4}>
          <Divider sx={{ mb: 3 }} />
          <CareerTimeline events={careerEvents} />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
