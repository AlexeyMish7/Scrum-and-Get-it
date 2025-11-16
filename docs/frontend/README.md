# Frontend Documentation

This folder mirrors the structure of `frontend/src/app/` to organize documentation for the React + TypeScript frontend.

## Structure

```
frontend/
├── shared/                  # Shared/common code across all workspaces
│   ├── assets/             # Images, logos, static files
│   ├── components/         # Reusable UI components
│   │   ├── common/        # General-purpose components
│   │   ├── dialogs/       # Dialog system
│   │   ├── feedback/      # Loading, errors, empty states
│   │   ├── navigation/    # Breadcrumbs, navigation
│   │   └── sidebars/      # Workspace sidebars
│   ├── constants/         # App-wide constants
│   ├── context/           # React Context providers (Auth, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components (AppShell, SystemLayer)
│   ├── services/          # API clients, CRUD helpers, Supabase
│   ├── theme/             # MUI theme configuration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
└── workspaces/            # Feature-specific workspaces
    ├── profile/           # Profile workspace (user data)
    │   ├── components/   # Profile-specific components
    │   ├── pages/        # Profile pages
    │   ├── services/     # Profile data services
    │   └── types/        # Profile type definitions
    ├── ai/               # AI workspace (resume/cover letter generation)
    │   ├── components/   # AI-specific components
    │   ├── config/       # Templates, configurations
    │   ├── hooks/        # AI feature hooks
    │   ├── pages/        # AI pages
    │   ├── services/     # AI API services
    │   ├── types/        # AI type definitions
    │   └── utils/        # AI utilities (export, validation)
    └── jobs/             # Jobs workspace (pipeline, analytics)
        ├── components/   # Jobs-specific components
        ├── hooks/        # Jobs feature hooks
        ├── pages/        # Jobs pages
        ├── services/     # Jobs data services
        └── types/        # Jobs type definitions
```

## Documentation Guidelines

### File Naming Convention

- Match the source file name: `ComponentName.md` for `ComponentName.tsx`
- Use `README.md` for folder/module overviews
- Use descriptive names for guides: `how-to-add-new-workspace.md`

### Content Structure

Each `.md` file should include:

1. **Purpose**: What the component/module does
2. **Key Features**: Main capabilities
3. **API/Props**: Interface documentation
4. **Usage Examples**: Code snippets
5. **Dependencies**: What it relies on
6. **Testing**: How to test it
7. **Notes**: Edge cases, gotchas, future improvements

## Quick Links

### Core Documentation

- [Shared Components Guide](../shared-components.md)
- [Theming Guide](../THEMING_GUIDE.md)
- [Project Structure](../project-structure.md)

### Workspace Documentation

- **Profile**: User profile, education, skills, employment, projects
- **AI**: Resume generation, cover letters, job matching, company research
- **Jobs**: Pipeline management, analytics, automations, saved searches

## Contributing

When adding new features:

1. Create corresponding `.md` files in this structure
2. Document all public APIs and components
3. Include usage examples
4. Update this README if adding new major sections
