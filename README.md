# FlowATS

> **Built by:** Scrum and Get It Team
> A comprehensive job search management platform that helps job seekers organize their applications, optimize their resumes, and track their progress through the interview process.

## Overview

FlowATS is a full-stack web application designed to streamline the job search process by providing intelligent tools for managing job applications, generating tailored resumes and cover letters, and analyzing job matches using AI-powered insights.

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
- **PowerShell** - Development automation scripts

## Quick Start

**Easiest way to run both frontend and server:**

```powershell
.\dev.ps1
```

This PowerShell script automatically:

- Starts the frontend dev server (http://localhost:5173)
- Starts the backend server (http://localhost:3001)
- Runs both in parallel with proper logging

**URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
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

```bash
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run database migrations:

- Navigate to your Supabase project SQL editor
- Execute migration files from `db/migrations/` in chronological order
- Or use the provided `db/apply_migration.sql` helper

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

## Documentation

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
