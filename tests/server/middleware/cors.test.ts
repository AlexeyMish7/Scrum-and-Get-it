/**
 * Tests for server/src/middleware/cors.ts
 * Coverage: CORS headers and preflight handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ServerResponse } from "http";

import { getCorsHeaders, handleCorsPreflight } from "@server/middleware/cors";

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

    it("should respect explicit origin option", () => {
      const headers = getCorsHeaders({ origin: "https://app.example.com" });
      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://app.example.com"
      );
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
      const handled = handleCorsPreflight(req as any, res as ServerResponse);

      expect(handled).toBe(true);
      expect(res.writeHead).toHaveBeenCalledWith(204, expect.any(Object));
      expect(res.end).toHaveBeenCalled();
    });

    it("should include CORS headers in preflight response", () => {
      const req = { method: "OPTIONS" };
      handleCorsPreflight(req as any, res as ServerResponse);

      const [status, headers] = res.writeHead.mock.calls[0];
      expect(status).toBe(204);
      expect(headers["Access-Control-Allow-Origin"]).toBeDefined();
      expect(headers["Access-Control-Allow-Methods"]).toBeDefined();
      expect(headers["Access-Control-Allow-Headers"]).toBeDefined();
      expect(headers["Access-Control-Max-Age"]).toBe("86400");
    });

    it("should call end to complete response", () => {
      const req = { method: "OPTIONS" };
      handleCorsPreflight(req as any, res as ServerResponse);

      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it("should return false for non-OPTIONS", () => {
      const req = { method: "GET" };
      const handled = handleCorsPreflight(req as any, res as ServerResponse);
      expect(handled).toBe(false);
      expect(res.writeHead).not.toHaveBeenCalled();
    });
  });
});
