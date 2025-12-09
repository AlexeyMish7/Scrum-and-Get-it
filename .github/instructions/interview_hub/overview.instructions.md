# Interview Hub Workspace Overview

> Interview scheduling, preparation, practice, and outcome tracking.

---

## Workspace Path

```
frontend/src/app/workspaces/interview_hub/
```

---

## Use Cases

| UC ID  | Feature               | Description                                      |
| ------ | --------------------- | ------------------------------------------------ |
| UC-104 | Interview Scheduling  | Schedule with calendar integration and reminders |
| UC-105 | Interview Preparation | Question banks, STAR stories, and prep tasks     |

---

## Directory Structure

```
interview_hub/
├── components/
│   ├── AddInterviewDialog.tsx      # Quick interview logging
│   ├── InterviewQuestionBank.tsx   # Question practice
│   ├── InterviewScheduling.tsx     # Scheduling & calendar
│   ├── InterviewSuccess.tsx        # Success prediction
│   ├── MockInterview.tsx           # AI mock interviews
│   ├── SalaryPrep.tsx              # Salary negotiation prep
│   └── TechnicalPrep.tsx           # Technical interview prep
├── hooks/
│   └── useInterviewQuestionBank.ts # Question bank generator
├── InterviewHub.tsx                # Main workspace page
└── index.ts                        # Barrel exports
```

---

## Features

### Interview Scheduling

- Schedule interviews with date/time
- Link to jobs in pipeline
- Set reminders (30 min, 1 hour, etc.)
- Interview types: phone, video, in-person
- Status tracking: scheduled, cancelled, completed
- Follow-up email templates
- Calendar download (.ics files)
- Google Calendar integration

### Interview Preparation

- Question bank generator (behavioral, technical, situational)
- STAR method guidance
- AI response review and feedback
- Prep checklist per interview
- Preparation activities tracking

### Mock Interviews

- AI-generated interview questions
- Practice with typed responses
- Instant AI feedback and scoring
- Session summaries and improvement tips

### Technical Prep

- Coding challenges
- System design prompts
- Case study exercises
- Whiteboard problems
- Timed practice with attempts tracking

### Salary Prep

- Market salary research
- Negotiation talking points generator
- Counter-offer scripts
- Negotiation outcome tracking

### Interview Success

- Success prediction metrics
- Preparation activity correlation
- Interview outcome tracking
- Confidence/anxiety logging

---

## Database Tables

| Table                    | Purpose                                |
| ------------------------ | -------------------------------------- |
| `scheduled_interviews`   | Interview schedule data                |
| `preparation_activities` | Prep activities (mock, practice, etc.) |
| `interview_feedback`     | Interview outcomes and feedback        |
| `confidence_logs`        | Confidence/anxiety tracking            |

---

## Local Storage Keys

| Key                               | Purpose                           |
| --------------------------------- | --------------------------------- |
| `sgt:interview_question_practice` | Practiced questions and responses |
| `sgt:technical_prep_attempts`     | Coding attempt history            |
| `sgt:salary_negotiations`         | Negotiation records               |
| `sgt:interview_prep`              | Prep checklist per interview      |
| `sgt:interview_predictions`       | Success predictions               |

---

## Routes

| Route         | Component      | Description             |
| ------------- | -------------- | ----------------------- |
| `/interviews` | `InterviewHub` | Main interview hub page |

---

## Import Pattern

```typescript
// Import main page
import InterviewHub from "@workspaces/interview_hub/InterviewHub";

// Import components
import {
  InterviewScheduling,
  InterviewQuestionBank,
  MockInterview,
  TechnicalPrep,
  SalaryPrep,
} from "@workspaces/interview_hub/components";

// Import hook
import {
  generateQuestionBank,
  markPracticed,
} from "@workspaces/interview_hub/hooks/useInterviewQuestionBank";
```
