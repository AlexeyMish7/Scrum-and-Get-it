# Frontend Overview - How It Works

This guide explains how the frontend works in simple terms, without heavy technical jargon.

## What Is The Frontend?

The frontend is the part of FlowATS you see and interact with in your web browser. It's built with **React**, a popular JavaScript framework that makes websites interactive and fast.

Think of it like this:

- **Backend/Server** = The kitchen in a restaurant (prepares food, handles complex tasks)
- **Database** = The pantry (stores all the ingredients)
- **Frontend** = The dining area (where you interact with the staff and enjoy your meal)

---

## How The App Is Organized

### The Workspace System

FlowATS is organized into **workspaces** - think of them like departments in a company. Each workspace handles one major feature:

#### 🗂️ Job Pipeline Workspace

**What it does:** Manage your job applications

**Features:**

- Kanban board (drag jobs between stages: Interested → Applied → Interview → Offer)
- Search and filter jobs
- Track application deadlines
- Add personal notes about each job
- See AI-powered match scores

**How it works:**

1. You add a job (title, company, description, etc.)
2. The job appears in the "Interested" column
3. As you progress, drag it to "Applied," "Interview," etc.
4. AI analyzes how well the job matches your profile
5. Deadlines appear on a calendar widget
6. You can add notes like recruiter contact info, pros/cons

#### 👤 Profile Workspace

**What it does:** Manage your professional information

**Features:**

- Add skills with proficiency levels
- Track work experience (job title, company, dates, achievements)
- Record education (degrees, schools, GPA)
- Showcase portfolio projects

**How it works:**

1. Fill out your profile sections
2. Data is saved to your private database
3. AI uses this info to generate tailored resumes
4. When you update your profile, it triggers AI to refresh analytics

#### 🤖 AI Workspace

**What it does:** Generate resumes and cover letters using AI

**Features:**

- Choose from different resume templates (Chronological, Functional, Hybrid, Creative)
- Customize themes (colors, fonts, spacing)
- Generate tailored resumes for specific jobs
- Create cover letters
- Track document versions

**How it works:**

1. Select a template and theme
2. Optionally select a target job
3. Click "Generate"
4. Frontend sends your profile data + job details to server
5. Server asks AI (GPT-4) to write a resume
6. AI returns formatted resume
7. You can preview, edit, and export (PDF, Word)

#### 📅 Interview Hub

**What it does:** Manage interviews and preparation

**Features:**

- Schedule interviews
- Sync with Google Calendar
- Track interview prep tasks
- Store interview notes

---

## How Data Flows Through The App

### Example: Adding a New Job

1. **You fill out the form**

   - Job title, company name, salary range, deadline, etc.

2. **Frontend validates the data**

   - Checks required fields are filled
   - Ensures dates are formatted correctly
   - Converts salary strings to numbers

3. **Frontend sends data to database**

   - Uses a "service" (helper function) to talk to Supabase (our database)
   - Data is automatically linked to your user account (security!)

4. **Database saves the job**

   - Creates a new row in the `jobs` table
   - Returns the saved job with an ID

5. **Frontend updates the screen**

   - New job card appears in the Kanban board
   - Calendar widget shows the deadline
   - Stats update (e.g., "5 total jobs")

6. **AI analysis kicks in**
   - Frontend checks if this job needs a match score
   - Sends job description + your profile to server
   - Server asks AI to analyze the match
   - AI returns a score (0-100) with strengths and gaps
   - Score appears on the job card

### Example: Generating a Resume

1. **You click "Generate Resume"**

   - Frontend gathers your profile data (skills, experience, education)
   - Includes job details if you selected a target job

2. **Frontend sends request to server**

   - URL: `http://localhost:3001/api/generate/resume`
   - Includes your authentication token (proves it's you)
   - Contains all your profile data + preferences (tone, length, template)

3. **Server processes the request**

   - Loads a prompt template (instructions for AI)
   - Fills template with your data
   - Sends prompt to OpenAI's GPT-4

4. **AI generates the resume**

   - Returns structured JSON with sections: header, summary, experience, education, skills

5. **Frontend receives the resume**
   - Displays a preview
   - Saves it as a new document version
   - You can export to PDF or edit manually

---

## Key Concepts Explained Simply

### Authentication (Login/Logout)

**What:** Proves you are who you say you are

**How it works:**

1. You enter email and password
2. Supabase checks if they match
3. If yes, gives you a "session token" (like a backstage pass)
4. Every time you request data, you show this token
5. Database only returns YOUR data (not other users')

**Where it's stored:** Browser's memory (cleared when you close the tab/logout)

### State Management

**What:** Keeping track of data that changes

**Examples:**

- List of jobs (changes when you add/delete jobs)
- Current user (changes when you login/logout)
- Theme mode (light/dark)

**How it works:**

- React's `useState` stores data in memory
- When data changes, React updates the screen automatically
- Example: `const [jobs, setJobs] = useState([])` - starts with empty list

### Caching

**What:** Storing results to avoid repeating expensive operations

**Example - AI Analytics:**

- AI analysis costs time and money (API calls)
- First time: Generate analysis, save to cache, show result
- Next time: Check cache first, return cached result if still valid
- Cache expires after 7 days or when you update your profile

**Benefits:**

- Faster load times
- Lower costs
- Better user experience

### Event System

**What:** Letting different parts of the app communicate

**Example:**

- You move a job to "Applied" stage
- Job pipeline updates the Kanban board
- Emits an event: "jobs-updated"
- Calendar widget listens for this event
- Calendar refreshes to show new deadline

**Why:** Keeps multiple components in sync without tight coupling

---

## Common User Flows

### 1. First-Time User Setup

```
1. Create account (email + password)
   ↓
2. Verify email
   ↓
3. Fill out profile (name, title, skills)
   ↓
4. Add work experience
   ↓
5. Add education
   ↓
6. Profile is complete - ready to add jobs and generate resumes!
```

### 2. Job Application Workflow

```
1. Find job listing online
   ↓
2. Click "Add Job" in FlowATS
   ↓
3. Fill out job form (paste description, add deadline)
   ↓
4. Job appears in "Interested" column
   ↓
5. AI analyzes match score (shows strengths/gaps)
   ↓
6. Generate tailored resume for this job
   ↓
7. Apply to job (move card to "Applied")
   ↓
8. Track progress (Phone Screen → Interview → Offer)
   ↓
9. Add notes (interview feedback, salary negotiation)
```

### 3. Resume Generation Workflow

```
1. Go to AI Workspace
   ↓
2. Click "New Resume"
   ↓
3. Select template (e.g., "Chronological")
   ↓
4. Choose theme (e.g., "Professional Blue")
   ↓
5. (Optional) Select target job
   ↓
6. Set preferences (tone: professional, length: standard)
   ↓
7. Click "Generate"
   ↓
8. Wait 5-10 seconds (AI is writing)
   ↓
9. Preview resume
   ↓
10. Make manual edits if needed
    ↓
11. Export to PDF
    ↓
12. Download and use for applications
```

---

## How The Frontend Stays Fast

### 1. Only Load What You Need

- Each workspace loads its own code (not the entire app at once)
- Scrolling is smooth because we only render visible items

### 2. Smart Updates

- When you edit a job, only that job card re-renders
- Other cards stay the same (no unnecessary work)

### 3. Caching

- AI analytics cached for 7 days
- Database queries return quickly (indexed columns)

### 4. Optimistic Updates

- When you move a job, it moves instantly on screen
- If server fails, it moves back
- Feels faster because you don't wait for server

---

## How The Frontend Stays Secure

### 1. Row-Level Security

- Database automatically filters data by user
- You can NEVER see another user's jobs/profile
- Even if you try to hack the URL, database blocks it

### 2. Token-Based Auth

- Every request includes your session token
- Server verifies token before allowing access
- Tokens expire after inactivity

### 3. Input Validation

- Forms check data before sending to database
- Prevents bad data (e.g., negative salary)
- Protects against malicious input

### 4. No Sensitive Data Storage

- Passwords never stored in frontend
- Credit cards (if added) handled by secure payment provider
- API keys kept on server only

---

## What Happens When You...

### ...Refresh The Page?

1. Frontend checks if you're logged in (session token exists)
2. If yes, loads your data from database
3. If no, redirects to login page
4. React rebuilds the UI from scratch

### ...Lose Internet Connection?

1. Frontend detects failed API calls
2. Shows "Connection lost" message
3. Retries automatically every 5 seconds
4. When reconnected, syncs any pending changes

### ...Click "Logout"?

1. Frontend clears session token
2. Tells server to invalidate session
3. Redirects to login page
4. All sensitive data removed from memory

### ...Delete A Job?

1. Confirmation dialog appears
2. If you confirm, frontend sends delete request
3. Database removes the job
4. Frontend removes job card from screen
5. Stats update (total count decreases)
6. Calendar refreshes (deadline removed)

---

## Tips For Understanding The Code

### If You Want To Know...

**Where a feature lives:**

- Look in `src/app/workspaces/[feature_name]/`
- Example: Job tracking → `job_pipeline/`

**How data is fetched:**

- Look in `services/` folders
- Example: `jobsService.ts` has all job database operations

**What a page looks like:**

- Look in `pages/` folders
- Example: `PipelinePage.tsx` is the Kanban board

**How components work together:**

- Look in `components/` folders
- Components are organized by feature area

**What types/shapes data has:**

- Look in `types/` folders
- Example: `job.types.ts` defines JobRow interface

---

This is how the frontend creates the user experience you see. It's all about taking your actions (clicks, typing), validating them, sending to the database/server, getting results, and updating the screen smoothly!
