import type {
  ResumeArtifactContent,
  ResumePreviewModel,
} from "@workspaces/ai/types/ai";

/**
 * toPreviewModel
 * WHAT: Convert raw ResumeArtifactContent (server contract) into a UI-friendly ResumePreviewModel.
 * WHY: Normalize optional arrays and field names; simplify renderer logic and allow future enrichment.
 * INPUT: ResumeArtifactContent | null | undefined
 * OUTPUT: ResumePreviewModel (empty object if input null)
 */
export function toPreviewModel(
  source: ResumeArtifactContent | null | undefined
): ResumePreviewModel {
  if (!source) return {};
  const experience =
    source.sections?.experience?.map((e) => ({
      employment_id: e.employment_id,
      role: e.role,
      company: e.company,
      dates: e.dates,
      bullets: e.bullets || [],
    })) || [];
  const education =
    source.sections?.education?.map((e) => ({
      education_id: e.education_id,
      institution: e.institution,
      degree: e.degree,
      graduation_date: e.graduation_date,
      details: e.details || [],
    })) || [];
  const projects =
    source.sections?.projects?.map((p) => ({
      project_id: p.project_id,
      name: p.name,
      role: p.role,
      bullets: p.bullets || [],
    })) || [];
  return {
    summary: source.summary,
    skills: source.ordered_skills || [],
    emphasize_skills: source.emphasize_skills || [],
    add_skills: source.add_skills || [],
    experience,
    education,
    projects,
    ats_keywords: source.ats_keywords || [],
    score: source.score,
    meta: source.meta || {},
  };
}

/**
 * diffPreviewModels
 * WHAT: Produce a bullet-level diff summary between two preview models (left vs right).
 * WHY: For compare modal — highlight added, removed, and modified bullets.
 * NOTE: Simplistic algorithm: exact string match; modifications detected by presence in both but different position.
 */
export function diffPreviewModels(
  left: ResumePreviewModel,
  right: ResumePreviewModel
) {
  const result: {
    experience: Array<{
      role?: string;
      company?: string;
      leftBullets: string[];
      rightBullets: string[];
      added: string[];
      removed: string[];
      modifiedPositions: Array<{
        bullet: string;
        leftIndex: number;
        rightIndex: number;
      }>;
    }>;
    skills: { added: string[]; removed: string[] };
  } = { experience: [], skills: { added: [], removed: [] } };

  // Skills diff
  const leftSkills = new Map((left.skills || []).map((s) => [s, true]));
  const rightSkills = new Map((right.skills || []).map((s) => [s, true]));
  for (const s of rightSkills.keys())
    if (!leftSkills.has(s)) result.skills.added.push(s);
  for (const s of leftSkills.keys())
    if (!rightSkills.has(s)) result.skills.removed.push(s);

  // Experience diff (align by role+company key; naive)
  const rightIndex = new Map<
    string,
    {
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }
  >(
    (right.experience || []).map((row) => [
      `${row.role || ""}|${row.company || ""}`,
      row,
    ])
  );
  for (const leftRow of left.experience || []) {
    const key = `${leftRow.role || ""}|${leftRow.company || ""}`;
    const rRow = rightIndex.get(key);
    if (!rRow) {
      result.experience.push({
        role: leftRow.role,
        company: leftRow.company,
        leftBullets: leftRow.bullets,
        rightBullets: [],
        added: [],
        removed: leftRow.bullets.slice(),
        modifiedPositions: [],
      });
      continue;
    }
    const added: string[] = [];
    const removed: string[] = [];
    const modifiedPositions: Array<{
      bullet: string;
      leftIndex: number;
      rightIndex: number;
    }> = [];
    const leftMap = new Map<string, number>(
      leftRow.bullets.map((b: string, i: number) => [b, i])
    );
    const rightMap = new Map<string, number>(
      rRow.bullets.map((b: string, i: number) => [b, i])
    );
    for (const b of rRow.bullets) if (!leftMap.has(b)) added.push(b);
    for (const b of leftRow.bullets) if (!rightMap.has(b)) removed.push(b);
    // Position changes
    for (const b of rRow.bullets) {
      const li = leftMap.get(b);
      const ri = rightMap.get(b);
      if (li !== undefined && ri !== undefined && li !== ri) {
        modifiedPositions.push({ bullet: b, leftIndex: li, rightIndex: ri });
      }
    }
    result.experience.push({
      role: leftRow.role,
      company: leftRow.company,
      leftBullets: leftRow.bullets,
      rightBullets: rRow.bullets,
      added,
      removed,
      modifiedPositions,
    });
  }
  // Rows only in right (pure additions)
  const leftKeys = new Set(
    (left.experience || []).map(
      (row) => `${row.role || ""}|${row.company || ""}`
    )
  );
  for (const rRow of right.experience || []) {
    const key = `${rRow.role || ""}|${rRow.company || ""}`;
    if (!leftKeys.has(key)) {
      result.experience.push({
        role: rRow.role,
        company: rRow.company,
        leftBullets: [],
        rightBullets: rRow.bullets,
        added: rRow.bullets.slice(),
        removed: [],
        modifiedPositions: [],
      });
    }
  }
  return result;
}
