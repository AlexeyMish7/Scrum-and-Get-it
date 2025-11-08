# Server environment & secrets (AI Orchestrator)

This document explains which environment variables the server expects, how to set them locally for development, and how to store them securely in CI for production.

Do NOT commit real secrets. Use `server/.env` for local development (add it to `.gitignore`) and CI secret stores for deployments.

## Required server environment variables

- `AI_PROVIDER` — the AI provider string. Use `openai` for OpenAI, `mock` for local development.
- `AI_API_KEY` — OpenAI API key (server-only). Keep secret.
- `AI_MODEL` — optional default model (e.g., `gpt-4o-mini`).
- `FAKE_AI` — set to `true` for deterministic mock responses during local dev to avoid costs.

- `SUPABASE_URL` — your Supabase project URL (example: `https://etolhcqhnlzernlfgspg.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only, powerful admin key). Keep secret and never expose to client.

- `LOG_LEVEL` — optional (`info`, `debug`, `warn`, `error`).

## Example `server/.env` (local development)

Copy `server/.env.example` to `server/.env` and fill real values. Example:

AI_PROVIDER=openai
AI_API_KEY=sk-REPLACE_WITH_YOUR_KEY
AI_MODEL=gpt-4o-mini
FAKE_AI=true

SUPABASE_URL=https://etolhcqhnlzernlfgspg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_XXXXXXXXXXXXXXXXXXXXXXXX

LOG_LEVEL=info

Notes:

- Keep `FAKE_AI=true` while developing prompts and UI to avoid accidental provider charges.
- Do not commit `server/.env` to source control. Add `server/.env` to `.gitignore` if it isn't already.

## Frontend vs Server keys

- Put only the frontend-safe values in the frontend `.env` (example: `frontend/.env`):

  - `VITE_SUPABASE_URL` = same as `SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` = Supabase anon (public) key

- Keep these server-only (never in frontend):
  - `AI_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## How to set secrets in CI (GitHub Actions example)

1. Add repository secrets in GitHub (Settings → Secrets → Actions):

   - `AI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_MODEL` (optional)

2. Example job snippet that exposes them to your server build/deploy step:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install & Build
        env:
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          AI_MODEL: ${{ secrets.AI_MODEL }}
        run: |
          cd server
          npm ci
          npm run build
```

## Rotating keys & security

- If a key is ever exposed, rotate it immediately in the provider console (OpenAI / Supabase) and update `server/.env` / CI secrets.
- Use a distinct key per environment (dev/test/prod) and label keys clearly (e.g., `flow-ats-server-dev`, `flow-ats-server-prod`).
- Limit access to the organization/project in OpenAI: invite only trusted team members and use per-key auditing where available.

## Quick local commands (PowerShell)

```powershell
cd server
# copy the example and open for editing
cp .env.example .env
notepad .\env

# (optional) set session-only env vars
$env:AI_API_KEY = "sk-..."
$env:SUPABASE_SERVICE_ROLE_KEY = "service_role_..."
```

## Testing the connection

- With `FAKE_AI=true`, you can run local tests without contacting OpenAI.
- To test Supabase connectivity (server-side), ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, then use `supabaseAdmin` helpers in the server folder to run a quick query.

## Where to get keys

- OpenAI: platform.openai.com → Projects / API keys → create key → copy into `AI_API_KEY`.
- Supabase: app.supabase.com → Select project → Settings → API → Project URL (use for `SUPABASE_URL`) and Service Role Key (use for `SUPABASE_SERVICE_ROLE_KEY`).

## Troubleshooting

- If TypeScript complains about `process` or node globals, ensure server has `@types/node` installed and `server/tsconfig.json` includes `"types": ["node"]`.
- If you get permission or RLS errors when reading/writing DB from the server, confirm you are using the service role key for admin writes and that `ai_artifacts` policies allow the expected operations.

If you'd like, I can also add a small `server/src/index.ts` test runner that demonstrates calling `aiClient.generate(...)` (mock-first) and optionally inserts an artifact using `supabaseAdmin.insertAiArtifact(...)`.
