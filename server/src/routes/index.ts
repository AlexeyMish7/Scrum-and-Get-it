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
export { post as postRelationship } from "./generate/relationship.js";
export { post as postReferralRequest } from "./generate/referral-request.js";
export { post as postReferencePoints } from "./generate/reference-points.js";
export { post as postInterviewRequest } from "./generate/interview-request.js";
export { post as postJobImport } from "./generate/job-import.js";
export { post as postJobMatch } from "./generate/job-match.js";
export { post as postProfileTips } from "./generate/profile-tips.js";
export { post as postInterviewQuestions } from "./generate/interview-questions.js";
export { post as postInterviewFeedback } from "./generate/interview-feedback.js";
export { post as postCoachingInsights } from "./generate/coaching-insights.js";
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
export { get as getUserCompanies } from "./company/user-companies.js";

// ===== SALARY RESEARCH =====
export { post as postSalaryResearch } from "./salary/research.js";

// ===== INTERVIEW ANALYTICS =====
export { post as postAnalyticsIngest } from "./analytics.js";
export { get as getAnalyticsOverview } from "./analytics.js";
export { getTrends as getAnalyticsTrends } from "./analytics.js";
export { getBenchmarks as getAnalyticsBenchmarks } from "./analytics.js";

// ===== PREDICTIONS =====
export { post as postPredictionsResponseTime } from "./predictions/response-time.js";

// ===== LEGACY COMPATIBILITY EXPORTS =====
// Maintain old function names for server.ts during transition
// These match the old handleXyz naming convention used in server.ts routing
export { post as handleGenerateResume } from "./generate/resume.js";
export { post as handleGenerateCoverLetter } from "./generate/cover-letter.js";
export { post as handleSkillsOptimization } from "./generate/skills-optimization.js";
export { post as handleExperienceTailoring } from "./generate/experience-tailoring.js";
export { post as handleCompanyResearch } from "./generate/company-research.js";
export { post as handleJobImport } from "./generate/job-import.js";
export { post as handleJobMatch } from "./generate/job-match.js";
export { post as handleProfileTips } from "./generate/profile-tips.js";
export { post as handleRelationship } from "./generate/relationship.js";
export { post as handleReferralRequest } from "./generate/referral-request.js";
export { post as handleReferencePoints } from "./generate/reference-points.js";
export { post as handleGenerateInterviewRequest } from "./generate/interview-request.js";
export { post as handleGenerateInterviewQuestions } from "./generate/interview-questions.js";
export { post as handleGenerateInterviewFeedback } from "./generate/interview-feedback.js";
export { post as handleCoachingInsights } from "./generate/coaching-insights.js";
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
export { get as handleGetUserCompanies } from "./company/user-companies.js";
export { post as handleSalaryResearch } from "./salary/research.js";
