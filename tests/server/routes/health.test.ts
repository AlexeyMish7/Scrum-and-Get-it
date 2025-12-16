import { describe, it, expect } from "vitest";

import { handleHealth } from "@server/routes/health";

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

describe("Health Route", () => {
  it("returns ok payload with counters", async () => {
    const url = new URL("/api/health", "http://localhost");
    const { res, state } = createMockResponse();

    const startedAt = Date.now() - 10_000;
    const counters = {
      requests_total: 10,
      generate_total: 3,
      generate_success: 2,
      generate_fail: 1,
    };

    await handleHealth(url, res, { startedAt, counters });

    expect(state.status).toBe(200);
    expect(state.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(state.body);
    expect(body.status).toBe("ok");
    expect(body.counters).toEqual(counters);
    expect(typeof body.uptime_sec).toBe("number");
  });

  it("reports supabase missing-env when env vars are missing", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const url = new URL("/api/health", "http://localhost");
    const { res, state } = createMockResponse();

    await handleHealth(url, res, {
      startedAt: Date.now() - 1000,
      counters: {
        requests_total: 0,
        generate_total: 0,
        generate_success: 0,
        generate_fail: 0,
      },
    });

    const body = JSON.parse(state.body);
    expect(body.supabase_env).toBe("missing");
    expect(body.supabase).toBe("missing-env");

    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;

    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });
});
