# 🤝 Collaboration

**Goal:** Avoid merge conflicts and keep `main` clean.

---

## 🧱 Basic Rules

1. **Announce in chat** when working on an existing file.
2. **Pull before pushing** so your branch is up to date.
3. **Announce after pushing** so others can pull.
4. **Never push directly to `main`** — always use feature branches.

> Example: “Working on `AuthForm.tsx` — pushing soon.”

---

## 🌿 Git Workflow Summary

```bash
git checkout main
git pull                   # get latest code
git checkout -b feat/auth   # create new branch
# make edits
git add . && git commit -m "feat(auth): add login"
git pull --rebase origin main   # update branch
git push -u origin feat/auth    # push branch
```

Then open a **Pull Request** → get one review → **Squash & Merge** into `main`.

---

## ⬇️ Quick Pull Guide

| Task                       | Command                         |
| -------------------------- | ------------------------------- |
| Update `main`              | `git checkout main && git pull` |
| Update your feature branch | `git pull --rebase origin main` |
| Delete branch after merge  | `git branch -d feat/auth`       |

---

## ⚡ If You Get a Conflict

1. Fix the file (look for `<<<<<<<` markers).
2. `git add .`
3. `git rebase --continue`

If stuck: `git rebase --abort`

---

## 🧠 Merge vs Rebase (Simple)

- **Merge:** Keeps all history, adds extra “merge commit.”
- **Rebase:** Replays your work on top of main → cleaner history.

Use: `git pull --rebase origin main`

---

## ✅ Do’s & Don’ts

**Do:** Pull often, keep PRs small, announce pushes.

**Don’t:** Push to main, leave conflicts unresolved, or force-push shared branches.

---

## 🧪 Real-World Workflows & Scenarios

### Scenario 1 — Start a new feature cleanly

_When:_ You’re beginning new work from scratch for a ticket and haven’t made local changes yet.

```bash
git checkout main
git pull                      # sync main
git checkout -b feat/auth-ui  # new branch
# ...code, commit...
```

### Scenario 2 — Main changed while you were coding

_When:_ Teammates merged PRs into `main` after you created your branch, and you want the latest code before pushing.

```bash
# on your feature branch
git pull --rebase origin main   # replay your commits on latest main
# fix any conflicts → git add . → git rebase --continue
```

### Scenario 3 — You and a teammate edited the same file (conflict)

_When:_ Your rebase detects overlapping edits (e.g., both touched `App.tsx` or shared types) and stops with conflict markers.

```bash
git pull --rebase origin main
# CONFLICT markers appear in file(s)
# edit to final version, then:
git add <file>
git rebase --continue
# if it goes sideways:
# git rebase --abort
```

### Scenario 4 — Need to quickly switch branches but you have uncommitted changes

_When:_ You must jump to another branch (e.g., urgent review or hotfix) but your current work isn’t ready to commit.

```bash
git stash push -m "wip: auth-ui before switching"
git checkout main && git pull
# later, back to your branch
git checkout feat/auth-ui
git stash pop
```

### Scenario 5 — Your push is rejected (remote has new commits)

_When:_ GitHub says your branch is behind and rejects the push; someone pushed to `main` (or your branch) since your last pull.

```bash
# on your feature branch
git pull --rebase origin main   # update first
git push                        # now it succeeds
```

---

**Maintainers:** Jane Kalla, Alexey Mishin, Aliya Laliwala, Nafisa Ahmed, Nihaal Warraich
