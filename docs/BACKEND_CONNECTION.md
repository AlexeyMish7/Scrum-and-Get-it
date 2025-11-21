# Frontend-Backend Connection Architecture

## Overview

FlowATS uses a **three-tier architecture** with clear separation between frontend (React), backend server (Node.js/Express), and database (PostgreSQL/Supabase).

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│                  http://localhost:5173                       │
│                                                              │
│  • User Interface                                           │
│  • Client-side validation                                   │
│  • State management                                         │
│  • Direct Supabase database access (CRUD operations)        │
│  • AI service client (HTTP requests to backend)             │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌─────────────────┐   ┌──────────────┐
│   Supabase   │   │  Backend Server │   │   External   │
│   Database   │   │  (Node.js)      │   │   APIs       │
│              │   │  Port: 8787     │   │              │
│  • Jobs      │   │                 │   │  • OpenAI    │
│  • Profile   │   │  • AI proxy     │   │  • Web       │
│  • Documents │   │  • Scraping     │   │    scraping  │
│  • Auth      │   │  • Analytics    │   │              │
└──────────────┘   └─────────────────┘   └──────────────┘
```

## Connection Points

### 1. Frontend → Database (Direct)

**Purpose**: CRUD operations for user data  
**Protocol**: Supabase client SDK  
**Authentication**: JWT tokens via Supabase Auth

**Files**:
- `frontend/src/app/shared/services/supabaseClient.ts` - Supabase client initialization
- `frontend/src/app/shared/services/crud.ts` - CRUD operations wrapper

**Configuration**:
```bash
# frontend/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

**Usage Example**:
```typescript
import { supabase } from "@shared/services/supabaseClient";

// Direct database query
const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('user_id', userId);
```

### 2. Frontend → Backend Server (AI Operations)

**Purpose**: AI-powered features (resume generation, job matching, company research)  
**Protocol**: HTTP REST API  
**Authentication**: JWT tokens (Authorization header)

**Files**:
- `frontend/src/app/shared/services/ai/client.ts` - HTTP client for AI endpoints
- `server/src/server.ts` - Server routing and request handling
- `server/src/index.ts` - Server entry point and port configuration

**Configuration**:
```bash
# frontend/.env
VITE_AI_BASE_URL=http://localhost:8787

# server/.env
PORT=8787
CORS_ORIGIN=http://localhost:5173
```

**Key Endpoints**:
```
POST /api/generate/resume          - Generate tailored resume
POST /api/generate/cover-letter    - Generate cover letter
POST /api/generate/job-import      - Extract job details from URL
POST /api/generate/job-match       - Calculate job match score
POST /api/salary-research          - Research salary data
POST /api/generate/company-research - Research company information
GET  /api/health                   - Server health check
```

**Usage Example**:
```typescript
import { aiClient } from "@shared/services/ai/client";

// Call AI endpoint
const result = await aiClient.postJson(
  "/api/generate/resume",
  { profile, skills, employment, jobDetails },
  userId
);
```

### 3. Backend Server → External APIs

**Purpose**: AI generation and web scraping  
**Protocol**: HTTP/HTTPS  
**Services**: OpenAI API, web scraping (Cheerio/Puppeteer)

**Configuration**:
```bash
# server/.env
AI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=1500
```

## Environment Variables Reference

### Frontend (`frontend/.env`)

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | - | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | - | ✅ |
| `VITE_AI_BASE_URL` | Backend server URL | `http://localhost:8787` | ⚠️ Recommended |

### Backend (`server/.env`)

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `PORT` | Server port | `8787` | ⚠️ Recommended |
| `CORS_ORIGIN` | Allowed frontend origin | `*` | ⚠️ Recommended |
| `AI_API_KEY` | OpenAI API key | - | ✅ (unless `FAKE_AI=true`) |
| `AI_MODEL` | OpenAI model | `gpt-4o-mini` | ❌ |
| `AI_MAX_TOKENS` | Max tokens per request | `1500` | ❌ |
| `FAKE_AI` | Use mock AI responses | `false` | ❌ |
| `ALLOW_DEV_AUTH` | Bypass auth (dev only) | `true` | ❌ |
| `SUPABASE_URL` | Supabase project URL | - | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | - | ✅ |
| `LOG_LEVEL` | Logging verbosity | `info` | ❌ |

## Port Configuration

### Default Ports

- **Frontend (Vite)**: `5173`
- **Backend Server**: `8787`
- **Database (Supabase)**: Cloud-hosted (no local port)

### Changing Ports

1. **Backend Port**:
   ```bash
   # server/.env
   PORT=3001
   ```

2. **Update Frontend Configuration**:
   ```bash
   # frontend/.env
   VITE_AI_BASE_URL=http://localhost:3001
   ```

3. **Update CORS**:
   ```bash
   # server/.env
   CORS_ORIGIN=http://localhost:5173
   ```

## Hard-Coded Connection Points (Fixed)

### Before Fix ❌

Hard-coded URLs found in:
1. `frontend/src/app/shared/services/ai/client.ts:16`
   - `const BASE_URL = "http://localhost:8787"` (no env var fallback)

2. `frontend/src/app/workspaces/ai_workspace/layouts/AIWorkspaceLayout.tsx:15`
   - `const AI_BASE_URL = "http://localhost:8787"` (no env var fallback)

3. `frontend/src/app/workspaces/job_pipeline/components/import/JobImportURL/JobImportURL.tsx:171`
   - `const apiUrl = "http://localhost:8787"` (no env var fallback)
   - Used `VITE_API_URL` instead of `VITE_AI_BASE_URL` (inconsistent naming)

### After Fix ✅

All connection points now use:
```typescript
const BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8787";
```

- ✅ Environment variable takes precedence
- ✅ Consistent variable name (`VITE_AI_BASE_URL`)
- ✅ Safe fallback for local development
- ✅ TypeScript type declarations added
- ✅ Comprehensive documentation in code comments

## Development Workflow

### Starting the Application

**Option 1: Using PowerShell script (Recommended)**
```powershell
# From project root
.\dev.ps1
```

**Option 2: Manual**
```bash
# Terminal 1: Backend server
cd server
npm run dev

# Terminal 2: Frontend dev server
cd frontend
npm run dev
```

### Environment Setup

1. **Copy environment files**:
   ```bash
   cp frontend/.env.example frontend/.env
   cp server/.env.example server/.env
   ```

2. **Fill in values**:
   - Get Supabase credentials from your project
   - Get OpenAI API key from OpenAI dashboard
   - Use default ports or configure custom ones

3. **Verify connection**:
   - Start both servers
   - Open `http://localhost:5173` in browser
   - Check browser console for connection status
   - Server health check: `http://localhost:8787/api/health`

## Security Considerations

### ✅ Safe to Expose (Frontend)
- `VITE_SUPABASE_URL` - Public project URL
- `VITE_SUPABASE_ANON_KEY` - Public key with RLS protection
- `VITE_AI_BASE_URL` - Backend server URL

### ⚠️ Never Expose (Backend Only)
- `SUPABASE_SERVICE_ROLE_KEY` - Full admin access
- `AI_API_KEY` - OpenAI API key (costs money!)

### Authentication Flow
```
1. User logs in via Supabase Auth (frontend)
2. Receives JWT token stored in session
3. All API requests include token in Authorization header
4. Backend validates token with Supabase
5. Database enforces Row Level Security (RLS)
```

## Troubleshooting

### Frontend can't connect to backend

**Symptoms**: AI features don't work, "Server connection lost" error

**Solutions**:
1. Check backend server is running: `http://localhost:8787/api/health`
2. Verify `VITE_AI_BASE_URL` matches server port
3. Check CORS configuration in `server/.env`
4. Look for errors in server console logs

### CORS errors

**Symptoms**: Browser console shows "CORS policy" errors

**Solutions**:
1. Set `CORS_ORIGIN` in `server/.env`:
   ```bash
   CORS_ORIGIN=http://localhost:5173
   ```
2. Restart backend server after changing `.env`
3. Clear browser cache

### Port already in use

**Symptoms**: "EADDRINUSE" error when starting server

**Solutions**:
1. Change port in `server/.env`:
   ```bash
   PORT=3001
   ```
2. Update frontend `.env`:
   ```bash
   VITE_AI_BASE_URL=http://localhost:3001
   ```
3. Find and kill process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :8787
   taskkill /PID <process_id> /F
   ```

## API Request Flow Example

```typescript
// 1. User triggers AI generation in frontend
const handleGenerate = async () => {
  // 2. Frontend calls aiClient (shared/services/ai/client.ts)
  const result = await aiClient.postJson(
    "/api/generate/resume",  // Endpoint path
    { profile, skills },      // Request body
    userId                    // User ID (from auth context)
  );
  
  // aiClient internals:
  // 3. Constructs full URL: BASE_URL + path
  //    BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8787"
  //    Full URL: http://localhost:8787/api/generate/resume
  
  // 4. Adds Authorization header with JWT token
  //    Authorization: Bearer <supabase_jwt_token>
  
  // 5. Sends POST request to backend
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ profile, skills })
  });
  
  // 6. Backend receives request (server/src/server.ts)
  //    - Validates JWT token via requireAuth middleware
  //    - Routes to handleGenerateResume handler
  //    - Calls OpenAI API with prompt
  //    - Saves result to database
  //    - Returns JSON response
  
  // 7. Frontend receives response
  //    - Displays generated resume
  //    - Shows success message
};
```

## Files Reference

### Frontend Connection Files
```
frontend/src/
├── app/shared/services/
│   ├── supabaseClient.ts       # Database connection
│   ├── crud.ts                 # Database operations
│   └── ai/client.ts            # Backend API client
├── vite-env.d.ts               # Environment variable types
└── .env                        # Environment configuration
```

### Backend Connection Files
```
server/
├── src/
│   ├── index.ts               # Entry point, port config
│   ├── server.ts              # Routing, request handling
│   ├── middleware/
│   │   ├── auth.ts            # JWT validation
│   │   └── cors.ts            # CORS headers
│   └── routes/                # API endpoints
└── .env                       # Environment configuration
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Server Documentation](./server/1-structure.md) - Backend API reference
- [Frontend Documentation](./frontend/1-structure.md) - Frontend architecture
- [Database Schema](./database/database-schema.md) - Database structure

---

**Last Updated**: 2025-11-21  
**Maintained By**: Scrum and Get It Team
