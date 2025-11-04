# Full frontend/src migration schema (complete file list)

This file contains a single, authoritative tree of the current `frontend/src/` layout for you to use when migrating into the new workspace layout. It lists every folder and file (as present in the repo at the time of writing). Use this as the canonical checklist to perform `git mv` or IDE refactors.

Only structural info is included below (no batch instructions). If you want `git mv` commands or a PowerShell script after reviewing this tree, tell me and I'll generate it.

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
├── lib/
│   └── supabaseClient.ts
├── context/
│   └── AuthContext.tsx
├── hooks/
│   └── useErrorHandler.ts
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.tsx
│   │   ├── ErrorSnackbar.tsx
│   │   ├── Icon.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProfilePicture.tsx
│   │   └── ProtectedRoute.tsx
│   ├── navigation/
│   │   ├── BreadcrumbsBar.tsx
│   │   ├── MainLayout.tsx
│   │   └── Navbar.tsx
│   └── profile/
│       ├── CareerTimeline.tsx
│       ├── ExportProfileButton.tsx
│       ├── ProfileCompletion.tsx
│       ├── ProfileStrengthTips.tsx
│       ├── RecentActivityTimeline.tsx
│       ├── SkillsDistributionChart.tsx
│       └── SummaryCards.tsx
├── pages/
│   ├── auth/
│   │   ├── AuthCallback.tsx
│   │   ├── ForgetPassword.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ResetPassword.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── profile/
│   │   ├── DeleteAccount.tsx
│   │   ├── ProfileDetails.css
│   │   ├── ProfileDetails.tsx
│   │   └── Settings.tsx
│   ├── education/
│   │   ├── AddEducation.css
│   │   ├── AddEducation.tsx
│   │   ├── EducationOverview.css
│   │   └── EducationOverview.tsx
│   ├── employment/
│   │   ├── AddEmployment.tsx
│   │   ├── EditEmploymentModal.tsx
│   │   ├── EmploymentForm.tsx
│   │   ├── EmploymentHistoryList.tsx
│   │   └── employment.css
│   ├── projects/
│   │   ├── AddProjectForm.tsx
│   │   ├── ProjectDetails.tsx
│   │   ├── ProjectPortfolio.tsx
│   │   └── Projects.css
│   ├── skills/
│   │   ├── AddSkills.css
│   │   ├── AddSkills.tsx
│   │   ├── SkillsOverview.css
│   │   └── SkillsOverview.tsx
│   └── certifications/
│       ├── Certifications.css
│       └── Certifications.tsx
├── services/
│   ├── certifications.ts
│   ├── crud.ts
│   ├── dbMappers.ts
│   ├── education.ts
│   ├── employment.ts
│   ├── profileService.ts
│   ├── projects.ts
│   ├── skills.ts
│   └── types.ts
├── theme/
│   ├── DesignSystemShowcase.tsx
│   └── theme.tsx
├── types/
│   ├── certification.ts
│   ├── document.ts
│   ├── education.ts
│   ├── employment.ts
│   ├── hello-pangea.d.ts
│   ├── profile.ts
│   ├── project.ts
│   └── skill.ts
└── utils/
    ├── date.ts
    └── dateUtils.ts
```

If you want me to generate a PowerShell-safe list of `mkdir` + `git mv` commands for the exact moves from this tree into a `shared/` + `workspaces/profile/` + `workspaces/ai/` layout, tell me and I'll output them next.

End of schema.
