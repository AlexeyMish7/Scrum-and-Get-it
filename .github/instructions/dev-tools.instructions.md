# Developer Tools

> Development debugging tools for FlowATS frontend.

---

## Enabling/Disabling Dev Tools

Dev tools are controlled by the `VITE_DEV_MODE` environment variable:

```bash
# In frontend/.env

# Show dev tools (local development)
VITE_DEV_MODE=true

# Hide dev tools (production or clean testing)
VITE_DEV_MODE=false
```

Dev tools only appear when:

1. Vite is in development mode (`npm run dev`)
2. AND `VITE_DEV_MODE` is not explicitly set to `"false"`

---

## Dev Log Panel

A floating panel that shows real-time API and Supabase database calls. Useful for debugging, performance monitoring, and understanding data flow.

### Location

```
frontend/src/app/shared/components/dev/
├── ApiLogDebugProvider.tsx   # React context provider (checks VITE_DEV_MODE)
├── DevLogPanel.tsx           # Main panel UI with tabs
├── supabaseLog.ts            # Types for Supabase log entries
└── supabaseLogger.ts         # Parses Supabase REST API calls
```

### How It Works

1. **Fetch Interceptor** (`frontend/src/fetchInterceptor.ts`)

   - Wraps the global `fetch` function at module load
   - Must be imported FIRST in `main.tsx`
   - Captures all HTTP requests/responses

2. **Log Routing**

   - API calls → API tab (calls to `/api/*`)
   - Supabase calls → Supabase tab (calls to `*.supabase.co`)

3. **Supabase Call Parsing**
   - Extracts table name from REST URL
   - Determines operation type (SELECT, INSERT, UPDATE, DELETE, RPC, AUTH)
   - Shows query filters, row counts, timing

### Usage

The panel appears automatically in development mode. Toggle visibility with the floating button.

### Tabs

| Tab      | Shows                                          |
| -------- | ---------------------------------------------- |
| API      | Backend server calls (`/api/generate/*`, etc.) |
| Supabase | Database operations with color-coded badges    |

### Operation Colors (Supabase Tab)

| Operation | Color  | Meaning               |
| --------- | ------ | --------------------- |
| SELECT    | Blue   | Reading data          |
| INSERT    | Green  | Creating data         |
| UPDATE    | Yellow | Modifying data        |
| DELETE    | Red    | Removing data         |
| RPC       | Purple | Stored procedure call |
| AUTH      | Gray   | Authentication        |

### Key Files

```typescript
// fetchInterceptor.ts - Module-level interceptor
// MUST be imported first in main.tsx
import "./fetchInterceptor";

// Set callback to receive log entries
import { setFetchLogCallback } from "./fetchInterceptor";
setFetchLogCallback((entry) => {
  // entry has: url, method, status, duration, body, response
});
```

### Adding to New Projects

1. Create `fetchInterceptor.ts` at src root
2. Import it FIRST in `main.tsx`
3. Wrap app with `ApiLogDebugProvider`
4. Add `DevLogPanel` component

---

## Cache Debugging

To verify React Query caching is working:

1. Open Dev Log Panel (Supabase tab)
2. Navigate between profile pages
3. If caching works, you should see:
   - Initial load: Multiple SELECT queries
   - Subsequent navigation: NO new queries (using cache)
   - After edit/save: New queries (cache invalidated)

### Expected Supabase Call Counts

| Scenario                          | Expected Calls                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Hard refresh (F5)                 | ~7 calls (profiles, education, employment, skills, projects, certifications, documents) |
| Navigation between pages          | 0 calls (uses cached data)                                                              |
| After add/edit/delete             | 1-2 calls (only invalidated cache refetches)                                            |
| Window refocus (after stale time) | Background refetches for stale data                                                     |

### Testing Cache Timing

Set short stale time in `.env` for testing:

```bash
# 10 seconds for testing
VITE_CACHE_STALE_TIME_MINUTES=0.16
```

Then:

1. Load dashboard
2. Wait 10+ seconds
3. Navigate to another page
4. Should see refetch in Dev Panel

---

## Environment Variables (Dev)

```bash
# Cache timing
VITE_CACHE_STALE_TIME_MINUTES=5    # Fresh data duration
VITE_CACHE_GC_TIME_MINUTES=30       # Cache retention duration
```
