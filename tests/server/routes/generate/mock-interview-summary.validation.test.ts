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
vi.mock("@server/services/aiClient.js", () => ({
  generate: aiClient.generate,
}));

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/mock-interview-summary");
}

describe("Generate Mock Interview Summary Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 3 });

    const res = { setHeader: vi.fn() } as any;
    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/mock-interview-summary", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "3");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/mock-interview-summary", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("returns 201 fallback when AI returns no structured output", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      jobTitle: "SWE",
      qa: [{ question: "Q?", answer: "A" }],
    });

    aiClient.generate.mockResolvedValueOnce({
      json: null,
      text: "not-json",
      tokens: 5,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/mock-interview-summary", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      201,
      expect.objectContaining({
        overall_score: null,
        improvement_areas: expect.any(Array),
      })
    );
  });

  it("returns 201 with sanitized AI fields when json is present", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      jobTitle: "SWE",
      qa: [{ question: "Q?", answer: "A" }],
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {
        overall_score: 88,
        improvement_areas: ["Be more concise"],
        response_quality_analysis: "Solid answers.",
        confidence_tips: ["Slow down"],
      },
      text: null,
      tokens: 5,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/mock-interview-summary", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      201,
      expect.objectContaining({
        overall_score: 88,
        improvement_areas: ["Be more concise"],
        response_quality_analysis: "Solid answers.",
        confidence_tips: ["Slow down"],
        meta: expect.any(Object),
      })
    );
  });
});
