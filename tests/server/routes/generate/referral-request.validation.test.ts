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
vi.mock("@utils/http.js", async () => {
  const actual = await vi.importActual<any>("@utils/http.js");
  return { ...actual, readJson: http.readJson, sendJson: http.sendJson };
});
vi.mock("@server/services/aiClient.js", () => ({
  generate: aiClient.generate,
}));

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/referral-request");
}

describe("Generate Referral Request Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 5 });

    await expect(
      route.post(
        {} as any,
        { setHeader: vi.fn() } as any,
        new URL("/api/generate/referral-request", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });
  });

  it("throws 400 bad_request when job_title and job_company are missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/referral-request", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with suggestions when AI returns json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      job_title: "SWE",
      job_company: "Acme",
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {
        suggestions: [
          { message: "Hi", tone: "warm", rationale: "ok" },
          { message: "Hello", tone: "professional", rationale: "ok" },
        ],
      },
      text: null,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/referral-request", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
      suggestions: expect.any(Array),
      meta: expect.any(Object),
    });

    const payload = (http.sendJson as any).mock.calls[0][2];
    expect(payload.suggestions.length).toBe(2);
  });

  it("returns 200 with fallback suggestions when AI returns none", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      job_title: "SWE",
      job_company: "Acme",
    });

    aiClient.generate.mockResolvedValueOnce({ json: {}, text: "{}" });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/referral-request", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    const payload = (http.sendJson as any).mock.calls[0][2];
    expect(payload.suggestions.length).toBeGreaterThan(0);
  });
});
