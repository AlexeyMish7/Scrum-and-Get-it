# Resume Generation "Failed to Fetch" - Fix Guide

## 🔍 Issue Analysis

The "Failed to fetch" error in the resume generation is occurring because the **AI backend server is not running**.

### Root Cause
- Frontend is configured to call: `http://localhost:8787/api/generate/resume`
- The AI server (Node.js backend) needs to be running on port 8787
- Without the server running, fetch requests fail immediately

## ✅ Verification of Data Flow

Good news! The backend code is **properly configured** to use all user data:

### ✓ Profile Data Being Fetched
The orchestrator (`server/src/services/orchestrator.ts`) fetches:
- ✅ **Profile**: name, email, phone, summary, professional title
- ✅ **Skills**: from `skills` table (skill_name, skill_category)
- ✅ **Employment**: job_title, company_name, location, dates, job_description
- ✅ **Education**: institution, degree, field of study, GPA, honors
- ✅ **Projects**: name, description, role, tech stack, outcomes
- ✅ **Certifications**: name, issuing organization

### ✓ Custom Options Being Used
The prompt builder (`server/prompts/resume.ts`) includes:
- ✅ **Tone**: professional, concise, impactful
- ✅ **Focus**: leadership, cloud, frontend, backend, etc.
- ✅ **Template**: classic, modern, minimal, creative, academic
- ✅ **Custom Prompt**: user-provided additional instructions

### ✓ AI Generation Flow
```
GenerationPanel → aiGeneration.generateResume() → 
POST /api/generate/resume → handleGenerateResume() →
1. Fetch user profile + all related data
2. Build comprehensive prompt with all context
3. Call OpenAI API
4. Return structured resume content
5. Frontend displays in AIResultsPanel
```

## 🚀 Solution: Start the AI Server

### Step 1: Start the Backend Server
```powershell
cd server
npm run dev
```

This will:
- Start the Node.js server on port 8787
- Load environment variables from `server/.env`
- Connect to Supabase with service role key
- Enable OpenAI API calls

### Step 2: Verify Server is Running
You should see console output like:
```
🚀 Server listening on http://localhost:8787
✓ Supabase connection verified
✓ OpenAI API key configured
```

### Step 3: Test Resume Generation
1. In the frontend, navigate to `/ai/resume`
2. Select a job from the dropdown
3. Adjust tone/focus options
4. Click "Generate Resume"
5. ✅ Should now work without "Failed to fetch" error

## 📋 Complete Data Usage

### Contact Information (from profile)
- Full name → Header
- Email → Contact section
- Phone → Contact section
- Professional title → Header/summary

### Professional Summary (AI-generated)
- Uses profile.summary as baseline
- Tailored to target job
- Incorporates tone and focus options
- Template-aware styling

### Skills Section
- **Source**: `skills` table
- **Processing**: 
  - Ordered by relevance to job
  - ATS keywords highlighted
  - Skill gaps identified
  - Emphasis on job-critical skills

### Experience Section
- **Source**: `employment` table
- **Processing**:
  - Most recent first
  - 3-5 bullets per role
  - STAR format (Situation-Task-Action-Result)
  - Quantified achievements
  - Uses job_description for context

### Education Section
- **Source**: `education` table
- **Processing**:
  - Most recent first
  - Includes GPA if >= 3.5
  - Includes honors if present
  - Graduation dates formatted

### Projects Section (if applicable)
- **Source**: `projects` table
- **Processing**:
  - Most recent first (up to 4)
  - 2-3 bullets per project
  - Tech stack highlighted
  - Outcomes emphasized
  - Role and dates included

### Certifications Section
- **Source**: `certifications` table
- **Processing**:
  - Up to 6 most relevant
  - Issuing organization included
  - Most recent first

## 🎨 Template Behavior

Each template affects AI generation style:

### Classic
- Traditional, conservative language
- Emphasizes stability and proven track record
- Formal bullet points
- Conventional structure

### Modern
- Contemporary, tech-forward language
- Emphasizes innovation and cutting-edge skills
- Technical keywords prioritized
- Skills-first approach

### Minimal
- Concise, direct language
- Focus on core achievements
- Measurable results
- Brief, impactful bullets

### Creative
- Engaging, dynamic language
- Emphasizes projects and problem-solving
- Highlights unique contributions
- Projects-first approach

### Academic
- Formal academic language
- Research and scholarly achievements
- Education-first approach
- Methodologies and findings included

## 🔧 Troubleshooting

### If server fails to start:
1. Check `server/.env` has valid keys
2. Verify OpenAI API key is set: `AI_API_KEY=sk-...`
3. Verify Supabase credentials are correct
4. Check Node version: `node --version` (should be 20.x)

### If generation still fails after server starts:
1. Check browser console for actual error
2. Check server logs for error details
3. Verify job exists and belongs to user
4. Verify user profile has data

### Environment Variables Required

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=https://etolhcqhnlzernlfgspg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_AI_BASE_URL=http://localhost:8787
```

**Backend** (`server/.env`):
```
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...  # Your OpenAI key
AI_MODEL=gpt-4o-mini
SUPABASE_URL=https://etolhcqhnlzernlfgspg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key
```

## 📊 Testing Checklist

After starting the server, verify:
- [ ] Server console shows "listening on port 8787"
- [ ] No errors in server startup logs
- [ ] Frontend can connect (no CORS errors)
- [ ] User is authenticated (has valid session)
- [ ] Job is selected in dropdown
- [ ] Generation button is enabled
- [ ] Generation completes successfully
- [ ] AI results appear in middle panel
- [ ] All sections populated (summary, skills, experience, education)
- [ ] Contact info from profile appears
- [ ] Custom options (tone/focus) affect output
- [ ] Template selection changes AI style

## 🎯 Summary

**The backend is correctly implemented** - it fetches all user data, builds comprehensive prompts, and generates tailored resumes. The only issue is that the **server needs to be running**.

**Quick Fix**: Run `npm run dev` in the `server/` directory before using AI features.

All user profile data (name, email, phone, skills, employment, education, projects, certifications) is properly integrated into the AI generation pipeline. Custom options (tone, focus, template, custom prompts) are all being used correctly.
