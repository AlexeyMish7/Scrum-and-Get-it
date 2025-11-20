# Default Values Reference

This document lists all default values, fallbacks, and configuration constants used throughout the FlowATS codebase. These values are automatically applied when environment variables or user options are not provided.

**Last Updated:** November 20, 2025

---

## Table of Contents

- [Server Environment Variables](#server-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [AI Generation Defaults](#ai-generation-defaults)
- [Database Defaults](#database-defaults)
- [Prompt Engineering](#prompt-engineering)
- [Authentication & Security](#authentication--security)
- [Performance & Timeouts](#performance--timeouts)

---

## Server Environment Variables

### AI Provider Configuration

| Variable            | Default Value   | Description                            | Notes                                             |
| ------------------- | --------------- | -------------------------------------- | ------------------------------------------------- |
| `AI_PROVIDER`       | `"openai"`      | AI provider selection                  | Options: `openai`, `azure`, `mock`                |
| `AI_API_KEY`        | _(required)_    | OpenAI API key                         | No default - must be set in production            |
| `AI_MODEL`          | `"gpt-4o-mini"` | Default AI model                       | Overridable per request if in `ALLOWED_AI_MODELS` |
| `AI_MAX_TOKENS`     | `1500`          | Max tokens for AI responses            | ~600-750 words; needed for cover letters          |
| `AI_TEMPERATURE`    | `0.2`           | AI response randomness                 | Range: 0.0 (deterministic) to 1.0 (creative)      |
| `AI_TIMEOUT_MS`     | `30000`         | Request timeout in milliseconds        | 30 seconds                                        |
| `AI_MAX_RETRIES`    | `2`             | Number of retry attempts               | For transient API errors                          |
| `FAKE_AI`           | `false`         | Use mock AI responses                  | Set to `true` for local dev without API costs     |
| `ALLOWED_AI_MODELS` | _(empty)_       | Comma-separated list of allowed models | If empty, any model is allowed                    |

### Database Configuration

| Variable                    | Default Value | Description          | Notes                                       |
| --------------------------- | ------------- | -------------------- | ------------------------------------------- |
| `SUPABASE_URL`              | _(required)_  | Supabase project URL | Format: `https://[project].supabase.co`     |
| `SUPABASE_SERVICE_ROLE_KEY` | _(required)_  | Service role key     | Server-side only - never expose to frontend |

### Authentication & Security

| Variable         | Default Value | Description          | Notes                                    |
| ---------------- | ------------- | -------------------- | ---------------------------------------- |
| `ALLOW_DEV_AUTH` | `false`       | Enable dev auth mode | Set to `true` for local development only |
| `CORS_ORIGIN`    | `"*"`         | Allowed CORS origins | Set to specific domain in production     |

### Logging & Operations

| Variable    | Default Value   | Description         | Notes                                        |
| ----------- | --------------- | ------------------- | -------------------------------------------- |
| `LOG_LEVEL` | `"info"`        | Logging verbosity   | Options: `debug`, `info`, `warn`, `error`    |
| `NODE_ENV`  | `"development"` | Runtime environment | Options: `development`, `production`, `test` |

---

## Frontend Environment Variables

| Variable                 | Default Value             | Description          | Notes                                 |
| ------------------------ | ------------------------- | -------------------- | ------------------------------------- |
| `VITE_SUPABASE_URL`      | _(required)_              | Supabase project URL | Same as server `SUPABASE_URL`         |
| `VITE_SUPABASE_ANON_KEY` | _(required)_              | Public anonymous key | Safe to expose - read-only by default |
| `VITE_AI_BASE_URL`       | `"http://localhost:8787"` | AI server base URL   | Points to backend orchestrator        |

---

## AI Generation Defaults

### Resume Generation

| Setting        | Default Value    | Description                        | Context                                    |
| -------------- | ---------------- | ---------------------------------- | ------------------------------------------ |
| Temperature    | `0.2`            | Low creativity for factual content | Env: `AI_TEMPERATURE`                      |
| Max Tokens     | `800`            | Token limit for resume content     | Env: `AI_MAX_TOKENS`                       |
| Timeout        | `30000ms` (30s)  | Request timeout                    | Env: `AI_TIMEOUT_MS`                       |
| Retries        | `2`              | Number of retry attempts           | Env: `AI_MAX_RETRIES`                      |
| Tone           | `"professional"` | Default writing tone               | User-selectable in wizard                  |
| Length         | `"standard"`     | Content verbosity                  | Options: `concise`, `standard`, `detailed` |
| Template Style | `"classic"`      | Resume template style              | Affects AI language and structure          |

**Resume Length Instructions:**

- **Concise:** 1-2 bullets per experience, 1 page target
- **Standard:** 2-4 bullets per experience, 1-2 pages target
- **Detailed:** 4-6 bullets per experience, 2+ pages target

### Cover Letter Generation

| Setting     | Default Value    | Description                                   | Context               |
| ----------- | ---------------- | --------------------------------------------- | --------------------- |
| Temperature | `0.2`            | Low creativity for professional tone          | Env: `AI_TEMPERATURE` |
| Max Tokens  | `1500`           | Increased for longer letters (~600-750 words) | Env: `AI_MAX_TOKENS`  |
| Timeout     | `30000ms` (30s)  | Request timeout                               | Env: `AI_TIMEOUT_MS`  |
| Retries     | `2`              | Number of retry attempts                      | Env: `AI_MAX_RETRIES` |
| Tone        | `"professional"` | Default writing tone                          | User-selectable       |
| Length      | `"standard"`     | Target: 350-550 words                         | User-selectable       |

### Skills Optimization

| Setting     | Default Value   | Description                              |
| ----------- | --------------- | ---------------------------------------- |
| Temperature | `0.2`           | Deterministic for consistent suggestions |
| Max Tokens  | `800`           | Sufficient for skills list + analysis    |
| Timeout     | `30000ms` (30s) | Standard timeout                         |
| Retries     | `2`             | Standard retry count                     |

### Experience Tailoring

| Setting     | Default Value   | Description                        |
| ----------- | --------------- | ---------------------------------- |
| Temperature | `0.2`           | Factual, no hallucinations         |
| Max Tokens  | `800`           | Enough for bullet point refinement |
| Timeout     | `30000ms` (30s) | Standard timeout                   |
| Retries     | `2`             | Standard retry count               |

### Company Research

| Setting     | Default Value   | Description                          |
| ----------- | --------------- | ------------------------------------ |
| Temperature | `0.3`           | Slightly higher for nuanced insights |
| Max Tokens  | `600`           | Concise research summaries           |
| Timeout     | `20000ms` (20s) | Shorter timeout for quick research   |
| Retries     | `2`             | Standard retry count                 |
| Cache TTL   | `7 days`        | Research cached for 7 days           |

### Job Match Analysis

| Setting     | Default Value   | Description                    |
| ----------- | --------------- | ------------------------------ |
| Temperature | `0.2`           | Precise for scoring/matching   |
| Max Tokens  | `800`           | Match analysis + suggestions   |
| Timeout     | `30000ms` (30s) | Standard timeout               |
| Retries     | `2`             | Standard retry count           |
| Cache TTL   | `7 days`        | Match scores cached for 7 days |

---

## Database Defaults

### Analytics Cache

| Setting                  | Default Value | Description                          |
| ------------------------ | ------------- | ------------------------------------ |
| Cache Expiration         | `7 days`      | TTL for job analytics cache          |
| Profile Version Tracking | Enabled       | Invalidates cache on profile changes |

### Company Research Cache

| Setting          | Default Value | Description                                 |
| ---------------- | ------------- | ------------------------------------------- |
| Cache Expiration | `7 days`      | TTL for company research data               |
| Dual Storage     | Enabled       | Persistent companies table + volatile cache |

### AI Artifacts

| Setting     | Default Value | Description                              |
| ----------- | ------------- | ---------------------------------------- |
| Versioning  | Enabled       | All artifacts are versioned              |
| Soft Delete | Enabled       | Artifacts marked as deleted, not removed |

---

## Prompt Engineering

### Resume Prompt Defaults

```typescript
// Template-specific language modifiers
Templates:
  - classic: "Traditional, conservative language"
  - modern: "Contemporary, tech-forward language"
  - minimal: "Concise, direct language"
  - creative: "Engaging, dynamic language"
  - academic: "Formal academic language"

// Content length modifiers
Lengths:
  - concise: 1-2 bullets, 1 page
  - standard: 2-4 bullets, 1-2 pages
  - detailed: 4-6 bullets, 2+ pages

// Generation uniqueness
UniqueID: `${Date.now()}-${Math.random().toString(36).substring(7)}`
```

### Response Format

All AI responses default to **JSON mode** with `response_format: { type: "json_object" }`

**Resume JSON Schema:**

```json
{
  "summary": "string (required)",
  "ordered_skills": ["string"] (required),
  "emphasize_skills": ["string"] (optional),
  "add_skills": ["string"] (optional),
  "ats_keywords": ["string"] (optional),
  "score": "number 0-100" (optional),
  "sections": {
    "experience": [/* employment entries */],
    "education": [/* education entries */],
    "projects": [/* project entries */]
  }
}
```

---

## Authentication & Security

### Dev Auth

| Setting          | Default Value  | Production Value           |
| ---------------- | -------------- | -------------------------- |
| `ALLOW_DEV_AUTH` | `true` (local) | `false` (required)         |
| Dev User ID      | `"dev-user"`   | N/A                        |
| CORS Origin      | `"*"` (local)  | Specific domain (required) |

### JWT Validation

- **Issuer:** Supabase project URL
- **Audience:** `authenticated`
- **Algorithm:** HS256
- **Expiration:** Enforced

---

## Performance & Timeouts

### Server Timeouts

| Operation        | Default Timeout | Retries |
| ---------------- | --------------- | ------- |
| AI Generation    | 30 seconds      | 2       |
| Company Research | 20 seconds      | 2       |
| Database Queries | 10 seconds      | 0       |
| External APIs    | 15 seconds      | 1       |

### Cache Strategy

| Resource         | Cache Duration | Invalidation           |
| ---------------- | -------------- | ---------------------- |
| Job Analytics    | 7 days         | Profile version change |
| Company Research | 7 days         | Manual refresh         |
| User Profile     | Session        | Logout/update          |

### Rate Limiting

Currently **not implemented** - relies on OpenAI's built-in rate limits.

**Recommended for production:**

- 10 requests/minute per user
- 100 requests/hour per user
- 1000 requests/day per user

---

## Template Defaults

### Resume Templates

| Template ID | Style        | Language     | Best For                  |
| ----------- | ------------ | ------------ | ------------------------- |
| `classic`   | Traditional  | Conservative | Corporate, senior roles   |
| `modern`    | Contemporary | Tech-forward | Startups, tech companies  |
| `minimal`   | Clean        | Direct       | Design, simplicity        |
| `creative`  | Dynamic      | Engaging     | Creative fields, agencies |
| `academic`  | Formal       | Scholarly    | Research, education       |

### Theme Defaults

Themes are customizable per template. Default theme:

- **Font:** System default (sans-serif)
- **Color Scheme:** Grayscale
- **Spacing:** Standard (1.0 line height)

---

## Development Shortcuts

### Mock AI Responses

When `FAKE_AI=true`, the system returns pre-defined mock responses:

**Resume Mock:**

```json
{
  "bullets": [
    "Led migration to cloud, reduced costs by 30%",
    "Built CI/CD pipelines; improved deployment frequency"
  ]
}
```

**Cover Letter Mock:**

```json
{
  "sections": {
    "opening": "I am writing to express my strong interest...",
    "body": ["Throughout my career...", "Beyond my technical capabilities..."],
    "closing": "Thank you for considering my application..."
  }
}
```

---

## Environment-Specific Overrides

### Development

```env
FAKE_AI=true
ALLOW_DEV_AUTH=true
LOG_LEVEL=debug
AI_TIMEOUT_MS=60000  # Longer for debugging
```

### Testing

```env
FAKE_AI=true
ALLOW_DEV_AUTH=true
LOG_LEVEL=error
NODE_ENV=test
```

### Production

```env
FAKE_AI=false
ALLOW_DEV_AUTH=false
LOG_LEVEL=info
NODE_ENV=production
CORS_ORIGIN=https://app.flowats.com
```

---

## Quick Reference: Most Common Defaults

| What          | Value                           |
| ------------- | ------------------------------- |
| AI Model      | `gpt-4o-mini`                   |
| Temperature   | `0.2`                           |
| Max Tokens    | Resume: 800, Cover Letter: 1500 |
| Timeout       | 30 seconds                      |
| Cache TTL     | 7 days                          |
| Server Port   | 8787                            |
| Frontend Port | 5173                            |
| Log Level     | `info`                          |

---

## Notes

1. **Temperature (0.2):** Low temperature ensures consistent, factual output. Increase to 0.5-0.7 for more creative/varied responses.

2. **Max Tokens:**

   - 800 tokens ≈ 320-400 words (resumes)
   - 1500 tokens ≈ 600-750 words (cover letters)

3. **Cache Invalidation:** Job analytics cache is automatically invalidated when user profile version changes.

4. **Unique Generation IDs:** Added to resume prompts to ensure each generation request is unique, preventing identical outputs for the same job.

5. **Mock AI:** Use `FAKE_AI=true` in development to avoid API costs and test flows without external dependencies.

---

## Related Documentation

- [Server Architecture](./server/1-structure.md)
- [Frontend Architecture](./frontend/1-structure.md)
- [Database Schema](./database/database-schema.md)
- [Environment Setup](../README.md#setup)
