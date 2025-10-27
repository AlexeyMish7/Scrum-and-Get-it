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

import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";
// Local minimal CareerEvent shape used by the timeline. Keep this small so the
// Dashboard can remain independent while preserving the UI contract expected
// by `CareerTimeline`. Replace with the shared type when reintroducing full
// data plumbing.
type CareerEventType = {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string | undefined;
  description?: string | undefined;
};

// Light-weight row shapes used by the Dashboard mapping helpers
interface DocumentRow {
  id: string;
  file_name?: string | null;
  uploaded_at?: string | null;
}
// Matches `public.employment` table in the canonical schema
interface EmploymentRow {
  id: string;
  job_title?: string | null;
  company_name?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current_position?: boolean | null;
  job_description?: string | null;
}
// Matches `public.skills` table: `skill_name` + `proficiency_level` enum
interface SkillRow {
  id: string;
  skill_name?: string | null;
  proficiency_level?: string | null;
}

// ----- Helper utilities (module-level to avoid hook linter complaints) -----
function readMetaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== "object") return "";
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function buildDisplayHeader(
  profile: Record<string, unknown> | null,
  authUser: { email?: string | null; user_metadata?: unknown } | null
) {
  if (profile) {
    const p = profile as Record<string, unknown>;
    const full =
      typeof p["full_name"] === "string" ? (p["full_name"] as string) : "";
    const first =
      typeof p["first_name"] === "string" ? (p["first_name"] as string) : "";
    const last =
      typeof p["last_name"] === "string" ? (p["last_name"] as string) : "";
    const name = full || `${first} ${last}`.trim() || "Your Name";
    const email =
      typeof p["email"] === "string"
        ? (p["email"] as string)
        : authUser?.email ?? "";
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

function docsToActivities(
  docs: DocumentRow[] | null
): Array<{ id: string; date: string; description: string }> {
  if (!docs) return [];
  return docs.map((d) => ({
    id: d.id,
    date: d.uploaded_at ?? new Date().toISOString(),
    description: `Uploaded ${d.file_name ?? "file"}`,
  }));
}

// App widgets for the dashboard layout/visuals (keep these imports so UI stays the same)
import SummaryCards from "../components/ProfileDashboard/SummaryCards";
import RecentActivityTimeline from "../components/ProfileDashboard/RecentActivityTimeline";
import ProfileCompletion from "../components/ProfileDashboard/ProfileCompletion";
import SkillsDistributionChart from "../components/ProfileDashboard/SkillsDistributionChart";
import CareerTimeline from "../components/ProfileDashboard/CareerTimeline";
import ProfileStrengthTips from "../components/ProfileDashboard/ProfileStrengthTips";

/*
  Dashboard (stripped)
  - Purpose: temporary, minimal version of the old `ProfilePage` while we rework
    dashboard logic. Keeps the original UI and props/layout so the frontend team
    doesn't see visual changes, but removes data-fetching complexity.
  - Behaviour: uses lightweight local placeholder state for counts, activities,
    and charts. Replace with real data-fetching later (use `crud.withUser(user.id)` etc.).
*/

const Dashboard: FC = () => {
  const theme = useTheme();

  // Auth
  const { user, loading } = useAuth();

  // Minimal display header placeholders (will be filled from DB/auth)
  const [displayName, setDisplayName] = useState<string>("Your Name");
  const [displayEmail, setDisplayEmail] = useState<string>("");

  // Lightweight UI state for the existing widgets (populated from DB)
  const [activities, setActivities] = useState<
    Array<{ id: string; date: string; description: string }>
  >([]);
  const [skills, setSkills] = useState<Array<{ name: string; value: number }>>(
    []
  );
  const [careerEvents, setCareerEvents] = useState<CareerEventType[]>([]);
  const [counts, setCounts] = useState({
    employmentCount: 0,
    skillsCount: 0,
    educationCount: 0,
    projectsCount: 0,
  });

  // (row shapes are declared at module-level)

  const handleAddEmployment = async (formData: Record<string, unknown>) => {
    if (loading) throw new Error("Auth loading");
    if (!user) throw new Error("Please sign in to add employment");

    const userCrud = crud.withUser(user.id);

    // Map SummaryCards field names -> DB column names
    const payload = {
      job_title: formData.position ?? formData.job_title ?? "",
      company_name: formData.company ?? formData.company_name ?? "",
      location: formData.location || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      current_position: Boolean(formData.is_current),
      job_description: formData.description || null,
    };

    const res = await userCrud.insertRow("employment", payload, "*");
    if (res.error) {
      console.error("Add employment failed", res.error);
      throw new Error(res.error.message || "Failed to add employment");
    }

    // Inserted row (res.data) — update local UI state so the dashboard reflects change immediately
    const row = res.data as Record<string, unknown>;
    const asString = (v: unknown) =>
      typeof v === "string" ? v : String(v ?? "");
    const asMaybeString = (v: unknown) => (v == null ? undefined : asString(v));

    const newEvent: CareerEventType = {
      id: asString(row["id"]),
      title: asString(row["job_title"] ?? payload.job_title),
      company: asString(row["company_name"] ?? payload.company_name),
      startDate: asString(
        row["start_date"] ?? payload.start_date ?? new Date().toISOString()
      ),
      endDate:
        (row["current_position"] as unknown) === true
          ? undefined
          : asMaybeString(row["end_date"] ?? payload.end_date),
      description: asMaybeString(
        row["job_description"] ?? payload.job_description
      ),
    };

    setCareerEvents((c) => [newEvent, ...c]);
    setCounts((c) => ({ ...c, employmentCount: (c.employmentCount ?? 0) + 1 }));

    return res.data;
  };
  const handleAddSkill = () => console.log("➕ Add Skill clicked");
  const handleAddEducation = () => console.log("➕ Add Education clicked");
  const handleAddProject = () => console.log("➕ Add Project clicked");

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

  // module-level helpers are used (readMetaString, buildDisplayHeader, docsToActivities)

  // ----- Data loading effects (profile + lists) -----
  useEffect(() => {
    let mounted = true;
    if (loading) return;
    if (!user) {
      setDisplayName("Guest");
      setDisplayEmail("");
      return;
    }

    const loadAll = async () => {
      try {
        // Profile header
        const profRes = await crud.getUserProfile(user.id);
        if (!mounted) return;
        const { name, email } = buildDisplayHeader(
          profRes.error ? null : profRes.data ?? null,
          user
        );
        setDisplayName(name);
        setDisplayEmail(email);

        // Scoped CRUD helpers for this user
        const userCrud = crud.withUser(user.id);

        // Fetch documents, employment and skills in parallel using canonical table/column names
        const [docsRes, empRes, skillsRes] = await Promise.all([
          userCrud.listRows("documents", "id,file_name,uploaded_at", {
            order: { column: "uploaded_at", ascending: false },
          }),
          userCrud.listRows(
            "employment",
            "id,job_title,company_name,location,start_date,end_date,current_position,job_description",
            { order: { column: "start_date", ascending: false } }
          ),
          userCrud.listRows("skills", "id,skill_name,proficiency_level"),
        ]);

        if (!mounted) return;

        const docs: DocumentRow[] = docsRes.error
          ? []
          : ((docsRes.data ?? []) as DocumentRow[]);
        const emp: EmploymentRow[] = empRes.error
          ? []
          : ((empRes.data ?? []) as EmploymentRow[]);
        const sk: SkillRow[] = skillsRes.error
          ? []
          : ((skillsRes.data ?? []) as SkillRow[]);

        // Map to view models
        setActivities(docsToActivities(docs));
        setCounts((c) => ({ ...c, projectsCount: docs.length }));

        // Map proficiency_level enum to numeric values for the chart (beginner=1 .. expert=4)
        const proficiencyMap: Record<string, number> = {
          beginner: 1,
          intermediate: 2,
          advanced: 3,
          expert: 4,
        };
        const s = sk.map((r) => ({
          name: r.skill_name ?? "Unnamed",
          value:
            typeof r.proficiency_level === "string"
              ? proficiencyMap[r.proficiency_level] ?? 1
              : 1,
        }));
        setSkills(s);
        setCounts((c) => ({ ...c, skillsCount: s.length }));
        const empEvents = emp.map((e) => ({
          id: e.id,
          title: e.job_title ?? "",
          company: e.company_name ?? "",
          startDate: e.start_date ?? "",
          endDate: e.current_position ? undefined : e.end_date ?? undefined,
          description: e.job_description ?? undefined,
        })) as CareerEventType[];
        setCareerEvents(empEvents);
        setCounts((c) => ({ ...c, employmentCount: empEvents.length }));
      } catch (err) {
        // Fail silently for now but keep UI functional; log for debugging
        // TODO: surface non-intrusive UI errors (snackbar/aria-live)
        console.error("Dashboard data load failed", err);
      }
    };

    loadAll();

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
          startIcon={<Icon name="Download" color="inherit" />}
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

        <SummaryCards
          counts={counts}
          onAddEmployment={handleAddEmployment}
          onAddSkill={handleAddSkill}
          onAddEducation={handleAddEducation}
          onAddProject={handleAddProject}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 4 }}>
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileCompletion profile={counts} />
          </Box>
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileStrengthTips
              strengthScore={85}
              recommendations={[
                "Add more details to your recent job description",
                "Include a professional summary section",
                "List at least 3 soft skills",
              ]}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 2 }}>
          <Box sx={{ flex: "1 1 400px" }}>
            <SkillsDistributionChart skills={skills} />
          </Box>
          <Box sx={{ flex: "1 1 400px" }}>
            <RecentActivityTimeline activities={activities} />
          </Box>
        </Box>

        <Box mt={4}>
          <Divider sx={{ mb: 3 }} />
          <CareerTimeline events={careerEvents} />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
