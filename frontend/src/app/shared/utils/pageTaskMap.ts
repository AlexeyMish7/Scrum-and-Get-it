import type { SprintTaskItem } from "@shared/components/common/SprintTaskSnackbar";
import { ownerFor } from "@shared/utils/taskOwners";

// Page key union keeps task grouping consistent.
export type PageTaskKey =
  | "ai:dashboard"
  | "ai:cover-letter"
  | "ai:resume"
  | "ai:job-match"
  | "ai:company-research"
  | "ai:templates"
  | "jobs:pipeline"
  | "jobs:new"
  | "jobs:documents"
  | "jobs:saved-searches"
  | "jobs:analytics"
  | "jobs:automations";

export const pageTaskMap: Record<PageTaskKey, SprintTaskItem[]> = {
  "ai:dashboard": [
    {
      uc: "UC-047",
      title: "Resume AI",
      desc: "Tailor resume content to a job.",
      owner: ownerFor("UC-047"),
      scope: "both",
    },
    {
      uc: "UC-056",
      title: "Cover Letter AI",
      desc: "Generate personalized letters.",
      owner: ownerFor("UC-056"),
      scope: "both",
    },
    {
      uc: "UC-065",
      title: "Job Match",
      desc: "Match score + strengths & gaps.",
      owner: ownerFor("UC-065"),
      scope: "both",
    },
    {
      uc: "UC-063",
      title: "Company Research",
      desc: "Company profile & insights.",
      owner: ownerFor("UC-063"),
      scope: "both",
    },
    {
      uc: "UC-040",
      title: "Deadline Radar",
      desc: "Upcoming deadlines & urgency.",
      owner: ownerFor("UC-040"),
      scope: "both",
    },
    {
      uc: "UC-049",
      title: "Skills Spotlight",
      desc: "Suggest skills to emphasize.",
      owner: ownerFor("UC-049"),
      scope: "both",
    },
    {
      uc: "UC-066",
      title: "Skill Gaps",
      desc: "Highlight missing/weak skills.",
      owner: ownerFor("UC-066"),
      scope: "both",
    },
    {
      uc: "UC-064",
      title: "Insights Feed",
      desc: "Recent company news & signals.",
      owner: ownerFor("UC-064"),
      scope: "both",
    },
    {
      uc: "UC-069",
      title: "Workflow Checklist",
      desc: "Auto follow-ups & reminders.",
      owner: ownerFor("UC-069"),
      scope: "both",
    },
  ],
  "ai:cover-letter": [
    {
      uc: "UC-056",
      title: "AI Content Gen",
      desc: "Generate tailored paragraphs (job+profile+company).",
      owner: ownerFor("UC-056"),
      scope: "both",
    },
    {
      uc: "UC-055",
      title: "Template Library",
      desc: "Browse & select starting styles.",
      owner: ownerFor("UC-055"),
      scope: "both",
    },
    {
      uc: "UC-058",
      title: "Tone & Style",
      desc: "Adjust tone, length, style controls.",
      owner: ownerFor("UC-058"),
      scope: "frontend",
    },
    {
      uc: "UC-057",
      title: "Company Facts",
      desc: "Inject mission/news into generation flow.",
      owner: ownerFor("UC-057"),
      scope: "both",
    },
    {
      uc: "UC-059",
      title: "Experience Highlight",
      desc: "Emphasize relevant experiences in AI output.",
      owner: ownerFor("UC-059"),
      scope: "both",
    },
    {
      uc: "UC-060",
      title: "Edit & Refine",
      desc: "Rich edit, grammar, synonyms, autosave, versions.",
      owner: ownerFor("UC-060"),
      scope: "frontend",
    },
    {
      uc: "UC-061",
      title: "Export",
      desc: "Export final cover letter (PDF/Word/Text).",
      owner: ownerFor("UC-061"),
      scope: "frontend",
    },
    {
      uc: "UC-062",
      title: "Performance Tracking",
      desc: "Track version outcomes & response quality.",
      owner: ownerFor("UC-062"),
      scope: "both",
    },
  ],
  "ai:resume": [
    {
      uc: "UC-047",
      title: "AI Tailoring",
      desc: "Generate role-aligned bullets & skills.",
      owner: ownerFor("UC-047"),
      scope: "both",
    },
    {
      uc: "UC-046",
      title: "Templates",
      desc: "Organize & preview resume templates.",
      owner: ownerFor("UC-046"),
      scope: "both",
    },
    {
      uc: "UC-048",
      title: "Sections",
      desc: "Toggle & reorder sections.",
      owner: ownerFor("UC-048"),
      scope: "frontend",
    },
    {
      uc: "UC-049",
      title: "Skills Optimization",
      desc: "Suggest & reorder ATS-relevant skills.",
      owner: ownerFor("UC-049"),
      scope: "both",
    },
    {
      uc: "UC-050",
      title: "Experience Tailoring",
      desc: "Refine role descriptions w/ quantified results.",
      owner: ownerFor("UC-050"),
      scope: "both",
    },
    {
      uc: "UC-051",
      title: "Export",
      desc: "Export resume (PDF/Word/Text/HTML).",
      owner: ownerFor("UC-051"),
      scope: "frontend",
    },
    {
      uc: "UC-053",
      title: "Validation",
      desc: "Preview + grammar + missing info warnings.",
      owner: ownerFor("UC-053"),
      scope: "frontend",
    },
    {
      uc: "UC-052",
      title: "Versioning",
      desc: "Clone, compare, merge, set default version.",
      owner: ownerFor("UC-052"),
      scope: "both",
    },
    {
      uc: "UC-054",
      title: "Collaboration",
      desc: "Share & collect feedback on resumes.",
      owner: ownerFor("UC-054"),
      scope: "both",
    },
  ],
  "ai:job-match": [
    {
      uc: "UC-065",
      title: "Match Score",
      desc: "Breakdown across skills/experience/education.",
      owner: ownerFor("UC-065"),
      scope: "both",
    },
    {
      uc: "UC-066",
      title: "Skill Gaps",
      desc: "List missing/weak skills & learning paths.",
      owner: ownerFor("UC-066"),
      scope: "both",
    },
    {
      uc: "UC-049",
      title: "Skills Fit",
      desc: "Optimize & order relevant skills.",
      owner: ownerFor("UC-049"),
      scope: "both",
    },
    {
      uc: "UC-050",
      title: "Experience Fit",
      desc: "Emphasize quantified achievements.",
      owner: ownerFor("UC-050"),
      scope: "both",
    },
  ],
  "ai:company-research": [
    {
      uc: "UC-063",
      title: "Company Profile",
      desc: "Size, industry, mission, leadership, products.",
      owner: ownerFor("UC-063"),
      scope: "both",
    },
    {
      uc: "UC-064",
      title: "News",
      desc: "Recent news categorized + summaries.",
      owner: ownerFor("UC-064"),
      scope: "both",
    },
    {
      uc: "UC-067",
      title: "Salary Benchmarks",
      desc: "Ranges & total comp comparisons.",
      owner: ownerFor("UC-067"),
      scope: "both",
    },
    {
      uc: "UC-068",
      title: "Interview Insights",
      desc: "Process stages + prep & likely questions.",
      owner: ownerFor("UC-068"),
      scope: "both",
    },
    {
      uc: "UC-043",
      title: "Info Card",
      desc: "Company size, industry, site, description, logo.",
      owner: ownerFor("UC-043"),
      scope: "both",
    },
  ],
  "ai:templates": [
    {
      uc: "UC-046",
      title: "Resume Templates",
      desc: "Choose & manage resume templates.",
      owner: ownerFor("UC-046"),
      scope: "both",
    },
    {
      uc: "UC-055",
      title: "Cover Letter Templates",
      desc: "Select & manage cover letter templates.",
      owner: ownerFor("UC-055"),
      scope: "both",
    },
    {
      uc: "UC-054",
      title: "Collaboration",
      desc: "Share docs & collect feedback.",
      owner: ownerFor("UC-054"),
      scope: "both",
    },
    {
      uc: "UC-062",
      title: "Usage Analytics",
      desc: "Track effectiveness & A/B tests.",
      owner: ownerFor("UC-062"),
      scope: "both",
    },
  ],
  // Reordered by priority: High (037,038,039) → Medium (040,042,043,044,070) → Low (045,072,069)
  "jobs:pipeline": [
    {
      uc: "UC-037",
      title: "Pipeline Mgmt",
      desc: "Drag/drop stages; timestamps & bulk actions.",
      owner: ownerFor("UC-037"),
      scope: "both",
    },
    {
      uc: "UC-038",
      title: "Job Details",
      desc: "Full detail view: notes, contacts, history.",
      owner: ownerFor("UC-038"),
      scope: "both",
    },
    {
      uc: "UC-039",
      title: "Search & Filter",
      desc: "Filter by status, keywords, company, etc.",
      owner: ownerFor("UC-039"),
      scope: "both",
    },
    {
      uc: "UC-040",
      title: "Deadlines",
      desc: "Urgency indicators + upcoming deadlines.",
      owner: ownerFor("UC-040"),
      scope: "both",
    },
    {
      uc: "UC-042",
      title: "Materials Link",
      desc: "Associate resumes & cover letters.",
      owner: ownerFor("UC-042"),
      scope: "both",
    },
    {
      uc: "UC-043",
      title: "Company Info",
      desc: "Size, site, mission, logo in job details.",
      owner: ownerFor("UC-043"),
      scope: "both",
    },
    {
      uc: "UC-044",
      title: "Job Stats",
      desc: "Status counts & response rate.",
      owner: ownerFor("UC-044"),
      scope: "both",
    },
    {
      uc: "UC-070",
      title: "Status Monitoring",
      desc: "Timeline visualization & alerts.",
      owner: ownerFor("UC-070"),
      scope: "both",
    },
    {
      uc: "UC-045",
      title: "Archiving",
      desc: "Archive/restore bulk & auto rules.",
      owner: ownerFor("UC-045"),
      scope: "both",
    },
    {
      uc: "UC-072",
      title: "Funnel Trends",
      desc: "Applied→Interview→Offer funnel & trends.",
      owner: ownerFor("UC-072"),
      scope: "both",
    },
    {
      uc: "UC-069",
      title: "Workflow Automation",
      desc: "Quick application packages & reminders.",
      owner: ownerFor("UC-069"),
      scope: "both",
    },
  ],
  "jobs:new": [
    {
      uc: "UC-036",
      title: "Job Entry",
      desc: "Manual add form & validation.",
      owner: ownerFor("UC-036"),
      scope: "both",
    },
    {
      uc: "UC-041",
      title: "Import URL",
      desc: "Prefill from posting link (reviewable).",
      owner: ownerFor("UC-041"),
      scope: "both",
    },
    {
      uc: "UC-040",
      title: "Deadline Picker",
      desc: "Set deadlines w/ urgency & overdue flags.",
      owner: ownerFor("UC-040"),
      scope: "both",
    },
  ],
  "jobs:documents": [
    {
      uc: "UC-042",
      title: "Materials Tracking",
      desc: "Link resume & cover letter versions to jobs.",
      owner: ownerFor("UC-042"),
      scope: "both",
    },
  ],
  "jobs:saved-searches": [
    {
      uc: "UC-039",
      title: "Search & Filters",
      desc: "Store & recall complex job searches.",
      owner: ownerFor("UC-039"),
      scope: "both",
    },
    {
      uc: "UC-069",
      title: "Alerts & Automations",
      desc: "Schedule reruns & email summaries.",
      owner: ownerFor("UC-069"),
      scope: "both",
    },
  ],
  "jobs:analytics": [
    {
      uc: "UC-044",
      title: "Job Stats",
      desc: "Counts, response rate, time-in-stage metrics.",
      owner: ownerFor("UC-044"),
      scope: "both",
    },
    {
      uc: "UC-072",
      title: "Pipeline Analytics",
      desc: "Funnel + trends across application stages.",
      owner: ownerFor("UC-072"),
      scope: "both",
    },
    {
      uc: "UC-040",
      title: "Deadline Adherence",
      desc: "Deadline tracking & on-time rate.",
      owner: ownerFor("UC-040"),
      scope: "both",
    },
  ],
  "jobs:automations": [
    {
      uc: "UC-069",
      title: "Workflow Automation",
      desc: "Generate application packages & reminders.",
      owner: ownerFor("UC-069"),
      scope: "both",
    },
    {
      uc: "UC-070",
      title: "Status Triggers",
      desc: "Trigger rules on status changes.",
      owner: ownerFor("UC-070"),
      scope: "both",
    },
    {
      uc: "UC-071",
      title: "Interview Scheduling",
      desc: "Calendar hooks & prep reminders.",
      owner: ownerFor("UC-071"),
      scope: "both",
    },
  ],
};

export function getTasksForPage(key: PageTaskKey): SprintTaskItem[] {
  return pageTaskMap[key] || [];
}
