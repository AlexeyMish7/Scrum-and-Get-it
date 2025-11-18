# Server Overview - How It Works

This guide explains how the server works in simple, non-technical terms.

## What Is The Server?

The server is the "brain" of FlowATS. While the frontend (what you see in your browser) handles user interactions, the server handles:

- **AI generation** - Talks to OpenAI to create resumes and cover letters
- **Data processing** - Formats and validates information
- **External APIs** - Fetches company data, salary insights
- **Business logic** - Makes decisions about what to do with your data

Think of it as a translator and coordinator between you, the database, and external services like OpenAI.

## How Requests Flow

```
You click "Generate Resume" in browser
    ↓
Frontend sends request to server (http://localhost:3001/api/generate/resume)
    ↓
Server receives request
    ↓
Server checks: "Are you logged in?" (Authentication)
    ↓
Server validates: "Is this request valid?" (Has required fields?)
    ↓
Server processes: Gathers your profile data
    ↓
Server talks to OpenAI: "Write a resume for this person"
    ↓
OpenAI returns resume text
    ↓
Server formats and validates the resume
    ↓
Server sends response back to frontend
    ↓
You see your generated resume!
```

## Main Features

### 1. Resume Generation

**What happens:**

1. You fill out your profile (skills, experience, education)
2. You click "Generate Resume"
3. Frontend sends ALL your data to server
4. Server creates a special prompt (instructions for AI)
5. Prompt includes:
   - Your profile information
   - What type of resume you want
   - Any specific job you're targeting
   - Your preferences (tone, length)
6. Server sends prompt to OpenAI
7. OpenAI writes the resume
8. Server receives resume as JSON (structured data)
9. Server validates it's formatted correctly
10. Server sends resume back to you

**Behind the scenes:**

- Server tracks how many "tokens" (AI credits) were used
- Saves the generation session to database (for history)
- Caches results to avoid regenerating unnecessarily
- Handles errors if AI fails

### 2. Cover Letter Generation

**Similar to resume but:**

- Focuses on one specific job
- Shorter, more personalized
- Includes greeting, body paragraphs, closing
- Emphasizes why you're interested in THIS job

**Process:**

1. Server loads cover letter prompt template
2. Injects your relevant experience (picks 2-3 best matches)
3. AI writes personalized cover letter
4. Server returns formatted letter

### 3. Job Match Analysis

**What it does:** Tells you how well you match a job (0-100% score)

**How it works:**

1. Server receives job description + your profile
2. Server asks AI: "How well does this person match this job?"
3. AI analyzes:
   - Skills match (which skills match, which are missing)
   - Experience relevance (do they have related experience?)
   - Education fit (meets requirements?)
4. AI returns score + breakdown
5. Server caches result (so you don't pay for same analysis twice)

**Example output:**

```
Match Score: 85%

Strengths:
- Strong JavaScript and React skills
- 3 years relevant experience
- Bachelor's in Computer Science

Gaps:
- Missing AWS experience
- No GraphQL knowledge

Recommendations:
- Complete AWS tutorial
- Build a GraphQL project
```

### 4. Company Research

**What it does:** Gathers information about companies

**Process:**

1. You enter company name
2. Server checks: "Do we already have this company's info?"
3. If yes, return cached data (fast!)
4. If no:
   - Server finds company website
   - Scrapes basic information (description, industry, size)
   - AI analyzes the data
   - AI adds: culture notes, tech stack, interview tips
   - Server caches for future users (save time/money)

**What you get:**

- Company description
- Industry and size
- Culture and values
- Tech stack they use
- Recent news
- Interview tips

### 5. Salary Research

**What it does:** Estimates salary ranges for jobs

**Process:**

1. You provide: job title + location
2. Server uses AI knowledge to estimate
3. Returns: salary range (min, median, max)
4. Includes factors (location impact, experience level)
5. Shows comparisons to similar roles

## How Prompts Work

### What Is A Prompt?

A prompt is a set of instructions you give to AI. It's like giving detailed directions to a very smart assistant.

**Bad prompt:**

```
Write a resume.
```

**Good prompt:**

```
You are an expert resume writer. Generate a professional chronological resume.

User Profile:
Name: John Doe
Title: Software Engineer
Email: john@example.com

Skills:
- JavaScript (Expert, 5 years)
- React (Advanced, 3 years)

Experience:
Senior Developer at Tech Corp (2020-2023)
- Led team of 5 engineers
- Increased performance by 40%

Output Format:
{
  "header": { "name": "...", "title": "...", ... },
  "summary": "3-4 sentence professional summary",
  "experience": [ ... ],
  "skills": { "technical": [...], "soft": [...] }
}

Requirements:
- Use professional tone
- Standard length (not too long)
- Emphasize leadership and technical skills
- Return ONLY valid JSON
```

### Prompt Templates

Server has pre-written prompt templates for each feature:

- `resume.ts` - Resume generation prompts
- `coverLetter.ts` - Cover letter prompts
- `skillsOptimization.ts` - Skills analysis prompts
- `companyResearch.ts` - Company research prompts

Each template is a function that takes your data and creates a customized prompt.

**Example:**

```typescript
function getResumePrompt(userData) {
  return `
    You are an expert resume writer...

    User Profile:
    Name: ${userData.profile.full_name}
    Title: ${userData.profile.professional_title}

    Skills:
    ${userData.skills.map((s) => `- ${s.skill_name}`).join("\n")}

    ...
  `;
}
```

### Why This Matters

Good prompts = Better AI output

- Clear instructions → AI knows exactly what to do
- Examples → AI follows the pattern
- Constraints → AI doesn't go off-track
- Structure → AI returns usable data

## How Server Handles Errors

### Authentication Errors

**Problem:** User not logged in or token expired
**Response:** "401 Unauthorized - Please log in again"

### Validation Errors

**Problem:** Missing required data (e.g., no job title)
**Response:** "400 Bad Request - Job title is required"

### Rate Limit Errors

**Problem:** Too many AI requests in short time
**Response:** "429 Too Many Requests - Please wait a moment"

### AI Errors

**Problem:** OpenAI API failed or returned invalid data
**Response:** "500 Internal Server Error - Generation failed, please try again"

### All errors are logged

- Server keeps detailed logs of what went wrong
- Helps developers debug issues
- Tracks performance and usage

## Server Folders Explained

### `/routes` - API Endpoints

**What's inside:** Files that handle specific URLs

**Structure:**

```
routes/
├── health.ts          # /api/health (is server running?)
├── generate/          # /api/generate/* (AI generation)
├── company/           # /api/company/* (company research)
├── salary/            # /api/salary/* (salary insights)
├── artifacts/         # /api/artifacts/* (AI artifacts CRUD)
└── cover-letter/      # /api/cover-letter/* (drafts management)
```

### `/services` - Business Logic

**What's inside:** Functions that do the actual work

**Key files:**

- `aiClient.ts` - Talks to OpenAI
- `orchestrator.ts` - Coordinates complex operations
- `companyResearchService.ts` - Fetches company data
- `scraper.ts` - Extracts data from websites

### `/prompts` - AI Instructions

**What's inside:** Templates for AI prompts

**Files:**

- `resume.ts` - Resume generation prompts
- `coverLetter.ts` - Cover letter prompts
- `skillsOptimization.ts` - Skills analysis
- `experienceTailoring.ts` - Rewrite experience bullets
- `companyResearch.ts` - Company research prompts

### `/middleware` - Request Processing

**What's inside:** Code that runs before/after every request

**Files:**

- `auth.ts` - Verifies you're logged in
- `errorHandler.ts` - Catches errors
- `logger.ts` - Records requests

### `/types` - TypeScript Definitions

**What's inside:** Describes what data looks like

**Purpose:** Ensures data is correct format (type safety)

## Common Workflows

### Workflow: Generate Resume

```
1. User clicks "Generate Resume" in browser
2. Frontend sends POST to /api/generate/resume
3. Server auth middleware checks JWT token
4. Route handler receives request
5. Validates: has profile? has skills?
6. Calls orchestrator.orchestrateResumeGeneration()
7. Orchestrator loads prompt template
8. Injects user data into prompt
9. Calls aiClient.generateCompletion()
10. AI returns JSON resume
11. Server validates JSON structure
12. Saves generation session to database
13. Returns resume to frontend
14. Frontend displays preview
```

### Workflow: Company Research (With Caching)

```
1. User searches for "Google"
2. Frontend sends POST to /api/company/research
3. Server checks database: Do we have Google's info?
4. If YES (cached):
   - Return cached data immediately (fast!)
5. If NO (not cached):
   - Find Google's website
   - Scrape company page
   - Extract description, size, industry
   - Ask AI to analyze and add insights
   - Save to database cache
   - Return data to frontend
6. Next user who searches "Google" gets instant cached result
```

## Performance Optimizations

### Caching

**What:** Store results to avoid redoing expensive operations
**Where:** Database (analytics_cache, companies.research_cache)
**Expires:** 7 days for analytics, 30 days for company data

### Rate Limiting

**What:** Prevent too many AI calls in short time
**Why:** OpenAI charges per token, avoid unexpected costs
**How:** Track requests per user per hour

### Prompt Optimization

**What:** Write efficient prompts that use fewer tokens
**How:** Clear, concise instructions without redundancy
**Benefit:** Faster responses, lower costs

## Security Measures

### Authentication

- Every request requires valid JWT token
- Token verified with Supabase
- Expired tokens rejected

### Input Validation

- Check all required fields present
- Sanitize user input (prevent injection attacks)
- Validate data types and formats

### API Key Protection

- OpenAI API key stored in environment variables
- Never sent to frontend
- Rotated regularly

### Error Handling

- Never expose internal errors to users
- Log detailed errors server-side only
- Return user-friendly error messages

---

The server is the powerhouse that makes AI generation possible. It coordinates between you, the database, and external services, ensuring everything works smoothly and securely!
