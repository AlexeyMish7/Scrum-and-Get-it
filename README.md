# 🧠 flow ATS

_CS 490 Capstone Project – Fall 2025_

> **Empowering job seekers with the same tools employers use.**
> flow ATS provides job applicants with intelligent application tracking, AI-powered content generation, and organized career management—all in one place.

---

## 📚 **Documentation**

> **🎯 [Complete Documentation Hub →](docs/README.md)**

---

## Current status (mid Sprint 2 — Migration & AI scaffolding)

We completed Sprint 1 foundations (auth, DB schema, profile flows) and are actively working through Sprint 2 work: job management and AI-powered content.

Recent progress (high level):

- Frontend reorganization: `frontend/src` was restructured into `app/shared` and `app/workspaces/*` (profile + ai). Many imports were updated and a small codemod tool was added at `frontend/tools/convert-imports.cjs` to help migrate remaining imports to aliases.
- Path aliases: `frontend/tsconfig.app.json` and `frontend/vite.config.ts` now expose helpful aliases (for example `@shared/*`, `@profile/*`, `@assets/*`) to make the codebase resilient to future moves.
- AI workspace scaffold: `frontend/src/app/workspaces/ai/` now exists with a README and folders for components, pages, services, hooks, types, utils, tests and docs.
- Type safety & linting: `npm run typecheck` and `npm run lint` have been run after the migration and the core repo is free of blocking TypeScript and lint errors (local verification).

Next priorities for Sprint 2:

- Implement the job management UI and CRUD flows (jobs, pipeline stages, deadlines).
- Add the first AI features behind a feature flag: GenerateResume preview (client + serverless stub), prompt templates, and token accounting.
- Harden CI: add unit tests for prompt templates and a lightweight integration test that uses an Edge Function stub for model calls.

Sprint 2 target: Job Management & AI Content (demo target: Nov 11)

---

## 👥 Team Members

- **Alexey Mishin**
- **Aliya Laliwala**
- **Jane Kalla**
- **Nafisa Ahmed**
- **Nihaal Warraich**

---

## 🧩 Tech Stack

### **Frontend**

- **React + TypeScript (via Vite)** – Modern component-based development
- **Styling Framework (TBD)** – Options include Material UI, Chakra, or Tailwind CSS

### **Backend / Infrastructure**

- **Supabase (PostgreSQL + Auth + Storage)** – Backend-as-a-Service
- **Supabase Auth** – Secure login with email/password and Google OAuth
- **Supabase Storage** – Resume and document management
- **Row-Level Security (RLS)** – Protects user-specific data access

### **DevOps & Testing**

- **GitHub Actions** – CI/CD pipeline for build and deployment
- **Jest / Cypress (TBD)** – Unit and end-to-end testing
- **ESLint + Prettier** – Code linting and formatting standards

---

## 🧱 Project structure (focused view)

This repo contains several parts; during the migration we reorganized the frontend into a small app surface located under `frontend/src/app`. The structure below shows the current, recommended layout to focus on when developing features.

```
frontend/src/app/
├── shared/                      # shared components, services, hooks, context, theme
│   ├── components/              # reusable UI components (common, forms, layout)
│   ├── context/                 # AuthContext, ThemeProvider, Error handling
│   ├── services/                # supabase client wrapper, crud, dbMappers
│   └── theme/                   # design tokens and theme provider
├── workspaces/                  # feature workspaces (isolated feature areas)
│   ├── profile/                 # profile workspace: pages, components, services, types
│   └── ai/                      # ai workspace: pages, services, prompts, hooks, types
├── types/                       # centralized types shared across workspaces
├── utils/                       # shared utilities (formatters, validators)
└── main.tsx / router.tsx        # app entry + top-level routing
```

---

## ⚙️ Setting Up the Project Locally

To get the frontend running on your machine, follow the step-by-step setup guide in
👉 **[Setup Guide](docs/getting-started/setup.md)**

That file includes:

- Installing **nvm** (Node Version Manager)
- Cloning the repo
- Installing **Node.js v20.19.5** and matching **npm**
- Running the frontend with **Vite**

---

## 🌿 Git Workflow

We use a **trunk-based branching model** for version control.
Before creating or merging branches, review the full guide in
👉 **[Branching Workflow](docs/development/workflow/branching.md)**

Example branch names:

```
feat/auth-login
fix/profile-upload
docs/update-readme
```

---

## 🗖️ Sprint Milestones

| Sprint   | Focus Area                  | Demo Date |
| -------- | --------------------------- | --------- |
| Sprint 1 | Authentication & Core Setup | Oct 28    |
| Sprint 2 | Job Management & AI Content | Nov 11    |
| Sprint 3 | Interview Tools & Analytics | Dec 2     |
| Sprint 4 | Final Deployment            | Dec 16    |

---

## 🧠 Additional Resources

- 🧩 **Project Kickoff Slides:** Overview of concept, goals, and sprints
- 💛 **PRD:** Functional requirements for Sprint 1
- 🌱 **Branching Guide:** For consistent GitHub workflow
- 🧪 **Setup Guide:** For local environment installation

---

**Last Updated:** October 2025
**Maintainers:** Jane Kalla, Alexey Mishin, Aliya Laliwala, Nafisa Ahmed, Nihaal Warraich
