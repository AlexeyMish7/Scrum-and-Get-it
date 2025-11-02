# ⚙️ Full Project Setup Guide

**Project:** ATS for Candidates (CS490 Capstone – “Scrum and Get It”)

This guide explains how to set up the project **locally from scratch** so every team member has the same development environment.
It covers cloning the repository, installing dependencies, configuring Node.js and npm, and running the frontend (and later backend if applicable).

---

## 🪜 1. Prerequisites

### ✅ Required Tools

| Tool                        | Purpose                                                   | Install Guide                                                  |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| **Git**                     | Version control                                           | [https://git-scm.com/downloads](https://git-scm.com/downloads) |
| **nvm**                     | Manage Node.js versions                                   | See OS instructions below                                      |
| **npm**                     | Dependency manager (installed automatically with Node.js) | Included with Node                                             |
| **VS Code** *(recommended)* | Editor for coding and debugging                           | [https://code.visualstudio.com](https://code.visualstudio.com) |

> 🧠 **Note:** You only need to install **nvm** once on your computer. After it’s installed, you can use it for all future Node.js projects.

---

### 🪟 For Windows Users

1. Download and install **nvm-windows**:
   👉 [nvm-setup.exe (v1.2.2)](https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe)
2. Accept all defaults during installation.
3. Restart PowerShell or Terminal.
4. Verify install:

   ```bash
   nvm version
   ```

---

### 🍎 For macOS / Linux Users

1. Run in terminal:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   ```
2. Restart terminal (or run `source ~/.bashrc` / `source ~/.zshrc`).
3. Verify:

   ```bash
   nvm -v
   ```

---

## 🧱 2. Clone the Repository

First, clone the project from GitHub and open it:

```bash
git clone https://github.com/AlexeyMish7/Scrum-and-Get-it.git
cd Scrum-and-Get-it
```

You now have the project locally.
It includes two main directories:

```
Scrum-and-Get-it/
 ├── frontend/   # React + TypeScript (Vite)
 ├── docs/       # Project docs (PRD, setup, branching, etc.)
 └── ...         # Backend folder will be added later
```

---

## ⚙️ 3. Set Up Node.js and npm Versions

The project root contains an **.nvmrc** file that specifies the required Node.js version.

> 📍 **Important:** Make sure you are inside the **project root folder (`Scrum-and-Get-it/`)** before running any `nvm` commands. Otherwise, `nvm use` will not detect the `.nvmrc` file.

1. From inside the root folder, install and activate the correct version:

   ```bash
   nvm install 20.19.5
   nvm use 20.19.5
   ```

   > If you just type `nvm use` without a version, it will only work if you’re inside the root folder where `.nvmrc` exists.

2. Verify your versions:

   ```bash
   node -v   # should show v20.19.5
   npm -v    # should show 10.8.2 or higher
   ```

> ⚠️ Always use **Node 20.19.5** and **npm ≥10.8.2** to avoid build or dependency errors.

---

## 🧩 4. Run the Frontend

1. Navigate to the frontend folder:

   ```bash
   cd frontend
   ```
2. Install dependencies:

   ```bash
   npm ci
   ```

   *(Use `npm install` only if you don’t have a package-lock.json conflict.)*
3. Start the development server:

   ```bash
   npm run dev
   ```
4. Open the local dev URL in your browser (shown in terminal):

   ```
   ➜ Local: http://localhost:5173/
   ```

You should see the default **React + TypeScript + Vite** page 🎉

---

## 🧮 5. Backend (Future Setup Placeholder)

The backend will use **Supabase** for database, authentication, and storage.

✅ Planned components:

* Supabase PostgreSQL (database)
* Supabase Auth (email + Google OAuth)
* Supabase Storage (resume uploads)

When backend setup begins:

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy your API keys and database URL
4. Add them to `.env` (see example below)

Example `.env` (to be created later):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Do **not** commit `.env` — use `.env.example` for teammates.

---

## 🧠 6. Common Errors & Fixes

| Issue                                    | Cause                            | Solution                                         |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `nvm: command not found`                 | NVM not loaded                   | Run `source ~/.bashrc` or restart terminal       |
| `nvm : The term 'nvm' is not recognized` | Windows PowerShell not restarted | Close & reopen PowerShell                        |
| `nvm use` not working                    | You’re not inside root folder    | Run `cd Scrum-and-Get-it` then `nvm use 20.19.5` |
| `npm ERR! engine Unsupported engine`     | Wrong Node.js version            | Run `nvm use 20.19.5`                            |
| `vite: command not found`                | Not in frontend folder           | Run commands inside `/frontend`                  |
| Port 5173 busy                           | Vite dev port in use             | Run `npm run dev -- --port=5174`                 |

---

## 🧾 7. Environment Summary

| Component           | Version                              |
| ------------------- | ------------------------------------ |
| **Node.js**         | 20.19.5                              |
| **npm**             | 10.8.2                               |
| **Package Manager** | npm                                  |
| **Frontend**        | React + TypeScript (Vite)            |
| **Backend**         | Supabase (PostgreSQL, Auth, Storage) |
| **Dev Port**        | 5173                                 |

---

## 🔁 8. Git & Branching Standards

Follow the team’s [BRANCHING.md](./BRANCHING.md):

1. Create feature branches from `main`
2. Use naming convention:

   ```
   feat/auth-login
   fix/profile-update
   ```
3. Always open a Pull Request (PR) → requires 1 approval
4. Use **Squash and merge** only

Example:

```bash
git checkout main
git pull
git checkout -b feat/frontend-setup
git add .
git commit -m "feat(setup): add vite frontend environment"
git push -u origin feat/frontend-setup
```

---

## ✅ Quick Recap

```bash
git clone https://github.com/AlexeyMish7/Scrum-and-Get-it.git
cd Scrum-and-Get-it
nvm install 20.19.5
nvm use 20.19.5
cd frontend
npm ci
npm run dev
```

> 🧩 **Tip:** Always make sure you’re in the **project root** before running `nvm use`, and in the **frontend folder** before running any npm commands.

Your local environment is ready 🚀
Now you can begin working on Sprint 1 tasks (authentication, branding, and profile setup).
