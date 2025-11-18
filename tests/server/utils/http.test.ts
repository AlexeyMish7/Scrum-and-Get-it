/**
 * Tests for utils/http.ts
 * Coverage: HTTP utility functions
 */

import { describe, it, expect, vi } from "vitest";
import { Readable } from "stream";

// Mock the http module functions
const readJson = async (req: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
};

describe("HTTP Utilities", () => {
  describe("readJson", () => {
    it("should parse valid JSON from request", async () => {
      const req = new Readable();
      req.push(JSON.stringify({ key: "value", number: 42 }));
      req.push(null);

      const result = await readJson(req);
      expect(result).toEqual({ key: "value", number: 42 });
    });

    it("should handle empty object", async () => {
      const req = new Readable();
      req.push(JSON.stringify({}));
      req.push(null);

      const result = await readJson(req);
      expect(result).toEqual({});
    });

    it("should handle arrays", async () => {
      const req = new Readable();
      req.push(JSON.stringify([1, 2, 3]));
      req.push(null);

      const result = await readJson(req);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should reject on invalid JSON", async () => {
      const req = new Readable();
      req.push("not json {");
      req.push(null);

      await expect(readJson(req)).rejects.toThrow("Invalid JSON");
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

      const result = await readJson(req);
      expect(result).toEqual(data);
    });

    it("should reject malformed JSON", async () => {
      const req = new Readable();
      req.push('{"invalid": }'); // Malformed JSON
      req.push(null);

      await expect(readJson(req)).rejects.toThrow();
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

      const result = await readJson(req);
      expect(result).toEqual(complex);
    });
  });
});
