import { describe, it, expect } from "vitest";

import { get, getById } from "@server/routes/artifacts/index";

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

describe("Artifacts Routes", () => {
  it("GET /api/artifacts returns persisted=false when DB not configured", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const url = new URL("/api/artifacts?limit=20", "http://localhost");
    const { res, state } = createMockResponse();

    await get({} as any, res, url, "user-1");

    expect(state.status).toBe(200);
    const body = JSON.parse(state.body);
    expect(body).toEqual({ items: [], persisted: false });

    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });

  it("GET /api/artifacts/:id throws not_found when persistence disabled", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const url = new URL("/api/artifacts/abc", "http://localhost");

    await expect(
      getById({} as any, {} as any, url, "user-1")
    ).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });

    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });
});
