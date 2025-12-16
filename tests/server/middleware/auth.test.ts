/**
 * Tests for server/src/middleware/auth.ts
 * Coverage: ApiError mapping + dev auth fallback path.
 */

import { describe, it, expect, vi } from "vitest";

import { requireAuth, tryAuth } from "@server/middleware/auth";

describe("Auth Middleware", () => {
  describe("requireAuth", () => {
    it("throws ApiError(401) on missing auth", async () => {
      const req = { headers: {} } as any;
      await expect(requireAuth(req)).rejects.toMatchObject({
        status: 401,
        code: "auth_failed",
      });
    });

    it("accepts X-User-Id when dev auth enabled", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const prev = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "true";

      const req = {
        headers: {
          "x-user-id": "dev-user-456",
        },
      } as any;

      await expect(requireAuth(req)).resolves.toBe("dev-user-456");

      if (prev === undefined) delete process.env.ALLOW_DEV_AUTH;
      else process.env.ALLOW_DEV_AUTH = prev;

      warnSpy.mockRestore();
    });
  });

  describe("tryAuth", () => {
    it("should return null on failure instead of throwing", async () => {
      const req = { headers: {} } as any;
      const userId = await tryAuth(req);
      expect(userId).toBeNull();
    });
  });
});
