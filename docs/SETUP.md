# 🧩 Frontend Environment Setup Guide

**Project:** ATS for Candidates (CS490 Capstone)

This guide explains how to set up the **frontend development environment** so that every team member uses the same versions of Node.js, npm, and dependencies.  
Following these steps ensures consistent builds and prevents “it works on my machine” issues.

---

## 🪜 1. Prerequisites

### ✅ Tools You Need

- **Git** – to clone the repository
- **nvm (Node Version Manager)** – to manage Node.js versions
- **npm** – installed automatically with Node.js

---

### 🪟 For Windows Users

1. Download and install **nvm-windows** directly:  
   👉 [nvm-setup.exe (v1.2.2)](https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe)
2. Run the installer and accept all defaults.
3. Restart PowerShell or your terminal.
4. Verify installation:
   ```bash
   nvm version
   ```
5. Once installed, proceed to **Section 3** to install the correct Node version.

---

### 🍎 For macOS / Linux Users

1. Open a terminal and run:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   ```
2. Restart your terminal (or run `source ~/.bashrc` / `source ~/.zshrc`).
3. Verify:
   ```bash
   nvm -v
   ```

---

## 🧱 2. Clone the Repository

Clone the official GitHub repository:

```bash
git clone https://github.com/AlexeyMish7/Scrum-and-Get-it.git
cd Scrum-and-Get-it
```

This will create a local copy of the project on your computer.

---

## ⚙️ 3. Set Up Node.js and npm Versions

The project root contains an **`.nvmrc`** file specifying the correct Node version.

1. Install and use the correct version:
   ```bash
   nvm install 20.19.5
   nvm use
   ```
2. Verify that it worked:
   ```bash
   node -v
   # v20.19.5
   npm -v
   # 10.8.2 or higher
   ```

> ⚠️ You **must** use the same Node version (20.19.5) and npm (10.8.2+) for the project to build correctly.

---

## 🧰 4. Install Dependencies and Run the Frontend

Navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the development server and display output like:

```
VITE v7.x.x  ready in 500 ms
  ➜  Local:   http://localhost:5173/
```

Open that link in your browser — you should see the default React + TypeScript page 🎉

---

## 🧩 5. Troubleshooting

| Problem                                  | Fix                                                           |
| ---------------------------------------- | ------------------------------------------------------------- |
| `nvm: command not found`                 | Restart your terminal or run `source ~/.bashrc` (macOS/Linux) |
| `nvm : The term 'nvm' is not recognized` | Reopen PowerShell (Windows) after installing nvm              |
| Wrong Node version                       | Run `nvm use` or reinstall `nvm install 20.19.5`              |
| `npm install` fails with engine error    | Check that `.npmrc` and Node versions match (`node -v`)       |
| Port 5173 already in use                 | Run `npm run dev -- --port=5174`                              |
| `vite` not recognized                    | Make sure you’re inside the `frontend/` folder                |

---

## 🧾 6. Project Environment Summary

| Tool                 | Version                   |
| -------------------- | ------------------------- |
| **Node.js**          | 20.19.5                   |
| **npm**              | 10.8.2                    |
| **Package Manager**  | npm                       |
| **Framework**        | Vite + React + TypeScript |
| **Development Port** | 5173 (default)            |

---

## 🧠 7. Next Steps

Once everyone has the environment running:

- Commit your `.nvmrc`, `.npmrc`, and `docs/SETUP.md`
- Push changes to GitHub
- Each teammate should clone the repo and follow this same guide

---

### ✅ Quick Recap

```bash
git clone https://github.com/AlexeyMish7/Scrum-and-Get-it.git
cd Scrum-and-Get-it
nvm install 20.19.5
nvm use
cd frontend
npm install
npm run dev
```

You’re ready to start building 🚀
