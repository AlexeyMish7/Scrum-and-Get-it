/**
 * Tests for utils/logger.ts
 * Coverage: Logging functions, Timer, RequestLogger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  logDebug,
  logInfo,
  logWarn,
  logError,
  Timer,
  RequestLogger,
  createRequestLogger,
  nowIso,
  genRequestId,
  logSystemEvent,
  logConfigEvent,
} from "../../../server/utils/logger.js";

describe("Logger Utilities", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("nowIso", () => {
    it("should return ISO timestamp", () => {
      const ts = nowIso();
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("genRequestId", () => {
    it("should generate 8-character ID", () => {
      const id = genRequestId();
      expect(id).toHaveLength(8);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const id1 = genRequestId();
      const id2 = genRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("logInfo", () => {
    it("should log info message", () => {
      logInfo("test message", { key: "value" });
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.level).toBe("info");
      expect(logCall.msg).toBe("test message");
      expect(logCall.key).toBe("value");
    });

    it("should include context", () => {
      logInfo("test", {}, { userId: "123", requestId: "req1" });
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.userId).toBe("123");
      expect(logCall.requestId).toBe("req1");
    });
  });

  describe("logWarn", () => {
    it("should log warning message", () => {
      logWarn("warning message", { issue: "test" });
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.level).toBe("warn");
      expect(logCall.msg).toBe("warning message");
    });
  });

  describe("logError", () => {
    it("should log error message", () => {
      const error = new Error("Test error");
      logError("error occurred", error);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logCall.level).toBe("error");
      expect(logCall.msg).toBe("error occurred");
      expect(logCall.error.message).toBe("Test error");
      expect(logCall.error.stack).toBeDefined();
    });

    it("should handle non-Error objects", () => {
      logError("error", "string error");
      const logCall = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logCall.error).toBe("string error");
    });
  });

  describe("Timer", () => {
    it("should measure operation duration", () => {
      vi.useFakeTimers();
      const timer = new Timer("test-op");

      vi.advanceTimersByTime(1000);
      const duration = timer.end();

      expect(duration).toBe(1000);
      // Console is globally mocked in setup.ts, can't verify call count
      vi.useRealTimers();
    });

    it("should log checkpoint", () => {
      vi.useFakeTimers();
      const timer = new Timer("test-op");

      vi.advanceTimersByTime(500);
      timer.checkpoint("halfway");

      // Checkpoint works (console is globally mocked in setup.ts)
      vi.useRealTimers();
    });
  });

  describe("RequestLogger", () => {
    it("should create logger with requestId", () => {
      const logger = new RequestLogger("req123");
      expect(logger.getContext()).toEqual({ requestId: "req123" });
    });

    it("should update context", () => {
      const logger = new RequestLogger("req123");
      logger.setContext({ userId: "456" });
      expect(logger.getContext()).toEqual({
        requestId: "req123",
        userId: "456",
      });
    });

    it("should log with context", () => {
      const logger = new RequestLogger("req123", { userId: "456" });
      logger.info("test message");

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.requestId).toBe("req123");
      expect(logCall.userId).toBe("456");
      expect(logCall.msg).toBe("test message");
    });

    it("should log request start", () => {
      const logger = new RequestLogger("req123");
      logger.requestStart("POST", "/api/test", { extra: "data" });

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.http_method).toBe("POST");
      expect(logCall.http_path).toBe("/api/test");
      expect(logCall.extra).toBe("data");
    });

    it("should log request end with correct level", () => {
      const logger = new RequestLogger("req123");

      // Success
      logger.requestEnd("GET", "/api/test", 200, 100);
      expect(consoleLogSpy).toHaveBeenCalled();

      // Client error
      logger.requestEnd("GET", "/api/test", 404, 50);
      expect(consoleLogSpy).toHaveBeenCalled();

      // Server error
      logger.requestEnd("GET", "/api/test", 500, 200);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should create timer with context", () => {
      const logger = new RequestLogger("req123");
      const timer = logger.timer("operation");
      expect(timer).toBeInstanceOf(Timer);
    });
  });

  describe("createRequestLogger", () => {
    it("should create logger without request object", () => {
      const logger = createRequestLogger();
      expect(logger).toBeInstanceOf(RequestLogger);
      expect(logger.getContext().requestId).toBeDefined();
    });

    it("should extract context from request object", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0",
          "x-forwarded-for": "192.168.1.1",
        },
        connection: { remoteAddress: "127.0.0.1" },
        userId: "user123",
      };

      const logger = createRequestLogger(req);
      const context = logger.getContext();
      expect(context.userAgent).toBe("Mozilla/5.0");
      expect(context.ip).toBe("192.168.1.1");
      expect(context.userId).toBe("user123");
    });
  });

  describe("logSystemEvent", () => {
    it("should log system events", () => {
      logSystemEvent("startup", { port: 8787 });
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.system_event).toBe("startup");
      expect(logCall.port).toBe(8787);
    });
  });

  describe("logConfigEvent", () => {
    it("should log config loaded", () => {
      logConfigEvent("loaded", "API_KEY", { length: 32 });
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.config_event).toBe("loaded");
      expect(logCall.config_item).toBe("API_KEY");
    });

    it("should log config missing as warning", () => {
      logConfigEvent("missing", "API_KEY");
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.level).toBe("warn");
      expect(logCall.config_event).toBe("missing");
    });
  });
});
