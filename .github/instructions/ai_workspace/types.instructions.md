# AI Workspace Types

> TypeScript type definitions for AI document generation.

---

## Type Files

| File                  | Purpose                    |
| --------------------- | -------------------------- |
| `document.types.ts`   | Document and content types |
| `template.types.ts`   | Template and layout types  |
| `generation.types.ts` | AI generation types        |
| `version.types.ts`    | Version control types      |
| `navigation.types.ts` | Navigation types           |

---

## Document Types (`document.types.ts`)

### DocumentType

```typescript
type DocumentType = "resume" | "cover-letter";
type DocumentStatus = "draft" | "final" | "archived";
```

### Document

```typescript
interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  status: DocumentStatus;
  config: DocumentConfiguration;
  content: ResumeContent | CoverLetterContent;
  currentVersionId: string;
  context: DocumentContext;
  metadata: DocumentMetadata;
  stats: DocumentStats;
  createdAt: string;
  lastEditedAt: string;
  lastGeneratedAt?: string;
  isDefault: boolean;
  isPinned: boolean;
  isArchived: boolean;
}
```

### DocumentConfiguration

```typescript
interface DocumentConfiguration {
  name: string;
  description?: string;
  templateId: string;
  themeId: string;
  customOverrides?: {
    templateOverrides?: Record<string, unknown>;
    themeOverrides?: Record<string, unknown>;
  };
}
```

### DocumentContext

```typescript
interface DocumentContext {
  jobId?: number;
  targetRole?: string;
  targetCompany?: string;
  targetIndustry?: string;
  notes?: string;
}
```

### ResumeContent

```typescript
interface ResumeContent {
  header: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    links: Array<{ type: string; url: string; label: string }>;
    photoUrl?: string;
  };
  summary?: {
    enabled: boolean;
    text: string;
    highlights: string[];
  };
  experience: {
    enabled: boolean;
    items: ExperienceItem[];
  };
  education: {
    enabled: boolean;
    items: EducationItem[];
  };
  skills: {
    enabled: boolean;
    categories: SkillCategory[];
  };
  projects?: {
    enabled: boolean;
    items: ProjectItem[];
  };
  certifications?: {
    enabled: boolean;
    items: CertificationItem[];
  };
}
```

---

## Template Types (`template.types.ts`)

### Template

```typescript
interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  subtype: TemplateSubtype;
  layout: TemplateLayout;
  schema: TemplateSchema;
  features: TemplateFeatures;
  metadata: TemplateMetadata;
  version: number;
  author: "system" | "user";
  isDefault: boolean;
}
```

### TemplateLayout

```typescript
interface TemplateLayout {
  columns: 1 | 2;
  pageSize: "letter" | "a4";
  margins: { top; right; bottom; left };
  sectionOrder: SectionConfig[];
  headerFooter?: {
    showHeader: boolean;
    showFooter: boolean;
    headerContent?: string;
    footerContent?: string;
  };
}
```

### SectionType

```typescript
type SectionType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "publications"
  | "awards"
  | "languages"
  | "interests"
  | "references"
  | "custom";
```

### Theme

```typescript
interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  colors: ColorPalette;
  typography: Typography;
  spacing: SpacingConfig;
  borders: BorderConfig;
  author: "system" | "user";
  isDefault: boolean;
}
```

---

## Generation Types (`generation.types.ts`)

### GenerationRequest

```typescript
interface GenerationRequest {
  type: GenerationDocumentType;
  jobId?: number;
  templateId: string;
  themeId: string;
  options: GenerationOptions;
  sections: SectionConfiguration;
}
```

### GenerationOptions

```typescript
interface GenerationOptions {
  atsOptimized: boolean;
  keywordMatch: boolean;
  skillsHighlight: boolean;
  includePortfolio: boolean;
  tone: GenerationTone;
  length: GenerationLength;
}

type GenerationTone =
  | "professional"
  | "confident"
  | "enthusiastic"
  | "analytical";

type GenerationLength = "concise" | "standard" | "detailed";
```

### GenerationResult

```typescript
interface GenerationResult {
  documentId: string;
  versionId: string;
  content: unknown;
  metadata: GenerationMetadata;
  preview: GenerationPreview;
}

interface GenerationMetadata {
  generatedAt: string;
  processingTime: number;
  tokensUsed: number;
  atsScore?: number;
  keywordMatch?: number;
  model?: string;
  issues?: GenerationIssue[];
}
```

---

## Version Types (`version.types.ts`)

### DocumentVersion

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: unknown;
  templateId: string;
  themeId: string;
  jobId?: number;
  metadata: VersionMetadata;
  changeType: ChangeType;
  changeDescription?: string;
  createdAt: string;
  createdBy: string;
  parentVersionId?: string;
  branchName?: string;
}
```

### ChangeType

```typescript
type ChangeType =
  | "ai-generation"
  | "manual-edit"
  | "ai-optimization"
  | "template-change"
  | "theme-change"
  | "merge"
  | "restore";
```

### VersionComparison

```typescript
interface VersionComparison {
  baseVersion: DocumentVersion;
  compareVersion: DocumentVersion;
  diff: ComparisonDiff;
  summary: ComparisonSummary;
}
```
