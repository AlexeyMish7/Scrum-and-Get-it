# 🌿 Branching & Git Workflow Guide

This guide explains how our team uses Git for the **ATS for Candidates** project.

---

## 🧠 Workflow

We follow a **trunk-based workflow**:

* `main` → always stable and demo-ready.
* New work → done on short-lived **feature branches** from `main`.
* Merge to `main` through a **Pull Request (PR)** with one review.

---

## 🌱 Branch Naming

**Format:**

```
type/area-short-description
```

| Type        | Purpose               | Example                      |
| ----------- | --------------------- | ---------------------------- |
| `feat/`     | New feature           | `feat/auth-signup`           |
| `fix/`      | Bug fix               | `fix/login-redirect`         |
| `chore/`    | Maintenance or config | `chore/add-eslint`           |
| `docs/`     | Documentation         | `docs/update-readme`         |
| `test/`     | Testing               | `test/auth-flow`             |
| `refactor/` | Code cleanup          | `refactor/profile-component` |

✅ Use **hyphens** for spaces and keep names short and lowercase.

---

## 🧬 Commit Messages

Follow **Conventional Commits**:

```
type(scope): short summary
```

**Examples:**

```
feat(auth): add google oauth
fix(profile): prevent crash on upload
chore(ci): add GitHub Actions workflow
docs(readme): update setup steps
```

---

## 🔄 Pull Request Process

1. **Create branch**

   ```bash
   git checkout main
   git pull
   git checkout -b feat/auth-login
   ```

2. **Commit & push**

   ```bash
   git add .
   git commit -m "feat(auth): add login form"
   git push -u origin feat/auth-login
   ```

3. **Open PR**

   * Base branch → `main`
   * Add short description + screenshots if UI changed
   * Request 1 review

4. **Merge**

   * All comments resolved
   * Use **Squash and merge**
   * Branch auto-deletes after merge

---

## 🧱 Branch Protection (Main)

* PR required for all merges
* 1 approval required
* Conversations resolved before merge
* No direct pushes or deletions
* Linear history enforced

---

## ✅ Best Practices

* Keep PRs small and focused
* Pull latest `main` before starting new work
* Write clear commit messages
* Don’t commit `.env` or secrets
* Use `.env.example` for team consistency
* Tag sprint demos:

  ```bash
  git tag sprint-1-demo
  git push origin sprint-1-demo
  ```

---

**Last Updated:** October 2025
**Maintainers:** Jane Kalla, Alexey Mishin, Aliya Laliwala, Nafisa Ahmed, Nihaal Warraich
