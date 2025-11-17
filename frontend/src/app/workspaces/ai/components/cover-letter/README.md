# Cover Letter Components

**Purpose**: UI components for the AI-powered cover letter editor workflow.

**Location**: `workspaces/ai/components/cover-letter/`

**Import Pattern**:

```typescript
import {
  CoverLetterStarter,
  CoverLetterGenerationPanel,
  CoverLetterPreviewPanel,
} from "@workspaces/ai/components/cover-letter";
```

---

## 📁 Component Architecture

The cover letter editor uses a **3-panel layout** orchestrated by `CoverLetterEditor` page:

```
┌──────────────────────────────────────────────────────────────┐
│                    CoverLetterStarter                         │
│   (Draft selection onboarding - shown before editor)         │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┬─────────────────┬──────────────────────────┐
│   Generation    │   AI Results    │      Preview Panel       │
│     Panel       │     Panel       │   (Live Preview +        │
│  (35%)          │  (35%)          │    Inline Editing)       │
│                 │                 │      (30%)               │
│ • Job selector  │ • AI-generated  │ • Formatted preview      │
│ • Tone/length   │   content       │ • Editable sections      │
│ • Culture match │ • Apply button  │ • Word count             │
│ • Generate btn  │ • Regenerate    │ • Export (PDF/DOCX/TXT) │
└─────────────────┴─────────────────┴──────────────────────────┘
```

---

## 🔧 Main Editor Workflow Components

### **CoverLetterStarter.tsx** (411 lines)

**Purpose**: Onboarding screen before entering main editor

**Responsibilities**:

- Display existing cover letter drafts list
- "Load Existing" or "Create New" flow
- Template selection for new drafts
- Navigate to editor with draft loaded

**Props**:

```typescript
interface CoverLetterStarterProps {
  onStart: (draftId: string) => void; // Called when ready to edit
  onCancel?: () => void; // Called when user cancels
}
```

**Usage**:

```tsx
import { CoverLetterStarter } from "@workspaces/ai/components/cover-letter";

<CoverLetterStarter
  onStart={(draftId) => setCurrentDraftId(draftId)}
  onCancel={() => navigate("/ai")}
/>;
```

**Features**:

- Lists all user's cover letter drafts
- Shows draft name, associated job, last updated date
- Template showcase integration
- Creates draft in Zustand store (`useCoverLetterDrafts`)

---

### **CoverLetterGenerationPanel.tsx** (392 lines)

**Purpose**: Left panel for job selection and AI generation options

**Responsibilities**:

- Job selector dropdown (from user's jobs list)
- Tone selector (formal, casual, enthusiastic, analytical)
- Length selector (brief, standard, detailed)
- Company culture matcher (corporate, startup, creative)
- Industry language options (technical jargon, keywords, role-specific)
- Generate button with loading state
- Company research preview (UC-057)

**Props**:

```typescript
interface GenerationPanelProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobSelect: (jobId: number | null) => void;

  tone: Tone;
  onToneChange: (tone: Tone) => void;

  length: Length;
  onLengthChange: (length: Length) => void;

  culture: CompanyCulture;
  onCultureChange: (culture: CompanyCulture) => void;

  industryLanguage: IndustryLanguageOptions;
  onIndustryLanguageChange: (options: IndustryLanguageOptions) => void;

  onGenerate: () => void;
  isGenerating: boolean;
  companyResearch?: string | null;
}
```

**Features**:

- Real-time job data from `listJobs()`
- Tone/length/culture descriptions with tooltips
- Industry-specific language toggles
- Company research accordion (shows news, mission, values)
- Validation (requires job selection before generate)

---

### **CoverLetterAIResultsPanel.tsx** (264 lines)

**Purpose**: Middle panel for AI-generated content preview

**Responsibilities**:

- Display AI-generated opening, body, closing paragraphs
- Show generation metadata (tone, length, culture, word count)
- Apply button to insert content into active draft
- Regenerate button to create new variation
- Dismiss button to clear pending content

**Props**:

```typescript
interface AIResultsPanelProps {
  pendingContent: CoverLetterArtifactContent | null;
  onApply: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isRegenerating?: boolean;
}
```

**Usage**:

```tsx
<CoverLetterAIResultsPanel
  pendingContent={aiContent}
  onApply={handleApplyContent}
  onRegenerate={handleRegenerate}
  onDismiss={() => setAIContent(null)}
  isRegenerating={isGenerating}
/>
```

**Features**:

- Empty state ("No AI Content Yet")
- Metadata chips (tone, length, culture)
- Word count per section
- Loading state during regeneration
- Smooth apply animation

---

### **CoverLetterPreviewPanel.tsx** (564 lines)

**Purpose**: Right panel for live preview and inline editing

**Responsibilities**:

- Display formatted cover letter with template styling
- Inline editing for header, opening, body, closing sections
- Word count tracking (per section + total)
- Template style preview (fonts, colors, spacing)
- Export functionality (PDF, DOCX, plain text)

**Props**:

```typescript
interface PreviewPanelProps {
  content: CoverLetterContent;
  template: CoverLetterTemplate;

  onUpdateHeader: (header: CoverLetterContent["header"]) => void;
  onUpdateOpening: (opening: string) => void;
  onUpdateBody: (body: string[]) => void;
  onUpdateClosing: (closing: string) => void;

  onExport: (format: "pdf" | "docx" | "txt") => void;
  isExporting?: boolean;
}
```

**Features**:

- Real-time template styling (fonts, colors from template config)
- Editable sections with save/cancel
- Add/remove body paragraphs
- Word count warnings (too short/too long)
- Export dropdown with format selection
- Template-specific formatting preview

**Edit Modes**:

- **Header**: Name, email, phone, location (inline edit fields)
- **Opening**: Single paragraph (textarea)
- **Body**: Multiple paragraphs (array of textareas, add/remove)
- **Closing**: Single paragraph (textarea)

---

## 📋 Template Management Components

### **CoverLetterTemplateManager.tsx** (317 lines)

**Purpose**: Template library administration interface

**Used In**: TemplatesHub page (`/ai/templates`)

**Responsibilities**:

- Browse system templates (formal, creative, technical, modern)
- Create custom templates with visual builder
- Import custom templates from JSON
- Export templates to share
- View template details and usage analytics

**Features**:

- System vs custom template filtering
- Template card grid with previews
- Import/export buttons
- Template creator dialog integration
- Analytics display (usage count, success rate)

**Note**: This is for **template management ONLY**, not for creating cover letters. Template selection for actual cover letter creation happens in `CoverLetterStarter`.

---

### **CoverLetterTemplateCreator.tsx** (530 lines)

**Purpose**: Visual builder for custom templates

**Responsibilities**:

- Form-based template configuration UI
- Real-time style preview
- Save custom templates to localStorage
- Validation and error handling

**Props**:

```typescript
interface CoverLetterTemplateCreatorProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: CoverLetterTemplate) => void;
}
```

**Configuration Options**:

- **Basic Info**: Name, description, category
- **Typography**: Font family, size, line height
- **Colors**: Primary, text, accent, background
- **Formatting**: Header style (left/center/right), salutation/closing style
- **Margins**: Section spacing, paragraph spacing
- **Defaults**: Tone, length, culture presets

**Output**: Complete `CoverLetterTemplate` object saved to localStorage

---

### **CoverLetterTemplateShowcase.tsx** (442 lines)

**Purpose**: Template browser dialog with live preview

**Responsibilities**:

- Visual carousel of available templates
- Category filtering (professional, creative, technical, modern)
- Live preview with sample content
- Template selection and application
- Comparison view

**Props**:

```typescript
interface CoverLetterTemplateShowcaseProps {
  open: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}
```

**Features**:

- Category tabs (all, professional, creative, technical, modern)
- Template cards with visual previews
- Navigation arrows for carousel
- Full preview modal with sample cover letter
- "Use This Template" button applies to current draft

**Sample Content**: Shows realistic cover letter example with each template's styling

---

## 📊 Analytics Component

### **CoverLetterAnalyticsDialog.tsx** (136 lines)

**Purpose**: Performance tracking and A/B testing display

**Responsibilities**:

- Overall stats (sent, response rate, interview rate, offer rate)
- Stats by template (which templates perform best)
- A/B test summaries (tone, length, culture experiments)
- Export analytics to JSON

**Props**:

```typescript
interface Props {
  open: boolean;
  onClose: () => void;
}
```

**Usage**:

```tsx
import { CoverLetterAnalyticsDialog } from "@workspaces/ai/components/cover-letter";

<CoverLetterAnalyticsDialog
  open={analyticsOpen}
  onClose={() => setAnalyticsOpen(false)}
/>;
```

**Data Source**: `useCoverLetterAnalytics` hook (localStorage-based tracking)

**Features**:

- Table view of template performance
- Response rate percentages
- Export button (downloads JSON)
- Color-coded performance scores

**Related UC**: UC-062 (Cover Letter Performance Tracking)

---

## 🗑️ Deprecated/Removed Components

The following components were **deleted during Sprint 2 cleanup**:

### ~~EditCoverLetterIntegrated.tsx~~ (426 lines) - **DELETED**

- **Status**: Completely unused, no imports anywhere
- **Problem**: Duplicate TipTap editor functionality
- **Replacement**: `CoverLetterPreviewPanel` has inline editing

### ~~CoverLetterTemplates.tsx~~ (360 lines) - **DELETED**

- **Status**: Deprecated with warning comment
- **Problem**: Mock data, not integrated with store
- **Replacement**: `CoverLetterTemplateManager` (production version)

### ~~CoverLetterTemplatesIntegrated.tsx~~ (370 lines) - **DELETED**

- **Status**: Unused, superseded by TemplateManager
- **Problem**: Duplicate functionality
- **Replacement**: `CoverLetterTemplateManager` has cleaner API

### **EditCoverLetter.tsx** (396 lines) - **DEPRECATED, route exists**

- **Status**: Route `/ai/cover-letter/edit` exists but not integrated
- **Problem**: Standalone TipTap editor with mock data
- **Action**: Route should be removed or component fully integrated
- **Recommendation**: Delete route - PreviewPanel handles editing

**Total Dead Code Removed**: ~1,156 lines

---

## 🎨 Component Design Patterns

### **1. Panel Components Use Controlled State**

All panels are controlled by parent `CoverLetterEditor`:

```tsx
// Parent manages all state
const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
const [tone, setTone] = useState<Tone>("formal");

// Panels are pure controlled components
<CoverLetterGenerationPanel
  selectedJobId={selectedJobId}
  onJobSelect={setSelectedJobId}
  tone={tone}
  onToneChange={setTone}
  // ...
/>;
```

### **2. AI Content Flow is Explicit**

Clear state machine for AI generation:

1. User clicks "Generate" → `onGenerate()` called
2. Parent calls API → `setPendingAIContent(result)`
3. AI Results Panel displays → User clicks "Apply"
4. Parent merges into draft → `updateDraft(content)`

### **3. Template System is Pluggable**

Templates are data, not code:

```typescript
// Template configuration drives UI rendering
const template = getCoverLetterTemplate("formal");

// Preview panel applies template styling
<Box sx={{
  fontFamily: template.style.fontFamily,
  fontSize: template.style.fontSize,
  color: template.style.textColor,
  // ...
}}>
```

### **4. Inline Editing is Section-Based**

Each section has its own edit state:

```tsx
const [editingSection, setEditingSection] = useState<string | null>(null);

// Only one section editable at a time
{editingSection === "opening" ? (
  <TextField value={opening} onChange={...} />
) : (
  <Typography onClick={() => setEditingSection("opening")}>
    {opening}
  </Typography>
)}
```

---

## 📚 Related Documentation

- **Template Configuration**: `workspaces/ai/config/coverLetterTemplates.ts`
- **Draft Management**: `workspaces/ai/hooks/useCoverLetterDrafts.ts`
- **Analytics**: `workspaces/ai/hooks/useCoverLetterAnalytics.ts`
- **Export Utilities**: `workspaces/ai/utils/coverLetterExport.ts`
- **AI Generation**: `workspaces/ai/services/aiGeneration.ts`

---

## ✅ Best Practices

### **1. Import from Barrel**

```typescript
// ✅ Good
import {
  CoverLetterGenerationPanel,
  CoverLetterPreviewPanel,
} from "@workspaces/ai/components/cover-letter";

// ❌ Avoid
import CoverLetterGenerationPanel from "@workspaces/ai/components/cover-letter/CoverLetterGenerationPanel";
```

### **2. Always Scope to User**

```typescript
// ✅ Good - uses user-scoped draft store
const { activeDraft, updateOpening } = useCoverLetterDrafts();

// ❌ Bad - direct database access without user scoping
await supabase.from("cover_letter_drafts").select("*");
```

### **3. Use Type-Safe Constants**

```typescript
// ✅ Good - type-safe from config
import {
  TONE_DESCRIPTIONS,
  type Tone,
} from "@workspaces/ai/config/coverLetterTemplates";
const tone: Tone = "formal";

// ❌ Avoid - magic strings
const tone = "formal"; // Not type-checked
```

### **4. Handle Loading States**

```typescript
// ✅ Good - explicit loading prop
<CoverLetterGenerationPanel
  onGenerate={handleGenerate}
  isGenerating={isLoading}
/>;

// Inside component
{
  isGenerating && <CircularProgress />;
}
```

---

**Last Updated**: Sprint 2 Polish (November 2025)
