import { describe, it, expect, vi, beforeEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const ai = vi.hoisted(() => ({
  generate: vi.fn(),
}));

const scraper = vi.hoisted(() => ({
  scrapeWithBrowser: vi.fn(),
}));

const supabaseAdmin = vi.hoisted(() => {
  const rpc = vi.fn();
  const supabase = { rpc };
  return {
    default: supabase,
    __rpc: rpc,
    __supabase: supabase,
  };
});

// Always provide a safe default for rpc. We avoid mockReset() races because
// fetchCompanyResearch triggers a non-blocking save that can run into the next
// test's beforeEach.
supabaseAdmin.__rpc.mockResolvedValue({ data: null, error: null });

vi.mock("@server/services/aiClient.js", () => ({
  // companyResearchService imports the named export
  generate: ai.generate,
  // other modules sometimes import default
  default: { generate: ai.generate },
}));

vi.mock("@server/services/scraper.js", () => ({
  scrapeWithBrowser: scraper.scrapeWithBrowser,
}));

vi.mock("@server/services/supabaseAdmin.js", () => ({
  default: supabaseAdmin.default,
}));

let cachedService: any | null = null;
async function getService() {
  if (!cachedService) {
    cachedService = await import("@server/services/companyResearchService.js");
  }
  return cachedService;
}

function nextTick(): Promise<void> {
  // Use a timer tick instead of setImmediate so we reliably progress
  // promise continuations + timers under both Vitest runners.
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(
  predicate: () => boolean,
  { maxTicks = 200 }: { maxTicks?: number } = {}
): Promise<void> {
  for (let i = 0; i < maxTicks; i++) {
    if (predicate()) return;
    await nextTick();
  }
  throw new Error("Timed out waiting for condition");
}

describe("companyResearchService - extractCompanyName", () => {
  it("extracts from job title '... at Company'", async () => {
    const svc = await getService();
    expect(svc.extractCompanyName("Software Engineer at Google")).toBe(
      "Google"
    );
    expect(svc.extractCompanyName("SWE at OpenAI - Remote")).toBe("OpenAI");
  });

  it("extracts from description 'About Company'", async () => {
    const svc = await getService();
    const description = "About Acme Corp:\nWe build rockets.";
    expect(svc.extractCompanyName(undefined, description)).toBe("Acme Corp");
  });

  it("extracts from description 'Company is ...'", async () => {
    const svc = await getService();
    const description = "Nimbus Labs is a fast-growing startup.";
    expect(svc.extractCompanyName(undefined, description)).toBe("Nimbus Labs");
  });

  it("returns null when no patterns match", async () => {
    const svc = await getService();
    expect(svc.extractCompanyName("Software Engineer", "Great team!")).toBe(
      null
    );
  });
});

describe("companyResearchService - fetchCompanyResearch", () => {
  beforeEach(() => {
    ai.generate.mockReset();
    scraper.scrapeWithBrowser.mockReset();

    // Keep the default implementation intact to avoid transient undefined
    // returns while a previous test's non-blocking save is still finishing.
    supabaseAdmin.__rpc.mockClear();
  });

  it("returns null for blank company name", async () => {
    const svc = await getService();
    const result = await svc.fetchCompanyResearch("   ");
    expect(result).toBe(null);
    expect(supabaseAdmin.__rpc).not.toHaveBeenCalled();
  });

  it("returns cached company research when DB cache hit", async () => {
    const svc = await getService();

    supabaseAdmin.__rpc.mockResolvedValueOnce({
      data: {
        companyName: "Acme",
        industry: "Technology",
        size: "51-200",
        location: "San Francisco, CA",
        founded: 2020,
        website: "https://acme.example",
        description: "Acme builds things",
        companyData: {
          mission: "Build great software",
          culture: {
            type: "startup",
            remotePolicy: "remote-first",
            values: ["Innovation"],
            perks: ["Flexible hours"],
          },
          leadership: [{ name: "Jane", title: "CEO" }],
          products: ["Acme Cloud"],
        },
        news: [],
        cacheHit: true,
      },
      error: null,
    });

    const result = await svc.fetchCompanyResearch("Acme");

    expect(result?.companyName).toBe("Acme");
    expect(result?.source).toBe("cached");
    expect(ai.generate).not.toHaveBeenCalled();
    expect(scraper.scrapeWithBrowser).not.toHaveBeenCalled();

    expect(supabaseAdmin.__rpc).toHaveBeenCalledWith("get_company_research", {
      p_company_name: "Acme",
    });
  });

  it("regenerates via AI when cache expired and saves with normalized size", async () => {
    const svc = await getService();

    const callsBefore = supabaseAdmin.__rpc.mock.calls.length;

    // DB has persistent data but cache is expired
    supabaseAdmin.__rpc
      .mockResolvedValueOnce({
        data: {
          companyName: "Acme",
          cacheHit: false,
          industry: "Technology",
          size: "51-200",
          location: null,
          founded: null,
          website: null,
          description: null,
          companyData: null,
          news: [],
        },
        error: null,
      })
      // upsert_company_info returns company id
      .mockResolvedValueOnce({ data: 123, error: null })
      // save_company_research succeeds
      .mockResolvedValueOnce({ data: null, error: null });

    scraper.scrapeWithBrowser.mockResolvedValueOnce({
      content: "<html><body>Acme website</body></html>",
    });

    ai.generate.mockResolvedValueOnce({
      text: JSON.stringify({
        companyName: "Acme",
        industry: null,
        size: "1000+",
        location: null,
        founded: null,
        website: null,
        mission: null,
        description: null,
        news: [],
        culture: {
          type: "corporate",
          remotePolicy: null,
          values: [],
          perks: [],
        },
        leadership: [],
        products: [],
      }),
    });

    const result = await svc.fetchCompanyResearch("Acme", "Technology", "Job");

    expect(result?.companyName).toBe("Acme");
    expect(result?.source).toBe("api");
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(ai.generate.mock.calls[0]?.[0]).toBe("company-research");

    // saveCompanyToDatabase is intentionally non-blocking; wait until the
    // expected writes occur so they don't leak into subsequent tests.
    await waitFor(() => {
      const newCalls = supabaseAdmin.__rpc.mock.calls.slice(callsBefore);
      return newCalls.some((c: any[]) => c[0] === "upsert_company_info");
    });
    await waitFor(() => {
      const newCalls = supabaseAdmin.__rpc.mock.calls.slice(callsBefore);
      return newCalls.some((c: any[]) => c[0] === "save_company_research");
    });

    const rpcCalls = supabaseAdmin.__rpc.mock.calls.slice(callsBefore);
    const upsertCall = rpcCalls.find(
      (c: any[]) => c[0] === "upsert_company_info"
    );
    expect(upsertCall?.[1]?.p_company_name).toBe("Acme");
    expect(upsertCall?.[1]?.p_size).toBe("10000+");
  });

  it("returns null when AI responds NOT_FOUND", async () => {
    const svc = await getService();

    const callsBefore = supabaseAdmin.__rpc.mock.calls.length;

    // DB miss
    supabaseAdmin.__rpc.mockResolvedValueOnce({ data: null, error: null });

    scraper.scrapeWithBrowser.mockResolvedValueOnce({ content: "" });
    ai.generate.mockResolvedValueOnce({ text: "NOT_FOUND" });

    const result = await svc.fetchCompanyResearch("NoSuchCo");
    expect(result).toBe(null);

    // Give any pending async work a moment, then ensure we did not attempt to
    // write company info/cache for a NOT_FOUND response.
    await nextTick();
    await nextTick();
    await nextTick();
    const rpcNames = supabaseAdmin.__rpc.mock.calls
      .slice(callsBefore)
      .map((c: any[]) => c[0]);
    expect(rpcNames).not.toContain("upsert_company_info");
    expect(rpcNames).not.toContain("save_company_research");
  });

  it("returns null when AI response cannot be parsed as JSON", async () => {
    const svc = await getService();

    // DB miss
    supabaseAdmin.__rpc.mockResolvedValueOnce({ data: null, error: null });

    scraper.scrapeWithBrowser.mockRejectedValueOnce(new Error("boom"));
    ai.generate.mockResolvedValueOnce({ text: "not json at all" });

    const result = await svc.fetchCompanyResearch("Acme");
    expect(result).toBe(null);
  });
});
