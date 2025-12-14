# Server Instructions (AI + Integrations)

## What The Server Is For

FlowATS is **frontend → Supabase** for normal CRUD.
The **server** exists for:

- AI generation (calls requiring `AI_API_KEY` / provider secrets)
- External API integrations (LinkedIn/Google/etc.)
- Any operation requiring server-side secrets or data enrichment

## AI System: Definitive Call Pattern

### Important: ESM Import Convention

This server uses Node ESM-style imports in `server/src/**` (you’ll often see `import "../utils/logger.js"`).
The source files live as TypeScript in `server/utils/*.ts`, but are imported with `.js` extensions to match runtime ESM resolution.

### The Contract (Always Follow This)

All AI features should follow the same pipeline:

1. **Route** (`server/src/routes/**`)

   - Auth: resolve `userId` (JWT or dev header)
   - Rate limit: `checkLimit()`
   - Parse JSON: `readJson(req)`
   - Validate required fields (fail with `ApiError(400, ...)`)
   - Call a service/orchestrator function (no prompt-building in the route)

2. **Service / Orchestrator** (`server/src/services/**`)

   - Build a structured prompt via prompt builders in `server/prompts/**`
   - If client provided `options.prompt`, append it under a clearly labeled section like `User Additions:`
   - Sanitize prompt using `sanitizePrompt()` (control chars + secret redaction + max length)
   - Call AI via the centralized client: `aiClient.generate(kind, prompt, opts)`

3. **AI Client** (`server/src/services/aiClient.ts`)

   - Provider selection:
     - `FAKE_AI=true` or `AI_PROVIDER=mock` → deterministic mock output
     - default provider is OpenAI (`AI_PROVIDER=openai`)
   - Normalized return type: `{ text?, json?, raw?, tokens?, meta? }`
   - OpenAI calls use `response_format: { type: "json_object" }` to force JSON output
   - Retries + timeout handled inside the client (`maxRetries`, `timeoutMs`)

4. **Parse + Validate + Sanitize (must be deterministic)**

   - Prefer `aiResult.json` when present
   - If only `aiResult.text`, strip markdown fences and `JSON.parse` it
   - Validate with a kind-specific validator (example: `validateCompanyResearchResponse`)
   - Sanitize into safe DB/UI shapes (example: `normalizeCompanySize`, `sanitizeResumeContent`)

5. **Repair / Regenerate When Invalid (required for “definitive” behavior)**
   When the response fails validation:

- Attempt **1 repair pass** (max 1–2 total calls per request unless explicitly configured).
- The repair prompt should include:
  - the validation errors / missing fields
  - the expected JSON shape
  - instruction: “Return ONLY JSON. No prose.”

Recommended algorithm (pseudocode):

```ts
const result = await aiClient.generate(kind, prompt, opts);
const parsed = parseJson(result);
const validated = validate(kind, parsed);
if (validated.ok) return sanitize(kind, validated.data);

// Repair attempt (bounded)
const repairPrompt = buildRepairPrompt({
  kind,
  originalPrompt: prompt,
  errors: validated.errors,
  originalResponse: parsed,
});
const repaired = await aiClient.generate(kind, repairPrompt, {
  ...opts,
  temperature: 0,
});
const repairedParsed = parseJson(repaired);
const repairedValidated = validate(kind, repairedParsed);
if (!repairedValidated.ok) throw new Error("AI response invalid after repair");
return sanitize(kind, repairedValidated.data);
```

6. **Persist Artifacts (when applicable)**

- Persist to `ai_artifacts` through `server/src/services/supabaseAdmin.ts` when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.
- Persist the **prompt**, **model**, **content**, and **metadata** (latency, tokens, simulated/mock flags).

### Where This Exists Today

- Central AI client: `server/src/services/aiClient.ts`
- Orchestrator pattern (prompt → generate → sanitize): `server/src/services/orchestrator.ts`
- Prompt builders: `server/prompts/*.ts`
- Generation endpoints: `server/src/routes/generate/*`
- Prediction endpoint: `server/src/routes/predict/job-search.ts` → `server/src/services/prediction.service.ts`

## Environment Variables (AI)

- `AI_API_KEY` (or `OPENAI_API_KEY`): required for real OpenAI calls
- `AI_PROVIDER`: `openai` | `azure` | `mock`
- `FAKE_AI`: `true` forces mock provider
- `AI_MODEL`: default model
- `ALLOWED_AI_MODELS`: comma-separated allow-list for request overrides
- `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`, `AI_TEMPERATURE`, `AI_MAX_RETRIES`: defaults used by orchestrator

## Current Gaps / Improvements To Make The System More “Definitive”

These are recommended changes before we do a full AI correctness pass:

1. **Unify all AI calls behind a single pipeline helper**

   - Today, some routes use the orchestrator (good) while others call `generate()` directly (harder to keep consistent).
   - Recommendation: introduce a shared helper (e.g. `server/src/services/aiPipeline.ts`) that implements:
     - `generateJson(kind, prompt, schemaValidator, sanitizer, opts)`
     - bounded repair/regeneration

2. **Use real schema validation for every JSON response**

   - Today: validation is ad-hoc (some have validators; others only parse).
   - Recommendation: use a schema library (e.g. Zod) to:
     - validate response shape
     - generate clean error messages for repair prompts

3. **Support system + user roles in the AI client**

   - Today: OpenAI request uses a single `user` message and embeds “system” instructions inside the prompt string.
   - Recommendation: upgrade `aiClient.generate` to accept `messages[]` so we can keep system rules stable and consistent.

4. **Standardize `kind` naming + enforce**

   - Treat `kind` as a stable API surface (used for mock routing, telemetry, artifact storage).

5. **Standardize sanitizers**

   - For every AI feature, define a `sanitizeX()` that clamps numbers, normalizes enums, and strips invalid types.

6. **Add a single logging convention**

   - Prefer structured logs: `logInfo("ai.<kind>.<phase>", { reqId, userId, ... })`

7. **Add a minimal “golden path” integration test per endpoint**
   - Each AI endpoint should have a basic test verifying:
     - request validation works
     - mock provider path returns valid schema
     - parse/validate/repair path behavior is bounded
