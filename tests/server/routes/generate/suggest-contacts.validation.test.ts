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
  return await import("@server/routes/generate/suggest-contacts");
}

describe("Generate Suggest Contacts Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 9 });

    const res = { setHeader: vi.fn() } as any;
    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/suggest-contacts", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "9");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/suggest-contacts", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when job_title and job_company are missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/suggest-contacts", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with roleSuggestions/publicLeaders from AI json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      job_title: "SWE",
      job_company: "Acme",
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {
        roleSuggestions: [
          {
            name: "Software Hiring Manager",
            title: "Hiring Manager",
            company: "Acme",
            reason: "Relevant",
            searchQuery: "q",
          },
        ],
        publicLeaders: [
          {
            name: "Ada Lovelace",
            role: "CTO",
            company: "Acme",
            searchQuery: "q",
          },
        ],
      },
      text: null,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/suggest-contacts", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    const payload = (http.sendJson as any).mock.calls[0][2];
    expect(payload.roleSuggestions.length).toBe(1);
    expect(payload.publicLeaders.length).toBe(1);
  });
});
