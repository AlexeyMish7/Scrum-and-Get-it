# 🤝 Collaboration

Concise developer guide for working in the repository. This document is focused on using `main` as the canonical branch for feature work.

---

## 🌿 Git Workflow Summary

```bash
# start from main (integration branch)
git checkout main
git pull                   # get latest code
git checkout -b feat/short-descriptive-name   # create new branch
# make edits
git add . && git commit -m "feat(scope): short description"
git pull --rebase origin main   # update branch before push
git push -u origin feat/short-descriptive-name    # push branch
```

Then open a **Pull Request** → request one review → **Squash & Merge** into `main`.

---

## Branch naming suggestions

- Feature: `feat/<short-descriptive-name>` (e.g. `feat/login-oauth`)
- Bugfix: `fix/<short-descriptive-name>` (e.g. `fix/profile-avatar-upload`)
- Chore/config: `chore/<what>` (e.g. `chore/lint-rules`)
- Hotfix: `hotfix/<short-desc>` (used for urgent fixes merged into main/released branches)

Keep names lowercase, use hyphens, and keep branches short and focused.

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
| Update `main`              | `git checkout main && git pull` |
| Update your feature branch | `git pull --rebase origin main` |
| Delete branch after merge  | `git branch -d feat/xxx`       |

---

## Conflict tips

1. Resolve `<<<<<<<` markers and keep the intended final code.
2. `git add <file>` and `git rebase --continue`.
3. If stuck, `git rebase --abort` and ask for help.

If switching branches with uncommitted work, stash it:

```bash
git stash push -m "wip: brief note"
git checkout dev && git pull
git checkout feat/xxx
git stash pop
```

---

## Pull Request checklist (add to PR description)

- Small change summary (one line)
- Files changed (one-line per file)
- Typecheck & lint status (include commands used):
  - `cd frontend; npm run typecheck`
  - `cd frontend; npm run lint`
- Manual verification steps (happy path + one edge case)
- Migration notes if DB/schema changes were added

---

## Suggested reviewers & maintainers

- Maintainers: Jane Kalla, Alexey Mishin, Aliya Laliwala, Nafisa Ahmed, Nihaal Warraich

---

If you'd like a separate developer-only file (very short cheat-sheet) we can keep `docs/collabdev.md` as a quick-reference; otherwise I can remove it.
_When:_ GitHub says your branch is behind and rejects the push; someone pushed to `main` (or your branch) since your last pull.
