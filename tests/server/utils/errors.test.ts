/**
 * Tests for utils/errors.ts
 * Coverage: ApiError class and errorPayload function
 */

import { describe, it, expect } from "vitest";
import { ApiError, errorPayload } from "../../../server/utils/errors.js";

describe("ApiError", () => {
  it("should create ApiError with status and message", () => {
    const error = new ApiError(404, "Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.code).toBeUndefined();
  });

  it("should create ApiError with optional code", () => {
    const error = new ApiError(400, "Bad request", "bad_request");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.code).toBe("bad_request");
  });

  it("should have correct name property", () => {
    const error = new ApiError(500, "Internal error");
    expect(error.name).toBe("Error");
  });
});

describe("errorPayload", () => {
  it("should format ApiError correctly", () => {
    const error = new ApiError(401, "Unauthorized", "auth_failed");
    const payload = errorPayload(error);
    expect(payload).toEqual({
      error: "auth_failed",
      message: "Unauthorized",
    });
  });

  it("should handle ApiError without code", () => {
    const error = new ApiError(500, "Server error");
    const payload = errorPayload(error);
    expect(payload).toEqual({
      error: "error",
      message: "Server error",
    });
  });

  it("should handle regular Error", () => {
    const error = new Error("Something went wrong");
    const payload = errorPayload(error);
    expect(payload).toEqual({
      error: "error",
      message: "Something went wrong",
    });
  });

  it("should handle string error", () => {
    const payload = errorPayload("String error");
    expect(payload).toEqual({
      error: "error",
      message: "String error",
    });
  });

  it("should handle null/undefined error", () => {
    const payload1 = errorPayload(null);
    expect(payload1).toEqual({
      error: "error",
      message: "null",
    });

    const payload2 = errorPayload(undefined);
    expect(payload2).toEqual({
      error: "error",
      message: "undefined",
    });
  });

  it("should handle object without message", () => {
    const payload = errorPayload({ code: 123 });
    expect(payload).toEqual({
      error: "error",
      message: "[object Object]",
    });
  });
});
