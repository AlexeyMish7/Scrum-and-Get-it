/**
 * ROUTES INDEX - REORGANIZED STRUCTURE
 *
 * All route handlers organized by resource with HTTP method-named functions.
 * Each file/folder corresponds to an API endpoint with clearly named methods:
 *   - get()    - GET requests
 *   - post()   - POST requests
 *   - patch()  - PATCH requests
 *   - del()    - DELETE requests
 *
 * File organization matches URL structure for clarity:
 *   /api/artifacts       -> artifacts/index.ts::get()
 *   /api/artifacts/:id   -> artifacts/index.ts::getById()
 *   /api/job-materials   -> artifacts/job-materials.ts::post()
 */

// ===== HEALTH =====
export {
  handleHealth,
  type HealthCounters,
  type HealthCheckOptions,
} from "./health.js";

// ===== GENERATION (AI) =====
export { post as postGenerateResume } from "./generate/resume.js";
export { post as postGenerateCoverLetter } from "./generate/cover-letter.js";
export { post as postSkillsOptimization } from "./generate/skills-optimization.js";
export { post as postExperienceTailoring } from "./generate/experience-tailoring.js";
export { post as postCompanyResearch } from "./generate/company-research.js";
export { post as postJobImport } from "./generate/job-import.js";
export { post as postJobMatch } from "./generate/job-match.js";
export type { GenerationCounters } from "./generate/types.js";

// ===== ARTIFACTS =====
export {
  get as getArtifacts, // GET /api/artifacts
  getById as getArtifact, // GET /api/artifacts/:id
} from "./artifacts/index.js";

export {
  post as postJobMaterials, // POST /api/job-materials
  getByJob as getJobMaterials, // GET /api/jobs/:jobId/materials
} from "./artifacts/job-materials.js";

// ===== COVER LETTER DRAFTS =====
export {
  list as listCoverLetterDrafts, // GET /api/cover-letter/drafts
  get as getCoverLetterDraft, // GET /api/cover-letter/drafts/:id
  post as postCoverLetterDraft, // POST /api/cover-letter/drafts
  patch as patchCoverLetterDraft, // PATCH /api/cover-letter/drafts/:id
  del as deleteCoverLetterDraft, // DELETE /api/cover-letter/drafts/:id
} from "./cover-letter/drafts.js";

// ===== COMPANY RESEARCH =====
export { get as getCompanyResearch } from "./company/research.js";

// ===== SALARY RESEARCH =====
export { post as postSalaryResearch } from "./salary/research.js";

// ===== LEGACY COMPATIBILITY EXPORTS =====
// Maintain old names for backwards compatibility during migration
// TODO: Remove these after server.ts is fully updated
export { post as handleGenerateResume } from "./generate/resume.js";
export { post as handleGenerateCoverLetter } from "./generate/cover-letter.js";
export { post as handleSkillsOptimization } from "./generate/skills-optimization.js";
export { post as handleExperienceTailoring } from "./generate/experience-tailoring.js";
export { post as handleCompanyResearch } from "./generate/company-research.js";
export { post as handleJobImport } from "./generate/job-import.js";
export { post as handleJobMatch } from "./generate/job-match.js";
export { get as handleListArtifacts } from "./artifacts/index.js";
export { getById as handleGetArtifact } from "./artifacts/index.js";
export { post as handleCreateJobMaterials } from "./artifacts/job-materials.js";
export { getByJob as handleListJobMaterialsForJob } from "./artifacts/job-materials.js";
export { list as handleListDrafts } from "./cover-letter/drafts.js";
export { get as handleGetDraft } from "./cover-letter/drafts.js";
export { post as handleCreateDraft } from "./cover-letter/drafts.js";
export { patch as handleUpdateDraft } from "./cover-letter/drafts.js";
export { del as handleDeleteDraft } from "./cover-letter/drafts.js";
export { get as handleGetCompanyResearch } from "./company/research.js";
export { post as handleSalaryResearch } from "./salary/research.js";
