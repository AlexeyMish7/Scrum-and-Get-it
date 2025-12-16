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
  return await import("@server/routes/generate/coaching-insights");
}

describe("Generate Coaching Insights Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 7 });

    const res = { setHeader: vi.fn() } as any;
    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/coaching-insights", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "7");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/coaching-insights", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 missing_field when menteeData is missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/coaching-insights", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "missing_field" });
  });

  it("throws 400 missing_field when menteeData lacks name/jobStats", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ menteeData: { name: "Jane" } });

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/coaching-insights", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "missing_field" });
  });

  it("returns 200 with parsed insights and meta", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      menteeData: {
        name: "Jane",
        engagementLevel: "high",
        jobStats: {
          total: 10,
          applied: 8,
          interviewing: 2,
          offers: 0,
          rejected: 3,
        },
      },
      teamContext: "Team A",
      focusArea: "general",
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {
        summary: "Doing well.",
        recommendations: ["Keep going"],
        focusAreas: [
          { area: "Interviews", priority: "high", suggestion: "Practice" },
        ],
        strengthAreas: ["Consistency"],
        suggestedGoals: [
          {
            title: "Apply weekly",
            type: "weekly_applications",
            reason: "Momentum",
          },
        ],
        actionPlan: [{ week: 1, actions: ["Apply to 5 roles"] }],
        motivationalNote: "You got this!",
      },
      text: null,
      tokens: 10,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/coaching-insights", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({
        summary: "Doing well.",
        meta: expect.objectContaining({ mentee_name: "Jane" }),
      })
    );
  });
});
