# 🧠 ATS for Candidates

_CS 490 Capstone Project – Fall 2025_

> **Empowering job seekers with the same tools employers use.**
> The ATS for Candidates platform provides job applicants with intelligent application tracking, AI-powered content generation, and organized career management—all in one place.

---

## 📚 **Documentation**

> **🎯 [Complete Documentation Hub →](docs/README.md)**

### **Quick Links**

- 🚀 **[Setup Guide](docs/getting-started/setup.md)** - Get started developing
- 🏗️ **[Architecture](docs/getting-started/architecture-overview.md)** - System design overview
- 📝 **[Component Docs](docs/features/education/add-education-component.md)** - Example implementation
- 🤖 **[AI Assistant Guide](docs/development/tools/copilot-instructions.md)** - Copilot context

### **For Developers**

- [Development Standards](docs/development/standards/documentation-standards.md)
- [Branching Workflow](docs/development/workflow/branching.md)
- [Error Handling System](docs/api/services/error-handling.md)

### **For Project Management**

- [Sprint 1 Requirements](docs/project-management/sprints/sprint1-prd.md)
- [Current Tasks](docs/project-management/tasks/todo.md)

---

## Current Sprint – Sprint 1 (Fundamentals & Authentication)

**Sprint Objective**
Establish the foundational infrastructure for the ATS for Candidates platform by implementing:

- Core authentication (Email/Password + Google OAuth)
- Database architecture (PostgreSQL via Supabase)
- Brand identity and design system foundation
- Basic user profiles and document upload

**Sprint Duration:** October 14 – October 28
**Sprint 1 Demo:** October 28
**Instructor:** Prof. Bill McCann

---

## 👥 Team Members

- **Jane Kalla** (Product Manager)
- **Alexey Mishin**
- **Aliya Laliwala**
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

## 🧱 Project Structure

```
Scrum-and-Get-it/
├── frontend/                    # React + Vite frontend
├── docs/                        # Organized documentation
│   ├── getting-started/         # Setup, architecture
│   ├── development/             # Standards, workflow
│   ├── features/                # Component documentation
│   ├── api/                     # Service documentation
│   ├── design/                  # Colors, themes
│   └── project-management/      # Sprints, tasks
├── db/                          # Database migrations
└── README.md                    # Project overview
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
