# Getting Started with Scrum-and-Get-it

Welcome! This guide helps you get productive quickly with Scrum-and-Get-it — your job-search and interview productivity workspace.

Follow these quick steps to configure your profile, track applications, prepare for interviews, and use the AI tools.

## 1. Your Profile
- What: Your resume-like profile including education, skills, employment, and projects.
- How: Visit `Profile → Details` and fill in your headline, summary, and contact info. Add skills and past employment to improve AI matching.

## 2. Dashboard & Home
- What: Overview of upcoming interviews, notifications and quick metrics.
- How: Use the Dashboard to see next interviews and high-priority actions. Adjust weekly goals on the Dashboard.

## 3. Jobs Pipeline
- What: Kanban pipeline tracking job applications through stages (Interested → Applied → Phone Screen → Interview → Offer → Rejected).
- How: Add a job via `Jobs → New`, drag jobs across stages, and use filters for company/role/industry. Click the "Analytics" button inside the pipeline for long-form analytics.

## 4. AI Workspace
- What: Generate resumes and cover letters, and use job-level AI predictions.
- How: Use `AI → Generate Resume` and `AI → Generate Cover Letter`. Visit the AI Hub to manage generated artifacts.

## 5. Interview Hub
- What: Schedule interviews, log preparation activities, and run mock/practice sessions.
- How: Add scheduled interviews (title, time, linked job). Log preparation activities (type, description, minutes). Practice sessions increase your practice minutes and readiness scores.

## 6. Preparation Activities & Practice Minutes
- What: Minutes are accumulated from server-side `preparation_activities` and local `sgt:technical_prep_attempts` entries.
- How to increase practice minutes:
  - Create `preparation_activities` entries (type "Mock Interview" or "Interview Practice") and set `time_spent_minutes`.
  - Or add a local attempt in the browser console for quick testing:

```js
const attempts = JSON.parse(localStorage.getItem("sgt:technical_prep_attempts") || "[]");
attempts.push({ text: "Mock Interview - System design", origin: "mock", elapsedMs: 30*60*1000, jobId: 123 });
localStorage.setItem("sgt:technical_prep_attempts", JSON.stringify(attempts));
```

Reload the Interview Hub page; practice minutes should update.

## 7. Documents & Templates
- Save generated resumes and cover letters in the Document Library for reuse and versioning.

## 8. Analytics & Reports
- Visit `/jobs/analytics` or click the Analytics button in the pipeline to review conversion metrics and AI insights. Use the Report Generator to export custom reports.

## 9. Settings & Integrations
- Connect calendars and notification preferences in `Profile → Settings`. AI keys are configured on the server if you manage your own provider.

## 10. Troubleshooting
- If practice minutes remain at 0: ensure `preparation_activities` exist in the DB for your user or add local attempts to `sgt:technical_prep_attempts`. Make sure interviews are linked to jobs or the text matches job title/company so activities are matched correctly.

---

If you'd like, we can also surface this guide as a persistent help page or add a header link. Tell me if you want the guide shown on sign-up or for all users.
