# FlowATS - Application Architecture

This document provides a comprehensive, high-level overview of how FlowATS works - the interconnected systems, user flows, and where to find different parts in the codebase.

## System Overview

FlowATS is a full-stack web application that helps job seekers manage their job search with AI-powered tools. The app has three main components:

```
┌─────────────┐      HTTP Requests      ┌─────────────┐
│  Frontend   │ ←──────────────────────→ │   Server    │
│  (React)    │      JSON Responses     │  (Node.js)  │
└─────────────┘                          └─────────────┘
       ↓                                        ↓
   Supabase Client                      OpenAI API
       ↓                                        ↓
┌──────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL)                   │
│  - User authentication                               │
│  - Database (jobs, profile, documents, etc.)         │
│  - File storage                                      │
└──────────────────────────────────────────────────────┘
```

### The Three Layers

**1. Frontend (User Interface)**

- **What:** The website you see and interact with in your browser
- **Tech:** React 18, TypeScript, Material-UI
- **Location:** `frontend/` folder
- **Runs on:** http://localhost:5173 (development)

**2. Server (AI Processing)**

- **What:** Handles AI generation, prompt management, external API calls
- **Tech:** Node.js, Express, TypeScript
- **Location:** `server/` folder
- **Runs on:** http://localhost:3001 (development)

**3. Database (Data Storage)**

- **What:** Stores all user data, jobs, documents, analytics
- **Tech:** PostgreSQL via Supabase
- **Location:** Cloud-hosted (Supabase)
- **Access:** Both frontend and server connect to it

---

## How The Systems Work Together

### Example: User Generates a Resume

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User clicks "Generate Resume" in browser                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Frontend (React)                                          │
│    - Gathers profile data from state                         │
│    - Sends POST request to server with:                      │
│      * User profile                                          │
│      * Skills, experience, education                         │
│      * Template preference                                   │
│      * Target job (optional)                                 │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Server (Node.js)                                          │
│    - Receives request at /api/generate/resume                │
│    - Validates JWT token (authentication)                    │
│    - Loads resume prompt template                            │
│    - Injects user data into prompt                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. OpenAI API (External)                                     │
│    - Receives prompt from server                             │
│    - GPT-4 writes resume content                             │
│    - Returns JSON with sections:                             │
│      * Header (name, contact)                                │
│      * Summary (professional bio)                            │
│      * Experience (formatted bullets)                        │
│      * Education                                             │
│      * Skills                                                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Server (Node.js)                                          │
│    - Validates AI response (is it valid JSON?)               │
│    - Saves generation session to database                    │
│    - Creates document version in database                    │
│    - Returns resume to frontend                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Database (Supabase)                                       │
│    - Stores in `generation_sessions` table                   │
│    - Creates row in `documents` table                        │
│    - Creates row in `document_versions` table                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Frontend (React)                                          │
│    - Receives resume data                                    │
│    - Displays preview                                        │
│    - User can:                                               │
│      * Download as PDF                                       │
│      * Edit manually                                         │
│      * Generate new version                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Major Features & Where They Live

### 1. Job Pipeline (Kanban Board)

**What it does:** Track job applications through stages

**User Flow:**

```
Add Job → View in Kanban → Drag to new stage → Add notes → Track deadline
```

**Frontend Code:**

- **Location:** `frontend/src/app/workspaces/job_pipeline/`
- **Main Page:** `pages/PipelinePage.tsx`
- **Kanban Board:** `components/board/KanbanBoard.tsx`
- **Job Cards:** `components/board/JobCard.tsx`
- **Job Details:** `components/details/JobDetails.tsx`
- **Add/Edit Form:** `components/dialogs/JobFormDialog.tsx`
- **State Management:** `hooks/useJobsPipeline.ts`
- **Database Calls:** `services/jobsService.ts`

**Database Tables:**

- `jobs` - Job postings
- `job_notes` - Personal notes about each job
- `companies` - Company information

**Features:**

- Drag-and-drop between columns
- Bulk operations (move/delete multiple jobs)
- Search and filter
- Calendar widget showing deadlines
- AI match scoring

---

### 2. Profile Management

**What it does:** Manage professional information

**User Flow:**

```
Fill Profile → Add Skills → Add Experience → Add Education → Save
```

**Frontend Code:**

- **Location:** `frontend/src/app/workspaces/profile/`
- **Main Page:** `pages/ProfilePage.tsx`
- **Skills Section:** `components/skills/SkillsSection.tsx`
- **Experience:** `components/employment/EmploymentSection.tsx`
- **Education:** `components/education/EducationSection.tsx`
- **Services:** `services/profileService.ts`, `services/skillsService.ts`

**Database Tables:**

- `profiles` - Basic profile info
- `skills` - Skills with proficiency
- `employment` - Work history
- `education` - Education records
- `projects` - Portfolio projects
- `certifications` - Professional certifications

**Features:**

- CRUD operations for all sections
- Proficiency levels for skills
- Current position tracking
- GPA and honors tracking
- Project showcase

---

### 3. AI Resume/Cover Letter Generation

**What it does:** Use AI to create tailored documents

**User Flow:**

```
Select Template → Choose Theme → (Optional) Target Job → Generate → Preview → Export
```

**Frontend Code:**

- **Location:** `frontend/src/app/workspaces/ai/` and `frontend/src/app/workspaces/ai_workspace/`
- **Resume Generator:** `ai/pages/ResumeGeneratorPage.tsx`
- **Cover Letter:** `ai/pages/CoverLetterPage.tsx`
- **Document List:** `ai_workspace/components/documents/DocumentList.tsx`
- **Preview:** `ai_workspace/components/preview/DocumentPreview.tsx`
- **Export:** `ai_workspace/components/export/ExportDialog.tsx`
- **API Calls:** `ai/services/aiService.ts`

**Server Code:**

- **Location:** `server/src/routes/generate/`
- **Resume Endpoint:** `POST /api/generate/resume`
- **Cover Letter:** `POST /api/generate/cover-letter`
- **Orchestration:** `server/src/services/orchestrator.ts`
- **AI Client:** `server/src/services/aiClient.ts`
- **Prompts:** `server/prompts/resume.ts`, `server/prompts/coverLetter.ts`

**Database Tables:**

- `templates` - Resume/cover letter templates
- `themes` - Visual styling
- `documents` - User's documents
- `document_versions` - Version history
- `generation_sessions` - AI generation tracking
- `export_history` - Export tracking

**Features:**

- Multiple template types (Chronological, Functional, Hybrid, Creative)
- Theme customization (colors, fonts, spacing)
- Job-specific tailoring
- Version control
- PDF/Word export

---

### 4. Job Match Analysis

**What it does:** AI-powered job matching with scores

**User Flow:**

```
View Job → Click "Analyze Match" → See Score → Review Strengths/Gaps → Get Recommendations
```

**Frontend Code:**

- **Location:** `frontend/src/app/workspaces/job_pipeline/`
- **Match Panel:** `components/analytics/MatchAnalysisPanel.tsx`
- **Match Hook:** `hooks/useJobMatch.ts`
- **Cache Service:** `services/analyticsCache.ts`

**Server Code:**

- **Endpoint:** `POST /api/generate/job-match`
- **Location:** `server/src/routes/generate/index.ts`

**Database Tables:**

- `analytics_cache` - Cached match results (expires after 7 days)

**Features:**

- Overall match score (0-100)
- Breakdown by skills, experience, education
- Matched vs. missing skills
- Strengths and gaps
- Recommendations

**Caching:**

- Results cached for 7 days
- Invalidated when profile changes
- Deduplication (prevents duplicate AI calls)

---

### 5. Company Research

**What it does:** Fetch and display company information

**User Flow:**

```
Enter Company Name → View Company Profile → See Culture/Tech Stack → Read Interview Tips
```

**Server Code:**

- **Endpoint:** `POST /api/company/research`
- **Location:** `server/src/routes/company/index.ts`
- **Service:** `server/src/services/companyResearchService.ts`
- **Scraper:** `server/src/services/scraper.ts`

**Database Tables:**

- `companies` - Company data (shared across users)
- `user_company_notes` - User's private company notes

**Process:**

1. Check database cache
2. If not found, scrape company website
3. AI analyzes and structures data
4. Cache for 30 days
5. Return to user

**Features:**

- Company description
- Industry and size
- Tech stack
- Culture and values
- Recent news
- Interview tips

---

### 6. Interview Hub

**What it does:** Manage interview schedule and preparation

**User Flow:**

```
View Upcoming Interviews → Schedule New → Track Prep Tasks → Add Notes
```

**Frontend Code:**

- **Location:** `frontend/src/app/workspaces/interview_hub/`
- **Main Page:** `pages/InterviewHubPage.tsx`
- **Calendar:** `components/calendar/InterviewCalendar.tsx`

**Database Tables:**

- `job_notes.interview_schedule` - Interview dates/times
- `job_notes.interview_notes` - Notes from interviews

**Features:**

- Calendar view
- Google Calendar integration
- Interview prep tasks
- Post-interview notes

---

## Data Flow Patterns

### Pattern 1: CRUD Operations (Create, Read, Update, Delete)

**Example: Adding a Skill**

```
User fills skill form
    ↓
Frontend validates input
    ↓
Frontend calls skillsService.createSkill()
    ↓
Service calls withUser(userId).insertRow("skills", data)
    ↓
Supabase inserts row with automatic user_id
    ↓
Database returns created skill
    ↓
Frontend updates UI with new skill
    ↓
ProfileChangeContext marks profile as changed
```

**Code Locations:**

- **UI:** `frontend/.../components/skills/SkillForm.tsx`
- **Service:** `frontend/.../services/skillsService.ts`
- **CRUD Wrapper:** `frontend/src/app/shared/services/crud.ts`
- **Database:** Supabase `skills` table

---

### Pattern 2: AI Generation

**Example: Generating Resume**

```
User clicks "Generate"
    ↓
Frontend sends request to server (/api/generate/resume)
    ↓
Server auth middleware verifies JWT token
    ↓
Route handler validates request body
    ↓
Orchestrator.orchestrateResumeGeneration() called
    ↓
Prompt template loaded from prompts/resume.ts
    ↓
User data injected into template
    ↓
AI client sends prompt to OpenAI
    ↓
GPT-4 generates resume as JSON
    ↓
Server validates JSON structure
    ↓
Saves to generation_sessions and documents tables
    ↓
Returns resume to frontend
    ↓
Frontend displays preview
```

**Code Locations:**

- **Frontend UI:** `frontend/.../ai/pages/ResumeGeneratorPage.tsx`
- **Frontend Service:** `frontend/.../ai/services/aiService.ts`
- **Server Route:** `server/src/routes/generate/index.ts`
- **Server Service:** `server/src/services/orchestrator.ts`
- **Prompt:** `server/prompts/resume.ts`
- **AI Client:** `server/src/services/aiClient.ts`
- **Database:** `generation_sessions`, `documents`, `document_versions`

---

### Pattern 3: Caching

**Example: Job Match Analysis**

```
User views job
    ↓
Frontend calls useJobMatch(userId, jobId)
    ↓
Hook checks analyticsCache service
    ↓
Cache query: SELECT * FROM analytics_cache
             WHERE user_id = ? AND job_id = ?
             AND analytics_type = 'match_score'
             AND expires_at > NOW()
    ↓
IF FOUND: Return cached data (instant)
    ↓
IF NOT FOUND:
    ↓
    Server generates new analysis
    ↓
    Saves to analytics_cache (expires in 7 days)
    ↓
    Returns fresh data
```

**Invalidation:**

- User updates profile → `ProfileChangeContext.markProfileChanged()`
- Next analysis → Cache invalidated → Fresh generation

**Code Locations:**

- **Hook:** `frontend/.../job_pipeline/hooks/useJobMatch.ts`
- **Cache Service:** `frontend/.../job_pipeline/services/analyticsCache.ts`
- **Database:** `analytics_cache` table

---

## Authentication Flow

```
User enters email/password
    ↓
Frontend calls supabase.auth.signInWithPassword()
    ↓
Supabase verifies credentials
    ↓
Returns JWT token + session
    ↓
Frontend stores in AuthContext
    ↓
All API requests include token in Authorization header
    ↓
Server middleware verifies token
    ↓
Attaches user to request object
    ↓
Database queries automatically filtered by user_id (RLS)
```

**Protected Routes:**

- All app pages except login/signup
- Implemented with `ProtectedRoute` component
- Redirects to login if not authenticated

**Code Locations:**

- **Auth Context:** `frontend/src/app/shared/context/AuthContext.tsx`
- **Protected Route:** `frontend/src/router.tsx`
- **Server Middleware:** `server/src/middleware/auth.ts`

---

## Event-Driven Updates

FlowATS uses custom events to keep different parts of the app in sync:

### Event: `jobs-updated`

**Emitted when:**

- Job created
- Job moved to new stage
- Job deleted
- Job details edited

**Listeners:**

- CalendarWidget → Refreshes deadlines
- Pipeline stats → Updates counts

**Code Example:**

```typescript
// Emitter (after job update)
await updateJob(jobId, data);
window.dispatchEvent(new CustomEvent("jobs-updated"));

// Listener (in CalendarWidget)
useEffect(() => {
  const handler = () => refreshCalendar();
  window.addEventListener("jobs-updated", handler);
  return () => window.removeEventListener("jobs-updated", handler);
}, []);
```

---

## File Organization

### Frontend Structure

```
frontend/src/app/
├── shared/                    # Shared across all workspaces
│   ├── components/           # Reusable UI components
│   ├── context/              # React Context providers
│   ├── hooks/                # Custom hooks
│   ├── services/             # API/database services
│   ├── theme/                # MUI theme
│   └── types/                # TypeScript types
└── workspaces/               # Feature modules
    ├── job_pipeline/         # Job tracking
    ├── profile/              # Profile management
    ├── ai/                   # AI generation
    ├── ai_workspace/         # Document management
    └── interview_hub/        # Interview scheduling
```

### Server Structure

```
server/src/
├── routes/                   # API endpoints
│   ├── generate/            # AI generation
│   ├── company/             # Company research
│   ├── salary/              # Salary insights
│   └── artifacts/           # AI artifacts
├── services/                 # Business logic
│   ├── aiClient.ts          # OpenAI wrapper
│   ├── orchestrator.ts      # Generation orchestration
│   └── scraper.ts           # Web scraping
├── prompts/                  # AI prompt templates
└── middleware/               # Express middleware
```

### Database Organization

```
Tables grouped by purpose:
- User: profiles, auth.users
- Profile: skills, employment, education, projects, certifications
- Jobs: jobs, job_notes, companies, user_company_notes
- Documents: templates, themes, documents, document_versions
- AI: analytics_cache, generation_sessions
- Export: export_history, document_jobs
```

---

## Development Workflow

### Running the App Locally

**Easy Way:**

```powershell
# Run both frontend and server
.\dev.ps1
```

**Manual Way:**

```powershell
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Server
cd server
npm run dev
```

**URLs:**

- Frontend: http://localhost:5173
- Server: http://localhost:3001
- Database: Supabase cloud (configured in .env)

---

## Key Technologies

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **Vite** - Build tool
- **React Router** - Navigation
- **@dnd-kit** - Drag and drop
- **TanStack Query** - Data fetching (optional)

### Server

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **OpenAI SDK** - AI integration
- **Cheerio** - Web scraping
- **Winston** - Logging

### Database & Auth

- **Supabase** - Backend as a service
- **PostgreSQL** - Database
- **Row Level Security** - User data isolation
- **JWT** - Authentication tokens

### Deployment

- **Frontend** - Vercel/Netlify
- **Server** - Railway/Render/Heroku
- **Database** - Supabase (cloud-hosted)

---

## Performance Optimizations

### Frontend

- **React Query Caching** - Profile data cached with configurable stale time
  - Eliminates duplicate API calls when navigating between pages
  - ENV-configurable: `VITE_CACHE_STALE_TIME_MINUTES` (default: 5)
  - Cache invalidated after mutations (add/edit/delete)
- **Code splitting** - Lazy load workspace modules
- **Memoization** - Prevent unnecessary re-renders
- **Debouncing** - Reduce search API calls
- **Event deduplication** - Prevent duplicate operations

### Server

- **Caching** - Store AI results for 7-30 days
- **Rate limiting** - Prevent API abuse
- **Prompt optimization** - Efficient token usage
- **Connection pooling** - Reuse database connections

### Database

- **Indexes** - Fast queries on user_id, job_status
- **RLS** - Automatic user filtering
- **JSONB** - Flexible structured data
- **Denormalization** - Store company_name in jobs for performance

---

## Developer Tools

### Dev Log Panel

A floating debug panel that shows real-time API and Supabase calls:

- **API Tab** - Backend server calls
- **Supabase Tab** - Database operations with color-coded badges
  - SELECT (blue), INSERT (green), UPDATE (yellow), DELETE (red)
  - Shows table name, timing, row count, filters

**Location:** `frontend/src/app/shared/components/dev/`

**How it works:**

1. Fetch interceptor captures all HTTP requests
2. Routes calls to appropriate tab based on URL
3. Parses Supabase REST API to extract operation details

**Usage:** Panel appears automatically in development. Use to verify caching, debug duplicate queries, monitor performance.

See `.github/instructions/dev-tools.instructions.md` for full documentation.

---

## Security Features

### Frontend

- **Input validation** - Check data before sending
- **XSS prevention** - React escapes strings
- **Token storage** - Secure session handling

### Server

- **JWT verification** - Authenticate every request
- **Input sanitization** - Prevent injection attacks
- **CORS** - Only allow requests from frontend
- **Error masking** - Don't expose internal errors

### Database

- **Row Level Security** - Users can't see others' data
- **Encrypted connections** - SSL/TLS for all queries
- **Backup & recovery** - Automatic backups

---

This architecture ensures FlowATS is scalable, secure, and maintainable. Each layer has a clear responsibility, and they communicate through well-defined interfaces!
