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
      for (const [k, v] of Object.entries(headers))
        state.headers[k] = String(v);
    },
    end: (data?: string) => {
      state.body = data || "";
    },
  };

  return { res: res as any, state };
}

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/salary/research");
}

describe("Salary Research Route", () => {
  beforeEach(() => {
    http.readJson.mockReset();
  });

  it("returns 400 when title is missing", async () => {
    const route = await importFreshRoute();

    http.readJson.mockResolvedValueOnce({});

    const counters = { generate_success: 0, generate_fail: 0 } as any;
    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/salary-research", "http://localhost"),
      "req-1",
      "user-1",
      counters
    );

    expect(state.status).toBe(400);
    expect(JSON.parse(state.body)).toEqual(
      expect.objectContaining({ error: "Job title is required" })
    );
    expect(counters.generate_fail).toBe(1);
  });

  it("returns 201 with artifact content object", async () => {
    const route = await importFreshRoute();

    http.readJson.mockResolvedValueOnce({ title: "Software Engineer" });

    const counters = { generate_success: 0, generate_fail: 0 } as any;
    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/salary-research", "http://localhost"),
      "req-1",
      "user-1",
      counters
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(body).toEqual(
      expect.objectContaining({
        artifact: {
          content: expect.any(Object),
        },
      })
    );

    expect(counters.generate_success).toBe(1);
  });
});
