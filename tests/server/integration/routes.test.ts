/**
 * Integration tests for server routes
 *
 * These tests start the real HTTP server via createServer() and
 * exercise request routing end-to-end over an ephemeral port.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  httpRequest,
  startTestServer,
  type TestServer,
} from "../helpers/httpTestClient";

let testServer: TestServer;

describe("Server Routes Integration", () => {
  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer.close();
  });

  describe("Health Check", () => {
    it("responds to GET /api/health", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "GET",
        path: "/api/health",
      });

      expect(res.status).toBe(200);
      expect(res.json).toBeTruthy();

      const body = res.json as any;
      expect(body.status).toBe("ok");
      expect(body.mock_mode).toBe(true);
      expect(body.supabase_env).toBe("present");
      expect(typeof body.uptime_sec).toBe("number");
    });
  });

  describe("CORS Preflight", () => {
    it("handles OPTIONS requests", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "OPTIONS",
        path: "/api/generate/resume",
        headers: {
          Origin: process.env.CORS_ORIGIN || "http://localhost:5173",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(res.status).toBe(204);
      expect(String(res.headers["access-control-allow-origin"] || "")).toBe(
        process.env.CORS_ORIGIN
      );
      expect(
        String(res.headers["access-control-allow-methods"] || "")
      ).toContain("POST");
    });
  });

  describe("Authentication", () => {
    it("rejects protected routes without auth", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "POST",
        path: "/api/generate/resume",
        body: { jobId: 1 },
      });

      expect(res.status).toBe(401);
      expect(res.json).toEqual(
        expect.objectContaining({ error: "auth_failed" })
      );
    });
  });

  describe("Error Handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "GET",
        path: "/api/unknown",
      });

      expect(res.status).toBe(404);
      expect(res.json).toEqual({ error: "Not Found", path: "/api/unknown" });
    });
  });

  describe("Monitoring Endpoints", () => {
    it("rejects /api/metrics without correct token", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "GET",
        path: "/api/metrics",
        headers: {
          Authorization: "Bearer wrong",
        },
      });

      expect(res.status).toBe(401);
      expect(res.json).toEqual({ error: "unauthorized" });
    });

    it("serves /api/metrics with correct token", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "GET",
        path: "/api/metrics?window=60",
        headers: {
          Authorization: `Bearer ${process.env.METRICS_TOKEN}`,
          "Accept-Encoding": "gzip",
        },
      });

      expect(res.status).toBe(200);
      const body = res.json as any;
      expect(body.status).toBe("ok");
      expect(typeof body.uptime_sec).toBe("number");
    });

    it("emits intentional monitoring error with correct token", async () => {
      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "POST",
        path: "/api/monitoring/test-error",
        headers: {
          Authorization: `Bearer ${process.env.MONITORING_TEST_TOKEN}`,
        },
      });

      expect(res.status).toBe(500);
      expect(res.json).toEqual(
        expect.objectContaining({
          error: "monitoring_test_error",
          message: "Intentional error emitted for monitoring verification",
          sentry_enabled: expect.any(Boolean),
          sentry_environment: expect.any(String),
        })
      );

      // In test/CI we often don't set a real DSN; metadata can be null.
      expect(
        Object.prototype.hasOwnProperty.call(res.json, "sentry_dsn_host")
      ).toBe(true);
      expect(
        res.json.sentry_dsn_host === null ||
          typeof res.json.sentry_dsn_host === "string"
      ).toBe(true);

      expect(
        Object.prototype.hasOwnProperty.call(res.json, "sentry_project_id")
      ).toBe(true);
      expect(
        res.json.sentry_project_id === null ||
          typeof res.json.sentry_project_id === "string"
      ).toBe(true);
    });
  });

  describe("Feature Flags", () => {
    it("returns 503 when FEATURE_AI_ROUTES is disabled", async () => {
      const prev = process.env.FEATURE_AI_ROUTES;
      process.env.FEATURE_AI_ROUTES = "false";

      const res = await httpRequest({
        baseUrl: testServer.baseUrl,
        method: "POST",
        path: "/api/generate/resume",
        headers: {
          "X-User-Id": "test-user",
        },
        body: { jobId: 1 },
      });

      expect(res.status).toBe(503);
      expect(res.json).toEqual(
        expect.objectContaining({ feature: "FEATURE_AI_ROUTES" })
      );

      if (prev === undefined) delete process.env.FEATURE_AI_ROUTES;
      else process.env.FEATURE_AI_ROUTES = prev;
    });
  });
});
