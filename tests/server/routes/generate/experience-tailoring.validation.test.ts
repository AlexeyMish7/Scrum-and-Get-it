import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  handleExperienceTailoring: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", async () => {
  const actual = await vi.importActual<any>("@utils/http.js");
  return { ...actual, readJson: http.readJson };
});
vi.mock("@server/services/orchestrator.js", () => orchestrator);

function createMockResponse() {
  const state: {
    status?: number;
    headers: Record<string, string>;
    body: string;
  } = { headers: {}, body: "" };

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
  return await import("@server/routes/generate/experience-tailoring");
}

describe("Generate Experience Tailoring Route - validation", () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    orchestrator.handleExperienceTailoring.mockReset();

    // Disable persistence in this route (it would attempt a Supabase insert).
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
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
        new URL("/api/generate/experience-tailoring", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 201 with artifact payload when orchestrator succeeds", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobId: 123 });

    orchestrator.handleExperienceTailoring.mockResolvedValueOnce({
      artifact: {
        id: "artifact-1",
        user_id: "user-1",
        job_id: 123,
        kind: "experience_tailoring",
        created_at: "2025-01-01T00:00:00.000Z",
        content: { experiences: [] },
        metadata: {},
      },
      error: null,
    });

    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/generate/experience-tailoring", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(body.kind).toBe("experience_tailoring");
    expect(body.persisted).toBe(false);
    expect(body.content).toEqual({ experiences: [] });
  });
});
