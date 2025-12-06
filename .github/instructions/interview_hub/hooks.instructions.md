# Interview Hub Hooks

> Custom React hooks for interview preparation and tracking.

---

## Hook Files

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `useInterviewQuestionBank.ts` | Question generation and practice tracking |

---

## useInterviewQuestionBank

Lightweight local question bank generator and practice tracker.

### Types

```typescript
type Difficulty = "entry" | "mid" | "senior";

type Category = "behavioral" | "technical" | "situational";

interface InterviewQuestion {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
  skillTags?: string[];
  companySpecific?: boolean;
}

interface PracticedRecord {
  id: string; // unique record id
  questionId: string; // matches question id
  practicedAt: string; // ISO timestamp
  draftResponse?: string; // user's written response
}
```

### Exported Functions

#### generateQuestionBank

Generate role-specific interview questions.

```typescript
function generateQuestionBank(opts: {
  jobTitle: string;
  industry?: string;
  difficulty?: Difficulty;
  includeCompanySpecific?: boolean;
}): InterviewQuestion[];
```

**Parameters:**

- `jobTitle` - Job title to generate questions for
- `industry` - Optional industry context
- `difficulty` - "entry" | "mid" | "senior" (default: "mid")
- `includeCompanySpecific` - Include company-specific questions

**Returns:** Array of 9-12 interview questions

**Example:**

```typescript
const questions = generateQuestionBank({
  jobTitle: "Software Engineer",
  industry: "Technology",
  difficulty: "mid",
});
```

#### markPracticed

Mark a question as practiced with optional response.

```typescript
function markPracticed(questionId: string, draftResponse?: string): void;
```

#### getPracticedRecords

Get all practice records from localStorage.

```typescript
function getPracticedRecords(): PracticedRecord[];
```

#### isPracticed

Check if a question has been practiced.

```typescript
function isPracticed(questionId: string): boolean;
```

#### exportPracticeData

Export practice data as JSON for backup.

```typescript
function exportPracticeData(): string;
```

#### clearPractice

Clear all practice records.

```typescript
function clearPractice(): void;
```

---

## Question Templates

### Behavioral Questions

- Challenges and problem-solving
- Teamwork and collaboration
- Ownership and initiative

### Situational Questions

- Product/engineering alignment
- Production incident response
- Performance optimization

### Technical Questions

- System architecture design
- Data structures and algorithms
- Technology trade-offs

---

## Storage

Questions are generated on-the-fly (not stored).
Practice records are stored in localStorage:

```
Key: sgt:interview_question_practice
Value: PracticedRecord[]
```

---

## Usage Pattern

```typescript
import hook from "@workspaces/interview_hub/hooks/useInterviewQuestionBank";

// Generate questions
const questions = hook.generateQuestionBank({
  jobTitle: "Product Manager",
  industry: "SaaS",
  difficulty: "mid",
});

// Filter by category
const behavioral = questions.filter((q) => q.category === "behavioral");

// Mark practiced
hook.markPracticed(questions[0].id, "My STAR response...");

// Check if practiced
const practiced = hook.isPracticed(questions[0].id);
```

---

## Implementation Notes

1. **Deterministic Generation** - Same inputs produce similar questions
2. **Keyword Extraction** - Skills derived from job title
3. **Local Storage Only** - Sprint-2 limitation, migrate to DB later
4. **No Auth Scoping** - Currently no user isolation
