# Interview Hub Components

> React component reference for the interview hub workspace.

---

## Component Files

| Component                   | Lines | Purpose                         |
| --------------------------- | ----- | ------------------------------- |
| `InterviewScheduling.tsx`   | 2304  | Full scheduling system          |
| `InterviewSuccess.tsx`      | 560   | Success prediction dashboard    |
| `TechnicalPrep.tsx`         | 499   | Technical interview preparation |
| `SalaryPrep.tsx`            | 498   | Salary negotiation preparation  |
| `AddInterviewDialog.tsx`    | 477   | Quick interview logging dialog  |
| `InterviewQuestionBank.tsx` | 458   | Question practice interface     |
| `MockInterview.tsx`         | 388   | AI mock interview session       |

---

## InterviewScheduling

Main scheduling component with calendar integration.

### Features

- Add/edit/delete interviews
- Link interviews to jobs from pipeline
- Set reminders and duration
- Track interview status and outcomes
- Generate follow-up emails
- Prep checklist management
- Calendar file download (.ics)

### Interview Type

```typescript
type Interview = {
  id: string;
  title: string;
  interviewer?: string;
  type: "phone" | "video" | "in-person";
  start: string; // ISO datetime
  end: string;
  reminderMinutes?: number;
  location?: string;
  linkedJob?: string;
  notes?: string;
  status: "scheduled" | "cancelled" | "completed";
  outcome?: string;
};
```

### Key Functions

- `handleAdd()` - Add new interview
- `handleUpdate(id)` - Update existing interview
- `handleDelete(id)` - Delete interview
- `generateICS(interview)` - Create calendar file
- `generateFollowup(interview)` - Generate follow-up email

---

## InterviewQuestionBank

Question practice with AI feedback.

### Features

- Generate role-specific questions
- Filter by category (behavioral, technical, situational)
- STAR method guidance for behavioral questions
- Write and save practice responses
- AI review with scoring and feedback
- Track practiced questions

### QuestionCard Props

```typescript
interface QuestionCardProps {
  q: InterviewQuestion;
  onPractice: (id: string, response?: string, score?: number | null) => void;
  practiced?: boolean;
}
```

### AI Review Response

```typescript
{
  score: number;             // 1-10 rating
  feedback: string[];        // Improvement suggestions
  contentFeedback: string;   // Content quality
  structureFeedback: string; // Structure/format
  clarityFeedback: string;   // Clarity rating
  impactScore: number;       // Impact rating
  alternatives: string[];    // Alternative phrasings
  modelAnswer: string;       // Example answer
}
```

---

## MockInterview

AI-powered mock interview sessions.

### Features

- Select job context from pipeline
- AI-generated interview questions
- Practice with typed responses
- Real-time feedback per answer
- Session summary with scores
- Practice time tracking

### Props

```typescript
// Uses internal state, no props required
// Connects to job pipeline for context
```

### Flow

1. Select difficulty and job context
2. AI generates 5-7 interview questions
3. Answer each question in sequence
4. Receive feedback per answer
5. Get session summary with recommendations

---

## TechnicalPrep

Technical interview preparation with timed challenges.

### Features

- Technical question bank
- System design prompts
- Case study exercises
- Whiteboard problem practice
- Timed attempts with tracking
- AI-generated questions option
- View past attempts

### Tabs

1. **Technical** - Code and algorithm questions
2. **System Design** - Architecture challenges
3. **Case Study** - Business case problems
4. **Whiteboard** - Design and diagramming

### Attempt Tracking

```typescript
interface Attempt {
  id: string;
  questionId: string;
  code: string;
  elapsedMs: number;
  createdAt: string;
  origin?: string; // which tab
}
```

---

## SalaryPrep

Salary negotiation preparation tools.

### Features

- Market salary research (AI-powered)
- Talking points generator
- Negotiation scripts for scenarios
- Counter-offer guidance
- Outcome tracking

### Market Data

```typescript
interface MarketData {
  min: number;
  med: number;
  max: number;
}
```

### Negotiation Record

```typescript
type NegotiationRecord = {
  id: string;
  role: string;
  location: string;
  offeredSalary?: number | null;
  counterOffer?: number | null;
  acceptedSalary?: number | null;
  notes?: string;
  createdAt: string;
};
```

### API Endpoint

```typescript
// Salary research endpoint
POST / api / generate / salary - research;
Body: {
  role: string;
  location: string;
}
Response: {
  range: {
    min, median, max;
  }
}
```

---

## InterviewSuccess

Success prediction and outcome tracking.

### Features

- List upcoming interviews
- Preparation progress tracking
- Success prediction metrics
- Correlation with prep activities
- Confidence logging

### Data Sources

- `listScheduledInterviews()` - DB interviews
- `listPreparationActivities()` - Prep activities
- `localStorage` - Checklist and predictions

---

## AddInterviewDialog

Quick interview logging dialog.

### Props

```typescript
interface AddInterviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### Form Fields

- Company name
- Role
- Industry
- Company culture
- Interview date/time
- Format (phone, video, onsite, etc.)
- Interview type (screening, technical, etc.)
- Stage (applied, phone_screen, etc.)
- Result and score
- Confidence/anxiety levels
- Feedback notes

### Constants

```typescript
const INTERVIEW_FORMATS = [
  "phone",
  "video",
  "onsite",
  "take-home",
  "pair-programming",
];

const INTERVIEW_TYPES = [
  "screening",
  "technical",
  "behavioral",
  "case-study",
  "final",
];

const STAGES = [
  "applied",
  "phone_screen",
  "first_round",
  "final_round",
  "offer",
];
```

---

## Component Patterns

### Dialog Pattern

```tsx
// Dialogs receive open state and callbacks
<AddInterviewDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onSuccess={() => refreshInterviews()}
/>
```

### Storage Pattern

```tsx
// Components manage their own localStorage
const [data, setData] = useState(() => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
});

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}, [data]);
```

### AI Integration Pattern

```tsx
// Use aiClient for AI endpoints
const res = await aiClient.postJson("/api/generate/interview-questions", {
  jobTitle,
  industry,
  difficulty,
});
```
