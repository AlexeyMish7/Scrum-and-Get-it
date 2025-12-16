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
  return await import("@server/routes/generate/relationship");
}

describe("Generate Relationship Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited when over limit", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 5 });

    await expect(
      route.post(
        {} as any,
        { setHeader: vi.fn() } as any,
        new URL("/api/generate/relationship", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });
  });

  it("throws 400 bad_json when body parse fails", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/relationship", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when required fields are missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/relationship", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with relationshipSuggestions from AI json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      name: "Jane Doe",
      company: "Acme",
      industry: "Software",
      personal_notes: "loves coffee",
      professional_notes: "recently promoted",
      relationship_strength: 50,
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {
        suggestions: [
          {
            message: "Hi Jane — would love to catch up.",
            tone: "warm",
            rationale: "Friendly reconnect",
          },
        ],
      },
      text: null,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/relationship", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    const payload = (http.sendJson as any).mock.calls[0][2];
    expect(payload.suggestions.length).toBe(1);
  });
});
