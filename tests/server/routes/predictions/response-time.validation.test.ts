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

const logger = vi.hoisted(() => ({
  legacyLogInfo: vi.fn(),
  legacyLogError: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/aiClient.js", () => aiClient);
vi.mock("@utils/logger.js", () => logger);

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/predictions/response-time");
}

describe("Predictions Response Time Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
    logger.legacyLogInfo.mockReset();
    logger.legacyLogError.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 12 });

    const res = { setHeader: vi.fn() } as any;

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/predictions/response-time", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "12");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/predictions/response-time", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when submissions and job are missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ submissions: [] });

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/predictions/response-time", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with grouped aggregates when submissions provided", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      submissions: [
        {
          companySize: "small",
          industry: "tech",
          jobLevel: "mid",
          submittedAt: "2025-01-01",
          respondedAt: "2025-01-06",
        },
      ],
    });

    // With FAKE_AI=true in setup, route may call AI; keep it deterministic.
    aiClient.generate.mockResolvedValue({
      json: { summary: "ok", recommendations: [] },
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/predictions/response-time", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({
        success: true,
        grouped: expect.any(Object),
        meta: expect.any(Object),
      })
    );

    expect(counters.generate_success).toBe(1);
  });
});
