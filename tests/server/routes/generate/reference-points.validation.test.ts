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
  return await import("@server/routes/generate/reference-points");
}

describe("Generate Reference Points Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    http.sendJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 11 });

    const res = { setHeader: vi.fn() } as any;
    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/reference-points", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "11");
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/reference-points", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when skills/job_descriptions/notes are all missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    await expect(
      route.post(
        {} as any,
        {} as any,
        new URL("/api/generate/reference-points", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with guide/talking_points from AI json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      contact_name: "Alex",
      skills: ["TypeScript", { name: "React" }],
      job_descriptions: ["Build web apps"],
      notes: "Please emphasize reliability",
    });

    aiClient.generate.mockResolvedValueOnce({
      json: { guide: "Hi Alex, ...", talking_points: ["One", "Two"] },
      text: null,
      tokens: 10,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/reference-points", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({
        guide: "Hi Alex, ...",
        talking_points: ["One", "Two"],
      })
    );
  });

  it("returns 200 with fallback guide when AI returns empty", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({
      contact_name: "Alex",
      skills: ["TypeScript"],
    });

    aiClient.generate.mockResolvedValueOnce({
      json: {},
      text: null,
      tokens: 10,
    });

    await route.post(
      {} as any,
      {} as any,
      new URL("/api/generate/reference-points", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    const payload = (http.sendJson as any).mock.calls[0][2];
    expect(typeof payload.guide).toBe("string");
    expect(payload.guide.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.talking_points)).toBe(true);
    expect(payload.talking_points.length).toBeGreaterThan(0);
    expect(payload.talking_points.length).toBeLessThanOrEqual(5);
  });
});
