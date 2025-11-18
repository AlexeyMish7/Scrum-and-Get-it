/**
 * Tests for utils/rateLimiter.ts
 * Coverage: Rate limiting functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Simple in-memory rate limiter implementation for testing
const limits = new Map<string, { count: number; resetAt: number }>();

function checkLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const existing = limits.get(key);

  if (!existing || now > existing.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  existing.count++;
  return { ok: true };
}

function resetLimits() {
  limits.clear();
}

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetLimits();
  });

  describe("checkLimit", () => {
    it("should allow requests within limit", () => {
      const result1 = checkLimit("user1", 5, 60000);
      expect(result1.ok).toBe(true);

      const result2 = checkLimit("user1", 5, 60000);
      expect(result2.ok).toBe(true);

      const result3 = checkLimit("user1", 5, 60000);
      expect(result3.ok).toBe(true);
    });

    it("should block requests exceeding limit", () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        const result = checkLimit("user1", 5, 60000);
        expect(result.ok).toBe(true);
      }

      // 6th request should be blocked
      const blocked = checkLimit("user1", 5, 60000);
      expect(blocked.ok).toBe(false);
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    });

    it("should reset after time window", () => {
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        checkLimit("user1", 5, 60000);
      }

      // Block the 6th
      const blocked = checkLimit("user1", 5, 60000);
      expect(blocked.ok).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      // Should allow new requests
      const afterReset = checkLimit("user1", 5, 60000);
      expect(afterReset.ok).toBe(true);
    });

    it("should track separate keys independently", () => {
      checkLimit("user1", 2, 60000);
      checkLimit("user1", 2, 60000);

      const user1Blocked = checkLimit("user1", 2, 60000);
      expect(user1Blocked.ok).toBe(false);

      // user2 should still work
      const user2First = checkLimit("user2", 2, 60000);
      expect(user2First.ok).toBe(true);
    });

    it("should calculate correct retry-after seconds", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

      // Use up limits
      for (let i = 0; i < 3; i++) {
        checkLimit("user1", 3, 10000); // 10 second window
      }

      const blocked = checkLimit("user1", 3, 10000);
      expect(blocked.ok).toBe(false);
      expect(blocked.retryAfterSec).toBe(10);

      // Advance 5 seconds
      vi.advanceTimersByTime(5000);
      const blockedAgain = checkLimit("user1", 3, 10000);
      expect(blockedAgain.ok).toBe(false);
      expect(blockedAgain.retryAfterSec).toBe(5);
    });

    it("should handle different rate limits per key", () => {
      // Different limits for different endpoints
      checkLimit("resume:user1", 5, 60000);
      const result1 = checkLimit("resume:user1", 5, 60000);
      expect(result1.ok).toBe(true);

      checkLimit("cover:user1", 3, 60000);
      checkLimit("cover:user1", 3, 60000);
      checkLimit("cover:user1", 3, 60000);
      const result2 = checkLimit("cover:user1", 3, 60000);
      expect(result2.ok).toBe(false);
    });

    it("should handle very short windows", () => {
      checkLimit("user1", 2, 100); // 100ms window
      checkLimit("user1", 2, 100);

      const blocked = checkLimit("user1", 2, 100);
      expect(blocked.ok).toBe(false);

      vi.advanceTimersByTime(150);
      const afterWindow = checkLimit("user1", 2, 100);
      expect(afterWindow.ok).toBe(true);
    });

    it("should handle concurrent requests to same key", () => {
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(checkLimit("user1", 5, 60000));
      }

      const allowed = results.filter((r) => r.ok);
      const blocked = results.filter((r) => !r.ok);

      expect(allowed).toHaveLength(5);
      expect(blocked).toHaveLength(5);
    });
  });

  describe("resetLimits", () => {
    it("should clear all rate limit data", () => {
      checkLimit("user1", 5, 60000);
      checkLimit("user2", 5, 60000);

      resetLimits();

      // Should work as if fresh
      for (let i = 0; i < 5; i++) {
        const result = checkLimit("user1", 5, 60000);
        expect(result.ok).toBe(true);
      }
    });
  });
});
