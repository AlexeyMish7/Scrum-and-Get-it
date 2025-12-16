# FlowATS

> **Built by:** Scrum and Get It Team
> A comprehensive job search management platform that helps job seekers organize their applications, optimize their resumes, and track their progress through the interview process.

## Overview

FlowATS is a full-stack web application designed to streamline the job search process by providing intelligent tools for managing job applications, generating tailored resumes and cover letters, and analyzing job matches using AI-powered insights.

This README change exists to validate the CI pipeline via a simple PR.

## Key Features

### 📋 Jobs Pipeline

- **Kanban-style board** to track applications through stages (Interested, Applied, Phone Screen, Interview, Offer)
- **Drag-and-drop** interface for easy status updates
- **Bulk operations** for managing multiple applications
- **Calendar integration** showing upcoming deadlines and important dates
- **Application timeline** tracking all interactions and status changes

### 🤖 AI-Powered Tools

- **Smart Resume Generation** - Create tailored resumes for specific job postings
- **Cover Letter Drafting** - Generate customized cover letters based on job requirements
- **Job Match Analysis** - AI-driven compatibility scoring between your profile and job listings
- **Skills Gap Identification** - Discover missing skills and get recommendations
- **Analytics Caching** - Efficient performance with intelligent cache management

### 📄 Document Management

- **Template System** - Multiple professional resume and cover letter templates
- **Version Control** - Track changes and manage multiple versions of documents
- **Theme Customization** - Personalize colors, typography, and layout
- **Export Options** - Download in PDF, DOCX, and other formats

### 📊 Profile Management

- **Comprehensive Profile** - Manage skills, experience, education, and certifications
- **Project Portfolio** - Showcase your work and accomplishments
- **Dynamic Updates** - Changes automatically reflected in generated documents

### 📅 Interview Hub

- **Schedule Management** - Track upcoming interviews with conflict detection
- **Google Calendar Integration** - Export interviews to your calendar
- **Prep Tasks** - Auto-generated preparation checklists based on interview type
- **Outcome Tracking** - Record feedback and results

## Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience
- **Material-UI (MUI)** - Enterprise-grade component library and theming
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing and navigation
- **@dnd-kit** - Drag-and-drop for Kanban board
- **Supabase Client** - Real-time database and authentication

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe server code
- **OpenAI SDK** - GPT-4 integration for AI features
- **Cheerio** - Web scraping for company research
- **Winston** - Logging and monitoring

### Database & Authentication

- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database with JSONB support
- **Row Level Security (RLS)** - User data isolation
- **JWT Authentication** - Secure token-based auth

### Development Tools

- **TypeScript** - Throughout the stack
- **ESLint** - Code quality and consistency
- **Vitest** - Unit and integration testing
- **Node scripts** - Development automation scripts (cross-platform)

## Quick Start

**Easiest way to run both frontend and server:**

```bash
node ./dev.mjs
```

This script automatically:

- Starts the frontend dev server (http://localhost:5173)
- Starts the backend server (http://localhost:8787)
- Runs both in parallel with proper logging

Works on Windows/macOS/Linux as long as Node + npm are installed.

**Run all tests (server + frontend):**

```bash
node ./test.mjs
```

**URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8787
- Database: Supabase (cloud-hosted)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AlexeyMish7/Scrum-and-Get-it.git
cd Scrum-and-Get-it
```

2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Set up environment variables:

This repo supports **separate environment configs** for development, staging, and production.

**Frontend (Vite)**

- Templates:
  - `frontend/.env.example`
  - `frontend/.env.development.example`
  - `frontend/.env.staging.example`
  - `frontend/.env.production.example`
- Recommended local setup (development): copy a template to a local-only file:

```bash
cd frontend
cp .env.development.example .env.development.local
```

PowerShell:

```powershell
Set-Location frontend
Copy-Item .env.development.example .env.development.local
```

**Backend (Node)**

- Templates:
  - `server/.env.example`
  - `server/.env.development.example`
  - `server/.env.staging.example`
  - `server/.env.production.example`
- Recommended local setup (development):

```bash
cd server
cp .env.development.example .env.development.local
```

PowerShell:

```powershell
Set-Location server
Copy-Item .env.development.example .env.development.local
```

Notes:

- The server uses `AI_API_KEY` (and also supports `OPENAI_API_KEY` as a fallback).
- Never commit real secrets. For deployments, use the hosting platform’s environment variable UI.

4. Run database migrations:

- Navigate to your Supabase project SQL editor
- Execute migration files from `db/migrations/` in chronological order
- Or use the provided helper SQL: `db/migrations/apply_migration.sql`
- UC-130 (recommended): generate a single migration bundle, then paste it into the SQL editor:

```powershell
./scripts/db-build-migration-bundle.ps1 -OutputFile ./db/out/prod_migrations_bundle.sql
```

If you are reusing an existing Supabase project (school-project friendly), verify the schema + required seed data instead of re-running the full migration bundle:

```powershell
# Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from server/.env
# and verifies the current PRD-aligned schema (teams + documents + generation + analytics + templates/themes)
./scripts/db-verify-supabase.ps1 -EnvFilePath ./server/.env
```

If the verification script reports missing system defaults, re-run these seed migrations in the Supabase SQL editor:

- `db/migrations/2025-11-18_seed_default_templates.sql`
- `db/migrations/2025-11-19_seed_default_themes.sql`
- `db/migrations/2025-11-20_seed_cover_letter_templates.sql`

5. Start development servers:

**Option 1: Easy way (Recommended)**

```powershell
.\dev.ps1
```

**Option 2: Manual**

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

To run with environment-specific configs locally:

```bash
# Frontend
cd frontend
npm run dev:staging

# Backend
cd server
npm run dev:staging
```

## Documentation

## Testing

Run all tests from the repo root using the PowerShell helper:

```powershell
.\scripts\run-tests.ps1
```

Suite-specific runs:

```powershell
# Frontend only (jsdom)
.\scripts\run-tests.ps1 -Suite frontend

# Server only (node)
.\scripts\run-tests.ps1 -Suite server
```

## Deployment (UC-129)

This repo is set up for a simple free-tier deployment:

- Frontend: Vercel
- Backend: Render
- Database/Auth: Supabase (Option B: reuse the existing Supabase project)

### Backend (Render)

- Root directory: `server/`
- Build command: `npm install && npm run build`
- Start command: `node dist/src/index.js`
- Required env vars (Render → Environment):
  - `NODE_ENV=production`
  - `APP_ENV=production` (optional, but keeps mode naming consistent)
  - `SUPABASE_URL=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `AI_API_KEY=...` (or `OPENAI_API_KEY=...`)
  - `CORS_ORIGIN=https://<your-vercel-domain>`
  - `ALLOW_DEV_AUTH=false`
  - `FAKE_AI=false`
  - `FEATURE_AI_ROUTES=true`

### Frontend (Vercel)

- Root directory: `frontend/`
- Build command: `npm run build`
- Output directory: `dist`
- Required env vars (Vercel → Project Settings → Environment Variables):
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_API_BASE_URL=https://<your-render-backend-domain>`
  - `VITE_DEV_MODE=false`

### Smoke check

- Backend: `GET https://<backend>/api/health` returns 200
- Frontend loads, login/signup works, and at least one server-backed feature works (AI or analytics)

Alternatively, run directly in the tests workspace:

```powershell
Push-Location .\tests
$env:NODE_ENV = "test"
npm run test:all
Pop-Location
```

Notes:

- The script sets `NODE_ENV=test` for stable test output.
- All test files live under `tests/` with separate configs for frontend and server.

Comprehensive documentation is available in the `docs/` folder:

- **[Architecture Overview](docs/ARCHITECTURE.md)** - How the entire system works together
- **[Git Collaboration Guide](docs/GIT_COLLABORATION.md)** - Branching strategy and workflow
- **Frontend Documentation:**
  - [Structure & Architecture](docs/frontend/1-structure.md)
  - [Files Reference](docs/frontend/2-files-reference.md)
  - [Overview (Non-Technical)](docs/frontend/3-overview.md)
- **Server Documentation:**
  - [Structure & Endpoints](docs/server/1-structure.md)
  - [Files Reference](docs/server/2-files-reference.md)
  - [Overview (Non-Technical)](docs/server/3-overview.md)
- **Database:**
  - [Complete Schema Reference](docs/database/database-schema.md)

## Architecture

FlowATS follows a modern three-tier architecture:

- **Frontend (React)** - User interface and client-side logic
- **Server (Node.js)** - AI orchestration, business logic, external API integration
- **Database (PostgreSQL)** - Data persistence with Supabase

**Key Architectural Patterns:**

- **Workspace-based modularity** - Features organized in isolated workspaces
- **Service layer abstraction** - CRUD operations centralized
- **Event-driven updates** - Components communicate via custom events
- **Caching strategy** - AI results cached for performance
- **Type safety** - TypeScript throughout the entire stack

See [Architecture Documentation](docs/ARCHITECTURE.md) for detailed system design.

## Project Structure

```
Scrum-and-Get-it/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── shared/    # Shared components, services, and utilities
│   │   │   └── workspaces/# Feature-based workspaces
│   │   │       ├── ai/           # AI generation features
│   │   │       ├── job_pipeline/ # Job tracking and management
│   │   │       ├── profile/      # User profile management
│   │   │       └── interview_hub/# Interview scheduling
│   │   └── ...
├── server/                # Node.js backend
│   ├── src/              # Server source code
│   └── prompts/          # AI prompt templates
├── db/                   # Database migrations and schemas
└── docs/                 # Project documentation
```

## Team

**FlowATS** is developed by the **Scrum and Get It** team as a senior capstone project:

- Agile/Scrum methodology with regular sprints
- Code reviews and pair programming
- Continuous integration and testing
- User-centered iterative development

## Development Workflow

Our team follows a structured Git workflow:

- **Feature branches** - One branch per feature, branched from `main`
- **Rebase strategy** - Rebase on main before pushing to resolve conflicts locally
- **No branch reuse** - Branches deleted after merge
- **Pull requests** - All code reviewed before merging to `main`
- **Testing** - Features tested before and after rebasing

See [Git Collaboration Guide](docs/GIT_COLLABORATION.md) for complete workflow details.

## License

This project is developed as part of an academic capstone project.

## Contact

For questions or feedback about FlowATS, please reach out to the Scrum and Get It development team.

---

_Built with ❤️ by Scrum and Get It using React, TypeScript, and AI_
