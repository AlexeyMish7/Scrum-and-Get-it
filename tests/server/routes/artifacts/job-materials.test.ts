import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
}));

vi.mock("@utils/http.js", async () => {
  const actual = await vi.importActual<any>("@utils/http.js");
  return { ...actual, readJson: http.readJson };
});

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
  return await import("@server/routes/artifacts/job-materials");
}

describe("Job Materials Routes", () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    http.readJson.mockReset();

    // Force the non-persistence branches.
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });

  it("post() returns 201 with persisted=false when Supabase is not configured", async () => {
    const route = await importFreshRoute();

    http.readJson.mockResolvedValueOnce({
      jobId: 123,
      resumeDocumentId: "doc-1",
      metadata: { source: "test" },
    });

    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/job-materials", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(state.status).toBe(201);
    const body = JSON.parse(state.body);
    expect(body.persisted).toBe(false);
    expect(body.row.job_id).toBe(123);
    expect(body.row.user_id).toBe("user-1");
  });

  it("getByJob() returns 200 empty items when Supabase is not configured", async () => {
    const route = await importFreshRoute();

    const { res, state } = createMockResponse();

    await route.getByJob(
      {} as any,
      res,
      new URL("/api/jobs/123/materials", "http://localhost"),
      "user-1"
    );

    expect(state.status).toBe(200);
    const body = JSON.parse(state.body);
    expect(body.persisted).toBe(false);
    expect(body.items).toEqual([]);
  });
});
