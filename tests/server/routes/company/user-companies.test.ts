import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
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
  return await import("@server/routes/company/user-companies");
}

describe("User Companies Route", () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    // Make supabaseAdmin export null on import.
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });

  it("returns 503 when database is not configured", async () => {
    const route = await importFreshRoute();

    const { res, state } = createMockResponse();

    await route.get(
      {} as any,
      res,
      new URL("/api/company/user-companies", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(state.status).toBe(503);
    const body = JSON.parse(state.body);
    expect(body.error).toBe("Database not configured");
  });
});
