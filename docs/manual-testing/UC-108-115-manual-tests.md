# Manual Test Plan: UC-108 to UC-115 (Collaboration Features)

This guide describes end-to-end manual verification steps for multi-user collaboration features. Each use case includes prerequisites, step-by-step procedures, sample test data, and expected results.

- Scope: UC-108 to UC-115
- Environments: Local dev or staging
- Roles covered: Team Admin, Mentor, Candidate, Family Supporter, Enterprise Admin, External Advisor

---

## Prerequisites

- Application running locally:
  - Frontend: `http://localhost:5173`
  - Server API: `http://localhost:3001`
- Test accounts (can use plus-addressing on your email domain):
  - Team Admin: `ada.admin+team@example.com`
  - Mentor: `manny.mentor+team@example.com`
  - Candidate: `casey.candidate+team@example.com`
  - Family Supporter: `fran.family+support@example.com`
  - External Advisor: `alex.advisor+ext@example.com`
  - Enterprise Admin: `erin.enterprise+admin@example.com`
- A seeded Candidate profile exists for Casey Candidate (basic education/experience)

Notes

- Use any password policy-compliant password (e.g., `P@ssw0rd!123`).
- Where emails are sent, use an inbox you control or a mail catcher.

---

## UC-108: Team Account Management

Summary: Create team accounts, assign roles, manage access.

Sample Data

- Team name: `Atlas Coaching`
- Members:
  - Admin: Ada Admin (`ada.admin+team@example.com`)
  - Mentor: Manny Mentor (`manny.mentor+team@example.com`)
  - Candidate: Casey Candidate (`casey.candidate+team@example.com`)

Steps

1. Sign in as Ada Admin and navigate to Team workspace.
2. Create team "Atlas Coaching".
3. Invite Manny (role: Mentor) and Casey (role: Candidate).
4. Accept invitations (sign in as Manny and Casey, accept links or via notifications).
5. As Ada, open Team > Members: verify roles and status are correct.
6. As Ada, toggle Casey's access to profile and documents (on), and revoke access to billing (off).
7. As Manny, open Casey's profile and job materials; verify read access and no billing visibility.
8. As Casey, verify ability to see assigned team and revoke mentor if allowed by policy.

Expected Results

- Team created; invitations delivered and accepted.
- Role-based access enforced: Mentor sees mentee materials but not billing; Candidate sees own data.
- Access toggles reflect immediately.

---

## UC-109: Mentor Dashboard and Coaching Tools

Summary: Mentor dashboard with mentee KPIs, AI coaching insights, feedback tools, and engagement tracking.

### Sample Data

- Mentee: Casey Candidate
- Goal: "Apply to 5 roles/week"
- KPI thresholds: Applications (weekly), Interviews (monthly)

### Steps

**1. Access Mentor Dashboard**

1. Sign in as Manny (Mentor). Navigate to Team → Mentor Dashboard.
2. Verify "My Mentees" tab shows assigned candidates with:
   - Profile avatar and name
   - Engagement badge (Highly Active/Active/Low Activity/Inactive)
   - Quick stats: Total Apps, Interviewing, Offers

**2. Review Mentee Progress (KPIs)**

1. Click on Casey in mentee list.
2. Verify job stats display: total applications, interviewing, offers, rejected.
3. Check engagement level badge matches recent activity.
4. Verify "Last Active" timestamp is accurate.

**3. AI Coaching Insights**

1. Switch to "Coaching Insights" tab.
2. Click on Casey's card to generate AI insights.
3. Wait for AI to analyze mentee data (loading indicator shows).
4. Verify insights display includes:
   - Summary: Brief overall assessment
   - Key Recommendations: Actionable suggestions list
   - Focus Areas: Priority-tagged areas needing attention
   - Strengths: What mentee is doing well
   - Suggested Goals: Goals with "Create Goal" button
   - Action Plan: Week-by-week actions
   - Motivational Note: Encouraging message
5. Click "Regenerate" to get fresh insights.
6. Click "Create Goal" on a suggested goal to auto-populate goal dialog.

**4. Access Mentee Documents**

1. Return to "My Mentees" tab.
2. Click document icon on Casey's row.
3. Verify documents dialog shows:
   - Resume and cover letter list
   - Document type chips (Resume/Cover Letter)
   - Version numbers
   - Associated job info (if applicable)
   - "Give Feedback" button per document
4. Click "Give Feedback" on resume - feedback dialog opens with document context.

**5. Provide Feedback**

1. Click chat icon on any mentee.
2. Select feedback type: Application, Interview, Resume, Cover Letter, General, Goal, or Milestone.
3. Enter feedback text: "Strengthen STAR impact statements in experience section."
4. Submit feedback.
5. Switch to "Recent Feedback" tab - verify feedback appears.

**6. Create Goals & Milestones**

1. Click flag icon on mentee.
2. Create goal:
   - Type: Weekly Applications
   - Title: "Apply to 5 roles by Friday"
   - Target Value: 5
   - Due Date: [set 3 days out]
3. Submit goal.
4. Verify toast confirmation appears.

**7. Monitor Mentee Progress Tab**

1. Switch to "Mentee Progress" tab.
2. View progress snapshots for each mentee:
   - Total Apps, Interviewing, Offers, Goals Done
   - Recent Achievements chips
3. Click "View Full Progress Dashboard" for detailed view.

### Expected Results

- ✅ Mentor sees aggregated KPIs per mentee
- ✅ AI coaching insights generate with actionable recommendations
- ✅ Documents accessible for review
- ✅ Feedback stored and visible in history
- ✅ Goals created with due dates and targets
- ✅ Engagement levels accurately reflect activity
- ✅ Progress tab shows snapshots and achievements

---

## UC-110: Collaborative Resume and Cover Letter Review

Summary: Share documents, comment/suggest, track versions, approvals.

Sample Data

- Resume title: `PM Resume v1`
- Cover letter title: `Acme CL v1`
- Share with: Manny (Mentor)

Steps

1. Sign in as Casey (Candidate). Open Documents.
2. Create or select "PM Resume v1" and "Acme CL v1".
3. Share both with Manny (comment/suggest permissions).
4. Sign in as Manny; open the shared resume; add 2 comments and 1 suggestion.
5. Casey applies suggestions and saves as version `v2`. Leave a note "Applied feedback".
6. Initiate approval workflow; assign Manny as approver; set due date +3 days.
7. Manny reviews and approves.
8. Casey verifies status shows "Approved" with version `v2` and activity log updated.

Expected Results

- Reviewer can comment/suggest based on permissions.
- Version history increments with clear diffs and notes.
- Approval status transitions to Approved with timestamps.

---

## UC-111: Progress Sharing and Accountability

Summary: Share progress with selected members, privacy controls, engagement tracking.

Sample Data

- Share audience: Manny (Mentor), Ada (Admin)
- Privacy: Hide salary data; show applications/interviews only
- Weekly update: "Applied to 6 roles, 2 screenings scheduled"

Steps

1. As Casey, open Progress Sharing settings.
2. Set visibility to "Selected team members"; include Manny and Ada.
3. Toggle off sensitive fields (salary, contact details); leave applications/interviews visible.
4. Post a weekly update with the sample text; attach one screenshot if supported.
5. As Manny, open Shared Progress; react/comment "Great momentum—keep it up".
6. As Casey, verify engagement metrics (views, comments) and privacy still enforced.

Expected Results

- Only selected members see shared updates.
- Hidden fields not visible to viewers.
- Engagement stats reflect views/comments and are attributed.

---

## UC-112: Peer Networking and Support Groups

Summary: Join role/industry groups, participate, track value.

Sample Data

- Group: `Austin Frontend 2025`
- Anonymized insight: "Cold outreach + portfolio doubled callbacks"
- Challenge: "3 meaningful outreaches/week for 2 weeks"

Steps

1. As Casey, open Peer Groups; search and join "Austin Frontend 2025".
2. Post anonymized insight using sample text; toggle anonymity on.
3. Join the challenge and log first week's 3 outreaches.
4. Review group resources (webinar link, success stories).
5. Verify networking impact metric increments after log submission.

Expected Results

- Group membership recorded; posts appear with anonymity respected.
- Challenge participation logged; progress visible.
- Networking impact metric reflects activity.

---

## UC-113: Family and Personal Support Integration

Summary: Invite family supporter, share simplified summaries, celebrate milestones, respect boundaries.

Sample Data

- Family member: Fran Family (`fran.family+support@example.com`)
- Shared summary: "High-level weekly status; no company names or salary"
- Celebration: "First onsite interview scheduled!"

Steps

1. As Casey, open Family Support; send invite to Fran.
2. Configure summary level: high-level only; exclude sensitive items.
3. Post a celebration message with sample text.
4. Sign in as Fran; verify dashboard shows friendly summary and celebration.
5. Attempt to access restricted details (company names, salary); ensure denied.

Expected Results

- Family supporter sees non-sensitive summaries and celebrations only.
- Boundary settings prevent access to restricted details.
- Communication tools limited to allowed scope.

---

## UC-114: Corporate Career Services Integration

Summary: Enterprise admin tools for cohorts, reporting, branding, and integrations.

Sample Data

- Organization: `Northbridge Career Center`
- Cohort: `NBCC Spring 2026`
- Branding: Primary `#0B6E4F`, Logo: placeholder file
- CSV (example headers): `email,first_name,last_name,role` with 5 rows

Steps

1. Sign in as Erin (Enterprise Admin); open Enterprise Dashboard.
2. Create organization "Northbridge Career Center"; apply branding color and upload logo.
3. Create cohort "NBCC Spring 2026".
4. Bulk import users via CSV (5 entries with candidate role).
5. Open Program Reports; verify aggregate metrics populate for cohort.
6. If available, connect LMS/SSO in Integrations; verify status shows "Connected" or mock.

Expected Results

- Org created with branding visible on enterprise views.
- Users imported; accounts created/invited.
- Aggregate reporting shows cohort-level insights.

---

## UC-115: External Advisor and Coach Integration

Summary: Invite external advisors, secure comms, scheduling, tracking, and billing.

Sample Data

- Advisor: Alex Advisor (`alex.advisor+ext@example.com`)
- Shared scope: Resume + Progress summaries only
- Session: 60 min, "Resume review + job search strategy"
- Billing: Hourly rate $150 (mock)

Steps

1. As Casey, open Advisors; invite Alex with shared scope above.
2. Alex accepts; verify secure messaging channel opens.
3. Schedule a 60-min session next week; add the sample agenda.
4. After session, Alex posts recommendations; Casey marks items as implemented.
5. If billing mock present, record a $150 session and verify status "Paid" or mock receipt.

Expected Results

- Advisor has least-privilege access per scope.
- Messages and recommendations stored.
- Scheduling entries appear on both sides; billing (if enabled) recorded.

---

## Troubleshooting Tips

- Access denied: confirm role assignments and team membership.
- Missing data on dashboards: ensure candidate has baseline profile and some activities logged.
- Email/invite issues: verify mail catcher or use direct activation flows if provided.
- Feature flags: ensure collaboration features are enabled in environment configuration.

## Sign-off Checklist

- [ ] UC-108 role/access validated
- [ ] UC-109 mentor KPIs and feedback
- [ ] UC-110 review, suggestions, approvals
- [ ] UC-111 privacy and engagement
- [ ] UC-112 groups, challenges, impact
- [ ] UC-113 family summaries and boundaries
- [ ] UC-114 cohorts, branding, reports
- [ ] UC-115 advisor access, sessions, billing

---

## Demo Script: Act 4 - Multi-User Collaboration Features (2 minutes)

This section provides a streamlined demo flow for the collaboration features presentation.

### 4.1 Team Account and Role Management

**Demo Actions:**

1. **Create team account:**

   - Navigate to `/team`
   - Click "Create Team" button
   - Enter team name: "Demo Career Team"
   - Verify team dashboard appears

2. **Invite team member:**

   - Click "Invite Member" on team dashboard
   - Enter email of demo mentor account
   - Select role: "Mentor"
   - Send invitation

3. **Accept invitation (mentor side):**

   - Switch to mentor account
   - Navigate to `/team/invitations`
   - Click "Accept" on pending invitation
   - Verify redirect to team dashboard

4. **Verify role assignment and permissions:**

   - As admin, go to `/team/members`
   - Confirm mentor appears with correct role
   - Verify admin can change roles, mentor cannot

5. **View team dashboard with aggregate stats:**
   - Navigate to `/team`
   - Show member count, total applications, interviews, offers
   - Highlight collaboration metrics panel

**Script:** "Collaboration features for job search teams and career support... Create team account for collaborative job searching, invite team member (mentor, career coach, or peer), assign role with specific permissions, view team dashboard with aggregate statistics. Perfect for university career centers, job search groups, or mentorship programs."

### 4.2 Shared Resources and Coach Collaboration

**Demo Actions:**

1. **Share job posting with team:**

   - As candidate, open a job in pipeline
   - (If sharing feature exists) Share with team
   - Add comment/recommendation

2. **Switch to mentor/coach view:**

   - Log in as mentor account
   - Navigate to `/team/mentor`
   - Show mentee progress dashboard

3. **Provide feedback on application materials:**

   - Open mentee's documents section
   - Add feedback comment on resume
   - Show feedback appears for candidate

4. **Assign preparation tasks:**
   - Create goal/task for mentee
   - Set deadline and target

**Script:** "Real-time collaboration on opportunities and progress... Share job posting with team members, add collaborative comments and recommendations. Switch to mentor/coach view, show mentee progress dashboard, provide feedback on application materials, assign preparation tasks. Guided support throughout the job search journey."

### 4.3 Team Analytics and Activity Feed

**Demo Actions:**

1. **Display team activity feed:**

   - Navigate to team dashboard
   - Show activity log section
   - Highlight recent actions (member joined, feedback added)

2. **Show milestone achievements:**

   - Point out team statistics cards
   - Mention celebration features if present

3. **Navigate to team performance comparison:**
   - Show insights panel with aggregate metrics
   - Discuss anonymized benchmarking concept

**Script:** "Team insights and performance benchmarking... Display team activity feed with real-time updates, show milestone achievements and team celebrations. Navigate to team performance comparison. Anonymized benchmarking motivates and identifies best practices. View team success patterns and collaboration effectiveness."

---

## Automated Test Verification

Before demo, run all collaboration tests to ensure features work:

### Frontend Tests

```powershell
cd frontend
npm test -- --run tests/frontend/services/teamService.test.ts
npm test -- --run tests/frontend/services/mentorService.test.ts
npm test -- --run tests/frontend/services/reviewService.test.ts
npm test -- --run tests/frontend/services/progressSharingService.test.ts
```

### Backend Tests

```powershell
cd server
npm test -- tests/server/routes/collaboration.test.ts
```

### Run All Collaboration Tests

```powershell
# From project root
cd tests
npm test
```

### Test Checklist for Demo

- [ ] Team creation works (no RLS errors)
- [ ] Invitation flow works (send, view, accept)
- [ ] New member appears in team members list
- [ ] Mentor dashboard loads with mentee data
- [ ] Feedback can be added and viewed
- [ ] Activity log shows recent actions
- [ ] No "infinite recursion" errors in console
- [ ] All automated tests pass
