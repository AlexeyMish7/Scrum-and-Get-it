# Unified Jobs Workspace Architecture

**Date**: November 17, 2025
**Status**: 🔄 In Progress
**Goal**: Create cohesive, AI-powered job search experience with unified navigation

---

## 🎯 Vision

Transform the Jobs workspace from a collection of separate pages into a **unified, intelligent application** where:

- Pipeline, Analytics, Documents, and Profile work together seamlessly
- Calendar is always visible (not buried in analytics)
- AI assists at every step (job import, matching, document generation)
- Navigation is intuitive with minimal button clutter
- User's profile data directly influences job recommendations and application materials

---

## 🏗️ New Architecture

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Jobs Workspace                                              [User]  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┬────────────────────────────────────┬──────────────┐  │
│  │          │                                    │              │  │
│  │  Mini    │         Main Content Area          │   Calendar   │  │
│  │  Nav     │                                    │   Widget     │  │
│  │          │  ┌──────────────────────────────┐  │              │  │
│  │ Pipeline │  │                              │  │ ┌──────────┐ │  │
│  │ Analytic │  │  PipelineView (Kanban)       │  │ │  Nov 25  │ │  │
│  │ Document │  │  OR                           │  │ │  Deadl.  │ │  │
│  │ Profile  │  │  AnalyticsView (Charts)      │  │ │          │ │  │
│  │          │  │  OR                           │  │ │  [Jobs]  │ │  │
│  │ [1-4]    │  │  DocumentsView (Files)       │  │ │          │ │  │
│  │          │  │  OR                           │  │ │ Calendar │ │  │
│  │          │  │  ProfileView (User Data)     │  │ │  Grid    │ │  │
│  │          │  │                              │  │ │          │ │  │
│  │          │  └──────────────────────────────┘  │ │ [Expand] │ │  │
│  │          │                                    │ └──────────┘ │  │
│  └──────────┴────────────────────────────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### **Key Changes**

1. **Left Mini-Nav** (replaces modal buttons)

   - Vertical tab bar: Pipeline | Analytics | Documents | Profile
   - Keyboard shortcuts: 1, 2, 3, 4
   - Visual indicator for active view
   - Icons + labels, collapsible on mobile

2. **Center Content** (single view at a time)

   - Clean, focused workspace
   - Smooth transitions between views
   - No overlapping modals/drawers
   - Full screen real estate for current task

3. **Right Calendar Widget** (persistent)
   - Always visible across ALL views
   - Shows upcoming deadlines
   - Click job → open details in right drawer
   - Collapsible with localStorage memory
   - Live updates when jobs change

---

## 📁 New File Structure

```
frontend/src/app/workspaces/jobs/
├── JobsLayout.tsx                 # Root layout with 3-column grid
│
├── layouts/
│   └── UnifiedJobsLayout.tsx      # Main 3-column layout component
│
├── navigation/
│   ├── JobsNavBar.tsx             # Left mini-nav (Pipeline/Analytics/Docs/Profile)
│   └── types.ts                   # Navigation types
│
├── views/
│   ├── PipelineView/
│   │   ├── PipelineView.tsx       # Kanban board (from PipelinePage)
│   │   ├── PipelineHeader.tsx     # Quick stats, filters, add job
│   │   └── JobCard.tsx            # Enhanced with AI match score
│   │
│   ├── AnalyticsView/
│   │   ├── AnalyticsView.tsx      # Full analytics dashboard
│   │   ├── InterviewFunnel.tsx    # Interview conversion metrics
│   │   ├── VolumeChart.tsx        # Application volume
│   │   └── GoalsTracker.tsx       # Weekly goals & progress
│   │
│   ├── DocumentsView/
│   │   ├── DocumentsView.tsx      # All resumes/cover letters
│   │   ├── DocumentCard.tsx       # Document preview card
│   │   └── DocumentHistory.tsx    # Version history
│   │
│   └── ProfileView/
│       ├── ProfileView.tsx        # User profile in jobs context
│       ├── ProfileSummary.tsx     # Quick stats, completion %
│       └── QuickEditForm.tsx      # Inline editing
│
├── widgets/
│   ├── CalendarWidget/
│   │   ├── CalendarWidget.tsx     # Persistent right-side calendar
│   │   ├── MonthGrid.tsx          # Calendar grid
│   │   └── DeadlineList.tsx       # Upcoming 5 deadlines
│   │
│   └── QuickActions/
│       ├── QuickActionsBar.tsx    # Context-aware action buttons
│       └── AIActionButton.tsx     # AI-powered suggestions
│
├── features/
│   ├── job-import/
│   │   ├── JobImportDialog.tsx    # Enhanced with AI extraction
│   │   ├── URLInput.tsx           # URL field with validation
│   │   ├── AIExtractor.tsx        # AI extraction UI
│   │   └── useJobImport.ts        # Hook for AI import logic
│   │
│   ├── job-matching/
│   │   ├── MatchScoreBadge.tsx    # Display match score on cards
│   │   ├── MatchDetailsPanel.tsx  # Detailed match breakdown
│   │   └── useAIMatching.ts       # AI matching logic
│   │
│   └── quick-generate/
│       ├── GenerateResumeButton.tsx
│       ├── GenerateCoverButton.tsx
│       └── useQuickGenerate.ts
│
├── components/                    # Shared components
│   ├── JobDetails/                # (existing)
│   ├── JobSearchFilters/          # (existing)
│   └── ...                        # (other existing)
│
├── services/
│   ├── jobsService.ts             # (existing)
│   ├── aiImportService.ts         # NEW: AI job import
│   ├── aiMatchingService.ts       # NEW: AI matching
│   └── ...
│
└── pages/                         # DEPRECATED (move to views/)
```

---

## 🤖 AI Features Integration

### 1. **AI Job Import** (UC-041 Enhanced)

**User Flow**:

1. Click "Add Job" in Pipeline view
2. JobImportDialog opens
3. **Option 1: Paste URL** → AI extracts all fields
4. **Option 2: Manual entry** → Traditional form
5. Review extracted data, edit if needed
6. Save

**Backend Architecture**:

```
POST /api/jobs/import
{
  "url": "https://linkedin.com/jobs/view/123456"
}

Response:
{
  "success": true,
  "data": {
    "job_title": "Senior React Developer",
    "company_name": "TechCorp Inc",
    "location": { "city": "San Francisco", "state": "CA" },
    "salary_range": { "min": 120000, "max": 180000 },
    "description": "...",
    "application_deadline": "2025-12-15",
    "job_type": "Full-time",
    "industry": "Technology"
  },
  "confidence": 0.95,
  "extraction_method": "ai" | "fallback" | "error"
}
```

**Implementation Strategy**:

- **Phase 1**: Direct HTTP fetch with AI parsing (fast, cheap)
- **Phase 2**: Puppeteer fallback for JS-heavy sites (slower, reliable)
- **Phase 3**: Third-party API integration (ScrapingBee, etc.)

### 2. **AI Resume-Job Matching** (UC-065 Enhanced)

**Displayed On**:

- Job cards in Pipeline view (badge: 85% match)
- Job details panel (full breakdown)
- Analytics view (distribution chart)

**Calculation**:

```typescript
interface MatchAnalysis {
  overallScore: number; // 0-100
  skillsMatch: number; // 0-100
  experienceMatch: number; // 0-100
  educationMatch: number; // 0-100
  matchingSkills: string[]; // ["React", "TypeScript"]
  missingSkills: string[]; // ["AWS", "Docker"]
  recommendations: string[]; // ["Add Docker to skills"]
}
```

**AI Prompt**:

```
Analyze job requirements vs candidate profile:

JOB:
- Title: {job_title}
- Description: {job_description}
- Required Skills: {extracted_skills}

CANDIDATE:
- Skills: {user.skills[]}
- Experience: {user.employment[]}
- Education: {user.education[]}

Return JSON with match scores and recommendations.
```

### 3. **Quick AI Actions**

**On Job Cards**:

- 🤖 Generate Resume (one-click, uses job description + profile)
- 📝 Generate Cover Letter (one-click, includes company research)
- 🎯 Match Score Badge (hover for details)

**On Profile View**:

- ✨ Optimize Profile (AI suggests improvements based on target jobs)
- 📊 Skill Gap Analysis (compare to desired positions)
- 🔄 Refresh Match Scores (recalculate all job matches)

---

## 🗂️ Navigation & Routing

### **Routes**

```typescript
/jobs                          → Redirect to /jobs/pipeline
/jobs/pipeline                 → PipelineView (default)
/jobs/analytics                → AnalyticsView
/jobs/documents                → DocumentsView
/jobs/profile                  → ProfileView
/jobs/:id                      → Job details overlay
/jobs/:id/generate-resume      → Resume generation flow
/jobs/:id/generate-cover       → Cover letter generation flow
```

### **Navigation State**

Persist in URL params:

- `/jobs/pipeline?filter=Applied&sort=deadline`
- `/jobs/analytics?period=12weeks&metric=interviews`
- `/jobs/documents?type=resume&job=123`

### **Keyboard Shortcuts**

```
1 → Pipeline View
2 → Analytics View
3 → Documents View
4 → Profile View

A → Add Job (from Pipeline)
E → Export CSV (from Analytics)
G → Generate Resume (from job card, when focused)
C → Generate Cover Letter (from job card, when focused)
/ → Focus search/filter
Esc → Close dialogs/drawers
```

---

## 🎨 UI/UX Improvements

### **Design Principles**

1. **Minimize Buttons** → Use navigation tabs instead
2. **Context-Aware Actions** → Show only relevant buttons per view
3. **Persistent Information** → Calendar always visible
4. **Smart Defaults** → Auto-suggest next actions
5. **Progressive Disclosure** → Details on demand, not cluttered

### **Color Coding**

```
Status Colors:
- Interested:    Blue (#2196F3)
- Applied:       Purple (#9C27B0)
- Phone Screen:  Orange (#FF9800)
- Interview:     Teal (#009688)
- Offer:         Green (#4CAF50)
- Rejected:      Red (#F44336)

Urgency (Deadlines):
- Overdue:       Red background
- ≤7 days:       Orange background
- 8-14 days:     Yellow background
- >14 days:      Green badge

Match Score:
- 80-100:        Green (Excellent)
- 60-79:         Yellow (Good)
- 40-59:         Orange (Fair)
- 0-39:          Red (Poor)
```

### **Transitions**

- View switching: 200ms fade + slide
- Calendar expand/collapse: 300ms smooth
- Match score updates: Pulse animation
- Job card drag: Subtle shadow elevation

---

## 📊 Data Flow & Integration

### **Profile → Jobs Connection**

```typescript
// When user updates profile
onProfileUpdate() {
  1. Update profile in database
  2. Recalculate all AI match scores
  3. Update job cards with new scores
  4. Show notification: "Match scores updated"
}

// When adding new skill
onSkillAdded(skill) {
  1. Save skill to profile
  2. Find jobs requiring this skill
  3. Highlight improved match scores
  4. Suggest applying to newly-matched jobs
}
```

### **Job → Documents Connection**

```typescript
// When viewing job
onJobSelect(jobId) {
  1. Load job details
  2. Load associated documents (resume, cover letter)
  3. Show AI match analysis
  4. Display "Generate" buttons if no documents
}

// When generating resume
onGenerateResume(jobId) {
  1. Fetch job description
  2. Fetch user profile data
  3. Call AI to tailor resume
  4. Save as ai_artifact
  5. Link to job in job_materials
  6. Show in Documents view
}
```

### **Calendar → Jobs Integration**

```typescript
// Calendar subscribes to job changes
useEffect(() => {
  const subscription = jobsService.subscribe((jobs) => {
    const deadlines = jobs
      .filter(j => j.application_deadline)
      .sort((a, b) => a.application_deadline - b.application_deadline);

    setCalendarEvents(deadlines);
  });

  return () => subscription.unsubscribe();
}, []);

// Clicking calendar event
onDateClick(date) {
  const jobsOnDate = jobs.filter(j =>
    isSameDay(j.application_deadline, date)
  );

  if (jobsOnDate.length === 1) {
    openJobDetails(jobsOnDate[0].id);
  } else {
    showJobListDrawer(jobsOnDate);
  }
}
```

---

## 🔧 Technical Implementation

### **State Management**

Use Zustand for global job state:

```typescript
// stores/jobsStore.ts
interface JobsState {
  jobs: JobRow[];
  selectedJobId: number | null;
  activeView: "pipeline" | "analytics" | "documents" | "profile";
  filters: JobFilters;

  // Actions
  setJobs: (jobs: JobRow[]) => void;
  selectJob: (id: number | null) => void;
  switchView: (view: string) => void;
  updateJob: (id: number, updates: Partial<JobRow>) => void;
  addJob: (job: JobRow) => void;
  deleteJob: (id: number) => void;

  // AI actions
  importFromURL: (url: string) => Promise<JobRow>;
  calculateMatch: (jobId: number) => Promise<MatchAnalysis>;
  generateResume: (jobId: number) => Promise<ArtifactRow>;
}
```

### **Performance Optimizations**

1. **Lazy Load Views**: Code-split each view
2. **Virtual Scrolling**: For large job lists (react-window)
3. **Debounced Search**: 300ms delay on filter input
4. **Optimistic Updates**: Immediate UI feedback, sync in background
5. **Memoization**: React.memo for expensive components
6. **Request Caching**: React Query for API calls

### **Backend Endpoints**

```typescript
// New endpoints needed
POST   /api/jobs/import           # AI job import from URL
POST   /api/jobs/:id/match        # Calculate AI match score
POST   /api/jobs/:id/resume       # Generate tailored resume
POST   /api/jobs/:id/cover        # Generate tailored cover letter
GET    /api/jobs/:id/suggestions  # Get AI action suggestions
```

---

## 📋 Migration Checklist

### **Phase 1: Foundation** (Days 1-3)

- [ ] Create new file structure (/views, /widgets, /navigation)
- [ ] Build UnifiedJobsLayout with 3-column grid
- [ ] Extract CalendarWidget from AnalyticsPanel
- [ ] Create JobsNavBar component
- [ ] Update routing to support view switching

### **Phase 2: Views** (Days 4-7)

- [ ] Move PipelinePage → PipelineView
- [ ] Create AnalyticsView (full page, not expandable)
- [ ] Create DocumentsView (from DocumentsDrawer)
- [ ] Create ProfileView (new, jobs context)
- [ ] Wire up navigation between views

### **Phase 3: AI Features** (Days 8-12)

- [ ] Backend: AI job import endpoint
- [ ] Backend: Puppeteer fallback for scraping
- [ ] Frontend: Enhanced JobImportDialog with URL input
- [ ] Backend: AI matching service
- [ ] Frontend: Match score badges on job cards
- [ ] Frontend: Quick generate buttons

### **Phase 4: Polish** (Days 13-15)

- [ ] UI/UX refinements (transitions, colors, spacing)
- [ ] Performance optimizations (lazy loading, caching)
- [ ] Accessibility (keyboard nav, screen readers)
- [ ] Mobile responsiveness
- [ ] Error handling and loading states

### **Phase 5: Testing & Docs** (Days 16-18)

- [ ] Unit tests for AI services
- [ ] Integration tests for views
- [ ] E2E tests for navigation flows
- [ ] Documentation (architecture, usage guide)
- [ ] Migration guide for users

---

## 🎯 Success Criteria

### **User Experience**

- ✅ Can navigate between all 4 views with 1 click (nav bar)
- ✅ Calendar always visible, updates in real-time
- ✅ AI job import works for major sites (LinkedIn, Indeed, Glassdoor)
- ✅ Match scores displayed on all job cards
- ✅ Can generate resume/cover letter in ≤3 clicks

### **Technical**

- ✅ All views load in <1 second
- ✅ AI import success rate >80%
- ✅ Match score accuracy >75% (user feedback)
- ✅ Zero layout shifts during navigation
- ✅ Mobile responsive (breakpoints at 768px, 1024px)

### **Code Quality**

- ✅ TypeScript strict mode, no errors
- ✅ Test coverage >80%
- ✅ Bundle size increase <100KB
- ✅ Lighthouse score >90
- ✅ No console errors/warnings

---

## 🚀 Future Enhancements

1. **Collaborative Features**

   - Share jobs with team members
   - Peer review of resumes/cover letters
   - Application tracking for teams

2. **Advanced AI**

   - Interview preparation (mock questions based on job)
   - Salary negotiation coaching
   - Company culture fit analysis
   - Network suggestions (LinkedIn connections to leverage)

3. **Integrations**

   - Auto-apply via LinkedIn/Indeed APIs
   - Calendar sync (Google, Outlook) for interview scheduling
   - Email integration (track application responses)
   - Browser extension (quick-add jobs from any site)

4. **Analytics+**
   - Predictive analytics (which jobs likely to respond)
   - A/B testing (resume versions performance)
   - Industry trends and insights
   - Salary market analysis

---

## 📝 Notes

- Keep old files initially for reference
- Feature flag new layout for gradual rollout
- Maintain backward compatibility with existing data
- Document all AI prompts and models used
- Monitor AI costs and set usage limits
- Gather user feedback early and iterate

---

**Status**: Ready to implement Phase 1 ✅
