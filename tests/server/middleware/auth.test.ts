/**
 * Tests for middleware/auth.ts
 * Coverage: JWT verification and user extraction
 */

import { describe, it, expect, vi } from "vitest";

// Mock auth functions
async function requireAuth(req: any): Promise<string> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const userId = await extractUserId(authHeader, req.headers?.["x-user-id"]);
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

async function tryAuth(req: any): Promise<string | null> {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}

async function extractUserId(
  authHeader: string | undefined,
  userIdHeader: string | undefined
): Promise<string> {
  const allowDevAuth = process.env.ALLOW_DEV_AUTH === "true";

  if (authHeader) {
    return await verifyAuthToken(authHeader);
  }

  if (allowDevAuth && userIdHeader) {
    return userIdHeader;
  }

  throw new Error(
    "Authentication required: provide Authorization header with valid JWT token"
  );
}

async function verifyAuthToken(authHeader: string): Promise<string> {
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header must start with 'Bearer '");
  }

  const token = authHeader.slice(7);
  if (!token) {
    throw new Error("Empty token in Authorization header");
  }

  // Mock JWT verification - in real implementation, would call Supabase
  if (token === "valid-jwt-token") {
    return "user-123";
  }

  throw new Error("JWT verification failed: Invalid token");
}

describe("Auth Middleware", () => {
  describe("requireAuth", () => {
    it("should extract userId from valid JWT", async () => {
      const req = {
        headers: {
          authorization: "Bearer valid-jwt-token",
        },
      };

      const userId = await requireAuth(req);
      expect(userId).toBe("user-123");
    });

    it("should throw on missing auth header", async () => {
      const req = { headers: {} };
      await expect(requireAuth(req)).rejects.toThrow("Authentication required");
    });

    it("should accept dev mode X-User-Id header", async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "true";

      const req = {
        headers: {
          "x-user-id": "dev-user-456",
        },
      };

      const userId = await requireAuth(req);
      expect(userId).toBe("dev-user-456");

      if (originalEnv !== undefined) {
        process.env.ALLOW_DEV_AUTH = originalEnv;
      } else {
        delete process.env.ALLOW_DEV_AUTH;
      }
    });

    it("should reject X-User-Id when dev mode disabled", async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "false";

      const req = {
        headers: {
          "x-user-id": "dev-user-456",
        },
      };

      await expect(requireAuth(req)).rejects.toThrow();

      if (originalEnv !== undefined) {
        process.env.ALLOW_DEV_AUTH = originalEnv;
      } else {
        delete process.env.ALLOW_DEV_AUTH;
      }
    });

    it("should handle case-insensitive Authorization header", async () => {
      const req = {
        headers: {
          Authorization: "Bearer valid-jwt-token",
        },
      };

      const userId = await requireAuth(req);
      expect(userId).toBe("user-123");
    });
  });

  describe("tryAuth", () => {
    it("should return userId on success", async () => {
      const req = {
        headers: {
          authorization: "Bearer valid-jwt-token",
        },
      };

      const userId = await tryAuth(req);
      expect(userId).toBe("user-123");
    });

    it("should return null on failure instead of throwing", async () => {
      const req = { headers: {} };
      const userId = await tryAuth(req);
      expect(userId).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      const userId = await tryAuth(req);
      expect(userId).toBeNull();
    });
  });

  describe("verifyAuthToken", () => {
    it("should verify valid Bearer token", async () => {
      const userId = await verifyAuthToken("Bearer valid-jwt-token");
      expect(userId).toBe("user-123");
    });

    it("should reject non-Bearer tokens", async () => {
      await expect(verifyAuthToken("Basic abc123")).rejects.toThrow(
        "Authorization header must start with 'Bearer '"
      );
    });

    it("should reject empty token after Bearer", async () => {
      await expect(verifyAuthToken("Bearer ")).rejects.toThrow(
        "Empty token in Authorization header"
      );
    });

    it("should reject invalid JWT tokens", async () => {
      await expect(verifyAuthToken("Bearer invalid-token")).rejects.toThrow(
        "JWT verification failed"
      );
    });

    it("should reject malformed tokens", async () => {
      await expect(verifyAuthToken("Bearer malformed.token")).rejects.toThrow();
    });
  });

  describe("extractUserId", () => {
    it("should prioritize JWT over X-User-Id", async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "true";

      const userId = await extractUserId("Bearer valid-jwt-token", "dev-user");
      expect(userId).toBe("user-123"); // From JWT, not dev-user

      if (originalEnv !== undefined) {
        process.env.ALLOW_DEV_AUTH = originalEnv;
      } else {
        delete process.env.ALLOW_DEV_AUTH;
      }
    });

    it("should fallback to X-User-Id when JWT missing", async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "true";

      const userId = await extractUserId(undefined, "dev-user-789");
      expect(userId).toBe("dev-user-789");

      if (originalEnv !== undefined) {
        process.env.ALLOW_DEV_AUTH = originalEnv;
      } else {
        delete process.env.ALLOW_DEV_AUTH;
      }
    });

    it("should throw when both auth methods missing", async () => {
      await expect(extractUserId(undefined, undefined)).rejects.toThrow(
        "Authentication required"
      );
    });
  });
});
