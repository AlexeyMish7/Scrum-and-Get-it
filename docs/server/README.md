# Server Documentation

This folder mirrors the structure of `server/src/` to organize documentation for the Express + TypeScript backend.

## Structure

```
server/
├── middleware/          # Express middleware (auth, rate limiting, validation)
├── routes/             # API endpoint route handlers
├── services/           # Business logic and orchestration
└── types/              # TypeScript type definitions
```

## Documentation Guidelines

### File Naming Convention

- Match the source file name: `fileName.md` for `fileName.ts`
- Use `README.md` for folder/module overviews
- Use descriptive names for API docs: `resume-generation-api.md`

### Content Structure

Each `.md` file should include:

1. **Purpose**: What the module does
2. **Endpoints** (for routes): HTTP methods, paths, request/response formats
3. **Functions** (for services): Input/output, error handling
4. **Dependencies**: What it relies on
5. **Error Handling**: Common error scenarios
6. **Testing**: How to test it
7. **Security**: Auth requirements, rate limits, validation

### API Documentation Format

For route documentation:

```markdown
## POST /api/generate/resume

**Description**: Generate AI-powered resume tailored to a specific job

**Authentication**: Required (user must be logged in)

**Headers**:

- `X-User-Id`: UUID of authenticated user

**Request Body**:
\`\`\`json
{
"jobId": 123,
"templateId": "chronological",
"options": {
"emphasizeSkills": ["React", "TypeScript"]
}
}
\`\`\`

**Response** (201 Created):
\`\`\`json
{
"id": "uuid",
"kind": "resume",
"content": { ... },
"created_at": "2025-11-16T..."
}
\`\`\`

**Error Responses**:

- `400`: Invalid request body
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Server error
```

## Core Concepts

### Middleware

- **Authentication**: Validates Supabase session tokens
- **Rate Limiting**: Prevents abuse of AI endpoints
- **Validation**: Ensures request data is correct
- **Error Handling**: Centralized error responses

### Routes

API endpoints organized by feature:

- `/api/auth/*` - Authentication
- `/api/generate/*` - AI generation (resume, cover letter)
- `/api/jobs/*` - Job management
- `/api/profile/*` - User profile data

### Services

Business logic layer:

- **AI Orchestration**: Coordinates AI generation workflows
- **Data Validation**: Ensures data integrity
- **External APIs**: Integrates with OpenAI, news APIs, etc.

## Quick Links

### Related Documentation

- [Database Schema](../../db/migrations/)
- [API Client (Frontend)](../frontend/shared/services/)
- [Service Template](../SERVICE_TEMPLATE.md)

## Contributing

When adding new endpoints:

1. Document in the corresponding route `.md` file
2. Include request/response examples
3. Document error scenarios
4. Update authentication requirements
5. Note rate limiting rules
