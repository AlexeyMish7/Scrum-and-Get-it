AI Orchestrator — quickstart

Purpose

- Central, server-side service that accepts generation requests (resume, cover letter, research, matching), calls the AI provider, stores results in `ai_artifacts`, and returns the artifact to the frontend.

Quick setup (local dev)

1. Copy `server/.env.example` to `server/.env` and populate values (DO NOT commit `.env`).
2. Set `FAKE_AI=true` during early dev to avoid provider costs and return deterministic outputs.
3. Start the dev server with auto-reload: `npm run dev` from the `server/` folder.

Files

- `aiClient.ts` — provider wrapper (mock + OpenAI REST example).
- `orchestrator.ts` — handler showing the full flow: validate → fetch profile/job → prompt → call AI → return artifact.
- `src/index.ts` — minimal HTTP server exposing `/api/health` and `/api/generate/resume`.
- `src/index.ts` — minimal HTTP server exposing `/api/health`, `/api/generate/resume`, and `/api/generate/cover-letter`.
- `utils/*` — `logger`, `errors`, `rateLimiter` utilities.
- `.env.example` — example env vars to configure.

Endpoints

- GET `/api/health`

  - Query `?deep=1` attempts a quick Supabase connectivity test (if env present).
  - Response fields:
    - `supabase_env`: `present` or `missing`
    - `supabase`: `ok` | `missing-env` | `error` (deep check result)
    - `ai_provider`: current provider (`openai` or `mock`)
    - `mock_mode`: boolean derived from `FAKE_AI`
    - `uptime_sec`: server uptime
    - `counters`: `{ requests_total, generate_total, generate_success, generate_fail }`

- POST `/api/generate/resume`

  - Headers: `X-User-Id: <uuid>` (lightweight dev auth)
  - Body: `{ jobId: number, options?: { tone?: string, focus?: string } }`
  - Rate limit: 5 requests/min per user (in-memory dev limiter)
  - Behavior: generates content via provider; if Supabase admin env is present, persists to `ai_artifacts`, otherwise returns a non-persisted mock response with a preview.

- POST `/api/generate/cover-letter`
  - Headers: `X-User-Id: <uuid>`
  - Body: `{ jobId: number, options?: { tone?: string, focus?: string } }`
  - Output: JSON containing `{ id, kind, created_at, preview }`, persisted when Supabase env present.

Rate limiting

- Dev-grade sliding window: 5/min per user for resume generation.
- If exceeded, returns `429` with `Retry-After` header and JSON `{ error: "rate_limited", retry_after_sec }`.

Logging (JSON lines)

- Structured logs are emitted via `utils/logger.ts`.
- Examples:
  - `generate_resume_persisted` — successful generation + DB insert
  - `generate_resume_mock` — generation returned to client without persistence (mock/dev mode)
  - `persist_failed` — DB insertion failed
  - `preview_failed` — building response preview failed

Mock vs. real provider

- Set `FAKE_AI=true` or `AI_PROVIDER=mock` to return deterministic mock outputs (no external calls).
- Real provider uses `AI_PROVIDER=openai` and `AI_API_KEY` (see `README_ENV.md`).

Notes

- The server is intentionally small and framework-agnostic. You can port `src/index.ts` handlers into your platform of choice.
- Persisting requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be set in the server environment.
- Dev tsconfig: `tsconfig.dev.json` is not required; the base `tsconfig.json` already covers NodeNext + TS extension imports.

Next recommended steps

1. Extend endpoints for cover letters and company research using the same orchestrator pattern and prompt builders.
2. Add unit/integration tests with `FAKE_AI=true` to validate end-to-end flow and DB insertion.
3. Add CI lint/typecheck and minimal test runs for the `server/` package.
