import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

type SupabaseThenableResponse = { data?: any; error?: any };

function createThenableQuery(response: SupabaseThenableResponse) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    range: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    single: vi.fn(() => query),
    then: (onFulfilled: any, onRejected: any) => {
      return Promise.resolve(response).then(onFulfilled, onRejected);
    },
  };
  return query;
}

function createRejectingThenableQuery(error: any) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    range: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    single: vi.fn(() => query),
    then: (onFulfilled: any, onRejected: any) => {
      return Promise.reject(error).then(onFulfilled, onRejected);
    },
  };
  return query;
}

const ai = vi.hoisted(() => ({
  generate: vi.fn(),
}));

const companyResearch = vi.hoisted(() => ({
  fetchCompanyResearch: vi.fn(),
}));

const supabaseAdmin = vi.hoisted(() => {
  const rpc = vi.fn();

  const supabase = {
    rpc,
    from: vi.fn((table: string) => {
      // Default empty response; tests can override via mockImplementationOnce.
      return createThenableQuery({ data: [], error: null });
    }),
  };

  return {
    default: supabase,
    getProfile: vi.fn(),
    getJob: vi.fn(),
    getComprehensiveProfile: vi.fn(),
    __rpc: rpc,
    __supabase: supabase,
  };
});

vi.mock("@server/services/aiClient.js", () => ({
  default: { generate: ai.generate },
}));

vi.mock("@server/services/companyResearchService.js", () => ({
  fetchCompanyResearch: companyResearch.fetchCompanyResearch,
}));

vi.mock("@server/services/supabaseAdmin.js", () => ({
  default: supabaseAdmin.default,
  getProfile: supabaseAdmin.getProfile,
  getJob: supabaseAdmin.getJob,
  getComprehensiveProfile: supabaseAdmin.getComprehensiveProfile,
}));

let cachedOrchestrator: any | null = null;
async function getOrchestrator() {
  // Avoid vi.resetModules() here; it can trigger intermittent "No test suite found"
  // flakiness in the large multi-file Vitest run on Windows.
  if (!cachedOrchestrator) {
    cachedOrchestrator = await import("@server/services/orchestrator.js");
  }
  return cachedOrchestrator;
}

describe("orchestrator - handleSalaryResearch", () => {
  beforeEach(() => {
    ai.generate.mockReset();
  });

  it("returns unauthenticated when userId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleSalaryResearch({ title: "SWE" } as any);
    expect(result).toEqual({ error: "unauthenticated" });
  });

  it("returns missing title when title empty", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleSalaryResearch({
      userId: "u1",
      title: "  ",
    } as any);
    expect(result).toEqual({ error: "missing title" });
  });

  it("parses salary JSON from fenced codeblock text", async () => {
    const orch = await getOrchestrator();

    ai.generate.mockResolvedValueOnce({
      text: '```json\n{"range":{"low":1,"avg":2,"high":3}}\n```',
      json: undefined,
      tokens: 10,
      model: "gpt-4o-mini",
    });

    const result = await orch.handleSalaryResearch({
      userId: "u1",
      title: "Software Engineer",
      location: "NYC",
    });

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("salary_research");
    expect((result.artifact?.content as any)?.range?.avg).toBe(2);
  });

  it("returns Invalid AI response format when salary JSON parsing fails", async () => {
    const orch = await getOrchestrator();

    ai.generate.mockResolvedValueOnce({
      text: "```json not-json ```",
      json: undefined,
      tokens: 10,
      model: "gpt-4o-mini",
    });

    const result = await orch.handleSalaryResearch({
      userId: "u1",
      title: "SWE",
    });
    expect(result).toEqual({ error: "Invalid AI response format" });
  });

  it("returns AI error when provider throws", async () => {
    const orch = await getOrchestrator();

    ai.generate.mockRejectedValueOnce(new Error("boom"));

    const result = await orch.handleSalaryResearch({
      userId: "u1",
      title: "SWE",
    });
    expect(result.error).toBe("AI error: boom");
  });
});

describe("orchestrator - handleCompanyResearch", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    companyResearch.fetchCompanyResearch.mockReset();

    supabaseAdmin.getJob.mockReset();
    (supabaseAdmin.__rpc as any).mockReset();
  });

  it("returns unauthenticated when userId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleCompanyResearch({
      companyName: "Acme",
    } as any);
    expect(result).toEqual({ error: "unauthenticated" });
  });

  it("returns missing companyName when blank", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleCompanyResearch({
      userId: "u1",
      companyName: "  ",
    } as any);
    expect(result).toEqual({ error: "missing companyName" });
  });

  it("parses JSON string, normalizes size, and persists (non-blocking)", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getJob.mockResolvedValueOnce({
      id: 123,
      user_id: "u1",
      industry: "Tech",
      job_description: "Building stuff",
    });

    ai.generate.mockResolvedValueOnce({
      json: undefined,
      text: '```json\n{"companyName":"Acme","size":"1000+","industry":"Software"}\n```',
      tokens: 50,
      model: "gpt-4o-mini",
    });

    (supabaseAdmin.__rpc as any)
      .mockResolvedValueOnce({ data: 42, error: null }) // upsert_company_info
      .mockResolvedValueOnce({ error: null }); // save_company_research

    const result = await orch.handleCompanyResearch({
      userId: "u1",
      companyName: "Acme",
      jobId: 123,
    });

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("company_research");
    expect((result.artifact?.content as any)?.size).toBe("10000+");

    expect((supabaseAdmin.__rpc as any).mock.calls[0][0]).toBe(
      "upsert_company_info"
    );
    expect((supabaseAdmin.__rpc as any).mock.calls[1][0]).toBe(
      "save_company_research"
    );
  });

  it("falls back to fetchCompanyResearch when AI throws and still returns artifact", async () => {
    const orch = await getOrchestrator();

    ai.generate.mockRejectedValueOnce(new Error("ai down"));
    companyResearch.fetchCompanyResearch.mockResolvedValueOnce({
      companyName: "Acme",
      industry: "Software",
    });

    (supabaseAdmin.__rpc as any).mockResolvedValueOnce({
      data: null,
      error: { message: "db down" },
    });

    const result = await orch.handleCompanyResearch({
      userId: "u1",
      companyName: "Acme",
    });

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("company_research");

    // Since upsert failed, cache save should not run.
    expect((supabaseAdmin.__rpc as any).mock.calls[0][0]).toBe(
      "upsert_company_info"
    );
    expect((supabaseAdmin.__rpc as any).mock.calls.length).toBe(1);
  });
});

describe("orchestrator - handleSkillsOptimization", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    supabaseAdmin.getProfile.mockReset();
    supabaseAdmin.getJob.mockReset();
    (supabaseAdmin.__supabase.from as any).mockReset();
  });

  it("returns unauthenticated when userId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleSkillsOptimization({ jobId: 1 } as any);
    expect(result).toEqual({ error: "unauthenticated" });
  });

  it("returns error when job belongs to different user", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({ id: "u1" });
    supabaseAdmin.getJob.mockResolvedValueOnce({ id: 1, user_id: "u2" });

    const result = await orch.handleSkillsOptimization({
      userId: "u1",
      jobId: 1,
    } as any);
    expect(result).toEqual({ error: "job does not belong to user" });
  });

  it("returns artifact when skills query + AI succeed", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({
      id: "u1",
      full_name: "User",
    });
    supabaseAdmin.getJob.mockResolvedValueOnce({
      id: 1,
      user_id: "u1",
      job_title: "SWE",
    });

    (supabaseAdmin.__supabase.from as any).mockImplementationOnce(
      (table: string) => {
        if (table !== "skills") throw new Error("unexpected table");
        return createThenableQuery({
          data: [{ skill_name: "TypeScript" }],
          error: null,
        });
      }
    );

    ai.generate.mockResolvedValueOnce({
      json: {
        recommended: ["TypeScript"],
        emphasized: [],
        gaps: [],
        score: 0.8,
      },
      text: null,
      tokens: 5,
    });

    const result = await orch.handleSkillsOptimization({
      userId: "u1",
      jobId: 1,
    } as any);
    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("skills_optimization");
    expect((result.artifact?.content as any)?.score).toBe(0.8);
  });
});

describe("orchestrator - handleExperienceTailoring", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    supabaseAdmin.getProfile.mockReset();
    supabaseAdmin.getJob.mockReset();
    (supabaseAdmin.__supabase.from as any).mockReset();
  });

  it("returns artifact with kind=resume and subkind metadata", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({
      id: "u1",
      full_name: "User",
    });
    supabaseAdmin.getJob.mockResolvedValueOnce({
      id: 1,
      user_id: "u1",
      job_title: "SWE",
    });

    (supabaseAdmin.__supabase.from as any).mockImplementationOnce(
      (table: string) => {
        if (table !== "employment") throw new Error("unexpected table");
        return createThenableQuery({
          data: [{ id: 1, job_title: "Dev", company_name: "Acme" }],
          error: null,
        });
      }
    );

    ai.generate.mockResolvedValueOnce({
      json: { tailored: true },
      text: null,
      tokens: 5,
    });

    const result = await orch.handleExperienceTailoring({
      userId: "u1",
      jobId: 1,
    });
    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("resume");
    expect((result.artifact?.metadata as any)?.subkind).toBe(
      "experience_tailoring"
    );
  });
});

describe("orchestrator - handleGenerateResume", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    supabaseAdmin.getProfile.mockReset();
    supabaseAdmin.getJob.mockReset();
    (supabaseAdmin.__supabase.from as any).mockReset();
  });

  it("returns unauthenticated when userId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleGenerateResume({ jobId: 1 } as any);
    expect(result).toEqual({ error: "unauthenticated" });
  });

  it("returns missing jobId when jobId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleGenerateResume({ userId: "u1" } as any);
    expect(result).toEqual({ error: "missing jobId" });
  });

  it("returns error when job belongs to different user", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({ id: "u1" });
    supabaseAdmin.getJob.mockResolvedValueOnce({ id: 1, user_id: "u2" });

    const result = await orch.handleGenerateResume({
      userId: "u1",
      jobId: 1,
    } as any);
    expect(result).toEqual({ error: "job does not belong to user" });
  });

  it("generates resume and normalizes malformed summary + sections", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({
      id: "u1",
      full_name: "User",
    });
    supabaseAdmin.getJob.mockResolvedValueOnce({
      id: 1,
      user_id: "u1",
      job_title: "SWE",
    });

    // Force the parallel profile-data fetch to throw to cover the soft-fail path.
    (supabaseAdmin.__supabase.from as any).mockImplementationOnce(() => {
      throw new Error("db down");
    });

    ai.generate.mockResolvedValueOnce({
      json: {
        summary: { text: "  Hello world  " },
        ordered_skills: [{ name: "TypeScript" }, { skill: "React" }],
        sections: {
          experience: [
            {
              role: "Dev",
              company: "Acme",
              bullets: [{ text: "Built things" }, "Shipped features"],
            },
          ],
        },
      },
      text: null,
      tokens: 123,
      model: "gpt-4o-mini",
    });

    const result = await orch.handleGenerateResume({
      userId: "u1",
      jobId: 1,
      options: { templateId: "classic" },
    } as any);

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("resume");

    const content = result.artifact?.content as any;
    expect(content.summary).toBe("Hello world");
    expect(content.ordered_skills).toEqual(["TypeScript", "React"]);
    expect(content.sections?.experience?.[0]?.bullets).toEqual([
      "Built things",
      "Shipped features",
    ]);
  });

  it("returns AI error when provider throws", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getProfile.mockResolvedValueOnce({ id: "u1" });
    supabaseAdmin.getJob.mockResolvedValueOnce({ id: 1, user_id: "u1" });

    ai.generate.mockRejectedValueOnce(new Error("boom"));

    const result = await orch.handleGenerateResume({
      userId: "u1",
      jobId: 1,
    } as any);

    expect(result.error).toBe("AI error: boom");
  });
});

describe("orchestrator - handleGenerateCoverLetter", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    supabaseAdmin.getComprehensiveProfile.mockReset();
    supabaseAdmin.getJob.mockReset();
    (supabaseAdmin.__supabase.from as any).mockReset();
  });

  it("returns unauthenticated when userId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleGenerateCoverLetter({ jobId: 1 } as any);
    expect(result).toEqual({ error: "unauthenticated" });
  });

  it("returns missing jobId when jobId missing", async () => {
    const orch = await getOrchestrator();
    const result = await orch.handleGenerateCoverLetter({
      userId: "u1",
    } as any);
    expect(result).toEqual({ error: "missing jobId" });
  });

  it("queries optional company research and still generates cover letter", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getComprehensiveProfile.mockResolvedValueOnce({
      id: "u1",
      full_name: "User",
    });
    supabaseAdmin.getJob.mockResolvedValueOnce({
      id: 1,
      user_id: "u1",
      job_title: "SWE",
    });

    (supabaseAdmin.__supabase.from as any).mockImplementationOnce(
      (table: string) => {
        expect(table).toBe("ai_artifacts");
        return createThenableQuery({
          data: { content: { companyName: "Acme", industry: "Software" } },
          error: null,
        });
      }
    );

    ai.generate.mockResolvedValueOnce({
      json: { text: "Hello" },
      text: "Hello",
      tokens: 10,
      model: "gpt-4o-mini",
    });

    const result = await orch.handleGenerateCoverLetter({
      userId: "u1",
      jobId: 1,
    } as any);

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("cover_letter");
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(ai.generate.mock.calls[0][0]).toBe("cover_letter");
  });

  it("continues when company research query rejects", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getComprehensiveProfile.mockResolvedValueOnce({ id: "u1" });
    supabaseAdmin.getJob.mockResolvedValueOnce({ id: 1, user_id: "u1" });

    (supabaseAdmin.__supabase.from as any).mockImplementationOnce(() => {
      return createRejectingThenableQuery(new Error("db down"));
    });

    ai.generate.mockResolvedValueOnce({
      json: { text: "Hello" },
      text: "Hello",
      tokens: 10,
      model: "gpt-4o-mini",
    });

    const result = await orch.handleGenerateCoverLetter({
      userId: "u1",
      jobId: 1,
    } as any);

    expect(result.error).toBeUndefined();
    expect(result.artifact?.kind).toBe("cover_letter");
  });

  it("returns AI error when provider throws", async () => {
    const orch = await getOrchestrator();

    supabaseAdmin.getComprehensiveProfile.mockResolvedValueOnce({ id: "u1" });
    supabaseAdmin.getJob.mockResolvedValueOnce({ id: 1, user_id: "u1" });

    ai.generate.mockRejectedValueOnce(new Error("boom"));

    const result = await orch.handleGenerateCoverLetter({
      userId: "u1",
      jobId: 1,
    } as any);

    expect(result.error).toBe("AI error: boom");
  });
});
