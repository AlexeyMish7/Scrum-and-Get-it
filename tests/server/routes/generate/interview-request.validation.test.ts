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

const aiClient = vi.hoisted(() => ({
  generate: vi.fn(),
}));

const supabaseAdmin = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getJob: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", async () => {
  const actual = await vi.importActual<any>("@utils/http.js");
  return { ...actual, readJson: http.readJson };
});
vi.mock("@server/services/aiClient.js", () => aiClient);
vi.mock("@server/services/supabaseAdmin.js", () => supabaseAdmin);

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
  return await import("@server/routes/generate/interview-request");
}

describe("Generate Interview Request Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    aiClient.generate.mockReset();
    supabaseAdmin.getProfile.mockReset();
    supabaseAdmin.getJob.mockReset();
  });

  it("throws 400 bad_request when required data is missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/interview-request", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 201 with subject/email/prep when AI returns json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      name: "Ada Lovelace",
      topic: "career",
    });

    supabaseAdmin.getProfile.mockResolvedValueOnce({
      first_name: "Pat",
      last_name: "Lee",
    });
    supabaseAdmin.getJob.mockResolvedValueOnce(null);

    aiClient.generate.mockResolvedValueOnce({
      json: {
        subject: "Quick informational chat request",
        email:
          "Hi Ada,\n\nWould you be open to a quick chat?\n\nBest,\nPat Lee",
        prep: ["Review their background"],
      },
      text: null,
    });

    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/generate/interview-request", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(body.subject).toBeTruthy();
    expect(body.email).toContain("Pat Lee");
    expect(Array.isArray(body.prep)).toBe(true);
  });
});
