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

const predictionService = vi.hoisted(() => ({
  predictJobSearch: vi.fn(),
}));

const logger = vi.hoisted(() => ({
  legacyLogInfo: vi.fn(),
  legacyLogError: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/prediction.service.js", () => predictionService);
vi.mock("@utils/logger.js", () => logger);

function createMockResponse() {
  const state: { headers: Record<string, string> } = { headers: {} };
  const res = {
    setHeader: (k: string, v: string) => {
      state.headers[k] = v;
    },
  };
  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/predict/job-search");
}

describe("Predict Job Search Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    predictionService.predictJobSearch.mockReset();
    logger.legacyLogInfo.mockReset();
    logger.legacyLogError.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 9 });

    const { res, state } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/predict/job-search", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(state.headers["Retry-After"]).toBe("9");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/predict/job-search", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when jobs is missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/predict/job-search", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("throws 502 ai_error when service returns {error}", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobs: [{ id: 1 }] });
    predictionService.predictJobSearch.mockResolvedValueOnce({
      error: "ai down",
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/predict/job-search", "http://localhost"),
        "req-1",
        "user-1",
        counters as any
      )
    ).rejects.toMatchObject({ status: 502, code: "ai_error" });

    expect(counters.generate_fail).toBe(1);
  });

  it("returns 200 with predictions", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ jobs: [{ id: 1 }] });
    predictionService.predictJobSearch.mockResolvedValueOnce({
      success: true,
      predictions: [{ kind: "offer_probability", score: 0.1 }],
      simulated: true,
    });

    const counters = {
      generate_total: 0,
      generate_success: 0,
      generate_fail: 0,
    };

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/predict/job-search", "http://localhost"),
      "req-1",
      "user-1",
      counters as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({
        success: true,
        predictions: [{ kind: "offer_probability", score: 0.1 }],
        simulated: true,
        meta: expect.any(Object),
      })
    );

    expect(counters.generate_success).toBe(1);
  });
});
