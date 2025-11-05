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

import Icon from "../../components/common/Icon";
import { useAuth } from "../../app/shared/context/AuthContext.tsx";
import * as crud from "../../services/crud";
import type { EmploymentRow } from "../../types/employment";
import type { DbSkillRow } from "../../types/skill";
import type { DocumentRow } from "../../types/document.ts";
import {
  mapEmployment,
  mapSkill,
  mapEducation,
  mapProject,
} from "../../services/dbMappers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
// Use shared Project type from services; other small view types are kept inline
type CareerEventType = {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string | undefined;
  description?: string | undefined;
};

// ----- Helper utilities (module-level to avoid hook linter complaints) -----
function readMetaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== "object") return "";
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

// Date normalization is handled by dbMappers; keep this module focused on UI and handlers.

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
import SummaryCards from "../../components/profile/SummaryCards";
import RecentActivityTimeline from "../../components/profile/RecentActivityTimeline";
import ProfileCompletion from "../../components/profile/ProfileCompletion";
import SkillsDistributionChart from "../../components/profile/SkillsDistributionChart";
import CareerTimeline from "../../components/profile/CareerTimeline";
import ProfileStrengthTips from "../../components/profile/ProfileStrengthTips";

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

  const handleAddEmployment = async (
    formData: Record<string, unknown>
  ): Promise<void> => {
    if (loading) throw new Error("Auth loading");
    if (!user) throw new Error("Please sign in to add employment");

    const userCrud = crud.withUser(user.id);

    // Use shared mapper to build payload and validate
    const mappedEmp = mapEmployment(formData);
    if (mappedEmp.error) throw new Error(mappedEmp.error);
    const res = await userCrud.insertRow(
      "employment",
      mappedEmp.payload ?? {},
      "*"
    );
    if (res.error) {
      console.error("Add employment failed", res.error);
      throw new Error(res.error.message || "Failed to add employment");
    }

    // Inserted row (res.data) — update local UI state so the dashboard reflects change immediately
    const row = res.data as Record<string, unknown>;
    const usedPayload = (mappedEmp.payload ?? {}) as Record<string, unknown>;
    const asString = (v: unknown) =>
      typeof v === "string" ? v : String(v ?? "");
    const asMaybeString = (v: unknown) => (v == null ? undefined : asString(v));

    const newEvent: CareerEventType = {
      id: asString(row["id"]),
      title: asString(row["job_title"] ?? usedPayload.job_title),
      company: asString(row["company_name"] ?? usedPayload.company_name),
      startDate: asString(
        row["start_date"] ?? usedPayload.start_date ?? new Date().toISOString()
      ),
      endDate:
        (row["current_position"] as unknown) === true
          ? undefined
          : asMaybeString(row["end_date"] ?? usedPayload.end_date),
      description: asMaybeString(
        row["job_description"] ?? usedPayload.job_description
      ),
    };

    setCareerEvents((c) => [newEvent, ...c]);
    setCounts((c) => ({ ...c, employmentCount: (c.employmentCount ?? 0) + 1 }));

    // No return value expected by caller; UI updated locally above.
    return;
  };

  const handleAddSkill = async (
    formData: Record<string, unknown>
  ): Promise<void> => {
    if (loading) throw new Error("Auth loading");
    if (!user) throw new Error("Please sign in to add skills");

    const userCrud = crud.withUser(user.id);

    const mapped = mapSkill(formData);
    if (mapped.error) throw new Error(mapped.error);
    const res = await userCrud.insertRow("skills", mapped.payload ?? {}, "*");
    if (res.error) {
      console.error("Add skill failed", res.error);
      throw new Error(res.error.message || "Failed to add skill");
    }

    // Map enum back to numeric value for the chart (beginner=1 .. expert=4)
    const enumToNum: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    const row = res.data as Record<string, unknown>;
    const used = (mapped.payload ?? {}) as Record<string, unknown>;
    const skillName =
      typeof row["skill_name"] === "string"
        ? (row["skill_name"] as string)
        : String(used.skill_name);
    const profEnum =
      typeof row["proficiency_level"] === "string"
        ? (row["proficiency_level"] as string)
        : (used.proficiency_level as string);
    const numeric = enumToNum[profEnum] ?? 1;

    setSkills((s) => [{ name: skillName, value: numeric }, ...s]);
    setCounts((c) => ({ ...c, skillsCount: (c.skillsCount ?? 0) + 1 }));

    // No return value expected by caller; UI updated locally above.
    return;
  };
  const handleAddEducation = async (
    formData: Record<string, unknown>
  ): Promise<void> => {
    if (loading) throw new Error("Auth loading");
    if (!user) throw new Error("Please sign in to add education");

    const userCrud = crud.withUser(user.id);

    // Use mapper to build and validate payload for education
    const mapped = mapEducation(formData);
    if (mapped.error) throw new Error(mapped.error);
    const res = await userCrud.insertRow(
      "education",
      mapped.payload ?? {},
      "*"
    );
    if (res.error) {
      console.error("Add education failed", res.error);
      throw new Error(res.error.message || "Failed to add education");
    }

    // update local counts immediately so UI reflects change
    setCounts((c) => ({ ...c, educationCount: (c.educationCount ?? 0) + 1 }));

    // notify other parts of the app to refresh if they listen
    window.dispatchEvent(new Event("education:changed"));

    return;
  };
  const handleAddProject = async (
    formData: Record<string, unknown>
  ): Promise<void> => {
    if (loading) throw new Error("Auth loading");
    if (!user) throw new Error("Please sign in to add a project");

    const userCrud = crud.withUser(user.id);

    // Use mapper to build and validate payload for projects
    const mapped = mapProject(formData);
    if (mapped.error) throw new Error(mapped.error);
    const res = await userCrud.insertRow("projects", mapped.payload ?? {}, "*");
    if (res.error) {
      console.error("Add project failed", res.error);
      throw new Error(res.error.message || "Failed to add project");
    }

    // update local counts and notify listeners
    setCounts((c) => ({ ...c, projectsCount: (c.projectsCount ?? 0) + 1 }));
    window.dispatchEvent(new Event("projects:changed"));

    // No return value expected by caller; UI updated locally above.
    return;
  };

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
      setDataLoading(true);
      try {
        // Profile header
        const profRes = await crud.getUserProfile(user.id);
        if (!mounted) return;
        const { name, email } = buildDisplayHeader(
          profRes.error
            ? null
            : (profRes.data as Record<string, unknown> | null) ?? null,
          user
        );
        setDisplayName(name);
        setDisplayEmail(email);

        // Scoped CRUD helpers for this user
        const userCrud = crud.withUser(user.id);

        // Fetch documents, employment, skills and education in parallel using canonical table/column names
        const [docsRes, empRes, skillsRes, educationRes, projectsRes] =
          await Promise.all([
            userCrud.listRows("documents", "id,file_name,uploaded_at", {
              order: { column: "uploaded_at", ascending: false },
            }),
            userCrud.listRows(
              "employment",
              "id,job_title,company_name,location,start_date,end_date,current_position,job_description",
              { order: { column: "start_date", ascending: false } }
            ),
            userCrud.listRows("skills", "id,skill_name,proficiency_level"),
            userCrud.listRows("education", "id,graduation_date,start_date", {
              order: { column: "graduation_date", ascending: false },
            }),
            // fetch projects count for dashboard summary
            userCrud.listRows("projects", "id", {
              order: { column: "start_date", ascending: false },
            }),
          ]);

        if (!mounted) return;

        const docs: DocumentRow[] = docsRes.error
          ? []
          : ((docsRes.data ?? []) as DocumentRow[]);
        const emp: EmploymentRow[] = empRes.error
          ? []
          : ((empRes.data ?? []) as EmploymentRow[]);
        const sk: DbSkillRow[] = skillsRes.error
          ? []
          : ((skillsRes.data ?? []) as DbSkillRow[]);

        // Map to view models
        setActivities(docsToActivities(docs));
        // projects count should reflect rows in `projects`, not documents
        const projRows: { id?: string }[] =
          projectsRes && !projectsRes.error && projectsRes.data
            ? Array.isArray(projectsRes.data)
              ? (projectsRes.data as { id?: string }[])
              : [projectsRes.data as unknown as { id?: string }]
            : [];
        setCounts((c) => ({ ...c, projectsCount: projRows.length }));

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
        // Education count (ensure dashboard shows correct number on initial load)
        const eduRows: { id?: string }[] =
          educationRes && !educationRes.error && educationRes.data
            ? Array.isArray(educationRes.data)
              ? (educationRes.data as { id?: string }[])
              : [educationRes.data as unknown as { id?: string }]
            : [];
        setCounts((c) => ({ ...c, educationCount: eduRows.length }));
      } catch (err) {
        // Fail silently for now but keep UI functional; log for debugging
        // TODO: surface non-intrusive UI errors (snackbar/aria-live)
        console.error("Dashboard data load failed", err);
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  // Listen for skill changes elsewhere in the app and refresh skills list
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const handler = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "skills",
          "id,skill_name,proficiency_level",
          { order: { column: "skill_name", ascending: true } }
        );
        if (res.error) {
          console.error(
            "Failed to refresh skills after external change",
            res.error
          );
          return;
        }
        const rows = Array.isArray(res.data) ? res.data : [res.data];
        const enumToNum: Record<string, number> = {
          beginner: 1,
          intermediate: 2,
          advanced: 3,
          expert: 4,
        };
        type SkillRowRes = {
          id?: string;
          skill_name?: string;
          proficiency_level?: string;
        };
        const mapped = (rows as SkillRowRes[]).map((r) => ({
          name: r.skill_name ?? String(r.id ?? ""),
          value: enumToNum[r.proficiency_level ?? "beginner"] ?? 1,
        }));
        setSkills(mapped);
        setCounts((c) => ({ ...c, skillsCount: mapped.length }));
      } catch (err) {
        console.error("Error refreshing skills", err);
      }
    };

    window.addEventListener("skills:changed", handler);
    return () => {
      window.removeEventListener("skills:changed", handler);
    };
  }, [user, loading]);

  // Listen for education changes and refresh education count
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const handler = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows("education", "id", {
          order: { column: "graduation_date", ascending: false },
        });
        if (res.error) {
          console.error(
            "Failed to refresh education after external change",
            res.error
          );
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        setCounts((c) => ({ ...c, educationCount: rows.length }));
      } catch (err) {
        console.error("Error refreshing education", err);
      }
    };

    window.addEventListener("education:changed", handler);
    return () => {
      window.removeEventListener("education:changed", handler);
    };
  }, [user, loading]);

  // Listen for project changes and refresh projects count
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const handler = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows("projects", "id", {
          order: { column: "start_date", ascending: false },
        });
        if (res.error) {
          console.error(
            "Failed to refresh projects after external change",
            res.error
          );
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        setCounts((c) => ({ ...c, projectsCount: rows.length }));
      } catch (err) {
        console.error("Error refreshing projects", err);
      }
    };

    window.addEventListener("projects:changed", handler);
    return () => {
      window.removeEventListener("projects:changed", handler);
    };
  }, [user, loading]);

  // Show loading spinner while initial data is being fetched
  // Track whether the dashboard's data load is in progress. Keep the
  // spinner visible until both auth initialization and the dashboard's
  // parallel data fetch complete to avoid flashing placeholder content.
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // If auth is still initializing, keep showing the spinner.
    if (loading) return;
    // If there is no user, stop dataLoading so the page can render a guest view
    if (!user) {
      setDataLoading(false);
      return;
    }
    // Otherwise, when the auth finished and user exists, let the data fetch effect
    // (below) control dataLoading while it runs.
  }, [loading, user]);

  if (loading || dataLoading) {
    return <LoadingSpinner />;
  }

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
        <Typography variant="h2" mb={3} fontWeight="bold">
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
            <ProfileStrengthTips profile={counts} />
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
