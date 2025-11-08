# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Frontend — Scrum-and-Get-it

  React 19 + TypeScript + Vite app using MUI 7 and Supabase.

  ## Develop

  - Start dev server: `npm run dev`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`

  ## Resume Editor — Progressive Flow

  The AI Resume Editor guides users through four steps with minimal clutter. Only the current step’s UI renders; heavy panels lazy-load when needed.

  Steps:
  1. Select Draft — choose the draft to tailor.
  2. Generate — pick Job/Tone/Focus and run generation.
  3. Apply — apply ordered skills, summary, and merge experience bullets.
  4. Preview — view tabs (AI/Formatted/Draft/Variations/Skills/Raw), manage versions, export PDF/DOCX, and attach to job.

  Tips:
  - Skip links at the top jump to generation controls, preview, or versions/export.
  - Compare dialog supports keyboard navigation and traps focus; Escape closes.
  - Exports also persist a document row and auto-link to the job when possible.

  ## Tutorial

  The tutorial banner appears for first-time users and is dismissible.

  - Start: focuses Step 2 (generation controls) and scrolls into view.
  - Skip: hides the tutorial (stored in localStorage under `resumeTutorialCompleted`).
  - Accessibility: the tutorial region is focusable with `aria-labelledby` and announces when opened.

  To reset the tutorial, remove `resumeTutorialCompleted` from localStorage.

  ## Environment

  Required env variables (do not commit):

  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

  ## Theming

  - MUI theme controls light/dark mode and border radius.
  - Preview honors theme text/background; dividers and chips adjust for dark mode.

  ## Notes

  - Path aliases are defined in `tsconfig.app.json` and `vite.config.ts`.
    },
```
