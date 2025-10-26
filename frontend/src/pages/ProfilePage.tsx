import { useEffect, useState, type FC } from "react";

// MUI UI primitives + theming hook
import {
  Box,
  Typography,
  Avatar,
  Button,
  useTheme,
  Divider,
} from "@mui/material";

// Single icon import (good for tree-shaking)
import { Download } from "@mui/icons-material";

// App widgets for the dashboard layout/visuals
import SummaryCards from "../components/ProfileDashboard/SummaryCards";
import RecentActivityTimeline from "../components/ProfileDashboard/RecentActivityTimeline";
import ProfileCompletion from "../components/ProfileDashboard/ProfileCompletion";
import SkillsDistributionChart from "../components/ProfileDashboard/SkillsDistributionChart";
import CareerTimeline from "../components/ProfileDashboard/CareerTimeline";
import ProfileStrengthTips from "../components/ProfileDashboard/ProfileStrengthTips";
// TODO: Remove or restore when used
// import ExportProfileButton from "../components/ProfileDashboard/ExportProfileButton";

// Auth context: current user + loading state
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/profileService";
import * as crud from "../services/crud";
import { useList } from "../hooks/useList";
import type {
  DocumentRow,
  Profile,
  CareerEvent as CareerEventType,
} from "../types";

/*
  ProfilePage
  - Dashboard-style profile overview for the currently authenticated user.
  - Responsibilities:
    * Load profile row from `profiles` (via `profileService`).
    * Load documents and employment history (using generic `crud` helpers).
    * Compose lightweight view models for the UI widgets (summary cards,
      activity timeline, skills chart, career timeline).
  - Goals for this refactor: clearer, better-commented logic and reuse of
    `crud` + `useList` instead of inline supabase calls.
*/

// Local UI-friendly activity shape used in the RecentActivityTimeline
interface Activity {
  id: string;
  date: string;
  description: string;
}

/**
 * Safely read a string field from auth user_metadata (it can be unknown)
 * Keeps the loadHeader code concise and easier to follow.
 */
function readMetaString(meta: unknown, key: string): string {
  // Auth metadata can be any shape (unknown). Guard for safety and only
  // return strings — this keeps the display logic simple.
  if (!meta || typeof meta !== "object") return "";
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

/**
 * Build a display name and email for the header.
 * Priority: profiles.full_name -> profiles.first/last -> auth metadata -> fallback
 */
function buildDisplayHeader(
  profile: Profile | null,
  authUser: { email?: string | null; user_metadata?: unknown } | null
) {
  // Prefer explicitly-saved profile (profiles table). Fall back to auth
  // metadata (OAuth providers often populate these fields), then a
  // deterministic placeholder.
  if (profile) {
    const full = profile.full_name ?? "";
    const first = profile.first_name ?? "";
    const last = profile.last_name ?? "";
    const name = full || `${first} ${last}`.trim() || "Your Name";
    const email = profile.email ?? authUser?.email ?? "";
    return { name, email };
  }

  const meta = authUser?.user_metadata;
  const firstMeta = readMetaString(meta, "first_name");
  const lastMeta = readMetaString(meta, "last_name");
  const name =
    firstMeta || lastMeta ? `${firstMeta} ${lastMeta}`.trim() : "Your Name";
  const email = authUser?.email ?? "";
  return { name, email };
}

/**
 * Convert document rows into Activity items for the RecentActivityTimeline.
 * Keeps the mapping logic in one place and simplifies the effect body.
 */
function docsToActivities(docs: DocumentRow[] | null): Activity[] {
  if (!docs) return [];
  return docs.map((d) => ({
    id: d.id,
    date: d.uploaded_at ?? new Date().toISOString(),
    description: `Uploaded ${d.file_name ?? "file"}`,
  }));
}

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
  // Counts shown in the summary cards. We'll compute these from live data
  // below rather than mutating them ad-hoc in multiple places.
  const [counts, setCounts] = useState({
    employmentCount: 0,
    skillsCount: 0,
    educationCount: 0,
    projectsCount: 0,
  });

  // Shape expected by SkillsDistributionChart: [{ name, value }]
  const [skills, setSkills] = useState<Array<{ name: string; value: number }>>(
    []
  );
  // Career event shape used by CareerTimeline component
  // Reuse the shared CareerEvent type (declared in src/types.ts) for
  // consistency across components.
  const [careerEvents, setCareerEvents] = useState<CareerEventType[]>([]);

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
    // Load the profiles row (if present) and derive a friendly header.
    const loadHeader = async () => {
      try {
        const { data, error } = await getProfile(user.id);
        if (!mounted) return;
        const { name, email } = buildDisplayHeader(
          error ? null : data ?? null,
          user
        );
        setDisplayName(name);
        setDisplayEmail(email);
      } catch (err) {
        console.error("Failed to load profile header", err);
      }
    };

    loadHeader();
    return () => {
      mounted = false;
    };
  }, [user, loading]);

  // ---- Data loaders using the reusable crud + useList pattern ----

  // Documents (resumes, cover letters, portfolio files)
  const fetchDocs = () =>
    crud.listRows<DocumentRow>(
      "documents",
      "id,file_name,file_path,mime_type,bytes,uploaded_at,kind",
      {
        eq: { user_id: user?.id ?? "" },
        order: { column: "uploaded_at", ascending: false },
      }
    );

  const { data: docsData } = useList<DocumentRow>(fetchDocs, [
    user?.id,
    loading,
  ]);

  // Employment history (used to build the career timeline)
  interface EmploymentRow {
    id: string;
    job_title?: string | null;
    company_name?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_current?: boolean | null;
    description?: string | null;
  }

  const fetchEmployment = () =>
    crud.listRows<EmploymentRow>(
      "employment_history",
      "id,job_title,company_name,location,start_date,end_date,is_current,description",
      {
        eq: { user_id: user?.id ?? "" },
        order: { column: "start_date", ascending: false },
      }
    );

  const { data: employmentData } = useList<EmploymentRow>(fetchEmployment, [
    user?.id,
    loading,
  ]);

  // Skills (best-effort: table may not exist yet in all deployments)
  interface SkillRow {
    id: string;
    name?: string | null;
    category?: string | null;
    proficiency?: number | null;
  }

  const fetchSkills = () =>
    crud.listRows<SkillRow>("skills", "id,name,category,proficiency", {
      eq: { user_id: user?.id ?? "" },
    });

  const { data: skillsData } = useList<SkillRow>(fetchSkills, [
    user?.id,
    loading,
  ]);

  // ---- Derive view models from raw data ----
  useEffect(() => {
    // Documents -> activities + projects count
    const docList = docsData ?? [];
    setActivities(docsToActivities(docList));
    setCounts((c) => ({ ...c, projectsCount: docList.length }));

    // Skills -> chart data + count (be defensive about missing fields)
    const s = (skillsData ?? []).map((sRow) => ({
      name: sRow.name ?? "Unnamed",
      value: typeof sRow.proficiency === "number" ? sRow.proficiency : 1,
    }));
    setSkills(s);
    setCounts((c) => ({ ...c, skillsCount: s.length }));

    // Employment -> career events + count
    const emp = (employmentData ?? []).map((e: EmploymentRow) => ({
      id: e.id,
      title: e.job_title ?? "",
      company: e.company_name ?? "",
      startDate: e.start_date ?? "",
      endDate: e.is_current ? undefined : e.end_date ?? undefined,
      description: e.description ?? undefined,
    })) as CareerEventType[];
    setCareerEvents(emp);
    setCounts((c) => ({ ...c, employmentCount: emp.length }));

    // Education count is not yet wired to a table in this sprint; keep zero
    setCounts((c) => ({ ...c, educationCount: c.educationCount }));
  }, [docsData, skillsData, employmentData]);

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
