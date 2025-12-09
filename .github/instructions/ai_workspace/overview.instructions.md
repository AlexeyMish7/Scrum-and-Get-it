# AI Workspace Overview

> AI-powered document generation for resumes and cover letters.

---

## Workspace Path

```
frontend/src/app/workspaces/ai_workspace/
```

---

## Use Cases

| UC ID  | Feature                 | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| UC-201 | Resume Generation       | AI-powered resume creation with templates |
| UC-202 | Cover Letter Generation | AI-powered cover letter creation          |
| UC-203 | Document Editing        | Rich editor with version control          |
| UC-110 | Document Reviews        | Collaborative review with comments        |

---

## Directory Structure

```
ai_workspace/
├── components/
│   ├── common/          # Shared dialog components
│   ├── editor/          # Document editor components
│   ├── hub/             # Hub page components
│   ├── reviews/         # Review components
│   ├── templates/       # Template gallery
│   ├── themes/          # Theme picker
│   ├── version/         # Version control UI
│   ├── versions/        # Version history
│   └── wizard/          # Generation wizard steps
├── context/             # React contexts
├── hooks/               # Custom hooks
├── layouts/             # Layout wrappers
├── navigation/          # Navigation components
├── pages/               # Route-level pages
├── services/            # Service layer
└── types/               # TypeScript definitions
```

---

## Key Concepts

### Document Types

```typescript
type DocumentType = "resume" | "cover-letter";
type DocumentStatus = "draft" | "final" | "archived";
```

### Templates

Structure and layout definitions (chronological, functional, etc.)

### Themes

Visual styling (colors, fonts, spacing)

### Versions

Document history with branching and comparison

---

## Database Tables

| Table                 | Purpose                |
| --------------------- | ---------------------- |
| `resume_drafts`       | Resume document drafts |
| `cover_letter_drafts` | Cover letter drafts    |
| `document_versions`   | Version history        |
| `templates`           | Template definitions   |
| `themes`              | Theme definitions      |
| `document_reviews`    | Review requests        |
| `review_comments`     | Review comments        |
| `generation_sessions` | AI generation tracking |

---

## Routes

| Route                  | Page                | Description             |
| ---------------------- | ------------------- | ----------------------- |
| `/ai`                  | AIWorkspaceHub      | Main AI workspace hub   |
| `/ai/resume/new`       | GenerateResume      | New resume wizard       |
| `/ai/cover-letter/new` | GenerateCoverLetter | New cover letter wizard |
| `/ai/documents`        | DocumentLibrary     | Saved documents         |
| `/ai/editor/:id`       | DocumentEditorPage  | Edit document           |
| `/ai/templates`        | TemplateManager     | Manage templates        |
| `/ai/reviews`          | Reviews             | Document reviews        |
| `/ai/research`         | CompanyResearch     | Company research        |

---

## Generation Flow

1. **Job Context** - Select job or enter details
2. **Template Selection** - Choose document structure
3. **Theme Selection** - Choose visual styling
4. **Generation Options** - ATS optimization, tone, etc.
5. **Preview** - Review and edit generated content
6. **Save** - Save to library

---

## Import Pattern

```typescript
// Import services
import {
  aiGenerationService,
  templateService,
  themeService,
  versionService,
  reviewService,
  exportService,
} from "@ai_workspace/services";

// Import types
import type {
  Document,
  Template,
  Theme,
  GenerationOptions,
} from "@ai_workspace/types";

// Import components
import { DocumentEditor, GenerationWizard } from "@ai_workspace/components";
```
