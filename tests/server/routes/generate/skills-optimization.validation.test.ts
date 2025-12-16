import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const rateLimiter = vi.hoisted(() => ({
  checkLimit: vi.fn(),
}));

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
}));

const orchestrator = vi.hoisted(() => ({
  handleSkillsOptimization: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/orchestrator.js", () => orchestrator);

function createMockResponse() {
  const state: {
    status?: number;
    headers: Record<string, string>;
    body: string;
  } = {
    headers: {},
    body: "",
  };

  const res = {
    setHeader: (name: string, value: string) => {
      state.headers[name] = value;
    },
    writeHead: (status: number, headers: Record<string, string>) => {
      state.status = status;
      state.headers = { ...state.headers, ...headers };
    },
    end: (data?: string) => {
      state.body = data || "";
    },
  };

  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/skills-optimization");
}

describe("Generate Skills Optimization Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    orchestrator.handleSkillsOptimization.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 4 });

    const { res, state } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/skills-optimization", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(state.headers["Retry-After"]).toBe("4");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/skills-optimization", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when jobId is missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/skills-optimization", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("throws 502 ai_error when orchestrator returns error", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobId: 123 });
    orchestrator.handleSkillsOptimization.mockResolvedValueOnce({
      error: "ai down",
    });

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/skills-optimization", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 502, code: "ai_error" });
  });

  it("returns 200 with persisted=false when Supabase env is missing", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobId: 123 });
    orchestrator.handleSkillsOptimization.mockResolvedValueOnce({
      artifact: {
        id: "a1",
        user_id: "user-1",
        job_id: 123,
        kind: "skills_optimization",
        content: {
          recommended: ["TypeScript"],
          emphasized: [],
          gaps: [],
          score: 0.8,
        },
        metadata: {},
        created_at: "2020-01-01T00:00:00.000Z",
      },
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };
    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/generate/skills-optimization", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(state.status).toBe(200);
    const body = JSON.parse(state.body);
    expect(body.kind).toBe("skills_optimization");
    expect(body.persisted).toBe(false);

    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });
});
