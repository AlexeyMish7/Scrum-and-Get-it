# Full frontend/src migration schema (shared + workspaces)

You asked for the schema to show `shared/` first and then `workspaces/` (profile and ai). Below is the canonical layout for the migrated codebase: core shared pieces live under `src/shared/` and workspace implementations under `src/workspaces/profile/` and `src/workspaces/ai/`.

This file is a structural checklist only — no batch instructions. Use it when running `git mv` or doing editor refactors. If you want `git mv` commands or a PowerShell script after reviewing this tree, tell me and I'll generate them.

```
src/
├── App.css
├── App.tsx
├── main.tsx
├── index.css
├── router.tsx
├── vite-env.d.ts
├── assets/
│   └── logo/
│       ├── graphics_only.png
│       └── logo-flow-ats.png
├── constants/
│   └── skills.ts
├── shared/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   ├── crud.ts
│   │   ├── dbMappers.ts
│   │   └── types.ts
│   ├── hooks/
│   │   └── useErrorHandler.ts
│   ├── components/
│   │   └── common/
│   │       ├── ConfirmDialog.tsx
│   │       ├── ErrorSnackbar.tsx
│   │       ├── Icon.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ProfilePicture.tsx
│   │       └── ProtectedRoute.tsx
│   └── utils/
│       ├── date.ts
│       └── dateUtils.ts
└── workspaces/
    ├── profile/
    │   ├── components/
    │   │   ├── navigation/
    │   │   │   ├── BreadcrumbsBar.tsx
    │   │   │   ├── MainLayout.tsx
    │   │   │   └── Navbar.tsx
    │   │   └── profile/
    │   │       ├── CareerTimeline.tsx
    │   │       ├── ExportProfileButton.tsx
    │   │       ├── ProfileCompletion.tsx
    │   │       ├── ProfileStrengthTips.tsx
    │   │       ├── RecentActivityTimeline.tsx
    │   │       ├── SkillsDistributionChart.tsx
    │   │       └── SummaryCards.tsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── AuthCallback.tsx
    │   │   │   ├── ForgetPassword.tsx
    │   │   │   ├── Login.tsx
    │   │   │   ├── Register.tsx
    │   │   │   └── ResetPassword.tsx
    │   │   ├── dashboard/
    │   │   │   └── Dashboard.tsx
    │   │   ├── profile/
    │   │   │   ├── DeleteAccount.tsx
    │   │   │   ├── ProfileDetails.css
    │   │   │   ├── ProfileDetails.tsx
    │   │   │   └── Settings.tsx
    │   │   ├── education/
    │   │   │   ├── AddEducation.css
    │   │   │   ├── AddEducation.tsx
    │   │   │   ├── EducationOverview.css
    │   │   │   └── EducationOverview.tsx
    │   │   ├── employment/
    │   │   │   ├── AddEmployment.tsx
    │   │   │   ├── EditEmploymentModal.tsx
    │   │   │   ├── EmploymentForm.tsx
    │   │   │   ├── EmploymentHistoryList.tsx
    │   │   │   └── employment.css
    │   │   ├── projects/
    │   │   │   ├── AddProjectForm.tsx
    │   │   │   ├── ProjectDetails.tsx
    │   │   │   ├── ProjectPortfolio.tsx
    │   │   │   └── Projects.css
    │   │   ├── skills/
    │   │   │   ├── AddSkills.css
    │   │   │   ├── AddSkills.tsx
    │   │   │   ├── SkillsOverview.css
    │   │   │   └── SkillsOverview.tsx
    │   │   └── certifications/
    │   │       ├── Certifications.css
    │   │       └── Certifications.tsx
    │   ├── services/
    │   │   ├── profileService.ts
    │   │   ├── education.ts
    │   │   ├── employment.ts
    │   │   ├── projects.ts
    │   │   ├── skills.ts
    │   │   └── certifications.ts
    │   ├── theme/
    │   │   ├── DesignSystemShowcase.tsx
    │   │   └── theme.tsx
    │   └── types/
    │       ├── profile.ts
    │       ├── education.ts
    │       ├── employment.ts
    │       ├── skill.ts
    │       ├── project.ts
    │       ├── document.ts
    │       └── certification.ts
    └── ai/
        ├── components/
        │   ├── ai/                  # AISidebar, AIHeader, AILayout (placeholders)
        │   ├── jobs/                # JobCard, JobPipeline, JobForm (placeholders)
        │   ├── resume/              # ResumeBuilder, ResumePreview (placeholders)
        │   └── analytics/
        ├── pages/                  # AIWorkspace.tsx, JobTracker.tsx, ResumeGenerator.tsx (placeholders)
        ├── services/               # aiService.ts, jobService.ts, resumeService.ts (placeholders)
        ├── types/                  # job.ts, ai.ts, resume.ts (placeholders)
        └── theme/                  # aiTheme.tsx (placeholder)
```

Notes

- `shared/` holds singleton infrastructure (AuthContext, supabase client, centralized CRUD, shared hooks and tiny common components).
- `workspaces/profile/` contains all UI, domain services and types for the profile area (Sprint 1).
- `workspaces/ai/` is a skeleton for Sprint 2 — create placeholder files as you implement AI features.

If you'd like, I can now generate a PowerShell-safe `git mv` script to move the actual files from their current flat locations into this layout, or I can produce a ts-morph codemod to rewrite imports after you run moves. Tell me which you prefer.

End of schema.
