# AI Resume Generation Flow (Sprint 2)

> Purpose: Provide a clear end-to-end reference for how the resume generation system works: from draft/template selection through AI orchestration, artifact persistence, customization, preview, and export/linking to job materials.

## High-Level Stages

1. Draft Selection (Client) – Choose or create a local resume draft (stored in `localStorage` via `useResumeDrafts`).
2. Generation Request (Client) – User picks target job + options (tone, focus, toggles) and clicks Generate.
3. Orchestration (Server) – Backend fetches profile + job + enrichment data (skills, employment, education, projects, certifications) and builds prompts.
4. AI Provider Call – Prompt passed to configured model (OpenAI or mock) with tuning options (temperature, max tokens, retries).
5. Artifact Assembly – Raw AI JSON/text normalized into `ResumeArtifactContent` shape.
6. Persistence (Conditional) – Insert into `ai_artifacts` (if Supabase admin creds available) and respond with full content for immediate UI rendering.
7. Optional Segments (Skills Optimization, Experience Tailoring) – Parallel generation and merging into unified content (frontend merges via hook V2).
8. Apply to Draft – User selectively applies ordered skills, summary, and experience bullets to the active draft (`useResumeDrafts`).
9. Preview – Formatted preview renders updated content (AI vs Draft). New bullets highlighted.
10. Export / Link – PDF/DOCX export captured, uploaded to storage, a `documents` row created, then linked via `job_materials`.

## Data Shapes

### ResumeArtifactContent (Core JSON contract)

```
{
  summary?: string,
  ordered_skills?: string[],
  emphasize_skills?: string[],
  add_skills?: string[],
  ats_keywords?: string[],
  sections?: {
    experience?: [{ employment_id?, role?, company?, dates?, bullets: string[] }],
    education?: [{ education_id?, institution?, degree?, graduation_date?, details?: string[] }],
    projects?: [{ project_id?, name?, role?, bullets: string[] }]
  },
  meta?: Record<string, unknown>
}
```

### Local Draft Record (Client `useResumeDrafts`)

```
{
  id: string,
  name: string,
  createdAt: string,
  sourceVersionId?: string,
  lastAppliedJobId?: number,
  content: {
    summary?: string,
    skills?: string[],
    experience?: [{ role, company?, dates?, bullets: string[] }],
    visibleSections?: string[],
    sectionOrder?: string[]
  }
}
```

### AI Artifact Row (DB `ai_artifacts`)

```
{
  id: uuid,
  user_id: uuid,
  job_id?: bigint,
  kind: 'resume' | 'cover_letter' | 'skills_optimization' | 'company_research' | 'match' | 'gap_analysis',
  title?: text,
  prompt?: text,
  model?: text,
  content: jsonb (ResumeArtifactContent or variant),
  metadata: jsonb,
  created_at: timestamptz,
  updated_at: timestamptz
}
```

### Job Materials Row (`job_materials`)

Links selected artifact OR exported document to a job. History is append-only.

```
{
  id: uuid,
  user_id: uuid,
  job_id: bigint,
  resume_document_id?: uuid,
  resume_artifact_id?: uuid,
  cover_document_id?: uuid,
  cover_artifact_id?: uuid,
  metadata: jsonb,
  created_at: timestamptz
}
```

## Sequence Diagram (Simplified)

```
User ----(select draft)----> Browser (useResumeDrafts)
User ----(Generate)----> GenerationCard ----(run(jobId, options))----> useResumeGenerationFlowV2
useResumeGenerationFlowV2 ----(POST /api/generate/resume)----> Server /api/generate/resume
Server orchestrator ----(Supabase fetch profile/job/etc)----> DB
Server orchestrator ----(AI provider call)----> AI Provider
Server orchestrator ----(artifact JSON)----> DB (persist ai_artifacts?)
Server ----(artifact content JSON)----> Client
useResumeGenerationFlowV2 ----(dispatch events)----> Window custom events
GenerateResume page ----(listen events)----> Updates lastContent / lastSegments
User ----(Apply Skills/Summary/Merge Experience)----> useResumeDrafts (updates local draft)
GenerateResume page ----(rebuild draft-based content)----> ResumeFullPreview
User ----(Export PDF/DOCX)----> Export pipeline ----(upload)----> Supabase Storage
Export pipeline ----(insert documents + link job_materials)----> DB
```

## Event Bus (Window Custom Events)

| Event                           | Payload                                  | Purpose                                    |
| ------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `sgt:resumeGeneration:start`    | { jobId, options, ts }                   | Marks new run start.                       |
| `sgt:resumeGeneration:segment`  | { segment, status, content?, jobId, ts } | Segment progress (base/skills/experience). |
| `sgt:resumeGenerated`           | { content, jobId, ts }                   | Unified merged content ready.              |
| `sgt:resumeGeneration:complete` | { state, jobId, ts }                     | Final statuses.                            |
| `sgt:resumeGeneration:reset`    | { ts }                                   | Clear prior state.                         |
| `sgt:resumeGeneration:aborted`  | { jobId, ts }                            | Abort signal for UI.                       |
| `sgt:resumeApplication`         | { action, jobId, changed?, applied? }    | Telemetry for apply interactions.          |

## Merging Logic (Frontend `useResumeGenerationFlowV2`)

- Base resume content retrieved first; status set to `success`.
- Optional segments (skills, experience) run in parallel and update their portion independently.
- `mergeContent(base, skills, experience)` stitches pieces into a single `ResumeArtifactContent`.
- Draft application does NOT mutate the stored artifact; instead the draft is updated and we rehydrate a synthetic `lastContent` snapshot to keep formatted preview consistent.

## Common Failure Points & Fixes

| Issue                                  | Cause                                                                          | Mitigation                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Step jump from Generate → Preview      | Residual `lastContent` loaded on mount triggers auto-advance                   | Reset `lastContent` on mount & gate auto-advance with run token.                                        |
| Apply buttons do nothing visually      | Formatted preview used stale AI artifact instead of updated draft              | After applying, rebuild `lastContent` from draft state.                                                 |
| Missing experience bullets after merge | Duplicate-role merge logic filters by role+company; unmatched entries appended | Confirm role/company normalization (lowercase comparison) and avoid silent drops.                       |
| Skills ordering appears unchanged      | Ordered list identical to existing skills                                      | Show toast "No changes to apply"; consider diff highlight for added order changes.                      |
| Export not linked to job               | Missing userId/jobId or storage bucket config                                  | Validate `user.id` and `lastJobId` before `createDocumentAndLink`; surface error via `useErrorHandler`. |

## Export Flow (PDF/DOCX)

1. Capture DOM of formatted preview (`#resume-formatted-preview`) via `html2canvas` OR build DOCX via `docx` library.
2. Generate Blob and trigger client download.
3. If user + job present: upload to `documents` storage bucket → insert `documents` row → call `/api/job-materials` to link.
4. Success toast + screen-reader status message.

## Database Considerations

- `ai_artifacts.kind` CHECK constraint enumerates allowed artifact types; experience tailoring uses `kind='resume'` + `metadata.subkind='experience_tailoring'`.
- `job_materials` is append-only for material history; latest selection via `v_job_current_materials` view.
- Foreign keys use `ON DELETE CASCADE` or `SET NULL` to retain history without breaking referential integrity.
- Suggested indexes already present: (`user_id`), (`job_id, created_at DESC`), `kind` in `ai_artifacts`.
- Potential enhancement: composite index `(user_id, kind, job_id)` if filtering combos become frequent.

## Security & RLS

- All user-owned tables enforce RLS; frontend must always scope queries with `withUser(user.id)`.
- Server side (service role) still verifies ownership prior to inserting job materials or fetching artifacts.

## Extension Hooks (Future)

- Streaming segment results: upgrade events to include partial token streams.
- Real-time collaboration: broadcast draft changes via WebSocket channel keyed by draft id.
- Incremental persistence: store intermediate artifacts for skills/experience to enable rollback.

## Quick Reference (Functions)

| Function                    | Location                               | Responsibility                                  |
| --------------------------- | -------------------------------------- | ----------------------------------------------- |
| `useResumeGenerationFlowV2` | `frontend/src/app/workspaces/ai/hooks` | Orchestrates multi-segment generation & merge.  |
| `useResumeDrafts`           | same                                   | Manages local draft CRUD & apply helpers.       |
| `handleGenerateResume`      | `server/orchestrator.ts`               | Builds prompt & assembles artifact.             |
| `insertAiArtifact`          | `server/supabaseAdmin.ts`              | Persists artifact row with service role.        |
| `linkJobMaterials`          | Frontend service → Server endpoint     | Inserts `job_materials` linkage row.            |
| `createDocumentAndLink`     | Frontend service                       | Upload, create `documents`, link job materials. |

## Testing Pointers

- Unit: mock `aiClient.generate` to return deterministic `ResumeArtifactContent`; assert merge logic.
- Integration: run server with `FAKE_AI=true` and hit endpoints verifying JSON contract and persistence flags.
- UI: simulate apply actions and verify formatted preview updates (new bullets highlighted, skills reordered).

## Known Gaps / Next Steps

1. Education & Projects data not yet merged into draft editor (placeholder messaging present).
2. Partial artifact persistence per segment not implemented (only full resume artifact stored).
3. No diff visualization for skill ordering changes beyond toast feedback.
4. No pagination or deletion UI for historical artifacts.

---

_Last updated: 2025-11-08_
