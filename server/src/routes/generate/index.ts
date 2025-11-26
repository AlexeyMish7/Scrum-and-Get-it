/**
 * GENERATION ROUTES INDEX
 *
 * Barrel export for all AI generation endpoints under /api/generate/*
 *
 * Endpoints:
 *   POST /api/generate/resume                  -> resume.ts::post()
 *   POST /api/generate/cover-letter            -> cover-letter.ts::post()
 *   POST /api/generate/skills-optimization     -> skills-optimization.ts::post()
 *   POST /api/generate/experience-tailoring    -> experience-tailoring.ts::post()
 *   POST /api/generate/company-research        -> company-research.ts::post()
 */

export { post as postResume } from "./resume.js";
export { post as postCoverLetter } from "./cover-letter.js";
export { post as postSkillsOptimization } from "./skills-optimization.js";
export { post as postExperienceTailoring } from "./experience-tailoring.js";
export { post as postCompanyResearch } from "./company-research.js";
export { post as postRelationship } from "./relationship.js";
export { post as postReferencePoints } from "./reference-points.js";
export type { GenerationCounters } from "./types.js";
export { makePreview } from "./utils.js";
