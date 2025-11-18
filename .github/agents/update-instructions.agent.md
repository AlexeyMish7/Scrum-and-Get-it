# FlowATS Instructions Update Agent

name: update-instructions
description: Scans the FlowATS codebase and updates GitHub Copilot instruction files to keep AI assistance current with code changes

## Purpose

This agent helps maintain accurate and up-to-date instruction files for GitHub Copilot by:

- Analyzing the current codebase structure
- Identifying new patterns, conventions, and architectural decisions
- Updating `.github/instructions/` files with latest information
- Ensuring Copilot provides accurate guidance based on current code

## When to Use

Run this agent when:

- Significant refactoring has been completed
- New architectural patterns are introduced
- Database schema changes
- New services or modules added
- Major dependency updates
- After completing a sprint with substantial changes

## How It Works

The agent performs a comprehensive codebase scan and updates three instruction files:

### 1. Frontend Instructions (`frontend.instructions.md`)

**Scans:**

- `frontend/src/app/workspaces/` - All workspace modules
- `frontend/src/app/shared/` - Shared components, services, hooks
- `frontend/src/app/shared/services/` - Service layer patterns
- `frontend/src/app/shared/context/` - React Context providers
- Component patterns and naming conventions
- State management approaches
- Type definitions and interfaces

**Updates:**

- Component structure guidelines
- Service layer usage patterns
- Custom hook patterns
- Context usage examples
- Event-driven communication patterns
- CRUD operation conventions
- Error handling patterns
- TypeScript type usage

### 2. Server Instructions (`server.instructions.md`)

**Scans:**

- `server/src/routes/` - All API endpoints
- `server/src/services/` - Business logic services
- `server/prompts/` - AI prompt templates
- `server/src/middleware/` - Middleware functions
- Request/response patterns
- Error handling conventions
- Authentication patterns

**Updates:**

- Route handler structure
- Service layer patterns
- Prompt engineering guidelines
- Middleware usage
- Error response formats
- Type definitions for requests/responses
- External API integration patterns

### 3. Database Instructions (`database.instructions.md`)

**Scans:**

- `db/migrations/` - All migration files
- Frontend services using Supabase
- Server database queries
- RLS policies from migrations
- Table relationships
- JSONB usage patterns

**Updates:**

- Current schema structure
- Table relationships and foreign keys
- Required vs optional fields
- JSONB column structures
- RLS policy patterns
- Migration conventions
- Indexing patterns

## Usage

```bash
# Run the agent manually
@update-instructions scan the codebase and update all instruction files

# Specify a specific instruction file
@update-instructions update frontend instructions only

# After a major refactor
@update-instructions we just refactored the service layer, please update instructions
```

## Agent Workflow

1. **Scan Phase**

   - Read all relevant files in the workspace
   - Identify patterns, conventions, and structures
   - Note new additions since last update
   - Detect deprecated patterns

2. **Analysis Phase**

   - Compare current code to existing instructions
   - Identify discrepancies or outdated information
   - Find new patterns that should be documented
   - Determine which instructions need updates

3. **Update Phase**

   - Rewrite affected instruction sections
   - Add new patterns and conventions
   - Remove deprecated guidelines
   - Ensure consistency across all instruction files

4. **Validation Phase**
   - Verify instructions match current codebase
   - Check for completeness
   - Ensure examples are accurate
   - Validate file paths and references

## What Gets Updated

### Frontend Instructions

**Component Patterns:**

```markdown
✓ Current component structure (Pages, Views, Components)
✓ Props interfaces and naming
✓ Event handler conventions
✓ State management patterns
```

**Service Layer:**

```markdown
✓ CRUD operation patterns (withUser, insertRow, updateRow, deleteRow)
✓ Error handling (try/catch, useErrorHandler)
✓ Service return types
✓ Database mapper usage
```

**Context & Hooks:**

```markdown
✓ Context providers and consumers
✓ Custom hook patterns
✓ State initialization
✓ Event listeners and cleanup
```

### Server Instructions

**API Endpoints:**

```markdown
✓ Route definitions and methods
✓ Request body validation
✓ Response formats
✓ Error handling
✓ Authentication requirements
```

**Services:**

```markdown
✓ Service function signatures
✓ External API integration patterns
✓ Caching strategies
✓ Rate limiting
```

**Prompts:**

```markdown
✓ Prompt template structure
✓ Variable injection patterns
✓ Response parsing
✓ Error handling
```

### Database Instructions

**Schema:**

```markdown
✓ Table structure and columns
✓ Data types and constraints
✓ Foreign key relationships
✓ Unique constraints
```

**Patterns:**

```markdown
✓ JSONB usage (structure and querying)
✓ RLS policies
✓ Triggers and functions
✓ Migration naming conventions
```

## Example Prompts

**Full Update:**

```
@update-instructions we've completed Sprint 5 with major changes to job pipeline
and AI generation. Please scan the entire codebase and update all instruction files.
```

**Targeted Update:**

```
@update-instructions we added a new salary research API endpoint and service.
Update server instructions with the new patterns.
```

**After Refactor:**

```
@update-instructions we refactored all CRUD services to use a new withUser pattern.
Update frontend instructions to reflect this change.
```

**Schema Changes:**

```
@update-instructions we added 3 new tables (ai_artifacts, resume_drafts, cover_letter_drafts).
Update database instructions with new schema.
```

## Output Format

The agent provides a summary of changes:

```markdown
## Instruction Update Summary

### Frontend Instructions Updated

- ✓ Added new workspace pattern for `interview_hub`
- ✓ Updated service layer to reflect `withUser` pattern
- ✓ Added new custom hook pattern: `useInterviewSchedule`
- ✓ Updated event-driven communication examples

### Server Instructions Updated

- ✓ Added new endpoint: POST /api/salary/research
- ✓ Updated prompt engineering guidelines
- ✓ Added caching pattern for salary data

### Database Instructions Updated

- ✓ Added new tables: ai_artifacts, resume_drafts, cover_letter_drafts
- ✓ Updated JSONB patterns with new examples
- ✓ Added RLS policies for new tables

### Files Modified

- .github/instructions/frontend.instructions.md
- .github/instructions/server.instructions.md
- .github/instructions/database.instructions.md
```

## Best Practices

1. **Run After Major Changes:** Don't wait too long between updates
2. **Review Changes:** Always review the updated instructions before committing
3. **Be Specific:** Provide context about what changed when invoking the agent
4. **Test Copilot:** After updating, test that Copilot suggestions align with new instructions
5. **Version Control:** Commit instruction updates with descriptive messages

## Maintenance Schedule

**Recommended Update Frequency:**

- After each sprint (every 2 weeks)
- After major refactoring
- When new patterns are established
- Before onboarding new team members
- After dependency upgrades that change patterns

## Notes

- The agent reads code but doesn't modify it (only updates instruction files)
- Instruction files should be committed to version control
- Keep instructions focused on patterns, not implementation details
- Use examples from actual codebase, not hypothetical ones
- Maintain consistent formatting across all instruction files

---

**Last Updated:** 2025-01-XX (Update this date when agent runs)
