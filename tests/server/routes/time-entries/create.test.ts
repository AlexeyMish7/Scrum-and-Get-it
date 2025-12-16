import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

it("registers test suite (smoke)", () => {
  expect(true).toBe(true);
});

const http = vi.hoisted(() => ({
  readJson: vi.fn(),
  sendJson: vi.fn(),
}));

vi.mock("@utils/http.js", () => http);

async function importFreshHandler() {
  vi.resetModules();
  return await import("@server/routes/time-entries/create");
}

describe("Time Entries Create Route", () => {
  beforeEach(() => {
    http.readJson.mockReset();
    http.sendJson.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when activity_type is missing", async () => {
    const mod = await importFreshHandler();

    http.readJson.mockResolvedValueOnce({ duration_minutes: 10 });

    await mod.handleCreateTimeEntry(
      { headers: { "x-user-id": "user-1" } } as any,
      {} as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      400,
      expect.objectContaining({ success: false })
    );
  });

  it("returns 400 when duration_minutes < 1", async () => {
    const mod = await importFreshHandler();

    // Use a truthy value so we don't trip the earlier "required" check.
    http.readJson.mockResolvedValueOnce({
      activity_type: "applications",
      duration_minutes: -1,
    });

    await mod.handleCreateTimeEntry(
      { headers: { "x-user-id": "user-1" } } as any,
      {} as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      400,
      expect.objectContaining({
        error: "duration_minutes must be greater than 0",
      })
    );
  });

  it("returns 201 when insert succeeds", async () => {
    const mod = await importFreshHandler();

    // Supabase client uses fetch under the hood; stub it so tests remain hermetic.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        // PostgREST returns an object payload when the client asks for `.single()`.
        return new Response(
          JSON.stringify({ id: "t1", created_at: "2025-01-01" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );

    http.readJson.mockResolvedValueOnce({
      activity_type: "applications",
      duration_minutes: 10,
    });

    await mod.handleCreateTimeEntry(
      { headers: { "x-user-id": "user-1" } } as any,
      {} as any
    );

    expect(http.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      201,
      expect.objectContaining({
        success: true,
        data: { id: "t1", created_at: "2025-01-01" },
      })
    );
  });
});
