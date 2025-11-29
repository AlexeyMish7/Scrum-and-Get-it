/**
 * Lightweight local Question Bank generator and practice tracker.
 *
 * - Generates role/industry-specific question banks using templates and
 *   simple heuristics (keywords from job title and industry).
 * - Tracks practiced questions and stores written responses in localStorage
 *   under `sgt:interview_question_practice`.
 * - Exposes helpers for generating banks, listing practiced items, exporting
 *   practice data, and marking questions practiced.
 *
 * Note: This is intentionally front-end only for Sprint-2. For multi-user
 * support migrate storage to the backend (Supabase) and add proper auth scoping.
 */

export type Difficulty = "entry" | "mid" | "senior";
export type Category = "behavioral" | "technical" | "situational";

export interface InterviewQuestion {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
  skillTags?: string[];
  companySpecific?: boolean;
}

export interface PracticedRecord {
  id: string; // matches question id + timestamp
  questionId: string;
  practicedAt: string; // ISO
  draftResponse?: string; // user's written response
}

const PRACTICE_KEY = "sgt:interview_question_practice";

function makeId(prefix = "q") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function readPractice(): PracticedRecord[] {
  try {
    const raw = localStorage.getItem(PRACTICE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PracticedRecord[];
  } catch (e) {
    console.error("Failed to read practice records", e);
    return [];
  }
}

function writePractice(items: PracticedRecord[]) {
  try {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to write practice records", e);
  }
}

/**
 * Generate a question bank for a given job title and industry.
 * This is heuristic-based and uses templates. It's deterministic per-run
 * but intentionally simple so designers can refine prompts later.
 */
export function generateQuestionBank(opts: {
  jobTitle: string;
  industry?: string;
  difficulty?: Difficulty;
  includeCompanySpecific?: boolean;
}): InterviewQuestion[] {
  const { jobTitle, industry = "", difficulty = "mid", includeCompanySpecific = true } = opts;

  // derive keywords from job title
  const keywords = jobTitle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 4);

  const baseSkills = [
    ...keywords.map((k) => k[0].toUpperCase() + k.slice(1)),
    ...industry ? [industry] : [],
  ].filter(Boolean);

  const behavioralTemplates = [
    "Tell me about a time you faced a significant challenge at work and how you handled it.",
    "Describe a situation where you had to work with a difficult teammate. How did you manage the relationship?",
    "Give an example of a time you took ownership of a project from start to finish.",
  ];

  const situationalTemplates = [
    "How would you approach [CHALLENGE] if you were joining a new team focused on {company} products?",
    "If a critical production bug appeared during a major release, what steps would you take to respond and communicate with stakeholders?",
    "You're tasked with improving performance for a slow user flow — what metrics would you gather first and what might you try?",
  ];

  const technicalTemplates = [
    `Explain the architecture you'd design for a scalable ${keywords[0] || "system"}.`,
    `What data structures and algorithms are important for implementing a high-throughput ${keywords[0] || "service"}?`,
    `Describe the trade-offs between monoliths and microservices in ${industry || "modern web"} applications.`,
  ];

  const questions: InterviewQuestion[] = [];

  // behavioral
  for (const t of behavioralTemplates) {
    const id = makeId("b");
    questions.push({
      id,
      text: t,
      category: "behavioral",
      difficulty,
      skillTags: baseSkills,
      companySpecific: false,
    });
  }

  // situational
  for (const t of situationalTemplates) {
    let txt = t.replace("[CHALLENGE]", `a roadmap mismatch between product and engineering`);
    txt = txt.replace("{company}", industry || "the company");
    const id = makeId("s");
    questions.push({
      id,
      text: txt,
      category: "situational",
      difficulty,
      skillTags: baseSkills,
      companySpecific: includeCompanySpecific,
    });
  }

  // technical
  for (const t of technicalTemplates) {
    const id = makeId("t");
    questions.push({
      id,
      text: t,
      category: "technical",
      difficulty,
      skillTags: baseSkills,
      companySpecific: false,
    });
  }

  // Add a few role-specific quick questions based on keywords
  for (const kw of keywords) {
    const id = makeId("k");
    questions.push({
      id,
      text: `What experience do you have with ${kw} and how have you applied it in projects?`,
      category: "technical",
      difficulty,
      skillTags: [kw],
      companySpecific: false,
    });
  }

  return questions;
}

/**
 * Try server-side AI generation first. If the server call fails or returns
 * invalid data, fall back to the local heuristic generator above.
 */
export async function fetchQuestionBank(opts: {
  jobTitle: string;
  industry?: string;
  difficulty?: Difficulty;
  includeCompanySpecific?: boolean;
}): Promise<InterviewQuestion[]> {
  try {
    // Use the centralized aiClient so we get auth headers, retry on 401,
    // and consistent base URL handling (VITE_AI_BASE_URL).
    // aiClient.postJson will throw on non-OK responses.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const aiClient = (await import("@shared/services/ai/client")).default;
    const payload = await aiClient.postJson("/api/generate/interview-questions", opts as any);
  const items = (((payload as any)?.questions ?? (payload as any)) as any[]);
    if (!Array.isArray(items)) throw new Error("Invalid response shape");
    // Normalize items to InterviewQuestion shape and ensure ids
    return items.map((it) => ({
      id: it.id || makeId("ai"),
      text: it.text || it.prompt || String(it).slice(0, 200),
      category: (it.category as Category) || "technical",
      difficulty: (it.difficulty as Difficulty) || "mid",
      skillTags: Array.isArray(it.skillTags) ? it.skillTags : [],
      companySpecific: Boolean(it.companySpecific),
    }));
  } catch (e) {
    // fallback
    try {
      return generateQuestionBank(opts);
    } catch (err) {
      console.warn("Both server and local generation failed", e, err);
      return [];
    }
  }
}

export function listPracticed(): PracticedRecord[] {
  return readPractice();
}

export function markPracticed(questionId: string, draftResponse?: string): PracticedRecord {
  const all = readPractice();
  const rec: PracticedRecord = {
    id: makeId("p"),
    questionId,
    practicedAt: new Date().toISOString(),
    draftResponse,
  };
  all.push(rec);
  writePractice(all);
  return rec;
}

export function clearPractice() {
  writePractice([]);
}

export function exportPracticeJSON() {
  const payload = { exportedAt: new Date().toISOString(), items: readPractice() };
  return JSON.stringify(payload, null, 2);
}

export default {
  generateQuestionBank,
  listPracticed,
  markPracticed,
  clearPractice,
  exportPracticeJSON,
  fetchQuestionBank,
};
