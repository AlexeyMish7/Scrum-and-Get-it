# 🤝 Collaboration

Concise developer guide for working in the repository. This document is focused on using `dev` as the integration branch for feature work.

---

## 🌿 Git Workflow Summary

```bash
# start from dev (integration branch)
git checkout dev
git pull                   # get latest code
git checkout -b feat/short-descriptive-name   # create new branch
# make edits
git add . && git commit -m "feat(scope): short description"
git pull --rebase origin dev   # update branch before push
git push -u origin feat/short-descriptive-name    # push branch
```

Then open a **Pull Request** → request one review → **Squash & Merge** into `dev`.

---

## ⬇️ Quick Pull Guide

| Task                       | Command                        |
| -------------------------- | ------------------------------ |
| Update `dev`               | `git checkout dev && git pull` |
| Update your feature branch | `git pull --rebase origin dev` |
| Delete branch after merge  | `git branch -d feat/auth`      |

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

## Quick checks before opening a PR

- Run typecheck and lint in frontend:

  ```powershell
  cd frontend
  npm run typecheck
  npm run lint
  ```

- Add or update tests where appropriate. Keep PRs small (1–3 files) when possible.
- If the change touches DB schema, add a migration under `db/migrations/` and include rollback notes in the PR.

---

## Quick pull & update guide

| Task                       | Command                        |
| -------------------------- | ------------------------------ |
| Update `dev`               | `git checkout dev && git pull` |
| Update your feature branch | `git pull --rebase origin dev` |
| Delete branch after merge  | `git branch -d feat/xxx`       |

---

## Conflict tips

1. Resolve `<<<<<<<` markers and keep the intended final code.
2. `git add <file>` and `git rebase --continue`.
3. If stuck, `git rebase --abort` and ask for help.

If switching branches with uncommitted work, stash it:

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
