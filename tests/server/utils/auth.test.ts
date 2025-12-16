/**
 * Tests for server/utils/auth.ts
 * Coverage: verifyAuthToken() input validation (hermetic).
 */

import { describe, it, expect } from "vitest";

import { verifyAuthToken } from "@serverUtils/auth";

describe("Auth Utils", () => {
  it("throws on missing Authorization header", async () => {
    await expect(verifyAuthToken(undefined)).rejects.toThrow(
      "Missing Authorization header"
    );
  });

  it("throws on non-Bearer Authorization", async () => {
    await expect(verifyAuthToken("Basic abc")).rejects.toThrow(
      "Authorization header must start with 'Bearer '"
    );
  });

  it("throws on empty Bearer token", async () => {
    await expect(verifyAuthToken("Bearer ")).rejects.toThrow(
      "Empty token in Authorization header"
    );
  });
});
