# AI Workspace Services

> Service layer for AI generation, templates, themes, and document management.

---

## Service Files

| File                        | Purpose                             |
| --------------------------- | ----------------------------------- |
| `aiGenerationService.ts`    | AI document generation              |
| `templateService.ts`        | Template management                 |
| `themeService.ts`           | Theme management                    |
| `versionService.ts`         | Version control (⚠️ in-memory only) |
| `reviewService.ts`          | Document reviews                    |
| `exportService.ts`          | Export to PDF/DOCX (⚠️ partial)     |
| `companyResearchService.ts` | Company research                    |

---

## AI Generation Service (`aiGenerationService.ts`)

Wraps AI backend for document generation.

### Key Functions

| Function                                           | Purpose               |
| -------------------------------------------------- | --------------------- |
| `generateResume(userId, jobContext, options)`      | Generate resume       |
| `generateCoverLetter(userId, jobContext, options)` | Generate cover letter |
| `transformAIResumeContent(userId, aiContent)`      | Transform AI output   |

### Job Context

```typescript
interface JobContext {
  jobId?: number;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  keyRequirements?: string[];
}
```

### Generation Flow

1. Call AI backend with job context
2. Receive generated content
3. Transform to document format
4. Save to database with template/theme
5. Create initial version
6. Link to job (if jobId provided)

---

## Template Service (`templateService.ts`)

Load and manage document templates.

### Key Functions

| Function                           | Purpose                       |
| ---------------------------------- | ----------------------------- |
| `getAllSystemTemplates()`          | Get all system templates      |
| `getTemplatesByCategory(category)` | Filter by resume/cover-letter |
| `getTemplateById(id)`              | Get specific template         |
| `getDefaultTemplate(category)`     | Get default for category      |
| `validateTemplate(template)`       | Validate structure            |
| `searchTemplates(query, options)`  | Search templates              |

### Template Categories

```typescript
type TemplateCategory = "resume" | "cover-letter";

type TemplateSubtype =
  | "chronological"
  | "functional"
  | "hybrid"
  | "creative"
  | "academic"
  | "executive"
  | "simple";
```

---

## Theme Service (`themeService.ts`)

Load and manage visual themes.

### Key Functions

| Function                        | Purpose               |
| ------------------------------- | --------------------- |
| `getAllSystemThemes()`          | Get all system themes |
| `getThemesByCategory(category)` | Filter by category    |
| `getThemeById(id)`              | Get specific theme    |
| `getDefaultTheme()`             | Get default theme     |
| `validateTheme(theme)`          | Validate structure    |

### Theme Categories

```typescript
type ThemeCategory =
  | "professional"
  | "creative"
  | "minimal"
  | "bold"
  | "classic";
```

---

## Version Service (`versionService.ts`)

⚠️ **Status: In-Memory Only** - Needs database integration.

### Key Functions

| Function                                  | Purpose              |
| ----------------------------------------- | -------------------- |
| `createVersion(params)`                   | Create new version   |
| `getVersionHistory(documentId)`           | Get version history  |
| `compareVersions(versionId1, versionId2)` | Compare two versions |
| `restoreVersion(versionId, options)`      | Restore old version  |

### Change Types

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

---

## Review Service (`reviewService.ts`)

Collaborative document review (UC-110).

### Key Functions

| Function                                       | Purpose                      |
| ---------------------------------------------- | ---------------------------- |
| `getDocumentReviews(userId, documentId)`       | Get reviews for document     |
| `createReview(userId, data)`                   | Create review request        |
| `getReviewsAsReviewer(userId)`                 | Get reviews assigned to user |
| `addComment(userId, reviewId, data)`           | Add review comment           |
| `updateReviewStatus(userId, reviewId, status)` | Update status                |
| `approveDocument(userId, reviewId, note)`      | Approve document             |

### Review Types

```typescript
type ReviewType = "feedback" | "approval" | "peer_review" | "mentor_review";

type ReviewStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";

type AccessLevel = "view" | "comment" | "suggest" | "approve";
```

---

## Export Service (`exportService.ts`)

⚠️ **Status: Partial Implementation** - PDF works, DOCX needs backend.

### Key Functions

| Function                                             | Purpose              |
| ---------------------------------------------------- | -------------------- |
| `exportDocument(document, template, theme, options)` | Export document      |
| `exportToPDF(document, template, theme, options)`    | Export to PDF        |
| `exportToHTML(document, template, theme, options)`   | Export to HTML       |
| `exportToTXT(document)`                              | Export to plain text |

### Export Formats

```typescript
type ExportFormat = "pdf" | "docx" | "html" | "txt" | "json";
```

### Export Options

```typescript
interface ExportOptions {
  format: ExportFormat;
  includeTemplate: boolean;
  includeTheme: boolean;
  filename?: string;
  pdfOptions?: {
    pageSize: "A4" | "Letter";
    margins: { top; right; bottom; left };
    orientation: "portrait" | "landscape";
  };
}
```

---

## Company Research Service (`companyResearchService.ts`)

Research company information for job applications.

### Key Functions

| Function                                  | Purpose                 |
| ----------------------------------------- | ----------------------- |
| `getCompanyResearch(userId, companyName)` | Get company insights    |
| `refreshResearch(userId, companyName)`    | Refresh cached research |
