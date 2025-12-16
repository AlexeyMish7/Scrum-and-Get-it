import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const rateLimiter = vi.hoisted(() => ({
  checkLimit: vi.fn(),
}));

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
}));

const aiClient = vi.hoisted(() => ({
  generate: vi.fn(),
}));

vi.mock("@utils/rateLimiter.js", () => rateLimiter);
vi.mock("@utils/http.js", async () => {
  const actual = await vi.importActual<any>("@utils/http.js");
  return { ...actual, readJson: http.readJson };
});
vi.mock("@server/services/aiClient.js", () => aiClient);

function createMockResponse() {
  const state: {
    status?: number;
    headers: Record<string, string>;
    body: string;
  } = { headers: {}, body: "" };

  const res = {
    setHeader: (name: string, value: string) => {
      state.headers[name] = value;
    },
    writeHead: (status: number, headers: Record<string, string>) => {
      state.status = status;
      state.headers = { ...state.headers, ...headers };
    },
    end: (data?: string) => {
      state.body = data || "";
    },
  };

  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/event-contacts");
}

describe("Generate Event Contacts Route - validation", () => {
  beforeEach(() => {
    rateLimiter.checkLimit.mockReset();
    http.readJson.mockReset();
    aiClient.generate.mockReset();
  });

  it("throws 429 rate_limited and sets Retry-After", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: false, retryAfterSec: 3 });

    const { res, state } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/event-contacts", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 429, code: "rate_limited" });

    expect(state.headers["Retry-After"]).toBe("3");
  });

  it("throws 400 bad_request when event_name and url are missing", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({});

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/event-contacts", "http://localhost"),
        "req-1",
        "user-1",
        { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 200 with suggestions when AI returns json", async () => {
    const route = await importFreshRoute();

    rateLimiter.checkLimit.mockReturnValue({ ok: true });
    http.readJson.mockResolvedValueOnce({ event_name: "FlowConf" });
    aiClient.generate.mockResolvedValueOnce({
      json: {
        suggestions: [
          {
            name: "John Doe",
            title: "Keynote Speaker",
            org: "Acme",
            reason: "Relevant",
            referenceUrl: "https://example.com/speaker",
            searchQuery: "John Doe FlowConf",
          },
        ],
      },
      text: null,
    });

    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/generate/event-contacts", "http://localhost"),
      "req-1",
      "user-1",
      { generate_total: 0, generate_success: 0, generate_fail: 0 } as any
    );

    expect(state.status).toBe(200);
    const body = JSON.parse(state.body);
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBe(1);
    expect(body.suggestions[0].name).toBe("John Doe");
  });
});
