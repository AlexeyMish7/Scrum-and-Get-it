import { describe, it, expect, vi, beforeEach } from "vitest";

const rateLimiter = vi.hoisted(() => ({
  checkLimit: vi.fn(),
}));

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
}));

const orchestrator = vi.hoisted(() => ({
  handleGenerateResume: vi.fn(),
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
  return await import("@server/routes/generate/resume");
}

describe("Generate Resume Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    orchestrator.handleGenerateResume.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 12 });

    const { res, state } = createMockResponse();
    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/resume", "http://localhost"),
        "req-1",
        "user-1",
        counters as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(state.headers["Retry-After"]).toBe("12");
    expect(orchestrator.handleGenerateResume).not.toHaveBeenCalled();
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
        new URL("/api/generate/resume", "http://localhost"),
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
        new URL("/api/generate/resume", "http://localhost"),
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
    orchestrator.handleGenerateResume.mockResolvedValueOnce({
      error: "ai is down",
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };
    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/resume", "http://localhost"),
        "req-1",
        "user-1",
        counters as any
      )
    ).rejects.toMatchObject({ status: 502, code: "ai_error" });

    expect(counters.generate_total).toBe(1);
    expect(counters.generate_fail).toBe(1);
    expect(counters.generate_success).toBe(0);
  });

  it("throws 500 no_artifact when orchestrator returns no artifact", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobId: 123 });
    orchestrator.handleGenerateResume.mockResolvedValueOnce({ artifact: null });

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/resume", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 500, code: "no_artifact" });
  });

  it("returns 201 with persisted=false when Supabase env is missing", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobId: 123 });
    orchestrator.handleGenerateResume.mockResolvedValueOnce({
      artifact: {
        user_id: "user-1",
        job_id: 123,
        kind: "resume",
        title: "Resume",
        prompt: "p",
        model: "m",
        content: "Hello world",
        metadata: {},
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
      new URL("/api/generate/resume", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(body.kind).toBe("resume");
    expect(body.content).toBe("Hello world");
    expect(body.persisted).toBe(false);

    expect(counters.generate_total).toBe(1);
    expect(counters.generate_success).toBe(1);
    expect(counters.generate_fail).toBe(0);

    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });
});
