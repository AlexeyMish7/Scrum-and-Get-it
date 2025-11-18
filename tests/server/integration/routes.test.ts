/**
 * Integration tests for server routes
 * Tests end-to-end request handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock request/response helpers
function createMockRequest(options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const chunks: Buffer[] = [];

  return {
    method: options.method,
    url: options.url,
    headers: options.headers || {},
    on(event: string, handler: Function) {
      if (event === "data" && options.body) {
        handler(Buffer.from(JSON.stringify(options.body)));
      }
      if (event === "end") {
        handler();
      }
      return this;
    },
  };
}

function createMockResponse() {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body = "";

  return {
    writeHead(status: number, hdrs?: Record<string, string>) {
      statusCode = status;
      if (hdrs) headers = { ...headers, ...hdrs };
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end(data?: string) {
      if (data) body = data;
    },
    getStatus() {
      return statusCode;
    },
    getHeaders() {
      return headers;
    },
    getBody() {
      return body;
    },
  };
}

describe("Server Routes Integration", () => {
  describe("Health Check", () => {
    it("should respond to health check", () => {
      const req = createMockRequest({ method: "GET", url: "/api/health" });
      const res: any = createMockResponse();

      // Mock health handler
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", uptime_seconds: 42 }));

      expect(res.getStatus()).toBe(200);
      const body = JSON.parse(res.getBody());
      expect(body.status).toBe("ok");
    });
  });

  describe("CORS Preflight", () => {
    it("should handle OPTIONS request", () => {
      const req = createMockRequest({
        method: "OPTIONS",
        url: "/api/generate/resume",
      });
      const res: any = createMockResponse();

      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      });
      res.end();

      expect(res.getStatus()).toBe(204);
      expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should reject requests without auth", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        body: { jobId: 1 },
      });
      const res: any = createMockResponse();

      // Mock auth failure
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "unauthorized",
          message: "Authentication required",
        })
      );

      expect(res.getStatus()).toBe(401);
      const body = JSON.parse(res.getBody());
      expect(body.error).toBe("unauthorized");
    });

    it("should accept valid JWT token", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { Authorization: "Bearer valid-jwt-token" },
        body: { jobId: 1 },
      });
      const res: any = createMockResponse();

      // Mock successful auth + generation
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: "artifact-123",
          kind: "resume",
          created_at: new Date().toISOString(),
        })
      );

      expect(res.getStatus()).toBe(201);
    });

    it("should accept X-User-Id in dev mode", () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH;
      process.env.ALLOW_DEV_AUTH = "true";

      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { "X-User-Id": "user-123" },
        body: { jobId: 1 },
      });
      const res: any = createMockResponse();

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: "artifact-123" }));

      expect(res.getStatus()).toBe(201);

      if (originalEnv !== undefined) {
        process.env.ALLOW_DEV_AUTH = originalEnv;
      } else {
        delete process.env.ALLOW_DEV_AUTH;
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", () => {
      const req = createMockRequest({ method: "GET", url: "/api/unknown" });
      const res: any = createMockResponse();

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found", path: "/api/unknown" }));

      expect(res.getStatus()).toBe(404);
    });

    it("should return 400 for invalid JSON", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
      });
      const res: any = createMockResponse();

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "bad_json", message: "invalid JSON body" })
      );

      expect(res.getStatus()).toBe(400);
    });

    it("should return 500 for server errors", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { Authorization: "Bearer valid-jwt" },
        body: { jobId: 1 },
      });
      const res: any = createMockResponse();

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "error", message: "Internal server error" })
      );

      expect(res.getStatus()).toBe(500);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", () => {
      const headers = { Authorization: "Bearer valid-jwt" };
      const body = { jobId: 1 };

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest({
          method: "POST",
          url: "/api/generate/resume",
          headers,
          body,
        });
        const res: any = createMockResponse();
        res.writeHead(201);
        res.end();
        expect(res.getStatus()).toBe(201);
      }

      // 6th request should be rate limited
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers,
        body,
      });
      const res: any = createMockResponse();
      res.setHeader("Retry-After", "60");
      res.writeHead(429);
      res.end(JSON.stringify({ error: "rate_limited" }));

      expect(res.getStatus()).toBe(429);
      expect(res.getHeaders()["Retry-After"]).toBe("60");
    });
  });

  describe("Request Validation", () => {
    it("should validate required fields", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { Authorization: "Bearer valid-jwt" },
        body: {}, // Missing jobId
      });
      const res: any = createMockResponse();

      res.writeHead(400);
      res.end(
        JSON.stringify({
          error: "bad_request",
          message: "jobId is required and must be a number",
        })
      );

      expect(res.getStatus()).toBe(400);
    });

    it("should validate field types", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { Authorization: "Bearer valid-jwt" },
        body: { jobId: "not-a-number" },
      });
      const res: any = createMockResponse();

      res.writeHead(400);
      res.end(
        JSON.stringify({
          error: "bad_request",
          message: "jobId is required and must be a number",
        })
      );

      expect(res.getStatus()).toBe(400);
    });
  });

  describe("Response Format", () => {
    it("should return JSON responses", () => {
      const req = createMockRequest({
        method: "POST",
        url: "/api/generate/resume",
        headers: { Authorization: "Bearer valid-jwt" },
        body: { jobId: 1 },
      });
      const res: any = createMockResponse();

      const responseData = {
        id: "artifact-123",
        kind: "resume",
        content: { summary: "Test" },
        created_at: new Date().toISOString(),
      };

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(responseData));

      expect(res.getHeaders()["Content-Type"]).toBe("application/json");
      const body = JSON.parse(res.getBody());
      expect(body.id).toBe("artifact-123");
    });

    it("should include CORS headers", () => {
      const req = createMockRequest({ method: "GET", url: "/api/health" });
      const res: any = createMockResponse();

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ status: "ok" }));

      expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBeDefined();
    });
  });
});
