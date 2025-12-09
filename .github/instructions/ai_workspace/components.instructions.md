# AI Workspace Components

> React component reference for AI document generation.

---

## Directory Structure

```
components/
├── common/          # Shared utility components
├── editor/          # Document editor
├── hub/             # Hub page components
├── reviews/         # Review UI components
├── templates/       # Template selection
├── themes/          # Theme selection
├── version/         # Version control
├── versions/        # Version history
└── wizard/          # Generation wizard
```

---

## Editor Components (`editor/`)

| Component         | Purpose                          |
| ----------------- | -------------------------------- |
| `DocumentEditor`  | Rich text editor for documents   |
| `DocumentPreview` | Live preview with template/theme |
| `ExportDialog`    | Export format selection dialog   |

### DocumentEditor Props

```typescript
interface DocumentEditorProps {
  document: Document;
  template: Template;
  theme: Theme;
  onChange: (content: ResumeContent | CoverLetterContent) => void;
  onSave: () => void;
  readOnly?: boolean;
}
```

---

## Wizard Components (`wizard/`)

| Component               | Purpose               |
| ----------------------- | --------------------- |
| `GenerationWizard`      | Main wizard container |
| `WizardStepper`         | Step navigation       |
| `JobContextStep`        | Job selection/input   |
| `TemplateSelectionStep` | Template picker       |
| `ThemeSelectionStep`    | Theme picker          |
| `GenerationOptionsStep` | AI options            |
| `GenerationPreviewStep` | Preview and edit      |

### Wizard Flow

1. **JobContextStep** - Select job or enter details
2. **TemplateSelectionStep** - Choose template
3. **ThemeSelectionStep** - Choose theme
4. **GenerationOptionsStep** - Configure AI options
5. **GenerationPreviewStep** - Review and save

---

## Template Components (`templates/`)

| Component         | Purpose                     |
| ----------------- | --------------------------- |
| `TemplateGallery` | Grid of template cards      |
| `TemplateCard`    | Individual template preview |
| `TemplatePreview` | Full template preview       |

### TemplateCard Props

```typescript
interface TemplateCardProps {
  template: Template;
  selected?: boolean;
  onSelect: (template: Template) => void;
}
```

---

## Theme Components (`themes/`)

| Component      | Purpose                  |
| -------------- | ------------------------ |
| `ThemeGallery` | Grid of theme cards      |
| `ThemeCard`    | Individual theme preview |
| `ThemePreview` | Full theme preview       |

---

## Version Components (`version/`, `versions/`)

| Component        | Purpose            |
| ---------------- | ------------------ |
| `VersionHistory` | List of versions   |
| `VersionCard`    | Individual version |
| `VersionCompare` | Side-by-side diff  |
| `VersionRestore` | Restore dialog     |

---

## Review Components (`reviews/`)

| Component        | Purpose               |
| ---------------- | --------------------- |
| `ReviewList`     | List of reviews       |
| `ReviewCard`     | Individual review     |
| `ReviewComments` | Comment thread        |
| `ReviewRequest`  | Request review dialog |

---

## Common Components (`common/`)

| Component                 | Purpose                 |
| ------------------------- | ----------------------- |
| `ConfirmNavigationDialog` | Unsaved changes warning |

---

## Hub Components (`hub/`)

Components for the main AI workspace hub page.

---

## Page Components

| Page                   | Route                  | Purpose             |
| ---------------------- | ---------------------- | ------------------- |
| `AIWorkspaceHub/`      | `/ai`                  | Main hub page       |
| `GenerateResume/`      | `/ai/resume/new`       | Resume wizard       |
| `GenerateCoverLetter/` | `/ai/cover-letter/new` | Cover letter wizard |
| `DocumentLibrary/`     | `/ai/documents`        | Document library    |
| `DocumentEditorPage`   | `/ai/editor/:id`       | Edit document       |
| `TemplateManager/`     | `/ai/templates`        | Manage templates    |
| `Reviews/`             | `/ai/reviews`          | Document reviews    |
| `CompanyResearch/`     | `/ai/research`         | Company research    |

---

## Component Patterns

### Wizard Step Pattern

```tsx
interface WizardStepProps {
  data: WizardData;
  onNext: (partialData: Partial<WizardData>) => void;
  onBack: () => void;
}

function JobContextStep({ data, onNext, onBack }: WizardStepProps) {
  // Step content
}
```

### Selection Pattern

```tsx
interface SelectionProps<T> {
  items: T[];
  selected?: T;
  onSelect: (item: T) => void;
  loading?: boolean;
}
```

### Editor Pattern

```tsx
// Editor uses controlled components
const [content, setContent] = useState(initialContent);

<DocumentEditor
  document={document}
  template={template}
  theme={theme}
  onChange={setContent}
  onSave={handleSave}
/>;
```

---

## Hooks

| Hook                | Purpose                 |
| ------------------- | ----------------------- |
| `useJobPredictions` | Job success predictions |

---

## Import Pattern

```typescript
// Import from folders
import {
  DocumentEditor,
  DocumentPreview,
} from "@ai_workspace/components/editor";
import { GenerationWizard } from "@ai_workspace/components/wizard";
import { TemplateGallery } from "@ai_workspace/components/templates";

// Import pages
import { AIWorkspaceHub, GenerateResume } from "@ai_workspace/pages";
```
