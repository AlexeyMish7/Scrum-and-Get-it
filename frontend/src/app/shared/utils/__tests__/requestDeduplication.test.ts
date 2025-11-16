/**
 * REQUEST DEDUPLICATION TESTS
 * Test suite for request deduplication middleware.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  deduplicateRequest,
  invalidatePendingRequests,
  clearAllPendingRequests,
  getPendingRequestCount,
  getPendingRequestKeys,
} from "../requestDeduplication";

describe("requestDeduplication", () => {
  beforeEach(() => {
    // Clear all pending requests before each test
    clearAllPendingRequests();
  });

  describe("deduplicateRequest", () => {
    it("should execute fetcher and return result for first call", async () => {
      const mockData = { id: 1, name: "Test" };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const result = await deduplicateRequest("test-key", fetcher);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it("should return same promise for duplicate concurrent requests", async () => {
      let resolveCount = 0;
      const fetcher = vi.fn().mockImplementation(async () => {
        resolveCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { count: resolveCount };
      });

      // Fire 3 concurrent requests with same key
      const [result1, result2, result3] = await Promise.all([
        deduplicateRequest("duplicate-key", fetcher),
        deduplicateRequest("duplicate-key", fetcher),
        deduplicateRequest("duplicate-key", fetcher),
      ]);

      // Fetcher should only be called once
      expect(fetcher).toHaveBeenCalledTimes(1);
      // All results should be the same
      expect(result1).toEqual({ count: 1 });
      expect(result2).toEqual({ count: 1 });
      expect(result3).toEqual({ count: 1 });
    });

    it("should allow new request after previous one completes", async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ call: 1 });
      const fetcher2 = vi.fn().mockResolvedValue({ call: 2 });

      const result1 = await deduplicateRequest("sequential-key", fetcher1);
      const result2 = await deduplicateRequest("sequential-key", fetcher2);

      expect(fetcher1).toHaveBeenCalledTimes(1);
      expect(fetcher2).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ call: 1 });
      expect(result2).toEqual({ call: 2 });
    });

    it("should handle different keys independently", async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ key: "a" });
      const fetcher2 = vi.fn().mockResolvedValue({ key: "b" });

      const [result1, result2] = await Promise.all([
        deduplicateRequest("key-a", fetcher1),
        deduplicateRequest("key-b", fetcher2),
      ]);

      expect(fetcher1).toHaveBeenCalledTimes(1);
      expect(fetcher2).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ key: "a" });
      expect(result2).toEqual({ key: "b" });
    });

    it("should propagate errors from fetcher", async () => {
      const error = new Error("Fetch failed");
      const fetcher = vi.fn().mockRejectedValue(error);

      await expect(deduplicateRequest("error-key", fetcher)).rejects.toThrow(
        "Fetch failed"
      );

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should allow retry after error", async () => {
      const error = new Error("First attempt failed");
      const fetcher1 = vi.fn().mockRejectedValue(error);
      const fetcher2 = vi.fn().mockResolvedValue({ success: true });

      // First attempt fails
      await expect(
        deduplicateRequest("retry-key", fetcher1)
      ).rejects.toThrow("First attempt failed");

      // Second attempt succeeds
      const result = await deduplicateRequest("retry-key", fetcher2);

      expect(fetcher1).toHaveBeenCalledTimes(1);
      expect(fetcher2).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    it("should clean up after request completes", async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: "test" });

      expect(getPendingRequestCount()).toBe(0);

      const promise = deduplicateRequest("cleanup-key", fetcher);
      expect(getPendingRequestCount()).toBe(1);

      await promise;
      expect(getPendingRequestCount()).toBe(0);
    });

    it("should clean up after request fails", async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error("Failed"));

      expect(getPendingRequestCount()).toBe(0);

      const promise = deduplicateRequest("error-cleanup-key", fetcher);
      expect(getPendingRequestCount()).toBe(1);

      await promise.catch(() => {
        /* ignore error */
      });
      expect(getPendingRequestCount()).toBe(0);
    });
  });

  describe("invalidatePendingRequests", () => {
    it("should invalidate requests matching pattern", () => {
      // Create several pending requests (don't await)
      const fetcher = vi
        .fn()
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      deduplicateRequest("jobs-list-user1", fetcher);
      deduplicateRequest("jobs-list-user2", fetcher);
      deduplicateRequest("profile-user1", fetcher);

      expect(getPendingRequestCount()).toBe(3);

      // Invalidate all jobs-list requests
      const invalidated = invalidatePendingRequests(/^jobs-list/);

      expect(invalidated).toBe(2);
      expect(getPendingRequestCount()).toBe(1);
      expect(getPendingRequestKeys()).toEqual(["profile-user1"]);
    });

    it("should return 0 when no requests match pattern", () => {
      const fetcher = vi
        .fn()
        .mockImplementation(() => new Promise(() => {}));

      deduplicateRequest("test-key-1", fetcher);

      const invalidated = invalidatePendingRequests(/non-matching/);

      expect(invalidated).toBe(0);
      expect(getPendingRequestCount()).toBe(1);
    });

    it("should handle empty pending requests", () => {
      expect(getPendingRequestCount()).toBe(0);

      const invalidated = invalidatePendingRequests(/any-pattern/);

      expect(invalidated).toBe(0);
    });
  });

  describe("clearAllPendingRequests", () => {
    it("should clear all pending requests", () => {
      const fetcher = vi
        .fn()
        .mockImplementation(() => new Promise(() => {}));

      deduplicateRequest("key1", fetcher);
      deduplicateRequest("key2", fetcher);
      deduplicateRequest("key3", fetcher);

      expect(getPendingRequestCount()).toBe(3);

      clearAllPendingRequests();

      expect(getPendingRequestCount()).toBe(0);
      expect(getPendingRequestKeys()).toEqual([]);
    });

    it("should handle clearing when no requests pending", () => {
      expect(getPendingRequestCount()).toBe(0);

      clearAllPendingRequests();

      expect(getPendingRequestCount()).toBe(0);
    });
  });

  describe("getPendingRequestCount", () => {
    it("should return correct count of pending requests", () => {
      const fetcher = vi
        .fn()
        .mockImplementation(() => new Promise(() => {}));

      expect(getPendingRequestCount()).toBe(0);

      deduplicateRequest("key1", fetcher);
      expect(getPendingRequestCount()).toBe(1);

      deduplicateRequest("key2", fetcher);
      expect(getPendingRequestCount()).toBe(2);

      deduplicateRequest("key3", fetcher);
      expect(getPendingRequestCount()).toBe(3);
    });
  });

  describe("getPendingRequestKeys", () => {
    it("should return all pending request keys", () => {
      const fetcher = vi
        .fn()
        .mockImplementation(() => new Promise(() => {}));

      expect(getPendingRequestKeys()).toEqual([]);

      deduplicateRequest("alpha", fetcher);
      deduplicateRequest("beta", fetcher);
      deduplicateRequest("gamma", fetcher);

      const keys = getPendingRequestKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("alpha");
      expect(keys).toContain("beta");
      expect(keys).toContain("gamma");
    });

    it("should return empty array when no requests pending", () => {
      expect(getPendingRequestKeys()).toEqual([]);
    });
  });
});
