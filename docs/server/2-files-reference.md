# Server Files - Detailed Reference

## Route Files

### `src/routes/health.ts`

**Endpoint:** `GET /api/health`
**Input:** None
**Output:** `{ status: "ok", timestamp: string, uptime: number }`
**Purpose:** Health check for monitoring

### `src/routes/generate/index.ts`

#### POST /api/generate/resume

**Input:**

```typescript
{
  templateType, profile, skills, employment, education,
  jobDetails?, options?
}
```

**Output:** `{ success, data: { header, summary, experience, education, skills }, metadata }`

#### POST /api/generate/cover-letter

**Input:** `{ templateType, profile, jobDetails, relevantExperience, relevantSkills, options? }`
**Output:** `{ success, data: { greeting, opening, body, closing, signature }, metadata }`

#### POST /api/generate/job-match

**Input:** `{ profile, skills, employment, jobDetails }`
**Output:** `{ success, data: { matchScore, breakdown, strengths, gaps, recommendations } }`

### `src/routes/company/index.ts`

#### POST /api/company/research

**Input:** `{ companyName, domain? }`
**Output:** Company data with culture, tech stack, news, interview tips
**Process:** Check cache → Web scrape → AI analysis → Cache result

### `src/routes/salary/index.ts`

#### POST /api/salary/research

**Input:** `{ jobTitle, location, experienceLevel? }`
**Output:** Salary range with factors and comparisons

### `src/routes/artifacts/index.ts`

#### GET /api/artifacts

**Input:** Query params (type, limit, offset)
**Output:** Array of AI artifacts

#### POST /api/artifacts

**Input:** `{ type, content, metadata }`
**Output:** Created artifact

### `src/routes/cover-letter/index.ts`

#### GET /api/cover-letter/drafts

**Output:** User's cover letter drafts

#### POST /api/cover-letter/drafts

**Input:** Draft data
**Output:** Created draft

## Service Files

### `src/services/aiClient.ts`

#### `generateCompletion(prompt, options?)`

**Input:** Prompt string, model options
**Output:** AI-generated text
**Used by:** All generation endpoints

#### `generateStructuredOutput(prompt, schema)`

**Input:** Prompt + JSON schema
**Output:** Validated JSON object
**Use case:** Ensure AI returns proper format

### `src/services/orchestrator.ts`

#### `orchestrateResumeGeneration(input)`

**Process:**

1. Validate input
2. Load prompt template
3. Call AI
4. Parse response
5. Save session
6. Return result

#### `orchestrateCoverLetterGeneration(input)`

**Similar to resume but for cover letters**

### `src/services/companyResearchService.ts`

#### `researchCompany(companyName)`

**Process:**

1. Check Supabase cache
2. If missing, scrape website
3. AI analyzes data
4. Cache for 30 days
   **Output:** Company profile

### `src/services/scraper.ts`

#### `scrapeWebsite(url)`

**Input:** URL
**Output:** HTML content
**Tools:** Axios + Cheerio

#### `extractCompanyInfo(html)`

**Input:** HTML
**Output:** Parsed company data

### `src/services/coverLetterDraftsService.ts`

#### `createDraft(userId, data)`

**Input:** User ID + draft data
**Output:** Created draft with version 1

#### `createVersion(draftId, changes)`

**Input:** Draft ID + new content
**Output:** New version with incremented number

## Prompt Files

### `prompts/resume.ts`

#### `getResumePrompt(input)`

**Returns:** Formatted prompt for GPT-4
**Sections:**

- System role definition
- Output format specification
- User profile data
- Employment history
- Education
- Target job (if provided)
- Tone/length/focus instructions

### `prompts/coverLetter.ts`

#### `getCoverLetterPrompt(input)`

**Returns:** Cover letter generation prompt
**Includes:** Job details, relevant experience, tone preferences

### `prompts/skillsOptimization.ts`

#### `getSkillsAnalysisPrompt(profile, job)`

**Returns:** Prompt for skills gap analysis
**Output spec:** Matched skills, missing skills, recommendations

### `prompts/experienceTailoring.ts`

#### `tailorExperiencePrompt(experience, job)`

**Returns:** Prompt to rewrite bullets for target job
**Instructions:** Match keywords, quantify results, action verbs

### `prompts/companyResearch.ts`

#### `getCompanyResearchPrompt(rawData)`

**Input:** Scraped company data
**Returns:** Prompt to summarize and structure data
**Output:** Culture, benefits, tech stack, interview tips

## Middleware Files

### `src/middleware/auth.ts`

#### `requireAuth(req, res, next)`

**Process:**

1. Extract JWT from Authorization header
2. Verify with Supabase
3. Attach user to `req.user`
4. Continue or return 401

### `src/middleware/errorHandler.ts`

#### `errorHandler(err, req, res, next)`

**Handles:**

- Validation errors (400)
- Auth errors (401)
- Rate limits (429)
- Server errors (500)
  **Logs all errors**

### `src/middleware/logger.ts`

#### `requestLogger(req, res, next)`

**Logs:** Method, URL, status code, response time

## Utility Files

### `src/utils/logger.ts`

**Exports:** Winston logger instance
**Levels:** error, warn, info, debug
**Transports:** Console, file (logs/)

### `src/utils/validation.ts`

**Functions:**

- `validateEmail(email)`
- `validatePhone(phone)`
- `validateURL(url)`
- `sanitizeInput(text)`

### `src/utils/formatting.ts`

**Functions:**

- `formatSalary(number)`
- `formatDate(date)`
- `truncateText(text, length)`

## Type Files

### `src/types/generation.types.ts`

**Interfaces:**

- `ResumeInput` - Resume generation request
- `ResumeOutput` - Resume generation response
- `CoverLetterInput`
- `CoverLetterOutput`
- `JobMatchInput`
- `JobMatchOutput`

### `src/types/api.types.ts`

**Interfaces:**

- `ApiResponse<T>` - Standard response wrapper
- `ErrorResponse` - Error object
- `PaginatedResponse<T>` - List with pagination

### `src/types/express.d.ts`

**Purpose:** Extend Express types
**Adds:** `user` property to `Request` interface

## Testing Files

### `tests/routes/generate.test.ts`

**Tests:**

- Resume generation with valid input
- Cover letter generation
- Error handling for invalid input
- Authentication required

### `tests/services/aiClient.test.ts`

**Tests:**

- AI completion generation
- Error handling for API failures
- Token usage tracking

## Scripts

### `scripts/seedPrompts.ts`

**Purpose:** Populate database with default prompt templates
**Usage:** `npm run seed:prompts`

---

All files follow consistent patterns:

- Input validation
- Error handling
- Logging
- Type safety
- Clear separation of concerns
