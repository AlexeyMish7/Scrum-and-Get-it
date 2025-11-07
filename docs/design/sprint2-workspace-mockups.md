# Sprint 2 Workspace Integration Sketches

_Source reference: Sprint 2 PRD (CS 490 Capstone Project — Fall 2025)_

These ASCII schemas show how the ATS Tracker UI can absorb Sprint 2 capabilities. Each diagram labels key regions (`[A]`, `[B]`, etc.) followed by an explicit mapping between that region and the corresponding Sprint 2 PRD use cases (UC-###).

---

## 1. App-Wide Layout Skeleton

```text
+--------------------------------------------------------------------------------+
| [A] Global Top Bar                                                             |
|      Workplace switcher • quick actions • theme/profile controls               |
+-------------------+------------------------------------------------------------+
| [B] Workspace     | [C] Workspace Content Outlet                               |
|     Sidebar       |      Routed pages (Profile • Jobs • AI) with shared state  |
|                   |      ErrorSnackbar • dialog portals • loading overlays     |
+-------------------+------------------------------------------------------------+
| [D] System Layer: global toasts • confirmations • blocking modals              |
+--------------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Global Top Bar – offers one-click access to UC-036 New Job entry, UC-047 AI resume generation, and UC-056 AI cover letter creation.
- `B` Workspace Sidebar – surfaces navigation links for Jobs flows (UC-037–UC-072) and AI flows (UC-046–UC-068) without relying on buried dropdowns.
- `C` Workspace Content Outlet – hosts each Sprint 2 screen while sharing auth/error scaffolding required across UC-036–UC-072.
- `D` System Layer – ensures success, warning, and validation feedback from UC-036, UC-041, UC-051, and UC-061 render consistently.

---

## 2. AI Workspace

### 2.1 AI Workspace Shell

```text
+--------------------------------------------------------------------------------+
| [A] AI Header: section title • persona toggle • CTA "Start New Analysis"       |
+------------------+-------------------------------------------------------------+
| [B] AI Sidebar   | [C] AI Route Outlet                                         |
| - Dashboard      |      Selected AI page (Job Match • Resume • Cover Letter)   |
| - Job Match      |      Shared AI context: chosen job, profile snapshot        |
| - Company Intel  |      ErrorSnackbar • loaders • outcome drawers              |
| - Resume Studio  |                                                             |
| - Cover Letters  |                                                             |
| - Templates Hub  |                                                             |
+------------------+-------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` AI Header – central launch pad for UC-047 resume tailoring, UC-056 cover letter generation, and UC-063 company research runs.
- `B` AI Sidebar – promotes persistent access to UC-065 job matching, UC-047–UC-054 resume tooling, and UC-055–UC-062 cover letter tooling.
- `C` AI Route Outlet – carries contextual state so match scores (UC-065), validation feedback (UC-053), and news signals (UC-064) remain synchronized across pages.

### 2.2 AI Dashboard (Home)

```text
+--------------------------------------------------------------------------------+
| [A] Hero Strip: "Your AI Copilot" quick-start cards                           |
|      Resume Studio • Cover Letter Studio • Company Research launchers          |
+---------------------------+------------------------------+---------------------+
| [B] Recent AI Outputs     | [C] Deadline Radar            | [D] Skill Gap Spotlight |
|      Latest resumes/letters| Pulls upcoming job deadlines | Highlights missing skills|
|      Open or regenerate     | Reminder shortcuts           | CTA into Job Match wizard|
+---------------------------+------------------------------+---------------------+
| [E] Insights Feed (company news • market signals)       | [F] Workflow Checklist |
|      Curated articles + AI tips                         | Smart tasks & follow-ups |
+--------------------------------------------------------+----------------------+
```

**Region ↔ Tasks**

- `A` Hero Strip – speeds access to UC-047 resume generation, UC-056 cover letter creation, and UC-063 company research.
- `B` Recent AI Outputs – showcases generated resumes (UC-047) and cover letters (UC-056) with regeneration controls.
- `C` Deadline Radar – surfaces upcoming job deadlines to reinforce UC-040 tracking within the AI command center.
- `D` Skill Gap Spotlight – highlights skill deficits and improvement suggestions per UC-049 and UC-066.
- `E` Insights Feed – streams company news and summaries satisfying UC-063 and UC-064.
- `F` Workflow Checklist – auto-creates follow-up tasks and reminders aligned with UC-069.

### 2.3 AI Job Match Page

```text
+--------------------------------------+-----------------------------------------+
| [A] Job Selector & Profile Snapshot  | [B] Match Analysis Tabs                 |
| - Search pipeline jobs               | - Overview: aggregate score & timeline  |
| - Filters (status, industry, stage)  | - Skills Fit (UC-049, UC-066)           |
| - Saved comparison sets              | - Experience Fit (UC-050)               |
|                                      | - Education & certifications check      |
+--------------------------------------+-----------------------------------------+
| [C] Recommendations & Learning Paths | [D] Action Drawer                       |
| - Courses, certifications, mentors   | - Apply, update profile, notify coaches |
|   suggested by gaps (UC-066)         | - Export match insights to AI studios   |
| - Match improvement tips (UC-065)    |   for resume/cover flows (UC-047, UC-056)|
+--------------------------------------+-----------------------------------------+
```

**Region ↔ Tasks**

- `A` Job Selector & Profile Snapshot – supports UC-065 by letting users compare jobs, apply filters, and review profile data before scoring.
- `B` Match Analysis Tabs – executes UC-049 skills optimization, UC-050 experience tailoring checks, and UC-065 category breakdowns.
- `C` Recommendations & Learning Paths – fulfills UC-066 by proposing learning resources and prioritizing development goals.
- `D` Action Drawer – routes users into downstream flows (UC-047, UC-056) and captures next steps recommended by UC-065.

### 2.4 AI Company Research Page

```text
+---------------------------+-----------------------------------------------+
| [A] Company Selector      | [B] Research Overview                          |
| - Search, saved targets   | - Mission, size, leadership, website (UC-063) |
| - Linked job postings     | - Culture, values, contact directory (UC-063) |
+---------------------------+-----------------------------------------------+
| [C] News & Signals Board  | [D] Competitive Landscape                      |
| - Timeline with source &  | - Peer companies, differentiators, positioning|
|   relevance scores (UC-064)| - Market benchmarks & SWOT (UC-063)           |
+---------------------------+-----------------------------------------------+
| [E] Interview Prep Toolkit| [F] Export & Insert Drawer                     |
| - Process stages, typical | - Push insights into cover letters (UC-057)    |
|   questions, tips (UC-068)| - Download research packet (UC-063)            |
+---------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Company Selector – anchors UC-063 by letting users pick and revisit researched organizations.
- `B` Research Overview – satisfies UC-063 acceptance criteria for company profile, mission, and contact visibility.
- `C` News & Signals Board – meets UC-064 by highlighting recent articles, categories, and relevance.
- `D` Competitive Landscape – deepens UC-063 with peer comparisons and differentiation notes.
- `E` Interview Prep Toolkit – fulfills UC-068 by preparing stage expectations and curated coaching tips.
- `F` Export & Insert Drawer – integrates UC-057 by inserting findings into cover letters and provides UC-063 exports.

### 2.5 AI Resume Studio (Generate Resume)

```text
+----------------------------------+---------------------------------------------+
| [A] Job Context & Match Snapshot | [B] Resume Canvas                           |
| - Select job (pipeline + import) | - Template tabs (chronological, hybrid)    |
| - Category match scores          | - Section toggles & drag handles (UC-048)  |
| - Focus prompts & guidance       | - Inline editing with AI suggestions       |
+----------------------------------+---------------------------------------------+
| [C] AI Controls                  | [D] Version & Export Dock                   |
| - Prompt builder & tone slider   | - Version list, compare, set default (UC-052)|
| - Regenerate bullets & skills map| - Export PDF/DOCX/TXT/HTML (UC-051)        |
|   (UC-047, UC-049, UC-050)       | - Share link & feedback thread (UC-054)    |
+----------------------------------+---------------------------------------------+
| [E] Validation & Insights Panel                                               |
| - Spellcheck, grammar, tone, ATS alerts (UC-053)                              |
| - Missing info & length guidance                                              |
+------------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Job Context & Match Snapshot – bridges job selection and focus cues required for UC-047 tailored generation.
- `B` Resume Canvas – covers UC-046 template management and UC-048 section customization with live preview editing.
- `C` AI Controls – powers UC-047 resume content creation, UC-049 skills optimization, and UC-050 experience tailoring.
- `D` Version & Export Dock – delivers UC-051 multi-format export, UC-052 version management, and UC-054 collaboration tools.
- `E` Validation & Insights Panel – enforces UC-053 preview and quality checks.

### 2.6 AI Cover Letter Studio (Generate Cover Letter)

```text
+----------------------------------+---------------------------------------------+
| [A] Job & Company Context        | [B] Cover Letter Editor                     |
| - Job selector & role summary    | - Rich text body with AI paragraph blocks   |
| - Company research snapshot      | - Tone presets & style toggles (UC-058)     |
| - Template chooser & preview     | - Section visibility controls (UC-055)     |
+----------------------------------+---------------------------------------------+
| [C] AI Guidance & Variations     | [D] Performance & Export Dock               |
| - Regenerate intro/body/close    | - Export PDF/DOCX/TXT • email template (UC-061)|
|   (UC-056)                       | - Outcome tracking & response rates (UC-062)|
| - Experience highlight cues      | - Feedback thread & version history (UC-060)|
|   (UC-059)                       |                                             |
| - Custom tone instructions (UC-058)|                                           |
+----------------------------------+---------------------------------------------+
| [E] Research Insertions Drawer                                                  |
| - Suggested company insights, news, initiatives to embed (UC-057)              |
+------------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Job & Company Context – aligns with UC-055 template selection and UC-057 company research integration.
- `B` Cover Letter Editor – executes UC-056 AI content generation, UC-058 tone/style customization, and UC-060 in-place editing aids.
- `C` AI Guidance & Variations – powers UC-056 paragraph regeneration, UC-059 experience highlighting, and tone adjustments from UC-058.
- `D` Performance & Export Dock – covers UC-060 editing history, UC-061 export options, and UC-062 performance tracking.
- `E` Research Insertions Drawer – satisfies UC-057 by injecting relevant company insights.

### 2.7 Templates & Feedback Hub (AI Workspace)

```text
+---------------------------+-----------------------------------------------+
| [A] Template Library      | [B] Collaboration Hub                          |
| - Resume template catalog | - Shared documents, permissions, reviewers    |
|   & import tools (UC-046) |   with comments & resolution (UC-054)          |
| - Cover letter templates  |                                               |
|   & previews (UC-055)     |                                               |
+---------------------------+-----------------------------------------------+
| [C] Usage & Performance Analytics                                         |
| - Template adoption charts, A/B tests, response rates (UC-052, UC-062)     |
| - Surface high-performing variants for reuse                              |
+---------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Template Library – handles UC-046 resume template management and UC-055 cover letter template browsing.
- `B` Collaboration Hub – powers UC-054 feedback loops with comments, permissions, and summaries.
- `C` Usage & Performance Analytics – satisfies UC-052 version performance review and UC-062 template effectiveness tracking.

---

## 3. Jobs Workspace

### 3.1 Jobs Workspace Shell

```text
+--------------------------------------------------------------------------------+
| [A] Jobs Header: workspace title • "Add Job" • Import from URL shortcut        |
+------------------+-------------------------------------------------------------+
| [B] Jobs Sidebar | [C] Jobs Route Outlet                                       |
| - Pipeline       |      Active Jobs pages (kanban, analytics, documents, etc.) |
| - New Job        |      Shared selected-job context & status timeline           |
| - Documents      |      Hosts global modals (job detail, archive confirm)       |
| - Saved Searches |                                                             |
| - Analytics      |                                                             |
| - Automations    |                                                             |
+------------------+-------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Jobs Header – quick launch for UC-036 manual entry and UC-041 job import.
- `B` Jobs Sidebar – keeps UC-037 pipeline, UC-039 search, UC-044 analytics, and UC-069–UC-072 automation destinations at hand.
- `C` Jobs Route Outlet – renders Sprint 2 job workflows while providing shared context for UC-037–UC-072 interactions.

### 3.2 Pipeline Page

```text
+--------------------------------------------------------------------------------+
| [A] Stage Header Chips (Interested • Applied • Phone Screen • Interview • Offer|
|     • Rejected) with counts & filters                                          |
+-------------------+------------------+------------------+----------------------+
| [B] Kanban Columns with Job Cards                                              |
|     Drag & drop, deadline badges, days-in-stage counters                        |
|     Quick actions: log activity, archive, bulk status update                    |
+-------------------------------------------------------------------------------+
| [C] Job Detail Drawer                                                          |
|     Full job view with edit mode, notes, contacts, linked documents             |
|     Status history timeline & reminders                                        |
+-------------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Stage Header Chips – satisfies UC-037 stage counts and UC-039 stage filtering/bulk controls.
- `B` Kanban Columns – delivers UC-037 drag-and-drop, UC-040 deadline indicators, and UC-045 quick archive/bulk updates.
- `C` Job Detail Drawer – supports UC-038 job detail editing, UC-042 material linking, UC-043 company info display, and UC-070 status history.

### 3.3 New Job Page

```text
+----------------------------------+---------------------------------------------+
| [A] Manual Entry Form            | [B] Import from URL                         |
| - Required fields (title,        | - URL parser with results preview (UC-041) |
|   company) validation (UC-036)   | - Retry & manual fallback                   |
| - Location, salary, deadline     | - Import status messaging                   |
|   picker (UC-040)                |                                             |
| - Job description with counter   |                                             |
+----------------------------------+---------------------------------------------+
| [C] Metadata & Classification    | [D] Save & Next Steps Drawer                |
| - Industry, job type, tags       | - Assign stage & owner                      |
|   (UC-036)                       | - Schedule reminders & follow-ups (UC-040)  |
| - Source, priority flags         | - Launch pipeline or AI flows               |
+----------------------------------+---------------------------------------------+
```

**Region ↔ Tasks**

- `A` Manual Entry Form – fulfills UC-036 form fields and validation requirements while capturing deadlines for UC-040.
- `B` Import from URL – executes UC-041 auto-population with clear feedback loops.
- `C` Metadata & Classification – extends UC-036 by capturing industry, job type, and tagging.
- `D` Save & Next Steps Drawer – ensures UC-040 reminder scheduling and routes the job into downstream workflows.

### 3.4 Documents & Materials Page

```text
+---------------------------+-----------------------------------------------+
| [A] Documents Inventory   | [B] Detail Pane                                |
| - Resume, cover letter,   | - Linked job history & outcomes (UC-042)      |
|   portfolio listings      | - Preview, download, version comparison       |
|   with filters (UC-042)   |                                               |
+---------------------------+-----------------------------------------------+
| [C] Actions & Analytics Panel                                            |
| - Link/unlink materials, set defaults, update usage (UC-042)             |
| - Usage metrics & alerts                                                 |
+---------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Documents Inventory – catalogues resumes and cover letters per UC-042.
- `B` Detail Pane – shows associations, previews, and comparisons required by UC-042.
- `C` Actions & Analytics Panel – handles linking, defaults, and usage analytics for UC-042.

### 3.5 Saved Searches Page

```text
+----------------------------------+---------------------------------------------+
| [A] Search Builder               | [B] Results Preview                         |
| - Keyword, company, location     | - Matching jobs with highlighted terms      |
| - Status, industry, salary, date | - Bulk assign, export, favorite actions     |
|   filters (UC-039)               |                                             |
+----------------------------------+---------------------------------------------+
| [C] Saved Search Cards           | [D] Alerts & Automations Drawer             |
| - Last run, filter summary       | - Schedule reruns & email summaries (UC-069)|
| - Quick apply shortcuts (UC-039) | - Handoff into automation rules             |
+----------------------------------+---------------------------------------------+
```

**Region ↔ Tasks**

- `A` Search Builder – implements UC-039 search and filter combinations.
- `B` Results Preview – displays filtered jobs with highlighting and bulk operations from UC-039.
- `C` Saved Search Cards – stores preferences and quick actions required by UC-039.
- `D` Alerts & Automations Drawer – ties UC-039 searches into UC-069 automation workflows.

### 3.6 Analytics Page

```text
+----------------------------------+---------------------------------------------+
| [A] Summary KPIs                 | [B] Funnel Visualization                    |
| - Jobs per status, response rate | - Applied → Interview → Offer pipeline (UC-072)|
|   & goal tracking (UC-044)       | - Time-to-offer metrics (UC-072)            |
+----------------------------------+---------------------------------------------+
| [C] Trend Dashboards             | [D] Benchmark & Recommendations             |
| - Monthly volume, time-in-stage  | - Compare to industry averages (UC-072)     |
|   charts (UC-044)                | - AI optimization tips & CSV export (UC-044)|
| - Deadline adherence widget (UC-040)|                                           |
+----------------------------------+---------------------------------------------+
```

**Region ↔ Tasks**

- `A` Summary KPIs – fulfills UC-044 status totals and response rate metrics.
- `B` Funnel Visualization – satisfies UC-072 funnel and time-to-offer insights.
- `C` Trend Dashboards – covers UC-044 trend tracking and UC-040 deadline adherence.
- `D` Benchmark & Recommendations – handles UC-072 benchmarking plus UC-044 export/share actions.

### 3.7 Automations & Workflow Page

```text
+---------------------------+-----------------------------------------------+
| [A] Automation Library    | [B] Automation Editor                          |
| - Follow-up reminders     | - Trigger selection (status change, deadline) |
|   & application packages  |   with conditions (UC-069, UC-070)            |
|   (UC-069)                | - Actions: email drafts, task creation,       |
| - Interview scheduling    |   scheduling (UC-069, UC-071)                 |
|   scenarios (UC-071)      | - Preview timeline & conflict warnings (UC-071)|
+---------------------------+-----------------------------------------------+
| [C] Scheduled Activities Calendar & Feed                                   |
| - Upcoming reminders, interviews, automation logs (UC-069–UC-071)          |
+---------------------------------------------------------------------------+
```

**Region ↔ Tasks**

- `A` Automation Library – catalogues reusable workflows for UC-069 application automation and UC-071 interview scheduling.
- `B` Automation Editor – enables trigger, condition, and action authoring per UC-069 and UC-070 while supporting UC-071 scheduling nuances.
- `C` Scheduled Activities Calendar & Feed – tracks the automated reminders, follow-ups, and interviews required by UC-069–UC-071.

### 3.8 Job Details / Notes Modal

```text
+----------------------------------+---------------------------------------------+
| [A] Overview Header              | [B] Action Toolbar                          |
| - Job title, status, tags        | - Change stage, archive, duplicate (UC-045) |
| - Status timeline with timestamps| - Trigger AI tailoring & schedule follow-up |
|   (UC-038, UC-070)               |   tasks (UC-069)                             |
+----------------------------------+---------------------------------------------+
| [C] Details & Notes              | [D] Compensation & Interview Insights       |
| - Editable job fields, contacts, | - Salary benchmarks & negotiation notes     |
|   notes, attachments (UC-038)    |   (UC-067)                                   |
| - Linked resume/cover history    | - Interview prep checklist, contacts,       |
|   (UC-042)                       |   calendar hooks (UC-068, UC-071)            |
+----------------------------------+---------------------------------------------+
```

**Region ↔ Tasks**

- `A` Overview Header – combines UC-038 detailed view with UC-070 status timeline visibility.
- `B` Action Toolbar – covers UC-045 archival flow and UC-069 follow-up scheduling while routing AI tailoring triggers.
- `C` Details & Notes – implements UC-038 editing across all job fields and UC-042 document linkage.
- `D` Compensation & Interview Insights – fulfills UC-067 salary research, UC-068 interview prep, and UC-071 scheduling hooks.

---

## 4. Implementation Notes

- Treat each labeled region as a future React component boundary so responsibilities stay aligned with the mapped UC-### acceptance criteria.
- Repurpose existing layout shells (`AiLayout`, `JobsLayout`) to host permanent sidebars while keeping `ProtectedRoute` coverage for data-sensitive pages.
- When implementing data interactions, lean on `withUser(user.id)` and CRUD helpers to satisfy Supabase RLS while meeting UC-036–UC-072 requirements.
- Preserve the feedback layer (ErrorSnackbar + notifications) so validation and success states highlighted in UC-036, UC-041, UC-051, and UC-061 remain consistent.
