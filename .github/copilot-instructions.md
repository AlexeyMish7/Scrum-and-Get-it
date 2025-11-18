# GitHub Copilot Instructions for FlowATS

## Primary Instructions Location

Your main context and coding guidelines are located in:

```
.github/instructions/
├── frontend.instructions.md    # React/TypeScript frontend patterns
├── server.instructions.md      # Node.js/Express backend patterns
└── database.instructions.md    # PostgreSQL/Supabase schema and queries
```

**Always read these files first** when working on code to understand:

- Project structure and architecture
- Coding patterns and conventions
- Service layer usage
- Database schema and relationships
- API endpoints and request/response formats

---

## Additional Context

For broader understanding of the application:

```
docs/
├── ARCHITECTURE.md              # How the entire system works
├── GIT_COLLABORATION.md         # Git workflow and branching strategy
├── frontend/                    # Frontend deep-dive docs
├── server/                      # Server deep-dive docs
└── database/                    # Database schema reference
```

Use these when you need to understand:

- How different parts of the app connect
- User flows and data flows
- Feature locations in the codebase
- System design decisions

---

## Code Quality Guidelines

### 1. Add Meaningful Comments

**Always add comments that explain WHY, not WHAT:**

```typescript
// ❌ BAD - States the obvious
// Loop through jobs
jobs.forEach(job => { ... });

// ✅ GOOD - Explains the reason
// Fetch fresh match scores for jobs that don't have cached analytics
jobs.forEach(job => { ... });
```

**Comment complex logic:**

```typescript
// ✅ GOOD
// We rebase the feature branch on main to resolve conflicts locally
// before pushing, which keeps the remote history clean
git rebase origin/main
```

**Add context to business logic:**

```typescript
// ✅ GOOD
// Cache match scores for 7 days to reduce OpenAI API costs
// and improve response time for repeated job views
const CACHE_EXPIRY_DAYS = 7;
```

### 2. Avoid Overly Complex Syntax

**Keep code simple and readable:**

```typescript
// ❌ AVOID - Too clever, hard to read
const active = jobs
  .filter((j) => j.status !== "archived")
  .map((j) => ({ ...j, isActive: true }));

// ✅ PREFER - Clear steps
const nonArchivedJobs = jobs.filter((job) => job.status !== "archived");
const activeJobs = nonArchivedJobs.map((job) => ({
  ...job,
  isActive: true,
}));
```

**Use descriptive variable names:**

```typescript
// ❌ AVOID
const d = new Date();
const ms = d.getTime();

// ✅ PREFER
const currentDate = new Date();
const timestamp = currentDate.getTime();
```

### 3. High-Level, Non-Technical Explanations

When explaining code or writing comments, make them understandable:

```typescript
// ❌ AVOID - Too technical
// Memoize the filtered dataset to prevent unnecessary re-renders
// when parent component re-renders due to unrelated state changes

// ✅ PREFER - Clear and simple
// Remember the filtered jobs so we don't recalculate them
// every time the page updates
const filteredJobs = useMemo(() => { ... }, [jobs, filter]);
```

### 4. NO Markdown Summary Files

**❌ DO NOT create files like:**

- `CHANGES.md`
- `UPDATES.md`
- `SUMMARY.md`
- `MODIFICATIONS.md`

**✅ INSTEAD:**

- Make the changes directly
- Add comments in the code itself
- Provide a brief verbal summary when done

---

## Repository Sync Command

When the user says any of these phrases, perform a full codebase scan and update:

### Trigger Phrases:

- "update instructions"
- "sync docs"
- "refresh context"
- "scan codebase"
- "update everything"

### What to Do:

1. **Scan the codebase:**

   - Read all files in `frontend/src/`
   - Read all files in `server/src/`
   - Read all files in `db/migrations/`
   - Note patterns, new files, changed structures

2. **Update instruction files:**

   - `.github/instructions/frontend.instructions.md`
     - Update workspace structure
     - Add new components/services/hooks
     - Update patterns and conventions
   - `.github/instructions/server.instructions.md`
     - Add new API endpoints
     - Update service patterns
     - Add new prompt templates
   - `.github/instructions/database.instructions.md`
     - Add new tables from migrations
     - Update schema relationships
     - Add new JSONB patterns

3. **Update documentation:**

   - `docs/ARCHITECTURE.md` - Update system flows if architecture changed
   - `docs/frontend/` - Update if major frontend changes
   - `docs/server/` - Update if new endpoints or services
   - `docs/database/` - Update schema if tables changed

4. **Provide summary:**
   ```
   Updated Instructions:
   ✓ Frontend: Added [new workspace/component/pattern]
   ✓ Server: Added [new endpoint/service]
   ✓ Database: Added [new tables/columns]
   ✓ Docs: Updated [which docs changed]
   ```

### Example Usage:

```
User: "update instructions"

You:
[Scan entire codebase]
[Update all instruction files]
[Update relevant docs]

Response:
✓ Scanned 247 files
✓ Updated frontend instructions (added interview_hub workspace patterns)
✓ Updated server instructions (added salary research endpoint)
✓ Updated database instructions (added ai_artifacts table)
✓ Updated ARCHITECTURE.md with new data flows
```

---

## General Coding Principles

### Write Code That:

1. **Is easy to read** - Another developer should understand it quickly
2. **Has clear names** - Functions and variables describe what they do
3. **Is well-commented** - Complex logic explained in plain language
4. **Follows patterns** - Match existing code style in the project
5. **Is simple** - Don't over-engineer, keep it straightforward

### When Writing Code:

- Add comments for business logic and complex operations
- Use simple, clear variable names
- Break complex functions into smaller, named functions
- Prefer readability over clever one-liners
- Explain WHY in comments, not WHAT (code shows what)

### When Making Changes:

- Update the actual code files
- Add inline comments if logic is complex
- Provide a brief summary when done
- Don't create separate markdown documentation files

---

## Quick Reference

**Before coding:** Read `.github/instructions/[relevant].instructions.md`
**Need context:** Check `docs/ARCHITECTURE.md` and specific docs
**Making changes:** Add comments, keep it simple, no summary files
**User says "update instructions":** Full scan + update instructions + update docs

---

Remember: Your job is to write clear, maintainable code that the team can easily understand and work with. When in doubt, choose simplicity and clarity over complexity.
