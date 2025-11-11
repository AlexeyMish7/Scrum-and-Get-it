# Job Matching Feature - Implementation Guide

## Overview

The Job Matching feature (UC-065, UC-066, UC-049, UC-050) provides AI-powered job analysis to help users:

- Calculate match scores based on skills and experience
- Identify skills gaps for specific job opportunities
- Get tailored experience suggestions for applications
- Save analysis artifacts for future reference

## Features Implemented

### 1. Job Matching Hook (`useJobMatching`)

**Location**: `frontend/src/app/workspaces/ai/hooks/useJobMatching.ts`

**Purpose**: Core logic for AI-powered job matching analysis

**Key Functions**:

- `runMatch(jobId)`: Analyzes a job against user profile

  - Calls AI endpoints for skills optimization and experience tailoring
  - Fetches user's current skills from database
  - Computes match score (0-100%) with breakdown by category
  - Extracts skill suggestions and experience bullets

- `saveArtifact(options)`: Persists analysis to database
  - Saves to `ai_artifacts` table with type 'match'
  - Links artifact to specific job
  - Stores match score, breakdown, and all suggestions

**State Management**:

- `isLoading`: Analysis in progress
- `error`: Error message if analysis fails
- `matchScore`: Overall match percentage (0-100)
- `breakdown`: Category scores (skills, experience)
- `skillsSuggestions`: Array of suggested skills
- `experienceSuggestions`: Array of experience bullets
- `rawResponses`: Full AI responses for debugging

### 2. Job Match Page (`JobMatch`)

**Location**: `frontend/src/app/workspaces/ai/pages/JobMatch/index.tsx`

**Route**: `/ai/job-match`

**Features**:

- **Job Selection**: Dropdown to select from user's jobs
- **Analysis Trigger**: "Analyze" button to run match analysis
- **Match Score Display**:
  - Large overall score with color coding (green/yellow/red)
  - Category breakdown (Skills, Experience)
  - Visual progress bars for each category
- **Skills Gap Analysis**:
  - Chips showing suggested/required skills
  - Identifies gaps in user's profile
- **Experience Tailoring**:
  - AI-generated bullets to highlight for job
  - Top 5 suggestions shown by default
- **Save Functionality**: Persist analysis with descriptive title
- **Error Handling**: User-friendly error messages with ErrorSnackbar
- **Empty/Loading States**: Clear feedback during all states

**UI Components Used**:

- Material-UI v7 components
- Icons from `@mui/icons-material`
- ErrorSnackbar for notifications
- Responsive layout with cards and stacks

## Data Flow

```
User selects job
     ↓
Click "Analyze"
     ↓
useJobMatching.runMatch(jobId)
     ↓
Parallel API calls:
  - generateSkillsOptimization(userId, jobId)
  - generateExperienceTailoring(userId, jobId)
  - listSkills(userId)
     ↓
Parse AI responses:
  - Extract required skills
  - Extract experience bullets
  - Calculate match scores
     ↓
Display results in UI
     ↓
User clicks "Save Analysis"
     ↓
saveArtifact() → ai_artifacts table
```

## Match Score Algorithm

**Overall Score**: Weighted average of category scores

- Skills: 60% weight
- Experience: 40% weight
- Education: 0% (not implemented in v1)

**Skills Score**:

- Calculates intersection of required skills vs user skills
- Score = (matched skills / required skills) × 100
- Case-insensitive matching

**Experience Score**:

- Heuristic based on number of AI-generated bullets
- Score = min(100, number_of_bullets × 20)
- More bullets = higher perceived relevance

## AI Integration

### Endpoints Used

1. **generateSkillsOptimization(userId, jobId)**

   - Returns job-specific skill requirements
   - Output format varies (array of skills or text)
   - Parsing handles multiple formats

2. **generateExperienceTailoring(userId, jobId)**
   - Returns suggested experience bullets
   - Highlights relevant accomplishments
   - Formatted for resume/cover letter use

### Response Parsing

The hook includes robust parsing to handle various AI response formats:

- Structured objects with `content.skills` arrays
- Text-based responses with comma/newline separation
- Nested bullet arrays
- Fallback to basic string splitting

## Database Schema

### ai_artifacts Table

Analysis results saved with:

- `kind`: "match"
- `title`: "Match: [Job Title] at [Company]"
- `job_id`: FK to jobs table
- `content`: JSON with:
  ```json
  {
    "matchScore": 75,
    "breakdown": {
      "skills": 80,
      "experience": 70
    },
    "skillsSuggestions": ["React", "TypeScript", ...],
    "experienceSuggestions": ["Built scalable apps...", ...],
    "raw": { /* original AI responses */ }
  }
  ```
- `metadata`: Empty object (for future use)

## Environment Requirements

### Required Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Backend Requirements

The AI generation server must be running with:

- POST `/api/generate/skills-optimization`
- POST `/api/generate/experience-tailoring`
- Both endpoints accept: `{ userId, jobId }`

## Usage Guide

### For Users

1. Navigate to `/ai/job-match`
2. Select a job from the dropdown
3. Click "Analyze" and wait for AI processing (~5-10 seconds)
4. Review match score and suggestions
5. Click "Save Analysis" to persist results
6. Use "Re-analyze" to refresh analysis with updated profile

### For Developers

**Adding New Match Categories**:

1. Update `breakdown` type in `useJobMatching.ts`
2. Add API call in `runMatch()` function
3. Calculate new category score
4. Update overall score calculation with new weight
5. Add display component in JobMatch page

**Improving Parsing**:
Edit the extraction logic in `runMatch()`:

```typescript
// Example: Add new parsing strategy
if (skillsContent && skillsContent.skillList) {
  requiredSkills.push(...skillsContent.skillList);
}
```

**Customizing UI**:

- Edit color thresholds in `getScoreColor()`
- Adjust weights in score calculation
- Modify card layouts in JobMatch component

## Testing

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Job dropdown populated with user's jobs
- [ ] "Analyze" button triggers loading state
- [ ] Match score displays after analysis
- [ ] Category breakdowns show correct percentages
- [ ] Skills suggestions appear as chips
- [ ] Experience bullets display in cards
- [ ] "Save Analysis" shows success message
- [ ] Error handling works (try with no jobs/disconnected backend)
- [ ] Back button navigates to /ai dashboard

### Automated Tests

See `__tests__/useJobMatching.test.md` for test plan and setup instructions.

## Known Limitations & Future Enhancements

### Current Limitations

1. **AI Response Variability**: Parsing may fail on unexpected formats
2. **No Education Matching**: Education score always 0
3. **Basic Skill Matching**: Exact string match only (no synonyms)
4. **No Learning Resources**: "Learn" button not implemented
5. **Limited Error Recovery**: AI failures don't retry automatically

### Planned Enhancements

1. **Synonym Matching**: Match "JS" with "JavaScript"
2. **Skill Proficiency**: Weight matches by user's skill level
3. **Education Analysis**: Parse degree requirements
4. **Learning Paths**: Link to courses/resources for gap skills
5. **Historical Comparison**: Show match score trends over time
6. **Batch Analysis**: Analyze multiple jobs at once
7. **Export to Resume**: One-click apply suggestions to draft

## Troubleshooting

### No jobs in dropdown

- Ensure user has added jobs via `/jobs/new`
- Check `jobs` table has entries for user
- Verify RLS policies allow user to read own jobs

### Analysis never completes

- Check browser console for errors
- Verify backend server is running
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check network tab for 500 errors from AI endpoints

### Match score always 0

- Ensure user has skills added in profile
- Verify AI endpoints return valid data (check rawResponses in state)
- Check parsing logic catches response format

### Save fails silently

- Check browser console for errors
- Verify user is authenticated
- Ensure `ai_artifacts` table RLS allows inserts
- Check `job_id` exists in `jobs` table

## File Reference

### Core Files

- `frontend/src/app/workspaces/ai/hooks/useJobMatching.ts` - Main hook
- `frontend/src/app/workspaces/ai/pages/JobMatch/index.tsx` - UI component
- `frontend/src/router.tsx` - Route definition
- `frontend/src/app/shared/services/aiArtifacts.ts` - Artifact CRUD
- `frontend/src/app/workspaces/ai/services/aiGeneration.ts` - AI endpoints

### Related Files

- `frontend/src/app/shared/hooks/useUserJobs.ts` - Jobs loader
- `frontend/src/app/workspaces/profile/services/skills.ts` - Skills service
- `db/migrations/2025-11-07_add_ai_artifacts_table.sql` - DB schema

## Support & Contribution

For issues or feature requests related to Job Matching:

1. Check existing issues in GitHub
2. Verify environment setup (backend running, env vars set)
3. Include browser console logs and network requests
4. Provide example job data that causes issues

To contribute:

1. Follow project's branching strategy (feature branches)
2. Add tests for new parsing logic or score calculations
3. Update this doc with any new features or changes
4. Ensure TypeScript passes: `npm run typecheck`
