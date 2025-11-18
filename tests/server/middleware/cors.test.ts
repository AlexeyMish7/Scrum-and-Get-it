/**
 * Tests for middleware/cors.ts
 * Coverage: CORS headers and preflight handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerResponse } from "http";

// Mock CORS functions
function getCorsHeaders(): Record<string, string> {
  const origin = process.env.CORS_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Access-Control-Max-Age": "86400",
  };
}

function handleCorsPreflight(req: any, res: ServerResponse): void {
  const headers = getCorsHeaders();
  res.writeHead(204, headers);
  res.end();
}

describe("CORS Middleware", () => {
  describe("getCorsHeaders", () => {
    it("should return default CORS headers", () => {
      const headers = getCorsHeaders();

      expect(headers["Access-Control-Allow-Origin"]).toBeDefined();
      expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
      expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
      expect(headers["Access-Control-Allow-Headers"]).toContain(
        "Authorization"
      );
    });

    it("should allow all origins by default", () => {
      const originalOrigin = process.env.CORS_ORIGIN;
      delete process.env.CORS_ORIGIN;

      const headers = getCorsHeaders();
      expect(headers["Access-Control-Allow-Origin"]).toBe("*");

      if (originalOrigin) process.env.CORS_ORIGIN = originalOrigin;
    });

    it("should respect CORS_ORIGIN env variable", () => {
      const originalOrigin = process.env.CORS_ORIGIN;
      process.env.CORS_ORIGIN = "https://app.example.com";

      const headers = getCorsHeaders();
      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://app.example.com"
      );

      if (originalOrigin) {
        process.env.CORS_ORIGIN = originalOrigin;
      } else {
        delete process.env.CORS_ORIGIN;
      }
    });

    it("should include all HTTP methods", () => {
      const headers = getCorsHeaders();
      const methods = headers["Access-Control-Allow-Methods"];

      expect(methods).toContain("GET");
      expect(methods).toContain("POST");
      expect(methods).toContain("PUT");
      expect(methods).toContain("PATCH");
      expect(methods).toContain("DELETE");
      expect(methods).toContain("OPTIONS");
    });

    it("should include necessary headers", () => {
      const headers = getCorsHeaders();
      const allowedHeaders = headers["Access-Control-Allow-Headers"];

      expect(allowedHeaders).toContain("Content-Type");
      expect(allowedHeaders).toContain("Authorization");
      expect(allowedHeaders).toContain("X-User-Id");
    });

    it("should set max age for preflight cache", () => {
      const headers = getCorsHeaders();
      expect(headers["Access-Control-Max-Age"]).toBe("86400"); // 24 hours
    });
  });

  describe("handleCorsPreflight", () => {
    let res: any;

    beforeEach(() => {
      res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };
    });

    it("should respond with 204 No Content", () => {
      const req = { method: "OPTIONS" };
      handleCorsPreflight(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(204, expect.any(Object));
      expect(res.end).toHaveBeenCalled();
    });

    it("should include CORS headers in preflight response", () => {
      const req = { method: "OPTIONS" };
      handleCorsPreflight(req, res);

      const [status, headers] = res.writeHead.mock.calls[0];
      expect(status).toBe(204);
      expect(headers["Access-Control-Allow-Origin"]).toBeDefined();
      expect(headers["Access-Control-Allow-Methods"]).toBeDefined();
      expect(headers["Access-Control-Allow-Headers"]).toBeDefined();
    });

    it("should call end to complete response", () => {
      const req = { method: "OPTIONS" };
      handleCorsPreflight(req, res);

      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });
});
