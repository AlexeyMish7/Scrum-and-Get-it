/**
 * Test setup file for server tests
 * Runs before all tests to configure environment
 */

import { beforeAll, afterAll, vi } from "vitest";

// Important: Some server modules read process.env at import time.
// These assignments must happen immediately (not inside beforeAll)
// so importing server code from tests doesn't throw.
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error"; // Reduce noise in tests
process.env.FAKE_AI = "true"; // Use mock AI for tests
process.env.ALLOW_DEV_AUTH = "true"; // Allow dev auth for testing
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.AI_API_KEY = "test-api-key";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Tokens used by monitoring endpoints in server/src/server.ts
process.env.METRICS_TOKEN = process.env.METRICS_TOKEN || "test-metrics-token";
process.env.MONITORING_TEST_TOKEN =
  process.env.MONITORING_TEST_TOKEN || "test-monitoring-token";

beforeAll(() => {
  // Reserved for future test-wide setup.
});

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks();
});
