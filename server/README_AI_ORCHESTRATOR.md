AI Orchestrator — quickstart

Purpose

- Central, server-side service that accepts generation requests (resume, cover letter, research, matching), calls the AI provider, stores results in `ai_artifacts`, and returns the artifact to the frontend.

Quick setup (local dev)

1. Copy `server/.env.example` to `server/.env` and populate values (DO NOT commit `.env`).
2. Set `FAKE_AI=true` during early dev to avoid provider costs and return deterministic outputs.
3. Run your orchestrator function locally (adapt to your framework: Node/Express, Next.js API route, or serverless platform).

Files

- `aiClient.ts` — provider wrapper (mock + OpenAI REST example).
- `orchestrator.ts` — handler scaffold showing the full flow: validate -> fetch profile/job -> prompt -> call AI -> save to DB -> return artifact.
- `.env.example` — example env vars to configure.

Notes

- This scaffold is intentionally framework-agnostic. Integrate `handleGenerateResume` into your API routes and replace pseudo-DB calls with your Supabase Admin client (service role key) to insert into `ai_artifacts`.
- Always use server-side secrets for AI provider keys. The frontend should never directly call the AI provider.

Next recommended steps

1. Wire `orchestrator.ts` to use the Supabase admin client and insert into `ai_artifacts` (use `SUPABASE_SERVICE_ROLE_KEY`).
2. Add prompt templates in `server/prompts/` and load them into the orchestrator.
3. Add retry/timeout logic to `aiClient.generate` and basic per-user rate limiting in the orchestrator.
4. Add unit tests with `FAKE_AI=true` to validate end-to-end insertion into `ai_artifacts` (using a test DB or test schema).
