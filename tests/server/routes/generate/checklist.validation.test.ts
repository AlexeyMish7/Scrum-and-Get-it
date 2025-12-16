import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
}));

vi.mock("@utils/http.js", () => http);

function createMockResponse() {
  const state: {
    status?: number;
    headers: Record<string, string>;
    body: string;
  } = {
    headers: {},
    body: "",
  };

  const res = {
    writeHead: (status: number, headers: Record<string, string>) => {
      state.status = status;
      state.headers = { ...headers };
    },
    end: (data?: string) => {
      state.body = data || "";
    },
  };

  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/generate/checklist");
}

describe("Generate Checklist Route - validation", () => {
  beforeEach(() => {
    http.readJson.mockReset();
  });

  it("throws 401 auth_required when userId is missing", async () => {
    const route = await importFreshRoute();

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/checklist", "http://localhost"),
        "req-1",
        ""
      )
    ).rejects.toMatchObject({ status: 401, code: "auth_required" });
  });

  it("throws 400 bad_json when body is invalid JSON", async () => {
    const route = await importFreshRoute();

    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/checklist", "http://localhost"),
        "req-1",
        "user-1"
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("throws 400 bad_request when jobTitle and company are missing", async () => {
    const route = await importFreshRoute();

    http.readJson.mockResolvedValueOnce({});

    const { res } = createMockResponse();

    await expect(
      route.post(
        {} as any,
        res,
        new URL("/api/generate/checklist", "http://localhost"),
        "req-1",
        "user-1"
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("returns 201 with items", async () => {
    const route = await importFreshRoute();

    http.readJson.mockResolvedValueOnce({
      jobTitle: "Software Engineer",
      company: "Acme",
    });

    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/generate/checklist", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });
});
