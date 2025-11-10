# Resume Editor UX Redesign - Version 2.0

**Created**: November 9, 2025
**Status**: Design Phase
**Sprint**: Sprint 2 Enhancement
**Goal**: Simplify resume generation flow, improve clarity, enable efficient testing

---

## Executive Summary

The current Resume Editor uses a confusing 4-step stepper that separates generation, preview, and application into disconnected flows. Users must click 3 separate "Apply" buttons and navigate back/forth between steps to build their resume.

**New Design Goals**:

1. **Single-page layout** - All actions visible at once
2. **Clear mental model** - Generate → Review → Apply → Export
3. **Instant feedback** - See AI results immediately
4. **Efficient workflow** - One click to apply everything
5. **Testable** - Clear states, predictable flows

---

## Current Problems

### Issue 1: Multi-Step Stepper Confusion

```
Step 1: Select Draft → Step 2: Generate → Step 3: Apply → Step 4: Preview
                         ↑                    ↓
                         └────────────────────┘
                      (User gets lost here)
```

- Users don't understand they need to go back after clicking "Apply Skills"
- Preview shows draft state, not AI generation results
- No visual indication of what's been applied vs what's pending

### Issue 2: Separate Apply Actions

- Click "Apply Skills" → Navigate to preview → Go back
- Click "Apply Summary" → Navigate to preview → Go back
- Click "Merge Experience" → Open dialog → Select bullets → Close
- **Total**: 3+ clicks + navigation to apply one generation

### Issue 3: Template System Disconnect

- Templates stored separately from content
- No visual preview of template styling
- Unclear relationship between template and resume content
- Template selection happens before generation (should be after)

### Issue 4: Preview Ambiguity

```
"Preview Draft Data" showing:
  Summary: (empty)
  Skills: 9 skills ← From AI? From draft? Already applied?
  Experience: (Education data not yet linked)
```

Users can't tell:

- What data is from AI vs already in draft
- What's been applied vs what's pending
- What actions are still needed

---

## New Design: Single-Page Layout

### Layout Overview (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Resume Editor                                    [Help] [Tutorial] [×]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── GENERATION PANEL ──────────────────────────────────────────────┐  │
│ │  📄 Select Job: [Pfizer - Digital Solutions Rotation ▼]          │  │
│ │  🎨 Tone: [Professional ▼]  Focus: [Optional ▼]                  │  │
│ │  [⚙️ Advanced Options ▼]  [Generate Resume] ← Primary action      │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌─── AI GENERATED CONTENT ──────────┐ ┌─── YOUR DRAFT ───────────────┐ │
│ │ 📊 Generation Results             │ │ 📝 Current Resume Draft      │ │
│ │ ┌─────────────────────────────┐   │ │ ┌──────────────────────────┐ │ │
│ │ │ [Summary] [Skills] [Exp] ...│   │ │ │ Draft: "Tech Resume v3"  │ │ │
│ │ ├─────────────────────────────┤   │ │ ├──────────────────────────┤ │ │
│ │ │ ✅ Summary                   │   │ │ │ Summary                  │ │ │
│ │ │ Motivated Computer Science  │   │ │ │ [Empty - Apply AI →]     │ │ │
│ │ │ student at NJIT with...     │   │ │ │                          │ │ │
│ │ │                             │   │ │ │ Skills (9)               │ │ │
│ │ │ [✓ Apply Summary]           │   │ │ │ ● JavaScript             │ │ │
│ │ └─────────────────────────────┘   │ │ │ ● React                  │ │ │
│ │                                    │ │ │ ● Python                 │ │ │
│ │ [Apply All] [Undo] [Clear]        │ │ │ (Applied from AI ✓)      │ │ │
│ └────────────────────────────────────┘ │ └──────────────────────────┘ │ │
│                                         │                              │ │
│                                         │ [Export PDF] [Export DOCX]   │ │
│                                         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Improvements

1. **Side-by-side view**: AI results on left, draft on right
2. **Clear action hierarchy**: Generate (primary) → Apply All (secondary) → Individual Apply (tertiary)
3. **Visual state indicators**: ✅ Generated, ✓ Applied, ⚠️ Needs attention
4. **Single-page**: No navigation between steps
5. **Immediate feedback**: Results appear in same view

---

## Detailed Component Specs

### 1. Generation Panel (Top Section)

```
┌─── GENERATION PANEL ─────────────────────────────────────────────────┐
│                                                                       │
│  Select Target Job                                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 Pfizer - Digital Solutions Rotation (Healthcare)           │  │
│  │    Deadline: 2025-11-30 • Applied: Not yet                    ▼ │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─── Quick Options ─────────────────────────────────────────────┐  │
│  │  Tone: [Professional ▼]   Focus: [Leadership ▼]               │  │
│  │  Model: [Default (gpt-4o-mini) ▼]                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ⚙️ [Advanced Options ▼]  ← Collapse/expand advanced settings       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  [🚀 Generate Resume]  ← Primary CTA, blue, prominent          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Status: Ready to generate • Last generated: 2 minutes ago          │
└───────────────────────────────────────────────────────────────────────┘
```

**States**:

- **Idle**: "Ready to generate" - button enabled
- **Generating**: "Generating... (15s)" - spinner + progress
- **Success**: "✓ Generated successfully!" - green banner, auto-dismiss
- **Error**: "⚠️ Generation failed: [reason]" - red banner, retry button

**Interactions**:

- Job dropdown: Shows recent jobs, search, link to "Add New Job"
- Advanced options: Collapsible panel with custom prompt, section toggles
- Generate button: Disabled if no job selected or currently generating

---

### 2. AI Generated Content Panel (Left Side)

```
┌─── AI GENERATED CONTENT ──────────────────────────────────────────┐
│                                                                    │
│  📊 Generation Results for: Pfizer Digital Solutions Rotation     │
│  Generated: Nov 9, 2025 12:45 PM • Model: gpt-4o-mini • 1756 tokens│
│                                                                    │
│  ┌─ Tabs ─────────────────────────────────────────────────────┐  │
│  │ [Summary] [Skills] [Experience] [Education] [Projects]      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ Summary Tab ──────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ✅ Professional Summary                                     │  │
│  │                                                              │  │
│  │  Motivated Computer Science student at NJIT with a strong   │  │
│  │  foundation in digital solutions and software development.  │  │
│  │  Proven ability to collaborate on innovative projects,      │  │
│  │  exemplified by a top-three finish in a hackathon for a     │  │
│  │  mental health tracking app. Eager to leverage diverse      │  │
│  │  skills in a rotational program at Pfizer to contribute     │  │
│  │  to impactful digital healthcare solutions.                 │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Status: Not yet applied                                │   │  │
│  │  │ [✓ Apply to Draft]  [📋 Copy Text]                    │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ Skills Tab ───────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ✅ Optimized Skills (9 skills ordered by relevance)        │  │
│  │                                                              │  │
│  │  🔵 JavaScript  🔵 React  🔵 Python                         │  │
│  │  🔵 Problem Solving  🔵 Digital Solutions                   │  │
│  │  🔵 Team Collaboration  🔵 Adaptability                     │  │
│  │  🔵 Client Partnerships  🔵 Product Management              │  │
│  │                                                              │  │
│  │  💡 Suggested additions: TypeScript, Node.js, SQL           │  │
│  │  ⚠️  Missing from your profile: Cloud Computing, Docker     │  │
│  │                                                              │  │
│  │  Status: ✓ Applied to draft                                 │  │
│  │  [Undo Application]  [📋 Copy List]                         │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ Experience Tab ───────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ✅ Tailored Experience (2 roles)                           │  │
│  │                                                              │  │
│  │  📍 Teaching Assistant/Tutor - NJIT                         │  │
│  │     Feb 2024 - May 2025                                     │  │
│  │     • Supported over 50 students in mastering complex       │  │
│  │       concepts, improving problem-solving skills and        │  │
│  │       academic performance.                                 │  │
│  │     • Developed and implemented engaging tutorial sessions, │  │
│  │       resulting in a 20% increase in student satisfaction.  │  │
│  │     • Collaborated with faculty to improve course materials,│  │
│  │       contributing to a more effective learning environment.│  │
│  │                                                              │  │
│  │  📍 Sales Associate & Brand Ambassador - American Eagle     │  │
│  │     May 2023 - Jan 2025                                     │  │
│  │     • Achieved a 15% increase in sales through effective    │  │
│  │       customer engagement and product knowledge.            │  │
│  │     • Promoted brand loyalty by organizing in-store events, │  │
│  │       enhancing customer experience and retention.          │  │
│  │     • Collaborated with team members to optimize store      │  │
│  │       layout, improving product visibility.                 │  │
│  │                                                              │  │
│  │  Status: Not yet applied                                    │  │
│  │  [✓ Apply All Bullets]  [Select Individual Bullets]        │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  [Apply All Sections]  [Clear All]  [Save as Version]      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Tab Behaviors**:

- **Summary**: Shows full text, apply button, character count
- **Skills**: Chip-style display, drag to reorder, add/remove skills
- **Experience**: Expandable cards per role, select individual bullets
- **Education**: Read-only preview (from profile, not AI-modified)
- **Projects**: Read-only preview (from profile, not AI-modified)

**Visual States**:

- ✅ **Generated**: Green checkmark, content visible
- ⏳ **Generating**: Skeleton loader, animated pulse
- ⚠️ **Error**: Red warning, retry button
- ✓ **Applied**: Blue checkmark, "Undo" button available
- 🔄 **Modified**: Orange dot if user edited AI content

---

### 3. Draft Preview Panel (Right Side)

```
┌─── YOUR DRAFT ────────────────────────────────────────────────────┐
│                                                                    │
│  📝 Resume Draft: "Tech Resume v3"                                │
│  Template: Professional Modern • Last saved: 2 min ago            │
│                                                                    │
│  ┌─ Live Preview ──────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  John Doe                                                     │  │
│  │  johnny.test.scrum@gmail.com • (555) 123-4567                │  │
│  │  ────────────────────────────────────────────────────────    │  │
│  │                                                               │  │
│  │  SUMMARY                                                      │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ [Empty - Click "Apply Summary" from AI results]         │ │  │
│  │  │ or [Write your own summary...]                          │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  SKILLS                                                       │  │
│  │  ✓ JavaScript • React • Python • Problem Solving •           │  │
│  │    Digital Solutions • Team Collaboration • Adaptability •   │  │
│  │    Client Partnerships • Product Management                  │  │
│  │  ↳ Applied from AI 2 min ago                                 │  │
│  │                                                               │  │
│  │  EXPERIENCE                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ [Empty - Click "Apply Experience" from AI results]      │ │  │
│  │  │ or [Add experience manually...]                         │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  EDUCATION                                                    │  │
│  │  Bachelor's in Computer Science - NJIT (Expected 2025)       │  │
│  │  GPA: 3.8                                                     │  │
│  │  ↳ From your profile                                         │  │
│  │                                                               │  │
│  │  PROJECTS                                                     │  │
│  │  Pfizer Hackathon - Sidekick App (Backend Engineer)          │  │
│  │  ↳ From your profile                                         │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ Section Controls ──────────────────────────────────────────┐  │
│  │  ☑️ Summary  ☑️ Skills  ☑️ Experience  ☑️ Education           │  │
│  │  ☑️ Projects                                                  │  │
│  │  [Reorder Sections]  [Toggle Visibility]                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ Actions ───────────────────────────────────────────────────┐  │
│  │  [📄 Export PDF]  [📝 Export DOCX]  [💾 Save Draft]          │  │
│  │  [🎨 Change Template]  [📋 Duplicate]  [🗑️  Delete]          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Features**:

- **Live preview**: Matches export formatting
- **State indicators**:
  - `[Empty - Click "Apply..." from AI results]` - not yet applied
  - `✓ Applied from AI 2 min ago` - recently applied
  - `↳ From your profile` - static data from user profile
  - `✏️ Manually edited` - user customized after applying
- **Inline editing**: Click to edit any section directly
- **Section controls**: Show/hide, reorder via drag-drop
- **Quick actions**: Export, template change, save

---

## User Flows

### Flow 1: First-Time Resume Generation

```
1. User arrives at Resume Editor
   ↓
2. Sees empty draft + generation panel
   ↓
3. Selects job from dropdown
   ↓
4. Clicks "Generate Resume"
   ↓
5. Sees loading state (15-20s)
   ├─ Progress indicator: "Analyzing job requirements..."
   ├─ Then: "Generating summary..."
   ├─ Then: "Optimizing skills..."
   └─ Then: "Tailoring experience..."
   ↓
6. Results appear in left panel with ✅ indicators
   ├─ Summary tab shows generated text
   ├─ Skills tab shows 9 ordered skills
   └─ Experience tab shows tailored bullets
   ↓
7. User clicks "Apply All Sections" button
   ↓
8. Draft preview updates with all content
   ├─ Visual animation showing content flowing in
   └─ Success toast: "All sections applied successfully!"
   ↓
9. User reviews draft, makes minor edits
   ↓
10. Clicks "Export PDF"
    ↓
11. PDF downloads with formatted resume
```

**Key improvements**:

- **No navigation**: Everything happens on one page
- **Clear progress**: Loading states explain what's happening
- **One-click apply**: No need to apply each section separately
- **Instant feedback**: Visual animations + success messages

---

### Flow 2: Iterative Generation (Trying Different Options)

```
1. User has existing draft with applied content
   ↓
2. Changes job selection or tweaks tone
   ↓
3. Clicks "Generate Resume" again
   ↓
4. Warning modal appears:
   ┌────────────────────────────────────────────┐
   │ ⚠️  Replace AI Content?                   │
   │                                            │
   │ Generating new content will replace        │
   │ previous AI results in the left panel.     │
   │                                            │
   │ Your current draft won't change until      │
   │ you click "Apply" again.                   │
   │                                            │
   │ [Cancel]  [Generate New Version]          │
   └────────────────────────────────────────────┘
   ↓
5. User clicks "Generate New Version"
   ↓
6. Left panel updates with new AI content
   ├─ Previous results replaced
   └─ Draft panel unchanged (shows old applied content)
   ↓
7. User compares new vs old by looking at both panels
   ↓
8. Decides to apply only the new summary
   ├─ Clicks "Apply Summary" in Summary tab
   └─ Draft updates with new summary only
   ↓
9. User satisfied, exports PDF
```

**Key improvements**:

- **Safe regeneration**: Draft isn't touched until user applies
- **Side-by-side comparison**: Can see what would change
- **Granular control**: Apply individual sections if preferred
- **Undo available**: Can revert if unhappy with changes

---

### Flow 3: Manual Editing After AI Application

```
1. User has applied AI-generated content to draft
   ↓
2. Wants to tweak a bullet point in Experience section
   ↓
3. Clicks directly on bullet text in draft preview
   ↓
4. Inline editor appears:
   ┌────────────────────────────────────────────────┐
   │ • [Supported over 50 students in mastering___]│
   │   [complex concepts, improving problem-______]│
   │   [solving skills and academic performance.___]│
   │                                                │
   │   [✓ Save]  [✗ Cancel]  [🗑️  Delete Bullet]    │
   └────────────────────────────────────────────────┘
   ↓
5. User edits text, clicks "Save"
   ↓
6. Draft updates with edited content
   ├─ Indicator changes to: "✏️ Manually edited"
   └─ Undo button appears
   ↓
7. User continues editing other sections as needed
   ↓
8. All changes auto-saved to localStorage
```

**Key improvements**:

- **Inline editing**: No separate edit mode needed
- **Clear state tracking**: Know what's AI vs manual
- **Auto-save**: Never lose work
- **Undo available**: Can revert individual edits

---

## State Management Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Hierarchy                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ResumeEditorV2 (Container)                                     │
│  ├─ GenerationPanel                                             │
│  │  └─ useResumeGenerationFlowV2 (API calls)                   │
│  │                                                               │
│  ├─ AIResultsPanel (Left)                                       │
│  │  ├─ State: lastAIContent (from API response)                │
│  │  └─ Actions: applySection(section), applyAll()              │
│  │                                                               │
│  ├─ DraftPreviewPanel (Right)                                   │
│  │  ├─ State: currentDraft (from useResumeDrafts)              │
│  │  └─ Actions: editSection(section, newContent)               │
│  │                                                               │
│  └─ useResumeDraftsV2 (Zustand store)                          │
│     ├─ State:                                                   │
│     │  • drafts: ResumeDraft[]                                 │
│     │  • activeDraftId: string                                 │
│     │  • history: UndoHistory[]                                │
│     │  • pendingAIContent: ResumeArtifactContent | null        │
│     │                                                           │
│     └─ Actions:                                                 │
│        • applySummary(text)                                     │
│        • applySkills(skills)                                    │
│        • applyExperience(entries)                               │
│        • applyAll(content)                                      │
│        • undo() / redo()                                        │
│        • editSection(section, content)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### State Shapes

```typescript
// AI Content (from backend API)
interface ResumeArtifactContent {
  summary?: string;
  ordered_skills?: string[];
  emphasize_skills?: string[];
  add_skills?: string[];
  ats_keywords?: string[];
  sections?: {
    experience?: ExperienceEntry[];
    education?: EducationEntry[];
    projects?: ProjectEntry[];
  };
  meta?: {
    generated_at: string;
    job_id: number;
    model: string;
    tokens: number;
  };
}

// Draft Content (in localStorage + Zustand)
interface ResumeDraft {
  id: string;
  name: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  content: {
    summary?: string;
    skills?: string[];
    experience?: ExperienceEntry[];
    education?: EducationEntry[]; // From profile, read-only
    projects?: ProjectEntry[]; // From profile, read-only
    visibleSections?: string[];
    sectionOrder?: string[];
  };
  metadata: {
    lastAppliedJobId?: number;
    lastAppliedAt?: string;
    manuallyEdited?: boolean;
    aiGenerationIds?: string[]; // Track which AI artifacts were applied
  };
}

// Undo/Redo History
interface UndoHistoryEntry {
  timestamp: string;
  action: "apply-summary" | "apply-skills" | "apply-experience" | "edit-manual";
  previousState: Partial<ResumeDraft["content"]>;
  newState: Partial<ResumeDraft["content"]>;
}

// UI State
interface EditorUIState {
  isGenerating: boolean;
  generationProgress?: {
    stage: "analyzing" | "summary" | "skills" | "experience" | "complete";
    percent: number;
  };
  lastAIContent: ResumeArtifactContent | null;
  appliedSections: Set<string>; // Track which sections from AI are applied
  pendingChanges: boolean; // Unsaved edits in draft
}
```

---

## Visual Design Specifications

### Color Coding

```
🟢 Generated successfully (AI content ready)      → #4CAF50
🔵 Applied to draft (synced)                      → #2196F3
🟡 Modified/Edited manually                       → #FF9800
🔴 Error/Warning                                   → #F44336
⚪ Empty/Not yet applied                          → #9E9E9E
```

### Icons

```
✅ Success/Completed
⏳ Loading/Processing
⚠️  Warning/Needs attention
✓ Applied/Saved
✏️ Edited/Modified
🚀 Primary action (Generate)
📋 Copy to clipboard
🔄 Regenerate/Refresh
↩️  Undo
↪️  Redo
```

### Spacing & Layout

```
Container padding: 24px
Card spacing: 16px between cards
Section spacing: 32px between major sections
Button spacing: 8px between related buttons
Tab spacing: 16px horizontal padding per tab
```

### Responsive Breakpoints

```
Desktop (≥1200px):   Side-by-side layout (50/50 split)
Tablet (768-1199px): Stacked layout with tabs for AI/Draft
Mobile (≤767px):     Single column, collapsible panels
```

---

## Animation & Feedback

### Loading States

**Generation Progress**:

```
Stage 1: Analyzing job requirements...  [████░░░░] 25%
Stage 2: Generating summary...          [██████░░] 50%
Stage 3: Optimizing skills...           [████████] 75%
Stage 4: Tailoring experience...        [████████] 100% ✓
```

**Apply Animation**:

```
1. User clicks "Apply Summary"
2. Draft panel highlights summary section (yellow pulse)
3. Content fades in with slide-down animation (300ms)
4. Green checkmark appears next to section
5. Success toast appears top-right: "Summary applied!"
```

### Microinteractions

- **Hover effects**: Buttons scale 1.05x, add shadow
- **Click feedback**: Button press animation (scale 0.98x)
- **Section collapse**: Smooth height transition (200ms)
- **Tab switching**: Fade crossfade (150ms)
- **Undo/Redo**: Reverse animation of original apply

---

## Accessibility

### Keyboard Navigation

```
Tab order:
1. Job dropdown
2. Tone dropdown
3. Focus dropdown
4. Generate button
5. AI Results tabs (←/→ arrows to switch)
6. Apply buttons within each tab
7. Draft preview sections
8. Export buttons
```

### Screen Reader Support

```html
<button
  aria-label="Generate resume for Pfizer Digital Solutions position"
  aria-describedby="generation-status"
  aria-busy="false"
>
  Generate Resume
</button>

<div id="generation-status" role="status" aria-live="polite">
  Ready to generate
</div>

<section aria-label="AI generated summary" role="region">
  <h2>Summary</h2>
  <p>Motivated Computer Science student...</p>
  <button aria-label="Apply AI-generated summary to your draft">
    Apply Summary
  </button>
</section>
```

### Focus Management

- **After generation**: Focus moves to AI Results panel
- **After applying**: Focus moves to updated section in draft
- **Modal open**: Focus trapped in modal, ESC to close
- **Error state**: Focus moves to error message + retry button

---

## Testing Strategy

### Unit Tests

```typescript
describe("useResumeDraftsV2", () => {
  it("should apply summary to active draft", () => {
    const { result } = renderHook(() => useResumeDraftsV2());
    act(() => {
      result.current.applySummary("New summary text");
    });
    expect(result.current.activeDraft.content.summary).toBe("New summary text");
  });

  it("should support undo after applying", () => {
    const { result } = renderHook(() => useResumeDraftsV2());
    const originalSummary = result.current.activeDraft.content.summary;
    act(() => {
      result.current.applySummary("New summary");
      result.current.undo();
    });
    expect(result.current.activeDraft.content.summary).toBe(originalSummary);
  });
});
```

### Integration Tests

```typescript
describe("Resume Generation Flow", () => {
  it("should generate and apply all sections", async () => {
    render(<ResumeEditorV2 />);

    // Select job
    await userEvent.selectOptions(screen.getByLabelText("Select Job"), "job-7");

    // Generate
    await userEvent.click(screen.getByText("Generate Resume"));

    // Wait for generation
    await waitFor(() => {
      expect(screen.getByText(/Generated successfully/i)).toBeInTheDocument();
    });

    // Apply all
    await userEvent.click(screen.getByText("Apply All Sections"));

    // Verify draft updated
    expect(
      screen.getByText(/Motivated Computer Science student/i)
    ).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
test("complete resume generation workflow", async ({ page }) => {
  await page.goto("/ai/resume");

  // Select job
  await page.selectOption('select[aria-label="Select Job"]', "7");

  // Generate
  await page.click('button:has-text("Generate Resume")');

  // Wait for completion
  await page.waitForSelector("text=Generated successfully", { timeout: 30000 });

  // Verify all tabs have content
  await page.click('button:has-text("Summary")');
  await expect(page.locator("text=Motivated Computer Science")).toBeVisible();

  await page.click('button:has-text("Skills")');
  await expect(page.locator("text=JavaScript")).toBeVisible();

  // Apply all
  await page.click('button:has-text("Apply All Sections")');

  // Verify success
  await expect(
    page.locator("text=All sections applied successfully")
  ).toBeVisible();

  // Export PDF
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Export PDF")'),
  ]);
  expect(download.suggestedFilename()).toContain(".pdf");
});
```

---

## Migration Plan

### Phase 1: Build New Components (Tasks 5-9)

- Create new components in separate files
- Don't touch existing GenerateResume page yet
- Build and test in isolation (Storybook/isolated route)

### Phase 2: Implement State Management (Task 10)

- Create `useResumeDraftsV2` Zustand store
- Implement undo/redo
- Add localStorage persistence with versioning

### Phase 3: Wire Up New UI (Tasks 11-12)

- Connect new components to state
- Add loading states and error handling
- Implement E2E tests

### Phase 4: Replace Old UI (Task 14)

- Create new route `/ai/resume-v2`
- Test thoroughly
- Switch default route to new version
- Keep old version at `/ai/resume-legacy` for 1 sprint

### Phase 5: Cleanup (Task 14-15)

- Remove old components after 1 sprint
- Update docs
- Final polish and accessibility audit

---

## Success Metrics

### User Experience

- ✅ Generate → Apply → Export in < 5 clicks
- ✅ No navigation between steps required
- ✅ Clear visual feedback at every stage
- ✅ Zero confusion about what's applied vs pending

### Performance

- ✅ Generation completes in < 20 seconds
- ✅ Apply actions feel instant (< 100ms perceived)
- ✅ Page loads in < 2 seconds
- ✅ No UI jank during animations

### Quality

- ✅ 90%+ test coverage for new components
- ✅ Zero TypeScript errors
- ✅ WCAG AA accessibility compliance
- ✅ Mobile responsive down to 320px width

---

## Open Questions / Decisions Needed

1. **Template Integration**: Should template selection happen before or after generation?

   - **Recommendation**: After generation, before export (styling doesn't affect content)

2. **Auto-Apply**: Should we auto-apply sections after generation?

   - **Recommendation**: No, require explicit "Apply All" click (safer, more control)

3. **Version History**: How many undo levels to support?

   - **Recommendation**: 10 levels (balance memory vs usefulness)

4. **Draft Naming**: Auto-generate names or require user input?

   - **Recommendation**: Auto-generate (e.g., "Resume for [Job Title] - [Date]"), allow rename

5. **Multiple Drafts**: Support multiple drafts or single active draft?
   - **Recommendation**: Multiple drafts, quick switcher dropdown (like VS Code tabs)

---

## Next Steps

1. ✅ Review this design doc with team
2. Get feedback on layout and user flows
3. Create visual mockups in Figma (optional, can use ASCII wireframes)
4. Start implementation (Task 5: GenerationPanel component)

---

**Document Version**: 1.0
**Last Updated**: November 9, 2025
**Author**: AI Assistant + Development Team
**Status**: Ready for Review
