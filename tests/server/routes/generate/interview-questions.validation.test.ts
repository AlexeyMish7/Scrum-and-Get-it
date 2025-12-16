import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const rateLimiter = vi.hoisted(() => ({
  checkLimit: vi.fn(),
}));

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
  sendJson: vi.fn(),
}));

const aiClient = vi.hoisted(() => ({
  generate: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/aiClient.js", () => aiClient);

function createMockResponse() {
  const state: {
    headers: Record<string, string>;
  } = {
    headers: {},
  };

  const res = {
    setHeader: (name: string, value: string) => {
      state.headers[name] = value;
    },
  };

  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/interview-questions");
}

describe("Generate Interview Questions Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 15 });

    const { res, state } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/interview-questions", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(state.headers["Retry-After"]).toBe("15");
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
        new URL("/api/generate/interview-questions", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("returns 201 with questions when AI returns json.questions", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobTitle: "SWE", difficulty: "mid" });
    aiClient.generate.mockResolvedValueOnce({
      json: { questions: [{ id: "q1", text: "Tell me about yourself" }] },
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/interview-questions", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      201,
      expect.objectContaining({
        questions: [{ id: "q1", text: "Tell me about yourself" }],
        meta: expect.any(Object),
      })
    );

    expect(counters.generate_total).toBe(1);
    expect(counters.generate_success).toBe(1);
    expect(counters.generate_fail).toBe(0);
  });

  it("throws 502 ai_error when AI throws", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});
    aiClient.generate.mockRejectedValueOnce(new Error("boom"));

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/interview-questions", "http://localhost"),
        "req-1",
        "user-1",
        counters as any
      )
    ).rejects.toMatchObject({ status: 502, code: "ai_error" });

    expect(counters.generate_total).toBe(1);
    expect(counters.generate_success).toBe(0);
    expect(counters.generate_fail).toBe(1);
  });
});
