/**
 * Test setup file for server tests
 * Runs before all tests to configure environment
 */

import { beforeAll, afterAll, vi } from "vitest";

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "error"; // Reduce noise in tests
  process.env.FAKE_AI = "true"; // Use mock AI for tests
  process.env.ALLOW_DEV_AUTH = "true"; // Allow dev auth for testing
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.AI_API_KEY = "test-api-key";
});

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks();
});

// Suppress console output during tests (optional)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
