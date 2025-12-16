import { describe, it, expect, vi, beforeEach } from "vitest";

const http = vi.hoisted(() => ({
  sendJson: vi.fn(),
}));

const service = vi.hoisted(() => ({
  fetchCompanyResearch: vi.fn(),
}));

vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/companyResearchService.js", () => ({
  fetchCompanyResearch: service.fetchCompanyResearch,
}));

async function importFreshRoute() {
  vi.resetModules();
  return await import("@server/routes/company/research");
}

describe("Company Research Route", () => {
  beforeEach(() => {
    http.sendJson.mockReset();
    service.fetchCompanyResearch.mockReset();
  });

  it("returns 400 when name is missing", async () => {
    const route = await importFreshRoute();

    await route.get(
      {} as any,
      {} as any,
      new URL("/api/company/research", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      400,
      expect.objectContaining({ error: "Company name is required" })
    );
  });

  it("returns 200 with data null when research not found", async () => {
    const route = await importFreshRoute();

    service.fetchCompanyResearch.mockResolvedValueOnce(null);

    await route.get(
      {} as any,
      {} as any,
      new URL("/api/company/research?name=Acme", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({ data: null })
    );
  });

  it("calls service with sanitized params and returns 200 with data", async () => {
    const route = await importFreshRoute();

    service.fetchCompanyResearch.mockResolvedValueOnce({
      companyName: "Acme",
      news: [],
      source: "ai",
    });

    const longName = " Acme ".padEnd(300, "x");

    await route.get(
      {} as any,
      {} as any,
      new URL(
        `/api/company/research?name=${encodeURIComponent(
          longName
        )}&industry=Tech&jobDescription=${encodeURIComponent("desc")}`,
        "http://localhost"
      ),
      "req-1",
      "user-1"
    );

    expect(service.fetchCompanyResearch).toHaveBeenCalledWith(
      expect.stringMatching(/^Acme/),
      "Tech",
      "desc",
      "user-1"
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({ data: expect.any(Object) })
    );
  });

  it("returns 500 when service throws", async () => {
    const route = await importFreshRoute();

    service.fetchCompanyResearch.mockRejectedValueOnce(new Error("boom"));

    await route.get(
      {} as any,
      {} as any,
      new URL("/api/company/research?name=Acme", "http://localhost"),
      "req-1",
      "user-1"
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      500,
      expect.objectContaining({
        error: "Failed to fetch company research",
        details: "boom",
      })
    );
  });
});
