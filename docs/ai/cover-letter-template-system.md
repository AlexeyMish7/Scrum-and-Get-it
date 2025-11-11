# Cover Letter Template System - Definitive Architecture

**Last Updated**: November 10, 2025
**Status**: 🟡 Partially Implemented (Database ready, Zustand using localStorage only)

---

## 🎯 System Overview

The cover letter template system provides users with professional, customizable templates for creating tailored cover letters. It combines:

1. **System Templates** (3 built-in, read-only: formal, creative, technical)
2. **Example Templates** (2 for import demo: modern, minimal)
3. **Custom Templates** (user-created or imported from JSON)
4. **Draft Management** (Zustand store with database persistence)
5. **AI Integration** (tone/style optimization via backend)
6. **Export System** (PDF, DOCX, TXT, HTML)

**Template Import Feature**: Users can import custom templates from JSON files, demonstrated by the two example templates (modern & minimal) available in `/docs/ai/example-templates/`.

---

## 📐 Architecture Layers

### Layer 1: Template Definition & Configuration

**Location**: `frontend/src/app/workspaces/ai/config/coverLetterTemplates.ts`

**What it does**:

- Defines `CoverLetterTemplate` interface (style, formatting, structure)
- Provides **3 system templates** (read-only): `formal`, `creative`, `technical`
- Provides **2 example templates** (for import demo): `modern`, `minimal`
- Exports helper functions: `getCoverLetterTemplate()`, `getCoverLetterTemplateList()`, `importCustomTemplate()`, `exportExampleTemplate()`
- Manages custom templates from localStorage (`sgt:cover_letter_templates`)

**Key Interfaces**:

```typescript
export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  category: "professional" | "creative" | "minimal" | "technical" | "modern";
  isSystem: boolean; // true = read-only system template

  // Styling
  style: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    margins: { top; right; bottom; left };
    colors: { primary; text; accent; background };
  };

  // Formatting preferences
  formatting: {
    headerStyle: "left" | "center" | "right";
    paragraphSpacing: number;
    salutationStyle: "formal" | "casual"; // "Dear" vs "Hello"
    closingStyle: "formal" | "casual"; // "Sincerely" vs "Best"
    includeDate: boolean;
    includeAddress: boolean;
  };

  // Default generation settings
  defaultTone: "formal" | "casual" | "enthusiastic" | "analytical";
  defaultLength: "brief" | "standard" | "detailed";
  defaultCulture: "corporate" | "startup" | "creative";

  // Content structure
  structure: {
    opening: string; // Template with placeholders [POSITION], [COMPANY]
    bodyParagraphs: number; // Recommended count (2-3)
    closing: string; // Template for closing paragraph
  };
}
```

**Public API**:

```typescript
// Get single template (defaults to 'formal' if not found)
getCoverLetterTemplate(templateId?: string): CoverLetterTemplate

// Get all templates (system + custom)
getCoverLetterTemplateList(): CoverLetterTemplate[]

// Get only system templates (3 built-in)
getSystemCoverLetterTemplates(): CoverLetterTemplate[]

// Get only custom templates (from localStorage)
getCustomCoverLetterTemplates(): CoverLetterTemplate[]

// Import custom template from JSON file
importCustomTemplate(jsonFile: File): Promise<CoverLetterTemplate>

// Export example template as downloadable JSON (for demo purposes)
exportExampleTemplate(templateId: "modern" | "minimal"): void
```

---

### Layer 2: Draft Management (Zustand Store)

**Location**: `frontend/src/app/workspaces/ai/hooks/useCoverLetterDrafts.ts`

**What it does**:

- Centralized state for all cover letter drafts
- CRUD operations: create, load, update, delete
- Content editing: opening, body paragraphs, closing
- AI operations: tone changes, style optimization
- Cache management: localStorage sync (database sync pending)

**Key Interfaces**:

```typescript
export interface CoverLetterContent {
  header: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    date?: string;
    companyName?: string;
    companyAddress?: string;
    hiringManager?: string;
  };
  opening: string; // First paragraph
  body: string[]; // 2-3 body paragraphs
  closing: string; // Closing paragraph
  signature?: string;
}

export interface CoverLetterDraft {
  id: string; // UUID
  name: string; // User-defined name
  templateId: string; // References CoverLetterTemplate.id

  // Job context (optional)
  jobId?: number;
  companyName?: string;
  jobTitle?: string;

  // Content structure
  content: CoverLetterContent;

  // Metadata
  metadata: {
    tone: Tone;
    length: Length;
    culture: CompanyCulture;
    industry?: string;
    lastModified: Date;
    createdAt: Date;
    wordCount?: number;
  };

  // Company research (UC-057)
  companyResearch?: CompanyResearch;
}
```

**Store API**:

```typescript
const {
  // State
  drafts, // CoverLetterDraft[]
  activeDraftId, // string | null
  isLoading, // boolean
  error, // string | null

  // Draft CRUD
  createDraft, // (name, templateId?, jobId?, jobTitle?, companyName?) => Promise<string | null>
  loadDraft, // (id: string) => Promise<void>
  deleteDraft, // (id: string) => Promise<void>
  renameDraft, // (id: string, name: string) => Promise<void>

  // Content editing
  updateOpening, // (opening: string) => Promise<void>
  updateBody, // (body: string[]) => Promise<void>
  updateClosing, // (closing: string) => Promise<void>

  // AI operations
  changeTone, // (tone: Tone) => Promise<void>
  changeLength, // (length: Length) => Promise<void>
  changeCulture, // (culture: CompanyCulture) => Promise<void>
  changeTemplate, // (templateId: string) => Promise<void>

  // Company research (UC-063)
  fetchCompanyResearch, // (companyName: string) => Promise<void>
} = useCoverLetterDrafts();
```

---

### Layer 3: Database Persistence

**Location**: `db/migrations/2025-11-10_add_cover_letter_drafts_table.sql`

**Schema**:

```sql
CREATE TABLE public.cover_letter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Draft info
  name text NOT NULL,
  template_id text DEFAULT 'formal',

  -- Job context
  job_id bigint REFERENCES jobs(id) ON DELETE SET NULL,
  company_name text,
  job_title text,

  -- Content (JSON)
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { header: {...}, opening: string, body: string[], closing: string }

  -- Metadata (JSON)
  metadata jsonb NOT NULL DEFAULT '{"tone": "formal", "length": "standard", "culture": "corporate"}'::jsonb,

  -- Company research (JSON)
  company_research jsonb DEFAULT '{}'::jsonb,

  -- Versioning
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);
```

**Indexes**:

- `idx_cover_letter_drafts_user_id` (performance for user queries)
- `idx_cover_letter_drafts_job_id` (link to job applications)
- `idx_cover_letter_drafts_updated_at` (recent drafts first)
- `idx_cover_letter_drafts_template` (group by template)

**RLS Policies**:

- Users can SELECT/INSERT/UPDATE/DELETE only their own drafts
- Row-level security enforced: `auth.uid() = user_id`

---

### Layer 4: UI Components

#### 4.1 Template Gallery (TemplatesHub)

**Location**: `frontend/src/app/workspaces/ai/components/cover-letter/CoverLetterTemplatesIntegrated.tsx`

**Features**:

- Browse 5 system templates + user custom templates
- Preview template with industry-specific variants
- Select industry (Technology, Finance, Healthcare, Education)
- Customize with company research (UC-063, currently mock)
- "Use This Template" creates new draft and navigates to editor

**Flow**:

```
Gallery View
  → Click Template
    → Preview Modal (shows template structure, tone, formatting)
      → Select Industry
        → [Optional] Fetch Company Research
          → Click "Use This Template"
            → createDraft(name, templateId, industry, companyResearch)
              → Navigate to /ai/cover-letter?draft={draftId}
```

**Analytics**:

- Tracks template views/uses in `localStorage: sgt:template_analytics`
- Format: `{ [templateId]: { views: number, uses: number } }`

#### 4.2 Advanced Editor (TipTap Integration)

**Location**: `frontend/src/app/workspaces/ai/components/cover-letter/EditCoverLetterIntegrated.tsx`

**Features**:

- TipTap rich text editor with StarterKit extensions
- Auto-save (2-second debounce) to Zustand store
- AI Rewrite (tone changes via backend `/api/generate/cover-letter`)
- Synonym lookup (Datamuse API integration)
- Readability analysis (Flesch-Kincaid Grade Level)
- Sentence suggestions (passive voice, filler words, length)
- Version history with restore capability

**Editor Sections**:

1. **Opening Paragraph**: TipTap editor → `updateOpening(content)`
2. **Body Paragraphs**: TipTap editor → `updateBody([paragraph1, paragraph2, ...])`
3. **Closing Paragraph**: TipTap editor → `updateClosing(content)`

**AI Rewrite Flow**:

```
User clicks "Apply AI Rewrite"
  → Select tone (formal, casual, enthusiastic, analytical)
    → changeTone(newTone) [Zustand action]
      → POST /api/generate/cover-letter
        → Backend generates new content with new tone
          → setPendingAIContent(aiGeneratedContent)
            → User reviews AI content
              → applyPendingContent() → Updates draft.content
```

#### 4.3 Main Cover Letter Editor

**Location**: `frontend/src/app/workspaces/ai/pages/CoverLetterEditor/index.tsx`

**Features**:

- Three-panel layout: Generation | AI Results | Preview
- Template selector (dropdown of all templates)
- Draft management (create, load, save, delete)
- Export options (PDF, DOCX, TXT, HTML)
- Job linking (associate draft with specific job from pipeline)

**Flow**:

```
Create New Draft
  → Select Template
    → Enter Job Details (optional)
      → Generate Initial Content (AI or Template Structure)
        → Edit in Preview Panel
          → Export to PDF/DOCX
            → [Optional] Link to Job Application (job_materials table)
```

---

## 🔄 Data Flow Architecture

### Creating a Draft from Template

```
User Action: "Use This Template" (CoverLetterTemplatesIntegrated)
  ↓
1. Get template config
   getCoverLetterTemplate(templateId) → CoverLetterTemplate
  ↓
2. Build initial content from template structure
   {
     opening: template.structure.opening
       .replace('[POSITION]', jobTitle)
       .replace('[COMPANY]', companyName),
     body: [industryVariant paragraph 1, paragraph 2],
     closing: template.structure.closing
       .replace('[COMPANY]', companyName)
   }
  ↓
3. Create draft in Zustand
   createDraft(name, templateId, jobId, jobTitle, companyName)
   → Returns draftId (UUID)
  ↓
4. Save to localStorage cache
   localStorage.setItem('sgt:cover_letter_drafts', JSON.stringify(drafts))
  ↓
5. [FUTURE] Save to database
   POST /api/cover-letter-drafts
   → Insert into cover_letter_drafts table
  ↓
6. Navigate to editor
   navigate(`/ai/cover-letter?draft=${draftId}`)
```

### Editing Draft Content

```
User Action: Type in TipTap Editor (EditCoverLetterIntegrated)
  ↓
1. TipTap onChange event fires
  ↓
2. Debounced callback (2 seconds)
   useDebouncedCallback((newContent) => {
     if (section === 'opening') updateOpening(newContent);
     if (section === 'body') updateBody([...bodyParagraphs]);
     if (section === 'closing') updateClosing(newContent);
   }, 2000)
  ↓
3. Zustand store updates draft
   set((state) => ({
     drafts: state.drafts.map(d =>
       d.id === activeDraftId
         ? { ...d, content: { ...d.content, [section]: newContent } }
         : d
     )
   }))
  ↓
4. Save to localStorage cache
  ↓
5. [FUTURE] Debounced database sync
   PATCH /api/cover-letter-drafts/{draftId}
   → Update content jsonb column
```

### AI Tone Change

```
User Action: Click "Apply AI Rewrite" with tone="enthusiastic"
  ↓
1. Zustand: changeTone('enthusiastic')
  ↓
2. Prepare payload
   {
     userId: user.id,
     jobId: draft.jobId,
     draftId: draft.id,
     options: {
       tone: 'enthusiastic',
       templateId: draft.templateId,
       companyName: draft.companyName,
       jobTitle: draft.jobTitle,
       currentContent: draft.content
     }
   }
  ↓
3. POST /api/generate/cover-letter
   → Backend OpenAI integration
   → Returns { opening, body[], closing }
  ↓
4. setPendingAIContent(aiResponse)
   → User reviews in side-by-side view
  ↓
5. User approves → applyPendingContent()
   → Updates draft.content
   → Updates draft.metadata.tone
   → Saves to cache/database
```

---

## 🗂️ Storage Locations

### 1. System Templates (Read-Only)

**Location**: `frontend/src/app/workspaces/ai/config/coverLetterTemplates.ts`

**Count**: 3 templates (read-only, built into the app)

**Templates**:

1. `formal` - Formal Corporate (traditional professional)
2. `creative` - Creative Design (visually appealing for creative industries)
3. `technical` - Technical Professional (clean, data-focused)

**Access**: `COVER_LETTER_TEMPLATES` object (exported const)

### 2. Example Templates (Import Demonstration)

**Location**: `docs/ai/example-templates/*.json`

**Count**: 2 example templates (demonstrate import functionality)

**Templates**:

1. `modern` - Modern Startup (contemporary, casual)
2. `minimal` - Minimal Clean (simple, elegant)

**Purpose**: Users can import these JSON files to see how custom templates work

**Access**: `EXAMPLE_CUSTOM_TEMPLATES` array + JSON files in `/docs/ai/example-templates/`

### 2. Custom Templates (User-Created)

**Location**: `localStorage: sgt:cover_letter_templates`

**Format**:

```json
[
  {
    "id": "custom-1",
    "name": "My Tech Startup Template",
    "description": "Custom template for tech startups",
    "category": "modern",
    "isSystem": false,
    "style": { "fontFamily": "Inter", "fontSize": 11, ... },
    "formatting": { "headerStyle": "left", ... }
  }
]
```

**How to Add**:

1. Import example templates from `/docs/ai/example-templates/` folder
2. Create your own JSON following the template structure
3. Import via Template Gallery UI

**Access**: `getCustomCoverLetterTemplates()` (reads from localStorage)

### 3. Drafts (User Content)

**Current Location**: `localStorage: sgt:cover_letter_drafts`

**Future Location**: `public.cover_letter_drafts` table (Supabase)

**Format**:

```json
{
  "drafts": [
    {
      "id": "uuid-123",
      "name": "Google SWE Cover Letter",
      "templateId": "technical",
      "jobId": 456,
      "companyName": "Google",
      "jobTitle": "Software Engineer",
      "content": {
        "header": { "name": "John Doe", "email": "john@example.com" },
        "opening": "As a software engineer with expertise in...",
        "body": ["First body paragraph", "Second body paragraph"],
        "closing": "I look forward to discussing..."
      },
      "metadata": {
        "tone": "analytical",
        "length": "standard",
        "culture": "startup",
        "lastModified": "2025-11-10T12:00:00Z"
      }
    }
  ],
  "activeDraftId": "uuid-123"
}
```

### 4. Template Analytics

**Location**: `localStorage: sgt:template_analytics`

**Format**:

```json
{
  "formal": { "views": 10, "uses": 3 },
  "creative": { "views": 5, "uses": 1 },
  "technical": { "views": 8, "uses": 4 }
}
```

**Purpose**: Track which templates users browse/use (for optimization)

---

## 🔌 Integration Points

### 1. Job Pipeline Integration

**Tables**: `jobs`, `job_materials`

**Flow**:

```
User creates cover letter for specific job
  → Draft has jobId field populated
    → When exported, creates job_materials entry
      → Links cover_artifact_id (ai_artifacts) or cover_document_id (documents)
        → Visible in job pipeline (/jobs/pipeline)
```

**Database Link**:

```sql
-- Link draft to job
UPDATE cover_letter_drafts
SET job_id = 123, company_name = 'Google', job_title = 'SWE'
WHERE id = 'draft-uuid' AND user_id = auth.uid();

-- Track which cover letter was used for job application
INSERT INTO job_materials (user_id, job_id, cover_artifact_id)
VALUES (auth.uid(), 123, 'artifact-uuid');
```

### 2. AI Artifact System

**Table**: `ai_artifacts`

**Purpose**: Store AI-generated cover letter versions

**Flow**:

```
User generates cover letter with AI
  → Backend creates ai_artifacts entry
    {
      kind: 'cover_letter',
      job_id: 123,
      content: { opening, body[], closing },
      metadata: { tone, prompt, model, confidence }
    }
  → Returns artifact to frontend
    → setPendingAIContent(artifact.content)
      → User reviews and applies
```

**Query**:

```typescript
// Get all AI-generated versions for a job
const artifacts = await listRows("ai_artifacts", "*", {
  eq: { job_id: jobId, kind: "cover_letter" },
  order: { column: "created_at", ascending: false },
});
```

### 3. Company Research Service (UC-063)

**Status**: 🟡 Mock implementation (needs real API)

**Current**: CoverLetterTemplatesIntegrated uses hardcoded mock data

**Future**: Integration with CompanyResearch service

**Flow**:

```
User enters company name
  → handleFetchCompanyInfo(companyName)
    → Call CompanyResearch service API
      → Returns { size, industry, mission, recentNews, competitors }
        → setCompanyInfo(researchData)
          → Inject into template body paragraphs
```

### 4. Export System

**Location**: `frontend/src/app/workspaces/ai/utils/coverLetterExport.ts`

**Formats**: PDF, DOCX, TXT, HTML

**Flow**:

```
User clicks "Export to PDF"
  → exportCoverLetterToPDF(draft, template)
    → Apply template styling (fonts, colors, margins)
      → Generate HTML with embedded CSS
        → Use jsPDF or similar library
          → Download file: "CoverLetter_Google_SWE.pdf"
            → [Optional] Upload to documents table
              → Create documents entry with file_path
```

---

## 🚀 Current Implementation Status

### ✅ Complete

1. **Template Configuration System**

   - 3 system templates defined (formal, creative, technical)
   - 2 example templates for import demo (modern, minimal)
   - `getCoverLetterTemplate()` API working
   - `importCustomTemplate()` / `exportExampleTemplate()` functions
   - Custom template support (localStorage)
   - Example JSON files in `/docs/ai/example-templates/`

2. **Zustand Store**

   - Draft CRUD operations
   - Content editing (opening, body, closing)
   - Metadata management (tone, length, culture)
   - localStorage caching

3. **Database Schema**

   - `cover_letter_drafts` table created
   - RLS policies configured
   - Indexes for performance

4. **UI Components**
   - CoverLetterTemplatesIntegrated (gallery + preview)
   - EditCoverLetterIntegrated (TipTap advanced editor)
   - Main CoverLetterEditor (3-panel layout)
   - TemplatesHub integration (tabs)

### 🟡 Partial

1. **Database Persistence**

   - Schema ready ✅
   - Zustand store has database sync placeholders ⏳
   - Backend CRUD endpoints missing ❌

2. **AI Integration**

   - `changeTone()` action exists ✅
   - Backend `/api/generate/cover-letter` endpoint missing ❌
   - Artifact creation/linking incomplete ⏳

3. **Company Research (UC-063)**
   - Mock implementation ✅
   - Real CompanyResearch service integration needed ❌

### ❌ Not Started

1. **Export System**

   - PDF generation
   - DOCX export
   - HTML/TXT formats

2. **Version History**

   - Track changes over time
   - Restore previous versions
   - Diff visualization

3. **Collaborative Features**
   - Share drafts for feedback
   - Comment system
   - Reviewer permissions

---

## 🛠️ Implementation Priorities

### Priority 1: Database Persistence (HIGH)

**Why**: Currently drafts only saved to localStorage (lost on cache clear)

**Tasks**:

1. Create backend CRUD endpoints (`/api/cover-letter-drafts`)
2. Implement Zustand `syncWithDatabase()` function
3. Wire `createDraft()`, `updateOpening/Body/Closing()` to backend
4. Add optimistic updates with rollback on error

**Files to modify**:

- `server/src/routes/coverLetterDrafts.ts` (new)
- `frontend/src/app/workspaces/ai/hooks/useCoverLetterDrafts.ts`

### Priority 2: AI Backend Integration (HIGH)

**Why**: UC-055, UC-056 require AI content generation

**Tasks**:

1. Create `/api/generate/cover-letter` endpoint
2. Integrate OpenAI API with tone/style prompts
3. Create `ai_artifacts` entries for generated content
4. Wire `changeTone()` Zustand action to backend

**Files to modify**:

- `server/src/routes/generate.ts` (add cover letter handler)
- `server/src/services/aiGeneration.ts` (cover letter prompts)
- `frontend/src/app/workspaces/ai/hooks/useCoverLetterDrafts.ts`

### Priority 3: Company Research Integration (MEDIUM)

**Why**: UC-063 (Automated Company Research) incomplete

**Tasks**:

1. Create CompanyResearch service or use existing
2. Replace mock data in CoverLetterTemplatesIntegrated
3. Store research results in `draft.companyResearch`
4. Inject research into body paragraphs

**Files to modify**:

- `frontend/src/app/workspaces/ai/components/cover-letter/CoverLetterTemplatesIntegrated.tsx`
- Create `frontend/src/app/workspaces/ai/services/companyResearch.ts` (or use existing)

### Priority 4: Export System (MEDIUM)

**Why**: UC-061 (Export and Integration)

**Tasks**:

1. Implement PDF export with template styling
2. Implement DOCX export
3. Create `documents` table entries for exported files
4. Link exported documents to `job_materials`

**Files to modify**:

- `frontend/src/app/workspaces/ai/utils/coverLetterExport.ts`
- Install libraries: `jspdf`, `docx` (or similar)

---

## 📝 Best Practices

### 1. Template Selection

**System Templates (3 built-in)**:

- **Formal**: Finance, Law, Consulting, Government
- **Creative**: Design, Marketing, Media, Advertising
- **Technical**: Engineering, IT, Data Science, Research

**Example Templates (2 for import demo)**:

- **Modern**: Startups, Tech Companies, Fast-paced environments
- **Minimal**: When content over design is priority

**Custom Templates**: User-created or imported from JSON files

### 2. Tone Matching

**Tone → Company Culture Mapping**:

- `formal` → `corporate` (traditional companies)
- `casual` → `startup` (tech startups, small teams)
- `enthusiastic` → `creative` (agencies, innovative companies)
- `analytical` → `corporate` or `startup` (data-driven roles)

### 3. Length Guidelines

**Word Count Targets**:

- `brief`: 200-300 words (follow-ups, referrals)
- `standard`: 300-400 words (most applications)
- `detailed`: 400-500 words (highly relevant background)

### 4. Content Structure

**Best Practice Flow**:

```
Opening (1 paragraph):
  - Position + company name
  - Brief hook (why you're excited/qualified)

Body (2-3 paragraphs):
  - Paragraph 1: Relevant experience + quantified achievements
  - Paragraph 2: Skills match + specific examples
  - [Optional] Paragraph 3: Company research + cultural fit

Closing (1 paragraph):
  - Reiterate interest
  - Call to action (interview request)
  - Professional sign-off
```

---

## 🔍 Troubleshooting

### Issue: Drafts not persisting across devices

**Cause**: Currently using localStorage only (not database)

**Solution**: Implement Priority 1 (Database Persistence)

### Issue: Template changes not reflecting in existing drafts

**Cause**: Templates are config files, drafts store snapshot at creation time

**Solution**: Use `changeTemplate(newTemplateId)` to re-apply template structure

### Issue: AI rewrite not working

**Cause**: Backend endpoint `/api/generate/cover-letter` not implemented

**Solution**: Implement Priority 2 (AI Backend Integration)

### Issue: Company research showing mock data

**Cause**: UC-063 using hardcoded mock (no real API)

**Solution**: Implement Priority 3 (Company Research Integration)

---

## 🎓 Developer Onboarding

**Quick Start Checklist**:

1. ✅ Read this document
2. ✅ Review `coverLetterTemplates.ts` (understand template structure)
3. ✅ Review `useCoverLetterDrafts.ts` (understand state management)
4. ✅ Run database migration: `2025-11-10_add_cover_letter_drafts_table.sql`
5. ✅ Test template gallery: `/ai/templates` → "Cover Letter Templates" tab
6. ✅ Test advanced editor: `/ai/templates` → "Advanced Editor" tab
7. ⏳ Implement database persistence (Priority 1)
8. ⏳ Implement AI backend (Priority 2)

**Key Files to Know**:

- Config: `config/coverLetterTemplates.ts`
- Store: `hooks/useCoverLetterDrafts.ts`
- UI: `components/cover-letter/CoverLetterTemplatesIntegrated.tsx`
- Editor: `components/cover-letter/EditCoverLetterIntegrated.tsx`
- Main Page: `pages/CoverLetterEditor/index.tsx`

---

## 📚 Related Documentation

- [Cover Letter Templates Guide](./cover-letter-templates-guide.md) — User testing guide
- [Database Schema](./../instructions/database_schema.instructions.md) — Full schema reference
- [Copilot Instructions](./../.github/copilot-instructions.md) — Project architecture
- [Sprint 2 PRD](./../../docs/project-management/sprint2-prd.md) — Use cases UC-055 through UC-062

---

**Questions?** Check Zustand store implementation or database schema first. If still unclear, reference the template config file — it's the single source of truth for template definitions.
