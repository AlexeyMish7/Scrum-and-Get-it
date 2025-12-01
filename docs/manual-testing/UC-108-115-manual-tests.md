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

Summary: Mentor dashboard with mentee KPIs, feedback tools, and engagement.

Sample Data

- Mentee: Casey Candidate
- Goal: "Apply to 5 roles/week"
- KPI thresholds: Applications (weekly), Interviews (monthly)

Steps

1. Sign in as Manny (Mentor). Go to Mentor Dashboard.
2. Verify mentee list contains Casey.
3. Open Casey: review summary cards (applications, interviews, offers) and trend line.
4. Open "Materials" tab: view Casey's latest resume/cover letter.
5. Leave feedback comment on resume section (e.g., "Strengthen STAR impact statements").
6. Add a coaching recommendation (e.g., "Target 3 mid-size SaaS roles this week").
7. Add an accountability milestone ("5 applications by Friday").
8. Verify Casey sees feedback, recommendation, and milestone.

Expected Results

- Mentor sees aggregated KPIs per mentee.
- Feedback stored and visible to Candidate.
- Milestones tracked and appear in accountability widgets.

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
