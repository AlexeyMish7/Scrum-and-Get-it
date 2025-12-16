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

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/interview-feedback");
}

describe("Generate Interview Feedback Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 2 });

    const res = { setHeader: vi.fn() } as any;

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/interview-feedback", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "2");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/interview-feedback", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("returns 201 with modelAnswer/feedback when AI returns json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ question: "Q", answer: "A" });
    aiClient.generate.mockResolvedValueOnce({
      json: { modelAnswer: "X", feedback: ["a", "b", "c"] },
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/interview-feedback", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      201,
      expect.objectContaining({
        modelAnswer: "X",
        feedback: ["a", "b", "c"],
        meta: expect.any(Object),
      })
    );

    expect(counters.generate_success).toBe(1);
  });
});
