/**
 * Tests for server/utils/http.ts
 * Coverage: HTTP utility functions
 */

import { describe, it, expect, vi } from "vitest";
import { Readable } from "stream";
import type { ServerResponse } from "http";

import { readJson, sendJson } from "@serverUtils/http";

describe("HTTP Utilities", () => {
  describe("readJson", () => {
    it("should parse valid JSON from request", async () => {
      const req = new Readable();
      req.push(JSON.stringify({ key: "value", number: 42 }));
      req.push(null);

      const result = await readJson(req as any);
      expect(result).toEqual({ key: "value", number: 42 });
    });

    it("should handle empty object", async () => {
      const req = new Readable();
      req.push(JSON.stringify({}));
      req.push(null);

      const result = await readJson(req as any);
      expect(result).toEqual({});
    });

    it("should handle arrays", async () => {
      const req = new Readable();
      req.push(JSON.stringify([1, 2, 3]));
      req.push(null);

      const result = await readJson(req as any);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should reject on invalid JSON", async () => {
      const req = new Readable();
      req.push("not json {");
      req.push(null);

      await expect(readJson(req as any)).rejects.toThrow();
    });

    it("should handle multiple data chunks", async () => {
      const req = new Readable();
      const data = { large: "object", with: "multiple", chunks: true };
      const json = JSON.stringify(data);

      // Split into chunks
      req.push(json.slice(0, 10));
      req.push(json.slice(10, 20));
      req.push(json.slice(20));
      req.push(null);

      const result = await readJson(req as any);
      expect(result).toEqual(data);
    });

    it("should reject malformed JSON", async () => {
      const req = new Readable();
      req.push('{"invalid": }'); // Malformed JSON
      req.push(null);

      await expect(readJson(req as any)).rejects.toThrow();
    });

    it("should handle nested objects", async () => {
      const req = new Readable();
      const complex = {
        nested: {
          deeply: {
            value: "test",
          },
        },
        array: [1, 2, { inner: true }],
      };
      req.push(JSON.stringify(complex));
      req.push(null);

      const result = await readJson(req as any);
      expect(result).toEqual(complex);
    });
  });

  describe("sendJson", () => {
    it("writes JSON with content-type and content-length", () => {
      const res: Partial<ServerResponse> & {
        status?: number;
        headers?: Record<string, string>;
        body?: string;
      } = {
        writeHead: vi.fn((status: number, headers: Record<string, string>) => {
          res.status = status;
          res.headers = headers;
        }) as any,
        end: vi.fn((bodyStr?: string) => {
          res.body = bodyStr || "";
        }) as any,
      };

      sendJson(res as ServerResponse, 201, { ok: true });
      expect(res.status).toBe(201);
      expect(res.headers?.["Content-Type"]).toBe("application/json");
      expect(Number(res.headers?.["Content-Length"])).toBeGreaterThan(0);
      expect(JSON.parse(res.body || "{}")).toEqual({ ok: true });
    });
  });
});
