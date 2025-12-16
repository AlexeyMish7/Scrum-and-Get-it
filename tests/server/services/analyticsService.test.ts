import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

type SupabaseThenableResponse = { data?: any; error?: any };

type ResponsesByTable = Record<string, SupabaseThenableResponse[]>;

function createThenableQuery(
  responseQueue: SupabaseThenableResponse[],
  callLog: Array<{ method: string; args: any[] }>
) {
  const query: any = {
    select: vi.fn((...args: any[]) => {
      callLog.push({ method: "select", args });
      return query;
    }),
    eq: vi.fn((...args: any[]) => {
      callLog.push({ method: "eq", args });
      return query;
    }),
    in: vi.fn((...args: any[]) => {
      callLog.push({ method: "in", args });
      return query;
    }),
    order: vi.fn((...args: any[]) => {
      callLog.push({ method: "order", args });
      return query;
    }),
    then: (onFulfilled: any, onRejected: any) => {
      const next = responseQueue.shift() ?? { data: null, error: null };
      return Promise.resolve(next).then(onFulfilled, onRejected);
    },
  };

  return query;
}

function createSupabaseStub(responsesByTable: ResponsesByTable) {
  const calls: Array<{
    table: string;
    chain: Array<{ method: string; args: any[] }>;
  }> = [];

  const client = {
    from: vi.fn((table: string) => {
      const chain: Array<{ method: string; args: any[] }> = [];
      calls.push({ table, chain });
      const queue = (responsesByTable[table] ||= []);
      return createThenableQuery(queue, chain);
    }),
  };

  return { client, calls };
}

const supabaseState = vi.hoisted(() => ({
  client: null as any,
}));

vi.mock("@server/services/supabaseAdmin.js", () => ({
  // Expose a live binding so tests can flip between "no db" and "db" paths
  get default() {
    return supabaseState.client;
  },
}));

let cachedSvc: any | null = null;
async function getAnalyticsService() {
  if (!cachedSvc) {
    cachedSvc = await import("@server/services/analyticsService.js");
  }
  return cachedSvc;
}

describe("analyticsService - in-memory fallback", () => {
  beforeEach(() => {
    supabaseState.client = null;
  });

  it("computeOverview uses seeded in-memory data", async () => {
    const svc = await getAnalyticsService();

    svc.seedInMemory("u1", {
      interview: {
        id: "i1",
        result: true,
        format: "phone",
        interview_type: "mock",
        score: 0.2,
        interview_date: "2025-01-15",
      },
      feedbacks: [
        {
          interview_id: "i1",
          provider: "mock-coach",
          themes: ["communication", "coding"],
        },
        {
          interview_id: "i1",
          provider: "mock-coach",
          themes: ["coding"],
        },
      ],
    });

    svc.seedInMemory("u1", {
      interview: {
        id: "i2",
        result: false,
        format: "onsite",
        interview_type: "real",
        score: 0.6,
        interview_date: "2025-02-01",
      },
    });

    const result = await svc.computeOverview("u1");

    expect(result.interviewsCount).toBe(2);
    expect(result.offersCount).toBe(1);
    expect(result.conversionRate).toBe(0.5);

    // mock vs real computed from interview scores
    expect(result.mockVsReal.mockAverage).toBe(0.2);
    expect(result.mockVsReal.realAverage).toBe(0.6);
    expect(result.mockVsReal.improvement).toBeCloseTo(0.4);

    // feedback themes aggregated
    const themeMap = new Map(
      result.feedbackThemes.map((t: any) => [t.theme, t.count])
    );
    expect(themeMap.get("coding")).toBe(2);
    expect(themeMap.get("communication")).toBe(1);

    const formats = result.formatBreakdown.map((f: any) => f.format);
    expect(formats).toEqual(expect.arrayContaining(["phone", "onsite"]));
  });

  it("computeTrends returns monthly conversion + confidence timeseries", async () => {
    const svc = await getAnalyticsService();

    const userId = "u2";

    const interviews = [
      {
        id: "i1",
        interview_date: "2025-01-10",
        result: true,
        industry: "Tech",
      },
      {
        id: "i2",
        interview_date: "2025-01-20",
        result: false,
        industry: "Tech",
      },
      {
        id: "i3",
        interview_date: "2025-02-05",
        result: false,
        industry: "Design",
      },
    ];
    interviews.forEach((interview) => svc.seedInMemory(userId, { interview }));

    svc.seedInMemory(userId, {
      confidenceLogs: [
        { logged_at: "2025-01-01", confidence_level: 5 },
        { logged_at: "2025-01-15", confidence_level: 7 },
        { logged_at: "2025-02-10", confidence_level: 6 },
      ],
    });

    const result = await svc.computeTrends(userId);

    expect(result.conversionTimeseries.length).toBe(2);
    expect(result.conversionTimeseries[0]).toEqual({
      date: "2025-01-01",
      conversion: 0.5,
    });

    expect(result.confidenceTimeseries.length).toBe(2);
    expect(result.confidenceTimeseries[0].date).toBe("2025-01-01");
    // (5/10 + 7/10)/2 = 0.6
    expect(result.confidenceTimeseries[0].confidence).toBeCloseTo(0.6);

    expect(result.industryComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ industry: "Tech" }),
        expect.objectContaining({ industry: "Design" }),
      ])
    );
  });
});

describe("analyticsService - Supabase path", () => {
  it("computeOverview combines interviews + job pipeline and aggregates themes", async () => {
    const responsesByTable: ResponsesByTable = {
      interviews: [
        {
          data: [
            {
              id: "i1",
              result: true,
              format: "phone",
              interview_type: "mock",
              industry: "tech",
              score: 0.4,
              interview_date: "2025-01-15",
            },
            {
              id: "i2",
              result: false,
              format: "onsite",
              interview_type: "real",
              industry: "tech",
              score: 0.8,
              interview_date: "2025-02-01",
            },
          ],
          error: null,
        },
      ],
      jobs: [
        {
          data: [
            {
              id: 10,
              job_status: "Offer",
              industry: "tech",
              created_at: "2025-02-02",
            },
            {
              id: 11,
              job_status: "Interview",
              industry: "design",
              created_at: "2025-01-05",
            },
          ],
          error: null,
        },
      ],
      interview_feedback: [
        // themes
        {
          data: [
            { themes: ["coding", "communication"] },
            { themes: ["coding"] },
          ],
          error: null,
        },
        // providers
        {
          data: [{ interview_id: "i1", provider: "mock-coach", rating: 3 }],
          error: null,
        },
      ],
    };

    const { client, calls } = createSupabaseStub(responsesByTable);
    supabaseState.client = client;

    const svc = await getAnalyticsService();
    const result = await svc.computeOverview("u1");

    // 2 interview rows + 2 job-based rows
    expect(result.interviewsCount).toBe(4);
    // interview offer (i1) + job offer (job-10)
    expect(result.offersCount).toBe(2);
    expect(result.conversionRate).toBe(0.5);

    // should include job-pipeline format bucket
    expect(result.formatBreakdown.map((f: any) => f.format)).toEqual(
      expect.arrayContaining(["phone", "onsite", "job-pipeline"])
    );

    // theme counts
    const themeMap = new Map(
      result.feedbackThemes.map((t: any) => [t.theme, t.count])
    );
    expect(themeMap.get("coding")).toBe(2);

    // scoring uses ONLY interview table records
    expect(result.mockVsReal.mockAverage).toBe(0.4);
    expect(result.mockVsReal.realAverage).toBe(0.8);
    expect(result.mockVsReal.improvement).toBeCloseTo(0.4);

    // Sanity: touched expected tables
    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining(["interviews", "jobs", "interview_feedback"])
    );
  });

  it("computeTrends returns conversion + confidence + culture comparison", async () => {
    const responsesByTable: ResponsesByTable = {
      interviews: [
        {
          data: [
            {
              interview_date: "2025-01-10",
              result: true,
              industry: "Tech",
              company_culture: "startup",
            },
            {
              interview_date: "2025-01-20",
              result: false,
              industry: "Tech",
              company_culture: "corporate",
            },
          ],
          error: null,
        },
      ],
      jobs: [
        {
          data: [
            {
              created_at: "2025-02-05",
              job_status: "Interview",
              industry: "Design",
            },
            {
              created_at: "2025-02-25",
              job_status: "Offer",
              industry: "Design",
            },
          ],
          error: null,
        },
      ],
      confidence_logs: [
        {
          data: [
            { logged_at: "2025-01-01", confidence_level: 5 },
            { logged_at: "2025-01-15", confidence_level: 7 },
            { logged_at: "2025-02-01", confidence_level: 6 },
          ],
          error: null,
        },
      ],
    };

    const { client } = createSupabaseStub(responsesByTable);
    supabaseState.client = client;

    const svc = await getAnalyticsService();
    const result = await svc.computeTrends("u1");

    expect(result.conversionTimeseries).toEqual([
      { date: "2025-01-01", conversion: 0.5 },
      { date: "2025-02-01", conversion: 0.5 },
    ]);

    // industryComparison is normalized + filters "unknown"
    expect(result.industryComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ industry: "tech" }),
        expect.objectContaining({ industry: "design" }),
      ])
    );

    expect(result.cultureComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ culture: "startup" }),
        expect.objectContaining({ culture: "corporate" }),
      ])
    );
  });

  it("throws when interviews query errors", async () => {
    const responsesByTable: ResponsesByTable = {
      interviews: [{ data: null, error: new Error("db down") }],
    };

    const { client } = createSupabaseStub(responsesByTable);
    supabaseState.client = client;

    const svc = await getAnalyticsService();
    await expect(svc.computeOverview("u1")).rejects.toThrow();
  });
});

describe("analyticsService - computeBenchmarks", () => {
  it("returns static benchmark payload", async () => {
    supabaseState.client = null;
    const svc = await getAnalyticsService();
    const result = await svc.computeBenchmarks();
    expect(result.benchmarks.length).toBeGreaterThan(0);
  });
});
