import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  return await import("@server/routes/analytics/salary");
}

describe("Salary Analytics Route", () => {
  beforeEach(() => {
    http.readJson.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 200 with analytics payload when query succeeds", async () => {
    const route = await importFreshRoute();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const body = JSON.stringify([
          {
            offered_salary: 100000,
            negotiated_salary: 110000,
            offer_received_date: "2025-01-01",
            negotiation_outcome: "accepted",
            total_compensation_breakdown: { total: 140000 },
            jobs: {
              job_title: "SWE",
              company_name: "Acme",
              job_status: "offer",
              industry: "Tech",
              experience_level: "mid",
              city_name: "Boston",
              state_code: "MA",
            },
          },
        ]);

        return new Response(body, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    http.readJson.mockResolvedValueOnce({ timeRange: "all" });
    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/analytics/salary", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(state.status).toBe(200);
    const body = JSON.parse(state.body);
    expect(body).toEqual(
      expect.objectContaining({
        salaryProgression: expect.any(Object),
        negotiationSuccess: expect.any(Object),
        compensationEvolution: expect.any(Object),
        careerImpact: expect.any(Object),
        insights: expect.any(Array),
        recommendations: expect.any(Array),
      })
    );
  });

  it("returns 500 when Supabase query errors", async () => {
    const route = await importFreshRoute();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ message: "db down" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    http.readJson.mockResolvedValueOnce({ timeRange: "30d" });
    const { res, state } = createMockResponse();

    await route.post(
      {} as any,
      res,
      new URL("/api/analytics/salary", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(state.status).toBe(500);
    expect(JSON.parse(state.body)).toEqual(
      expect.objectContaining({ error: "Failed to fetch salary data" })
    );
  });

  it("applies gte() filter when timeRange is 30d/90d/1y", async () => {
    const route = await importFreshRoute();

    const fetchSpy = vi.fn(async (input: any) => {
      // Return a minimal successful response; we only care about the URL in the request.
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy as any);

    http.readJson.mockResolvedValueOnce({ timeRange: "90d" });

    const { res } = createMockResponse();
    await route.post(
      {} as any,
      res,
      new URL("/api/analytics/salary", "http://localhost"),
      "req-1",
      "user-1"
    );

    // Supabase uses the PostgREST filter format in query params.
    const calledUrl = String(fetchSpy.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("offer_received_date=gte.");
  });
});
