# Git Collaboration Guide

This guide explains our team's Git workflow, branching strategy, and best practices for the FlowATS project.

## Our Git Strategy

### Core Principles

1. **Work off `main` branch** - All feature branches branch from `main`
2. **Feature branches** - Each new feature gets its own branch
3. **No branch reuse** - Once a branch is merged, it's deleted (never reused)
4. **Rebase before push** - Always rebase on main to resolve conflicts locally
5. **Keep main stable** - Only merge tested, working code

---

## Branching Strategy

### Branch Naming Convention

```
feature/<feature-name>      # New features
fix/<bug-description>       # Bug fixes
refactor/<component-name>   # Code refactoring
docs/<doc-name>             # Documentation updates
```

**Examples:**

```bash
feature/job-filtering
fix/resume-export-crash
refactor/skills-service
docs/api-endpoints
```

### Creating a Feature Branch

```powershell
# 1. Make sure you're on main
git checkout main

# 2. Get the latest code
git pull origin main

# 3. Create your feature branch
git checkout -b feature/job-filtering

# 4. Start working!
```

**Why rebase before push?**

- Conflicts are resolved locally (easier to fix)
- Your code is tested with the latest changes
- Keeps history clean and linear
- Easier to review

---

## The Rebase Workflow

### Step 1: Fetch Latest Changes

```powershell
# While on your feature branch
git fetch origin
```

**What this does:** Downloads the latest code from GitHub without merging

---

### Step 2: Rebase on Main

```powershell
# Rebase your branch on top of main
git rebase origin/main
```

**What this does:** Replays your commits on top of the latest main branch

**Two possible outcomes:**

#### ✅ No Conflicts

```
Successfully rebased and updated refs/heads/feature/job-filtering
```

**Action:** Skip to Step 4 (push your code)

#### ⚠️ Conflicts Detected

```
CONFLICT (content): Merge conflict in src/services/jobsService.ts
```

**Action:** Continue to Step 3 (resolve conflicts)

---

### Step 3: Resolve Conflicts (If Any)

#### What Happened?

Someone else modified the same file you changed. Git needs you to choose which changes to keep.

#### Conflict Markers in File

```typescript
<<<<<<< HEAD (main branch version)
export const deleteJob = async (jobId: number) => {
  return await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);
=======
export const deleteJob = async (userId: string, jobId: number) => {
  return await withUser(userId).deleteRow('jobs', jobId);
>>>>>>> Your changes
}
```

#### How to Resolve

**Option 1: VS Code UI**

1. Open the file in VS Code
2. You'll see buttons: "Accept Current Change" | "Accept Incoming Change" | "Accept Both"
3. Click the appropriate option
4. Save the file

**Option 2: Manual Edit**

1. Open the file
2. Delete the `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Keep the code you want (or combine both)
4. Save the file

**Example Resolution:**

```typescript
// Keep the newer version with userId parameter
export const deleteJob = async (userId: string, jobId: number) => {
  return await withUser(userId).deleteRow("jobs", jobId);
};
```

#### Mark as Resolved

```powershell
# Add the resolved file
git add src/services/jobsService.ts

# Continue the rebase
git rebase --continue
```

#### If More Conflicts

Repeat until all conflicts are resolved.

#### Aborting a Rebase

```powershell
# If you want to start over
git rebase --abort
```

---

### Step 4: Test Your Code

```powershell
# Run the app to make sure everything works
.\dev.ps1

# Run tests if available
npm test
```

**Why test after rebase?**

- Rebasing may have introduced incompatibilities
- Ensures your feature still works with latest main

---

### Step 5: Force Push Your Branch

```powershell
# Push your rebased branch
git push origin feature/job-filtering --force-with-lease
```

**Why `--force-with-lease`?**

- Rebasing rewrites history, so normal push fails
- `--force-with-lease` is safer than `--force` (won't overwrite others' work)

---

## Complete Workflow Example

### Scenario: You're adding a job filtering feature

```powershell
# 1. Start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/job-filtering

# 3. Make changes
# ... edit files ...
git add .
git commit -m "Add job filtering by status"

# 4. More changes
# ... more edits ...
git add .
git commit -m "Add company name filter"

# 5. Ready to push - rebase first!
git fetch origin
git rebase origin/main

# 6. Resolve conflicts if any
# ... fix conflicts ...
git add .
git rebase --continue

# 7. Test
.\dev.ps1
# ... verify everything works ...

# 8. Push
git push origin feature/job-filtering --force-with-lease

# 9. Create Pull Request on GitHub
```

---

## Common Scenarios

### Scenario 1: Your Branch is Behind Main

**Symptoms:**

- GitHub shows "This branch is 5 commits behind main"
- Pull request has conflicts

**Solution:**

```powershell
git checkout feature/job-filtering
git fetch origin
git rebase origin/main
# Resolve conflicts if any
git push origin feature/job-filtering --force-with-lease
```

---

### Scenario 2: You Pushed Before Rebasing

**What happened:**

- You pushed your branch
- Main was updated
- Now there are conflicts

**Solution:**

```powershell
git fetch origin
git rebase origin/main
# Resolve conflicts
git push origin feature/job-filtering --force-with-lease
```

**Note:** Never force-push to `main`! Only force-push to your feature branches.

---

### Scenario 3: Someone Else Worked on Your Branch

**What happened:**

- You and a teammate both pushed to the same feature branch

**Solution:**

```powershell
# Pull their changes first
git pull origin feature/job-filtering --rebase

# Then push yours
git push origin feature/job-filtering
```

**Better approach:** Avoid this! One person per feature branch.

---

### Scenario 4: You Need Code from Another Feature Branch

**What happened:**

- You need a function from `feature/resume-export` but it's not merged yet

**Solution:**

**Option 1: Wait (Recommended)**

- Wait for the other branch to be merged to main
- Then rebase your branch

**Option 2: Cherry-pick**

```powershell
# Find the commit hash with the code you need
git log feature/resume-export

# Cherry-pick that commit
git cherry-pick abc123

# Be aware: This may cause conflicts when rebasing later
```

**Option 3: Coordinate**

- Ask teammate to merge their feature first
- Rebase your branch
- Continue your work

---

### Scenario 5: You Made Commits to Main by Mistake

**What happened:**

- You forgot to create a branch and committed to main

**Solution:**

```powershell
# 1. Create a new branch from current position
git checkout -b feature/accidental-commits

# 2. Reset main to origin
git checkout main
git reset --hard origin/main

# 3. Continue working on the feature branch
git checkout feature/accidental-commits
```

---

## Merging to Main

### Pull Request Process

1. **Push your branch** (after rebasing!)

   ```powershell
   git push origin feature/job-filtering --force-with-lease
   ```

2. **Open Pull Request on GitHub**

   - Go to repository on GitHub
   - Click "Compare & pull request"
   - Add description of changes
   - Request review from teammates

3. **Code Review**

   - Team reviews your code
   - You make requested changes
   - Commit and push fixes

4. **Final Rebase Before Merge**

   ```powershell
   git fetch origin
   git rebase origin/main
   git push origin feature/job-filtering --force-with-lease
   ```

5. **Merge on GitHub**

   - Click "Squash and merge" or "Merge pull request"
   - Delete the branch after merging

6. **Update Local Main**
   ```powershell
   git checkout main
   git pull origin main
   git branch -d feature/job-filtering  # Delete local branch
   ```

---

## Git Commands Reference

### Setup & Configuration

```powershell
# Clone the repository
git clone <repository-url>

# Configure your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# View configuration
git config --list
```

### Branching

```powershell
# List all branches
git branch -a

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

### Committing

```powershell
# Check status
git status

# Stage files
git add .                  # All files
git add src/file.ts        # Specific file

# Commit
git commit -m "Add feature X"

# Amend last commit (before pushing)
git commit --amend -m "Updated message"

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Syncing

```powershell
# Fetch latest from remote
git fetch origin

# Pull with rebase
git pull origin main --rebase

# Push
git push origin feature/branch-name

# Force push (only on feature branches!)
git push origin feature/branch-name --force-with-lease
```

### Rebasing

```powershell
# Rebase on main
git rebase origin/main

# Continue after resolving conflicts
git rebase --continue

# Skip a commit during rebase
git rebase --skip

# Abort rebase
git rebase --abort

# Interactive rebase (squash commits)
git rebase -i HEAD~3
```

### Viewing History

```powershell
# View commit log
git log

# Compact log
git log --oneline

# View changes
git diff

# View changes in a file
git diff src/file.ts

# View commit details
git show abc123
```

### Stashing (Temporary Save)

```powershell
# Save work-in-progress
git stash

# Save with message
git stash save "WIP: job filtering"

# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply and remove stash
git stash pop

# Remove stash
git stash drop
```

---

## Troubleshooting

### "Your branch and origin/branch have diverged"

**Cause:** You rebased after pushing

**Solution:**

```powershell
git push origin feature/branch-name --force-with-lease
```

---

### "refusing to merge unrelated histories"

**Cause:** Trying to merge branches with no common ancestor

**Solution:**

```powershell
# This shouldn't happen with our workflow
# If it does, consult team lead
git pull origin main --allow-unrelated-histories
```

---

### "CONFLICT: cannot merge because you have unmerged files"

**Cause:** Previous conflict resolution not completed

**Solution:**

```powershell
# Check which files have conflicts
git status

# After resolving conflicts
git add .
git rebase --continue
```

---

### "fatal: not a git repository"

**Cause:** You're not in a Git-tracked folder

**Solution:**

```powershell
# Navigate to project root
cd C:\School\Fall2025\Cs490\Scrum-and-Get-it

# Or initialize Git (for new projects)
git init
```

---

### Lost Commits After Rebase

**Cause:** Rebase went wrong

**Solution:**

```powershell
# Find lost commit
git reflog

# Reset to that commit
git reset --hard abc123
```

---

## Best Practices

### ✅ Do

- **Commit often** - Small, focused commits are easier to review
- **Write clear commit messages** - "Fix login bug" not "fix"
- **Rebase before pushing** - Always sync with main first
- **Test after rebasing** - Make sure your code still works
- **Delete merged branches** - Keep repository clean
- **Ask for help** - If stuck, reach out to team

### ❌ Don't

- **Don't force-push to main** - Ever!
- **Don't commit secrets** - Use .env files (not tracked)
- **Don't reuse branches** - Create new branch for each feature
- **Don't work directly on main** - Always use feature branches
- **Don't merge without review** - Wait for PR approval
- **Don't commit large binary files** - Use Git LFS if needed

---

## Commit Message Guidelines

### Format

```
<type>: <short summary> (50 chars max)

<detailed description> (optional)

<footer> (optional - issue numbers, breaking changes)
```

### Types

- **feat** - New feature
- **fix** - Bug fix
- **refactor** - Code restructuring (no behavior change)
- **docs** - Documentation changes
- **style** - Formatting, missing semicolons, etc.
- **test** - Adding tests
- **chore** - Build tasks, dependency updates

### Examples

**Good:**

```
feat: add job filtering by company name

Implemented search input and filter logic in JobsService.
Updated KanbanBoard to use filtered jobs.

Closes #123
```

**Bad:**

```
updated stuff
```

---

## Getting Help

### Check Status

```powershell
git status          # What's changed?
git log --oneline   # Recent commits
git branch          # Which branch am I on?
```

### Undo Changes

```powershell
# Undo uncommitted changes
git checkout -- src/file.ts

# Undo all uncommitted changes
git reset --hard

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Team Communication

- **Before big changes:** Let team know in chat
- **Pull request:** Assign reviewers, explain changes
- **Conflicts:** Ask for help if confused
- **Main branch issues:** Alert team immediately

---

This Git workflow keeps our codebase clean, makes code review easier, and prevents merge hell. When in doubt, rebase and communicate!
