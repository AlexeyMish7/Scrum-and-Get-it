# Unified Jobs Workspace - Implementation Plan

**Created**: November 17, 2025
**Lead**: Development Team
**Timeline**: 18 days (3 weeks sprint)
**Priority**: High

---

## 📊 Overview

This document outlines the step-by-step implementation plan for transforming the Jobs workspace into a unified, AI-powered application with improved navigation and deep integration between Pipeline, Analytics, Documents, and Profile.

---

## 🎯 Goals

1. **Unified Experience**: Single layout with tab navigation (no modal clutter)
2. **Always-Visible Calendar**: Persistent right sidebar across all views
3. **AI-Powered**: Job import, matching, and document generation
4. **Deep Integration**: Profile ↔ Jobs ↔ Documents ↔ Analytics
5. **Better UX**: Cleaner navigation, context-aware actions, smooth transitions

---

## 📅 Implementation Phases

### **Phase 1: Foundation & Layout** (Days 1-3)

#### Day 1: File Structure & Layout Component

**Tasks**:

1. Create new directory structure:

   ```
   jobs/
   ├── layouts/UnifiedJobsLayout.tsx
   ├── navigation/JobsNavBar.tsx
   ├── views/ (empty structure)
   └── widgets/CalendarWidget/
   ```

2. Build `UnifiedJobsLayout.tsx`:

   - 3-column grid layout (nav | content | calendar)
   - Responsive breakpoints
   - View switching logic
   - State management for active view

3. Extract `CalendarWidget` from AnalyticsPanel:
   - Combine `DeadlineCalendar` + `NextDeadlinesWidget`
   - Add collapse/expand with localStorage
   - Make responsive (hide on mobile by default)
   - Auto-update when jobs change

**Files Created**:

- `layouts/UnifiedJobsLayout.tsx` (~200 lines)
- `widgets/CalendarWidget/CalendarWidget.tsx` (~150 lines)
- `widgets/CalendarWidget/index.ts`

**Files Modified**:

- None yet (building new structure)

**Testing**:

- Layout renders with 3 columns
- Calendar widget displays correctly
- Responsive behavior works
- Calendar updates when jobs prop changes

---

#### Day 2: Navigation System

**Tasks**:

1. Build `JobsNavBar.tsx`:

   - Vertical tab bar with 4 items (Pipeline/Analytics/Documents/Profile)
   - Active state styling
   - Keyboard shortcuts (1, 2, 3, 4)
   - Icons from MUI Icons
   - Tooltip labels
   - Mobile: horizontal bottom nav

2. Create navigation types:

   ```typescript
   type JobsView = "pipeline" | "analytics" | "documents" | "profile";

   interface NavItem {
     id: JobsView;
     label: string;
     icon: React.ReactNode;
     shortcut: string;
   }
   ```

3. Integrate nav with layout:
   - Click handling
   - Keyboard event listeners
   - URL sync (update route on nav)
   - Highlight active view

**Files Created**:

- `navigation/JobsNavBar.tsx` (~150 lines)
- `navigation/types.ts` (~30 lines)
- `navigation/index.ts`

**Files Modified**:

- `layouts/UnifiedJobsLayout.tsx` (add nav integration)

**Testing**:

- Clicking nav items changes view
- Keyboard shortcuts work (1-4)
- Active state highlights correctly
- URL updates on navigation
- Mobile nav shows at bottom

---

#### Day 3: Routing & View Placeholders

**Tasks**:

1. Update `router.tsx`:

   ```typescript
   {
     path: "jobs",
     element: <JobsLayout />,
     children: [
       { index: true, element: <Navigate to="pipeline" replace /> },
       { path: "pipeline", element: <PipelineView /> },
       { path: "analytics", element: <AnalyticsView /> },
       { path: "documents", element: <DocumentsView /> },
       { path: "profile", element: <ProfileView /> },
       { path: ":id", element: <JobDetailsOverlay /> },
     ]
   }
   ```

2. Create placeholder views (empty shells):

   - `views/PipelineView/PipelineView.tsx`
   - `views/AnalyticsView/AnalyticsView.tsx`
   - `views/DocumentsView/DocumentsView.tsx`
   - `views/ProfileView/ProfileView.tsx`

3. Wire up `UnifiedJobsLayout` to render `<Outlet />`:
   - Layout provides shared context
   - Views render in center column
   - Calendar persists across view changes

**Files Created**:

- `views/PipelineView/PipelineView.tsx` (placeholder)
- `views/AnalyticsView/AnalyticsView.tsx` (placeholder)
- `views/DocumentsView/DocumentsView.tsx` (placeholder)
- `views/ProfileView/ProfileView.tsx` (placeholder)

**Files Modified**:

- `frontend/src/router.tsx` (update jobs routes)
- `layouts/UnifiedJobsLayout.tsx` (add Outlet)
- `JobsLayout.tsx` (update to use UnifiedJobsLayout)

**Testing**:

- Navigate to /jobs → redirects to /jobs/pipeline
- All 4 routes render correct placeholder
- Navigation between routes works
- Calendar persists across routes
- Back/forward browser buttons work

---

### **Phase 2: Migrate Existing Views** (Days 4-7)

#### Day 4: Pipeline View Migration

**Tasks**:

1. Copy `PipelinePage.tsx` → `PipelineView.tsx`:

   - Remove `<Box>` wrapper (layout handles spacing)
   - Remove AnalyticsPanel (now separate view)
   - Remove DocumentsDrawer (now separate view)
   - Keep JobFormDialog (enhanced later)
   - Keep drag-and-drop kanban
   - Keep JobSearchFilters

2. Add compact stats header:

   - Total jobs count
   - This week's applications
   - Interview rate (quick metric)
   - "Add Job" button (primary action)

3. Extract `JobCard.tsx` to components:
   - Add match score badge (placeholder for now)
   - Add quick action buttons (placeholder)
   - Keep existing functionality

**Files Created**:

- `views/PipelineView/PipelineView.tsx` (~700 lines)
- `views/PipelineView/PipelineHeader.tsx` (~100 lines)
- `components/JobCard/JobCard.tsx` (enhanced)

**Files Modified**:

- `pages/PipelinePage/PipelinePage.tsx` (mark deprecated)

**Testing**:

- Kanban board renders correctly
- Drag-and-drop works
- Filters work
- Add job dialog opens
- Stats header shows correct data

---

#### Day 5: Analytics View Migration

**Tasks**:

1. Create `AnalyticsView.tsx`:

   - Full-page analytics dashboard
   - No expandable panel (always expanded)
   - Sections:
     - Interview funnel (4 cards)
     - Application funnel table
     - Company/Industry tables
     - Volume chart
     - Benchmarks
     - Goals & Progress
     - Export CSV button

2. Extract sub-components:

   - `InterviewFunnel.tsx` (4 conversion cards)
   - `VolumeChart.tsx` (12-week bar chart)
   - `GoalsTracker.tsx` (weekly goal + progress)

3. Remove from AnalyticsPanel:
   - Deadlines widget (now in calendar)
   - Calendar (now in sidebar)
   - Compact header (full page now)

**Files Created**:

- `views/AnalyticsView/AnalyticsView.tsx` (~400 lines)
- `views/AnalyticsView/InterviewFunnel.tsx` (~150 lines)
- `views/AnalyticsView/VolumeChart.tsx` (~100 lines)
- `views/AnalyticsView/GoalsTracker.tsx` (~100 lines)

**Files Modified**:

- `components/AnalyticsPanel/` (mark deprecated)

**Testing**:

- Analytics view renders all sections
- Charts display correctly
- Export CSV works
- Goals can be saved
- Data updates when jobs change

---

#### Day 6: Documents View Migration

**Tasks**:

1. Create `DocumentsView.tsx`:

   - Full-page documents library
   - Tabs: Resumes | Cover Letters | All Documents
   - Grid/List view toggle
   - Sort by: Date, Job, Type
   - Search/filter documents

2. Build `DocumentCard.tsx`:

   - Document preview (icon based on type)
   - Metadata (created date, file size, job association)
   - Actions (download, delete, link to job)
   - Version indicator

3. Add bulk operations:

   - Select multiple documents
   - Bulk download (zip)
   - Bulk delete with confirmation

4. Integrate with job_materials table:
   - Show which documents are linked to which jobs
   - Quick-link unlinked documents

**Files Created**:

- `views/DocumentsView/DocumentsView.tsx` (~350 lines)
- `views/DocumentsView/DocumentCard.tsx` (~150 lines)
- `views/DocumentsView/DocumentFilters.tsx` (~100 lines)

**Files Modified**:

- `components/DocumentsDrawer/` (mark deprecated)

**Testing**:

- Documents list displays correctly
- Tabs switch between types
- Download works
- Delete works with confirmation
- Job linking works
- Bulk operations work

---

#### Day 7: Profile View Creation

**Tasks**:

1. Create `ProfileView.tsx` (new):

   - Jobs context profile display
   - Sections:
     - Profile Summary (name, title, experience level, industry)
     - Skills (with proficiency bars)
     - Employment History (timeline view)
     - Education
     - Certifications
     - Profile Completion % (circular progress)

2. Build `ProfileSummary.tsx`:

   - Avatar
   - Key stats (total skills, years experience, applications)
   - Profile strength indicator
   - Quick edit button

3. Add `QuickEditForm.tsx`:

   - Inline editing for skills
   - Add new skill with autocomplete
   - Edit experience (job title, company, dates)
   - Auto-save with debounce

4. Show profile impact:
   - "Jobs matching your skills: X"
   - "Top skill gaps for target jobs: Y, Z"
   - "Profile updated → recalculating matches..."

**Files Created**:

- `views/ProfileView/ProfileView.tsx` (~400 lines)
- `views/ProfileView/ProfileSummary.tsx` (~150 lines)
- `views/ProfileView/QuickEditForm.tsx` (~200 lines)
- `views/ProfileView/SkillsSection.tsx` (~150 lines)

**Testing**:

- Profile data displays correctly
- Quick edit works
- Skills can be added/removed
- Profile completion % updates
- Job match stats show correctly

---

### **Phase 3: AI Features** (Days 8-12)

#### Day 8: AI Job Import - Backend

**Tasks**:

1. Install dependencies:

   ```bash
   cd server
   npm install puppeteer openai
   ```

2. Create `server/src/routes/jobs/import.ts`:

   - POST /api/jobs/import
   - Accept `{ url: string }`
   - Fetch URL with axios (mimic browser headers)
   - Extract text content
   - Send to OpenAI for structured extraction
   - Return extracted job data

3. Create AI extraction prompt:

   ```typescript
   const extractionPrompt = `
   Extract job details from this job posting:
   
   ${htmlContent}
   
   Return JSON:
   {
     "job_title": string,
     "company_name": string,
     "location": { "city": string, "state": string },
     "salary_range": { "min": number, "max": number } | null,
     "description": string (first 2000 chars),
     "application_deadline": "YYYY-MM-DD" | null,
     "job_type": "Full-time" | "Part-time" | "Contract" | "Internship",
     "industry": string,
     "required_skills": string[]
   }
   `;
   ```

4. Add error handling:
   - URL invalid
   - Site blocks request
   - AI extraction fails
   - Timeout (30s max)

**Files Created**:

- `server/src/routes/jobs/import.ts` (~300 lines)
- `server/src/services/aiExtractor.ts` (~150 lines)
- `server/src/utils/urlFetcher.ts` (~100 lines)

**Testing**:

- Test with LinkedIn job URL
- Test with Indeed job URL
- Test with company career page
- Test error cases (404, timeout, blocked)
- Verify AI extraction accuracy

---

#### Day 9: AI Job Import - Puppeteer Fallback

**Tasks**:

1. Create `server/src/services/puppeteerScraper.ts`:

   - Launch headless Chrome
   - Navigate to URL
   - Wait for page load (networkidle2)
   - Extract innerHTML
   - Close browser
   - Return HTML for AI processing

2. Add smart fallback logic:

   ```typescript
   async function importJob(url: string) {
     try {
       // Try fast method first
       const html = await fetchURL(url);
       const extracted = await extractWithAI(html);
       return { ...extracted, method: "fast" };
     } catch (err) {
       // Fallback to puppeteer
       const html = await scrapWithPuppeteer(url);
       const extracted = await extractWithAI(html);
       return { ...extracted, method: "fallback" };
     }
   }
   ```

3. Add request queue:

   - Limit concurrent Puppeteer instances (max 3)
   - Queue requests if limit reached
   - Timeout queued requests after 2 minutes

4. Add caching:
   - Cache extracted data for 24 hours
   - If same URL requested again, return cached data
   - Include cache status in response

**Files Created**:

- `server/src/services/puppeteerScraper.ts` (~200 lines)
- `server/src/utils/requestQueue.ts` (~100 lines)
- `server/src/utils/cache.ts` (~80 lines)

**Testing**:

- Test with JavaScript-heavy sites
- Test queue system under load
- Test cache hits
- Monitor memory usage with Puppeteer
- Test cleanup (browser instances closed)

---

#### Day 10: AI Job Import - Frontend Integration

**Tasks**:

1. Create `features/job-import/useJobImport.ts`:

   - Hook for AI import
   - Call backend /api/jobs/import
   - Handle loading/error states
   - Return extracted data

2. Enhance `JobFormDialog`:

   - Add URL input field at top
   - "Import from URL" button
   - Loading spinner during extraction
   - Success: auto-populate all fields
   - Error: show error message, allow manual entry
   - Preview extracted data before save

3. Add extraction feedback:

   - Show extraction method (fast/fallback/cached)
   - Show confidence score
   - Highlight which fields were auto-filled
   - Allow editing before save

4. Add analytics:
   - Track import success rate
   - Track extraction methods used
   - Track user edits to extracted data

**Files Created**:

- `features/job-import/useJobImport.ts` (~150 lines)
- `features/job-import/AIExtractor.tsx` (~200 lines)
- `features/job-import/URLInput.tsx` (~100 lines)

**Files Modified**:

- `components/JobFormDialog/JobFormDialog.tsx` (add URL import section)

**Testing**:

- Import job from various URLs
- Test loading states
- Test error handling
- Test manual edit after import
- Verify saved data is correct

---

#### Day 11: AI Resume-Job Matching - Backend

**Tasks**:

1. Create `server/src/routes/jobs/{id}/match.ts`:

   - POST /api/jobs/:id/match
   - Fetch job details
   - Fetch user profile (skills, experience, education)
   - Send to AI for analysis
   - Return match breakdown

2. Create matching prompt:

   ```typescript
   const matchPrompt = `
   Analyze how well this candidate matches the job:
   
   JOB:
   ${JSON.stringify(job)}
   
   CANDIDATE:
   ${JSON.stringify(profile)}
   
   Return JSON:
   {
     "overallScore": 0-100,
     "skillsMatch": 0-100,
     "experienceMatch": 0-100,
     "educationMatch": 0-100,
     "matchingSkills": ["React", "TypeScript"],
     "missingSkills": ["AWS", "Docker"],
     "recommendations": [
       "Add Docker to skills section",
       "Highlight cloud experience in resume"
     ]
   }
   `;
   ```

3. Add caching:
   - Cache match results for 1 hour
   - Invalidate when profile changes
   - Include cache timestamp in response

**Files Created**:

- `server/src/routes/jobs/{id}/match.ts` (~150 lines)
- `server/src/services/aiMatcher.ts` (~200 lines)

**Testing**:

- Test with various job/profile combinations
- Verify score accuracy
- Test caching behavior
- Test cache invalidation on profile update

---

#### Day 12: AI Matching - Frontend Integration

**Tasks**:

1. Create `features/job-matching/useAIMatching.ts`:

   - Hook to fetch match scores
   - Load on demand (not all jobs at once)
   - Cache in local state

2. Add `MatchScoreBadge.tsx` to job cards:

   - Circular badge with score (85%)
   - Color-coded (green/yellow/orange/red)
   - Tooltip with quick details
   - Click → open full match panel

3. Create `MatchDetailsPanel.tsx`:

   - Full breakdown of match score
   - Skills comparison table
   - Missing skills with priority
   - Recommendations list
   - "Update Profile" action buttons

4. Add match scores to PipelineView:
   - Badge on each job card
   - Sort by match score option
   - Filter by score range (>80%, >60%, etc.)

**Files Created**:

- `features/job-matching/useAIMatching.ts` (~100 lines)
- `features/job-matching/MatchScoreBadge.tsx` (~80 lines)
- `features/job-matching/MatchDetailsPanel.tsx` (~250 lines)

**Files Modified**:

- `components/JobCard/JobCard.tsx` (add match badge)
- `views/PipelineView/PipelineView.tsx` (add sort/filter by match)

**Testing**:

- Match scores display correctly
- Colors match score ranges
- Details panel shows full analysis
- Sorting by match works
- Filtering by match works

---

### **Phase 4: Polish & Optimization** (Days 13-15)

#### Day 13: UI/UX Refinements

**Tasks**:

1. Design system consistency:

   - Consistent card styles across all views
   - Unified color palette (status, urgency, match)
   - Consistent spacing (8px grid)
   - Typography scale (h1-h6, body1-2, caption)

2. Transitions & animations:

   - View switching: 200ms fade + slide
   - Calendar expand: 300ms ease
   - Match score updates: pulse animation
   - Job card drag: shadow elevation
   - Loading states: skeleton screens

3. Mobile responsiveness:

   - Breakpoints: 768px, 1024px, 1440px
   - Mobile: hide calendar by default, show toggle
   - Mobile: bottom nav instead of side nav
   - Mobile: stack sections vertically
   - Touch-friendly hit targets (44px min)

4. Accessibility:
   - ARIA labels for all interactive elements
   - Keyboard navigation (tab order)
   - Focus indicators
   - Screen reader announcements
   - Color contrast ratios (WCAG AA)

**Files Modified**:

- All view components (styling updates)
- All widget components (responsive updates)
- `navigation/JobsNavBar.tsx` (accessibility)

**Testing**:

- Test on various screen sizes
- Test with keyboard only
- Test with screen reader
- Verify color contrast
- Check animation performance

---

#### Day 14: Performance Optimizations

**Tasks**:

1. Code splitting:

   - Lazy load each view component
   - Lazy load AI features
   - Lazy load chart libraries
   - Lazy load Puppeteer (backend)

2. React Query integration:

   - Cache jobs data
   - Automatic refetch on window focus
   - Optimistic updates for job status
   - Background refetch every 5 minutes
   - Infinite scrolling for large job lists

3. Memoization:

   - React.memo for expensive components
   - useMemo for calculated data
   - useCallback for event handlers
   - Virtualized lists (react-window)

4. Bundle optimization:
   - Tree-shaking unused code
   - Dynamic imports for routes
   - Compress images
   - Minify CSS/JS
   - Enable gzip compression

**Files Created**:

- `hooks/useJobs.ts` (React Query wrapper)
- `hooks/useJobMutations.ts` (create/update/delete)

**Files Modified**:

- All view components (add React.memo, lazy loading)
- `router.tsx` (lazy load routes)

**Testing**:

- Lighthouse performance audit (target: >90)
- Bundle size check (target: <500KB)
- Time to interactive (target: <3s)
- First contentful paint (target: <1.5s)
- Memory leaks check

---

#### Day 15: Error Handling & Loading States

**Tasks**:

1. Comprehensive error handling:

   - Network errors (offline, timeout)
   - API errors (400, 401, 403, 404, 500)
   - AI errors (rate limit, extraction failed)
   - User-friendly error messages
   - Retry logic with exponential backoff

2. Loading states:

   - Skeleton screens for initial load
   - Progress indicators for AI operations
   - Inline spinners for quick actions
   - Optimistic UI updates
   - Stale-while-revalidate strategy

3. Empty states:

   - No jobs yet (onboarding)
   - No documents (prompt to generate)
   - No analytics data (need more jobs)
   - Filtered results empty (adjust filters)
   - Helpful CTAs in each empty state

4. Validation:
   - Form validation (required fields)
   - URL validation (valid URL format)
   - Date validation (deadline not in past)
   - File upload validation (size, type)
   - Real-time validation feedback

**Files Created**:

- `components/EmptyStates/NoJobsYet.tsx`
- `components/EmptyStates/NoDocuments.tsx`
- `components/LoadingStates/SkeletonJobCard.tsx`
- `hooks/useErrorHandler.ts` (enhanced)

**Testing**:

- Trigger all error scenarios
- Verify error messages are clear
- Test retry logic
- Test optimistic updates
- Verify validation works

---

### **Phase 5: Testing & Documentation** (Days 16-18)

#### Day 16: Unit & Integration Tests

**Tasks**:

1. Unit tests:

   - AI extraction logic
   - AI matching logic
   - Calendar widget logic
   - Navigation logic
   - Form validation

2. Integration tests:

   - Job import flow (URL → save)
   - Match score calculation
   - Document generation flow
   - View switching
   - Calendar updates on job change

3. API tests:

   - All endpoints (import, match, CRUD)
   - Error responses
   - Rate limiting
   - Caching behavior

4. React component tests:
   - JobsNavBar (navigation, shortcuts)
   - CalendarWidget (events, clicks)
   - JobCard (actions, drag)
   - All view components (render, interactions)

**Files Created**:

- `__tests__/services/aiExtractor.test.ts`
- `__tests__/services/aiMatcher.test.ts`
- `__tests__/components/JobsNavBar.test.tsx`
- `__tests__/views/PipelineView.test.tsx`
- `__tests__/integration/jobImport.test.ts`

**Testing**:

- Run all tests: `npm test`
- Check coverage: `npm run test:coverage`
- Target: >80% coverage

---

#### Day 17: E2E Tests & Documentation

**Tasks**:

1. E2E tests (Playwright):

   - Complete job lifecycle (add → track → apply → offer)
   - AI import from URL
   - Generate resume for job
   - View switching and navigation
   - Mobile responsive tests

2. Create documentation:

   - Architecture overview (UNIFIED_JOBS_ARCHITECTURE.md)
   - Implementation guide (this document)
   - User guide (how to use new features)
   - API documentation (endpoints, schemas)
   - Migration guide (from old to new)

3. Update README:
   - New file structure
   - AI features overview
   - Keyboard shortcuts
   - Development guide

**Files Created**:

- `e2e/jobs-workflow.spec.ts`
- `docs/jobs/USER_GUIDE.md`
- `docs/jobs/API_DOCUMENTATION.md`
- `docs/jobs/MIGRATION_GUIDE.md`

**Testing**:

- Run E2E tests: `npm run e2e`
- Manual testing on staging
- Cross-browser testing (Chrome, Firefox, Safari)

---

#### Day 18: Final Testing & Deployment Prep

**Tasks**:

1. Complete system testing:

   - All navigation flows
   - All AI features
   - All CRUD operations
   - Performance under load
   - Security review (AI endpoints)

2. Bug fixes:

   - Fix issues found in testing
   - Polish UI/UX issues
   - Performance bottlenecks

3. Deployment preparation:

   - Feature flag configuration
   - Database migrations (if any)
   - Environment variables documentation
   - Rollback plan
   - Monitoring setup (error tracking, analytics)

4. Release notes:
   - New features list
   - Breaking changes (if any)
   - Migration steps for users
   - Known issues

**Deliverables**:

- ✅ All tests passing
- ✅ Documentation complete
- ✅ Staging environment tested
- ✅ Release notes published
- ✅ Team demo completed

---

## 🚨 Risk Management

### **High Risk**

1. **AI Extraction Accuracy**

   - Mitigation: Extensive testing, manual review option, confidence scores
   - Fallback: Allow manual entry if AI fails

2. **Puppeteer Performance**

   - Mitigation: Request queue, limits, caching
   - Fallback: Show error, suggest manual entry

3. **Breaking Changes**
   - Mitigation: Feature flag, gradual rollout
   - Fallback: Keep old code available

### **Medium Risk**

1. **Mobile Responsiveness**

   - Mitigation: Test on real devices, multiple screen sizes

2. **Performance Degradation**

   - Mitigation: Lazy loading, code splitting, monitoring

3. **User Adoption**
   - Mitigation: User guide, tooltips, onboarding

---

## 📈 Success Metrics

### **Launch Week**

- [ ] > 50% of active users try new navigation
- [ ] > 20 AI job imports completed
- [ ] > 10 resume/cover letter generations
- [ ] <5 bug reports
- [ ] User satisfaction: >4/5 stars

### **Month 1**

- [ ] > 80% of users switched to new layout
- [ ] AI import success rate >80%
- [ ] Match score accuracy >75% (user feedback)
- [ ] > 50 documents generated
- [ ] Page load time <2s (p95)

---

## 🎯 Rollout Strategy

### **Phase A: Internal Testing** (Days 1-3 post-completion)

- Team members test all features
- Fix critical bugs
- Gather feedback

### **Phase B: Beta Users** (Days 4-7)

- Invite 10-20 beta users
- Monitor usage and errors
- Iterate based on feedback

### **Phase C: Gradual Rollout** (Days 8-14)

- 25% of users (feature flag)
- Monitor metrics
- Increase to 50%, then 75%

### **Phase D: Full Launch** (Day 15)

- 100% of users
- Announce new features
- Celebrate! 🎉

---

## 📝 Notes

- Keep old files as `*.deprecated.tsx` for rollback
- Monitor AI costs closely (OpenAI usage)
- Gather user feedback continuously
- Iterate on AI prompts based on accuracy
- Document all decisions and trade-offs

---

**Status**: Ready to Begin Implementation ✅
**Next Step**: Day 1 - Create file structure and UnifiedJobsLayout
